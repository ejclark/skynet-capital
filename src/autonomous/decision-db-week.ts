import type { DatabaseSync } from "node:sqlite";
import type { PlaybookMode, PlaybookVerdictState, Side } from "../domain/types.js";

/**
 * A BOT'S WEEK OF CHECKS, as rows (#5073 slice 2 — #5037 round 2's "lanes on one clock"). The
 * heartbeat reads the newest 30 passes (`listByPersona`'s default page), about seven minutes; a
 * week is ~7,800 of them. These three reads are what the week strip and each playbook's lane are
 * drawn from, bounded by the window the caller passes and never by a page size, because a strip
 * that silently stopped at the hundredth pass would draw a missed afternoon that never happened.
 *
 * - `checks` — every pass's instant, oldest first: one integer each, so a whole week is cheap, and
 *   the gaps between them are measured exactly (`check-week-view.ts`), not inferred from buckets.
 * - `verdicts` — grouped per bucket, playbook, mode and state: a lane needs only which answer a
 *   playbook gave most in each half hour, never every pass's row.
 * - `trades` — the intents the bot placed (the broker took them: filled or working, never refused
 *   or unfilled, `actionFor`), each with the instant of the check that placed it.
 */

/** The most placed trades one week returns — far above a bot's real week (a handful), so the cap
 *  is a guard against a runaway loop, not a page. */
const WEEK_TRADES_MAX = 500;

export interface WeekVerdictRow {
  /** `floor(at / bucketMs)` — buckets are aligned to the epoch, so 30-minute ones start on :00 and
   *  :30 Eastern, where every session opens. */
  readonly bucket: number;
  readonly playbookId: string;
  readonly mode: PlaybookMode;
  readonly state: PlaybookVerdictState;
  readonly n: number;
}

export interface WeekTradeRow {
  readonly at: number;
  readonly symbol: string;
  readonly side: Side;
  readonly playbookId?: string;
  readonly mode?: PlaybookMode;
}

export interface CheckWeekRows {
  readonly checks: readonly number[];
  readonly verdicts: readonly WeekVerdictRow[];
  readonly trades: readonly WeekTradeRow[];
}

export interface CheckWeekReads {
  /** Every pass, grouped verdict and placed trade for one persona in `[from, to)`. */
  read(personaId: string, from: number, to: number, bucketMs: number): CheckWeekRows;
}

export function openCheckWeekReads(db: DatabaseSync): CheckWeekReads {
  const selectChecks = db.prepare(
    "SELECT at FROM decisions WHERE persona_id = ? AND at >= ? AND at < ? ORDER BY at ASC",
  );
  // Integer division, cast on both sides: node:sqlite binds a JS number as REAL, and REAL / REAL
  // would hand back a fraction of a bucket. `at` is never negative, so truncation is a floor.
  const selectVerdicts = db.prepare(`
    SELECT CAST(d.at AS INTEGER) / CAST(?4 AS INTEGER) AS bucket, v.playbook_id AS playbook_id, v.mode AS mode, v.state AS state,
           COUNT(*) AS n
    FROM playbook_verdicts v JOIN decisions d ON d.id = v.decision_id
    WHERE d.persona_id = ?1 AND d.at >= ?2 AND d.at < ?3
    GROUP BY bucket, v.playbook_id, v.mode, v.state
  `);
  const selectTrades = db.prepare(`
    SELECT d.at AS at, i.symbol AS symbol, i.side AS side, i.playbook_id AS playbook_id,
           i.playbook_mode AS playbook_mode
    FROM intents i JOIN decisions d ON d.id = i.decision_id
    WHERE d.persona_id = ? AND d.at >= ? AND d.at < ? AND i.action = 'placed'
    ORDER BY d.at ASC, i.id ASC LIMIT ${WEEK_TRADES_MAX}
  `);
  return {
    read(personaId, from, to, bucketMs) {
      const checks = (selectChecks.all(personaId, from, to) as { at: number }[]).map((r) => r.at);
      const verdicts = (
        selectVerdicts.all(personaId, from, to, Math.max(1, Math.round(bucketMs))) as {
          bucket: number;
          playbook_id: string;
          mode: string;
          state: string;
          n: number;
        }[]
      ).map((r) => ({
        bucket: r.bucket,
        playbookId: r.playbook_id,
        mode: r.mode as PlaybookMode,
        state: r.state as PlaybookVerdictState,
        n: r.n,
      }));
      const trades = (
        selectTrades.all(personaId, from, to) as {
          at: number;
          symbol: string;
          side: string;
          playbook_id: string | null;
          playbook_mode: string | null;
        }[]
      ).map(
        (r): WeekTradeRow => ({
          at: r.at,
          symbol: r.symbol,
          side: r.side === "sell" ? "sell" : "buy",
          ...(r.playbook_id ? { playbookId: r.playbook_id } : {}),
          ...(r.playbook_mode ? { mode: r.playbook_mode as PlaybookMode } : {}),
        }),
      );
      return { checks, verdicts, trades };
    },
  };
}
