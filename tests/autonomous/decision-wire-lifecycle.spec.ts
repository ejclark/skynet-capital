import { mkdtempSync, rmSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DecisionDb, openDecisionDb } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { resolveDecisionReplication } from "../../src/autonomous/decision-replication-client.js";
import {
  DECISION_BATCH_KIND_V2,
  type DecisionBatch,
  parseDecisionBatch,
  storeDecisionBatch,
} from "../../src/autonomous/decision-wire.js";
import {
  MAX_LIFECYCLE_PER_BATCH,
  parseLifecycleReport,
  reportsByPersona,
} from "../../src/autonomous/decision-wire-lifecycle.js";
import type { OrderSettlement } from "../../src/domain/order-settlement.js";
import type { OptionLegFill, OrderIntent, OrderResult } from "../../src/domain/types.js";
import { createInsightsListener } from "../../src/server/insights-listener.js";
import { isRecord } from "../../src/storage/parse-guards.js";
import type { NormalizedLifecycleActivity } from "../../src/trading/option-lifecycle.js";
import { anOptionIntent } from "../support/builders.js";

/**
 * Expiries and assignments reach the dashboard's copy of the store (#4650, plan #4642). No order
 * ever fills for either, so the bots' broker sweep is the only thing that closes a sold put that
 * expired — and it fed only the bots' store. On the dashboard's copy the put stayed open forever:
 * no round trip, and its closed count and expectancy short by every one.
 */

const PUT = "CRWV261106P00085000";
const LOW = "NVDA261113C00185000";
const HIGH = "NVDA261113C00200000";
const OPENED = Date.parse("2026-10-07T14:30:00.000Z");
const EXPIRY = "2026-11-06T23:59:59.999Z";

const soldPut = { ...anOptionIntent(), clientOrderId: "sk1-sauron-CRWV-k9x2-0" };
const spread: OrderIntent = anOptionIntent({
  symbol: "NVDA",
  side: "buy",
  playbookId: "NVDA-CALL-SPREAD",
  option: {
    effect: "open",
    structure: "call-debit-spread",
    legs: [
      { occSymbol: LOW, side: "buy", ratio: 1 },
      { occSymbol: HIGH, side: "sell", ratio: 1 },
    ],
    limitPrice: 3.4,
  },
});

const cycle = (
  at: number,
  intent: OrderIntent,
  result: Omit<OrderResult, "intent">,
): DecisionRecord => ({
  at,
  personaId: "sauron",
  mode: "live",
  rawIntents: [intent],
  guardedIntents: [intent],
  outcomes: [{ intent, action: "placed", result: { intent, ...result } }],
});
const filled = (orderId: string, price: number, legFills?: readonly OptionLegFill[]) => ({
  status: "filled" as const,
  orderId,
  filledQuantity: 1,
  filledPrice: price,
  ...(legFills ? { legFills } : {}),
});

/** A put sold for $2.05 — worth +$205 once it expires or is assigned. */
const putFilled = cycle(OPENED, soldPut, filled("opt-1", 2.05));
/** The same put, recorded while its order was still open at the broker… */
const putWorking = cycle(OPENED, soldPut, { status: "working", orderId: "opt-1" });
/** …and what it became. */
const putSettled: OrderSettlement = {
  orderId: "opt-1",
  clientOrderId: soldPut.clientOrderId,
  status: "filled",
  filledQuantity: 1,
  filledPrice: 2.05,
  legs: [{ occSymbol: PUT, filledQuantity: 1, filledPrice: 2.05 }],
  settledAt: "2026-10-07T14:31:00.000Z",
};
/** A call spread bought for $3.35 net — −$335 once both legs expire. */
const spreadFilled = cycle(
  OPENED + 60_000,
  spread,
  filled("s-1", 3.35, [
    { occSymbol: LOW, filledQuantity: 1, filledPrice: 5.1 },
    { occSymbol: HIGH, filledQuantity: 1, filledPrice: 1.75 },
  ]),
);

