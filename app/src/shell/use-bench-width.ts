import { useMediaQuery } from "./use-media";

/**
 * THE BENCH WIDTH (#3407, Workbench slice 4b) — the one breakpoint at which `/trade`'s sections
 * stop being exclusive and DOCK as one bench (frame.tsx → "ONE COMPOSITION OF SECTIONS"). 1280 is
 * the narrowest window where the ticket and the chain each get a column the chain's straddle
 * table was already proven readable in (the 390px phone frame proves a ~260px pane; a 1280
 * window gives each column ~450px beside the rail). Below it the page folds to the section
 * switch it always had — mobile-first (CLAUDE.md): the phone curates, the desktop adds room, never
 * a new concept. Read through `matchMedia` (`use-media.ts`) so the fold happens on a live resize,
 * and `false` wherever `matchMedia` is missing (jsdom, SSR), which is the folded, always-correct
 * default.
 * @category trading
 */
export const BENCH_MIN_WIDTH = 1280;

/** True when the window is at least the bench width — the bench docks; false folds it. */
export function useBenchWidth(): boolean {
  return useMediaQuery(`(min-width: ${BENCH_MIN_WIDTH}px)`);
}
