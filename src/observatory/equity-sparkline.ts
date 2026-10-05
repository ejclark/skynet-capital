import type { EquitySample } from "./history-store.js";

/**
 * Peak equity and the worst peak-to-trough dip across the recorded window (max drawdown) — the honest
 * "how bumpy was the ride" read, derived purely from the equity samples. Drawdown is measured against
 * the running peak, so a later recovery doesn't erase a dip that happened. Null when <2 samples.
 * Consumed by `pulse-json-view.ts` and `thesis-json-view.ts`.
 */
export function equityDrawdown(
  samples: readonly EquitySample[],
): { peak: number; ddPct: number; ddAbs: number } | null {
  return equityDrawdownOf([...samples].sort((a, b) => a.at.localeCompare(b.at)));
}

/**
 * `equityDrawdown` over samples already in ascending `at` order — skips the sort. A desk's Pulse
 * view needs the same order for its curve, streaks and doubling race too, so the request sorts once
 * and every section reuses it (#4612 slice 7). Measured: removing these five redundant sorts alone
 * did not close the 150 ms Pulse budget at 180 days — reading and parsing the file is the larger
 * cost (`src/storage/jsonl-store.ts`'s `list()`, not yet bounded) — so this is a real but partial
 * win, left on #4619 alongside that larger one.
 */
export function equityDrawdownOf(
  sorted: readonly EquitySample[],
): { peak: number; ddPct: number; ddAbs: number } | null {
  if (sorted.length < 2) return null;
  let peak = Number.NEGATIVE_INFINITY;
  let ddPct = 0;
  let ddAbs = 0;
  for (const s of sorted) {
    if (s.equity > peak) peak = s.equity;
    const dipAbs = peak - s.equity;
    const dipPct = peak > 0 ? (dipAbs / peak) * 100 : 0;
    if (dipAbs > ddAbs) ddAbs = dipAbs;
    if (dipPct > ddPct) ddPct = dipPct;
  }
  return { peak, ddPct, ddAbs };
}
