// Type surface for code-lines.mjs — same arrangement as plan-closure-scan.d.mts: the scripts/ tree
// is plain ESM with `allowJs` off, so a spec that imports from it needs this rather than a
// repo-wide loosening.
/** Lines of `source` that are neither blank nor a whole-line comment. */
export function codeLineCount(source: string): number;
