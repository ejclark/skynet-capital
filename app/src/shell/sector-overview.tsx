import { type CSSProperties, type ReactElement, useState } from "react";
import {
  DEFAULT_PERIOD,
  LOOKS,
  moveFigure,
  moveShape,
  PERIODS,
  rangeMark,
  ranked,
  rememberLook,
  type SectorLook,
  type SectorPeriod,
  type SectorRow,
  type SectorsView,
  sinceLine,
  storedLook,
} from "../live/edition-sectors";

/**
 * THE WHOLE MARKET, FIRST (#7077 slices 1b and 1c; #7018 round 3). Eric: "Shouldn't we start with a
 * wholestick overview - there are 11 official GICS stock market sectors... At the sector level,
 * aggregated information only seems necessary." It leads the page (AT9), one set of numbers in two
 * views (AT3, revised: Bars were "fully redundant with the percentage change"):
 *   - Lines (the default): ranked plain text reading name · its fund's ticker, muted, beside the
 *     name · the move · the range mark (AT12; Eric: "what is \"spy\"? … a label that should be
 *     colocated next to the sector");
 *   - Tiles: a grid, the market spanning the top.
 * The member's last view is kept in this browser. Periods Day · Week · Month · YTD, Week first (AT2).
 * At 390 the whole overview, S&P 500 row included, sits on the first screen (AT1).
 *
 * THE RANGE MARK (AT8) replaces the ▲ ▼ that repeated the figure's sign: a small band, the fund's
 * 20-day Bollinger band, with a tick where the last close sits. Words only at the extremes ("below its
 * usual range"). It is drawn in the text colour, never the up/down hues, because it describes where a
 * price sits and must never read as a buy or sell signal. The pattern is meant for the app's other
 * price charts.
 *
 * NEVER HUE ALONE (BRAND.md → Accessibility; a standing reader is red/green colourblind): a move is a
 * signed figure, a down tile is hatched and an up one solid, and the range mark is position and shape.
 */

function Segmented<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly (readonly [T, string])[];
  readonly onPick: (next: T) => void;
}): ReactElement {
  return (
    <fieldset className="sectors-seg">
      <legend className="visually-hidden">{label}</legend>
      {options.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={key === value} onClick={() => onPick(key)}>
          {text}
        </button>
      ))}
    </fieldset>
  );
}

/** The signed figure. Its sign carries the direction; the range mark sits beside it. */
function Move({ percent }: { readonly percent: number }): ReactElement {
  return (
    <span className={`sector-move sector-move--${moveShape(percent).word}`}>
      <span className="num">{moveFigure(percent)}</span>
    </span>
  );
}

/** AT8: the band, and a tick where the close sits; outside the band the tick sits in the margin. */
function RangeMark({ row }: { readonly row: SectorRow }): ReactElement {
  const mark = rangeMark(row.range);
  return (
    <span
      className={`sector-range sector-range--${mark.zone}`}
      role="img"
      aria-label={`${row.name} ${mark.label}`}
      style={{ "--at": `${mark.at * 100}%` } as CSSProperties}
    >
      <span className="sector-range-band" />
      <span className="sector-range-tick" />
    </span>
  );
}

/** The words, only at the extremes. Hidden from screen readers: the mark's label already says it. */
function RangeWord({ row }: { readonly row: SectorRow }): ReactElement | null {
  const { word } = rangeMark(row.range);
  return word ? (
    <span className="sector-range-word" aria-hidden="true">
      {word}
    </span>
  ) : null;
}

const rowClass = (row: SectorRow, base: string): string =>
  row.market ? `${base} ${base}--market` : base;

function LineRow({
  row,
  period,
}: {
  readonly row: SectorRow;
  readonly period: SectorPeriod;
}): ReactElement {
  return (
    <li className={rowClass(row, "sector-line-row")}>
      <span className="sector-label">
        <span className="sector-title">
          <span className="sector-name">{row.name}</span>
          <span className="sector-fund">{row.fund}</span>
        </span>
        <RangeWord row={row} />
      </span>
      <Move percent={row.moves[period]} />
      <RangeMark row={row} />
    </li>
  );
}

function Tile({
  row,
  period,
}: {
  readonly row: SectorRow;
  readonly period: SectorPeriod;
}): ReactElement {
  const shape = moveShape(row.moves[period]);
  return (
    <li className={`${rowClass(row, "sector-tile")} sector-tile--${shape.word}`}>
      <span className="sector-label">
        <span className="sector-name">{row.name}</span>
        <RangeWord row={row} />
      </span>
      <span className="sector-tile-figures">
        <RangeMark row={row} />
        <Move percent={row.moves[period]} />
      </span>
    </li>
  );
}

function Rows({
  view,
  period,
  look,
}: {
  readonly view: SectorsView;
  readonly period: SectorPeriod;
  readonly look: SectorLook;
}): ReactElement {
  const { market, sectors } = ranked(view, period);
  const rows = market ? [market, ...sectors] : sectors;
  const draw = (r: SectorRow): ReactElement =>
    look === "lines" ? (
      <LineRow key={r.fund} row={r} period={period} />
    ) : (
      <Tile key={r.fund} row={r} period={period} />
    );
  return (
    <ul
      className={`sectors-rows sectors-rows--${look}`}
      aria-label="The S&P 500 and its 11 sectors"
    >
      {rows.map(draw)}
    </ul>
  );
}

export function SectorOverview({ view }: { readonly view: SectorsView }): ReactElement {
  const [period, setPeriod] = useState<SectorPeriod>(DEFAULT_PERIOD);
  const [look, setLook] = useState<SectorLook>(storedLook);
  const pickLook = (next: SectorLook): void => {
    setLook(next);
    rememberLook(next);
  };
  return (
    <section className="sectors" aria-labelledby="sectors-title">
      <div className="sectors-head">
        <h2 id="sectors-title" className="section-title">
          The whole market
        </h2>
        <span className="sectors-since">{sinceLine(view, period)}</span>
      </div>
      <div className="sectors-controls">
        <Segmented label="Period" value={period} options={PERIODS} onPick={setPeriod} />
        <Segmented label="View" value={look} options={LOOKS} onPick={pickLook} />
      </div>
      <Rows view={view} period={period} look={look} />
      <p className="sectors-foot">
        Beside each name, the ticker of the SPDR fund that tracks it; SPY tracks the S&P 500. A move
        is the change in price between closes. The small bar is the fund's usual range, its 20-day
        average two standard deviations either side, and the tick is its last close. It shows where
        a price sits, not where it goes. {view.source}.
      </p>
    </section>
  );
}
