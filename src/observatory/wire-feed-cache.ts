import type { FeedbackLogEntry, FeedbackLogStore } from "../server/feedback-log.js";
import type { JsonlTail } from "../storage/jsonl-store.js";
import {
  type ActivityEvent,
  type ActivityEventBus,
  activityEventFromFeedbackEntry,
  activityEventFromTradeRecord,
} from "./activity-event.js";
import type { ActivityStore, TradeActivityRecord } from "./activity-record.js";
import { developmentFromEvent } from "./development-event-feed.js";
import { feedbackFilingFromEvent, feedbackStatusFromEvent } from "./feedback-event-feed.js";
import { milestoneFromEvent } from "./milestone-event-feed.js";
import { tradeFillFromEvent } from "./trade-event-feed.js";

/**
 * THE WIRE'S LEDGERS, FOLDED ONCE PER PROCESS AND KEPT CURRENT BY WHAT WAS APPENDED (#4458).
 *
 * `/api/wire` used to parse the whole activity bus, the whole trade ledger and the whole feedback
 * log on every `no-store` request — 345 ms and 52 MB at 100k bus events, linear. This reader folds
 * each file once, then on every later read folds only the lines appended since (`sinceAll`, the
 * whole-store twin of the `since` read `pulse-history-cache.ts` folds).
 *
 * WHY A FOLD AND NOT A TAIL READ. The ledgers are not in time order: the history backfill appends
 * newest-first, boot reconcile and the lifecycle sweep append late, and the bus backfill CLI replays
 * the ledger in file order. A "last N lines" read gave wrong deep pages on that disorder (the
 * 2026-10-26 call sheet on #4458: 133 of 217 sampled pages). Every Wire fold is a max-fold per key —
 * an order's most-filled line, a filing's latest status, a milestone's earliest earn — and a max does
 * not care what order lines arrive in.
 *
 * WHAT IT HANDS BACK IS INPUT, NOT ANSWERS. The reader returns the same three lists the route reads
 * today (bus events, ledger lines, filings), reduced to the lines that can still decide a row, in
 * the order `list()` would hand them over. The route then runs its existing pure folds over them
 * unchanged (`mergeLedgerIntoEvents`, `collapseTradeEvents`, `collapseFeedbackEvents`,
 * `deriveMilestoneEvents`, …), so a page from the fold equals a page from the whole files by
 * construction, not by a second implementation of each rule kept in step by hand.
 *
 * "Can still decide a row" means: per file, per key, every line whose standing ties the best seen so
 * far. Ties are kept, not broken here, because the existing folds break them by position (a later
 * line wins) and the trade and feedback bridges drop a ledger line whose event id the bus already
 * holds — a same-id twin always ties, so it is always among the kept lines. Keeping lines per FILE
 * (not per store) is what lets an append, a removed file and a shrunken file each be handled
 * locally, and file order is restored when the lists are handed out.
 *
 * Memory holds parsed winners, never raw lines, and a bus trade event keeps only the payload fields
 * the trade fold reads. One assumption, stated so it can be checked: a bus event that does not decode
 * as a public fill never shares an id with a ledger line that does — both come from
 * `activityEventFromTradeRecord`, so the same id means the same decode.
 */

/** One fold over a ledger: which key a line folds under and how standings compare. */
interface FoldRule<T, S> {
  /** The key and standing of `line`, or undefined when this fold ignores the line. */
  read(line: T): { readonly key: string; readonly standing: S } | undefined;
  /** > 0 when standing `a` beats `b`; 0 when they tie (both kept); < 0 when `b` holds. */
  beats(a: S, b: S): number;
}

interface Candidate<T, S> {
  readonly line: number;
  readonly value: T;
  readonly standing: S;
}

/** One rule's per-key leaders inside one file, in first-seen key order (a `Map` keeps it). */
interface KeyedLeaders<T, S> {
  readonly rule: FoldRule<T, S>;
  readonly byKey: Map<string, Candidate<T, S>[]>;
}

