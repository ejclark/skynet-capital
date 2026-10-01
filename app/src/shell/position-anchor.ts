import { useEffect, useRef } from "react";

/**
 * LANDING ON A POSITION (#4348). An Events row links `/app/accounts#pos-<symbol>`, but the browser's
 * own hash jump can't honor it: the blotter loads after the router has tried the hash, and the
 * position exists twice — the table row (`tr#pos-<symbol>`, which `tower-bus.ts` REGARD_TARGETS
 * reads) and, at phone width, its card. CSS shows one; an `id` on both would duplicate it, so the
 * card carries the anchor as `data-pos-anchor` instead, and this picks whichever is laid out.
 *
 * The landed element is scrolled to centre and marked `data-landed` for a moment: a thick outline
 * and an inset bar (shape, not hue — a standing reader is red/green colorblind, CLAUDE.md).
 */

export const positionAnchor = (symbol: string): string => `pos-${symbol}`;

/** How long the landed mark stays — long enough to find, short enough not to read as selection. */
export const LANDED_MS = 2400;

/** The `pos-<symbol>` the URL points at, if any. Tiles encode the symbol; Events links don't. */
export function targetedPosition(hash: string): string | undefined {
  let raw = hash.startsWith("#") ? hash.slice(1) : hash;
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // A malformed escape is still a hash; match it as written.
  }
  return raw.startsWith("pos-") && raw.length > 4 ? raw : undefined;
}

/** A candidate CSS hid (`display: none` on it or an ancestor) has no layout boxes. */
const laidOut = (el: Element): boolean => el.getClientRects().length > 0;

/** The row or card for `anchor` that the current breakpoint is actually showing. */
export function visiblePositionTarget(root: ParentNode, anchor: string): HTMLElement | undefined {
  const candidates = [
    ...root.querySelectorAll<HTMLElement>(`[id="${CSS.escape(anchor)}"]`),
    ...root.querySelectorAll<HTMLElement>(`[data-pos-anchor="${CSS.escape(anchor)}"]`),
  ];
  return candidates.find(laidOut);
}

/** How long the landing keeps re-centring while the page above it is still loading. */
export const SETTLE_MS = 2000;

function land(el: HTMLElement): () => void {
  // Optional-call, as `activity-table.tsx` does: happy-dom has no `scrollIntoView`.
  const centre = () => el.scrollIntoView?.({ block: "center" });
  centre();
  el.setAttribute("data-landed", "");
  // The Overview's cards above the blotter (chart, decisions, league) load on their own queries, so
  // the target can land and then be pushed down the page. Re-centre on every layout change for a
  // short window — and stop the instant the member takes the scroll themselves.
  const shift = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(centre);
  shift?.observe(document.body);
  const settle = () => {
    shift?.disconnect();
    for (const t of TAKEOVER) window.removeEventListener(t, settle);
  };
  for (const t of TAKEOVER) window.addEventListener(t, settle, { passive: true });
  const settled = setTimeout(settle, SETTLE_MS);
  const timer = setTimeout(() => el.removeAttribute("data-landed"), LANDED_MS);
  return () => {
    clearTimeout(timer);
    clearTimeout(settled);
    settle();
    el.removeAttribute("data-landed");
  };
}

/** Inputs that mean the member is scrolling on their own, which ends the settle window. */
const TAKEOVER = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/**
 * Scroll the blotter's targeted position into view once it renders, and again on every in-page
 * hash change (the Map lens's tiles). `renderKey` changes when the rendered rows do; a hash already
 * landed on isn't landed again when a refetch re-renders the same rows.
 */
export function useLandOnPosition(renderKey: string): void {
  const landedHash = useRef<string | undefined>(undefined);
  // biome-ignore lint/correctness/useExhaustiveDependencies: renderKey IS the trigger
  useEffect(() => {
    if (typeof window === "undefined") return;
    let undo: (() => void) | undefined;
    const tryLand = (force: boolean) => {
      const anchor = targetedPosition(window.location.hash);
      if (!anchor || (!force && landedHash.current === anchor)) return;
      const el = visiblePositionTarget(document, anchor);
      if (!el) return;
      undo?.();
      landedHash.current = anchor;
      undo = land(el);
    };
    tryLand(false);
    const onHash = () => tryLand(true);
    window.addEventListener("hashchange", onHash);
    // The mark clears on its own timer: a refetch re-rendering the rows mid-flash must not cut it.
    return () => window.removeEventListener("hashchange", onHash);
  }, [renderKey]);
}
