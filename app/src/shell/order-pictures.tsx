import type { CSSProperties, ReactElement } from "react";
import { daysLeft, type OptionPlay, type Play, type ZoneKind } from "../live/order-play";

/**
 * THE DEEP DIVE'S PICTURES (#5101; round 2 of #5037, R2-deep). Each is drawn from the contract and
 * the fill, and every number sits ON the mark it describes (CLAUDE.md → annotations on the picture):
 *  - the price line: one axis of the stock's price with now (◯), the strike — ✕ where a sold
 *    option's bet is wrong — and the breakeven tick; the stretches that lose, are still ahead and
 *    keep, AT EXPIRY, as hatch, dots and solid, named in words beneath. The losing side fades off
 *    the edge where its loss does not stop at the axis;
 *  - days left: fill day → expiry, a ring at today;
 *  - the play: what happens on each side of the strike at expiry, as branches, not paragraphs.
 * Hatch vs dots vs solid carries the zone and the words say it again; hue never carries it alone
 * (a standing reader is red/green colourblind, docs/BRAND.md).
 */

const pct = (value: number): string => `${Math.min(100, Math.max(0, value)).toFixed(2)}%`;
const at = (left: string): CSSProperties => ({ left });

/** Where a label hangs off its mark: from it, centred on it, or ending at it — so a label near
 *  either edge of the line stays on screen. */
function anchor(x: number): string {
  if (x < 22) return "pl-from";
  if (x > 78) return "pl-to";
  return "pl-mid";
}

function money(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** The axis: every level the line marks, with a quarter of their spread as room either side. */
function scale(levels: readonly number[]): (value: number) => number {
  const lo = Math.min(...levels);
  const hi = Math.max(...levels);
  const spread = Math.max(hi - lo, hi * 0.04);
  const min = lo - spread * 0.3;
  const max = hi + spread * 0.3;
  return (value) => ((value - min) / (max - min)) * 100;
}

export function PriceLine({
  play,
  now,
}: {
  readonly play: Play;
  /** The stock's last price, when the quote answered; the line says so when it did not. */
  readonly now?: number;
}): ReactElement {
  const levels =
    play.kind === "option" ? [play.occ.strike, play.breakeven] : [play.fill, play.fill * 1.02];
  const x = scale(now === undefined ? levels : [...levels, now]);
  const nowX = now === undefined ? undefined : x(now);
  const zoneStyle = (from?: number, to?: number): CSSProperties => {
    const left = from === undefined ? 0 : x(from);
    const right = to === undefined ? 100 : x(to);
    return { left: pct(left), width: pct(right - left) };
  };
  return (
    <figure className="pl">
      <div className="pl-row pl-above">
        {nowX === undefined ? (
          <span className="pl-label pl-from pl-nonow" style={at("0%")}>
            <b>now</b> no quote right now
          </span>
        ) : (
          <span className={`pl-label ${anchor(nowX)}`} style={at(pct(nowX))}>
            <b>now</b> {money(now as number)}
          </span>
        )}
      </div>
      <div className="pl-bar" aria-hidden="true">
        {play.zones.map((zone) => (
          <span
            key={zone.kind}
            className={`pl-zone pl-${zone.kind}${zone.from === undefined && zone.kind === "loses" ? " pl-fade-from" : ""}${zone.to === undefined && zone.kind === "loses" ? " pl-fade-to" : ""}`}
            style={zoneStyle(zone.from, zone.to)}
          />
        ))}
        {play.kind === "option" ? (
          <>
            <span className="pl-tick pl-strike" style={at(pct(x(play.occ.strike)))} />
            <span className="pl-tick pl-be" style={at(pct(x(play.breakeven)))} />
          </>
        ) : (
          <span className="pl-dot" style={at(pct(x(play.fill)))} />
        )}
        {nowX === undefined ? null : <span className="pl-now" style={at(pct(nowX))} />}
      </div>
      {play.kind === "option" ? (
        <OptionMarks play={play} x={x} />
      ) : (
        <ShareMarks fill={play.fill} x={x} />
      )}
      <figcaption className="pl-legend">
        <b>{play.kind === "option" ? "At expiry:" : "Since the fill:"}</b>
        {play.zones.map((zone) => (
          <span key={zone.kind} className="pl-key">
            <Swatch kind={zone.kind} />
            {zone.words}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

function OptionMarks({
  play,
  x,
}: {
  readonly play: OptionPlay;
  readonly x: (value: number) => number;
}): ReactElement {
  const strikeX = x(play.occ.strike);
  const beX = x(play.breakeven);
  return (
    <>
      {play.wrongIf ? (
        <div className="pl-row">
          <span className={`pl-label ${anchor(strikeX)}`} style={at(pct(strikeX))}>
            <b>✕ wrong if</b> {play.wrongIf.words}
          </span>
        </div>
      ) : null}
      <div className="pl-row">
        <span className={`pl-label ${anchor(beX)}`} style={at(pct(beX))}>
          <b>breakeven</b> {money(play.breakeven)}
        </span>
      </div>
    </>
  );
}

function ShareMarks({
  fill,
  x,
}: {
  readonly fill: number;
  readonly x: (value: number) => number;
}): ReactElement {
  const fillX = x(fill);
  return (
    <div className="pl-row">
      <span className={`pl-label ${anchor(fillX)}`} style={at(pct(fillX))}>
        <b>filled</b> {money(fill)} · no stop price on this order
      </span>
    </div>
  );
}

export function Swatch({ kind }: { readonly kind: ZoneKind | "aside" }): ReactElement {
  return <span className={`pl-sw pl-sw-${kind}`} aria-hidden="true" />;
}

/** Fill day → expiry, a ring at today: "Oct 6 ━○──── Nov 6 · 29 days left". */
export function DaysLeft({
  filledAt,
  play,
  now,
}: {
  readonly filledAt: string;
  readonly play: OptionPlay;
  readonly now?: Date;
}): ReactElement {
  const days = daysLeft(filledAt, play.occ.expiration, now);
  const from = new Date(filledAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  });
  const done = pct((days.gone / days.span) * 100);
  return (
    <p className="dl">
      <span className="dl-end">{from}</span>
      <span className="dl-track" aria-hidden="true">
        <span className="dl-gone" style={{ width: done }} />
        <span className="dl-today" style={at(done)} />
      </span>
      <span className="dl-end">
        <b>{play.expiryWords}</b> · {days.words}
      </span>
    </p>
  );
}

/** At expiry, each side of the strike as a branch: its condition on the price line's swatch, ✕ on
 *  the side where the bet is wrong, then what happens — from the contract alone. */
export function ThePlay({ play }: { readonly play: OptionPlay }): ReactElement {
  return (
    <section className="dd-play" aria-label={`At ${play.expiryWords}, the play`}>
      <h4 className="dd-label">At {play.expiryWords} · the play</h4>
      <ul className="dd-branches">
        {play.branches.map((branch) => (
          <li key={branch.when} className="dd-branch">
            <span className="dd-when">
              <Swatch kind={branch.kind} />
              <b>{branch.when}</b>
              {branch.wrong ? <span className="dd-wrong">✕ wrong if</span> : null}
            </span>
            <span className="dd-then">{branch.outcome}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