/** Fold one line in: a better standing replaces the key's leaders, a tie joins them. */
function addLeader<T, S>(leaders: KeyedLeaders<T, S>, value: T, line: number): void {
  const read = leaders.rule.read(value);
  if (!read) return;
  const candidate = { line, value, standing: read.standing };
  const held = leaders.byKey.get(read.key);
  const leader = held?.[0];
  if (!(held && leader)) {
    leaders.byKey.set(read.key, [candidate]);
    return;
  }
  const verdict = leaders.rule.beats(read.standing, leader.standing);
  if (verdict > 0) leaders.byKey.set(read.key, [candidate]);
  else if (verdict === 0) held.push(candidate);
}

interface FileFold<T> {
  /** Byte offset just past the last line folded — the next `sinceAll` starts here. */
  offset: number;
  /** Lines folded so far: each line's position, which is what the existing folds break ties on. */
  lines: number;
  readonly leaders: KeyedLeaders<T, unknown>[];
}

/** Anything that can hand over every file's appended lines (the three stores' optional read). */
type SinceAll<T> = (
  from: ReadonlyMap<string, number>,
) => Promise<ReadonlyMap<string, JsonlTail<T>>>;

/**
 * One store's fold, file by file. `out` turns a file's leaders back into lines in an order the
 * existing folds read exactly as they read the whole file.
 */
class StoreFold<T> {
  private files = new Map<string, FileFold<T>>();
  private handedOut: readonly T[] | undefined;

  constructor(
    private readonly rules: readonly FoldRule<T, unknown>[],
    private readonly out: (leaders: readonly KeyedLeaders<T, unknown>[]) => T[],
  ) {}

  reset(): void {
    this.files = new Map();
    this.handedOut = undefined;
  }

  /** Fold what was appended since the last refresh. A file that shrank is dropped and read again
   *  from 0 on the next pass; a file gone from the directory drops out. */
  async refresh(sinceAll: SinceAll<T>): Promise<void> {
    for (let pass = 0; pass < 3; pass++) {
      const from = new Map([...this.files].map(([file, fold]) => [file, fold.offset]));
      const tails = await sinceAll(from);
      let shrank = false;
      for (const file of [...this.files.keys()]) {
        if (!tails.has(file)) this.forget(file);
      }
      for (const [file, tail] of tails) {
        if (tail.reset) {
          this.forget(file);
          shrank = true;
          continue;
        }
        this.foldInto(file, tail.entries).offset = tail.offset;
      }
      if (!shrank) return;
    }
  }

  /** Fold a whole `list()` as one file — the path for a store with no `sinceAll` (in-memory, small). */
  replaceWith(entries: readonly T[]): void {
    this.reset();
    this.foldInto("", entries);
  }

  lines(): readonly T[] {
    if (this.handedOut) return this.handedOut;
    // `list()` reads files in sorted name order; restore it, whatever order they were first seen in.
    const names = [...this.files.keys()].sort();
    this.handedOut = names.flatMap((name) => this.out(this.files.get(name)?.leaders ?? []));
    return this.handedOut;
  }

  private forget(file: string): void {
    if (this.files.delete(file)) this.handedOut = undefined;
  }

  private foldInto(file: string, entries: readonly T[]): FileFold<T> {
    let fold = this.files.get(file);
    if (!fold) {
      fold = {
        offset: 0,
        lines: 0,
        leaders: this.rules.map((rule) => ({ rule, byKey: new Map() })),
      };
      this.files.set(file, fold);
    }
    for (const entry of entries) {
      const line = fold.lines++;
      for (const leaders of fold.leaders) addLeader(leaders, entry, line);
    }
    if (entries.length > 0) this.handedOut = undefined;
    return fold;
  }
}

// --- the rules: each is the existing fold's own standing, so a kept line is one it could pick ------

