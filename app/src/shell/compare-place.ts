import { type RefObject, useCallback, useLayoutEffect, useRef } from "react";
import { prefersStill } from "./tower-bus";

/**
 * THE VIEW FOLLOWS THE RESULT (#5057; Eric's pick on #5037 question 8, "Keep your place; scroll
 * the result in"; the pattern's row is in docs/PATTERNS.md). The Leaderboard's Compare taps keep
 * the scroll (#4944's rule), but the head-to-head they produce renders ABOVE the Field, so keeping
 * the scroll alone would leave it out of sight. So the view moves exactly once, to the result,
 * never to the top, and the way out comes back:
 *
 *   - a tap that COMPLETES a pair moves the view, once the head-to-head has rendered, so its
 *     card sits just under the sticky top bar, and focus goes to its heading. Smooth, or an
 *     instant jump under `prefers-reduced-motion`;
 *   - Clear puts the row the pair was made from back where it sat on screen;
 *   - a row's own toggle that ends a showing pair (Clear on a paired row, or Compare on a third
 *     row) holds that row still while the head-to-head above it disappears;
 *   - the first pick moves nothing — and a pair that arrives by a shared link opens where the page
 *     opens, at the top.
 *
 * Both moves run in a layout effect on the render that adds or removes the head-to-head, so the
 * member never sees the in-between frame. The positions are kept in the component, never the URL.
 */

/** Where a row sat when it was tapped: its viewport top, and the page's scroll then. */
export interface RowPlace {
  readonly key: string;
  readonly top: number;
  readonly scrollY: number;
}

/** The space left between the sticky top bar and the heading the view moves to. */
const GAP = 12;

/** The scroll that puts a heading `GAP`px under the sticky stack, whose bottom edge is `clear`. */
export function revealScroll(headingTop: number, scrollY: number, clear: number): number {
  return Math.max(0, Math.round(scrollY + headingTop - clear - GAP));
}

/** The scroll that puts a row back at the viewport top it had when tapped (or, if it has left the
 *  board, back to the scroll the page had then). */
export function returnScroll(
  place: RowPlace,
  rowTopNow: number | undefined,
  scrollY: number,
): number {
  return rowTopNow === undefined
    ? place.scrollY
    : Math.max(0, Math.round(scrollY + rowTopNow - place.top));
}

export interface ComparePlace {
  /** A row's Compare/Cancel/Clear was tapped; `completes` when this tap makes the pair. */
  readonly tapped: (key: string, row: Element | null, completes: boolean) => void;
  /** The head-to-head's own Clear was tapped. */
  readonly cleared: () => void;
}

type Pending = { readonly to: "result" } | { readonly to: "row"; readonly place: RowPlace };

/** The row the Field renders for `key` (`data-row`), matched without building a selector from it. */
const rowFor = (key: string): Element | undefined =>
  [...document.querySelectorAll<HTMLElement>("[data-row]")].find((el) => el.dataset.row === key);

export function useComparePlace(
  shown: boolean,
  heading: RefObject<HTMLElement | null>,
): ComparePlace {
  const pending = useRef<Pending | undefined>(undefined);
  const last = useRef<RowPlace | undefined>(undefined);
  const showing = useRef(shown);
  showing.current = shown;

  const tapped = useCallback((key: string, row: Element | null, completes: boolean) => {
    const place = { key, top: row?.getBoundingClientRect().top ?? 0, scrollY: window.scrollY };
    last.current = place;
    pending.current = completes
      ? { to: "result" }
      : showing.current
        ? { to: "row", place }
        : undefined;
  }, []);

  const cleared = useCallback(() => {
    pending.current = last.current ? { to: "row", place: last.current } : undefined;
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the head-to-head appearing or going IS the trigger
  useLayoutEffect(() => {
    const next = pending.current;
    if (!next || typeof window === "undefined") return;
    if (next.to === "result" && shown && heading.current) {
      pending.current = undefined;
      const clear = document.querySelector(".topbar")?.getBoundingClientRect().bottom ?? 0;
      // The card the heading opens, edge included, rather than the heading cut out of it.
      const card = heading.current.closest("section") ?? heading.current;
      const top = revealScroll(card.getBoundingClientRect().top, window.scrollY, clear);
      window.scrollTo({ top, behavior: prefersStill() ? "instant" : "smooth" });
      heading.current.focus({ preventScroll: true });
    } else if (next.to === "row" && !shown) {
      pending.current = undefined;
      const now = rowFor(next.place.key)?.getBoundingClientRect().top;
      window.scrollTo({ top: returnScroll(next.place, now, window.scrollY), behavior: "instant" });
    }
  }, [shown]);

  return { tapped, cleared };
}
