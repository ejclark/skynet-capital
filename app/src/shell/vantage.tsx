import { useRouterState } from "@tanstack/react-router";
import { type ReactElement, type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { type Crest, usePrefs } from "./prefs";
import {
  replayToVantage,
  setVantageFrame,
  useTowerGlance,
  useTowerRegard,
  useTowerRun,
} from "./tower-bus";
import { usePhoneWidth } from "./use-media";

/**
 * THE HOME SCREEN'S TOWER (#8189, #8161 stage 2; docs/IA.md §8.4). One big tower, unboxed (Eric,
 * 2026-09-30: "remove the section outline around the tower [so the] light from the eye [is] less
 * contained"), in the home screen's tower box from the tablet width. It stood in the page frame's
 * own column on every non-Settings page from #3977 until #8189 took it off every page but the home:
 * pages rest on information, and the column took ~37% of a 1280px window.
 *
 * ONE WINDOW FOR THE SESSION. A single `/tower?frame=card` iframe, mounted here in the shell as a
 * sibling of the page (never inside the topbar), laid over the home's slot (`TowerSlot`) with
 * fixed positioning that a ResizeObserver and the scroll keep in step — never re-parented, never
 * unmounted across navigation, because every mount is a new WebGL context and a shader compile.
 * Leaving the home and coming back keeps the same tower. It mounts the first time a slot is visible
 * and then only hides:
 *
 *   · hidden and paused (`tower:run {on:false}`) on every page but the home, and on the home at
 *     the tablet width and narrower, where the home shows a committed still instead (no WebGL on a
 *     phone until #3977's real-device recheck);
 *   · paused, still in place, while scrolled off screen or in a background tab;
 *   · under reduced motion the scene draws its one still frame and sends nothing else.
 *
 * MOVING IS THE DEFAULT, by Eric's pick after comparing the two by eye (2026-09-27: "live - the
 * subtle animation in the background offers opportunities"). STILL IS THE MEMBER'S SETTING —
 * Settings → Display → "Tower motion" (`prefs.ts`), the WCAG 2.2.2 pause for motion that runs
 * beside content: the scene's `rest=still`, one frame at rest and the loop only while a glance or
 * a regard plays. `?crest=still|live` still sets it from a URL.
 */

/** Where the home screen's box asks for the tower. */
export const SLOT_SELECTOR = "[data-tower-slot]";

/** The scene in the character card's framing (horns near the top, the Eye ~60% across), at the
 *  scene's full quality; `frame=card` re-fits any box, so the home's wide box needs no change. */
export const COLUMN_SRC = "/tower?frame=card";

/** The frame's src for a page at `search`: `?probe=1` on the page is forwarded, so the scene shows
 *  its corner readout (fps · frames · submit p50/p95) — the real number, read on a real machine.
 *  A `still` tower asks the scene for `rest=still` (slice 3a-3); a scene without it ignores it. */
export function columnSrc(search: string, crest: Crest = "live"): string {
  const rest = crest === "still" ? `${COLUMN_SRC}&rest=still` : COLUMN_SRC;
  try {
    return new URLSearchParams(search).get("probe") === "1" ? `${rest}&probe=1` : rest;
  } catch {
    return rest;
  }
}

const routePath = (pathname: string): string => pathname.replace(/^\/app(?=\/|$)/, "") || "/";

/** The home screen (#8189): the one page with a tower box. */
export const isHome = (pathname: string): boolean => routePath(pathname) === "/";

interface Box {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

const sameBox = (a: Box | null, b: Box | null): boolean =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height);

/** The band's slot on the current page, re-found as pages render (their data loads late). */
function useSlot(root: RefObject<HTMLElement | null>, enabled: boolean, pathname: string) {
  const [slot, setSlot] = useState<Element | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a navigation must re-find the slot
  useEffect(() => {
    const el = root.current;
    if (!(enabled && el)) {
      setSlot(null);
      return;
    }
    let raf = 0;
    const find = (): void => {
      raf = 0;
      setSlot(el.querySelector(SLOT_SELECTOR));
    };
    find();
    const mo = new MutationObserver(() => {
      if (!raf) raf = requestAnimationFrame(find);
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [root, enabled, pathname]);
  return slot;
}

/** The slot's box in the viewport, kept in step with layout and scroll. */
function useBox(slot: Element | null): Box | null {
  const [box, setBox] = useState<Box | null>(null);
  useEffect(() => {
    if (!slot) return;
    let raf = 0;
    const measure = (): void => {
      raf = 0;
      const r = slot.getBoundingClientRect();
      const next = { top: r.top, left: r.left, width: r.width, height: r.height };
      setBox((prev) => (sameBox(prev, next) ? prev : next));
    };
    const soon = (): void => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(soon) : undefined;
    ro?.observe(slot);
    ro?.observe(document.documentElement);
    window.addEventListener("scroll", soon, { capture: true, passive: true });
    window.addEventListener("resize", soon);
    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", soon, { capture: true });
      window.removeEventListener("resize", soon);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [slot]);
  return box;
}

/** The crest itself: pure in its inputs, so the spec can drive it without a router. */
export function VantageFrame({
  root,
  pathname,
  wide,
}: {
  /** The app column: where the slot and the regard targets live. */
  readonly root: RefObject<HTMLElement | null>;
  readonly pathname: string;
  /** On the home screen above the tablet width — the one place the moving tower shows. */
  readonly wide: boolean;
}): ReactElement | null {
  const eligible = wide;
  const slot = useSlot(root, eligible, pathname);
  const box = useBox(slot);
  const shown = eligible && slot !== null && box !== null;
  const [mounted, setMounted] = useState(false);
  // The page's search is frozen at first render: a later navigation drops `?probe=1`, and a
  // changed src reloads the scene (a new WebGL context and a shader compile). Only the member's
  // own motion setting changes it — a deliberate, rare reload, so the setting applies at once.
  const [search] = useState(() => window.location.search);
  const crest = usePrefs((s) => s.crest);
  const src = columnSrc(search, crest);
  if (shown && !mounted) setMounted(true);

  const frame = useRef<HTMLIFrameElement | null>(null);
  const attach = useCallback((el: HTMLIFrameElement | null) => {
    frame.current = el;
    setVantageFrame(el);
  }, []);

  // The scene says `tower:ready` once compiled (and a load event covers a scene too old to say
  // so): either way it gets the latest dials and run state.
  useEffect(() => {
    const onMessage = (e: MessageEvent): void => {
      const from = frame.current?.contentWindow;
      if (e.origin !== window.location.origin || !from || e.source !== from) return;
      if ((e.data as { type?: unknown } | null)?.type === "tower:ready") replayToVantage();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useTowerRun(frame, shown);
  useTowerRegard(root, shown);
  useTowerGlance("main, .cockpit");

  if (!mounted) return null;
  const last = box ?? { top: 0, left: 0, width: 0, height: 0 };
  return (
    <iframe
      ref={attach}
      className="vantage"
      src={src}
      title="Barad-dûr, Sauron's tower"
      aria-hidden="true"
      tabIndex={-1}
      data-shown={shown ? "true" : "false"}
      onLoad={replayToVantage}
      style={{ top: last.top, left: last.left, width: last.width, height: last.height }}
    />
  );
}

/** Mounted once from `RootShell`, beside the page. */
export function Vantage({
  root,
}: {
  readonly root: RefObject<HTMLElement | null>;
}): ReactElement | null {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // The home's tower box takes the frame from 861px; a phone gets its committed still (#8189).
  const phone = usePhoneWidth();
  const wide = isHome(pathname) && !phone;
  return <VantageFrame root={root} pathname={pathname} wide={wide} />;
}

/** The home's art box: an empty, sized box the session's one tower frame is laid over. */
export function TowerSlot(): ReactElement {
  return <span className="tower-slot" data-tower-slot="" aria-hidden="true" />;
}
