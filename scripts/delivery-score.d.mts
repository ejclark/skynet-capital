// Type surface for delivery-score.mjs (scripts/ is plain ESM with `allowJs` off; see issues.d.mts).
interface Rate {
  clean: number;
  n: number;
  pct: number;
}
interface Scored {
  n: number;
  outcome: string;
  reasons: string[];
  handoff: number;
}
export function cleanRate(rows: { outcome: string }[]): Rate;
export function contrastTable(
  rows: Record<string, unknown>[],
): { name: string; with: Rate; without: Rate }[];
export function buildsIssue(
  pr: { title?: string; body?: string | null; head?: string },
  n: number,
): boolean;
export function classify(input: {
  issue: Record<string, unknown>;
  events?: Record<string, unknown>[];
  prs: Record<string, unknown>[];
  now: number;
}): Scored | null;
export function agreement(
  ours: Record<string, string>,
  theirs: Record<string, string>,
): { shared: number; same: number; pct: number };
export function renderTable(rows: Record<string, unknown>[], heading: string): string;
