// Type surface for drift-wave.mjs, the same arrangement as is-main.d.mts: the scripts/ tree is
// plain ESM with `allowJs` off, so a spec that imports from it needs this.

export type DriftCommit = { subject: string; body: string };

export type DriftVerdict = {
  /** The item label from the check commit's subject, or null when there is no check commit. */
  label: string | null;
  /** land · flags-only · platter · unrefuted · unapplied · all-refuted · no-proposal */
  state: string;
  /** The flags that held, one line each. */
  flags: string[];
  reason: string;
};

/** Decide one item branch from its commits since main, the files it touches, and which are protected. */
export function classify(branch: {
  commits: DriftCommit[];
  files: string[];
  protectedFiles: string[];
}): DriftVerdict;

/** Item branches for one round, grouped per item, newest `-r<n>` re-run first; the wave branch is skipped. */
export function itemBranches(names: string[], at7: string): string[][];
