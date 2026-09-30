import { useCallback, useSyncExternalStore } from "react";
import { TABLET_QUERY } from "./widths";

/**
 * A media query as React state (#3807 slice 2·1, generalized from `use-bench-width.ts`): read
 * through `matchMedia` so a live resize re-renders, `false` wherever `matchMedia` is missing
 * (a DOM without it, SSR) — the folded, always-correct default. One subscription per query.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia?.(query);
      if (!media) return () => undefined;
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => Boolean(window.matchMedia?.(query).matches), [query]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const getServerSnapshot = (): boolean => false;

/** ≤ the tablet width (860, `widths.ts`) — the shell wraps (`shell.css`), phones included: the
 *  calendar's head folds into its sheet (`calendar-sheet.tsx`) and no tower frame mounts (#3977). */
export function usePhoneWidth(): boolean {
  return useMediaQuery(TABLET_QUERY);
}
