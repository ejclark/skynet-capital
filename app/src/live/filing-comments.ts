import { postJson } from "./post";

/**
 * Comments on another member's filing (issue #2224 shape 3) — mirrors `/api/feedback/comments`.
 * These stay in the app: the server never posts them to the GitHub issue, so they never reach the
 * build that reads that thread. Pseudonymous like the Feedback pulse — `mine` is the only
 * authorship a comment carries.
 */

export interface FilingComment {
  readonly id: string;
  readonly text: string;
  readonly at: string;
  readonly mine: boolean;
}

export interface FilingComments {
  readonly enabled: boolean;
  /** Keyed by issue number, oldest first. */
  readonly comments: Readonly<Record<string, readonly FilingComment[]>>;
  /** The viewer's own filings — those take Follow up on the Profile, not a comment here. */
  readonly ownFilings: readonly number[];
}

export async function fetchFilingComments(): Promise<FilingComments> {
  const res = await fetch("/api/feedback/comments", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`filing comments ${res.status}`);
  const body = (await res.json()) as Partial<FilingComments> & { enabled: boolean };
  return {
    enabled: body.enabled,
    comments: body.comments ?? {},
    ownFilings: body.ownFilings ?? [],
  };
}

type Reply = { readonly ok: boolean; readonly error?: string };

export const submitFilingComment = (issueNumber: number, text: string): Promise<Reply> =>
  postJson("/api/feedback/comments", { issueNumber, text });

/** Take back your own comment. The server matches it against your session, never this body. */
export const removeFilingComment = (issueNumber: number, commentId: string): Promise<Reply> =>
  postJson("/api/feedback/comments", { issueNumber, remove: commentId });
