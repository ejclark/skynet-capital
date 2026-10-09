// Type surface for grade-core.mjs — scripts/ is plain ESM with `allowJs` off, so the spec that
// imports it needs this (same arrangement as metrics.d.mts).

export type EvaluatorClass = "members" | "experts" | "words" | "instruments";
export type Level = "structural" | "surface";
export type CheckVerdict = "real" | "false" | "world-artifact";

export interface GoldItem {
  id: string;
  tier: "main" | "known-gap" | "readers-only";
  title: string;
}
export interface MatchEntry {
  finding: string;
  gold: string | null;
  score: number;
}
export interface Check {
  finding: string;
  verdict: CheckVerdict | string;
  same_as?: string;
}
export interface Finding {
  id: string;
  level: Level | string;
  class?: EvaluatorClass | string;
  member?: string | null;
  [key: string]: unknown;
}
export interface Interval {
  lo: number;
  hi: number;
}
export interface Consensus {
  gold: string | null;
  score: number;
  disputed: boolean;
  resolvedBy: "agreed" | "tie-break" | "unresolved";
  m1: { gold: string | null; score: number } | null;
  m2: { gold: string | null; score: number } | null;
  tiebreak: { gold: string | null; score: number } | null;
}
export interface Agreement {
  n: number;
  observed: number | null;
  expected: number | null;
  kappa: number | null;
}
export interface Thoroughness {
  found: number;
  full: number;
  partial: number;
  renders: number;
  rate: number | null;
  wilson: Interval | null;
  ids: string[];
}
export interface Validity {
  reported: number;
  real: number;
  worldArtifacts: number;
  false: number;
  unchecked: number;
  rate: number | null;
}
export interface ControlResult {
  kind: "negative" | "positive";
  ran: boolean;
  pass: boolean;
  why: string;
  expect?: string[];
  found?: string[];
}
export interface Gate {
  pass: boolean;
  checks: { name: string; need: string; value: unknown; pass: boolean }[];
  kill: { met: boolean; why: string[] };
}

export const CLASSES: EvaluatorClass[];
export const BLIND: EvaluatorClass[];

export function parseGold(md: string): GoldItem[];
export function wilson(k: number, n: number, z?: number): Interval | null;
export function cohenKappa(pairs: [string, string][]): Agreement;
export function consensus(args: {
  ids: string[];
  m1: MatchEntry[];
  m2: MatchEntry[];
  tiebreak?: MatchEntry[];
}): { byId: Map<string, Consensus>; agreement: Agreement; problems: string[] };
export function bestScores(
  findings: Finding[],
  byId: Map<string, Consensus>,
  classes: string[] | null,
): Map<string, number>;
export function thoroughness(renderIds: string[], best: Map<string, number>): Thoroughness;
export function primedSplit(args: {
  renderIds: string[];
  findings: Finding[];
  byId: Map<string, Consensus>;
  primes: Record<string, string[]>;
}): {
  primed: string[];
  unprimed: string[];
  unprimedRate: number | null;
  unprimedWilson: Interval | null;
};
export function verdictOf(
  f: Finding,
  byId: Map<string, Consensus>,
  checks: Map<string, Check>,
): "matched" | CheckVerdict | "unchecked";
export function validity(
  findings: Finding[],
  byId: Map<string, Consensus>,
  checks: Map<string, Check>,
): Validity;
export function newProblems(args: {
  findings: Finding[];
  byId: Map<string, Consensus>;
  checks: Map<string, Check>;
  mainIds: string[];
  level: Level;
}): NewProblems;
export interface NewProblems {
  count: number;
  /** New problems: representative finding id → the counted finding ids in its `same_as` group. */
  groups: Record<string, string[]>;
  /** Groups that re-found a known gap or readers-only key item — not new, not counted. */
  refound: Record<string, { ids: string[]; gold: string[] }>;
  /** Groups an unsettled dispute ties to a key item — not counted until settled. */
  held: Record<string, { ids: string[]; candidates: string[] }>;
}
export function easyMode(sessions: { success: boolean; ease: number | null }[]): {
  sessions: number;
  successRate: number | null;
  medianEase: number | null;
  flagged: boolean;
};
export function controlVerdict(
  kind: "negative" | "positive",
  control: { expect: string[]; findings: Finding[]; byId: Map<string, Consensus> } | null,
): ControlResult;
export function cycleGate(args: {
  recall: number | null;
  validity: number | null;
  structural: number;
  negative: ControlResult;
  positive: ControlResult;
}): Gate;
