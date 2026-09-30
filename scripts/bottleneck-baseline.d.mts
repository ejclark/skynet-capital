// Type surface for bottleneck-baseline.mjs — same arrangement as research-scorecard.d.mts (scripts/
// is plain ESM with `allowJs` off, so a spec importing it needs this).

export const CONTRACT_DATE: string;

export interface Baseline {
  before: string | null;
  after: string | null;
}
export function readBaseline(body: string | null | undefined): Baseline;

export interface IssueRow {
  number: number;
  title?: string;
  body?: string | null;
  state?: string;
  created_at?: string;
  pull_request?: unknown;
}
export interface BaselineReport {
  total: number;
  legacy: number;
  missingBefore: number[];
  closedMissingAfter: number[];
  scored: number[];
  withBefore: number;
  current: number;
  rows: Array<Baseline & { number: number; title: string; state: string; legacy: boolean }>;
}
export function baselineReport(
  issues: IssueRow[],
  opts?: { contractDate?: string },
): BaselineReport;
export function renderReport(report: BaselineReport): string;
