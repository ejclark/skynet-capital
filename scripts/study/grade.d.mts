// Type surface for grade.mjs (`allowJs` is off; same arrangement as grade-core.d.mts).

import type { RoundInput } from "./grade-round.mjs";

export interface GradeOptions {
  sealed: string;
  round: string;
  struck?: string;
  negative?: string;
  positive?: string;
  out?: string;
  files?: Partial<Record<"m1" | "m2" | "tiebreak" | "checks" | "touches", string>>;
}

export function gradeArgs(argv: string[]): GradeOptions;
export function loadRound(opts: GradeOptions): RoundInput;
