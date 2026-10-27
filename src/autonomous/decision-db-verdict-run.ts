import type { DatabaseSync } from "node:sqlite";
import type { PlaybookVerdict } from "../domain/types.js";

/**
 * WHEN A PLAYBOOK'S VERDICT BEGAN (#4953). The heartbeat reads the newest 30 passes (about seven
 * market minutes), so a verdict that has held all afternoon could only say "at least since" the
 * oldest of them. This read walks the persona's own history instead, down `decisions_persona_at`,
 * so "since" is exact however long the verdict has stood.
 *
 * The run breaks where `playbookLines` breaks it (`bot-heartbeat-view.ts`): at the newest pass
 * that did not give this playbook, in this mode, this same answer — a different state, no row for
 * it, or a pass that ran no playbook at all. The run starts at the first pass after that one.
 *
 * Each pass the walk crosses costs one `playbook_verdicts` primary-key lookup, so the cost is the
 * run's length, never the whole history's, and the caller asks only when the page ran out first.
 */

export interface VerdictRunStart {
  /** Epoch ms of the run's first pass. */
  readonly at: number;
  /** True when no breaking pass exists: the run reaches the persona's first recorded pass, so the
   *  verdict may have held before recording began. */
  readonly reachesOldest: boolean;
}

export interface VerdictRunReads {
  /** The start of the run of `verdict` that includes the pass at `startAt`. Undefined when that
   *  pass is not on record or did not give that verdict — there is no run to date. */
  read(personaId: string, startAt: number, verdict: PlaybookVerdict): VerdictRunStart | undefined;
}

/** The newest pass at or before `?2` that did not give the verdict — the run's break. `<=` so a
 *  start pass that did not give it breaks at itself, and the read after it finds nothing:
 *  undefined, never a run invented for a verdict the pass did not give. Exported for the spec
 *  that pins its query plan to the two indexes. */
export const VERDICT_RUN_BREAK_SQL = `
  SELECT d.at AS at FROM decisions d
  WHERE d.persona_id = ?1 AND d.at <= ?2
    AND NOT EXISTS (
      SELECT 1 FROM playbook_verdicts v
      WHERE v.decision_id = d.id AND v.playbook_id = ?3 AND v.mode = ?4 AND v.state = ?5
    )
  ORDER BY d.at DESC LIMIT 1
`;

export function openVerdictRunReads(db: DatabaseSync): VerdictRunReads {
  const selectBreak = db.prepare(VERDICT_RUN_BREAK_SQL);
  const selectFirstAfter = db.prepare(
    "SELECT at FROM decisions WHERE persona_id = ? AND at > ? AND at <= ? ORDER BY at ASC LIMIT 1",
  );
  return {
    read(personaId, startAt, verdict) {
      const brk = selectBreak.get(
        personaId,
        startAt,
        verdict.playbookId,
        verdict.mode,
        verdict.state,
      ) as { at: number } | undefined;
      const first = selectFirstAfter.get(personaId, brk?.at ?? Number.MIN_SAFE_INTEGER, startAt) as
        | { at: number }
        | undefined;
      return first ? { at: first.at, reachesOldest: !brk } : undefined;
    },
  };
}
