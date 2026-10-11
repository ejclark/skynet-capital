import { postJson } from "./post";

/**
 * Replies under each weekly Council line (#5097, #2224 option A) — mirrors `/api/council/replies`.
 * They stay in the app for members to read: no GitHub, no AI. Pseudonymous like the line itself —
 * `mine` and `byLineAuthor` are the only authorship a reply carries.
 */

export interface CouncilReply {
  readonly id: string;
  readonly text: string;
  readonly at: string;
  readonly mine: boolean;
  /** The line's own writer answered under it. */
  readonly byLineAuthor: boolean;
  /** The line was edited after this reply was written — it answered earlier words. */
  readonly earlierLine: boolean;
}

export interface CouncilReplies {
  readonly enabled: boolean;
  /** The ISO week these threads belong to — the list attaches them only to the same week's lines. */
  readonly week?: string;
  /** Keyed by line id (`CouncilEntry.id`), oldest first. */
  readonly replies: Readonly<Record<string, readonly CouncilReply[]>>;
}

export async function fetchCouncilReplies(): Promise<CouncilReplies> {
  const res = await fetch("/api/council/replies", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`council replies ${res.status}`);
  const body = (await res.json()) as Partial<CouncilReplies> & { enabled: boolean };
  return { enabled: body.enabled, week: body.week, replies: body.replies ?? {} };
}

type Reply = { readonly ok: boolean; readonly error?: string };

/** Answer a line. `lineAt` is the version you read — the server refuses if its writer has edited
 *  it since, so a reply never hangs under words you didn't see. */
export const submitCouncilReply = (lineId: string, lineAt: string, text: string): Promise<Reply> =>
  postJson("/api/council/replies", { lineId, lineAt, text });

/** Take back your own reply. The server matches it against your session, never this body. */
export const removeCouncilReply = (lineId: string, replyId: string): Promise<Reply> =>
  postJson("/api/council/replies", { lineId, remove: replyId });
