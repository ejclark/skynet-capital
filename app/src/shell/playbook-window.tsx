import type { ReactElement } from "react";
import { dayText, type WindowPlan } from "../live/playbook-rule";
import type { PrintStretchesView } from "../live/playbook-store";

/**
 * A PRE-EARNINGS PLAY AS ONE LINE (#5432; Eric's pick on #5163 round 4, "Dates counted back from the
 * report"). One picture, drawn on R&D → Playbooks and on the bot's own opened card (#5073 slice 3),
 * so the two read in one visual language:
 *
 *  - THE LINE: ● today, ① the buy day, a filled bar "holds NVDA" to ② the sell day, a hatched
 *    stretch it is out of, and ◆ the earnings report.
 *  - A RULER under it in trading days to the report (−20 · −10 · −5 · 0), ticks under ①, each
 *    stretch break, ② and ◆ — every date says what it counts back from ("I want to know why",
 *    Eric, round 3).
 *  - THREE ROWS: ① Buy · Hold · ② Sell, with dates, and, while the date is an estimate, how far the
 *    dates could move and what happens if it is never confirmed.
 *  - BARS, when the study measured them: the stock's average move in each stretch on a zero line,
 *    laid on the same scale as the line so each bar sits under its stretch.
 *
 * Every state is a shape and a word, never hue alone (docs/BRAND.md → Accessibility): held is filled,
 * not held is hatched, a move below zero is hatched below the line, the steps are numbered rings.
 * Member copy says "earnings report" and "trading days" — never "print", "D-5" or "session".
 *
 * The dates are the playbook's own window (the Store's sentence, `windowPlan`) counted on the next
 * report in `UPCOMING_PRINTS`; the bars are the playbook's cited `stretches`. Nothing here is typed in.
 */

const W = 340;
/** Left edge of the scale, and where the report sits: room to its right for ◆ and its label. */
const L = 16;
const Z = 300;

/** About how wide a 10.5px mono label sets, per character. */
const charW = 6.4;

/** "−20", "0": a count of trading days before the report, signed the way the ruler reads. */
const tick = (away: number) => (away === 0 ? "0" : `−${away}`);

/** "+6.3%", "−0.8%" — a true minus sign, one decimal. */
const movePct = (pct: number) => `${pct < 0 ? "−" : "+"}${Math.abs(pct).toFixed(1)}%`;

/** "Oct 20–28", or "Oct 28 – Nov 3" across a month. */
function rangeText([from, to]: readonly [string, string]): string {
  const a = dayText(from);
  const b = dayText(to);
  const [monthA] = a.split(" ");
  const [monthB, ...restB] = b.split(" ");
  return monthA === monthB ? `${a}–${restB.join(" ")}` : `${a} – ${b}`;
}

/** The scale: trading days before the report → x. Far enough left to show today coming, never so
 *  far that the window shrinks too narrow to read; further off, today sits at the edge behind ≈. */
function scaleOf(plan: WindowPlan) {
  const lead = Math.min(Math.max(plan.todayAway, plan.buyAway + 2), plan.buyAway + 12);
  const x = (away: number) => Z - (away / lead) * (Z - L);
  const offScale = plan.todayAway > lead;
  const todayX = offScale ? L : x(Math.max(plan.todayAway, 0));
  return { x, offScale, todayX };
}

/** What happens while the date is only an estimate — the code's own gate (S1-NVDA, G1-GOOG): only
 *  a confirmed date opens a position, and one confirmed inside the window opens it on the next run. */
export function gateLine(plan: WindowPlan): string | undefined {
  if (plan.print.confirmed) return undefined;
  const last = dayText(plan.lastLong);
  if (plan.phase === "before")
    return `It buys only once the report date is confirmed, as late as ${last}. Unconfirmed by then, it skips to the next report.`;
  if (plan.phase === "inside")
    return `The report date isn't confirmed yet, so it holds nothing. Confirmed by ${last}, it buys then; if not, it skips to the next report.`;
  return `No confirmed report date by ${last}: it skips to the next report.`;
}

/** The ① Buy · Hold · ② Sell rows, each date with what it counts back from. */
export function stepRows(plan: WindowPlan): readonly string[] {
  const sellDay = plan.outBy ?? plan.print.date;
  const sellWhen =
    plan.sellAway === 0 ? "report day, before the close" : `${plan.sellAway} trading days before`;
  return [
    `① Buy · ${dayText(plan.opens)} · ${plan.buyAway} trading days before`,
    `Hold · ${dayText(plan.opens)} – ${dayText(plan.lastLong)}`,
    `② Sell · ${dayText(sellDay)} · ${sellWhen}`,
  ];
}

function Ring({ n, cx, cy }: { readonly n: 1 | 2; readonly cx: number; readonly cy: number }) {
  return (
    <g className="pbr-stop">
      <circle className="pbr-node" cx={cx} cy={cy} r={10} />
      <text className="pbr-num" x={cx} y={cy + 4.5} textAnchor="middle">
        {n}
      </text>
    </g>
  );
}

