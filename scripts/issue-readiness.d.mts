// Type surface for issue-readiness.mjs — scripts/ is plain ESM with `allowJs` off, so a spec that
// imports from it needs this (same arrangement as issues.d.mts).
export const MAX_UNIT_PRS: number;
export const PARKING_LABELS: string[];
export type LabelLike = string | { name?: string };
export function parkedBy(labels?: LabelLike[]): string[];
/** The one buildable test both claim paths and /work-issues share (#3818 slice 2). */
export function isBuildable(labels?: LabelLike[]): boolean;
export function sizeCell(body: string): string | null;
export function declaredPrs(cell: string | null): number | null;
export function protectedPaths(body: string, rules?: Array<{ pattern: string }>): string[];
export function readinessNotes(issue?: {
  title?: string;
  body?: string;
  labels?: string[];
}): string[];
