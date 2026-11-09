import { type CSSProperties, type ReactElement, useState } from "react";
import {
  DEFAULT_PERIOD,
  LOOKS,
  moveFigure,
  moveShape,
  PERIODS,
  ranked,
  rememberLook,
  type SectorLook,
  type SectorPeriod,
  type SectorRow,
  type SectorsView,
  scaleOf,
  sinceLine,
  storedLook,
} from "../live/edition-sectors";

/**
 * THE WHOLE MARKET, FIRST (#7077 slice 1b; #7018 round 3). Eric: "Shouldn't we start with a
 * wholestick overview - there are 11 official GICS stock market sectors... At the sector level,
 * aggregated information only seems necessary." He marked More on all three ways of drawing it
 * ("it really depends on what I do"), so the overview is one set of numbers with three views:
 *   - Bars (the default, the members' pick): a bar either side of zero, ranked;
 *   - Lines: the same ranking as plain text, each fund's code beside its name;
 *   - Tiles: a grid, the market spanning the top.
 * The member's last view is kept in this browser (AT3). Periods Day · Week · Month · YTD, Week first
 * (AT2). At 390 the whole overview, S&P 500 row included, sits on the first screen (AT1).
 *
 * NEVER HUE ALONE (BRAND.md → Accessibility; a standing reader is red/green colourblind): every row
 * carries ▲ ▼ ▬, a signed figure, and in Bars a direction from the zero line; a down bar or tile is
 * hatched, an up one solid. The colour rides on top of all that.
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

/** The ▲ ▼ ▬ shape and the signed figure, never split across a line. */
function Move({ percent }: { readonly percent: number }): ReactElement {
  const shape = moveShape(percent);
  return (
    <span className={`sector-move sector-move--${shape.word}`}>
      <span className="sector-glyph" role="img" aria-label={shape.word}>
        {shape.glyph}
      </span>
      <span className="num">{moveFigure(percent)}</span>
    </span>
  );
}

const rowClass = (row: SectorRow, base: string): string =>
  row.market ? `${base} ${base}--market` : base;

function BarRow({
  row,
  period,
  scale,
}: {
  readonly row: SectorRow;
  readonly period: SectorPeriod;
  readonly scale: number;
}): ReactElement {
  const move = row.moves[period];
  const shape = moveShape(move);
  const style = { "--bar": `${(Math.abs(move) / scale) * 50}%` } as CSSProperties;
  return (
    <li className={rowClass(row, "sector-bar-row")} title={`${row.name} · ${row.fund}`}>
      <span className="sector-name">{row.name}</span>
      <span className="sector-track" aria-hidden="true">
        <span className={`sector-bar sector-bar--${shape.word}`} style={style} />
      </span>
      <Move percent={move} />
    </li>
  );
}

function LineRow({
  row,
  period,
}: {
  readonly row: SectorRow;
  readonly period: SectorPeriod;
}): ReactElement {
  return (
    <li className={rowClass(row, "sector-line-row")}>
      <Move percent={row.moves[period]} />
      <span className="sector-name">{row.name}</span>
      <span className="sector-fund">{row.fund}</span>
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
      <span className="sector-name">{row.name}</span>
      <Move percent={row.moves[period]} />
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
  const scale = scaleOf(view, period);
  const draw = (r: SectorRow): ReactElement =>
    look === "bars" ? (
      <BarRow key={r.fund} row={r} period={period} scale={scale} />
    ) : look === "lines" ? (
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
        Each sector is its SPDR fund, the S&P 500 is SPY: the change in price between closes.{" "}
        {view.source}.
      </p>
    </section>
  );
}
