import type { EquitySample } from "./history-store.js";

/**
 * Peak equity and the worst peak-to-trough dip across the recorded window (max drawdown) — the honest
 * "how bumpy was the ride" read, derived purely from the equity samples. Drawdown is measured against
 * the running peak, so a later recovery doesn't erase a dip that happened. Null when <2 samples.
 * Consumed by `pulse-json-view.ts`.
 */
export function equityDrawdown(
  samples: readonly EquitySample[],
): { peak: number; ddPct: number; ddAbs: number } | null {
  if (samples.length < 2) return null;
  const ordered = [...samples].sort((a, b) => a.at.localeCompare(b.at));
  let peak = Number.NEGATIVE_INFINITY;
  let ddPct = 0;
  let ddAbs = 0;
  for (const s of ordered) {
    if (s.equity > peak) peak = s.equity;
    const dipAbs = peak - s.equity;
    const dipPct = peak > 0 ? (dipAbs / peak) * 100 : 0;
    if (dipAbs > ddAbs) ddAbs = dipAbs;
    if (dipPct > ddPct) ddPct = dipPct;
  }
  return { peak, ddPct, ddAbs };
}
