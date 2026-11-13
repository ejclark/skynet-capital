import { useMediaQuery } from "./use-media";
import { BENCH_QUERY } from "./widths";

/**
 * Whether the page frame gives the tower its own column (#3977): from the bench width (1280). One
 * answer for the frame, the shell's tower frame and the pages that hand their card to the column, so
 * they never disagree. Moneypenny's right rail used to take its width out of the window first; the
 * dock that replaced it (#7487 slice 2) sits under the stage and takes height, not width, so the
 * window's width is the page's room again.
 */
export function useTowerColumn(): boolean {
  return useMediaQuery(BENCH_QUERY);
}
