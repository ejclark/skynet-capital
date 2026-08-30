// Type surface for test-quality-scan.mjs — same arrangement as plan-closure-scan.d.mts/
// envelope-scan.d.mts: the scripts/ tree is plain ESM with `allowJs` off, so a spec that imports
// from it needs this rather than a repo-wide loosening.

/** Implementation-testing smell hits in one spec file's text. */
export function findSmells(text: string): { line: number; reason: string; text: string }[];
