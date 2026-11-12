import { useRouter } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import {
  type Notice,
  noticedThisSession,
  noticeHref,
  noticeMoves,
  pickNotice,
  rememberNoticed,
  rememberQuests,
  seenQuests,
  useNoticeMoves,
} from "../live/eye-notice";
import type { MissionWindow } from "../live/mission";
import { useMoneypenny } from "../live/moneypenny";
import { quietNextWindow } from "./mission-window";
import { goToPlace } from "./mp-message";

/**
 * THE EYE NOTICES, PLAYED (#7487 slice 5; what counts is `live/eye-notice.ts`). On Campaign, once
 * the page has its data, the Eye may point at ONE thing worth a look: the stage slides to its
 * window, the beam lights its row with the reason on the ring, and Moneypenny's latest line says in
 * plain words what the Eye noticed, with two moves — a question about it, and "Back to where I was".
 *
 * It is unprompted, so it only ever plays on a page the member has not started using. The visit
 * "came for something" — and the notice is dropped for the rest of it — once the member:
 *   - arrived on an address that names a window or a row (`deepLink`): the light of her own link
 *     may be on its way;
 *   - pressed a key, tapped or clicked anywhere, or moved focus to anything (a screen reader in focus
 *     mode, a tab): they are using the page, and a window swap would take it from under them;
 *   - moved to another window or address (a waypoint, one of Moneypenny's links, Back);
 *   - started a turn with Moneypenny at any point (her notice would bury her answer);
 *   - or nothing settled within `LOOK_FOR_MS` of the first look: a notice that late is no longer
 *     the page's first word.
 * It waits, without giving up, while a text field holds words, while the page has scrolled in the
 * last `SCROLL_MS` (the beam is drawn where the cards are when it plays), and until Moneypenny's
 * thread is bound to its member (a line said before then would be saved under "anon" and keep the
 * member's own conversation from loading, `remark`).
 *
 * Never twice for the same item in a session, and never on the member's first look, which only
 * records the quests already there (`seenQuests`). A window it opens on its own does not take focus
 * (`quietNextWindow`): her line in the dock's live region says what changed. Reduced motion: no
 * slide and no beam (the tokens and `eye-light-layer.tsx` see to both); the window and the ring
 * appear at once.
 */

/** How long after the page has its data the Eye looks: long enough to see the page first. */
export const NOTICE_AFTER_MS = 1200;
/** How long after its first look the Eye keeps waiting for a quiet moment before it lets go. */
export const LOOK_FOR_MS = 6000;
/** A scroll this recent means the page is still moving under the member. */
export const SCROLL_MS = 300;
/** How often a held-back notice looks again. */
const RETRY_MS = 500;

/** A focused text field with words in it. */
function fieldInUse(): boolean {
  const el = document.activeElement;
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
    return el.value.trim().length > 0;
  return el instanceof HTMLElement && el.isContentEditable && (el.textContent ?? "").trim() !== "";
}

function herTurn(): boolean {
  const s = useMoneypenny.getState();
  return s.typing || s.streaming || s.pending !== undefined;
}

/** The Eye's one look this visit: the notice to play, if any, with the quests on the page recorded
 *  as seen either way. The first look has nothing new to point at: it only records what is there. */
function takeNotice(
  arrivedOnLink: boolean,
  page: {
    readonly candidates: (seen: ReadonlySet<string>) => readonly Notice[];
    readonly questIds: readonly string[] | undefined;
  },
): Notice | undefined {
  const seen = seenQuests();
  const notice =
    seen && !arrivedOnLink ? pickNotice(page.candidates(seen), noticedThisSession()) : undefined;
  rememberQuests(page.questIds ?? []);
  return notice;
}

export function useEyeNotice({
  ready,
  deepLink,
  cur,
  candidates,
  questIds,
}: {
  /** The page has its edition (and the member's quests, when they have an account). */
  readonly ready: boolean;
  /** The visit arrived on an address naming a window, a row or a pivot. */
  readonly deepLink: boolean;
  /** The window on the stage now: where "Back to where I was" returns. */
  readonly cur: MissionWindow;
  /** Everything worth a look, best first (`noticeCandidates`). */
  readonly candidates: (seen: ReadonlySet<string>) => readonly Notice[];
  /** The account quests on the page now, recorded as seen once the Eye has looked. */
  readonly questIds: readonly string[] | undefined;
}): void {
  const router = useRouter();
  // Decided once per visit, from the address and the window the visit arrived on.
  const arrival = useRef({ deepLink, href: router.state.location.href, cur });
  const done = useRef(false);
  // The member has started using the page (see the header): the notice is dropped.
  const engaged = useRef(false);
  const lastScroll = useRef(Number.NEGATIVE_INFINITY);
  // The latest of what changes, read when the Eye finally looks rather than when it began waiting.
  const live = useRef({ cur, candidates, questIds });
  live.current = { cur, candidates, questIds };

  useEffect(() => {
    const use = () => {
      engaged.current = true;
    };
    const onFocus = (e: FocusEvent) => {
      if (e.target instanceof Element && e.target !== document.body) engaged.current = true;
    };
    const onScroll = () => {
      lastScroll.current = performance.now();
    };
    if (herTurn()) engaged.current = true;
    const unsubscribe = useMoneypenny.subscribe((s) => {
      if (s.typing || s.streaming || s.pending !== undefined) engaged.current = true;
    });
    window.addEventListener("pointerdown", use, true);
    window.addEventListener("keydown", use, true);
    window.addEventListener("focusin", onFocus, true);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      unsubscribe();
      window.removeEventListener("pointerdown", use, true);
      window.removeEventListener("keydown", use, true);
      window.removeEventListener("focusin", onFocus, true);
      window.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!ready || done.current) return;
    const firstLook = performance.now() + NOTICE_AFTER_MS;
    /** Drop the notice for this visit; the quests on the page were seen all the same. */
    const letGo = () => {
      done.current = true;
      rememberQuests(live.current.questIds ?? []);
    };
    /** The member is using the page, or has moved on, or it is too late: drop it (the header). */
    const cameForSomething = (now: number): boolean =>
      engaged.current ||
      router.state.location.href !== arrival.current.href ||
      live.current.cur !== arrival.current.cur ||
      herTurn() ||
      now - firstLook > LOOK_FOR_MS;
    /** Words in a field, a page still scrolling, a thread not yet bound: look again shortly. */
    const notQuietYet = (now: number): boolean =>
      fieldInUse() ||
      now - lastScroll.current < SCROLL_MS ||
      useMoneypenny.getState().member === undefined;
    let timer = setTimeout(function look() {
      if (done.current) return;
      const now = performance.now();
      if (cameForSomething(now)) {
        letGo();
        return;
      }
      if (notQuietYet(now)) {
        timer = setTimeout(look, RETRY_MS);
        return;
      }
      done.current = true;
      const here = live.current.cur;
      const notice = takeNotice(arrival.current.deepLink, live.current);
      if (!notice) return;
      const line = useMoneypenny.getState().remark(notice.line);
      // No line, no notice: the slide and the ring never play without her saying why.
      if (!line) return;
      rememberNoticed(notice.key);
      useNoticeMoves.getState().set(line, noticeMoves(notice, here));
      if (notice.window !== here) quietNextWindow(notice.window);
      goToPlace(router, noticeHref(notice), notice.reason);
    }, NOTICE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [ready, router]);
}
