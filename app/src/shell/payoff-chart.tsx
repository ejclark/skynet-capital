import type { ReactElement } from "react";
import { useId } from "react";
import type { PayoffCurve } from "../live/draft-order";
import { money } from "../live/ticket";

/**
 * THE PAYOFF DIAGRAM (#3407; the study's rows 8 and 19 — max loss unavoidable on screen; RH
 * Simulated Returns, Fidelity's P/L calculator, tos Risk Profile): the at-expiration P&L curve
 * the server sampled (`draft-order-preview.ts`), drawn as one polyline over a zero line, with
 * the breakevens ticked on the price axis and the worst and best points labelled in words. The
 * numbers are the server's — this component scales, it never computes a payoff.
 *
 * A standing reader is red/green colourblind, so the profit and loss sides never differ by hue
 * alone: the loss region is hatched, the zero line is dashed, and every extreme carries a text
 * label. Absent points render nothing — an empty chart would read as a flat $0 line.
 * @category trading
 */

const WIDTH = 320;
const HEIGHT = 120;
const PAD = { top: 14, right: 12, bottom: 22, left: 12 };

export function PayoffChart({
  curve,
  maxLoss,
}: {
  readonly curve: PayoffCurve;
  readonly maxLoss: number | "unlimited";
}): ReactElement | null {
  const hatchId = useId();
  const { points, breakevens, from, to } = curve;
  if (points.length < 2 || to <= from) return null;
  const pnls = points.map((p) => p.pnl);
  const lo = Math.min(0, ...pnls);
  const hi = Math.max(0, ...pnls);
  const span = hi - lo || 1;
  const x = (price: number) =>
    PAD.left + ((price - from) / (to - from)) * (WIDTH - PAD.left - PAD.right);
  const y = (pnl: number) => PAD.top + ((hi - pnl) / span) * (HEIGHT - PAD.top - PAD.bottom);
  const zero = y(0);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.price).toFixed(1)} ${y(p.pnl).toFixed(1)}`)
    .join(" ");
  const area = `${path} L${x(points[points.length - 1]?.price ?? to).toFixed(1)} ${zero.toFixed(1)} L${x(points[0]?.price ?? from).toFixed(1)} ${zero.toFixed(1)} Z`;
  // The first point reaching each extreme names it; the label sits at the END of that plateau
  // (the last point still at the extreme), off the slope that leads into it.
  const worst = points.reduce((a, b) => (b.pnl < a.pnl ? b : a));
  const best = points.reduce((a, b) => (b.pnl > a.pnl ? b : a));
  const worstEnd = points.reduce((a, b) => (b.pnl <= a.pnl ? b : a));
  const bestStart = best;
  const summary = `At expiration: worst ${maxLoss === "unlimited" ? "unlimited" : money(-worst.pnl)} near ${money(worst.price)}, best ${money(best.pnl)} near ${money(best.price)}${
    breakevens.length ? `, breakeven at ${breakevens.map((b) => money(b)).join(" and ")}` : ""
  }.`;
  return (
    <figure className="payoff">
      <svg
        className="payoff-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={summary}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern
            id={hatchId}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" className="payoff-hatch" />
          </pattern>
        </defs>
        {/* The loss side: the curve's area below zero, hatched — a texture, never a hue alone. */}
        <clipPath id={`${hatchId}-loss`}>
          <rect x="0" y={zero} width={WIDTH} height={Math.max(0, HEIGHT - zero)} />
        </clipPath>
        <path d={area} fill={`url(#${hatchId})`} clipPath={`url(#${hatchId}-loss)`} />
        <line x1={PAD.left} x2={WIDTH - PAD.right} y1={zero} y2={zero} className="payoff-zero" />
        {breakevens.map((price) => (
          <g key={price}>
            <line x1={x(price)} x2={x(price)} y1={zero - 5} y2={zero + 5} className="payoff-tick" />
            <text x={x(price)} y={HEIGHT - 6} textAnchor="middle" className="payoff-label">
              BE {money(price)}
            </text>
          </g>
        ))}
        <path d={path} className="payoff-line" />
        <text
          x={x(worstEnd.price)}
          y={Math.max(PAD.top + 6, y(worst.pnl) - 4)}
          textAnchor="end"
          className="payoff-label"
        >
          {maxLoss === "unlimited" ? "loss unlimited ↓" : `−${money(-worst.pnl)}`}
        </text>
        <text
          x={x(bestStart.price)}
          y={Math.max(PAD.top - 3, y(best.pnl) - 4)}
          textAnchor="start"
          className="payoff-label"
        >
          {`+${money(best.pnl)}`}
        </text>
      </svg>
      <figcaption className="payoff-caption">{summary}</figcaption>
    </figure>
  );
}
