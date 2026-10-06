import { useMoneypenny } from "../live/moneypenny";
import { useMediaQuery } from "./use-media";
import { BENCH_QUERY, WIDTHS } from "./widths";

/** Moneypenny's rail at the widths that matter here (`moneypenny.css`: `min(440px, 42vw)`). */
const RAIL_PX = 440;

/**
 * Whether the page frame gives the tower its own column (#3977): when the page's own room — the
 * window, less Moneypenny's rail while it is open (it pushes everything left, `moneypenny-rail.tsx`)
 * — is at least the bench width. Measured, not guessed: at a 1280 window with the rail open the
 * column left Trade's docked bench 353px wide (`scripts/shoot/trade-band.mjs`), so the column steps
 * aside until the room is back. One answer for the frame, the shell's tower frame and the pages that
 * hand their card to the column, so they never disagree.
 */
export function useTowerColumn(): boolean {
  const wide = useMediaQuery(BENCH_QUERY);
  const roomy = useMediaQuery(`(min-width: ${WIDTHS.bench + RAIL_PX}px)`);
  const rail = useMoneypenny((s) => s.open);
  return rail ? roomy : wide;
}
