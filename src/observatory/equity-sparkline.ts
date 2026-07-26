import type { EquitySample } from "./history-store.js";

/**
 * A self-contained board "piece": equity-over-time as a compact inline-SVG sparkline (see the
 * composable-board direction in docs/IDEAS.md). Pure and deterministic — samples in, SVG out — so it
 * drops into `/u/:id`, the cards, or any view without wiring. Fewer than two points → `null`, so the
 * caller can keep the honest "history still accruing" seam instead of drawing a flat, meaningless line.
 */
export interface SparklineOptions {
  readonly width?: number;
  readonly height?: number;
}

export function renderEquitySparkline(
  samples: readonly EquitySample[],
  opts: SparklineOptions = {},
): string | null {
  if (samples.length < 2) return null;
  const ordered = [...samples].sort((a, b) => a.at.localeCompare(b.at));
  const W = opts.width ?? 280;
  const H = opts.height ?? 64;
  const pad = 4;
  const values = ordered.map((s) => s.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const dx = (W - pad * 2) / (ordered.length - 1);
  const y = (v: number) => pad + (H - pad * 2) * (1 - (v - min) / span);
  const pts = ordered.map((s, i) => [pad + dx * i, y(s.equity)] as const);

  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  const up = last >= first;
  const stroke = up ? "var(--pos)" : "var(--neg)";
  const line = pts
    .map(([px, py], i) => `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`)
    .join(" ");
  // area fill down to the baseline, under the line
  const [lastX] = pts[pts.length - 1] ?? [W - pad];
  const area = `${line} L${(lastX ?? W - pad).toFixed(1)} ${H - pad} L${pad} ${H - pad} Z`;
  const [ex, ey] = pts[pts.length - 1] ?? [W - pad, pad];

  return `<svg class="equity-spark" viewBox="0 0 ${W} ${H}" role="img" aria-label="Equity over time" preserveAspectRatio="none">
    <path d="${area}" fill="${stroke}" fill-opacity="0.10"/>
    <path d="${line}" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="2.6" fill="${stroke}"/>
  </svg>`;
}

/** The change across the recorded window: absolute + percent, sign-carrying. Empty when <2 samples. */
export function equityChange(
  samples: readonly EquitySample[],
): { abs: number; pct: number } | null {
  if (samples.length < 2) return null;
  const ordered = [...samples].sort((a, b) => a.at.localeCompare(b.at));
  const first = ordered[0]?.equity ?? 0;
  const last = ordered[ordered.length - 1]?.equity ?? 0;
  return { abs: last - first, pct: first !== 0 ? ((last - first) / first) * 100 : 0 };
}