type Fill = { readonly filled: number; readonly at: string };

/** `collapseTradeEvents` / `collapseActivity`: most filled, then later `at`; position breaks a tie. */
const byFill = (a: Fill, b: Fill): number =>
  a.filled !== b.filled ? a.filled - b.filled : a.at.localeCompare(b.at);

/** Later wins (`collapseFeedbackEvents`, `latestStatusByIssue`); position breaks a tie. */
const later = (a: string, b: string): number => a.localeCompare(b);

const busTrades: FoldRule<ActivityEvent, Fill> = {
  read(event) {
    const fill = tradeFillFromEvent(event);
    return fill
      ? { key: fill.orderId, standing: { filled: fill.filledQuantity, at: fill.at } }
      : undefined;
  },
  beats: byFill,
};

const busFilings: FoldRule<ActivityEvent, string> = {
  read(event) {
    const filing = feedbackFilingFromEvent(event);
    return filing ? { key: String(filing.issueNumber), standing: filing.filedAt } : undefined;
  },
  beats: later,
};

const busStatuses: FoldRule<ActivityEvent, string> = {
  read(event) {
    const status = feedbackStatusFromEvent(event);
    return status ? { key: String(status.issueNumber), standing: status.at } : undefined;
  },
  beats: later,
};

/** `collapseDevelopmentEvents` takes the last line per pull request, whatever its instant. */
const busMerges: FoldRule<ActivityEvent, null> = {
  read(event) {
    const merge = developmentFromEvent(event);
    return merge ? { key: String(merge.pullRequest), standing: null } : undefined;
  },
  beats: () => 1,
};

/** `collapseMilestoneEvents` keeps the EARLIEST earn; the first line breaks a tie. */
const busMilestones: FoldRule<ActivityEvent, string> = {
  read(event) {
    const earn = milestoneFromEvent(event);
    return earn
      ? { key: `${earn.participantId}:${earn.milestoneId}`, standing: earn.at }
      : undefined;
  },
  beats: (a, b) => b.localeCompare(a),
};

/** Every ledger line, as `collapseActivity` (the milestone leg's `deriveEarned` input) reads them. */
const ledgerLines: FoldRule<TradeActivityRecord, Fill> = {
  read: (record) => ({
    key: record.orderId,
    standing: { filled: record.filledQuantity, at: record.at },
  }),
  beats: byFill,
};

/** The ledger lines the trade page can show — a line that does not decode as a public fill never
 *  reaches `collapseTradeEvents`, so a lower line that does can still be the order's row. */
const ledgerFills: FoldRule<TradeActivityRecord, Fill> = {
  read(record) {
    const fill = tradeFillFromEvent(activityEventFromTradeRecord(record));
    return fill
      ? { key: fill.orderId, standing: { filled: fill.filledQuantity, at: fill.at } }
      : undefined;
  },
  beats: byFill,
};

const logFilings: FoldRule<FeedbackLogEntry, string> = {
  read(entry) {
    const filing = feedbackFilingFromEvent(activityEventFromFeedbackEntry(entry));
    return filing ? { key: String(filing.issueNumber), standing: filing.filedAt } : undefined;
  },
  beats: later,
};

/** A file's leaders as lines: rule by rule, key by first-seen key, each key's lines in file order.
 *  Rules never share a line (each decodes a different event type), so nothing repeats. */
function leadersInOrder<T>(leaders: readonly KeyedLeaders<T, unknown>[]): T[] {
  return leaders.flatMap((rule) =>
    [...rule.byKey.values()].flatMap((held) => held.map((c) => c.value)),
  );
}

/** A ledger file's leaders under both ledger rules, merged per key so a line held by both appears
 *  once and each key's lines stay in file order. Keys follow `ledgerLines`' first-seen order, which
 *  is every key's first line in the file — the order `collapseActivity` meets them in. */
