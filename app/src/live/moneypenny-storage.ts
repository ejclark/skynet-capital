import type { CoachMessage, FeedbackKind } from "./feedback";
import { type Goal, parseGoal, parseVisit, type Visit } from "./first-visit";
import type { MpMessage } from "./moneypenny";
import type { Flow } from "./moneypenny-script";
import { isThread, type MpThread } from "./moneypenny-threads";

/**
 * THE THREAD'S PERSISTENCE — split from `moneypenny.ts` at the 300-line cap. One blob per MEMBER
 * (the opaque id `/api/onboarding` hands the rail), so a shared device never shows one member
 * another's conversation; binding to a member forgets every other member's blob on that device.
 * A parked draft is deliberately not part of this shape: it lives in memory only, so nothing a
 * member never said "send" to can survive a reload or a sign-out.
 */

export const STORAGE_PREFIX = "sc.moneypenny.v1";
export const keyFor = (member: string) => `${STORAGE_PREFIX}.${member}`;

export interface Persisted {
  readonly messages: readonly MpMessage[];
  readonly introDone: boolean;
  readonly flow: Flow;
  readonly note: string;
  readonly coach: readonly CoachMessage[];
  readonly kind: FeedbackKind;
  /** The side threads this member started on a page's rows (#7167 criterion 11) — their names
   *  and places; their lines are in `messages`, tagged with the thread's key. */
  readonly threads: readonly MpThread[];
  /** Where the member is in their first visit (#7487 slice 7, `first-visit.ts`); absent = not in it. */
  readonly visit: Visit | undefined;
  /** The member's goal, pinned as the first row of Quests (slice 7). Kept in this blob, beside the
   *  conversation it was set in: client persistence, so it lives on this device only. */
  readonly goal: Goal | undefined;
}

export const EMPTY: Persisted = {
  messages: [],
  threads: [],
  introDone: false,
  flow: "idle",
  note: "",
  coach: [],
  kind: "idea",
  visit: undefined,
  goal: undefined,
};

export function load(member: string): Persisted {
  try {
    const raw = localStorage.getItem(keyFor(member));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    const { visit: savedVisit, goal: savedGoal, ...rest } = parsed;
    return {
      ...EMPTY,
      ...rest,
      // Read back from the member's own storage: kept only when well-formed. Always present as
      // keys, so binding to another member never leaves the last one's visit or goal behind.
      visit: parseVisit(savedVisit),
      goal: parseGoal(savedGoal),
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      // A blob saved before threads existed has none.
      threads: Array.isArray(parsed.threads) ? parsed.threads.filter(isThread) : [],
    };
  } catch {
    return EMPTY;
  }
}

export function persist(member: string, state: Persisted): void {
  try {
    localStorage.setItem(keyFor(member), JSON.stringify(state));
  } catch {
    // storage unavailable — the thread lives for this session only
  }
}

/** Another member's thread on this device is not this member's to see. */
export function forgetOthers(member: string): void {
  try {
    const keep = keyFor(member);
    const stale: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(`${STORAGE_PREFIX}.`) && k !== keep) stale.push(k);
    }
    for (const k of stale) localStorage.removeItem(k);
  } catch {
    // storage unavailable
  }
}
