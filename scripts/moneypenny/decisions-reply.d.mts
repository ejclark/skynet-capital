// Type surface for scripts/moneypenny/decisions-reply.mjs (see index.d.mts).
import type { Answer } from "./answer-readback.mjs";

export interface ReplySegment {
  ref: number;
  hash: boolean;
  keys: string[];
  words: string[];
  prose: boolean;
  raw: string;
}
export interface PageEntry {
  n: number;
  issue: number;
  since?: number;
  until?: number | null;
  card?: { items: { keys: string[] }[] } | null;
}
export interface ReplyRead {
  applied: { issue: number; n: number; answer: Answer; raw: string }[];
  unread: { raw: string; why: string }[];
  notes: string[];
  referenced: boolean;
}

export function segmentReply(text?: string | null): { segments: ReplySegment[]; notes: string[] };
export function readDecisionsReply(
  text: string | null | undefined,
  page?: { entries?: readonly PageEntry[]; replyAt?: number },
): ReplyRead;
export function saidOf(answer: Answer | null | undefined): string;
