import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { OrderSettlement } from "../domain/order-settlement.js";
import type { PlaybookObservation } from "../domain/playbook-observation.js";
import type { OrderIntent, PlaybookVerdict } from "../domain/types.js";
import type { GuardRefusalReason } from "../engine/guards.js";
import type { NormalizedLifecycleActivity } from "../trading/option-lifecycle.js";
import type { OptionOrderLeg } from "./decision-db-leg-orders.js";
import { openObservationTables } from "./decision-db-observations.js";
import { OPTION_TABLES_SQL, openOptionTables } from "./decision-db-options.js";
import { openPlaybookFunnelReads, type PlaybookFunnelRows } from "./decision-db-playbook-funnel.js";
import { openIntentResults } from "./decision-db-results.js";
import type { RetrospectiveRecord } from "./decision-db-retrospectives.js";
import { openRetrospectiveReads } from "./decision-db-retrospectives.js";
import { decisionFrom, fateOf, intentParams, intentRowToStored } from "./decision-db-rows.js";
import { CORE_TABLES_SQL } from "./decision-db-schema.js";
import {
  openSettlements,
  SETTLED_JOIN,
  SETTLEMENTS_SQL,
  type SequencedSettlement,
  type SettledIntent,
  type UnsettledOrder,
} from "./decision-db-settlements.js";
import { openVerdictRunReads, type VerdictRunStart } from "./decision-db-verdict-run.js";
import { type CheckWeekRows, openCheckWeekReads } from "./decision-db-week.js";
import { computeFunnel, type DecisionFunnel } from "./decision-funnel.js";
import { openOptionLedger, type SequencedLifecycle } from "./decision-option-ledger.js";
import type { DecisionRecord } from "./decision-record.js";

export type { RetrospectiveRecord } from "./decision-db-retrospectives.js";
export type { DecisionFunnel } from "./decision-funnel.js";

/**
 * The queryable decision store — the replacement for `JsonlAuditStore`'s whole-file-read-per-call
 * primitive (`storage/jsonl-store.ts`), on the machine that actually produces the data
 * (`docs/plans/where-are-we-documenting-*.md` PR 3 / issue #2287). `JsonlKeyedStore.list()` reads
 * and `JSON.parse`s every line of a persona's file on every request; this is the whole reason
 * `/u/:id/decisions` and the learning-loop analytics it feeds can't scale past a few thousand
 * cycles. Every read here is bounded and indexed instead.
 *
 * A SEPARATE `DatabaseSync` file from `bots-state-db.ts`'s (`decisionDbPathFrom` derives its path
 * from the same already-pinned `SKYNET_BOTS_DB_PATH`, so no new env var and no
 * `volume-persistence.spec.ts` trip) — deliberately not sharing that file's handle: those tables
 * are current-state (upsert-per-key); this is an append-only, ever-growing journal with its own
 * indexes and its own retention story. Two independent SQLite files avoid `SQLITE_BUSY` between
 * them exactly as `bots-state-db.ts`'s own module doc explains for its three tables sharing one
 * handle — the rule is "don't open two handles on the SAME file," not "one handle for everything."
 *
 * Row shape (see `decision-db-rows.ts`): one `intents` row PER RAW INTENT, because that is the
 * count that matters for "why didn't it trade" — a raw intent either carries a `guard_reason`
 * (refused, never sized) or an `approved_quantity`/`action` (survived `applyGuardsWithVerdicts`).
 * On the bots side `record()` gets the SAME `DecisionRecord` object `autonomous-trader.ts`/
 * `live-cycle.ts` built, so a refusal matches its raw intent by reference; on the app side the
 * record crossed the wire, so it matches structurally. An approved one matches on symbol + side +
 * instrument (see `decision-db-rows.ts`'s `fateOf`). An option order's legs and limit live in the
 * side tables `decision-db-options.ts` owns; what the broker said about a result, in
 * `decision-db-results.ts`'s.
 */

