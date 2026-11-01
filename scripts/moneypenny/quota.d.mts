// Type surface for quota.mjs — same arrangement as work-mode.d.mts: the scripts/ tree is plain ESM
// with `allowJs` off, so a spec that imports from it needs this.
import type { WorkMode } from "./work-mode.mjs";

/** A weekly-limit reading: percent used, when it was read, when the week resets (ms). */
export interface Reading {
  readonly used: number;
  readonly at: number;
  readonly resetsAt: number;
}

/** A person's order, in his words, with its window as ISO times. */
export interface Order {
  readonly from: string;
  readonly until: string;
  readonly words: string;
}

export type PaceState = "blind" | "stand-down" | "ahead" | "behind" | "on-pace";

export interface Reckoning {
  readonly state: PaceState;
  readonly why: string;
  /** The one dial move a pace rule would have made, or null. A report, never a write. */
  readonly wouldSet: "conserve" | null;
  readonly reading: Reading | null;
  readonly gone?: number;
  readonly delta?: number;
}

export const BAND_POINTS: number;
export const STALE_AFTER_MS: number;

export function pace(reading: Reading): { gone: number; delta: number };
export function reckon(
  reading: Reading | null,
  opts?: { orders?: readonly Order[]; hand?: string | null; now?: number },
): Reckoning;
export function paceLine(reckoning: Reckoning): string;
export function wouldHaveDone(reckoning: Reckoning): string;
/** Pure: the weekly reading the newest `rate_limit_event` in a lane's result file carries, or null. */
export function readingFromExecutionOutput(
  text: string | null | undefined,
  opts?: { at?: number },
): Reading | null;

/** Write a reading into the tracking issue's body unless it already holds one at least as fresh. */
export function publishReading(
  reading: Reading | null,
  deps: {
    issue: number;
    source: string;
    read: () => { body?: string | null } | null;
    write: (body: string) => void;
  },
): { wrote: boolean; why: string };

export function tick(opts: {
  reading?: Reading | null;
  orders?: readonly Order[];
  now?: number;
  readDial?: () => Pick<WorkMode, "position" | "unreadable" | "reading">;
}): { line: string; verdict: Reckoning; position: string };
