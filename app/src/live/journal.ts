import { postJson } from "./post";

/**
 * The wish journal's client model (#8190) — mirrors `/api/journal` (`src/server/journal-api-routes.ts`).
 *
 * A WISH is a filing: posting one files it through the feedback path, so it shows up in
 * `GET /api/feedback`'s `recent[]` (marked `source: "journal"`) with its status words, never here.
 * A NOTE (what happened, or a trade note) is private: it is kept on the data volume and listed
 * by `GET /api/journal`, and goes nowhere else. A trade note is words only — nothing on this path
 * reads, places or changes an order.
 *
 * The types restate the server's shapes (the shell never imports the server tree); the domain
 * file `src/domain/journal-entry.ts` is pure and is the one authority on what a valid post is.
 */

export interface ExperienceNoteView {
  readonly kind: "experience";
  readonly uuid: string;
  readonly savedAt: string;
  readonly text: string;
}

export interface TradeNoteView {
  readonly kind: "trade";
  readonly uuid: string;
  readonly savedAt: string;
  readonly symbol?: string;
  readonly whyIn?: string;
  readonly leaveIf?: string;
  readonly learned?: string;
}

export type JournalNoteView = ExperienceNoteView | TradeNoteView;

export interface JournalIndex {
  /** False when there is no session or no store on this deployment — `reason` says which. */
  readonly available: boolean;
  /** Whether a wish can be filed here (a GitHub token is set). */
  readonly wishesEnabled: boolean;
  /** This member's notes, newest first. */
  readonly notes: readonly JournalNoteView[];
  readonly reason?: string;
}

/** The read. A signed-out answer (401) still carries a whole index with its reason, so it is
 *  read, not thrown: the screen says why notes are off instead of "unreachable". */
export async function fetchJournal(): Promise<JournalIndex> {
  const res = await fetch("/api/journal", { credentials: "same-origin" });
  if (!res.ok && res.status !== 401) throw new Error(`journal ${res.status}`);
  return (await res.json()) as JournalIndex;
}

export type JournalPost =
  | { readonly kind: "wish"; readonly text: string }
  | { readonly kind: "experience"; readonly text: string }
  | {
      readonly kind: "trade";
      readonly symbol?: string;
      readonly whyIn?: string;
      readonly leaveIf?: string;
      readonly learned?: string;
    };

export type JournalAnswer =
  | { readonly ok: true; readonly kind: "wish"; readonly url: string; readonly number: number }
  | { readonly ok: true; readonly kind: "experience" | "trade"; readonly note: JournalNoteView }
  | { readonly ok: false; readonly error: string };

/** One write. A refusal the server answers with a non-2xx (a field over its cap, the throttle,
 *  GitHub refusing) comes back as `{ ok: false }` with the server's own sentence, the same as a
 *  200 refusal, so the composer has one shape to read. */
export async function postJournal(post: JournalPost): Promise<JournalAnswer> {
  try {
    return await postJson<JournalAnswer>("/api/journal", post);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
