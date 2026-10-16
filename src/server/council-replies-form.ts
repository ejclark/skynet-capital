import { randomUUID } from "node:crypto";
import {
  type CouncilRepliesState,
  type CouncilReply,
  MAX_COUNCIL_REPLY_LENGTH,
  repliesFor,
} from "./council-replies-store.js";
import { type CouncilEntry, type CouncilState, weekKey } from "./council-store.js";
import { toMemberLine } from "./member-line.js";

/**
 * Replies under a weekly Council line (#5097, #2224 option A) — what a valid reply is and how the
 * league reads them, split from the HTTP layer the way `council-form.ts` and
 * `filing-comments-form.ts` are.
 *
 * THE POSTURE, AS A SHAPE: `CouncilRepliesDeps` reaches the app's own two files and nothing else —
 * no GitHub client, no companion, no network. A reply is read by members inside the gate and by no
 * build and no AI (#2224's standing falsifier: "another member's desk, line or comment reaches
 * [Moneypenny's privileged context] or a build").
 *
 * THIS WEEK ONLY, like the line itself: a reply attaches to a line that is up now, and the read is
 * this week's threads. A past week is the record.
 */
export interface CouncilRepliesDeps {
  readonly load: () => CouncilRepliesState;
  readonly add: (week: string, lineId: string, reply: CouncilReply) => void;
  readonly remove: (week: string, lineId: string, replyId: string, authorId: string) => void;
  /** The Council's own lines, read-only here — a reply hangs only on a line that is up. */
  readonly loadCouncil: () => CouncilState;
  readonly now?: () => Date;
  readonly newId?: () => string;
}

/** A line's thread keeps the list readable at 390px — past this, the thread is full. */
export const MAX_REPLIES_PER_LINE = 50;

export interface CouncilReplyView {
  readonly id: string;
  readonly text: string;
  readonly at: string;
  /** The viewer wrote it. */
  readonly mine: boolean;
  /** The line's own writer answered under it — the argument reads wrong without it. Still
   *  pseudonymous: it ties a reply to the line's pseudonym, never to a person. */
  readonly byLineAuthor: boolean;
  /** The line was edited after this reply — it answered words that are no longer there. */
  readonly earlierLine: boolean;
}

export interface CouncilRepliesView {
  readonly week: string;
  /** Oldest first per line — a thread reads top to bottom. Keyed by line id; a line with no
   *  replies, or one taken back, has no key. */
  readonly replies: Readonly<Record<string, readonly CouncilReplyView[]>>;
}

function linesThisWeek(deps: CouncilRepliesDeps, week: string): Record<string, CouncilEntry> {
  const weeks = deps.loadCouncil().weeks;
  return Object.hasOwn(weeks, week) ? { ...weeks[week] } : {};
}

function lineUp(lines: Record<string, CouncilEntry>, lineId: string): CouncilEntry | undefined {
  return Object.hasOwn(lines, lineId) ? lines[lineId] : undefined;
}

export function councilRepliesView(
  deps: CouncilRepliesDeps,
  viewerId?: string,
): CouncilRepliesView {
  const week = weekKey(deps.now?.() ?? new Date());
  const state = deps.load();
  const replies: Record<string, CouncilReplyView[]> = {};
  // Only lines that are up: a reply to a line its writer took back has nothing to hang on.
  for (const [lineId, line] of Object.entries(linesThisWeek(deps, week))) {
    const list = repliesFor(state, week, lineId);
    if (list.length === 0) continue;
    replies[lineId] = [...list]
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((r) => ({
        id: r.id,
        text: r.text,
        at: r.at,
        mine: viewerId !== undefined && r.authorId === viewerId,
        byLineAuthor: r.authorId === lineId,
        earlierLine: r.lineAt !== line.at,
      }));
  }
  return { week, replies };
}

export type CouncilReplyResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

/** One reply under a line that is up this week. `lineAt` is the version of the line the member
 *  read: if the writer edited it since, the reply is refused rather than hung under words the
 *  member never saw. Refuses empty and over-length text and a full thread — never truncates, so a
 *  member sees their own words come back or a reason they didn't. */
export function submitCouncilReply(
  lineId: string,
  lineAt: string,
  text: string,
  authorId: string,
  deps: CouncilRepliesDeps,
): CouncilReplyResult {
  const at = deps.now?.() ?? new Date();
  const week = weekKey(at);
  const line = lineUp(linesThisWeek(deps, week), lineId);
  if (!line) return { ok: false, error: "That line isn't up this week." };
  if (line.at !== lineAt) {
    return { ok: false, error: "That line was just edited — read it again, then reply." };
  }
  // Everyone in the gate reads this — `toMemberLine` owns why (#2224 shape 3 red-team, H2).
  const words = toMemberLine(text);
  if (words.length === 0) return { ok: false, error: "Say something — even one line." };
  if (words.length > MAX_COUNCIL_REPLY_LENGTH) {
    return { ok: false, error: `Keep it to ${MAX_COUNCIL_REPLY_LENGTH} characters.` };
  }
  if (repliesFor(deps.load(), week, lineId).length >= MAX_REPLIES_PER_LINE) {
    return { ok: false, error: "This line's thread is full." };
  }
  deps.add(week, lineId, {
    id: deps.newId?.() ?? randomUUID(),
    authorId,
    text: words,
    at: at.toISOString(),
    lineAt: line.at,
  });
  return { ok: true };
}

/** Author-delete, this week's threads only — the id is always the caller's session-derived one,
 *  so there is no path to remove someone else's reply (`CouncilRepliesStore.remove` matches both
 *  ids). */
export function removeCouncilReply(
  lineId: string,
  replyId: string,
  authorId: string,
  deps: CouncilRepliesDeps,
): CouncilReplyResult {
  deps.remove(weekKey(deps.now?.() ?? new Date()), lineId, replyId, authorId);
  return { ok: true };
}
