// Type surface for scripts/moneypenny/pr-issues.mjs — the pure "which issues does a PR name" rules
// #4393 slice 1 added. The scripts/ tree is plain ESM with `allowJs` off (see index.d.mts).
export const REPO: string;
export const LANE_CLASSES: Record<string, string>;

/** The machine lane a branch belongs to (`research`, `moneypenny`, …), or null. */
export function laneClassOf(headRef: unknown): string | null;

/** The issue number a non-lane branch name carries, or null. */
export function branchIssueOf(headRef: unknown): number | null;

/** Every issue number a PR names, ascending and de-duplicated. */
export function derivePrIssues(pr?: {
  title?: string | null;
  body?: string | null;
  headRef?: string | null;
  repo?: string;
}): number[];

/** True when a PR names no issue and is not a machine lane's — invisible to the board. */
export function namesNoIssue(pr?: {
  title?: string | null;
  body?: string | null;
  headRef?: string | null;
  repo?: string;
}): boolean;
