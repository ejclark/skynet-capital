import type { ReactElement } from "react";
import type { Decision } from "../live/desk";

/**
 * THE OUTCOME RANGE (#3689 slice 7, design handoff): where the stock is now against where this
 * option makes or loses money at expiry, as one bar. The profit zone is green and the loss zone
 * red, each also named by the breakeven tick's label. Colour carries P/L meaning only, never
 * decoration. Three rows: "now $X" over the spot marker, the zoned bar, and "breakeven $Y" under
 * its tick.
 *
 * The axis spans roughly ±15% around the spot and the breakeven, so both always fit. Without a live
 * spot (the feed didn't quote the underlying), the bar still draws the zones around the breakeven
 * and just leaves out "now". It never invents a price.
 */

const price = (x: number) => `$${x.toFixed(2)}`;

/** The axis and where each mark lands on it, as 0..100 percentages. Exported for specs. */
export function rangeGeometry(
  range: NonNullable<Decision["range"]>,
  spot?: number,
): { readonly be: number; readonly now?: number; readonly profitRight: boolean } {
  const anchors = spot === undefined ? [range.breakeven] : [range.breakeven, spot];
  const lo = Math.min(...anchors) * 0.85;
  const hi = Math.max(...anchors) * 1.15;
  const at = (x: number) => ((x - lo) / (hi - lo)) * 100;
  // A long call and a short put profit to the right of the breakeven; a long put and a short call
  // profit to the left.
  const profitRight =
    (range.type === "call" && range.side === "long") ||
    (range.type === "put" && range.side === "short");
  return { be: at(range.breakeven), ...(spot === undefined ? {} : { now: at(spot) }), profitRight };
}

export function OutcomeRange({
  range,
  spot,
}: {
  readonly range: NonNullable<Decision["range"]>;
  readonly spot?: number;
}): ReactElement {
  const g = rangeGeometry(range, spot);
  const left = g.profitRight ? "loss" : "profit";
  const right = g.profitRight ? "profit" : "loss";
  const words = `${g.profitRight ? "Profits above" : "Profits below"} ${price(range.breakeven)} at expiry${spot === undefined ? "" : `; now ${price(spot)}`}.`;
  return (
    <div className="orange" role="img" aria-label={words}>
      <div className="orange-row orange-top">
        {g.now !== undefined && spot !== undefined ? (
          <span className="orange-now-label" style={{ left: `${g.now}%` }}>
            now {price(spot)}
          </span>
        ) : null}
      </div>
      <div className="orange-row orange-bar">
        <span
          className={`orange-zone orange-zone--${left}`}
          style={{ left: 0, width: `${g.be}%` }}
        />
        <span
          className={`orange-zone orange-zone--${right}`}
          style={{ left: `${g.be}%`, right: 0 }}
        />
        <span className="orange-tick" style={{ left: `${g.be}%` }} />
        {g.now !== undefined ? <span className="orange-now" style={{ left: `${g.now}%` }} /> : null}
      </div>
      <div className="orange-row orange-bottom">
        <span className="orange-be-label" style={{ left: `${g.be}%` }}>
          breakeven {price(range.breakeven)}
        </span>
      </div>
    </div>
  );
}
