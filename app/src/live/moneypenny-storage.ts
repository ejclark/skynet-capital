import type { CoachMessage, FeedbackKind } from "./feedback";
import type { MpMessage } from "./moneypenny";
import type { Flow } from "./moneypenny-script";

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
}

export const EMPTY: Persisted = {
  messages: [],
  introDone: false,
  flow: "idle",
  note: "",
  coach: [],
  kind: "idea",
};

export function load(member: string): Persisted {
  try {
    const raw = localStorage.getItem(keyFor(member));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return { ...EMPTY, ...parsed, messages: Array.isArray(parsed.messages) ? parsed.messages : [] };
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
