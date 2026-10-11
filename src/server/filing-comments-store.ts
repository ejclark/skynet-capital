import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * COMMENTS ON ANOTHER MEMBER'S FILING — issue #2224 shape 3, with its guard. A member can weigh in
 * on a filing someone else made, and the comment lives HERE, in the app's own store, never on the
 * GitHub issue. Why, from the 2026-09-30 build-lane call sheet on #2224: the build session reads
 * every comment on a feedback issue's thread (`.github/prompts/feedback-build.md`), the app posts
 * with one token so a relayed comment can't be told apart from Eric's, and the follow-up path
 * relabels the issue (a fresh build). Only the filer's own follow-up route
 * (`feedback-api-routes.ts`'s `serveFollowup`) may reach the thread; a comment stored here reaches
 * nothing but the filing's card on Activity → Feedback pulse.
 *
 * Modelled on `council-store.ts`: one small plain-JSON file beside bot-controls.json, keyed by
 * issue number, append-only apart from author-delete (the only removal — nobody moderates anyone
 * else's words, the same posture the Council's author-retract set).
 */

export interface FilingComment {
  /** This comment's own id — what author-delete names. */
  readonly id: string;
  /** `opaqueMemberId` of the author — never rendered; it only decides `mine` and who may delete. */
  readonly authorId: string;
  readonly text: string;
  readonly at: string;
}

export interface FilingCommentsState {
  readonly issues: Readonly<Record<string, readonly FilingComment[]>>;
}

export const EMPTY_FILING_COMMENTS: FilingCommentsState = { issues: {} };

export const MAX_FILING_COMMENT_LENGTH = 500;

function parseComment(raw: unknown): FilingComment | null {
  if (!isRecord(raw)) return null;
  const { id, authorId, text, at } = raw;
  if (typeof id !== "string" || id.length === 0) return null;
  if (typeof authorId !== "string" || authorId.length === 0) return null;
  if (typeof text !== "string" || text.length === 0 || text.length > MAX_FILING_COMMENT_LENGTH) {
    return null;
  }
  if (typeof at !== "string") return null;
  return { id, authorId, text, at };
}

/** Total, defensive parse — a torn file can only produce `null` (the store falls back to empty),
 *  never a throw. Same doctrine as `parseCouncilState`. Only positive-integer issue keys survive. */
export function parseFilingCommentsState(raw: unknown): FilingCommentsState | null {
  if (!isRecord(raw)) return null;
  const issues: Record<string, FilingComment[]> = {};
  if (isRecord(raw.issues)) {
    for (const [issue, list] of Object.entries(raw.issues)) {
      if (!(/^[1-9]\d*$/.test(issue) && Array.isArray(list))) continue;
      const comments = list.map(parseComment).filter((c): c is FilingComment => c !== null);
      if (comments.length > 0) issues[issue] = comments;
    }
  }
  return { issues };
}

export class FilingCommentsStore {
  private readonly file: JsonFileStore<FilingCommentsState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseFilingCommentsState(raw) ?? undefined,
      empty: EMPTY_FILING_COMMENTS,
      label: "filing-comments",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): FilingCommentsState {
    return this.file.load();
  }

  /** Append one comment to one filing. Bounds and ownership are the caller's
   *  (`filing-comments-form.ts`): this class persists, it doesn't validate. */
  add(issueNumber: number, comment: FilingComment): FilingCommentsState {
    const state = this.load();
    const key = String(issueNumber);
    const next: FilingCommentsState = {
      issues: { ...state.issues, [key]: [...(state.issues[key] ?? []), comment] },
    };
    this.file.write(next);
    return next;
  }

  /** Author-delete: removes the comment only when `authorId` wrote it. Anything else — someone
   *  else's comment, an id that isn't there, a double-tap — is a no-op, not an error. A filing
   *  left with no comments is dropped so the file never carries hollow keys. */
  remove(issueNumber: number, commentId: string, authorId: string): FilingCommentsState {
    const state = this.load();
    const key = String(issueNumber);
    const list = state.issues[key] ?? [];
    const rest = list.filter((c) => !(c.id === commentId && c.authorId === authorId));
    if (rest.length === list.length) return state;
    const { [key]: _gone, ...others } = state.issues;
    const next: FilingCommentsState = {
      issues: rest.length > 0 ? { ...others, [key]: rest } : others,
    };
    this.file.write(next);
    return next;
  }
}

/** A sibling of the already-pinned controls file — no new env var, no `fly.toml` change
 *  (envelope-protected), the same move `councilFilePathFrom` makes. */
export function filingCommentsFilePathFrom(controlsFilePath: string): string {
  return siblingPath(controlsFilePath, "filing-comments.json");
}

export function createFilingCommentsStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): FilingCommentsStore {
  return new FilingCommentsStore(
    filingCommentsFilePathFrom(env.SKYNET_CONTROLS_FILE ?? "data/bot-controls.json"),
    onReadError,
  );
}
