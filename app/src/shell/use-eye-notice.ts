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
import { goToPlace } from "./mp-message";

/**
 * THE EYE NOTICES, PLAYED (#7487 slice 5; what counts is `live/eye-notice.ts`). On Campaign, once
 * the page has its data, the Eye may point at ONE thing worth a look: the stage slides to its
 * window, the beam lights its row with the reason on the ring, and Moneypenny's latest line says in
 * plain words what the Eye noticed, with two moves — a question about it, and "Back to where I was".
 *
 * When it holds back, so a notice never takes the page from a member who came for something:
 *   - at most once per visit to the page (a remount is a new visit);
 *   - never when the visit arrived on an address that names a window or a row (`deepLink`): the
 *     member came for that, and the light of her own link may be on its way;
 *   - never while the member is typing — a text field holds focus with words in it, or a key went
 *     down in the last `TYPING_MS` — it waits until they stop;
 *   - never while Moneypenny is mid-turn (her line would land in the middle of an answer);
 *   - never twice for the same item in a session, and never on the member's first look, which only
 *     records the quests already there (`seenQuests`).
 * Reduced motion: no slide and no beam (the tokens and `eye-light-layer.tsx` see to both); the
 * window and the ring appear at once.
 */

/** How long after the page has its data the Eye looks: long enough to see the page first. */
export const NOTICE_AFTER_MS = 1200;
/** A key pressed this recently means the member is typing. */
export const TYPING_MS = 2000;
/** How often a held-back notice looks again. */
const RETRY_MS = 1000;

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
  // Decided once per visit, from the address the visit arrived on.
  const arrivedOnLink = useRef(deepLink);
  const done = useRef(false);
  const lastKey = useRef(Number.NEGATIVE_INFINITY);
  // The latest of what changes, read when the Eye finally looks rather than when it began waiting.
  const live = useRef({ cur, candidates, questIds });
  live.current = { cur, candidates, questIds };

  useEffect(() => {
    const onKey = () => {
      lastKey.current = performance.now();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  useEffect(() => {
    if (!ready || done.current) return;
    let timer = setTimeout(function look() {
      if (done.current) return;
      if (fieldInUse() || performance.now() - lastKey.current < TYPING_MS || herTurn()) {
        timer = setTimeout(look, RETRY_MS);
        return;
      }
      done.current = true;
      const here = live.current.cur;
      const notice = takeNotice(arrivedOnLink.current, live.current);
      if (!notice) return;
      rememberNoticed(notice.key);
      const line = useMoneypenny.getState().remark(notice.line);
      if (line) useNoticeMoves.getState().set(line, noticeMoves(notice, here));
      goToPlace(router, noticeHref(notice), notice.reason);
    }, NOTICE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [ready, router]);
}
