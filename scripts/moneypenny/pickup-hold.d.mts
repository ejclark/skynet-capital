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
export function pickupHoldReason(input?: {
  issue?: HoldIssue;
  comments?: readonly RestComment[];
  subIssues?: readonly HoldSubIssue[];
  blockedBy?: Record<number, readonly { state?: string }[]>;
}): string | null;
export function readPickupHold(
  issue: HoldIssue,
  deps?: {
    readAll?: (path: string) => unknown[];
    read?: (path: string) => unknown;
    log?: (line: string) => void;
  },
): string | null;
export function nextUnheld<T extends { number?: number }>(
  pool: T[],
  pickOf: (rest: T[]) => T | null | undefined,
  holdOf: (pick: T) => string | null,
  opts?: { who?: string; log?: (line: string) => void },
): { pick: T | null; pool: T[] };
