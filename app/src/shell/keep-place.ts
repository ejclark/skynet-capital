import type { RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * A REFINEMENT KEEPS THE PAGE STILL (#5021). #4944 stopped the router scrolling to the top on a
 * filter chip or a lens; the motion left was the browser's own. The positions list is the last
 * thing on the Overview, so a chip, a typed filter or a lens that shortens it shortens the page,
 * and once the page is shorter than `scrollY + innerHeight` the browser clamps `scrollY` — the
 * page moved under the member's finger (Map −460px, "Losing" up to −1,492px in one phone session,
 * #4943). The Map lens also drops the decision card above the list, which moves it the other way.
 *
 * So the anchor (the filter bar) is measured just before a refinement, and once the new result is
 * laid out — before the browser paints it — the page is scrolled so the bar sits where it was. If
 * the page is now too short to scroll there, the result region keeps a `min-height` of exactly
 * what the view needs to stay filled, never the old list's whole height. That space goes back as the member
 * scrolls up (only the part under the view's bottom edge, so nothing they can see moves), and all
 * of it on the next refinement or when the section unmounts. Never on first render.
 *
 * Nothing animates: the correction lands in the same frame as the new rows, so there is no motion
 * for `prefers-reduced-motion` to soften — reduced or not, the page simply does not move.
 */

/** The page as one refinement left it, read after layout and before paint, with no hold applied. */
export interface Settled {
  /** The anchor's viewport `top` just before the refinement. */
  readonly before: number;
  /** Its viewport `top` now (after any clamp the shorter page caused). */
  readonly now: number;
  readonly scrollY: number;
  readonly viewport: number;
  /** `document.documentElement.scrollHeight`. */
  readonly page: number;
  /** The result region's viewport `top`. */
  readonly regionTop: number;
}

export interface Place {
  /** The scroll that puts the anchor back where it was — never above the top of the page. */
  readonly scrollTo: number;
  /**
   * When the page is now too short to scroll there: the region height that would put its bottom
   * at the view's bottom edge. The hold is this less whatever sits under the region in its own
   * column — read by trying it, since a taller column beside the list (the tower column at 1280)
   * also sets the page's height and would make a plain shortfall come out too small.
   */
  readonly reach: number | undefined;
}

/** Where to scroll to put the anchor back where the member left it, and whether the page can. */
export function placeFor(s: Settled): Place {
  // The anchor's place on the page doesn't depend on the scroll; its place on screen does.
  const scrollTo = Math.max(0, s.scrollY + s.now - s.before);
  const bottom = scrollTo + s.viewport;
  return { scrollTo, reach: s.page < bottom ? bottom - (s.regionTop + s.scrollY) : undefined };
}

/**
 * How much of a hold to keep once the member scrolls: `below` is the page under the view's bottom
 * edge, which can go without anything on screen moving. `undefined` once the rows fill the view on
 * their own (`natural` is the region's height without the hold).
 */
export function easeHold(held: number, below: number, natural: number): number | undefined {
  if (below < 1) return held;
  const next = held - below;
  return next > natural ? next : undefined;
}

/** Apply a hold to the region and give it back as the member scrolls up. Returns its release. */
function holdRegion(region: HTMLElement, minHeight: number, natural: number): () => void {
  let held = minHeight;
  region.style.minHeight = `${held}px`;
  const ease = () => {
    const root = document.documentElement;
    const next = easeHold(held, root.scrollHeight - window.scrollY - window.innerHeight, natural);
    if (next === undefined) release();
    else if (next !== held) {
      held = next;
      region.style.minHeight = `${held}px`;
    }
  };
  const release = () => {
    region.style.minHeight = "";
    window.removeEventListener("scroll", ease);
    window.removeEventListener("resize", ease);
  };
  window.addEventListener("scroll", ease, { passive: true });
  window.addEventListener("resize", ease, { passive: true });
  return release;
}

/**
 * Keep `anchor` still across a refinement of what renders in `region`. Call the returned `mark()`
 * just before a change that will alter `renderKey` (a chip, the filter text, a lens); the fix-up
 * runs in the layout effect of the render that shows it.
 */
export function useKeepPlace(
  anchor: RefObject<HTMLElement | null>,
  region: RefObject<HTMLElement | null>,
  renderKey: string,
): () => void {
  const marked = useRef<number | undefined>(undefined);
  const release = useRef<(() => void) | undefined>(undefined);

  const mark = useCallback(() => {
    const el = anchor.current;
    if (el) marked.current = el.getBoundingClientRect().top;
  }, [anchor]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: renderKey IS the trigger
  useLayoutEffect(() => {
    const before = marked.current;
    marked.current = undefined;
    const bar = anchor.current;
    const box = region.current;
    if (before === undefined || !bar || !box || typeof window === "undefined") return;
    // Measure the new result as it is, without the last refinement's hold.
    release.current?.();
    release.current = undefined;
    const natural = box.getBoundingClientRect().height;
    const { scrollTo, reach } = placeFor({
      before,
      now: bar.getBoundingClientRect().top,
      scrollY: window.scrollY,
      viewport: window.innerHeight,
      page: document.documentElement.scrollHeight,
      regionTop: box.getBoundingClientRect().top,
    });
    if (reach !== undefined && reach > natural) {
      // Stretch the region to the view's bottom; what the page then has past that point is the
      // part under the region (the page's foot), which the hold need not cover.
      box.style.minHeight = `${reach}px`;
      const under = document.documentElement.scrollHeight - (scrollTo + window.innerHeight);
      const hold = Math.ceil(reach - Math.max(0, under));
      box.style.minHeight = "";
      if (hold > natural) release.current = holdRegion(box, hold, natural);
    }
    if (Math.abs(window.scrollY - scrollTo) >= 0.5) {
      window.scrollTo({ top: scrollTo, behavior: "instant" });
    }
  }, [renderKey]);

  // Leaving the section takes its hold with it.
  useEffect(() => () => release.current?.(), []);

  return mark;
}
