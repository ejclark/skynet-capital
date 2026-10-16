import type { ReactElement } from "react";
import type { DeskPosition } from "../live/desk";
import type { OptionPositionRow } from "../live/options";
import {
  type PriceMark,
  type PriceStrip,
  priceStrip,
  priceText,
  signedDollars,
  stakeFigure,
  type WaitingStrip,
  waitingStrip,
} from "../live/position-picture";
import { ProjectionContent } from "./position-columns";
import { isWritten, withMinus } from "./position-row-spec";
import { MINUS } from "./quote-change";

/**
 * THE POSITION'S PICTURE, FIRST IN ITS OPENED GUIDANCE (#5070 slice 2; round 2 of #5037, R2's
 * depth ladder, step 2 "open in place"). Eric's order: the price strip (More 2: "the diagram beats
 * text"), the waiting-earns strip (af4f8295: the $/day decay in the graph), then the three figures
 * (3a77c6db: capital at play, the P/L, the model's expectation). The numbers are
 * `live/position-picture.ts`'s; this file only draws them.
 *
 * Hue never carries a meaning alone: each zone is named in a word in the key under the bar and is
 * its own shape (hatched, striped, solid), every figure keeps its sign, and the projection cell is dashed —
 * a projection never shares a fact's shape (PATTERNS → *Projection drawn dashed*).
 */

const whole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const signed = (x: number) => `${x < 0 ? MINUS : "+"}${whole.format(Math.abs(x))}`;
const pct = (x: number) => `${Math.round(x * 100)}%`;

const MARK_WORD: Record<PriceMark["kind"], string> = {
  now: "now",
  strike: "strike",
  breakeven: "breakeven",
};

/** A label pinned to its mark, kept inside the strip at either edge. */
function MarkLabel({ mark }: { readonly mark: PriceMark }): ReactElement {
  const edge = mark.at < 14 ? "start" : mark.at > 86 ? "end" : "mid";
  return (
    <span
      className={`pp-label pp-label--${mark.kind} pp-label--${edge}`}
      style={{ left: `${mark.at}%` }}
    >
      {MARK_WORD[mark.kind]} {priceText(mark.kind, mark.price)}
    </span>
  );
}

