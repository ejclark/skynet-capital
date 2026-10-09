// Type surface for actor-sealed.mjs — same arrangement as metrics.d.mts (`allowJs` is off).

import type { Turn } from "./actor-turn.mjs";

import type { UserMessage } from "./sealed.mjs";

export type { Block, UserMessage } from "./sealed.mjs";

export function turnLine(
  turn: Partial<Turn> & Pick<Turn, "as_member" | "expect">,
  i: number,
): string;
export function stepsLine(remaining: number): string;
export function actorMessage(args: {
  card: string;
  device: string;
  scenario: string;
  turns: (Partial<Turn> & Pick<Turn, "as_member" | "expect">)[];
  prevFrame: string | null;
  frame: string;
  size: { width: number; height: number };
  remaining: number;
}): UserMessage;
export function easeMessage(args: {
  card: string;
  device: string;
  scenario: string;
  turns: (Partial<Turn> & Pick<Turn, "as_member" | "expect">)[];
}): UserMessage;
