import { type RefObject, useEffect } from "react";
import { create } from "zustand";

/**
 * THE TOWER BUS (plan #3807 slice 3a; the design panel's §4) — the one way the page talks to a
 * `/tower` frame. Direction and dials only: a point in the frame's own pixels, two numbers for the
 * forge's light, and whether the frame is seen. Always to our own origin, never `"*"`.
 *
 * The scene's half of the contract is `src/three/kit/messages.ts` (it checks the origin AND that the
 * sender is its parent); a message the scene does not handle yet is ignored there, so the page may
 * speak a little ahead of it.
 *
 * Two frames can listen: the character card's own (`sauron-card.tsx`, passed by ref, and registered
 * with `useCardFrame` so a flare reaches it) and the shell's crest at the calendar band's right cap
 * (`vantage.tsx`, registered here). The hooks default to the crest.
 */

/** What a flare is for (the scene's `src/three/kit/flare.ts` knows the same kinds). */
export type FlareKind = "new-high";

/** Page → scene. */
export type TowerMessage =
  | { readonly type: "tower:glance"; readonly x: number; readonly y: number }
  | { readonly type: "tower:regard"; readonly x: number; readonly y: number }
  | { readonly type: "tower:release" }
  | { readonly type: "tower:mood"; readonly power: number; readonly health: number }
  | { readonly type: "tower:run"; readonly on: boolean }
  | { readonly type: "tower:flare"; readonly kind: FlareKind };

export interface Mood {
  readonly power: number;
  readonly health: number;
}

/** The scene's own standalone dials (`scene-main.ts` `paramsFromQuery`) — claims nothing. */
export const DEFAULT_MOOD: Mood = { power: 0.62, health: 0.15 };

/** The page controls that count as "filters" — every toggle chip and the free-text filter box,
 *  and the market calendar's arrows (#3807 slice 2·1): a range is a filter of time. */
export const FILTER_CONTROLS =
  '[aria-pressed], input[type="search"], input[type="text"], input:not([type]), select, button.eh-nav';

/** What the Eye regards while a pointer hovers it: a calendar day, a blotter row. Nothing else. */
export const REGARD_TARGETS = '.eh-day, tr[id^="pos-"]';

export const prefersStill = (): boolean => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
};

/** `target`'s centre, in `frame`'s own CSS pixels (may lie outside the frame). */
function pointIn(frame: DOMRect, target: DOMRect): { readonly x: number; readonly y: number } {
  return {
    x: target.left + target.width / 2 - frame.left,
    y: target.top + target.height / 2 - frame.top,
  };
}

/** A glance at `control`'s centre, in the frame's own CSS pixels. */
export function glanceMessage(
  frame: DOMRect,
  control: DOMRect,
): { readonly type: "tower:glance"; readonly x: number; readonly y: number } {
  return { type: "tower:glance", ...pointIn(frame, control) };
}

/** A regard toward a hovered item's centre, in the frame's own CSS pixels. */
export function regardMessage(
  frame: DOMRect,
  item: DOMRect,
): { readonly type: "tower:regard"; readonly x: number; readonly y: number } {
  return { type: "tower:regard", ...pointIn(frame, item) };
}

/** Post one message to one frame, to our own origin only. False when the frame has no window yet. */
export function postTo(frame: HTMLIFrameElement | null | undefined, m: TowerMessage): boolean {
  const target = frame?.contentWindow;
  if (!target) return false;
  target.postMessage(m, window.location.origin);
  return true;
}

interface Bus {
  /** The crest's frame, while one is mounted. */
  readonly frame: HTMLIFrameElement | null;
  /** The latest dials and run state, replayed when the frame (re)announces itself. */
  readonly mood: Mood;
  readonly on: boolean;
}

export const useTowerBus = create<Bus>(() => ({ frame: null, mood: DEFAULT_MOOD, on: false }));

/** Register (or clear) the crest's frame. */
export function setVantageFrame(frame: HTMLIFrameElement | null): void {
  useTowerBus.setState({ frame });
}

/** Send to the crest, remembering the mood and run state so a late-loading frame catches up. */
export function toVantage(m: TowerMessage): void {
  if (m.type === "tower:mood") useTowerBus.setState({ mood: { power: m.power, health: m.health } });
  if (m.type === "tower:run") useTowerBus.setState({ on: m.on });
  postTo(useTowerBus.getState().frame, m);
}

/** The frame just loaded or said `tower:ready`: send it the latest dials and run state. */
export function replayToVantage(): void {
  const { frame, mood, on } = useTowerBus.getState();
  postTo(frame, { type: "tower:mood", ...mood });
  postTo(frame, { type: "tower:run", on });
}

/** The character cards' own frames while mounted — every tower on the page hears a flare. */
const cardFrames = new Set<HTMLIFrameElement>();

/** Register the character card's frame for as long as it is mounted (`sauron-card.tsx`). */
export function useCardFrame(frame: RefObject<HTMLIFrameElement | null>): void {
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    cardFrames.add(el);
    return () => void cardFrames.delete(el);
  }, [frame]);
}

