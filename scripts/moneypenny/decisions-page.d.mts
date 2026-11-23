// Type surface for scripts/moneypenny/decisions-page.mjs (see index.d.mts).
import type { ReplyComment } from "./answer-readback.mjs";
import type { AskItem } from "./ask-card.mjs";

export const PAGE_MARKER: string;
export const PAGE_TITLE: string;
export const PAGE_LABEL: string;
export const RECEIPT_OPEN: string;
export const KEEP_RETIRED_MS: number;
export const REUSE_AFTER_MS: number;

export interface PageState {
  entries: { n: number; issue: number; since: number }[];
  retired: { n: number; issue: number; since: number; until: number }[];
  pinged: number[];
  pingedAt: number;
}
export interface PageIssue {
  number: number;
  title?: string;
  body?: string | null;
  state?: string;
  created_at?: string;
  labels?: (string | { name?: string })[];
  assignees?: ({ login?: string } | string)[];
  user?: { type?: string; login?: string };
  pull_request?: unknown;
}
export interface NeedsYouRow {
  number: number;
  title?: string;
  criterion: number;
  why?: string;
  decision?: string | null;
}
export interface ReadbackIntent {
  kind: "readback-eric";
  number: number;
  n: number;
  title: string;
  criterion: 1;
  why: string;
  said: string;
  body: string;
  ready: boolean;
}
export type DecisionsIntent =
  | { kind: "decisions-open"; title: string; body: string; number: 0; why: string }
  | {
      kind: "decisions-sync";
      number: number;
      body: string | null;
      assign: boolean;
      unassign: boolean;
      ping: string | null;
      why: string;
    }
  | {
      kind: "decisions-answer";
      page: number;
      replyId: number;
      readbacks: ReadbackIntent[];
      unread: { raw: string; why: string }[];
      notes: string[];
      why: string;
    };

export function stateOf(body?: string | null): PageState;
export function nextState(
  prior: PageState,
  asks: readonly { issue: number; rank?: number }[],
  now: number,
): PageState;
export function renderPage(input: {
  state: PageState;
  asks: Map<number, { issue: number; title: string; items: AskItem[]; rank: number }>;
  held?: readonly { number: number; title?: string }[];
  answered?: ReadonlySet<number>;
}): string;
export function receiptedIds(comments?: readonly ReplyComment[]): Set<number>;
export function isDecisionsReply(payload: unknown): boolean;
export function planDecisions(input: {
  needsYou?: readonly NeedsYouRow[];
  issues?: readonly PageIssue[];
  page?: PageIssue | null;
  comments?: readonly ReplyComment[];
  closing?: Set<number>;
  now: number;
}): { intents: DecisionsIntent[]; body: string; state: PageState };
export function pingComment(newcomers: readonly { n: number; issue: number }[]): string;
export function clip(s: unknown, n: number): string;
