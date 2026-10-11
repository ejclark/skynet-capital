import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * REPLIES UNDER A WEEKLY COUNCIL LINE (#5097 — #2224 option A, Eric's pick on 2026-10-10: "I like
 * the thought of bringing commentary to the trading section. This adds an element of engagement,
 * note taking"). A Council line was a broadcast nobody could answer; `docs/THE-GAME.md:117` says
 * "the argument is the product". A reply lives HERE, in the app's own store — never GitHub, never
 * an AI's context — and every member inside the gate reads it, the same posture comments on a
 * filing shipped with (`filing-comments-store.ts`, #4178).
 *
 * Keyed by ISO week, then by LINE — the line's id is its writer's `opaqueMemberId`, because a
 * member has one line per week (`council-store.ts`). Each reply carries `lineAt`, the version of
 * the line it answered: a member may edit their line after someone replied, and a reply must never
 * pass as an answer to words it didn't see (`council-replies-form.ts` says so on the read).
 *
 * Append-only apart from author-delete — the only removal. Nobody moderates anyone else's words:
 * the Council's own line is author-retract only, and so is this.
 */

export interface CouncilReply {
  /** This reply's own id — what author-delete names. */
  readonly id: string;
  /** `opaqueMemberId` of the writer — never rendered; it only decides `mine`, the line writer's
   *  mark and who may delete. */
  readonly authorId: string;
  readonly text: string;
  readonly at: string;
  /** The `at` of the line this answered — its version, since a resubmit replaces the line. */
  readonly lineAt: string;
}

export interface CouncilRepliesState {
  /** week → line id → replies, oldest appended last. */
  readonly weeks: Readonly<Record<string, Readonly<Record<string, readonly CouncilReply[]>>>>;
}

export const EMPTY_COUNCIL_REPLIES: CouncilRepliesState = { weeks: {} };

/** A reply is one line of note-taking room — the same cap a comment on a filing carries. */
export const MAX_COUNCIL_REPLY_LENGTH = 500;

const WEEK_KEY = /^\d{4}-W\d{2}$/;

function parseReply(raw: unknown): CouncilReply | null {
  if (!isRecord(raw)) return null;
  const { id, authorId, text, at, lineAt } = raw;
  if (typeof id !== "string" || id.length === 0) return null;
  if (typeof authorId !== "string" || authorId.length === 0) return null;
  if (typeof text !== "string" || text.length === 0 || text.length > MAX_COUNCIL_REPLY_LENGTH) {
    return null;
  }
  if (typeof at !== "string" || typeof lineAt !== "string") return null;
  return { id, authorId, text, at, lineAt };
}

function parseLines(raw: unknown): Record<string, CouncilReply[]> {
  const lines: Record<string, CouncilReply[]> = {};
  if (!isRecord(raw)) return lines;
  for (const [lineId, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    const replies = list.map(parseReply).filter((r): r is CouncilReply => r !== null);
    if (replies.length > 0) lines[lineId] = replies;
  }
  return lines;
}

/** Total, defensive parse — a torn file can only produce `null` (the store falls back to empty),
 *  never a throw. Same doctrine as `parseCouncilState`. Only ISO-week keys survive. */
export function parseCouncilRepliesState(raw: unknown): CouncilRepliesState | null {
  if (!isRecord(raw)) return null;
  const weeks: Record<string, Record<string, CouncilReply[]>> = {};
  if (isRecord(raw.weeks)) {
    for (const [week, value] of Object.entries(raw.weeks)) {
      if (!WEEK_KEY.test(week)) continue;
      const lines = parseLines(value);
      if (Object.keys(lines).length > 0) weeks[week] = lines;
    }
  }
  return { weeks };
}

/** One line's replies, read only from the map's own keys — a line id like `__proto__` names
 *  nothing, never a built-in (#2224 shape 3 red-team, C1). */
export function repliesFor(
  state: CouncilRepliesState,
  week: string,
  lineId: string,
): readonly CouncilReply[] {
  const lines = Object.hasOwn(state.weeks, week) ? state.weeks[week] : undefined;
  return lines && Object.hasOwn(lines, lineId) ? (lines[lineId] ?? []) : [];
}

export class CouncilRepliesStore {
  private readonly file: JsonFileStore<CouncilRepliesState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseCouncilRepliesState(raw) ?? undefined,
      empty: EMPTY_COUNCIL_REPLIES,
      label: "council-replies",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): CouncilRepliesState {
    return this.file.load();
  }

  /** Append one reply under one line of one week. Bounds, the line's existence and ownership are
   *  the caller's (`council-replies-form.ts`): this class persists, it doesn't validate. */
  add(week: string, lineId: string, reply: CouncilReply): CouncilRepliesState {
    const state = this.load();
    const lines = Object.hasOwn(state.weeks, week) ? state.weeks[week] : {};
    const next: CouncilRepliesState = {
      weeks: {
        ...state.weeks,
        [week]: { ...lines, [lineId]: [...repliesFor(state, week, lineId), reply] },
      },
    };
    this.file.write(next);
    return next;
  }

  /** Author-delete: removes the reply only when `authorId` wrote it. Anything else — someone
   *  else's reply, an id that isn't there, a double-tap — is a no-op, not an error. A line left
   *  with no replies, and a week left with no lines, are dropped so the file carries no hollow
   *  keys. */
  remove(week: string, lineId: string, replyId: string, authorId: string): CouncilRepliesState {
    const state = this.load();
    const list = repliesFor(state, week, lineId);
    const rest = list.filter((r) => !(r.id === replyId && r.authorId === authorId));
    if (rest.length === list.length) return state;
    const { [week]: lines = {}, ...otherWeeks } = state.weeks;
    const { [lineId]: _gone, ...otherLines } = lines;
    const nextLines = rest.length > 0 ? { ...otherLines, [lineId]: rest } : otherLines;
    const next: CouncilRepliesState = {
      weeks: Object.keys(nextLines).length > 0 ? { ...otherWeeks, [week]: nextLines } : otherWeeks,
    };
    this.file.write(next);
    return next;
  }
}

/** The Council's sibling — `council.json` and this file sit beside the controls file. */
export function councilRepliesFilePathFrom(controlsFilePath: string): string {
  return siblingPath(controlsFilePath, "council-replies.json");
}

export function createCouncilRepliesStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): CouncilRepliesStore {
  return new CouncilRepliesStore(
    councilRepliesFilePathFrom(env.SKYNET_CONTROLS_FILE ?? "data/bot-controls.json"),
    onReadError,
  );
}