export interface DecisionDb {
  /** Never throws — a write failure is logged by the caller, same posture as `AuditStore`. */
  record(entry: DecisionRecord): void;
  /** Bounded and indexed on `(persona_id, at DESC)` — never a whole-table scan. `limit` is
   *  clamped to `[1, MAX_PAGE]`; `beforeAt` pages backward in time (strictly less than). */
  listByPersona(personaId: string, opts?: { limit?: number; beforeAt?: number }): DecisionRecord[];
  /** The exact `orderId` join `playbook-attribution.ts` wants — O(1) via the `intents.order_id`
   *  index, never `decision-context.ts`'s fuzzy symbol+side+time match. */
  findByOrderId(orderId: string): { record: DecisionRecord; intent: OrderIntent } | undefined;
  /** Which personas decided these orders — only the ids, with no decision record built. The
   *  Decisions tab asks "who else trades on this account" once per unique order in a ledger that
   *  grows daily; `findByOrderId` assembles a whole record per order to answer it, which cost
   *  1.5 s a request at 180 days (#4612 slice 7). Same join as `findByOrderId`: the intent's own
   *  order id, or a working order's settlement. */
  personasOfOrders(orderIds: readonly string[]): string[];
  /** A spread leg's own broker order id → the spread order it belongs to. The account
   *  reports each leg's fill under the leg's id, which `findByOrderId` never matches; this is the
   *  hop from that fill to the parent id `findByOrderId` does. Kept apart on purpose: a caller that
   *  scores fills per order (`playbook-performance.ts`) must not count a spread once per leg. */
  findSpreadLeg(legOrderId: string): OptionOrderLeg | undefined;
  /** Writes every entry with `record()`'s own idempotency guarantee, wrapped in one transaction —
   *  the app-side replication listener's insert path (PR 4). */
  recordBatch(entries: readonly DecisionRecord[]): void;
  /** The most recent `at` this store holds, per persona — the app side's own replication cursor
   *  (`decision-wire.ts`'s `decisionsCursor`), always computed fresh from the data itself, never a
   *  separately persisted value that could drift from what was actually written. */
  maxAtAll(): Record<string, number>;
  /** Every decision strictly AFTER `afterAt` for one persona, oldest first, bounded to
   *  `[1, MAX_PAGE]` — the bots side's own "what have I not sent yet" read. */
  listSince(personaId: string, afterAt: number, limit?: number): DecisionRecord[];
  /** Closed-position rows written by the retrospective writer (PR 7), newest first, bounded to
   *  `[1, MAX_PAGE]` — there is no separate `recordRetrospective()`: every write happens
   *  automatically inside `record()`/`recordBatch()` when a filled intent closes a lot. */
  listRetrospectives(personaId: string, opts?: { limit?: number }): RetrospectiveRecord[];
  /** The decision funnel (PR 7b) — cycles → raw → survived guards → placed → filled → closed,
   *  plus refusals by reason. A single SQL aggregation over the FULL history, never bounded by
   *  `MAX_PAGE` the way `listByPersona`/`listRetrospectives` are — a funnel undercounting its own
   *  totals would be a worse lie than a slow query. */
  funnelFor(personaId: string): DecisionFunnel;
  /** One persona's passes, grouped verdicts and placed trades in `[from, to)` (#5073 slice 2) —
   *  the week strip and each playbook's lane. Bounded by the window, never a page: see
   *  `decision-db-week.ts`. */
  checkWeek(personaId: string, from: number, to: number, bucketMs: number): CheckWeekRows;
  /** When the run of `verdict` holding at the pass `startAt` began (#4953) — the heartbeat's exact
   *  "since", never bounded by a page. See `decision-db-verdict-run.ts`. */
  verdictRunStart(
    personaId: string,
    startAt: number,
    verdict: PlaybookVerdict,
  ): VerdictRunStart | undefined;
  /** Every bot's checks and playbook intents in `[from, to)`, grouped by playbook and hour
   *  (#4450 slice 5a) — each playbook's funnel. See `decision-db-playbook-funnel.ts`. */
  playbookFunnel(from: number, to: number): PlaybookFunnelRows;
  /** Total realized P/L across every closed retrospective attributed to one playbook, for one
   *  persona — the `compoundAllocation` toggle's whole basis (issue #3527 slice 3): a playbook's
   *  effective budget is `capitalAllocated + realizedPlForPlaybook(...)` when enabled. Joins
   *  `retrospectives` back to `intents.playbook_id` (retrospectives themselves aren't tagged with
   *  a playbook id — only the intent that opened the position is). 0 when nothing has closed yet,
   *  never `null` — an empty sum is an honest zero, not an absence. Option round trips count
   *  (`decision-option-ledger.ts`), so an option play compounds on what it actually made. */
  realizedPlForPlaybook(personaId: string, playbookId: string): number;
  /** The names (share symbol, or an option's underlying) one persona has ever PLACED an order on
   *  under one playbook's id — the house's ownership marker for a position (`intents.playbook_id`,
   *  stamped on the order at submit). What lets an unsubscribed playbook keep its exits while the
   *  positions IT opened stay on the book (#5609), without claiming a position the bot's own rules
   *  hold in the same name. Empty when it has placed nothing. */
  symbolsPlacedByPlaybook(personaId: string, playbookId: string): ReadonlySet<string>;
  /** How the sold puts one playbook opened under one strategy tag have ended for one persona
   *  (#4469 criterion 12, the wheel's retire test): `closed` is those the expiry or assignment
   *  reports ended, `assigned` the ones that finished in the money. A put bought back early or
   *  still open is neither. */
  putOutcomesForPlaybook(
    personaId: string,
    playbookId: string,
    strategy: string,
  ): { readonly closed: number; readonly assigned: number };
  /** The broker's option expiry/assignment reports for one persona's account (#4642 slice 8),
   *  stored once each by activity id; an expiry or assignment closes the contract it names at $0.
   *  Returns how many were new. One transaction; throws only if the store itself fails. */
  recordOptionLifecycle(
    personaId: string,
    activities: readonly NormalizedLifecycleActivity[],
  ): number;
  /** Every expiry/assignment report stored after `afterSeq`, oldest first, bounded to
   *  `[1, MAX_PAGE]` — the bots' lifecycle backlog leg, so the dashboard's copy closes them too. */
  lifecycleSince(afterSeq: number, limit?: number): SequencedLifecycle[];
  /** What orders a decision left `working` became once the broker ended them (#4650), each stored
   *  once by order id, beside its decision — never over it. Every read here then shows and scores
   *  the settlement in place of the `working` result. One transaction; returns how many were new. */
  recordSettlements(settlements: readonly OrderSettlement[]): number;
  /** The newest settlements, newest first, bounded to `[1, MAX_PAGE]` — the bots' resend to the
   *  dashboard's copy (`decision-replication-client.ts`). */
  recentSettlements(limit?: number): OrderSettlement[];
  /** How one order a decision left `working` ended, by its broker id — undefined while unsettled.
   *  What the forced pick reads before it sells a lot its working buy left (review of #4642 slice
   *  10): it never sells on the ordered quantity alone. */
  settlementOf(orderId: string): OrderSettlement | undefined;
  /** Every settlement stored after `afterSeq`, oldest first, bounded to `[1, MAX_PAGE]` — the
   *  bots' backlog leg, so none is ever left behind on the dashboard's copy. */
  settlementsSince(afterSeq: number, limit?: number): SequencedSettlement[];
  /** One persona's live orders still `working` with no settlement, decided at or after `sinceAt` —
   *  what a restart hands back to the settle loop. */
  unsettledOrders(personaId: string, sinceAt: number): UnsettledOrder[];
  /** What one dark playbook would have done (#5489): its dip signals and daily level readings,
   *  oldest session first, from `fromSession` (`YYYY-MM-DD`) on. Written by `record()` from a
   *  decision's `playbookObservations`, merged on re-say; this is how thirty observed days are
   *  scored. Local to the store that recorded them — they do not ride the replication wire. */
  playbookObservations(
    playbookId: string,
    opts?: { readonly fromSession?: string },
  ): PlaybookObservation[];
  close(): void;
}

