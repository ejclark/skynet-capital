// Type surface for round-control.mjs (`allowJs` is off) — the pure parts a spec imports.

export function sourceProblems(args: {
  source: { control?: unknown; profileSha?: string; stub?: string | null; sealed?: string } | null;
  frozen: { sha256?: string } | null;
  /** The freeze the main round's sessions were planned on (its log); null when they never ran. */
  ranFrozen?: string | null;
  profileSha: string;
  /** This run's own stub dir and sealed dir. */
  stub?: string | null;
  sealed?: string;
}): string[];
export function cardMismatches(
  source: Record<string, string> | null | undefined,
  now: Record<string, string> | null | undefined,
): string[];
export function factDrift(
  tasks: { id: string; fact: string; world: string; answer: unknown }[],
  facts: { id: string; world?: string; answer: unknown }[],
): { task: string; fact: string; drift: "missing" | "answer" }[];
export interface ExpectEntry {
  id: string;
  /** What the fix removed (negative) or the defect planted (positive); null when not stated. */
  mechanism: string | null;
}
export function expectEntries(list: unknown[]): ExpectEntry[];
export function expectIds(list: unknown[]): string[];
export function expectProblems(kind: "negative" | "positive", entries: ExpectEntry[]): string[];
