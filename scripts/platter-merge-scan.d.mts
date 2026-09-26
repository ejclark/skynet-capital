// Type surface for the parts of platter-merge-scan.mjs worth testing directly — same arrangement
// as plan-closure-scan.d.mts: the scripts/ tree is plain ESM with `allowJs` off, so a spec that
// imports from it needs this rather than a repo-wide loosening.

/** The `git log` format the parser expects: sha, parents, subject, body, one record per commit. */
export const LOG_FORMAT: string;

export interface PlatterCommit {
  sha: string;
  parents: string[];
  subject: string;
  body: string;
}

export interface PlatterItem {
  /** The item branch, from the ledger's `item` column. */
  item: string;
  /** The item's Conventional-Commit subject, from the ledger's `why` column. */
  why: string;
  /** The short sha the ledger promises reverts this item alone. */
  revert: string;
}

export interface PlatterLanding {
  sha: string;
  pr: number | null;
  subject: string;
  /** True when the landing has fewer than two parents — a squash, so no item reverts alone. */
  flattened: boolean;
  items: PlatterItem[];
}

/** Records from a `git log --format=LOG_FORMAT` dump, newest first, order preserved. */
export function parseLog(text: string): PlatterCommit[];
/** Is this commit a platter landing, by its subject or the ledger caption in its body? */
export function isPlatterLanding(commit: Pick<PlatterCommit, "subject" | "body">): boolean;
/** The PR number the subject or merge-commit body carries, or null for a direct push. */
export function prNumber(commit: Pick<PlatterCommit, "subject" | "body">): number | null;
/** The ledger rows in a commit message, rejoining rows GitHub hard-wrapped mid-cell. */
export function ledgerItems(body: string): PlatterItem[];
/** Every platter landing in the log, each tagged with whether its items revert alone. */
export function landings(records: PlatterCommit[]): PlatterLanding[];
