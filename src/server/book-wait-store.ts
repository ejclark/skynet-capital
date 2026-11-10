import { type BookWait, cleanWaitReason } from "../domain/book-wait.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { boundedString, isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";
import { isCalendarDay } from "../subscriptions/subscription-state.js";

/**
 * THE WAITS MEMBERS SET ON THEIR BOOKS (#4608 slice 1). At most one per account: the day the
 * question reopens, the member's one-line reason, and when they set it (`src/domain/book-wait.ts`).
 * Setting a new wait replaces the old one; clearing removes it. A wait whose day has passed is kept
 * until then, so the book can say the question opened again rather than forget the call was made.
 *
 * Keyed by desk id — a wait is on one account's book, the same key the book's calendar and its
 * decisions use — and answered to that account's owner alone (`book-wait-routes.ts`). Plain JSON (a
 * date, a line of the member's own text, a timestamp), atomic tmp+rename writes, total reads; a
 * write reads the file whole first and refuses rather than rewrite a file it could only read in
 * part (`exit-plan-store.ts`'s rule).
 */

type BookWaitsState = Readonly<Record<string, BookWait>>;

function parseWait(raw: unknown): BookWait | undefined {
  if (!(isRecord(raw) && isCalendarDay(raw.reopensOn))) return undefined;
  const reason = cleanWaitReason(raw.reason);
  const setAt = boundedString(raw.setAt, 40);
  return reason && setAt ? { reopensOn: raw.reopensOn, reason, setAt } : undefined;
}

function parseBookWaitsState(raw: unknown): BookWaitsState | undefined {
  if (!isRecord(raw)) return undefined;
  // No prototype: a desk id is a key here, never a name `Object.prototype` already answers to.
  const state: Record<string, BookWait> = Object.create(null);
  for (const [desk, wait] of Object.entries(raw)) {
    const kept = parseWait(wait);
    if (kept) state[desk] = kept;
  }
  return state;
}

export class BookWaitStore {
  private readonly file: JsonFileStore<BookWaitsState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseBookWaitsState,
      empty: {},
      label: "book-waits",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  /** The wait recorded on this desk's book, standing or reopened, or undefined. */
  wait(deskId: string): BookWait | undefined {
    const state = this.file.load();
    return Object.hasOwn(state, deskId) ? state[deskId] : undefined;
  }

  /** Record (or replace) the desk's wait. False when the file could not be read whole, so the
   *  write was refused — the caller says the wait was not saved, never that it was. */
  set(deskId: string, wait: BookWait): boolean {
    const state = this.file.loadIfReadable();
    if (!state) return false;
    this.file.write({ ...state, [deskId]: wait });
    return true;
  }

  /** Remove the desk's wait. True when there was none to remove. */
  clear(deskId: string): boolean {
    const state = this.file.loadIfReadable();
    if (!state) return false;
    if (!Object.hasOwn(state, deskId)) return true;
    this.file.write(Object.fromEntries(Object.entries(state).filter(([desk]) => desk !== deskId)));
    return true;
  }
}

/** The file beside the subscriptions file (`SKYNET_SUBSCRIPTIONS_FILE`, pinned on the volume in
 *  `fly.toml`) — a sibling, so no new env var and no envelope-protected edit. */
export function createBookWaitStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): BookWaitStore {
  return new BookWaitStore(
    siblingPath(
      env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
      "book-waits.json",
    ),
    onReadError,
  );
}
