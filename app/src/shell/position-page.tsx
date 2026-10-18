import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useId, useRef } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import {
  type DeskActivity,
  type DeskActivityLine,
  type DeskPosition,
  fetchDeskActivity,
} from "../live/desk";
import { fetchOptionPositions } from "../live/options";
import { dayWords, orderDayKey, orderStamp, sideWord, sizeWord } from "../live/order-facts";
import { signedMoney } from "../live/position-act";
import {
  type PlayWay,
  type ProfitChart,
  positionDates,
  positionFills,
  profitChart,
  waysToPlay,
} from "../live/position-page";
import { signedDollars, waitingStrip } from "../live/position-picture";
import { money2, strikeMoney } from "../live/price-context";
import { rowCallOf } from "../live/row-call";
import { PositionActs } from "./position-act";
import { FactBadge } from "./position-guidance-slot";
import { PositionPicture, usePriceContext } from "./position-picture";
import { useRowMarks } from "./use-row-marks";

/**
 * A POSITION'S FULL PAGE — THE OPT-IN DEEP DIVE (#5070 slice 6; round 2 of #5037, R2's depth ladder
 * step 4). The ladder is: glance (the row and its guidance line) → open in place (the default tap)
 * → this page, reached only by "Full page ›" inside an opened row → commit (the one recap modal).
 * Eric's More 5 (9cda6977): "a page is for a deliberate deep dive and can derail you". So:
 *  - one way back, "← Positions", to the same row, still open (`use-position-page.ts`);
 *  - its links are only to its own sections — Picture · Three ways to play it · Fills · Dates —
 *    and nothing here leaves for another page;
 *  - it leads with the full price picture, the opened row's own (range and open contracts
 *    included), so the deep dive is never thinner than the row; then round 2's V2 picture, profit
 *    at price with a curve per date, which Eric asked for as an addition here (#5070's brief: "V2's
 *    profit-at-price chart is an addition, not a replacement");
 *  - Buy back and Roll sit at the bottom as equal buttons, the owner's alone (ownership-gated
 *    controls): everyone else reads every fact and gets no act.
 * Hue never carries a meaning alone: the chart's dates are four line shapes, and the strike and
 * breakeven two tick shapes, each named with its price in the key.
 */

const LIFECYCLE_WORD: Record<NonNullable<DeskActivityLine["lifecycle"]>, string> = {
  OPEXP: "EXPIRED",
  OPASN: "ASSIGNED",
  OPEXC: "EXERCISED",
  OPTRD: "SETTLED",
};

/** Each date's line shape on the chart, today to expiry: dotted, short dash, long dash, solid. */
const CURVE_SHAPE = ["ppage-curve--today", "ppage-curve--d14", "ppage-curve--d7", "ppage-curve--x"];
const curveShape = (i: number, count: number) =>
  i === count - 1 ? "ppage-curve--x" : (CURVE_SHAPE[i] ?? "ppage-curve--d7");

/** A y-axis label: whole dollars, signed — "+$257", "−$1,006", never a wrapped cent. */
const axisMoney = (x: number) => signedMoney(Math.round(x));

/** The chart drawn on a 0..100 box: price across, P/L up. */
function chartScale(chart: ProfitChart) {
  const { axis, low, high } = chart;
  const span = high - low || 1;
  const x = (price: number) => ((price - axis.lo) / (axis.hi - axis.lo)) * 100;
  const y = (total: number) => 94 - ((total - low) / span) * 88;
  return { x, y };
}

