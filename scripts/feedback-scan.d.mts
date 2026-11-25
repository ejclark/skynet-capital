// Type surface for feedback-scan.mjs (#8289) — scripts/ is plain ESM with `allowJs` off.
/** A closing PR in the shape the scorers read. */
export interface ClosingPr {
  state: "MERGED" | "UNMERGED";
  createdAt: string;
}
export const PR_BATCH: number;
export function closingPrQuery(numbers: number[]): string;
export function closingPrOf(node: unknown): ClosingPr | undefined;
export function readClosingPrs(
  numbers: number[],
  opts?: {
    repo?: string;
    send?: (query: string, variables: Record<string, string>) => unknown;
    read?: (path: string) => unknown;
    log?: (line: string) => void;
  },
): Map<number, ClosingPr | undefined>;
export function firstAnswerAt(issue: unknown): number | null;
export function outcomeOf(issue: unknown, notes?: string[]): Record<string, unknown>;
export function roundsOf(body?: string, onMalformed?: (why: string) => void): number | null;
export function unseenFilings(
  issues: unknown[],
  now?: number,
): { number: number; title: string; ageHours: number }[];
export function ageText(hours: number): string;
export function scoreboard(rows: unknown[]): Record<string, unknown>;
