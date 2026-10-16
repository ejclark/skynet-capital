import { type RefObject, useEffect, useRef } from "react";

/**
 * OPEN AT THE PRICE ROW (#5234, picked on #5171 round 1) — on a phone the folded Chain section
 * opened at its expiry strip and the "Current price" row sat 1.2 screens down, so the strikes a
 * member came for were one long swipe away. This lands the page, once, with that row centred in
 * the visible area under the sticky top bar; the expiry dates and the page head stay one swipe up.
 *
 * ONCE per open, never again: an expiry chip, Refresh or a strike tap must not move the page out
 * from under the finger that just used it — the section remounts on every open, so a ref is the
 * whole "already opened" memory. A member who scrolled before the rows arrived has already chosen
 * where to look, so a gesture (wheel, touch, a scroll key) before then cancels it. Gestures, not
 * `scroll` events: the router's own reset-to-top on the section switch fires those too. No row
 * (no live price — the chain is windowed around the middle) means nothing to centre on. Instant,
 * never animated, so reduced motion holds with no extra branch.
 */

const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

/** Where the page lands: the row's middle on the middle of what the top bar leaves visible. */
export function priceRowTop(
  row: Pick<DOMRect, "top" | "height">,
  scrollY: number,
  barBottom: number,
  viewport: number,
): number {
  const middle = barBottom + (viewport - barBottom) / 2;
  return Math.max(0, Math.round(scrollY + row.top + row.height / 2 - middle));
}

/** `armed` is false where another rule owns the scroll (docked, the bench scrolls the pane);
 *  `ready` turns true once the rows rendered — the first true is the one look this hook takes. */
export function useOpenAtPrice(
  root: RefObject<HTMLElement | null>,
  armed: boolean,
  ready: boolean,
): void {
  const done = useRef(!armed);
  const touched = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const mark = (event: Event) => {
      if (event instanceof KeyboardEvent) {
        const field =
          event.target instanceof HTMLElement && event.target.closest("input, textarea");
        if (field || !SCROLL_KEYS.has(event.key)) return;
      }
      touched.current = true;
    };
    const kinds = ["wheel", "touchmove", "keydown"] as const;
    for (const kind of kinds) window.addEventListener(kind, mark, { passive: true });
    return () => {
      for (const kind of kinds) window.removeEventListener(kind, mark);
    };
  }, []);
  useEffect(() => {
    if (done.current || !ready) return;
    done.current = true;
    const row = root.current?.querySelector(".straddle-divider");
    if (touched.current || !row || typeof window.scrollTo !== "function") return;
    const barBottom = Math.max(
      0,
      document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 0,
    );
    const top = priceRowTop(
      row.getBoundingClientRect(),
      window.scrollY,
      barBottom,
      window.innerHeight,
    );
    window.scrollTo({ top, behavior: "instant" });
  }, [root, ready]);
}
