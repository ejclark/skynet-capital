// Type surface for scripts/moneypenny/decisions-page.mjs (see index.d.mts).

import type { HeldBlock } from "../held-pr.mjs";
import type { ReplyComment } from "./answer-readback.mjs";
import type { AskItem } from "./ask-card.mjs";

export const PAGE_MARKER: string;
export const PAGE_TITLE: string;
export const PAGE_LABEL: string;
export const RECEIPT_OPEN: string;
export const KEEP_RETIRED_MS: number;
export const REUSE_AFTER_MS: number;
/** A held PR he was pinged about is not pinged again inside this (#7317). */
export const HELD_PING_MS: number;

export interface PageState {
  entries: { n: number; issue: number; since: number }[];
  retired: { n: number; issue: number; since: number; until: number }[];
  pinged: number[];
  pingedAt: number;
  /** Held PRs pinged, and when: a day's memory, so a restarted check never earns a second ping. */
  heldPinged: { n: number; at: number }[];
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
  /** Criterion 4 (held PR): green clock or open clock, its hours, and what it blocks (#7317). */
  green?: boolean;
  hours?: number;
  blocks?: HeldBlock[];
  /** Its check runs could not be read: the page and the ping say "checks unknown" (#8212). */
  unknown?: boolean;
}
/** A held PR as the page lists it: a criterion-4 row, or a merge ask with only its link. */
export interface HeldRow {
  number: number;
  title?: string;
  green?: boolean;
  hours?: number;
  blocks?: HeldBlock[];
  /** Its check runs could not be read: the page and the ping say "checks unknown" (#8212). */
  unknown?: boolean;
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
  held?: readonly HeldRow[];
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
export function pingComment(
  newcomers: readonly { n: number; issue: number }[],
  newHeld?: readonly HeldRow[],
): string;
export function clip(s: unknown, n: number): string;