const report = (
  id: string,
  over: Partial<NormalizedLifecycleActivity> = {},
): NormalizedLifecycleActivity => ({
  id,
  type: "OPEXP",
  symbol: PUT,
  quantity: 1,
  at: EXPIRY,
  ...over,
});

/** A JSON round trip — what the bridge actually carries. */
const wire = <T>(value: T): unknown => JSON.parse(JSON.stringify(value));

/** A dashboard as it stood before this field: the same parser, blind to `lifecycle`. */
const predating = (body: unknown) =>
  parseDecisionBatch(isRecord(body) ? { ...body, lifecycle: undefined } : body);

/** What a member reads off a store: each closed trip, the funnel's closed count, the P/L. */
const scored = (db: DecisionDb) => ({
  trips: db
    .listRetrospectives("sauron")
    .map((t) => [t.at, t.symbol, t.exitReason, t.realized, t.returnPct]),
  closed: db.funnelFor("sauron").closed,
  wheel: db.realizedPlForPlaybook("sauron", "CRWV-WHEEL"),
  spread: db.realizedPlForPlaybook("sauron", "NVDA-CALL-SPREAD"),
});

/** Every report a store holds, as `persona/activity id`, paging through it. */
function storedReports(db: DecisionDb): string[] {
  const out: string[] = [];
  let page = db.lifecycleSince(0, 100);
  while (page.length > 0) {
    out.push(...page.map((r) => `${r.personaId}/${r.activity.id}`));
    page = db.lifecycleSince(page[page.length - 1]?.seq ?? Number.MAX_SAFE_INTEGER, 100);
  }
  return out;
}

describe("parseLifecycleReport", () => {
  it("reads a report back exactly as it was sent", () => {
    expect(parseLifecycleReport(wire(report("exp-1")))).toEqual(report("exp-1"));
    const assigned = report("asn-1", { type: "OPASN" });
    expect(parseLifecycleReport(wire(assigned))).toEqual(assigned);
  });

  it("refuses one missing what it is stored or scored by", () => {
    for (const bad of [
      { ...report("exp-1"), id: "" },
      { ...report("exp-1"), type: "OPXYZ" },
      { ...report("exp-1"), symbol: "" },
      { ...report("exp-1"), symbol: "X".repeat(33) },
      { ...report("exp-1"), quantity: 0 },
      { ...report("exp-1"), quantity: "1" },
      { ...report("exp-1"), at: "at the close" },
      null,
      "exp-1",
    ]) {
      expect(parseLifecycleReport(wire(bad))).toBeUndefined();
    }
  });
});

describe("parseDecisionBatch — the lifecycle field", () => {
  const batch = { kind: DECISION_BATCH_KIND_V2, personaId: "sauron", records: [putFilled] };
  const reports = [{ personaId: "sauron", activities: [report("exp-1")] }];

  it("carries each persona's reports, dropping a malformed report — or group — alone", () => {
    const parsed = parseDecisionBatch(
      wire({
        ...batch,
        records: [],
        lifecycle: [
          { personaId: "sauron", activities: [report("exp-1"), { id: "junk" }] },
          { personaId: "", activities: [report("exp-2")] },
          { personaId: "beta-scout", activities: "junk" },
          { personaId: "beta-scout", activities: [report("exp-3")] },
        ],
      }),
    );
    expect(parsed?.lifecycle).toEqual([
      { personaId: "sauron", activities: [report("exp-1")] },
      { personaId: "beta-scout", activities: [report("exp-3")] },
    ]);
  });

  it("never changes which records a batch keeps — a dashboard reading only the records sees the same batch", () => {
    const without = parseDecisionBatch(wire(batch));
    for (const lifecycle of [reports, "garbage", [{ personaId: 7 }]]) {
      expect(parseDecisionBatch(wire({ ...batch, lifecycle }))?.records).toEqual(without?.records);
      expect(predating(wire({ ...batch, lifecycle }))?.records).toEqual(without?.records);
    }
    // A batch from bots that predate the field parses exactly as it did.
    expect(without).not.toHaveProperty("lifecycle");
  });

  it("takes reports on their own, which a dashboard that predates them refuses — but never an empty batch", () => {
    const alone = wire({ ...batch, records: [], lifecycle: reports });
    expect(parseDecisionBatch(alone)).toEqual({
      personaId: "sauron",
      records: [],
      lifecycle: reports,
    });
    expect(predating(alone)).toBeUndefined();
    expect(
      parseDecisionBatch(wire({ ...batch, records: [], lifecycle: [{ personaId: "sauron" }] })),
    ).toBeUndefined();
  });

  it(`reads at most ${MAX_LIFECYCLE_PER_BATCH} reports, however they are grouped`, () => {
    const many = (persona: string, n: number) => ({
      personaId: persona,
      activities: Array.from({ length: n }, (_, i) => report(`${persona}-${i}`)),
    });
    const parsed = parseDecisionBatch(
      wire({ ...batch, records: [], lifecycle: [many("sauron", 70), many("beta-scout", 70)] }),
    );
    expect(parsed?.lifecycle?.map((g) => g.activities.length)).toEqual([70, 30]);
  });
});