/** Hard ceiling on any single read — matches the pagination contract's `per_page` max (PR 5) so
 *  the store can never be asked to do the one thing it exists to stop. */
const MAX_PAGE = 100;
const DEFAULT_PAGE = 30;

/** `SKYNET_BOTS_DB_PATH` is a FILE path (e.g. `/data/bots-state.db`); this derives a sibling file
 *  in the same directory, so decisions land on the same durable volume with no new env var. */
export function decisionDbPathFrom(botsStateDbPath: string): string {
  const lastSlash = Math.max(botsStateDbPath.lastIndexOf("/"), botsStateDbPath.lastIndexOf("\\"));
  const dir = lastSlash >= 0 ? botsStateDbPath.slice(0, lastSlash + 1) : "";
  return `${dir}decisions.db`;
}

export function openDecisionDb(path: string): DecisionDb {
  // The bots-side path sits at the volume mount root (always present), but the app-side path
  // (`SKYNET_INSIGHTS_DIR`-derived, a SUBDIRECTORY of the mount) is only ever created as a side
  // effect of a DIFFERENT store (`JsonlInsightStore.record()`) writing to it first — this store
  // never wrote anything itself. Without this, a fresh volume (or an insights dir that's simply
  // never been written to) makes `DatabaseSync` throw on every boot, the caller's try/catch
  // swallows it, and the whole replication feature goes permanently dark with no visible error
  // (found live in prod: `/api/desk/:id/decisions` returned `available:false` on every request
  // despite `SKYNET_INSIGHTS_DIR` being correctly pinned). A no-op when the directory already
  // exists, so this is safe for the already-working bots-side path too.
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  // A busy writer (a retention sweep, a concurrent migration) blocks a caller for up to 5s
  // instead of throwing SQLITE_BUSY immediately — `bots-state-db.ts` sets none today, which is
  // the trap this module's own review named.
  db.exec("PRAGMA busy_timeout = 5000;");
  db.exec(CORE_TABLES_SQL);
  db.exec(OPTION_TABLES_SQL);
  // Before any read below is prepared: they join it (`SETTLED_JOIN`).
  db.exec(SETTLEMENTS_SQL);
  const optionTables = openOptionTables(db);
  const observations = openObservationTables(db);
  const results = openIntentResults(db);
  const week = openCheckWeekReads(db);
  const verdictRun = openVerdictRunReads(db);
  const playbookFunnel = openPlaybookFunnelReads(db);
  const retrospectives = openRetrospectiveReads(db);

  const insertDecision = db.prepare(
    "INSERT OR IGNORE INTO decisions (at, persona_id, mode, halted, context_json) VALUES (?, ?, ?, ?, ?)",
  );
  const findDecisionId = db.prepare("SELECT id FROM decisions WHERE persona_id = ? AND at = ?");
  const hasIntents = db.prepare("SELECT 1 FROM intents WHERE decision_id = ? LIMIT 1");
  const insertIntent = db.prepare(`
    INSERT INTO intents (
      decision_id, symbol, side, raw_quantity, reason, strategy, expectation, forecast_json,
      playbook_id, playbook_mode, momentum, sentiment, guard_reason, approved_quantity, action,
      order_id, result_status, filled_quantity, filled_price
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSignal = db.prepare(
    "INSERT OR IGNORE INTO market_signals (at, symbol, momentum, sentiment, bid, ask, last) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  const selectDecisionsPage = db.prepare(
    "SELECT id, at, persona_id, mode, halted, context_json FROM decisions WHERE persona_id = ? AND at < ? ORDER BY at DESC, id DESC LIMIT ?",
  );
  const selectIntentsFor = db.prepare(
    "SELECT * FROM intents WHERE decision_id = ? ORDER BY id ASC",
  );
  const insertVerdictless = db.prepare(
    "INSERT OR IGNORE INTO verdictless_passes (decision_id) VALUES (?)",
  );
  const isVerdictless = db.prepare("SELECT 1 FROM verdictless_passes WHERE decision_id = ?");
  const insertVerdict = db.prepare(
    "INSERT OR IGNORE INTO playbook_verdicts (decision_id, playbook_id, mode, state) VALUES (?, ?, ?, ?)",
  );
  const selectVerdictsFor = db.prepare(
    "SELECT playbook_id, mode, state FROM playbook_verdicts WHERE decision_id = ? ORDER BY rowid ASC",
  );
  const selectMaxAtAll = db.prepare(
    "SELECT persona_id, MAX(at) AS max_at FROM decisions GROUP BY persona_id",
  );
  const selectSince = db.prepare(
    "SELECT id, at, persona_id, mode, halted, context_json FROM decisions WHERE persona_id = ? AND at > ? ORDER BY at ASC, id ASC LIMIT ?",
  );
  const selectByOrderId = db.prepare(`
    SELECT intents.*, decisions.id AS decision_id, decisions.at AS decision_at,
           decisions.persona_id AS decision_persona_id, decisions.mode AS decision_mode,
           decisions.halted AS decision_halted, decisions.context_json AS decision_context_json
    FROM intents JOIN decisions ON decisions.id = intents.decision_id
    WHERE intents.order_id = ?1 OR (intents.order_id IS NULL AND intents.id IN (
      SELECT o.intent_id FROM intent_options o
      JOIN order_settlements s ON s.client_order_id = o.client_order_id WHERE s.order_id = ?1))
    LIMIT 1
  `);
  // `personasOfOrders` binds one `?` per id, so a long ledger is asked for in chunks that stay under
  // SQLite's variable limit (32766 in node:sqlite's build, 999 on older ones — this stays under both).
  const PERSONAS_CHUNK = 500;
  function personasOfOrderChunk(ids: readonly string[], into: Set<string>): void {
    const marks = ids.map(() => "?").join(",");
    const direct = db
      .prepare(
        `SELECT DISTINCT decisions.persona_id AS persona_id FROM intents
         JOIN decisions ON decisions.id = intents.decision_id WHERE intents.order_id IN (${marks})`,
      )
      .all(...ids) as { persona_id: string }[];
    // A working order recorded without an id and filled later is found through its settlement.
    const settled = db
      .prepare(
        `SELECT DISTINCT decisions.persona_id AS persona_id FROM order_settlements s
         JOIN intent_options o ON o.client_order_id = s.client_order_id
         JOIN intents ON intents.id = o.intent_id AND intents.order_id IS NULL
         JOIN decisions ON decisions.id = intents.decision_id WHERE s.order_id IN (${marks})`,
      )
      .all(...ids) as { persona_id: string }[];
    for (const row of [...direct, ...settled]) into.add(row.persona_id);
  }
  const selectCycleCount = db.prepare("SELECT COUNT(*) AS n FROM decisions WHERE persona_id = ?");
  // Grouped, not one row per intent (#4612 slice 7, defect #9: "+205 MB at 12 × 180 days" on this
  // path) — the distinct (guard_reason, action, result_status) combinations are few no matter how
  // long a persona's history runs, so the count SQLite already has to compute for GROUP BY is the
  // whole result, never a row pulled per intent.
  const selectFunnelGrouped = db.prepare(`
    SELECT i.guard_reason AS guard_reason, i.action AS action,
           COALESCE(s.status, i.result_status) AS result_status, COUNT(*) AS n
    FROM intents i JOIN decisions ON decisions.id = i.decision_id ${SETTLED_JOIN}
    WHERE decisions.persona_id = ?
    GROUP BY i.guard_reason, i.action, COALESCE(s.status, i.result_status)
  `);
  const selectSymbolsPlacedByPlaybook = db.prepare(`
    SELECT DISTINCT intents.symbol AS symbol
    FROM intents JOIN decisions ON decisions.id = intents.decision_id
    WHERE intents.playbook_id = ? AND decisions.persona_id = ? AND intents.action = 'placed'
  `);

  const optionLedger = openOptionLedger(db, retrospectives.write);
  const settlements = openSettlements(db, { writeLegOrders: optionTables.writeLegOrders });

  /**
   * Rebuilds every tape a settlement landed on — its option ledger or its share tape — from the
   * whole of it: the late fill sits at its own decision's place, ahead of closes already scored, so
   * those trips are re-paired rather than added to. All or nothing, inside a savepoint: a scoring
   * failure leaves the old trips (and the settlement) as they were, and never throws — the trips
   * are derived, the next settlement or fill on the tape rebuilds them.
   */
  function rescoreSettled(settled: readonly SettledIntent[]): void {
    rebuildTapes(new Set(settled.map((t) => tapeKey(t.option, t.personaId, t.symbol))));
  }

  /** Each tape rebuilt whole, all or nothing — `rescoreSettled`'s savepoint, shared with a decision
   *  that lands behind trips already scored (#4775). */
  function rebuildTapes(keys: ReadonlySet<string>): void {
    if (keys.size === 0) return;
    db.exec("SAVEPOINT rescore_settled");
    try {
      for (const key of keys) {
        const [kind, personaId, symbol] = key.split("|") as [string, string, string];
        if (kind === "o") optionLedger.rescore(personaId, symbol, true);
        else retrospectives.updateFor(personaId, symbol, true);
      }
      db.exec("RELEASE rescore_settled");
    } catch {
      db.exec("ROLLBACK TO rescore_settled");
      db.exec("RELEASE rescore_settled");
    }
  }

  const tapeKey = (option: boolean, personaId: string, symbol: string): string =>
    `${option ? "o" : "s"}|${personaId}|${symbol}`;

  /** Whether the tape already holds a trip that closed after `at`. */
  function scoredAfter(key: string, at: number): boolean {
    const [kind, personaId, symbol] = key.split("|") as [string, string, string];
    return kind === "o"
      ? optionLedger.scoredAfter(personaId, symbol, at)
      : retrospectives.shareScoredAfter(personaId, symbol, at);
  }

  function intentRowsFor(decisionId: number) {
    const options = optionTables.forDecision(decisionId);
    const settled = settlements.forDecision(decisionId);
    const words = results.forDecision(decisionId);
    return (selectIntentsFor.all(decisionId) as Record<string, unknown>[]).map((row) => {
      const id = row.id as number;
      const settlement = settled.get(id);
      const resultReason = words.get(id);
      return {
        ...intentRowToStored(row, options.get(id)),
        ...(resultReason ? { resultReason } : {}),
        ...(settlement ? { settlement } : {}),
      };
    });
  }

  /** A pass's verdicts: empty when it ran no playbook, undefined when it said nothing (#4773). */
  function verdictsFor(decisionId: number): PlaybookVerdict[] | undefined {
    const rows = (
      selectVerdictsFor.all(decisionId) as { playbook_id: string; mode: string; state: string }[]
    ).map((r) => ({
      playbookId: r.playbook_id,
      mode: r.mode as PlaybookVerdict["mode"],
      state: r.state as PlaybookVerdict["state"],
    }));
    if (rows.length > 0) return rows;
    return isVerdictless.get(decisionId) ? [] : undefined;
  }

  /** One `intents` row per raw intent, each matched to its fate first (`fateOf`), plus an option
   *  order's side-table rows and the broker's words on its result. */
  function insertIntents(decisionId: number, entry: DecisionRecord): void {
    const used = { outcomes: new Set<number>(), refusals: new Set<number>() };
    for (const raw of entry.rawIntents) {
      const fate = fateOf(raw, entry, used);
      const { lastInsertRowid } = insertIntent.run(decisionId, ...intentParams(raw, entry, fate));
      const intentId = Number(lastInsertRowid);
      if (raw.option) optionTables.write(intentId, raw, fate.outcome);
      results.write(intentId, fate.outcome?.result);
    }
  }

  function recordOne(entry: DecisionRecord): void {
    const contextJson = entry.context ? JSON.stringify(entry.context) : null;
    insertDecision.run(entry.at, entry.personaId, entry.mode, entry.halted ?? null, contextJson);
    const decisionRow = findDecisionId.get(entry.personaId, entry.at) as { id: number } | undefined;
    // `INSERT OR IGNORE` means a re-run of the SAME (persona, at) — the migration's own
    // idempotency guarantee — leaves the row untouched; only a genuinely new decision gets its
    // intents inserted below (guarded a second way by `hasIntents`, in case a prior `record()`
    // call inserted the decision row but crashed before its intents finished).
    if (!decisionRow) return;
    const decisionId = decisionRow.id;
    // Before the early return below: idempotent by primary key, so a re-run fills in verdicts a
    // crashed first attempt never reached.
    for (const v of entry.playbookVerdicts ?? []) {
      insertVerdict.run(decisionId, v.playbookId, v.mode, v.state);
    }
    if (entry.playbookVerdicts?.length === 0) insertVerdictless.run(decisionId);
    // Also before the early return, and merged by key, so a re-say moves an outcome on.
    if (entry.playbookObservations?.length)
      observations.write(entry.at, entry.playbookObservations);
    if (hasIntents.get(decisionId)) return;

    insertIntents(decisionId, entry);

    if (entry.context) {
      for (const [symbol, quote] of Object.entries(entry.context.quotes)) {
        insertSignal.run(
          entry.at,
          symbol,
          entry.context.momentum?.[symbol] ?? null,
          entry.context.newsSentiment?.[symbol] ?? null,
          quote.bid,
          quote.ask,
          quote.last,
        );
      }
    }

    triggerRetrospectives(entry);
    linkEarlySettlements(entry);
  }

  /** A settlement can land before its decision on the dashboard's copy: link it once the decision
   *  is in — the spread's leg ids, and the tape rebuild its fill owes. Derived like the
   *  retrospective trigger, so it never costs the decision itself. */
  function linkEarlySettlements(entry: DecisionRecord): void {
    let settled: SettledIntent[];
    try {
      settled = entry.outcomes.flatMap((o) =>
        o.result?.status === "working"
          ? settlements.linkResult(o.result.orderId, o.intent.clientOrderId)
          : [],
      );
    } catch {
      return; // See above.
    }
    rescoreSettled(settled);
  }

  /** The retrospective writer's trigger: a decision that just recorded a fill may have closed a
   *  position. Never allowed to break decision capture itself — a retrospective is a derived
   *  convenience, not the audit trail — split out of `recordOne` to keep its own complexity down. */
  function triggerRetrospectives(entry: DecisionRecord): void {
    const filled = entry.outcomes.filter((o) => o.result?.status === "filled");
    // The dashboard's copy receives the newest decisions first, then pages older history (#4775):
    // a fill landing behind a trip already scored re-pairs that tape, so it is rebuilt, never added
    // to — adding would count the re-paired close twice. The bots' own store records in order.
    let behind: Set<string>;
    try {
      behind = new Set(
        filled
          .map((o) => tapeKey(o.intent.option !== undefined, entry.personaId, o.intent.symbol))
          .filter((key) => scoredAfter(key, entry.at)),
      );
    } catch {
      behind = new Set();
    }
    rebuildTapes(behind);
    // An option fill is scored on its own ledger, per contract, never as a share lot.
    const fresh = (option: boolean) => (o: (typeof filled)[number]) =>
      Boolean(o.intent.option) === option &&
      !behind.has(tapeKey(option, entry.personaId, o.intent.symbol));
    const ledgers = [...new Set(filled.filter(fresh(false)).map((o) => o.intent.symbol))].map(
      (symbol) => () => retrospectives.updateFor(entry.personaId, symbol),
    );
    const optionLedgers = [...new Set(filled.filter(fresh(true)).map((o) => o.intent.symbol))].map(
      (underlying) => () => optionLedger.rescore(entry.personaId, underlying),
    );
    for (const update of [...ledgers, ...optionLedgers]) {
      try {
        update();
      } catch {
        // Swallowed — see comment above. The next fill for this symbol retries the full recompute.
      }
    }
  }

  function rowsToRecords(
    rows: readonly {
      id: number;
      at: number;
      persona_id: string;
      mode: "observe" | "live";
      halted: string | null;
      context_json: string | null;
    }[],
  ): DecisionRecord[] {
    return rows.map((row) =>
      decisionFrom(
        row.at,
        row.persona_id,
        row.mode,
        row.halted,
        row.context_json,
        intentRowsFor(row.id),
        verdictsFor(row.id),
      ),
    );
  }

  return {
    record: recordOne,

    recordBatch(entries: readonly DecisionRecord[]): void {
      db.exec("BEGIN");
      try {
        for (const entry of entries) recordOne(entry);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },

    maxAtAll(): Record<string, number> {
      const rows = selectMaxAtAll.all() as { persona_id: string; max_at: number }[];
      const out: Record<string, number> = {};
      for (const row of rows) out[row.persona_id] = row.max_at;
      return out;
    },

    listSince(personaId, afterAt, limit = DEFAULT_PAGE): DecisionRecord[] {
      const clamped = Math.max(1, Math.min(limit, MAX_PAGE));
      return rowsToRecords(
        selectSince.all(personaId, afterAt, clamped) as unknown as Parameters<
          typeof rowsToRecords
        >[0],
      );
    },

    listByPersona(personaId, opts = {}): DecisionRecord[] {
      const limit = Math.max(1, Math.min(opts.limit ?? DEFAULT_PAGE, MAX_PAGE));
      const beforeAt = opts.beforeAt ?? Number.MAX_SAFE_INTEGER;
      return rowsToRecords(
        selectDecisionsPage.all(personaId, beforeAt, limit) as unknown as Parameters<
          typeof rowsToRecords
        >[0],
      );
    },

    listRetrospectives(personaId, opts = {}): RetrospectiveRecord[] {
      const limit = Math.max(1, Math.min(opts.limit ?? DEFAULT_PAGE, MAX_PAGE));
      return retrospectives.list(personaId, limit);
    },

    checkWeek: (personaId, from, to, bucketMs) => week.read(personaId, from, to, bucketMs),

    verdictRunStart: (personaId, startAt, verdict) => verdictRun.read(personaId, startAt, verdict),

    playbookFunnel: (from, to) => playbookFunnel.read(from, to),

    funnelFor(personaId): DecisionFunnel {
      const cycles = (selectCycleCount.get(personaId) as { n: number }).n;
      const closed = retrospectives.closedCount(personaId);
      const rows = selectFunnelGrouped.all(personaId) as {
        guard_reason: string | null;
        action: string | null;
        result_status: string | null;
        n: number;
      }[];
      return computeFunnel(
        cycles,
        closed,
        rows.map((r) => ({
          guardReason: r.guard_reason as GuardRefusalReason | null,
          action: r.action,
          resultStatus: r.result_status,
          count: r.n,
        })),
      );
    },

    recordOptionLifecycle(personaId, activities): number {
      db.exec("BEGIN");
      try {
        const added = optionLedger.recordLifecycle(personaId, activities);
        db.exec("COMMIT");
        return added;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },

    lifecycleSince: (afterSeq, limit = MAX_PAGE) =>
      optionLedger.since(afterSeq, Math.max(1, Math.min(limit, MAX_PAGE))),

    recordSettlements(list): number {
      let added = 0;
      const settled: SettledIntent[] = [];
      db.exec("BEGIN");
      try {
        for (const settlement of list) {
          const stored = settlements.record(settlement);
          if (stored.added) added += 1;
          settled.push(...stored.intents);
        }
        // In the same transaction, but behind its own savepoint: the settlement is the fact, its
        // P/L is derived — a scoring failure never costs the record the settle loop let go of.
        rescoreSettled(settled);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return added;
    },

    recentSettlements(limit = DEFAULT_PAGE) {
      return settlements.recent(Math.max(1, Math.min(limit, MAX_PAGE)));
    },

    settlementsSince(afterSeq, limit = MAX_PAGE) {
      return settlements.since(afterSeq, Math.max(1, Math.min(limit, MAX_PAGE)));
    },

    unsettledOrders: (personaId, sinceAt) => settlements.unsettled(personaId, sinceAt),

    settlementOf: (orderId) => settlements.byOrderId(orderId),

    realizedPlForPlaybook: (personaId, playbookId) =>
      retrospectives.realizedPlForPlaybook(personaId, playbookId),

    symbolsPlacedByPlaybook(personaId, playbookId): ReadonlySet<string> {
      const rows = selectSymbolsPlacedByPlaybook.all(playbookId, personaId) as { symbol: string }[];
      return new Set(rows.map((r) => r.symbol));
    },

    putOutcomesForPlaybook: (personaId, playbookId, strategy) =>
      retrospectives.putOutcomesForPlaybook(personaId, playbookId, strategy),

    findByOrderId(orderId) {
      const row = selectByOrderId.get(orderId) as
        | {
            decision_id: number;
            decision_at: number;
            decision_persona_id: string;
            decision_mode: "observe" | "live";
            decision_halted: string | null;
            decision_context_json: string | null;
          }
        | undefined;
      if (!row) return undefined;
      const record = decisionFrom(
        row.decision_at,
        row.decision_persona_id,
        row.decision_mode,
        row.decision_halted,
        row.decision_context_json,
        intentRowsFor(row.decision_id),
        verdictsFor(row.decision_id),
      );
      const matched = record.outcomes.find((o) => o.result?.orderId === orderId);
      return matched ? { record, intent: matched.intent } : undefined;
    },

    personasOfOrders(orderIds) {
      const found = new Set<string>();
      for (let i = 0; i < orderIds.length; i += PERSONAS_CHUNK)
        personasOfOrderChunk(orderIds.slice(i, i + PERSONAS_CHUNK), found);
      return [...found];
    },

    findSpreadLeg: (legOrderId) => optionTables.findLeg(legOrderId),

    playbookObservations: (playbookId, opts) => observations.list(playbookId, opts),

    close() {
      db.close();
    },
  };
}
