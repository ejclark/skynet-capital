import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * WHICH SHIPPED FIXES MONEYPENNY HAS ALREADY ANNOUNCED (#8078). "Try it" (#8005 slice 7) tells a
 * member, once, that the fix for something they filed has shipped. "Once" needs a record: the
 * client resends only the last ten lines of one thread (`app/src/live/moneypenny.ts`), and the
 * server trims again (`companion-chat.ts`'s `trimHistory`), so the transcript cannot answer "have
 * I said so" — her own announcement ages out within about five exchanges, and a new thread, a
 * cleared chat or a second device never had it. Without this she re-announced indefinitely.
 *
 * Keyed by the member's opaque id (the feedback log's own key), a list of their issue numbers
 * whose fix she has announced, newest last, the oldest dropped past `MAX_PER_MEMBER`. Plain JSON
 * (a hash and some issue numbers — nothing personal), atomic tmp+rename writes, total reads; a
 * write reads the file whole first and refuses rather than rewrite a file it could only read in
 * part (`exit-plan-store.ts`'s rule). A refused or failed write costs one more announcement, never
 * the turn.
 */

type AnnouncedState = Readonly<Record<string, readonly number[]>>;

/** Far more filings than a member makes; past it the oldest record goes first. */
export const MAX_PER_MEMBER = 200;

const issueNumber = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) > 0;

function parseAnnouncedState(raw: unknown): AnnouncedState | undefined {
  if (!isRecord(raw)) return undefined;
  // No prototype: a member id is a key here, never a name `Object.prototype` already answers to.
  const state: Record<string, readonly number[]> = Object.create(null);
  for (const [member, numbers] of Object.entries(raw)) {
    if (Array.isArray(numbers)) state[member] = numbers.filter(issueNumber);
  }
  return state;
}

export class FixAnnouncementStore {
  private readonly file: JsonFileStore<AnnouncedState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseAnnouncedState,
      empty: {},
      label: "fix-announcements",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  /** The issue numbers whose fix she has already announced to this member. */
  announced(memberId: string): ReadonlySet<number> {
    const state = this.file.load();
    return new Set(Object.hasOwn(state, memberId) ? state[memberId] : []);
  }

  /** Record that she announced these. False when the file could not be read whole, so the write
   *  was refused. */
  record(memberId: string, numbers: readonly number[]): boolean {
    const state = this.file.loadIfReadable();
    if (!state) return false;
    const had = Object.hasOwn(state, memberId) ? (state[memberId] ?? []) : [];
    const fresh = numbers.filter((n) => issueNumber(n) && !had.includes(n));
    if (fresh.length === 0) return true;
    this.file.write({ ...state, [memberId]: [...had, ...fresh].slice(-MAX_PER_MEMBER) });
    return true;
  }
}

/** The file beside the subscriptions file (`SKYNET_SUBSCRIPTIONS_FILE`, pinned on the volume in
 *  `fly.toml`) — a sibling, so no new env var and no envelope-protected edit. */
export function createFixAnnouncementStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): FixAnnouncementStore {
  return new FixAnnouncementStore(
    siblingPath(
      env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
      "fix-announcements.json",
    ),
    onReadError,
  );
}
