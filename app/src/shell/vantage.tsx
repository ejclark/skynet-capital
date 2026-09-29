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
import { useMediaQuery } from "./use-media";
import { TABLET_QUERY } from "./widths";

/**
 * THE CREST (#3807 slice 3a, behind `?shell=watchtower`): the tower, framed on its crown and Eye,
 * as the RIGHT cap of the market calendar's band (Eric's third review, 2026-09-26: top-right is
 * "out of the way", and the right column is already identity and standing). The Eye glances LEFT,
 * toward the day or filter a member picks.
 *
 * ONE WINDOW FOR THE SESSION. A single `/tower?frame=crown` iframe, mounted here in the shell as a
 * sibling of the page (never inside the topbar), laid over the band's slot (`TowerSlot`) with fixed
 * positioning that a ResizeObserver and the scroll keep in step — never re-parented, never
 * unmounted across navigation, because every mount is a new WebGL context and a shader compile.
 * It mounts the first time a slot is visible and then only hides:
 *
 *   · hidden and paused (`tower:run {on:false}`) at ≤860px (no WebGL on the phone until the real-
 *     device recheck, docs/art/EYE.md), on Settings, and on any page with no band;
 *   · paused, still in place, while scrolled off screen or in a background tab;
 *   · under reduced motion the scene draws its one still frame and sends nothing else.
 *
 * Presence, not ceremony: the crest is a small still-framed window with the Eye's slow sweep.
 * MOVING IS THE DEFAULT, by Eric's pick after comparing the two by eye (2026-09-27: "live - the
 * subtle animation in the background offers opportunities"). STILL IS THE MEMBER'S SETTING —
 * Settings → Display → "Tower motion" (slice 3b-1, `prefs.ts`), the WCAG 2.2.2 pause for motion
 * that runs beside content: the scene's `rest=still`, one frame at rest and the loop only while a
 * glance or a regard plays. `?crest=still|live` still sets it from a URL.
 */

/** Where the band renders its right cap when the flag is on. */
export const SLOT_SELECTOR = "[data-tower-slot]";

/** The crest's scene at `quality=presence` (#3807 slice 3a-2): 30 draws a second, DPR ≤ 1, no
 *  shadow map, half the embers — a small presence spends like one (`src/three/kit/quality.ts`). */
export const CREST_SRC = "/tower?frame=crown&quality=presence";

/** The frame's src for a page at `search`: `?probe=1` on the page is forwarded, so the scene shows
 *  its corner readout (fps · frames · submit p50/p95) — the real number, read on a real machine.
 *  A `still` crest asks the scene for `rest=still` (slice 3a-3); a scene without it ignores it. */
export function crestSrc(search: string, crest: Crest = "live"): string {
  const rest = crest === "still" ? `${CREST_SRC}&rest=still` : CREST_SRC;
  try {
    return new URLSearchParams(search).get("probe") === "1" ? `${rest}&probe=1` : rest;
  } catch {
    return rest;
  }
}

const isSettings = (pathname: string): boolean => {
  const path = pathname.replace(/^\/app(?=\/|$)/, "") || "/";
  return path === "/settings" || path.startsWith("/settings/");
};

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
  phone,
}: {
  /** The app column: where the slot and the regard targets live. */
  readonly root: RefObject<HTMLElement | null>;
  readonly pathname: string;
  readonly phone: boolean;
}): ReactElement | null {
  const flag = usePrefs((s) => s.shell) === "watchtower";
  const eligible = flag && !phone && !isSettings(pathname);
  const slot = useSlot(root, eligible, pathname);
  const box = useBox(slot);
  const shown = eligible && slot !== null && box !== null;
  const [mounted, setMounted] = useState(false);
  // The page's search is frozen at first render: a later navigation drops `?probe=1`, and a
  // changed src reloads the scene (a new WebGL context and a shader compile). Only the member's
  // own motion setting changes it — a deliberate, rare reload, so the setting applies at once.
  const [search] = useState(() => window.location.search);
  const crest = usePrefs((s) => s.crest);
  const src = crestSrc(search, crest);
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

  if (!(flag && mounted)) return null;
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
  // ≤ the tablet width is where the shell wraps (`shell.css`, `widths.ts`), phones included.
  const phone = useMediaQuery(TABLET_QUERY);
  return <VantageFrame root={root} pathname={pathname} phone={phone} />;
}

/** The band's right cap: an empty, sized box the crest is laid over. Renders only under the flag. */
export function TowerSlot(): ReactElement | null {
  const flag = usePrefs((s) => s.shell) === "watchtower";
  return flag ? <span className="tower-slot" data-tower-slot="" aria-hidden="true" /> : null;
}