function PriceStripView({ strip }: { readonly strip: PriceStrip }): ReactElement {
  const now = strip.marks.find((m) => m.kind === "now");
  const below = strip.marks.filter((m) => m.kind !== "now");
  return (
    <figure className="pp-strip pp-price">
      <figcaption className="pp-title">At expiry</figcaption>
      <div className="pp-price-art" role="img" aria-label={strip.said}>
        <div className="pp-row pp-row--top">{now ? <MarkLabel mark={now} /> : null}</div>
        <div className="pp-bar">
          {strip.zones.map((z, i) => (
            <span
              key={`${z.kind}-${z.from}`}
              className={`pp-zone pp-zone--${z.kind}${i === strip.zones.length - 1 ? " pp-zone--last" : ""}`}
              style={{ left: `${z.from}%`, width: `${z.to - z.from}%` }}
            />
          ))}
          {below.map((m) => (
            <span
              key={m.kind}
              className={`pp-tick pp-tick--${m.kind}`}
              style={{ left: `${m.at}%` }}
            />
          ))}
          {now ? <span className="pp-now" style={{ left: `${now.at}%` }} /> : null}
        </div>
        {below.map((m) => (
          <div key={m.kind} className="pp-row">
            <MarkLabel mark={m} />
          </div>
        ))}
      </div>
      {/* The zones in words, left to right as the bar draws them. */}
      <ul className="pp-key" aria-hidden="true">
        {strip.zones.map((z) => (
          <li key={`${z.kind}-${z.from}`}>
            <span className={`pp-swatch pp-zone--${z.kind}`} />
            {z.word}
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** The strip's line, drawn on a 0..100 box: days across, P/L up, $0 dashed. */
function waitPath(strip: WaitingStrip): { readonly line: string; readonly zero?: number } {
  const totals = strip.points.map((p) => p.total);
  const lo = Math.min(0, ...totals);
  const hi = Math.max(0, ...totals);
  const span = hi - lo || 1;
  const y = (v: number) => 92 - ((v - lo) / span) * 84;
  const line = strip.points
    .map((p) => `${((p.day / strip.daysLeft) * 100).toFixed(2)},${y(p.total).toFixed(2)}`)
    .join(" ");
  return { line, ...(lo < 0 && hi > 0 ? { zero: y(0) } : {}) };
}

function WaitingStripView({
  strip,
  underlying,
}: {
  readonly strip: WaitingStrip;
  readonly underlying: string;
}): ReactElement {
  const { line, zero } = waitPath(strip);
  const first = strip.points[0];
  const last = strip.points[strip.points.length - 1];
  const price = `$${strip.spot.toFixed(2)}`;
  return (
    <figure className="pp-strip pp-wait">
      <figcaption className="pp-title">
        Waiting {strip.verb}
        <span className="pp-sub">
          {" "}
          · if {underlying} holds {price}
        </span>
      </figcaption>
      <div className="pp-wait-ends">
        <span>
          <b className="num">{first ? signed(first.total) : "—"}</b> today
        </span>
        <span>
          <b className="num">{last ? signed(last.total) : "—"}</b> at expiry
        </span>
      </div>
      <svg
        className="pp-wait-art"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {zero === undefined ? null : (
          <line className="pp-wait-zero" x1="0" x2="100" y1={zero} y2={zero} />
        )}
        <polyline className="pp-wait-line" points={line} />
      </svg>
      <p className="pp-rates">
        {strip.rates.map((r, i) => (
          <span key={r.label} className="pp-rate">
            {i > 0 ? <span aria-hidden="true"> → </span> : null}
            <b className="num">
              {i === 0 ? signed(r.perDay) : whole.format(Math.abs(r.perDay))}/day
            </b>{" "}
            {r.label}
          </span>
        ))}
      </p>
      <p className="pp-note">
        {strip.crosses ? `The P/L crosses $0 about ${strip.crosses}. ` : ""}Assumes today's{" "}
        {pct(strip.volatility)} volatility holds; not a forecast.
      </p>
    </figure>
  );
}

function Figures({
  position,
  positions,
}: {
  readonly position: DeskPosition;
  readonly positions: readonly DeskPosition[];
}): ReactElement {
  const stake = stakeFigure(position, positions);
  const premium = isWritten(position) ? position.costBasis.replace(/^-/, "") : undefined;
  return (
    <dl className="pp-figs">
      <div className="pp-fig">
        <dt>{stake.label}</dt>
        <dd>
          <b className="num">{withMinus(stake.figure)}</b>
          <span className="pp-fig-note">{stake.note}</span>
        </dd>
      </div>
      <div className="pp-fig">
        <dt>P/L</dt>
        <dd className={`tone-${position.totalTone}`}>
          <b className="num">{withMinus(position.totalPl)}</b>
          {position.returnPct === "—" ? null : (
            <span className="pp-fig-note num">
              {withMinus(position.returnPct)}
              {premium ? ` of ${premium}` : ""}
            </span>
          )}
        </dd>
      </div>
      <div className="pp-fig pp-fig--model">
        <dt>Model projects</dt>
        <dd>
          <ProjectionContent />
          <span className="pp-fig-note">a projection, once the model grades one</span>
        </dd>
      </div>
    </dl>
  );
}

/**
 * The opened guidance's first block. `book` is the option book's row for this contract, when the
 * feed quoted it: its spot draws "now" on an option's strip and prices the waiting strip. Shares
 * read "now" from the position's own price.
 */
export function PositionPicture({
  position,
  positions,
  book,
  bookRead,
}: {
  readonly position: DeskPosition;
  /** The account's positions: a sold leg's first figure looks for its spread partner. */
  readonly positions: readonly DeskPosition[];
  readonly book?: OptionPositionRow;
  /** Whether the option book has answered: until it has, a missing row says nothing. */
  readonly bookRead: boolean;
}): ReactElement {
  const spot = position.isOption ? book?.spot : signedDollars(position.price);
  const price = priceStrip(position, spot);
  const wait = waitingStrip(position, book);
  const underlying = book?.underlying ?? position.symbol;
  return (
    <section className="pp" aria-label={`The picture of ${position.display}`}>
      {price ? <PriceStripView strip={price} /> : null}
      {wait ? <WaitingStripView strip={wait} underlying={underlying} /> : null}
      {position.isOption &&
      bookRead &&
      (book?.spot === undefined || book.impliedVol === undefined) ? (
        <p className="pp-note">
          The waiting picture needs a live price and volatility for this contract; the feed has not
          quoted them.
        </p>
      ) : null}
      <Figures position={position} positions={positions} />
    </section>
  );
}
