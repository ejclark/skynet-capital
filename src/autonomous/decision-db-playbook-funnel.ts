import type { DatabaseSync } from "node:sqlite";
import type { GuardRefusalReason } from "../engine/guards.js";
import { SETTLED_JOIN } from "./decision-db-settlements.js";

/**
 * EACH PLAYBOOK'S FUNNEL, AS ROWS (#4450 slice 5a, EARS 5) — every bot's checks and intents in
 * `[from, to)`, grouped by playbook and by UTC hour. The hour is the finest grain the fold needs:
 * New York's offset is a whole number of hours, so every hour falls on exactly one New York date,
 * and `playbook-funnel.ts` turns hours into sessions without the store knowing a timezone.
 *
 * House-wide on purpose — a playbook run by two bots is one funnel, the same pooling the house
 * trade stats use (`playbook-performance.ts`). The persona list feeds the `(persona_id, at)` index
 * from the inside, so each bot's window is a range read rather than a scan of every decision ever
 * kept (`decisions` has no index on `at` alone).
 *
 * - `checks` — passes that consulted the playbook: DISTINCT decisions, because a playbook armed in
 *   two modes writes two verdict rows on one pass and was still asked once.
 * - `intents` — the intents the playbook raised, grouped by the fate fields `computeFunnel`
 *   already reads (`guard_reason`, `action`, `result_status`). The status is the settled one
 *   where a `working` order later ended (`SETTLED_JOIN`), as in a bot's own funnel — so a fill
 *   that landed a minute after the pass counts as filled. An intent with no playbook id (a bot's
 *   own rules) is no playbook's.
 */

export interface FunnelCheckRow {
  /** `floor(at / 1h)` since the epoch. */
  readonly hour: number;
  readonly playbookId: string;
  readonly n: number;
}

export interface FunnelIntentGroupRow {
  readonly hour: number;
  readonly playbookId: string;
  readonly guardReason: GuardRefusalReason | null;
  readonly action: string | null;
  readonly resultStatus: string | null;
  readonly n: number;
}

export interface PlaybookFunnelRows {
  readonly checks: readonly FunnelCheckRow[];
  readonly intents: readonly FunnelIntentGroupRow[];
}

export interface PlaybookFunnelReads {
  read(from: number, to: number): PlaybookFunnelRows;
}

const HOUR_MS = 3_600_000;

export function openPlaybookFunnelReads(db: DatabaseSync): PlaybookFunnelReads {
  // Integer division on both sides: node:sqlite binds a JS number as REAL (`decision-db-week.ts`).
  const personas = "SELECT DISTINCT persona_id FROM decisions";
  const selectChecks = db.prepare(`
    SELECT CAST(d.at AS INTEGER) / ${HOUR_MS} AS hour, v.playbook_id AS playbook_id,
           COUNT(DISTINCT v.decision_id) AS n
    FROM decisions d JOIN playbook_verdicts v ON v.decision_id = d.id
    WHERE d.persona_id IN (${personas}) AND d.at >= ? AND d.at < ?
    GROUP BY hour, v.playbook_id
  `);
  const selectIntents = db.prepare(`
    SELECT CAST(d.at AS INTEGER) / ${HOUR_MS} AS hour, i.playbook_id AS playbook_id,
           i.guard_reason AS guard_reason, i.action AS action,
           COALESCE(s.status, i.result_status) AS result_status, COUNT(*) AS n
    FROM decisions d JOIN intents i ON i.decision_id = d.id ${SETTLED_JOIN}
    WHERE d.persona_id IN (${personas}) AND d.at >= ? AND d.at < ? AND i.playbook_id IS NOT NULL
    GROUP BY hour, i.playbook_id, i.guard_reason, i.action, COALESCE(s.status, i.result_status)
  `);
  return {
    read(from, to) {
      const checks = (
        selectChecks.all(from, to) as { hour: number; playbook_id: string; n: number }[]
      ).map((r) => ({ hour: r.hour, playbookId: r.playbook_id, n: r.n }));
      const intents = (
        selectIntents.all(from, to) as {
          hour: number;
          playbook_id: string;
          guard_reason: string | null;
          action: string | null;
          result_status: string | null;
          n: number;
        }[]
      ).map((r) => ({
        hour: r.hour,
        playbookId: r.playbook_id,
        guardReason: r.guard_reason as GuardRefusalReason | null,
        action: r.action,
        resultStatus: r.result_status,
        n: r.n,
      }));
      return { checks, intents };
    },
  };
}
