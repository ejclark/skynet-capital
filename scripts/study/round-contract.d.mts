// Type surface for round-contract.mjs (`allowJs` is off; same arrangement as grade-core.d.mts).

export type EvaluatorClass = "members" | "experts" | "words" | "instruments";
export type Voice = "member-voiced" | "instrument-only";

export const CLASSES: EvaluatorClass[];
export const BLIND: EvaluatorClass[];
export const VOICES: Voice[];
export const FILES: Record<
  | "findings"
  | "unlabelled"
  | "classes"
  | "m1"
  | "m2"
  | "tiebreak"
  | "checks"
  | "touches"
  | "struck"
  | "control"
  | "grade",
  string
>;
export const SESSIONS: string;

export interface SessionParts {
  member: string;
  world: string;
  viewport: string;
  task: string;
  run: number;
}
export function sessionDir(s: SessionParts): string;
export function parseSessionDir(rel: string): SessionParts | null;
export function membersClass(voice: unknown): { class: "members"; voice: Voice };
export function classProblems(
  f: { id: string; class?: string; member?: string | null; voice?: unknown },
  cls?: string,
): string[];
export function findingView(f: Record<string, unknown>): {
  id: string;
  what: string;
  level: string;
  severity: string | null;
  member: string | null;
  voice: Voice | null;
  expert: number | null;
  quote: string | null;
  principle: string | null;
  why: string | null;
  fix: string | null;
  where: string | null;
  frames: string[];
};
