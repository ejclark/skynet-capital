// Type surface for oracle.mjs — same arrangement as metrics.d.mts (`allowJs` is off).

import type { Action, Seen } from "./metrics.mjs";
import type { Task, TaskAnswer } from "./task-file.mjs";

export const SEEN_MIN: number;
export const MAX_NUMBERS: number;

export function numbersIn(text: string | null | undefined): number[];
export function tokens(text: string | null | undefined): string[];
export function withinTolerance(
  n: number,
  expected: { value: number; abs?: number; rel?: number; ignoreSign?: boolean },
): boolean;
export function gradeAnswer(
  given: string | null | undefined,
  expected: TaskAnswer | null | undefined,
): { matched: boolean; why: string };
export function regionSeen(
  frames: (Seen[] | null | undefined)[],
  region: string | string[],
): { seen: boolean; frame: number | null; ratio: number };

export interface Verdict {
  success: boolean;
  endedBy: "done" | "give_up" | "cap";
  answer: { given: string | null; matched: boolean; why: string };
  region: { seen: boolean; frame: number | null; ratio: number };
  reason: string;
}

export function grade(args: {
  task: Pick<Task, "answer" | "answerRegion">;
  opening: { seen?: Seen[] } | null | undefined;
  /** Trace records as session.mjs writes them; only these fields are read. */
  trace: { action: Action; refused?: string; seen?: Seen[] }[];
}): Verdict;
