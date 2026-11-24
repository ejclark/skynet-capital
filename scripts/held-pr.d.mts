// Type surface for held-pr.mjs (scripts/ ships hand-written declarations instead of `allowJs`).
import type { CheckRun } from "./stuck-pr-decide.mjs";

export const HOLD_MERGE: string;
export const HELD_GREEN_HOURS: number;
export const HELD_OPEN_HOURS: number;

type Named = string | { name?: string };
export interface HeldPr {
  number: number;
  title?: string;
  body?: string | null;
  state?: string;
  draft?: boolean;
  created_at?: string;
  labels?: Named[];
  head?: { ref?: string; sha?: string };
}
/** An open issue a held PR names; `plan` when it carries the `plan` label. */
export interface HeldBlock {
  number: number;
  title: string;
  plan: boolean;
}
export interface HeldFacts {
  /** ms when the head last went green; null when not green; undefined when the read failed. */
  greenAt?: number | null;
  blocks: HeldBlock[];
}
export function isHeldPr(pr: HeldPr | null | undefined): boolean;
export function greenSince(checkRuns?: CheckRun[]): number | null;
export function heldAge(
  pr: HeldPr,
  opts?: { greenAt?: number | null; now?: number },
): { number: number; title: string; openHours: number; greenHours: number | null };
export function heldDue(
  pr: HeldPr,
  opts?: { greenAt?: number | null; now?: number },
): { green: boolean; hours: number } | null;
export function blockedBy(
  pr: HeldPr,
  readIssue: (
    n: number,
  ) => { title?: string; state?: string; labels?: Named[]; pull_request?: unknown } | null,
): HeldBlock[];
export function readHeldFacts(
  prs?: HeldPr[],
  opts?: { read?: ((path: string) => unknown) | null; now?: number },
): Map<number, HeldFacts>;
export function blocksPhrase(blocks?: HeldBlock[]): string;
