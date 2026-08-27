// Type surface for the parts of envelope-scan.mjs that carry logic worth testing directly — the
// same arrangement postmaster.d.mts and ci-medic-logs.d.mts make, and for the same reason: the
// scripts/ tree is plain ESM with `allowJs` off, so a spec that imports from it needs this rather
// than a repo-wide loosening.
/** How diffAware's exemption test reads one file's unified diff — null on "no change at all",
 *  since that must never look like "safe" to a caller deciding whether to hold. */
export function classifyDiff(diffText: string | null | undefined): {
  pureInsertion: boolean;
  addsNewMutatingCall: boolean;
  additiveSafe: boolean;
} | null;
/** The rule a path breaches, or null. */
export function breachOf(
  path: string,
  protectedRules?: ReadonlyArray<{ pattern: string; why: string; diffAware?: boolean }>,
): { pattern: string; why: string; diffAware?: boolean } | null;
/** Runtime dependencies added relative to the base's package.json. */
export function addedRuntimeDeps(basePkgJson: string, headPkgJson: string): string[];
