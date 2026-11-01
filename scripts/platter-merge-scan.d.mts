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
  /** True when the landing has fewer than two parents — a squash; its items revert through `ship platter revert`. */
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
/** Every platter landing in the log, each tagged with the shape it landed in. */
export function landings(records: PlatterCommit[]): PlatterLanding[];

/** A landing whose items each carry whether their commit is still fetchable (null: not checked). */
export interface CheckedLanding extends Omit<PlatterLanding, "items"> {
  items: (PlatterItem & { fetchable: boolean | null })[];
}

/** Is each item's commit still fetchable — locally, or after one fetch of refs/pull/<pr>/head?
 *  `fetch` answers true (fetched), false (failed) or null (not tried, as under --offline). */
export function withFetchability(
  landing: PlatterLanding,
  reads: { exists: (sha: string) => boolean; fetch: (pr: number) => boolean | null },
): CheckedLanding;
