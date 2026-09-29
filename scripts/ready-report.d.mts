// Type surface for ready-report.mjs (see issue-readiness.d.mts for why scripts/ carries these).
export interface ReportRow {
  number: number;
  title: string;
  labels: string[];
  prs: number | null;
  subIssues: number;
  notes: string[];
}
export function reportRow(issue: {
  number: number;
  title: string;
  labels?: Array<string | { name: string }>;
  body?: string | null;
  sub_issues_summary?: { total: number };
}): ReportRow;
export function renderReport(rows: ReportRow[], label?: string): string;
