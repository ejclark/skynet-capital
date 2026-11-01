// Type surface for whole-read-scan.mjs's site finder, so tests/arch/whole-read.spec.ts can test the
// rules directly — the same arrangement envelope-scan.d.mts makes (scripts/ is plain ESM, `allowJs` off).
/** Every whole read of a growing ledger in one file's source, by read and 1-based line. */
export function sitesIn(text: string): Array<{ read: string; line: number }>;
