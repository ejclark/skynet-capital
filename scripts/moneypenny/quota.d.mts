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
export function tick(opts: {
  reading?: Reading | null;
  orders?: readonly Order[];
  now?: number;
  readDial?: () => Pick<WorkMode, "position" | "unreadable">;
}): { line: string; verdict: Reckoning; position: string };
