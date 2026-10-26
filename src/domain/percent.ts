/**
 * Percent formatters for a share or fraction (`0.25` → "25%") — the one home for the two shapes
 * that were pasted file by file (`dupe:scan`, `pct` defined 8x in src/ with five behaviours).
 *
 * Only the byte-identical copies live here; the copies that looked alike but rounded or signed
 * differently were renamed for what they do where they stand (`tenthPct`, `pointsPct`,
 * `formatSignedPercent`), their bodies untouched.
 */

/** `0.256` → `"26%"`: a share to a whole point. */
export const wholePct = (share: number): string => `${Math.round(share * 100)}%`;

/** `0.02, 1` → `"2.0%"`: a fraction to `digits` decimals (default none), via `toFixed`. */
export const fixedPct = (x: number, digits = 0): string => `${(x * 100).toFixed(digits)}%`;
