// Type surface for the parts of envelope-scan.mjs that carry logic worth testing directly — the
// same arrangement postmaster.d.mts and moneypenny-repair-logs.d.mts make, and for the same reason: the
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
/** Token-level safe widening (#716/#858): is every token that existed in `oldSource` still present,
 *  in the same order, in `newSource`, with the spliced-in tokens introducing no new mutating broker
 *  call? Fails closed (false) on an unterminated lexical construct or any unmatched old token. */
export function classifyStructuralWidening(oldSource: string, newSource: string): boolean;
/** The command that runs one spec file, as [cmd, args] — overridable via ENVELOPE_SUITE_RUNNER so a
 *  hermetic fixture can substitute a trivial always-pass/always-fail command instead of a real run. */
export function suiteRunnerArgv(specPath: string): [string, string[]];
/** Pure — #852's behavior-verified gate. All three or nothing: a registered suite, one this diff
 *  didn't touch, actually passing right now. */
export function behaviorVerifiedFacts(facts: {
  hasSuite: boolean;
  suiteUnchanged: boolean;
  suitePassed: boolean;
}): boolean;
