// Type surface for scripts/comms-scan.mjs (see moneypenny/index.d.mts for why scripts/ ships
// hand-written declarations instead of `allowJs`). Only what a spec imports is declared.

/** The `git log --since` value for a window start: a date (merged after that day) or a zoned ISO
 *  instant (merged from that moment on, #5056). Throws on anything else. */
export function gitSince(since: string): string;
