// Type surface for the part of ledger.mjs worth testing directly — same arrangement as
// platter-merge-scan.d.mts: the scripts/ tree is plain ESM with `allowJs` off, so a spec that
// imports from it needs this rather than a repo-wide loosening.

/** The two fields of a ledger row the dead-end count reads. */
export interface DeadEndRow {
  kind: string;
  what: string;
}

/**
 * Which of the plan's eight dead ends are still open (`found`, from `known gap` rows only), which
 * are not (`missing`), and which have a passing step and no failing one (`fixed`).
 */
export function countDeadEnds(rows: DeadEndRow[]): {
  found: number[];
  missing: number[];
  fixed: number[];
};
