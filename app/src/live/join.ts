import { postJson } from "./post";

/**
 * Join-the-board's client model (#738 phase 9c) — mirrors `/api/join`. The pasted Alpaca key
 * pair is sent once and never displayed back; the SERVICE verifies it against Alpaca before
 * anything is stored, and ownership is stamped from the session server-side (#466) — this model
 * carries no identity at all.
 */

export interface PersonaClass {
  readonly id: string;
  readonly name: string;
  readonly thesis: string;
  readonly legend?: string;
}

export interface JoinIndex {
  readonly wired: boolean;
  readonly classes: readonly PersonaClass[];
  readonly timezones: readonly { readonly value: string; readonly label: string }[];
}

export async function fetchJoin(): Promise<JoinIndex> {
  const res = await fetch("/api/join", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`join ${res.status}`);
  return (await res.json()) as JoinIndex;
}

export type JoinResult =
  | { readonly ok: true; readonly id: string; readonly displayName: string }
  | { readonly ok: false; readonly error: string };

export const joinRequest = (input: {
  readonly displayName: string;
  readonly apiKey: string;
  readonly apiSecret: string;
  readonly kind: "human" | "bot";
  readonly personaId?: string;
  readonly timezone?: string;
}): Promise<JoinResult> => postJson("/api/join", input);
