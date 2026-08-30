// Type surface for the parts of plan-closure-scan.mjs worth testing directly — same arrangement
// as envelope-scan.d.mts: the scripts/ tree is plain ESM with `allowJs` off, so a spec that
// imports from it needs this rather than a repo-wide loosening.
/** Issue numbers a branch name plausibly embeds (2+ digit runs). */
export function candidateIssueNumbers(branch: string): string[];
/** Does the PR body already carry a GitHub auto-close keyword for this issue number? */
export function hasClosingKeyword(body: string, n: string): boolean;
