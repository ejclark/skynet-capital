// Type surface for code-lines.mjs — same arrangement as plan-closure-scan.d.mts: the scripts/ tree
// is plain ESM with `allowJs` off, so a spec that imports from it needs this rather than a
// repo-wide loosening.
/** Lines of `source` that are neither blank nor a whole-line comment. */
export function codeLineCount(source: string): number;

/** Every line of `source` classified as code, comment or blank; `code + comment + blank === physical`. */
export function lineBreakdown(source: string): {
  code: number;
  comment: number;
  blank: number;
  physical: number;
};