/**
 * THE FLARE (#3807 slice 3b-3): something good just happened to the member, so every tower on the
 * page — the head's crest while it runs, and the character card's frame when one is mounted — has
 * its Eye brighten once and settle. A moment, never a state: nothing here remembers it, so a frame
 * that loads or wakes later never replays it (`replayToVantage` sends the dials and the run state
 * only), and a paused crest is skipped rather than handed a flare to play when it is next seen.
 * Nothing under reduced motion. Returns how many frames were told.
 */
export function flareTower(kind: FlareKind): number {
  if (prefersStill()) return 0;
  const m: TowerMessage = { type: "tower:flare", kind };
  const { frame, on } = useTowerBus.getState();
  let told = on && postTo(frame, m) ? 1 : 0;
  for (const card of cardFrames) if (postTo(card, m)) told += 1;
  return told;
}

/**
 * THE GLANCE (#3725): a click on a filter inside `scope` turns the Eye toward it for a moment.
 * To `frame` when given (the character card's own), else to the crest. Nothing under reduced motion.
 */
export function useTowerGlance(scope: string, frame?: RefObject<HTMLIFrameElement | null>): void {
  useEffect(() => {
    if (prefersStill()) return;
    const onClick = (e: MouseEvent): void => {
      const target = e.target instanceof Element ? e.target : null;
      const control = target?.closest(FILTER_CONTROLS);
      const iframe = frame ? frame.current : useTowerBus.getState().frame;
      if (!(control && iframe && control.closest(scope))) return;
      postTo(
        iframe,
        glanceMessage(iframe.getBoundingClientRect(), control.getBoundingClientRect()),
      );
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [frame, scope]);
}

/**
 * THE REGARD (the panel's contested row, seeded for Eric's eye on the flag): while a POINTER hovers
 * a calendar day or a blotter row inside `root`, the crest's Eye looks toward it; leaving lets it go.
 * Hover only — never focus (a tap does not focus on WebKit, and Tab would drag the Eye across 42
 * cells). One slot: a new item replaces the last. The scene caps the look at the glance's own hold.
 */
export function useTowerRegard(root: RefObject<HTMLElement | null>, enabled = true): void {
  useEffect(() => {
    const el = root.current;
    if (!(enabled && el) || prefersStill()) return;
    let current: Element | null = null;
    const hovering = (e: PointerEvent): boolean =>
      e.pointerType === "mouse" || e.pointerType === "pen";
    const onOver = (e: PointerEvent): void => {
      if (!hovering(e)) return;
      const item = e.target instanceof Element ? e.target.closest(REGARD_TARGETS) : null;
      if (!item || item === current) return;
      const frame = useTowerBus.getState().frame;
      if (!frame) return;
      current = item;
      postTo(frame, regardMessage(frame.getBoundingClientRect(), item.getBoundingClientRect()));
    };
    const onOut = (e: PointerEvent): void => {
      if (!(current && hovering(e))) return;
      const next =
        e.relatedTarget instanceof Element ? e.relatedTarget.closest(REGARD_TARGETS) : null;
      if (next === current) return;
      current = null;
      postTo(useTowerBus.getState().frame, { type: "tower:release" });
    };
    el.addEventListener("pointerover", onOver);
    el.addEventListener("pointerout", onOut);
    return () => {
      el.removeEventListener("pointerover", onOver);
      el.removeEventListener("pointerout", onOut);
    };
  }, [root, enabled]);
}

/**
 * ONE WINDOW, PAUSED UNLESS SEEN: the crest runs only while `shown`, on screen and in a visible tab.
 * Posts `tower:run` on every change (never on every scroll).
 */
export function useTowerRun(frame: RefObject<HTMLIFrameElement | null>, shown: boolean): void {
  useEffect(() => {
    const el = frame.current;
    let onScreen = true;
    let last: boolean | undefined;
    const send = (): void => {
      const on = shown && onScreen && document.visibilityState === "visible";
      if (on === last) return;
      last = on;
      toVantage({ type: "tower:run", on });
    };
    const io =
      el && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            onScreen = entries.some((x) => x.isIntersecting);
            send();
          })
        : undefined;
    if (el) io?.observe(el);
    document.addEventListener("visibilitychange", send);
    send();
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", send);
    };
  }, [frame, shown]);
}

/**
 * THE FORGE'S LIGHT, LIVE: a page with a selected persona landmark sends its dials to the crest;
 * leaving (or a landmark-less account) resets it to the scene's defaults — the crest never claims a
 * standing that is not on screen.
 */
export function useTowerMood(landmark?: Mood): void {
  const power = landmark?.power;
  const health = landmark?.health;
  useEffect(() => {
    if (power === undefined || health === undefined) return;
    toVantage({ type: "tower:mood", power, health });
    return () => toVantage({ type: "tower:mood", ...DEFAULT_MOOD });
  }, [power, health]);
}