/** What the line draws, in a sentence for a screen reader. */
function lineSaid(plan: WindowPlan): string {
  const last = plan.sellAway === 0 ? 0 : plan.sellAway + 1;
  const est = plan.print.confirmed ? "" : ", estimated";
  return `${plan.symbol}'s window: holds from ${dayText(plan.opens)} through ${dayText(plan.lastLong)}, ${plan.buyAway} to ${last} trading days before the earnings report ${dayText(plan.print.date)}${est}; today is ${dayText(plan.today)}.`;
}

/** The ruler's ticks: under ①, each stretch break, ② and ◆ — farthest first. */
function rulerMarks(plan: WindowPlan, stretches: PrintStretchesView | undefined): number[] {
  const breaks = stretches?.stretches.flatMap((s) => [s.from, s.to]) ?? [];
  return [...new Set([plan.buyAway, ...breaks, plan.sellAway, 0])]
    .filter((d) => d >= 0 && d <= plan.buyAway)
    .sort((a, b) => b - a);
}

function Ruler({
  marks,
  x,
}: {
  readonly marks: readonly number[];
  readonly x: (away: number) => number;
}): ReactElement {
  const from = x(marks[0] ?? 0);
  return (
    <g className="pbr-ruler">
      <line className="pbr-axis" x1={from} x2={Z} y1={74} y2={74} />
      {marks.map((d) => (
        <g key={d}>
          <line className="pbr-tick" x1={x(d)} x2={x(d)} y1={70} y2={78} />
          <text className="pbr-fig" x={x(d)} y={90} textAnchor="middle">
            {tick(d)}
          </text>
        </g>
      ))}
      <text className="pbr-zone" x={(from + Z) / 2} y={105} textAnchor="middle">
        trading days to the report
      </text>
    </g>
  );
}

/** ● today on the line; off the scale, at its edge with the date said in words. */
function TodayMark({
  x,
  y,
  offScale,
  today,
}: {
  readonly x: number;
  readonly y: number;
  readonly offScale: boolean;
  readonly today: string;
}): ReactElement {
  return (
    <g className="pbr-now">
      <circle className="pbr-today" cx={x} cy={y} r={4} />
      <text
        className="pbr-now-fig"
        x={x}
        y={y + 24}
        textAnchor={x < 60 ? "start" : x > 280 ? "end" : "middle"}
      >
        today{offScale ? `, ${dayText(today)}` : ""}
      </text>
    </g>
  );
}

