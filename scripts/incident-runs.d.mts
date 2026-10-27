// Type surface for incident-runs.mjs — same arrangement as bottleneck-baseline.d.mts (scripts/ is
// plain ESM with `allowJs` off, so a spec importing it needs this).

export const PER_PAGE: number;
export const MAX_PAGES: number;

export interface RunsPage {
  total_count?: number;
  workflow_runs?: unknown[];
}
export function readAllPages(
  fetchPage: (page: number) => RunsPage | Promise<RunsPage>,
  options?: { perPage?: number; maxPages?: number },
): Promise<{ runs: unknown[]; total: number; truncated: boolean }>;

export function windowRanges(
  days: number,
  now?: number,
): { since: string; window: string; agedOut: string };
export function agedOutCandidates<T extends { sha: string }>(
  runs: T[],
  p?: { windowShas?: Set<string>; isLearned?: (sha: string) => boolean },
): T[];
