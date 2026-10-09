// Type surface for facts-sheet.mjs (`allowJs` is off; same arrangement as ../lint.d.mts).

export type Answer =
  | { kind: "number"; value: number; abs?: number; rel?: number }
  | { kind: "text"; value: string };

export interface Fact {
  viewer: string;
  account: string;
  own: boolean;
  id: string;
  label: string;
  answer: Answer;
  display: string;
  answerRegion: string[];
  weak: boolean;
}

export const VERDICT_WORDS_MIRROR: Record<string, string>;
export function parseAmount(text: unknown): number | null;
export function occParts(
  symbol: unknown,
): { root: string; expiry: string; type: "put" | "call"; strike: number } | null;
export function shortDate(iso: string): string;
export function nyDate(iso: string): string;
export function rowStamp(iso: string): string;
export function dataNames(payloads: Record<string, unknown>): string[];
export function weakRegion(snippet: unknown): boolean;
export function factSheet(opts: {
  viewer: string;
  instant: string;
  payloads: Record<string, unknown>;
  verdictWords?: Record<string, string>;
  activityRows?: number;
  calendarDays?: number;
}): Fact[];
