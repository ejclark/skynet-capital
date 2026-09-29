// Type surface for issue-readiness.mjs — scripts/ is plain ESM with `allowJs` off, so a spec that
// imports from it needs this (same arrangement as issues.d.mts).
export const MAX_UNIT_PRS: number;
export const PARKING_LABELS: string[];
export function parkedBy(labels?: string[]): string[];
export function sizeCell(body: string): string | null;
export function declaredPrs(cell: string | null): number | null;
export function protectedPaths(body: string, rules?: Array<{ pattern: string }>): string[];
export function readinessNotes(issue?: {
  title?: string;
  body?: string;
  labels?: string[];
}): string[];
