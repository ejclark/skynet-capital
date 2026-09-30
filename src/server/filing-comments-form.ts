import { randomUUID } from "node:crypto";
import type { FeedbackLogEntry } from "./feedback-log.js";
import {
  type FilingComment,
  type FilingCommentsState,
  MAX_FILING_COMMENT_LENGTH,
} from "./filing-comments-store.js";
import { toMemberLine } from "./member-line.js";

/**
 * Comments on another member's filing (issue #2224 shape 3) — what a valid comment is and how the
 * league's view is read, split from the HTTP layer the way `council-form.ts` is.
 *
 * THE GUARD, AS A SHAPE: nothing in `FilingCommentsDeps` can reach GitHub. The filings come from
 * the app's own feedback log (`feedback-log.ts`), and the only writes are to the app's own store —
 * there is no issue client here to call, so a comment cannot land on the thread, relabel the issue
 * or start a build (#2224's 2026-09-30 call sheet). The filer keeps `/api/feedback/followup`, the
 * one in-app path onto the thread; this module refuses them so the two never blur.
 */
export interface FilingCommentsDeps {
  readonly load: () => FilingCommentsState;
  readonly add: (issueNumber: number, comment: FilingComment) => void;
  readonly remove: (issueNumber: number, commentId: string, authorId: string) => void;
  /** Every member's logged filings — the app's own record of who filed what, never GitHub. */
  readonly readFilings: () => Promise<readonly FeedbackLogEntry[]>;
  readonly now?: () => Date;
  readonly newId?: () => string;
}

/** A filing's comment thread keeps its card readable — past this, the thread is full. */
export const MAX_COMMENTS_PER_FILING = 50;

export interface FilingCommentView {
  readonly id: string;
  readonly text: string;
  readonly at: string;
  /** The viewer wrote it — the only authorship the view carries (pseudonymous, like the pulse). */
  readonly mine: boolean;
}

export interface FilingCommentsView {
  /** Oldest first per filing — a thread reads top to bottom. Keyed by issue number. */
  readonly comments: Readonly<Record<string, readonly FilingCommentView[]>>;
  /** The viewer's own filings — where the card offers Follow up instead of Comment. */
  readonly ownFilings: readonly number[];
}

export async function filingCommentsView(
  deps: FilingCommentsDeps,
  viewerId?: string,
): Promise<FilingCommentsView> {
  const comments: Record<string, FilingCommentView[]> = {};
  for (const [issue, list] of Object.entries(deps.load().issues)) {
    comments[issue] = [...list]
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((c) => ({ id: c.id, text: c.text, at: c.at, mine: c.authorId === viewerId }));
  }
  const ownFilings = viewerId
    ? (await deps.readFilings())
        .filter((f) => f.opaqueMemberId === viewerId)
        .map((f) => f.issueNumber)
    : [];
  return { comments, ownFilings };
}

export type FilingCommentResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: string };

/** One comment on a filing the author did NOT file. Refuses an unknown filing, the filer (their
 *  words belong on the thread, via Follow up), empty and over-length text, and a full thread —
 *  never truncates, so a member sees their own words come back or a reason they didn't. */
export async function submitFilingComment(
  issueNumber: number,
  text: string,
  authorId: string,
  deps: FilingCommentsDeps,
): Promise<FilingCommentResult> {
  const filing = (await deps.readFilings()).find((f) => f.issueNumber === issueNumber);
  if (!filing) return { ok: false, error: "That filing isn't in the pulse." };
  if (filing.opaqueMemberId === authorId) {
    return {
      ok: false,
      error: "That's your own filing — use Follow up on your Profile so the build sees it.",
    };
  }
  const line = toMemberLine(text);
  if (line.length === 0) return { ok: false, error: "Say something — even one line." };
  if (line.length > MAX_FILING_COMMENT_LENGTH) {
    return { ok: false, error: `Keep it to ${MAX_FILING_COMMENT_LENGTH} characters.` };
  }
  if ((deps.load().issues[String(issueNumber)] ?? []).length >= MAX_COMMENTS_PER_FILING) {
    return { ok: false, error: "This filing's thread is full." };
  }
  const at = deps.now?.() ?? new Date();
  deps.add(issueNumber, {
    id: deps.newId?.() ?? randomUUID(),
    authorId,
    text: line,
    at: at.toISOString(),
  });
  return { ok: true };
}

/** Author-delete — the id is always the caller's session-derived one, so there is no path to
 *  remove someone else's comment (`FilingCommentsStore.remove` matches both ids). */
export function removeFilingComment(
  issueNumber: number,
  commentId: string,
  authorId: string,
  deps: FilingCommentsDeps,
): FilingCommentResult {
  deps.remove(issueNumber, commentId, authorId);
  return { ok: true };
}
