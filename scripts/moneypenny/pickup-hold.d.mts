// Type surface for pickup-hold.mjs — same arrangement as continuation.d.mts: the scripts/ tree is
// plain ESM with `allowJs` off, so a spec that imports from it needs this.
import type { RestComment } from "./state-block.mjs";

export interface HoldIssue {
  readonly number: number;
  readonly labels?: ReadonlyArray<{ name?: string } | string>;
}

export interface HoldSubIssue {
  readonly number: number;
  readonly state?: string;
  readonly title?: string;
  readonly body?: string;
}

export const BLOCKER_READS: number;
export function nextSubIssue<T extends HoldSubIssue>(
  subIssues?: readonly T[],
  blockedBy?: Record<number, readonly { state?: string }[]>,
): T | null;
/** Sub-issues a held platter closes read as closed, with `boardedOn` set to the platter (#6530). */
export function withoutBoarded<T extends HoldSubIssue>(
  subIssues?: readonly T[] | null,
  boardedOn?: ReadonlyMap<number, number>,
): Array<T & { boardedOn?: number }>;
export function pickupHoldReason(input?: {
  issue?: HoldIssue;
  comments?: readonly RestComment[];
  subIssues?: readonly HoldSubIssue[];
  blockedBy?: Record<number, readonly { state?: string }[]>;
  boardedOn?: ReadonlyMap<number, number>;
  /** Decides a dated wait (`none until <day>`) only; defaults to the clock. */
  now?: number;
}): string | null;
/** The UTC day a `none until <YYYY-MM-DD>` pickup line's wait ends, or null. */
export function waitEndsOn(blockBody?: string): string | null;
export function readPickupHold(
  issue: HoldIssue,
  deps?: {
    readAll?: (path: string) => unknown[];
    read?: (path: string) => unknown;
    log?: (line: string) => void;
    now?: number;
  },
): string | null;
export function nextUnheld<T extends { number?: number }>(
  pool: T[],
  pickOf: (rest: T[]) => T | null | undefined,
  /** `rest` is the pool still in play, this pick included. */
  holdOf: (pick: T, rest: T[]) => string | null,
  opts?: { who?: string; log?: (line: string) => void },
): { pick: T | null; pool: T[] };
