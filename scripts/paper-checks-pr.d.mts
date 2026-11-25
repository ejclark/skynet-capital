// Type surface for paper-checks-pr.mjs — the scripts/ tree is plain ESM with `allowJs` off, so the
// spec that imports from it needs this.

export const ISSUE: number;
export const PARENT: number;
export function openPrOn<T extends { number?: number; head?: { ref?: string } }>(
  openPrs: readonly T[],
  branch: string,
): T | undefined;
export function unanswered(
  files: readonly { runs: readonly { rows: readonly { check: string; outcome: string }[] }[] }[],
  checks: readonly { id: string; notScriptable?: string }[],
): string[];
export function answersTable(readme: string): string[];
export function runLines(log: string, checks: readonly { id: string }[]): string[];
export function resultsPr(input: {
  readme: string;
  log: string;
  waiting: readonly string[];
  today: string;
}): { title: string; body: string };