describe("an expiry reaching the dashboard's copy", () => {
  let dir: string;
  let botsDb: DecisionDb;
  let appDb: DecisionDb;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-wire-lifecycle-"));
    botsDb = openDecisionDb(join(dir, "bots.db"));
    appDb = openDecisionDb(join(dir, "app.db"));
  });
  afterEach(() => {
    botsDb.close();
    appDb.close();
    rmSync(dir, { recursive: true, force: true });
  });

  /** The real listener, wired as the dashboard wires it, keeping every batch it accepted. */
  async function listening(
    db: DecisionDb,
    refuse: (batch: DecisionBatch) => boolean = () => false,
  ): Promise<{ server: Server; url: string; batches: DecisionBatch[] }> {
    const batches: DecisionBatch[] = [];
    const server = createInsightsListener({
      record: () => Promise.resolve(),
      decisions: {
        recordBatch: (batch) => {
          if (refuse(batch)) throw new Error("disk full"); // the dashboard answers 502
          batches.push(batch);
          storeDecisionBatch(db, batch);
        },
      },
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    return { server, url: `http://127.0.0.1:${port}`, batches };
  }
  const closing = (server: Server) => new Promise<void>((resolve) => server.close(() => resolve()));

  it("WHEN a put the dashboard holds as sold expires, the next poll closes it there — the same trip the bots scored", async () => {
    const bots = botsDb;
    const app = appDb;
    bots.record(putFilled);
    const bridge = await listening(app);
    try {
      const client = resolveDecisionReplication(
        { SKYNET_INSIGHTS_BRIDGE_URL: bridge.url },
        () => bots,
      );
      await client.replicate({});
      expect(scored(app)).toMatchObject({ trips: [], closed: 0, wheel: 0 });

      bots.recordOptionLifecycle("sauron", [report("exp-1")]);
      await client.replicate({});

      expect(scored(app)).toEqual(scored(bots));
      expect(scored(app)).toMatchObject({
        trips: [[Date.parse(EXPIRY), PUT, "expired worthless", 205, 100]],
        closed: 1,
        wheel: 205,
      });
      // On a POST of its own, no records beside it.
      const carrying = bridge.batches.filter((b) => b.lifecycle !== undefined);
      expect(carrying).toEqual([
        {
          personaId: "sauron",
          records: [],
          lifecycle: [reportsByPersona(bots.lifecycleSince(0))[0]],
        },
      ]);
      // The cursor has moved past it: a later poll sends it no more.
      await client.replicate({});
      expect(bridge.batches.filter((b) => b.lifecycle !== undefined)).toHaveLength(1);
    } finally {
      await closing(bridge.server);
    }
  });

  it("resent, duplicated, or sent again after either side restarts, a report is stored once and its trip scored once", async () => {
    const bots = botsDb;
    let app = appDb;
    bots.record(putFilled);
    bots.recordOptionLifecycle("sauron", [report("exp-1")]);
    bots.recordOptionLifecycle("beta-scout", [report("exp-9")]);
    let bridge = await listening(app);
    try {
      const env = { SKYNET_INSIGHTS_BRIDGE_URL: bridge.url };
      await resolveDecisionReplication(env, () => bots).replicate({});
      const once = scored(app);
      expect(once.closed).toBe(1);

      // A restarted bots process starts its cursor over and sends every report again.
      await resolveDecisionReplication(env, () => bots).replicate({});
      // The same report twice in one batch.
      storeDecisionBatch(app, {
        personaId: "sauron",
        records: [],
        lifecycle: [{ personaId: "sauron", activities: [report("exp-1"), report("exp-1")] }],
      });
      expect(scored(app)).toEqual(once);

      // A restarted dashboard, reopening the same file, then a restarted bots process.
      await closing(bridge.server);
      app.close();
      app = openDecisionDb(join(dir, "app.db"));
      appDb = app;
      bridge = await listening(app);
      await resolveDecisionReplication(
        { SKYNET_INSIGHTS_BRIDGE_URL: bridge.url },
        () => bots,
      ).replicate({});
      expect(scored(app)).toEqual(once);
      expect(storedReports(app)).toEqual(["sauron/exp-1", "beta-scout/exp-9"]);
    } finally {
      await closing(bridge.server);
    }
  });

  it("delivers every report however many there are, in pages, and sends a refused page again", async () => {
    const bots = botsDb;
    const app = appDb;
    const ids = (persona: string, n: number) =>
      Array.from({ length: n }, (_, i) => report(`${persona}-${i}`));
    bots.recordOptionLifecycle("sauron", ids("sauron", 70));
    bots.recordOptionLifecycle("beta-scout", ids("beta-scout", 60));
    let refuseNext = true;
    const bridge = await listening(app, (batch) => {
      if (!(batch.lifecycle && refuseNext)) return false;
      refuseNext = false;
      return true;
    });
    try {
      const client = resolveDecisionReplication(
        { SKYNET_INSIGHTS_BRIDGE_URL: bridge.url },
        () => bots,
      );
      for (let poll = 0; poll < 3; poll++) await client.replicate({});
      expect(storedReports(app)).toEqual(storedReports(bots));
      expect(storedReports(app)).toHaveLength(130);
      expect(
        bridge.batches.map((b) => b.lifecycle?.map((g) => [g.personaId, g.activities.length])),
      ).toEqual([
        [
          ["sauron", 70],
          ["beta-scout", 30],
        ],
        [["beta-scout", 30]],
      ]);
    } finally {
      await closing(bridge.server);
    }
  });

  it("WHILE the dashboard predates the field, the records still land and the reports wait for it — never taken and dropped", async () => {
    const bots = botsDb;
    const app = appDb;
    bots.record(putFilled);
    bots.recordSettlements([{ ...putSettled, orderId: "other", clientOrderId: "c-other" }]);
    bots.recordOptionLifecycle("sauron", [report("exp-1")]);
    let upgraded = false;
    const bodies: unknown[] = [];
    const server = createServer((req, res) => {
      let text = "";
      req.on("data", (chunk) => {
        text += String(chunk);
      });
      req.on("end", () => {
        const body: unknown = JSON.parse(text);
        bodies.push(body);
        const batch = upgraded ? parseDecisionBatch(body) : predating(body);
        if (batch) storeDecisionBatch(app, batch);
        res.writeHead(batch ? 200 : 400, { "content-type": "application/json" });
        res.end("{}");
      });
    });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    try {
      const client = resolveDecisionReplication(
        { SKYNET_INSIGHTS_BRIDGE_URL: `http://127.0.0.1:${port}` },
        () => bots,
      );
      await client.replicate({});
      await client.replicate({});
      expect(app.listByPersona("sauron")).toHaveLength(1);
      expect(scored(app).closed).toBe(0);
      // Reports only ever travel alone — never on a batch an older dashboard would accept.
      const carrying = bodies.filter((b) => isRecord(b) && b.lifecycle !== undefined);
      expect(carrying).toHaveLength(2);
      for (const body of carrying) {
        expect(body).toMatchObject({ records: [] });
        expect(body).not.toHaveProperty("settlements");
        expect(predating(body)).toBeUndefined();
      }

      upgraded = true;
      await client.replicate({});
      expect(scored(app)).toEqual(scored(bots));
      expect(scored(app).closed).toBe(1);
    } finally {
      await closing(server);
    }
  });
});

