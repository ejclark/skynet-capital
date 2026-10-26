// Type surface for the part of open-screen-pr.mjs worth testing directly — same arrangement as
// plan-closure-scan.d.mts/envelope-scan.d.mts: the scripts/ tree is plain ESM with `allowJs` off,
// so a spec that imports from it needs this rather than a repo-wide loosening.

/** Classify a raw `enablePullRequestAutoMerge` GraphQL response body (as text). */
export function classifyAutoMergeResult(rawBody: string): "armed" | "already-clean" | "error";

type OpenPr = {
  number?: number;
  head?: { ref?: string };
  labels?: { name?: string }[];
};

/** True when an open screen PR exists that could still merge — a parked one never counts. */
export function hasOpenScreenPr(openPrs: readonly OpenPr[]): boolean;

/** The open screen PRs carrying `conflict-flagged`, `needs-eric` or `hold-merge`. */
export function parkedScreenPrs<T extends OpenPr>(openPrs: readonly T[]): T[];
