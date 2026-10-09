// Type surface for actor-sealed.mjs — same arrangement as metrics.d.mts (`allowJs` is off).

import type { Turn } from "./actor-turn.mjs";

export type Block =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } };

export interface UserMessage {
  type: "user";
  message: { role: "user"; content: Block[] };
}

export function sealedArgs(opts: { rolePath: string; schema: string }): string[];
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
export function parseResult(stdout: string | null | undefined): Record<string, unknown>;
export function signedIn(
  run?: (
    cmd: string,
    args: string[],
    opts: { encoding: "utf8" },
  ) => { stdout?: string; error?: Error | null },
): { ok: boolean; why: string };
export function sealedCall(args: {
  rolePath: string;
  schema: string;
  message: UserMessage;
  timeoutMs?: number;
}): Record<string, unknown>;
export function halfFrame(browser: unknown, jpeg: Uint8Array): Promise<string>;
