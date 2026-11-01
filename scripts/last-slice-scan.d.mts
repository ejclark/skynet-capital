// Type surface for last-slice-scan.mjs (scripts/ is plain ESM with `allowJs` off; see issues.d.mts).
export interface ClosedWithOpenSlices {
  number: number;
  title: string;
  closedAt: string;
  open: number;
  total: number;
}
export function closedWithOpenSlices(issues: Record<string, unknown>[]): ClosedWithOpenSlices[];
export function renderReport(
  rows: ClosedWithOpenSlices[],
  openSlices?: Record<number, number[]>,
): string;