export function WindowTimeline({
  plan,
  stretches,
}: {
  readonly plan: WindowPlan;
  /** The study's move in each stretch; absent draws the line, ruler and rows with no bars. */
  readonly stretches?: PrintStretchesView;
}): ReactElement {
  const { x, offScale, todayX } = scaleOf(plan);
  const y = 42;
  const buyX = x(plan.buyAway);
  const sellX = x(plan.sellAway);
  // Selling on report day puts ② on the report; ◆ sits just after it — the report comes after the close.
  const reportX = plan.sellAway === 0 ? Z + 16 : Z;
  const est = plan.print.confirmed ? "" : " est.";
  const marks = rulerMarks(plan, stretches);
  const notHeldW = Z - sellX;
  const gate = gateLine(plan);
  return (
    <figure className="pbr pbr-window">
      <svg viewBox={`0 0 ${W} 110`} role="img" aria-label={lineSaid(plan)}>
        <defs>
          <pattern
            id="pbr-hatch-w"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <line x1="0" y1="0" x2="0" y2="5" className="pbr-hatch-line" />
          </pattern>
        </defs>
        <line className="pbr-axis" x1={offScale ? L + 14 : L} x2={Z} y1={y} y2={y} />
        {offScale ? (
          <text className="pbr-zone" x={L + 7} y={y + 4} textAnchor="middle">
            ≈
          </text>
        ) : null}
        <rect
          className="pbr-keep"
          x={buyX}
          y={y - 5}
          width={Math.max(sellX - buyX, 2)}
          height={10}
        />
        {plan.sellAway > 0 ? (
          <rect
            className="pbr-lose"
            x={sellX}
            y={y - 5}
            width={Math.max(notHeldW, 2)}
            height={10}
            fill="url(#pbr-hatch-w)"
          />
        ) : null}
        <text className="pbr-zone" x={(buyX + sellX) / 2} y={y - 14} textAnchor="middle">
          holds {plan.symbol}
        </text>
        {plan.sellAway > 0 && notHeldW >= 46 ? (
          <text className="pbr-zone" x={(sellX + Z) / 2} y={y - 14} textAnchor="middle">
            not held
          </text>
        ) : null}
        <text className="pbr-fig" x={Math.min(reportX + 7, W)} y={12} textAnchor="end">
          earnings report {dayText(plan.print.date)}
          {est}
        </text>
        <text className="pbr-print" x={reportX} y={y + 5} textAnchor="middle">
          ◆
        </text>
        <Ring n={1} cx={buyX} cy={y} />
        <Ring n={2} cx={sellX} cy={y} />
        <TodayMark x={todayX} y={y} offScale={offScale} today={plan.today} />
        <Ruler marks={marks} x={x} />
      </svg>
      <ul className="pbr-steps">
        {stepRows(plan).map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
      {plan.print.confirmed ? null : (
        <p className="pbr-muted">
          The dates move if the report date moves
          {plan.buyRange ? ` (buy ${rangeText(plan.buyRange)})` : ""}.
        </p>
      )}
      {stretches && stretches.stretches.length > 0 ? (
        <StretchBars symbol={plan.symbol} plan={plan} stretches={stretches} x={x} />
      ) : null}
      {gate ? <p className="pbr-muted">{gate}</p> : null}
    </figure>
  );
}

/** One bar per stretch on a zero line, under the stretch it measures; below zero is hatched. */
function StretchBars({
  symbol,
  plan,
  stretches,
  x,
}: {
  readonly symbol: string;
  readonly plan: WindowPlan;
  readonly stretches: PrintStretchesView;
  readonly x: (away: number) => number;
}): ReactElement {
  const shown = stretches.stretches.filter((s) => s.from <= plan.buyAway && s.to >= 0);
  const maxAbs = Math.max(...shown.map((s) => Math.abs(s.meanPct)), 0.01);
  const bars = shown.map((s) => {
    // Never thinner than its hatching can be read at: a −0.8% bar still shows it fell.
    const h = Math.max((Math.abs(s.meanPct) / maxAbs) * 30, 7);
    const down = s.meanPct < 0;
    const soldBy = plan.sellAway > 0 && s.from <= plan.sellAway;
    const lines = [
      movePct(s.meanPct),
      `${s.rose} of ${stretches.reports}${down ? " rose" : ""}`,
      ...(soldBy ? ["sold by then"] : []),
    ];
    return { s, h, down, lines };
  });
  // The figures share rows — over the tallest rise, under the deepest fall — so a label wider than
  // its stretch never runs into the next bar.
  const LINE = 12;
  const span = (down: boolean) => {
    const side = bars.filter((b) => b.down === down);
    const h = Math.max(...side.map((b) => b.h), 0);
    const n = Math.max(...side.map((b) => b.lines.length), 0);
    return { h, n, room: side.length > 0 ? h + n * LINE + 4 : 0 };
  };
  const up = span(false);
  const fall = span(true);
  const y0 = up.room + 2;
  const said = bars
    .map(
      ({ s }) =>
        `${s.from} to ${s.to === 0 ? "the report" : `${s.to} trading days before`}, ${movePct(s.meanPct)}, rose in ${s.rose} of ${stretches.reports}`,
    )
    .join("; ");
  return (
    <div className="pbr-bars">
      <p className="pbr-bars-h">Average move in each stretch</p>
      <svg
        viewBox={`0 0 ${W} ${y0 + fall.room + 4}`}
        role="img"
        aria-label={`${symbol}'s average move before its last ${stretches.reports} earnings reports, ${stretches.era}: ${said}.`}
      >
        <defs>
          <pattern
            id="pbr-hatch-b"
            width="5"
            height="5"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <line x1="0" y1="0" x2="0" y2="5" className="pbr-hatch-line" />
          </pattern>
        </defs>
        {bars.map(({ s, h, down, lines }) => {
          const x1 = x(s.from) + 2;
          const x2 = x(s.to) - 2;
          const cx = (x1 + x2) / 2;
          // Each figure reads beside its bar: stacked up from the top of a rise, down from a fall.
          const lineY = (i: number) =>
            down ? y0 + fall.h + LINE * (i + 1) : y0 - up.h - LINE * (lines.length - i - 1) - 6;
          return (
            <g key={`${s.from}-${s.to}`}>
              <rect
                className={down ? "pbr-lose" : "pbr-keep"}
                x={x1}
                y={down ? y0 : y0 - h}
                width={Math.max(x2 - x1, 2)}
                height={h}
                {...(down ? { fill: "url(#pbr-hatch-b)" } : {})}
              />
              {lines.map((line, i) => (
                <text
                  key={line}
                  className={i === 0 ? "pbr-fig" : "pbr-fig pbr-fig-muted"}
                  x={Math.min(
                    Math.max(cx, (line.length * charW) / 2),
                    W - (line.length * charW) / 2,
                  )}
                  y={lineY(i)}
                  textAnchor="middle"
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
        <line className="pbr-zero" x1={x(plan.buyAway)} x2={Z} y1={y0} y2={y0} />
      </svg>
      <p className="pbr-muted">
        Each bar: {symbol}'s average move in that stretch before its last {stretches.reports}{" "}
        earnings reports, {stretches.era}.
      </p>
    </div>
  );
}