describe("the dashboard's copy scores the same whatever order a report arrives in", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "decision-wire-lifecycle-order-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  /** Every order of `items`. */
  const orders = <T>(items: readonly T[]): T[][] =>
    items.length <= 1
      ? [[...items]]
      : items.flatMap((item, i) =>
          orders([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
        );

  /** Each delivery as the bridge carries it, into a fresh dashboard copy; returns what it scored. */
  function deliveredInOrder(name: string, deliveries: readonly unknown[]) {
    const app = openDecisionDb(join(dir, `${name}.db`));
    try {
      for (const body of deliveries) {
        const batch = parseDecisionBatch(wire(body));
        if (!batch) throw new Error(`refused: ${JSON.stringify(body)}`);
        storeDecisionBatch(app, batch);
      }
      return scored(app);
    } finally {
      app.close();
    }
  }

  /** The bots' own store, fed in the order things happened there; returns what it scored. */
  function onTheBots(
    record: DecisionRecord,
    settlement: OrderSettlement | undefined,
    reports: readonly NormalizedLifecycleActivity[],
  ) {
    const bots = openDecisionDb(join(dir, "bots.db"));
    try {
      bots.record(record);
      if (settlement) bots.recordSettlements([settlement]);
      for (const r of reports) bots.recordOptionLifecycle("sauron", [r]);
      return scored(bots);
    } finally {
      bots.close();
      rmSync(join(dir, "bots.db"));
    }
  }

  const envelope = { kind: DECISION_BATCH_KIND_V2, personaId: "sauron" };
  const records = (record: DecisionRecord) => ({ ...envelope, records: [record] });
  const settlements = (s: OrderSettlement) => ({ ...envelope, records: [], settlements: [s] });
  const reportsOf = (...activities: NormalizedLifecycleActivity[]) => ({
    ...envelope,
    records: [],
    lifecycle: [{ personaId: "sauron", activities }],
  });

  it("an expiry before its opening fill, or after it — the put scores +$205 once", () => {
    const truth = onTheBots(putFilled, undefined, [report("exp-1")]);
    expect(truth).toMatchObject({ closed: 1, wheel: 205 });
    orders([records(putFilled), reportsOf(report("exp-1"))]).forEach((deliveries, n) => {
      expect(deliveredInOrder(`fill-${n}`, deliveries)).toEqual(truth);
    });
  });

  it("an assignment before or after its order's late fill, or before the decision itself — +$205 once", () => {
    const assigned = report("asn-1", { type: "OPASN" });
    const truth = onTheBots(putWorking, putSettled, [assigned]);
    expect(truth).toMatchObject({ closed: 1, wheel: 205 });
    const every = orders([records(putWorking), settlements(putSettled), reportsOf(assigned)]);
    expect(every).toHaveLength(6);
    every.forEach((deliveries, n) => {
      expect(deliveredInOrder(`settled-${n}`, deliveries)).toEqual(truth);
    });
  });

  it("a spread's two expiries in separate reads, around its fill in any order — one −$335 trip", () => {
    const low = report("exp-low", { symbol: LOW, at: "2026-11-13T23:59:59.999Z" });
    const high = report("exp-high", { symbol: HIGH, at: "2026-11-13T23:59:59.999Z" });
    const truth = onTheBots(spreadFilled, undefined, [low, high]);
    expect(truth).toMatchObject({ closed: 1, spread: -335 });
    orders([records(spreadFilled), reportsOf(low), reportsOf(high)]).forEach((deliveries, n) => {
      expect(deliveredInOrder(`spread-${n}`, deliveries)).toEqual(truth);
    });
  });
});
