import type { CSSProperties, ReactElement } from "react";
import {
  type PivotLine as Line,
  type Outcome,
  type PivotZone,
  pivotScale,
  spreadLabels,
  ZONE_NAME,
} from "../live/order-pivots";

/**
 * THE OPENED ORDER'S PICTURE (#5262; #5160 round 16, "divider"). Read top to bottom:
 *  1. the pivots — Breakeven · Strike · now — each name and price centred over its line or ring;
 *  2. the bar: Loss as a hatch, the Premium (or a bought option's Profit) solid, OTM a thin line —
 *     no tick lines over it (round 14: "the green bar adequately and appropriately outlines
 *     premium as the profit"); Breakeven and Strike run through it as full vertical lines;
 *  3. the zone names under the bar — Loss · Premium; OTM is named in the outcome below;
 *  4. AT <expiry>, the strike's line carries on down as the divider: below the strike on the left,
 *     above it on the right, each side ITM or OTM with what happens, on its own deliberate lines.
 * The axis centres on the strike (`pivotScale`), so the divider is the card's middle and both sides
 * get the same room. Pattern and word name every zone; hue never carries one alone (docs/BRAND.md).
 */

const pct = (value: number): string => `${Math.min(100, Math.max(0, value)).toFixed(2)}%`;
const at = (x: number): CSSProperties => ({ left: pct(x) });
const money = (value: number): string =>
  `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** "$80" for a whole level, "$77.45" otherwise — the strike's own style. */
const level = (value: number): string =>
  Number.isInteger(value) ? `$${value.toLocaleString("en-US")}` : money(value);

/** Labels this far apart (percent of the line) never touch at 390px; nearer ones are spread. */
const LABEL_GAP = 24;
const LABEL_EDGE = 11;

export function PivotLine({
  line,
  now,
}: {
  readonly line: Line;
  /** The stock's last price, when the quote answered; the line says so when it did not. */
  readonly now?: number;
}): ReactElement {
  const x = pivotScale(line, now);
  const marks = [
    ...line.pivots.map((p) => ({ name: p.name, price: level(p.at), x: x(p.at) })),
    ...(now === undefined ? [] : [{ name: "now", price: money(now), x: x(now) }]),
  ];
  const labelled = spreadLabels(
    marks.map((m) => m.x),
    LABEL_GAP,
    LABEL_EDGE,
  );
  const span = (zone: PivotZone) => {
    const left = zone.from === undefined ? 0 : Math.max(0, x(zone.from));
    const right = zone.to === undefined ? 100 : Math.min(100, x(zone.to));
    return { left, right };
  };
  const named = line.zones.filter((z) => ZONE_NAME[z.kind]);
  const namedAt = spreadLabels(
    named.map((z) => {
      const { left, right } = span(z);
      return (left + right) / 2;
    }),
    16,
    6,
  );
  const fade = (zone: PivotZone): string =>
    zone.kind !== "loss" || !line.lossGrows
      ? ""
      : zone.from === undefined
        ? " pv-fade-from"
        : zone.to === undefined
          ? " pv-fade-to"
          : "";
  return (
    <figure className="pv">
      {line.pivots.map((p) => (
        <span
          key={p.name}
          className={`pv-line${p.divides && line.atExpiry ? " pv-divides" : ""}`}
          style={at(x(p.at))}
          aria-hidden="true"
        />
      ))}
      <div className="pv-pivots">
        {marks.map((m, i) => (
          <span key={m.name} className="pv-pivot" style={at(labelled[i] as number)}>
            <span className="pv-name">{m.name}</span> <b>{m.price}</b>
          </span>
        ))}
      </div>
      <div className="pv-bar" aria-hidden="true">
        {line.zones.map((zone) => {
          const { left, right } = span(zone);
          return (
            <span
              key={zone.kind}
              className={`pv-zone pv-${zone.kind}${fade(zone)}`}
              style={{ left: pct(left), width: pct(right - left) }}
            />
          );
        })}
        {now === undefined ? null : <span className="pv-now" style={at(x(now))} />}
      </div>
      <div className="pv-names">
        {named.map((zone, i) => (
          <span key={zone.kind} className="pv-zname" style={at(namedAt[i] as number)}>
            {ZONE_NAME[zone.kind]}
          </span>
        ))}
      </div>
      {now === undefined ? <p className="pv-nonow">now: no quote right now</p> : null}
      {line.atExpiry ? (
        <div className="pv-expiry">
          <p className="pv-at">At {line.atExpiry.when}</p>
          <div className="pv-sides">
            <Side outcome={line.atExpiry.below} edge="below" />
            <Side outcome={line.atExpiry.above} edge="above" />
          </div>
        </div>
      ) : null}
    </figure>
  );
}

/** One side of the strike at expiry. Each line is kept whole — nothing wraps mid-phrase. */
function Side({
  outcome,
  edge,
}: {
  readonly outcome: Outcome;
  readonly edge: "below" | "above";
}): ReactElement {
  return (
    <p className={`pv-side pv-side-${edge}`}>
      <b className="pv-when">
        {outcome.side} · {outcome.when}
      </b>
      {outcome.lines.map((words) => (
        <span key={words} className="pv-words">
          {words}
        </span>
      ))}
    </p>
  );
}
