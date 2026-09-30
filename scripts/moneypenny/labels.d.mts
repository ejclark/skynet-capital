// Type surface for the parts of labels.mjs a spec imports directly — same arrangement as
// index.d.mts: the scripts/ tree is plain ESM with `allowJs` off. Only what a spec needs is declared.

/** The issue a claim-lease slug names (`feedback-12` / `plan-12` → 12), or null (#3960). */
export function issueNumberFromSlug(slug: unknown): number | null;
/** Put `in-progress` on or take it off an issue; best-effort, false on a failed write (#3960). */
export function setInProgress(number: number | null | undefined, add: boolean): boolean;