function ProfitChartView({
  chart,
  stock,
  strike,
  breakeven,
}: {
  readonly chart: ProfitChart;
  readonly stock: string;
  readonly strike: number;
  readonly breakeven: number | undefined;
}): ReactElement {
  const { x, y } = chartScale(chart);
  const { curves, spot, axis } = chart;
  const first = curves[0];
  const last = curves[curves.length - 1];
  const at = (curve: typeof first, price: number) => {
    if (!curve) return undefined;
    // The sample nearest the price: the curves are drawn from the same samples.
    let best = curve.points[0];
    for (const p of curve.points)
      if (best && Math.abs(p.price - price) < Math.abs(best.price - price)) best = p;
    return best?.total;
  };
  const todayNow = at(first, spot);
  const expiryNow = at(last, spot);
  const said = `Profit at ${stock}'s price, one line per date, from ${money2(axis.lo)} to ${money2(axis.hi)}. At today's ${money2(spot)}: ${todayNow === undefined ? "—" : signedMoney(todayNow)} today, ${expiryNow === undefined ? "—" : signedMoney(expiryNow)} at expiry. The lowest point drawn is ${axisMoney(chart.low)}; the highest, ${axisMoney(chart.high)}.`;
  const zero = y(0);
  const ticks = [
    { word: "strike", price: strike },
    ...(breakeven === undefined ? [] : [{ word: "breakeven", price: breakeven }]),
  ];
  return (
    <figure className="pp-strip ppage-chart">
      <figcaption className="pp-title">
        Profit at price
        <span className="pp-sub"> · a line per date</span>
      </figcaption>
      <div className="ppage-chart-art" role="img" aria-label={said}>
        <span className="ppage-y ppage-y--hi num" style={{ top: `${y(chart.high)}%` }}>
          {axisMoney(chart.high)}
        </span>
        <span className="ppage-y ppage-y--zero num" style={{ top: `${zero}%` }}>
          $0
        </span>
        <span className="ppage-y ppage-y--lo num" style={{ top: `${y(chart.low)}%` }}>
          {axisMoney(chart.low)}
        </span>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line className="ppage-zero" x1="0" x2="100" y1={zero} y2={zero} />
          {ticks.map((t) => (
            <line
              key={t.word}
              className={`ppage-tick ppage-tick--${t.word}`}
              x1={x(t.price)}
              x2={x(t.price)}
              y1="0"
              y2="100"
            />
          ))}
          <line className="ppage-now" x1={x(spot)} x2={x(spot)} y1="0" y2="100" />
          {curves.map((c, i) => (
            <polyline
              key={c.label}
              className={`ppage-curve ${curveShape(i, curves.length)}`}
              points={c.points
                .map((p) => `${x(p.price).toFixed(2)},${y(p.total).toFixed(2)}`)
                .join(" ")}
            />
          ))}
        </svg>
        <span className="ppage-now-label num" style={{ left: `${x(spot)}%` }}>
          now {money2(spot)}
        </span>
      </div>
      <div className="ppage-x num" aria-hidden="true">
        <span>{money2(axis.lo)}</span>
        <span>{money2(axis.hi)}</span>
      </div>
      <ul className="ppage-key" aria-hidden="true">
        {curves.map((c, i) => (
          <li key={c.label}>
            <svg className="ppage-swatch" viewBox="0 0 24 6" aria-hidden="true">
              <line
                className={`ppage-curve ${curveShape(i, curves.length)}`}
                x1="0"
                x2="24"
                y1="3"
                y2="3"
              />
            </svg>
            {c.label}
          </li>
        ))}
        {ticks.map((t) => (
          <li key={t.word}>
            <span className={`ppage-swatch-tick ppage-swatch-tick--${t.word}`} />
            {t.word} {t.word === "strike" ? strikeMoney(t.price) : money2(t.price)}
          </li>
        ))}
      </ul>
      <p className="pp-note">
        Each line is the P/L if {stock} sits at that price on that date. Assumes today's{" "}
        {Math.round(chart.volatility * 100)}% volatility holds; not a forecast.
      </p>
    </figure>
  );
}

