// Type surface for stuck-pr-decide.mjs — the scripts/ tree is plain ESM with `allowJs` off, so a
// spec that imports from it needs this rather than a repo-wide loosening (same arrangement as
// incident-runs.d.mts).

export const REQUIRED_CHECKS: string[];
export const DEFAULT_HOURS: number;

export interface Suite {
  id?: number;
  app?: { slug?: string };
  status?: string;
  conclusion?: string | null;
  latest_check_runs_count?: number;
  created_at?: string;
}
export interface CheckRun {
  name: string;
  status?: string;
  conclusion?: string | null;
  completed_at?: string | null;
  started_at?: string | null;
}
export interface PrFacts {
  number: number;
  title?: string;
  html_url?: string;
  draft?: boolean;
  created_at?: string;
  labels?: { name: string }[];
  auto_merge?: unknown;
  mergeable_state?: string;
  user?: { login?: string };
}
export interface Stuck {
  number: number;
  kind: "blocked" | "unarmed" | "headless";
  hours: number;
  why: string;
  ghosts: Suite[];
  fix: string;
}

export function isGhostSuite(suite: Suite | undefined): boolean;
export function judgePr(input: {
  pr: PrFacts;
  checkRuns: CheckRun[];
  suites: Suite[];
  now?: number;
  hours?: number;
  required?: string[];
}): Stuck | null;
export function describe(stuck: Stuck): string;
export function stuckLine(stuck: Stuck[] | null): string;
/** Is this branch named in an open `platter/` PR's ledger? Built once from the open PR list. */
export function boardedBranches(
  openPrs?: { head?: { ref?: string }; body?: string | null }[],
): (ref: string) => boolean;
/** Why a stuck PR is left to Eric's merge (envelope-protected or platter-boarded), or null. */
export function exemptReason(input: {
  pr: { head?: { ref?: string } };
  files?: string[];
  isProtected: (path: string) => boolean;
  isBoarded: (ref: string) => boolean;
}): string | null;
