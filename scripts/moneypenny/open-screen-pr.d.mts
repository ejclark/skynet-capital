// Type surface for the part of open-screen-pr.mjs worth testing directly — same arrangement as
// plan-closure-scan.d.mts/envelope-scan.d.mts: the scripts/ tree is plain ESM with `allowJs` off,
// so a spec that imports from it needs this rather than a repo-wide loosening.

/** Classify a raw `enablePullRequestAutoMerge` GraphQL response body (as text). */
export function classifyAutoMergeResult(rawBody: string): "armed" | "already-clean" | "error";

/** True when an existing open PR already carries an unmerged screen commit. */
export function hasOpenScreenPr(openPrs: readonly { head?: { ref?: string } }[]): boolean;
