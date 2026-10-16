/** The custom property a page's sticky head reads for its `top` (`cockpit.css`). */
const TOPBAR = "--topbar-h";

/**
 * The top bar's ref: publish its height, as `--topbar-h` on the root, so a page's sticky head sits
 * flush under it at every width — and moves down with it while the status line's panel is open.
 * The bar is one row at a desk and two on a phone, and the status widget sets its height, so it is
 * measured, never a fixed number: the Profile head used a fixed 64px, which left a 12px gap at
 * 1280 and slid its account row 21px under the phone bar (#5072). Same shape as
 * `publishClearance` (`landing.ts`): a ref callback that returns its own cleanup.
 */
export function publishTopbarHeight(bar: HTMLElement | null): (() => void) | undefined {
  if (!bar || typeof window === "undefined") return undefined;
  const root = document.documentElement;
  const publish = () =>
    root.style.setProperty(TOPBAR, `${Math.round(bar.getBoundingClientRect().height)}px`);
  publish();
  const watch = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(publish);
  watch?.observe(bar);
  return () => {
    watch?.disconnect();
    root.style.removeProperty(TOPBAR);
  };
}
