import { useEffect, useRef } from "react";

/**
 * LANDING ON A ROW (#4348, shared by #5022): a link that names one row by hash — an Events row's
 * `#pos-<symbol>`, a FORM square's or a Thesis marker's `#act-<orderId>` — scrolls that row to the
 * middle of what the sticky head leaves visible, keeps it there while the page above settles, and
 * marks it `data-landed` for a moment: a thick outline and an inset bar (shape, not hue — a standing
 * reader is red/green colorblind, CLAUDE.md). `landing.css` draws the mark.
 *
 * Any jump this code does not make — the browser's own for a plain `#…` anchor, the router's for a
 * Link with a hash — is top-aligned. The sticky head publishes how far down it reaches
 * (`publishClearance`), and every landing target's `scroll-margin-top` (landing.css) keeps those
 * jumps, and the centring here, clear of it.
 */

/** How long the landed mark stays — long enough to find, short enough not to read as selection. */
export const LANDED_MS = 2400;

/** How long the landing keeps re-centring while the page above it is still loading. */
const SETTLE_MS = 2000;

/** Inputs that mean the member is scrolling on their own, which ends the settle window. */
const TAKEOVER = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/** The anchor a hash names when it starts with `prefix` (`pos-`, `act-`), decoded; else undefined. */
export function targetedAnchor(prefix: string, hash: string): string | undefined {
  let raw = hash.startsWith("#") ? hash.slice(1) : hash;
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // A malformed escape is still a hash; match it as written.
  }
  return raw.startsWith(prefix) && raw.length > prefix.length ? raw : undefined;
}

/** Centre `el`, re-centre it on every layout change for `SETTLE_MS`, mark it for `LANDED_MS`.
 *  Returns the undo: the mark cleared and the watching stopped. */
export function land(el: HTMLElement): () => void {
  // Optional-call: happy-dom has no `scrollIntoView`.
  const centre = () => el.scrollIntoView?.({ block: "center" });
  centre();
  el.setAttribute("data-landed", "");
  // Cards above the target (the Overview's chart, decisions, league; the cockpit head's own
  // queries) load on their own, so the target can land and then be pushed down the page. Re-centre
  // on every layout change for a short window — and stop the instant the member takes the scroll.
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

/**
 * Land on the element the URL's hash points at once it renders, and again on every in-page hash
 * change. `find` turns the hash into this surface's element (undefined when the hash is not this
 * surface's, or its row has not rendered yet). `renderKey` changes when the rendered rows do; a
 * hash already landed on is not landed again when a refetch re-renders the same rows.
 */
export function useLandOnHash(
  find: (hash: string) => HTMLElement | undefined,
  renderKey: string,
): void {
  const landedHash = useRef<string | undefined>(undefined);
  // biome-ignore lint/correctness/useExhaustiveDependencies: renderKey IS the trigger
  useEffect(() => {
    if (typeof window === "undefined") return;
    let undo: (() => void) | undefined;
    const tryLand = (force: boolean) => {
      const hash = window.location.hash;
      if (!force && landedHash.current === hash) return;
      const el = find(hash);
      if (!el) return;
      undo?.();
      landedHash.current = hash;
      undo = land(el);
    };
    tryLand(false);
    const onHash = () => tryLand(true);
    window.addEventListener("hashchange", onHash);
    // The mark clears on its own timer: a refetch re-rendering the rows mid-flash must not cut it.
    return () => window.removeEventListener("hashchange", onHash);
  }, [renderKey]);
}

/** The custom property landing.css reads for every landing target's `scroll-margin-top`. */
const CLEARANCE = "--landing-clear";

/**
 * A sticky head's ref: publish, as `--landing-clear` on the root, how far down the viewport the
 * sticky stack reaches — the head's own `top` (the topbar above it) plus its height while it sticks.
 * The head is taller at 1280 than at 390 and grows off the Overview, so it is measured, not a
 * fixed number. A head that does not stick (`.acct-head` at ≤860) leaves only the topbar.
 */
export function publishClearance(head: HTMLElement | null): (() => void) | undefined {
  if (!head || typeof window === "undefined") return undefined;
  const root = document.documentElement;
  const publish = () => {
    const style = window.getComputedStyle(head);
    const top = Number.parseFloat(style.top) || 0;
    const stuck = style.position === "sticky" ? head.offsetHeight : 0;
    root.style.setProperty(CLEARANCE, `${Math.ceil(top + stuck)}px`);
  };
  publish();
  const watch = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(publish);
  watch?.observe(head);
  window.addEventListener("resize", publish);
  return () => {
    watch?.disconnect();
    window.removeEventListener("resize", publish);
    root.style.removeProperty(CLEARANCE);
  };
}