function ledgerInOrder(leaders: readonly KeyedLeaders<TradeActivityRecord, unknown>[]) {
  const [lines, fills] = leaders;
  if (!(lines && fills)) return [];
  return [...lines.byKey].flatMap(([key, held]) => {
    const both = new Map<number, TradeActivityRecord>();
    for (const c of [...held, ...(fills.byKey.get(key) ?? [])]) both.set(c.line, c.value);
    return [...both].sort(([a], [b]) => a - b).map(([, value]) => value);
  });
}

/** A bus trade event as the fold keeps it: the envelope, and only the payload the trade fold reads. */
function slimmed(event: ActivityEvent): ActivityEvent {
  if (!tradeFillFromEvent(event)) return event;
  const { symbol, side, filledQuantity, price } = event.payload;
  return {
    ...event,
    payload: { symbol, side, filledQuantity, ...(price !== undefined ? { price } : {}) },
  };
}

/** The Wire's three ledgers, reduced to the lines that can still decide a row (see the header). */
export interface WireFeed {
  /** Bus events: trade fills, filings, statuses, merges and earns — what `assembleWire` calls `published`. */
  readonly events: readonly ActivityEvent[];
  /** Trade ledger lines — the union leg for the trade page, and `deriveMilestoneEvents`' input. */
  readonly records: readonly TradeActivityRecord[];
  /** Feedback log entries — the union leg for the pulse. */
  readonly filings: readonly FeedbackLogEntry[];
}

export interface WireFeedReader {
  /** The current feed, folding only what was appended since the last read. */
  read(): Promise<WireFeed>;
  /** Forget everything; the next read folds every file from 0. */
  reset(): void;
}

/**
 * One reader per process over the bus, the trade ledger and the feedback log — any may be absent
 * (that leg reads as empty, the route's honest empty state). A store with no `sinceAll` is folded
 * from `list()` on every read, the way `pulseHistoryReader` treats a store with no `since`.
 *
 * Reads run one at a time: two requests landing together would otherwise fold the same appended
 * lines twice.
 */
export function wireFeedReader(sources: {
  readonly bus?: Pick<ActivityEventBus, "list" | "sinceAll">;
  readonly activity?: Pick<ActivityStore, "list" | "sinceAll">;
  readonly feedbackLog?: Pick<FeedbackLogStore, "list" | "sinceAll">;
}): WireFeedReader {
  const bus = new StoreFold<ActivityEvent>(
    [busTrades, busFilings, busStatuses, busMerges, busMilestones],
    leadersInOrder,
  );
  const ledger = new StoreFold<TradeActivityRecord>([ledgerLines, ledgerFills], ledgerInOrder);
  const filings = new StoreFold<FeedbackLogEntry>([logFilings], leadersInOrder);
  let queue: Promise<unknown> = Promise.resolve();

  async function advance<T>(
    fold: StoreFold<T>,
    store: { list(): Promise<readonly T[]>; sinceAll?: SinceAll<T> } | undefined,
    keep: (line: T) => T = (line) => line,
  ): Promise<void> {
    if (!store) return;
    const since = store.sinceAll?.bind(store);
    if (since) {
      await fold.refresh(async (from) => {
        const tails = await since(from);
        return new Map(
          [...tails].map(([file, tail]) => [file, { ...tail, entries: tail.entries.map(keep) }]),
        );
      });
    } else {
      fold.replaceWith((await store.list()).map(keep));
    }
  }

  async function refresh(): Promise<WireFeed> {
    await Promise.all([
      advance(bus, sources.bus, slimmed),
      advance(ledger, sources.activity),
      advance(filings, sources.feedbackLog),
    ]);
    return { events: bus.lines(), records: ledger.lines(), filings: filings.lines() };
  }

  return {
    read() {
      const next = queue.catch(() => undefined).then(refresh);
      queue = next;
      return next;
    },
    reset() {
      bus.reset();
      ledger.reset();
      filings.reset();
    },
  };
}