/** A line with each dollar figure kept whole: "−$295" never breaks after its sign. */
function MoneyLine({ text }: { readonly text: string }): ReactElement {
  const parts = text.split(/([−+]?\$[\d,]+(?:\.\d+)?)/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: the split is fixed for a given line.
          <span key={i} className="ppage-money">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

function Ways({ ways }: { readonly ways: readonly PlayWay[] }): ReactElement {
  return (
    <dl className="ppage-ways">
      {ways.map((w) => (
        <div key={w.way} className="ppage-way">
          <dt>{w.way}</dt>
          <dd>
            <MoneyLine text={w.line} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function fillWords(line: DeskActivityLine): string {
  const unit = parseOccSymbol(line.symbol) ? "contract" : "share";
  const count = line.filled > 0 ? line.filled : line.quantity;
  const size = `${sizeWord(line)} ${count === 1 ? unit : `${unit}s`}`;
  if (line.lifecycle) return `${LIFECYCLE_WORD[line.lifecycle]} ${size}`;
  return `${sideWord(line)} ${size} at ${line.price}`;
}

type ActivityRead = UseQueryResult<DeskActivity>;

function Fills({
  activity,
  fills,
  stock,
}: {
  readonly activity: ActivityRead;
  readonly fills: readonly DeskActivityLine[];
  readonly stock: string;
}): ReactElement {
  if (activity.isPending) return <p className="note">Reading the fills…</p>;
  if (activity.isError) return <p className="note">The fills are unreachable right now.</p>;
  if (!activity.data.available)
    return <p className="note">This account's order ledger isn't wired here, so no fills read.</p>;
  if (fills.length === 0)
    return <p className="note">No fills for this position in the ledger's window.</p>;
  return (
    <>
      <ol className="ppage-fills">
        {fills.map((f) => (
          <li key={`${f.orderId}-${f.symbol}`}>
            <span className="ppage-fill-what">{fillWords(f)}</span>
            <span className="ppage-fill-when num">{orderStamp(f) ?? dayWords(orderDayKey(f))}</span>
          </li>
        ))}
      </ol>
      {activity.data.nextCursor ? (
        <p className="pp-note">The newest of {stock}'s orders; older fills sit further back.</p>
      ) : null}
    </>
  );
}

function Dates({
  position,
  fills,
}: {
  readonly position: DeskPosition;
  readonly fills: readonly DeskActivityLine[];
}): ReactElement {
  const dates = positionDates(position, fills);
  if (dates.length === 0) return <p className="note">No dates on this position.</p>;
  return (
    <ol className="ppage-dates">
      {dates.map((d) => (
        <li key={`${d.label}-${d.at}`}>
          <b className="num">{dayWords(d.at)}</b> {d.label}
          {d.note ? <span className="ppage-date-note"> · {d.note}</span> : null}
        </li>
      ))}
    </ol>
  );
}

const SECTIONS = ["picture", "ways", "fills", "dates"] as const;

export function PositionPage({
  deskId,
  position,
  positions,
  canTrade,
  onBack,
}: {
  readonly deskId: string;
  readonly position: DeskPosition;
  /** The account's positions: what a close frees and a sold leg's partner both look at them. */
  readonly positions: readonly DeskPosition[];
  readonly canTrade: boolean;
  readonly onBack: () => void;
}): ReactElement {
  const idBase = useId();
  const title = useRef<HTMLHeadingElement>(null);
  const occ = parseOccSymbol(position.symbol);
  const stock = occ?.underlying ?? position.symbol;
  // The option book the blotter reads, one cache: its row prices the waiting strip and the chart.
  const statement = useQuery({
    queryKey: ["option-positions", deskId],
    queryFn: () => fetchOptionPositions(deskId),
    enabled: positions.some((p) => p.isOption),
    staleTime: 30_000,
  });
  const book = statement.data?.rows.find((r) => r.symbol === position.symbol);
  const marks = useRowMarks(deskId, positions, statement.data);
  const row = marks.rows.get(position.symbol);
  const call = rowCallOf(positions, position);
  const spot = position.isOption ? book?.spot : signedDollars(position.price);
  const { price } = usePriceContext(position, spot);
  const wait = waitingStrip(position, book);
  const chart = profitChart(position, wait, price?.axis);
  const ways = waysToPlay(position, positions, wait);
  // The stock's narrowed ledger, the cache Activity's own symbol box fills (`account-activity.tsx`).
  const activity = useQuery({
    queryKey: ["desk-activity", deskId, { symbol: stock }],
    queryFn: () => fetchDeskActivity(deskId, { symbol: stock }),
  });
  const fills = activity.data?.available
    ? positionFills(activity.data.activity, position.symbol)
    : [];
  const waysTitle = `${ways.length === 3 ? "Three" : ways.length === 2 ? "Two" : "The"} ways to play it`;
  const heads: Record<(typeof SECTIONS)[number], string> = {
    picture: "Picture",
    ways: waysTitle,
    fills: "Fills",
    dates: "Dates",
  };
  const sectionId = (s: (typeof SECTIONS)[number]) => `${idBase}-${s}`;

  // The page opens at its title, so a screen reader starts where the eye does.
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, []);

  return (
    <article className="ppage" aria-labelledby={`${idBase}-title`}>
      <button type="button" className="ppage-back" onClick={onBack}>
        <span aria-hidden="true">← </span>
        <span className="visually-hidden">Back to </span>Positions
      </button>
      <header className="ppage-head">
        <h2 id={`${idBase}-title`} ref={title} tabIndex={-1}>
          {position.display}
        </h2>
        {position.plainName ? <p className="ppage-plain">{position.plainName}</p> : null}
        <p className="ppage-mark">
          {row ? <FactBadge row={row} /> : null}
          {call ? (
            <span className="ppage-read">
              {call.word}, {call.confidence} confidence, from your guidance read at {call.readAt}
            </span>
          ) : null}
        </p>
      </header>
      <nav className="ppage-nav" aria-label="On this page">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="ppage-nav-link"
            onClick={() => document.getElementById(sectionId(s))?.scrollIntoView()}
          >
            {heads[s]}
          </button>
        ))}
      </nav>
      <section id={sectionId("picture")} className="ppage-sec ppage-sec--picture">
        <h3>{heads.picture}</h3>
        <div className="ppage-pictures">
          <PositionPicture
            position={position}
            positions={positions}
            book={book}
            bookRead={statement.isSuccess}
          />
          {chart && occ ? (
            <ProfitChartView
              chart={chart}
              stock={stock}
              strike={occ.strike}
              breakeven={signedDollars(position.breakeven)}
            />
          ) : null}
        </div>
      </section>
      <section id={sectionId("ways")} className="ppage-sec">
        <h3>{heads.ways}</h3>
        <Ways ways={ways} />
      </section>
      <section id={sectionId("fills")} className="ppage-sec">
        <h3>{heads.fills}</h3>
        <Fills activity={activity} fills={fills} stock={stock} />
      </section>
      <section id={sectionId("dates")} className="ppage-sec">
        <h3>{heads.dates}</h3>
        <Dates position={position} fills={fills} />
      </section>
      {canTrade ? (
        <footer className="ppage-acts">
          <PositionActs
            deskId={deskId}
            position={position}
            positions={positions}
            {...(call ? { call } : {})}
          />
        </footer>
      ) : null}
    </article>
  );
}

/** A full page asked for a position the account no longer holds (closed since the link). */
export function PositionPageGone({
  symbol,
  onBack,
}: {
  readonly symbol: string;
  readonly onBack: () => void;
}): ReactElement {
  return (
    <article className="ppage">
      <button type="button" className="ppage-back" onClick={onBack}>
        <span aria-hidden="true">← </span>
        <span className="visually-hidden">Back to </span>Positions
      </button>
      <p className="note">{symbol} isn't held on this account any more, so it has no page.</p>
    </article>
  );
}
