import type { AuditIntent } from "./audit.mjs";

/** The clock as one push tick reads it (#6470): the newest successful scheduled run's age. */
export interface ClockState {
  /** Hours since the newest successful scheduled run; null when none is on record (stopped). */
  hoursSince: number | null;
  newestSuccessAt: string | null;
  /** The open `[fitness] clock-running` issue, or null. */
  openIssue: { number: number; title?: string } | null;
}
export interface ClockIntent extends AuditIntent {
  kind: "open-clock-issue" | "close-clock-issue";
  body: string;
}

export const CLOCK_WORKFLOW: string;
export const CLOCK_STALE_HOURS: number;
export const CLOCK_ISSUE_TITLE: string;
export const CLOCK_RUNS_PATH: string;
export function clockIntents(state?: Partial<ClockState> | null): ClockIntent[];
export function readClock(
  nowMs: number,
  issues?: { number: number; title?: string }[],
  opts?: { rest?: (path: string) => unknown },
): ClockState;
export function clockOrUnknown(
  nowMs: number,
  issues?: { number: number; title?: string }[],
  opts?: { rest?: (path: string) => unknown; log?: (line: string) => void },
): ClockState | null;
export function openClockIssue(
  i: ClockIntent,
  opts?: { run?: (cmd: string, args: string[]) => string },
): string;
export function closeClockIssue(
  i: ClockIntent,
  opts?: { run?: (cmd: string, args: string[]) => string },
): string;
