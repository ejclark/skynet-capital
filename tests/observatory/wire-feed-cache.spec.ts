import { appendFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import type { ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JsonlActivityEventBus } from "../../src/observatory/activity-bus.js";
import {
  type ActivityEvent,
  type ActivityEventBus,
  activityEventFromFeedbackEntry,
  activityEventFromFeedbackStatus,
  activityEventFromMergedPullRequest,
  activityEventFromTradeRecord,
} from "../../src/observatory/activity-event.js";
import type { ActivityStore, TradeActivityRecord } from "../../src/observatory/activity-record.js";
import { collapseActivity, JsonlActivityStore } from "../../src/observatory/activity-store.js";
import { collapseDevelopmentEvents } from "../../src/observatory/development-event-feed.js";
import {
  collapseFeedbackEvents,
  mergeFeedbackLogIntoEvents,
  mergeFeedbackStatusesIntoEvents,
} from "../../src/observatory/feedback-event-feed.js";
import { InMemoryActivityEventBus } from "../../src/observatory/in-memory-activity-event-bus.js";
import { InMemoryActivityStore } from "../../src/observatory/in-memory-activity-store.js";
import {
  collapseMilestoneEvents,
  deriveMilestoneEvents,
} from "../../src/observatory/milestone-event-feed.js";
import { mergeLedgerIntoEvents } from "../../src/observatory/trade-event-feed.js";
import { buildWireTradeRows } from "../../src/observatory/wire-data.js";
import { type WireFeed, wireFeedReader } from "../../src/observatory/wire-feed-cache.js";
import { type FeedbackLogEntry, JsonlFeedbackLogStore } from "../../src/server/feedback-log.js";
import type { FeedbackStatus } from "../../src/server/feedback-status.js";
import type { ObservatoryHub } from "../../src/server/observatory-hub.js";
import { serveWireJson, type WireRouteDeps } from "../../src/server/wire-routes.js";
import type { JsonlTail } from "../../src/storage/jsonl-store.js";

/**
 * The fold's one promise (#4458): every page it feeds the Wire equals the page the whole files
 * would — on ledgers in the order the real writers leave them, not a tidy time-ordered seed. The
 * fixture reproduces each writer the 2026-10-26 call sheet found on `main`: a newest-first history
 * backfill, late reconcile/sweep appends, partial fills, same-standing twins, and the bus backfill
 * CLI replaying the ledger in file order.
 */

const DAY = 86_400_000;
const T0 = Date.parse("2026-04-01T00:00:00.000Z");
const NOW = "2026-10-26T12:00:00.000Z";
const iso = (ms: number): string => new Date(ms).toISOString();
const PARTICIPANTS = ["sauron", "bot-a", "bot-b", "human-1", "human-2"] as const;
const SYMBOLS = ["NVDA", "AAPL", "SPY", "TSLA", "NVDA261016C00185000", "SPY261120P00500000"];

/** mulberry32 — a fixed seed, so a failure reproduces line for line. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

interface Appended<T> {
  readonly file: string;
  readonly appendAt: number;
  readonly line: T;
}

interface Fixture {
  readonly ledger: Appended<TradeActivityRecord>[];
  readonly bus: Appended<ActivityEvent>[];
  readonly filings: Appended<FeedbackLogEntry>[];
}

/** One order's journal lines, each with the instant a writer appended it. */
function orderLines(
  rand: () => number,
  participantId: string,
  n: number,
  day: number,
): { line: TradeActivityRecord; appendAt: number }[] {
  // One order in ten lands on the hour, so `at` ties across orders exercise the cursor's id half.
  const raw = T0 + day * DAY + Math.floor(rand() * DAY);
  const at = rand() < 0.1 ? Math.floor(raw / 3_600_000) * 3_600_000 : raw;
  const quantity = 1 + Math.floor(rand() * 5);
  const base = {
    orderId: `${participantId}-${n}`,
    participantId,
    symbol: SYMBOLS[Math.floor(rand() * SYMBOLS.length)] as string,
    side: rand() < 0.5 ? ("buy" as const) : ("sell" as const),
    quantity,
    price: Math.round(rand() * 50_000) / 100,
    source: "stream" as const,
  };
  const lines: { line: TradeActivityRecord; appendAt: number }[] = [];
  if (rand() < 0.05) {
    lines.push({
      line: { ...base, filledQuantity: 0, status: "canceled", at: iso(at) },
      appendAt: at,
    });
    return lines;
  }
  if (quantity > 1 && rand() < 0.25) {
    const partialAt = at - 60_000;
    lines.push({
      line: { ...base, filledQuantity: 1, status: "partially_filled", at: iso(partialAt) },
      appendAt: partialAt,
    });
  }
  // One fill in twenty lands 4–44 h late — boot reconcile and the lifecycle sweep.
  const late = rand() < 0.05 ? (4 + rand() * 40) * 3_600_000 : 0;
  const filled = { ...base, filledQuantity: quantity, status: "filled", at: iso(at) };
  lines.push({ line: filled, appendAt: at + late });
  const twin = rand();
  // A broker-window twin: the same id, so the bridge must keep the first copy.
  if (twin < 0.03) lines.push({ line: { ...filled, source: "broker" }, appendAt: at + late + 1 });
  // A same-standing line under a different event type: the later line must win the tie.
  else if (twin < 0.05) {
    lines.push({
      line: { ...filled, status: "done_for_day", source: "backfill" },
      appendAt: at + late + 2,
    });
  }
  return lines;
}

/** One participant's ledger: live lines from day 60, and days 0–59 as the history backfill leaves
 *  them — paged newest-first by `until`, appended in that order on day 90. */
function participantLedger(
  rand: () => number,
  participantId: string,
  orders: number,
  days: number,
): Appended<TradeActivityRecord>[] {
  const live: Appended<TradeActivityRecord>[] = [];
  const history: { line: TradeActivityRecord; appendAt: number }[] = [];
  let n = 0;
  for (let day = 0; day < days; day++) {
    for (let k = 0; k < Math.round(orders * (0.5 + rand())); k++) {
      const lines = orderLines(rand, participantId, n++, day);
      if (day < 60) history.push(...lines);
      else live.push(...lines.map((l) => ({ file: participantId, ...l })));
    }
  }
  history.sort((a, b) => b.line.at.localeCompare(a.line.at));
  const backfillAt = T0 + 90 * DAY;
  return [
    ...live,
    ...history.map((l, i) => ({ file: participantId, line: l.line, appendAt: backfillAt + i })),
  ];
}

/** A bus being written: every publish lands in its actor's file. */
function busWriter() {
  const lines: Appended<ActivityEvent>[] = [];
  const ids = new Set<string>();
  return {
    lines,
    has: (id: string) => ids.has(id),
    publish(event: ActivityEvent, appendAt: number): void {
      lines.push({ file: event.actor.participantId, line: event, appendAt });
      ids.add(event.id);
    },
  };
}

/** The bus mirrors every ledger write from day 120; on day 150 the backfill CLI replays the earlier
 *  ledger in file order, skipping ids the bus already holds. */
function mirrorLedger(
  ledger: readonly Appended<TradeActivityRecord>[],
  bus: ReturnType<typeof busWriter>,
): void {
  const busStart = T0 + 120 * DAY;
  const replayAt = T0 + 150 * DAY;
  const mirrored = (from: number, to: number) =>
    ledger.filter((l) => l.appendAt >= from && l.appendAt < to);
  for (const l of mirrored(busStart, replayAt)) {
    bus.publish(activityEventFromTradeRecord(l.line), l.appendAt);
  }
  for (const l of mirrored(Number.NEGATIVE_INFINITY, busStart)) {
    // The replay never covered human-2, so that history lives on the ledger alone — the leg the
    // bridge exists for, where only the ledger's own tie-break decides a row.
    if (l.file === "human-2") continue;
    const event = activityEventFromTradeRecord(l.line);
    if (!bus.has(event.id)) bus.publish(event, replayAt);
  }
  for (const l of mirrored(replayAt, Number.POSITIVE_INFINITY)) {
    bus.publish(activityEventFromTradeRecord(l.line), l.appendAt);
  }
}

/** Filings: the even ones predate the bus (log only); the odd ones are logged and published. Each
 *  gets three status observations, some of them sharing an instant across filings. */
function feedbackLines(
  rand: () => number,
  days: number,
  bus: ReturnType<typeof busWriter>,
): Appended<FeedbackLogEntry>[] {
  const statuses: FeedbackStatus[] = ["open", "needs-info", "next-slice", "shipped"];
  const filings: Appended<FeedbackLogEntry>[] = [];
  for (let i = 0; i < 40; i++) {
    const filedMs = T0 + Math.floor(rand() * days * DAY);
    const entry: FeedbackLogEntry = {
      uuid: `uuid-${i}`,
      opaqueMemberId: `member-${i % 3}`,
      issueNumber: 100 + i,
      url: `https://example.test/issues/${100 + i}`,
      kind: "idea",
      title: `Filing ${i}`,
      filedAt: iso(filedMs),
    };
    filings.push({ file: entry.opaqueMemberId, line: entry, appendAt: filedMs });
    if (i % 2 === 1) bus.publish(activityEventFromFeedbackEntry(entry), filedMs);
    for (const offset of [DAY, 2 * DAY, 2 * DAY]) {
      const status = statuses[Math.floor(rand() * statuses.length)] ?? "open";
      bus.publish(
        activityEventFromFeedbackStatus(entry.issueNumber, status, iso(filedMs + offset)),
        filedMs + offset,
      );
    }
  }
  return filings;
}

/** Merges (every fifth replayed with a reformatted instant — the later line wins) and re-logged
 *  milestone earns (the earliest wins). */
function otherBusLines(rand: () => number, days: number, bus: ReturnType<typeof busWriter>): void {
  for (let pr = 1; pr <= 25; pr++) {
    const mergedMs = T0 + Math.floor(rand() * days * DAY);
    const info = {
      number: pr,
      title: `PR ${pr}`,
      url: `https://example.test/pull/${pr}`,
      mergedAt: iso(mergedMs),
    };
    bus.publish(activityEventFromMergedPullRequest(info), mergedMs);
    if (pr % 5 === 0) {
      const replay = { ...info, mergedAt: iso(mergedMs + 1000) };
      bus.publish(activityEventFromMergedPullRequest(replay), mergedMs + DAY);
    }
  }
  for (const participantId of PARTICIPANTS) {
    for (const milestoneId of ["first-buy", "first-sell"]) {
      for (const shift of [5, 2, 9]) {
        const at = T0 + shift * DAY + Math.floor(rand() * DAY);
        const identity = `${participantId}:${milestoneId}`;
        bus.publish(
          {
            id: `milestone:${identity}:milestone.earned`,
            eventType: "milestone.earned",
            actor: { participantId },
            target: { kind: "milestone", id: identity },
            at: iso(at),
            correlationId: `milestone:${identity}`,
            source: "ladder-detector",
            outcome: "success",
            visibility: "public",
            payload: { milestoneId, orderId: `${participantId}-0`, evidence: "fill" },
          },
          at,
        );
      }
    }
  }
}

function buildFixture(seed: number, days: number, ordersPerDay: number): Fixture {
  const rand = seeded(seed);
  const byAppend = <T>(rows: Appended<T>[]) => rows.sort((a, b) => a.appendAt - b.appendAt);
  const ledger = byAppend(
    PARTICIPANTS.flatMap((id, index) =>
      participantLedger(rand, id, ordersPerDay * (index === 0 ? 3 : 1), days),
    ),
  );
  const bus = busWriter();
  mirrorLedger(ledger, bus);
  const filings = byAppend(feedbackLines(rand, days, bus));
  otherBusLines(rand, days, bus);
  return { ledger, bus: byAppend(bus.lines), filings };
}

/** Lay `rows` down as JSONL, one file per writer key, in append order — exactly what the stores'
 *  `append` would leave on disk. */
function writeLedger<T>(dir: string, rows: readonly Appended<T>[], mode: "write" | "append"): void {
  mkdirSync(dir, { recursive: true });
  const byFile = new Map<string, string[]>();
  for (const row of rows) {
    const held = byFile.get(row.file) ?? [];
    held.push(JSON.stringify(row.line));
    byFile.set(row.file, held);
  }
  for (const [file, lines] of byFile) {
    const path = join(dir, `${file}.jsonl`);
    const text = `${lines.join("\n")}\n`;
    if (mode === "write") writeFileSync(path, text);
    else appendFileSync(path, text);
  }
}

interface Sources {
  readonly bus: JsonlActivityEventBus;
  readonly activity: JsonlActivityStore;
  readonly feedbackLog: JsonlFeedbackLogStore;
}

/** Today's route inputs: every store's whole `list()`. */
async function coldFeed(sources: {
  readonly bus: Pick<ActivityEventBus, "list">;
  readonly activity: Pick<ActivityStore, "list">;
  readonly feedbackLog: Pick<JsonlFeedbackLogStore, "list">;
}): Promise<WireFeed> {
  const [events, records, filings] = await Promise.all([
    sources.bus.list(),
    sources.activity.list(),
    sources.feedbackLog.list(),
  ]);
  return { events, records, filings };
}

/** Every page the trade feed renders from `feed`, walked by cursor — the route's own pure folds. */
function tradePages(feed: WireFeed, underlying?: string) {
  const events = mergeLedgerIntoEvents(feed.events, feed.records);
  const pages = [];
  let before: string | undefined;
  do {
    const page = buildWireTradeRows(
      events,
      [],
      { limit: 30, ...(before ? { before } : {}) },
      underlying,
    );
    pages.push(page);
    before = page.nextCursor;
  } while (before !== undefined);
  return pages;
}

/** Everything else the Wire derives from the three lists, in the route's own words. */
function otherKinds(feed: WireFeed) {
  const feedback = mergeFeedbackLogIntoEvents(
    feed.events.filter((e) => e.target.kind === "feedback"),
    feed.filings,
  );
  const polled = new Map<number, FeedbackStatus>([
    [101, "shipped"],
    [120, "needs-info"],
  ]);
  const journals = new Map<string, TradeActivityRecord[]>();
  for (const record of feed.records) {
    journals.set(record.participantId, [...(journals.get(record.participantId) ?? []), record]);
  }
  return {
    pulse: collapseFeedbackEvents(feedback),
    polledPulse: collapseFeedbackEvents(mergeFeedbackStatusesIntoEvents(feedback, polled, NOW)),
    development: collapseDevelopmentEvents(
      feed.events.filter((e) => e.target.kind === "development"),
    ),
    milestones: collapseMilestoneEvents([
      ...feed.events.filter((e) => e.target.kind === "milestone"),
      ...deriveMilestoneEvents(feed.records, []),
    ]),
    ledgers: [...journals].map(([id, journal]) => [id, collapseActivity(journal)] as const),
  };
}

/** The whole Wire as a comparable value: every trade page, every symbol page, every other kind. */
function wireOf(feed: WireFeed) {
  const { ledgers, ...kinds } = otherKinds(feed);
  return {
    pages: tradePages(feed),
    symbolPages: ["NVDA", "SPY", "TSLA"].map((symbol) => tradePages(feed, symbol)),
    ...kinds,
    ledgers: new Map(ledgers),
  };
}

/** A `sinceAll` that counts the lines it hands over — the "reads only what was appended" proof. */
function counted<T>(
  sinceAll: (from: ReadonlyMap<string, number>) => Promise<ReadonlyMap<string, JsonlTail<T>>>,
) {
  const read = { lines: 0 };
  return {
    read,
    sinceAll: async (from: ReadonlyMap<string, number>) => {
      const tails = await sinceAll(from);
      for (const tail of tails.values()) read.lines += tail.entries.length;
      return tails;
    },
  };
}

/** Every body `/api/wire` serves for `url`, walked through its own `Link: rel="next"` header. */
async function routeWalk(deps: WireRouteDeps, url: string): Promise<unknown[]> {
  const bodies: unknown[] = [];
  let next: string | undefined = url;
  while (next) {
    const out = { body: "", headers: {} as Record<string, string> };
    const res = {
      writeHead(_status: number, headers: Record<string, string>) {
        out.headers = headers;
      },
      end(body: string) {
        out.body = body;
      },
    } as unknown as ServerResponse;
    await serveWireJson(res, next, deps, true);
    bodies.push(JSON.parse(out.body));
    next = /<([^>]+)>; rel="next"/.exec(out.headers.link ?? "")?.[1];
  }
  return bodies;
}

const hub = {
  getState: () => ({
    generatedAt: NOW,
    participants: PARTICIPANTS.map((id) => ({
      id,
      displayName: id,
      kind: id.startsWith("human") ? "human" : "bot",
      cash: 0,
      equity: 0,
      positions: [],
    })),
    collisions: [],
  }),
} as unknown as ObservatoryHub;

describe("the Wire's append-aware fold (#4458)", () => {
  let root: string;
  let dirs: { activity: string; bus: string; feedback: string };
  let sources: Sources;
  let fixture: Fixture;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "wire-feed-"));
    // The bus nests under the ledger's directory, as it does in production (`activity-bus.ts`).
    dirs = {
      activity: join(root, "activity"),
      bus: join(root, "activity", "events"),
      feedback: join(root, "feedback"),
    };
    fixture = buildFixture(4458, 180, 1);
    writeLedger(dirs.activity, fixture.ledger, "write");
    writeLedger(dirs.bus, fixture.bus, "write");
    writeLedger(dirs.feedback, fixture.filings, "write");
    sources = {
      bus: new JsonlActivityEventBus(dirs.bus),
      activity: new JsonlActivityStore(dirs.activity),
      feedbackLog: new JsonlFeedbackLogStore(dirs.feedback),
    };
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  describe("when the ledgers hold a newest-first backfill, late appends, partial fills and twins", () => {
    it("renders every page, every symbol page and every other kind exactly as the whole files do", async () => {
      const cold = await coldFeed(sources);
      const fold = await wireFeedReader(sources).read();

      expect(tradePages(cold).length).toBeGreaterThan(30);
      expect(wireOf(fold)).toEqual(wireOf(cold));
    });

    it("hands the route far fewer lines than the files hold", async () => {
      const cold = await coldFeed(sources);
      const fold = await wireFeedReader(sources).read();

      expect(fold.events.length).toBeLessThan(cold.events.length);
      expect(fold.records.length).toBeLessThan(cold.records.length);
    });
  });

  describe("when /api/wire is served from the fold", () => {
    it("serves every page and every ?symbol= page byte for byte as the whole reads do", async () => {
      const shared: WireRouteDeps = {
        hub,
        readAllLadderProgress: () => Promise.resolve([]),
        readAllOrderAudit: () => Promise.resolve([]),
      };
      const whole: WireRouteDeps = {
        ...shared,
        readAllActivityEvents: () => sources.bus.list(),
        readAllTradeActivity: () => sources.activity.list(),
        readAllFeedback: () => sources.feedbackLog.list(),
      };
      const folded: WireRouteDeps = { ...shared, readWireFeed: wireFeedReader(sources).read };

      for (const url of ["/api/wire?per_page=50", "/api/wire?per_page=20&symbol=NVDA"]) {
        const expected = await routeWalk(whole, url);
        expect(expected.length).toBeGreaterThan(10);
        expect(await routeWalk(folded, url)).toEqual(expected);
      }
    }, 30_000); // Every page of a large fixture, read twice: over the 5s default on a loaded verify.
  });

  describe("when lines are appended after the fold is warm", () => {
    it("reads only the appended lines and places each — even one back-dated by months — where a cold read would", async () => {
      const bus = counted((from) => sources.bus.sinceAll(from));
      const activity = counted((from) => sources.activity.sinceAll(from));
      const reader = wireFeedReader({
        bus: { list: () => sources.bus.list(), sinceAll: bus.sinceAll },
        activity: { list: () => sources.activity.list(), sinceAll: activity.sinceAll },
        feedbackLog: sources.feedbackLog,
      });
      await reader.read();
      const warmed = { bus: bus.read.lines, activity: activity.read.lines };

      const backdated: TradeActivityRecord = {
        orderId: "sauron-backdated",
        participantId: "sauron",
        symbol: "NVDA",
        side: "buy",
        quantity: 2,
        filledQuantity: 2,
        price: 101.5,
        status: "filled",
        at: iso(T0 + 3 * DAY),
        source: "lifecycle",
      };
      const progressed = fixture.ledger.find((r) => r.line.status === "partially_filled")?.line;
      if (!progressed) throw new Error("fixture has no partial fill");
      const appended = [
        backdated,
        {
          ...progressed,
          filledQuantity: progressed.quantity,
          status: "filled",
          at: iso(T0 + 200 * DAY),
        },
      ];
      for (const record of appended) {
        await sources.activity.record(record);
        await sources.bus.publish(activityEventFromTradeRecord(record));
      }

      const fold = await reader.read();

      expect(bus.read.lines - warmed.bus).toBe(2);
      expect(activity.read.lines - warmed.activity).toBe(2);
      expect(wireOf(fold)).toEqual(wireOf(await coldFeed(sources)));
    });

    it("includes a file that did not exist at warm-up", async () => {
      const reader = wireFeedReader(sources);
      await reader.read();

      const newcomer: TradeActivityRecord = {
        orderId: "human-3-0",
        participantId: "human-3",
        symbol: "AAPL",
        side: "buy",
        quantity: 1,
        filledQuantity: 1,
        status: "filled",
        at: iso(T0 + 100 * DAY),
        source: "stream",
      };
      await sources.activity.record(newcomer);
      await sources.feedbackLog.record({
        ...(fixture.filings[0]?.line as FeedbackLogEntry),
        uuid: "new",
        opaqueMemberId: "member-new",
        issueNumber: 999,
      });

      const fold = await reader.read();

      expect(fold.records).toContainEqual(newcomer);
      expect(wireOf(fold)).toEqual(wireOf(await coldFeed(sources)));
    });

    it("folds an append once when two reads land together", async () => {
      const reader = wireFeedReader(sources);
      await reader.read();
      await sources.bus.publish(
        activityEventFromTradeRecord({
          ...(fixture.ledger[0]?.line as TradeActivityRecord),
          at: iso(T0 + 201 * DAY),
        }),
      );

      const [first, second] = await Promise.all([reader.read(), reader.read()]);

      expect(second).toEqual(first);
      expect(wireOf(second)).toEqual(wireOf(await coldFeed(sources)));
    });
  });

  describe("when a file shrinks or disappears, or the cache is reset", () => {
    it("rebuilds a replaced file from 0 and drops a removed one", async () => {
      const reader = wireFeedReader(sources);
      await reader.read();

      const sauron = fixture.ledger.filter((r) => r.file === "sauron");
      writeLedger(dirs.activity, sauron.slice(0, Math.floor(sauron.length / 2)), "write");
      rmSync(join(dirs.bus, "bot-a.jsonl"));

      expect(wireOf(await reader.read())).toEqual(wireOf(await coldFeed(sources)));
    });

    it("folds every file again after a reset", async () => {
      const reader = wireFeedReader(sources);
      await reader.read();
      reader.reset();

      expect(wireOf(await reader.read())).toEqual(wireOf(await coldFeed(sources)));
    });
  });

  describe("when a store has no append-aware read (offline mode's in-memory stores)", () => {
    it("folds the store's whole list and still matches it", async () => {
      const bus = new InMemoryActivityEventBus();
      const activity = new InMemoryActivityStore();
      for (const { line } of fixture.bus) await bus.publish(line);
      for (const { line } of fixture.ledger) await activity.record(line);
      const memory = { bus, activity, feedbackLog: sources.feedbackLog };

      expect(wireOf(await wireFeedReader(memory).read())).toEqual(wireOf(await coldFeed(memory)));
    });

    it("reads an absent store as empty", async () => {
      const fold = await wireFeedReader({}).read();

      expect(fold).toEqual({ events: [], records: [], filings: [] });
    });
  });
});
