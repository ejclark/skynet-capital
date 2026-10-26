import type { ReactElement } from "react";
import type { CoverageRowJson } from "../live/coverage";

/**
 * THE BALANCE RING — shape H's top half (#3811, placed 2026-10-26; drawn in
 * `docs/design/lofi/sector-coverage.html`). Eleven arcs, one per GICS sector, in the SAME order as
 * the rows beneath it, so the ring reads clockwise from heavy to faint and its key is the list.
 *
 * Depth rides on SHAPE, never hue alone (docs/BRAND.md → Accessibility): a thick solid arc is a
 * sector with researched names (one tick outside it per name, so 7 vs 1 shows), a dashed arc is
 * macro reports only, a thin dotted arc is a gap. The inner ring is the viewer's holdings, drawn
 * only when their positions could be read. Arcs are labelled by fund ticker — four characters fit
 * around a phone-sized ring where "Consumer Discretionary" never could.
 *
 * It is a picture, not a control: the rows below carry the tap, so a screen reader meets one
 * labelled image and then the list it summarizes.
 */

const SIZE = 220;
const C = SIZE / 2;
const R = C - 30;
const R_INNER = R - 17;
const PAD = 2.4;

const at = (rad: number, deg: number): [number, number] => {
  const t = ((deg - 90) * Math.PI) / 180;
  return [C + rad * Math.cos(t), C + rad * Math.sin(t)];
};
const xy = (p: [number, number]) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
const arc = (rad: number, a0: number, a1: number) =>
  `M ${xy(at(rad, a0))} A ${rad} ${rad} 0 0 1 ${xy(at(rad, a1))}`;

function Arc({
  row,
  a0,
  a1,
  holdings,
}: {
  readonly row: CoverageRowJson;
  readonly a0: number;
  readonly a1: number;
  readonly holdings: boolean;
}): ReactElement {
  const mid = (a0 + a1) / 2;
  const named = row.researched.length;
  const ticks = Array.from({ length: named }, (_, j) =>
    named === 1 ? mid : a0 + 2 + ((a1 - a0 - 4) * j) / (named - 1),
  );
  const [lx, ly] = at(R + 23, mid);
  return (
    <g className={`cov-arc cov-arc--${row.depth}`}>
      <path className="cov-arc-depth" d={arc(R, a0, a1)} />
      {ticks.map((a) => {
        const [x1, y1] = at(R + 9, a);
        const [x2, y2] = at(R + 14, a);
        return <line key={a} className="cov-arc-tick" x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
      <text className="cov-arc-label" x={lx} y={ly} textAnchor="middle" dominantBaseline="middle">
        {row.fund}
      </text>
      {holdings ? (
        <path
          className={row.held.length > 0 ? "cov-arc-held" : "cov-arc-held cov-arc-held--none"}
          d={arc(R_INNER, a0, a1)}
        />
      ) : null}
    </g>
  );
}

export function CoverageRing({
  rows,
  coveredCount,
  holdings,
}: {
  readonly rows: readonly CoverageRowJson[];
  readonly coveredCount: number;
  readonly holdings: boolean;
}): ReactElement {
  const step = 360 / Math.max(rows.length, 1);
  return (
    <svg
      className="cov-ring"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={`${coveredCount} of ${rows.length} sectors covered`}
    >
      {rows.map((row, i) => (
        <Arc
          key={row.sector}
          row={row}
          a0={i * step + PAD}
          a1={(i + 1) * step - PAD}
          holdings={holdings}
        />
      ))}
      <text className="cov-ring-count" x={C} y={C - 2} textAnchor="middle">
        {coveredCount}/{rows.length}
      </text>
      <text className="cov-ring-word" x={C} y={C + 17} textAnchor="middle">
        covered
      </text>
    </svg>
  );
}
