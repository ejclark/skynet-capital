import type { DatabaseSync } from "node:sqlite";
import type { GuardRefusalReason } from "../engine/guards.js";
import { SETTLED_JOIN } from "./decision-db-settlements.js";
import { computeFunnel, type DecisionFunnel, type FunnelIntentRow } from "./decision-funnel.js";

/**
 * A BOT'S DECISION FUNNEL, FOLDED (#4619 part five). The Decisions tab asks for a bot's funnel on
 * every open, and the funnel counts the bot's WHOLE intent history — never a page, because a funnel
 * undercounting its own totals is a worse lie than a slow read (`DecisionDb.funnelFor`). Grouping
 * that history in SQL on each ask cost ~185 ms of the route's 343 ms at 180 days, and the history
 * only grows.
 *
 * So each bot's counts are folded once and then advanced by the intents recorded since. That is
 * exact because nothing in this store rewrites or deletes an `intents` row, and `intents.id` is
 * AUTOINCREMENT: a row the next read has not seen always has a higher id than every row it has,
 * even when the dashboard's copy pages in OLDER decisions after newer ones (#4775) — ids follow
 * insertion, not decision time.
 *
 * The one thing that moves after an intent is written is a `working` order's outcome: a
 * settlement can land later and make it a fill (`SETTLED_JOIN`). Such an intent is held aside —
 * counted as `working` — and looked up again on every read until its settlement lands, then folded
 * like the rest. A settlement is stored once and never replaced, so a folded outcome stays true.
 *
 * Cycles and closed trips are not folded: both are one covering-index count (2–4 ms at 180 days),
 * and retrospectives are rebuilt in place when a late fill re-pairs a tape.
 */

export interface FunnelFold {
  /** The persona's funnel over its whole history, as `computeFunnel` shapes it. */
  read(personaId: string): DecisionFunnel;
}

/** What a read has already counted for one persona. */
interface Folded {
  /** The highest `intents.id` folded; every row at or below it is either counted or pending. */
  cursor: number;
  /** Final outcomes, grouped by `(guard_reason, action, result_status)` — a handful of rows however
   *  long the history runs. */
  readonly counts: Map<string, Required<FunnelIntentRow>>;
  /** Intents still `working` with no settlement, by id: re-read every time until one lands. */
  readonly pending: Map<number, Pick<FunnelIntentRow, "guardReason" | "action">>;
}

/** An unsettled `working` intent's own id, so it groups alone and is held aside; NULL for every
 *  final outcome, so those group by outcome only. One walk of the range answers both. */
const PENDING_ID = "CASE WHEN i.result_status IS 'working' AND s.status IS NULL THEN i.id END";

/** One fold step, grouped. The persona's first fold walks its own decisions down
 *  `decisions_persona_at` (`+i.id` keeps the upper bound off the intents index); a later one walks
 *  only the intents added since, by primary key (`CROSS JOIN` keeps intents the outer loop). */
function rangeSql(first: boolean): string {
  const from = first
    ? "FROM intents i JOIN decisions d ON d.id = i.decision_id"
    : "FROM intents i CROSS JOIN decisions d ON d.id = i.decision_id";
  const range = first ? "+i.id <= ?2" : "i.id > ?3 AND i.id <= ?2";
  return `SELECT i.guard_reason AS guard_reason, i.action AS action,
      COALESCE(s.status, i.result_status) AS result_status, ${PENDING_ID} AS pending_id,
      COUNT(*) AS n
    ${from} ${SETTLED_JOIN}
    WHERE d.persona_id = ?1 AND ${range}
    GROUP BY i.guard_reason, i.action, COALESCE(s.status, i.result_status), pending_id`;
}

/** Exported for the spec that pins each step's query plan to the index it is meant to walk. */
export const FUNNEL_FOLD_SQL = { first: rangeSql(true), next: rangeSql(false) } as const;

interface GroupedRow {
  guard_reason: string | null;
  action: string | null;
  result_status: string | null;
  pending_id: number | null;
  n: number;
}

const keyOf = (r: FunnelIntentRow): string =>
  JSON.stringify([r.guardReason, r.action, r.resultStatus]);

function add(counts: Folded["counts"], row: Required<FunnelIntentRow>): void {
  const key = keyOf(row);
  const had = counts.get(key);
  counts.set(key, had ? { ...had, count: had.count + row.count } : row);
}

export function openFunnelFold(
  db: DatabaseSync,
  closedCount: (personaId: string) => number,
): FunnelFold {
  const selectMaxIntent = db.prepare("SELECT COALESCE(MAX(id), 0) AS n FROM intents");
  const selectCycleCount = db.prepare("SELECT COUNT(*) AS n FROM decisions WHERE persona_id = ?");
  const first = db.prepare(FUNNEL_FOLD_SQL.first);
  const next = db.prepare(FUNNEL_FOLD_SQL.next);
  const selectSettledStatus = db.prepare(
    `SELECT s.status AS status FROM intents i ${SETTLED_JOIN} WHERE i.id = ?`,
  );
  const folds = new Map<string, Folded>();

  /** Folds every intent in `(fold.cursor, hi]` into `fold`. */
  function advance(personaId: string, fold: Folded, hi: number): void {
    const rows = (fold.cursor === 0
      ? first.all(personaId, hi)
      : next.all(personaId, hi, fold.cursor)) as unknown as GroupedRow[];
    for (const r of rows) {
      const outcome = {
        guardReason: r.guard_reason as GuardRefusalReason | null,
        action: r.action,
      };
      if (r.pending_id !== null) fold.pending.set(r.pending_id, outcome);
      else add(fold.counts, { ...outcome, resultStatus: r.result_status, count: r.n });
    }
    fold.cursor = hi;
  }

  /** Folds each pending intent whose settlement has landed since the last read. */
  function settlePending(fold: Folded): void {
    for (const [id, p] of fold.pending) {
      const row = selectSettledStatus.get(id) as { status: string | null } | undefined;
      if (row?.status == null) continue;
      add(fold.counts, { ...p, resultStatus: row.status, count: 1 });
      fold.pending.delete(id);
    }
  }

  return {
    read(personaId) {
      let fold = folds.get(personaId);
      if (!fold) {
        fold = { cursor: 0, counts: new Map(), pending: new Map() };
        folds.set(personaId, fold);
      }
      const hi = (selectMaxIntent.get() as { n: number }).n;
      if (hi > fold.cursor) advance(personaId, fold, hi);
      settlePending(fold);
      const working = [...fold.pending.values()].map((p) => ({ ...p, resultStatus: "working" }));
      return computeFunnel(
        (selectCycleCount.get(personaId) as { n: number }).n,
        closedCount(personaId),
        [...fold.counts.values(), ...working],
      );
    },
  };
}
