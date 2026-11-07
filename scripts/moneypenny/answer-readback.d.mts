// Type surface for scripts/moneypenny/answer-readback.mjs (see index.d.mts).
import type { CardTwin } from "./ask-card.mjs";

export const READ_MARKER: string;

export type Answer =
  | { kind: "option"; picks: readonly { item: number; key: string }[] }
  | { kind: "yes" | "no" | "deferred" };

export interface ReplyComment {
  id?: number;
  body?: string | null;
  created_at?: string;
  html_url?: string;
  author_association?: string;
  user?: { type?: string; login?: string };
}
export interface Readback {
  number: number;
  title?: string;
  ask: ReplyComment;
  card: CardTwin | null;
  reply: ReplyComment;
  answer: Answer;
}
export interface LedgerRow {
  date: string;
  cls: string;
  ask: string;
  predicted: string;
  given: string;
  score: string;
  key: string;
}

export function readAnswer(text: string | null | undefined, card: CardTwin | null): Answer | null;
export function findReply(
  comments?: readonly ReplyComment[],
): Omit<Readback, "number" | "title"> | null;
export function readbackFor(
  issue: {
    number: number;
    title?: string;
    state?: string;
    labels?: (string | { name?: string })[];
  },
  comments: readonly ReplyComment[],
): Readback | null;
export function classOf(text?: string): string;
export function ledgerRows(input: {
  number: number;
  title?: string;
  card: CardTwin | null;
  answer: Answer;
  reply: ReplyComment;
}): LedgerRow[];
export function readbackComment(input: { answer: Answer; rows: LedgerRow[] }): string;
export function executeReadback(
  intent: { number: number; body: string; said?: string },
  opts?: {
    run?: (cmd: string, args: readonly string[]) => string;
    retry?: <T>(fn: () => T) => T;
    read?: (path: string) => { body?: string | null } | null;
  },
): string;
export function rowsFromComments(comments?: readonly ReplyComment[]): LedgerRow[];
export function appendRows(
  ledger: string,
  rows: readonly LedgerRow[],
): { ledger: string; added: number };
