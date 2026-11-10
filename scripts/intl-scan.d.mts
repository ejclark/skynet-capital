// Type surface for intl-scan.mjs's site finder, so tests/arch/intl.spec.ts can test the rules
// directly — the same arrangement whole-read-scan.d.mts makes (scripts/ is plain ESM, `allowJs` off).
/** Every Intl formatter built inside a function body in one file's source, by read and 1-based line. */
export function sitesIn(text: string): Array<{ read: string; line: number }>;
