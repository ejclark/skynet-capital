import { useCallback, useSyncExternalStore } from "react";

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
