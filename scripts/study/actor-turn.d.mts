// Type surface for actor-turn.mjs — same arrangement as metrics.d.mts (`allowJs` is off). The
// turn shape is schemas/actor-turn.json.

import type { Action } from "./metrics.mjs";

export interface TurnAction {
  type: string;
  x?: number;
  y?: number;
  dir?: string;
  screens?: number;
  text?: string;
  nth?: number;
  key?: string;
  answer?: string;
  why?: string;
}

export interface Turn {
  as_member: string;
  noticed: string;
  candidates: { target: string; confidence: number }[];
  expect: string;
  last_expectation: { verdict: string; note: string };
  confusion: number;
  action: TurnAction;
  refused?: string;
  scripted?: number;
}

export interface Ease {
  score: number;
  reason: string;
}

export function turnProblems(turn: unknown): string[];
export function toAction(a: TurnAction | null | undefined): Action | { refused: string };
export function easeProblems(ease: Partial<Ease> | null | undefined): string[];
export function parseScript(text: string): { turns: Turn[]; ease: Ease };
