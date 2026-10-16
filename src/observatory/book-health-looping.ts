import type { CheckWeekRows } from "../autonomous/decision-db-week.js";
import type { DecisionRecord } from "../autonomous/decision-record.js";
import { marketDayKey } from "../domain/market-day.js";
import { opensRisk } from "../domain/option-book.js";
import type { PlaybookSubscription, PlaybookVerdictState } from "../domain/types.js";
import type { GuardRefusalReason } from "../engine/guards.js";
import { capitalized, playName } from "./book-health-detectors.js";
import type { BookReading, HealthFinding, LoopKind } from "./book-health-view.js";
import { REFUSAL_LABEL } from "./decision-json-view.js";

/**
 * LOOPING — the "evergreen" play (#5493 slice 1): one that looks on but goes round and round. The
 * cheapest real failure the book can hide, because a quiet heartbeat reads the same whether a play
 * had nothing to do or was refused every time it tried (the long call on a level-1 account would
 * have shown here). Three shapes, all signals, never gates:
 *
 * - REFUSED — in its last session, the play proposed a trade on at least `loopingCycles` passes and
 *   the guards refused it for one same reason on every one of them.
 * - OPEN, NO ENTRY — its verdict read "flat" (window open, nothing held) on every check of its last
 *   `loopingSessions` sessions, and no intent of it passed the guards nor was any order of it placed.
 * - NO WINDOW — "no window" on every check of its last `loopingSessions` sessions. A pre-print play
 *   between prints reads this way by design; the finding says so plainly rather than calling it a
 *   fault, and the owner judges whether a play with nothing to do should stay on.
 *
 * "Tactical" verdicts (rule chains with no window state) are never read as either verdict shape.
 * The refused shape reads the passes on hand (a page, minutes long); the verdict shapes read those
 * plus the week's grouped verdicts and placed trades, the only multi-session horizon served today.
 */

export interface LoopingInput {
  /** The passes on hand from the last session, newest first. */
  readonly session: readonly DecisionRecord[];
  /** Every pass on hand, newest first. */
  readonly records: readonly DecisionRecord[];
  readonly week?: { readonly rows: CheckWeekRows; readonly bucketMs: number } | undefined;
  readonly subscriptions: readonly PlaybookSubscription[];
}

interface DayRead {
  readonly states: Set<PlaybookVerdictState>;
  entered: boolean;
}

const dayOf = (at: number): string => marketDayKey(new Date(at).toISOString());

/** The one guard reason that refused the play on every pass it proposed on, if any. */
function refusedEveryCycle(
  session: readonly DecisionRecord[],
  playbookId: string,
  minCycles: number,
): { readonly reason: GuardRefusalReason; readonly cycles: number } | undefined {
  const proposing = session.filter((r) => r.rawIntents.some((i) => i.playbookId === playbookId));
  if (proposing.length < minCycles) return undefined;
  let common: Set<GuardRefusalReason> | undefined;
  for (const record of proposing) {
    const reasons = new Set(
      (record.refusals ?? [])
        .filter((refusal) => refusal.intent.playbookId === playbookId)
        .map((refusal) => refusal.reason),
    );
    common = common ? new Set([...common].filter((reason) => reasons.has(reason))) : reasons;
    if (common.size === 0) return undefined;
  }
  const reason = common ? [...common][0] : undefined;
  return reason ? { reason, cycles: proposing.length } : undefined;
}

/** Per market day, the verdicts a play gave and whether anything of it got through. */
function verdictDays(playbookId: string, input: LoopingInput): Map<string, DayRead> {
  const days = new Map<string, DayRead>();
  const day = (key: string): DayRead => {
    const found = days.get(key) ?? { states: new Set(), entered: false };
    days.set(key, found);
    return found;
  };
  for (const record of input.records) {
    const read = day(dayOf(record.at));
    for (const v of record.playbookVerdicts ?? []) {
      if (v.playbookId === playbookId) read.states.add(v.state);
    }
    if (record.guardedIntents.some((i) => i.playbookId === playbookId && opensRisk(i))) {
      read.entered = true;
    }
  }
  const week = input.week;
  for (const row of week?.rows.verdicts ?? []) {
    if (row.playbookId === playbookId && week)
      day(dayOf(row.bucket * week.bucketMs)).states.add(row.state);
  }
  for (const trade of week?.rows.trades ?? []) {
    if (trade.playbookId === playbookId) day(dayOf(trade.at)).entered = true;
  }
  return days;
}

function verdictLoop(
  playbookId: string,
  input: LoopingInput,
  sessions: number,
): "no-window" | "open-no-entry" | undefined {
  const days = [...verdictDays(playbookId, input)]
    .filter(([, read]) => read.states.size > 0)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, sessions)
    .map(([, read]) => read);
  if (days.length < sessions) return undefined;
  const only = (state: PlaybookVerdictState) =>
    days.every((read) => [...read.states].every((s) => s === state));
  if (only("no-window")) return "no-window";
  if (only("flat") && days.every((read) => !read.entered)) return "open-no-entry";
  return undefined;
}

/** Every play the passes, the week or the subscriptions mention. */
function playIds(input: LoopingInput): string[] {
  const ids = new Set(input.subscriptions.map((s) => s.playbookId));
  for (const record of input.records) {
    for (const i of record.rawIntents) if (i.playbookId) ids.add(i.playbookId);
    for (const v of record.playbookVerdicts ?? []) ids.add(v.playbookId);
  }
  for (const row of input.week?.rows.verdicts ?? []) ids.add(row.playbookId);
  return [...ids];
}

export function detectLooping(input: LoopingInput, reading: BookReading): HealthFinding[] {
  const { loopingCycles, loopingSessions } = reading.thresholds;
  return playIds(input).flatMap((playbookId): HealthFinding[] => {
    const name = capitalized(playName(playbookId, reading.ownerView));
    const refused = refusedEveryCycle(input.session, playbookId, loopingCycles);
    if (refused) {
      return [
        finding(
          playbookId,
          refused.reason,
          refused.cycles,
          loopingCycles,
          `${name} asked to trade on ${refused.cycles} checks in its last session and was refused every time: ${REFUSAL_LABEL[refused.reason]}.`,
        ),
      ];
    }
    const loop = verdictLoop(playbookId, input, loopingSessions);
    if (!loop) return [];
    const words =
      loop === "no-window"
        ? `${name} found no window on every check in its last ${loopingSessions} sessions: it is switched on and has had nothing to do.`
        : `${name} read its window as open on every check in its last ${loopingSessions} sessions and entered nothing.`;
    return [finding(playbookId, loop, loopingSessions, loopingSessions, words)];
  });
}

function finding(
  playbookId: string,
  loop: LoopKind,
  reading: number,
  threshold: number,
  words: string,
): HealthFinding {
  return { detector: "looping", level: "signal", playbookId, reading, threshold, loop, words };
}
