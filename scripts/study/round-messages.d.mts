// Type surface for round-messages.mjs (`allowJs` is off).

export function framerText(args: { cards: Record<string, string>; pages: string[] }): string;
export function taskAuthorText(args: {
  card: string;
  jobMap: unknown;
  facts: { id: string; label?: string; display?: string; weak?: boolean }[];
  tasksPer: number;
  previous?: unknown;
  feedback?: string[];
}): string;
export function recorderView(f: {
  kind: string;
  severity: string;
  snippet?: string;
  what?: string;
  fix?: string;
}): { kind: string; severity: string; near?: string };
export function analystText(args: {
  card: string;
  sessions: Record<string, unknown>[];
  dropped: number;
  coreDropped?: number;
}): string;
export function expertBatchText(args: {
  cards: Record<string, string>;
  batch: { route: string; viewport: string; entries: unknown[] };
  frames: { label: string; order: number; name: string; which: string }[];
  n: number;
  of: number;
}): string;
export function expertConsolidationText(args: {
  cards: Record<string, string>;
  batchFindings: { id: string; finding: unknown }[];
  impressions: unknown[];
}): string;
export function wordsText(args: {
  cards: Record<string, string>;
  strings: { routes: unknown };
}): string;
export function auditText(args: { cards: Record<string, string> }): string;
