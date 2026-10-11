// Type surface for match-core.mjs (`allowJs` is off; same arrangement as grade-core.d.mts).

import type { MatchEntry } from "./grade-core.mjs";

export interface Match extends MatchEntry {
  why?: string;
}
export interface UnlabelledFinding {
  id: string;
  [k: string]: unknown;
}
export interface ExpectEntry {
  id: string;
  mechanism?: string | null;
}
type Brief = { gold: string | null; score: number; why?: string } | null;
export type MatchCall<M> = (args: {
  role: string;
  n: number;
  message: M;
}) => Promise<{ matches?: Match[] } | Record<string, unknown>>;
type ByRole<T> = { m1: T; m2: T; tiebreak: T };
export interface MatchResult {
  m1: Match[];
  m2: Match[];
  tiebreak: Match[];
  disputed: string[];
  left: ByRole<string[]>;
  stray: ByRole<string[]>;
  calls: number;
}

export const CHUNK: number;
export function chunks<T>(list: T[], size?: number): T[][];
export function matcherText(args: {
  gold: string;
  expect?: ExpectEntry[];
  findings: UnlabelledFinding[];
  again?: boolean;
  answers?: { m1: Record<string, Brief>; m2: Record<string, Brief> } | null;
}): string;
export function coverage(
  givenIds: string[],
  matches: Match[] | undefined,
): { kept: Match[]; skipped: string[]; stray: string[] };
export function disputedIds(ids: string[], m1: MatchEntry[], m2: MatchEntry[]): string[];
export function runRole<M>(args: {
  role: string;
  findings: UnlabelledFinding[];
  call: MatchCall<M>;
  ask: (batch: UnlabelledFinding[], again: boolean) => M;
  size?: number;
}): Promise<{ matches: Match[]; left: string[]; stray: string[]; calls: number }>;
export function runMatch<M>(args: {
  findings: UnlabelledFinding[];
  gold: string;
  expect?: ExpectEntry[];
  call: MatchCall<M>;
  message: (text: string) => M;
  size?: number;
}): Promise<MatchResult>;
export function matchReport(
  total: number,
  result: MatchResult,
): { lines: string[]; complete: boolean };
