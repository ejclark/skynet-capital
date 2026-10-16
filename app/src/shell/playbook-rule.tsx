import type { ReactElement } from "react";
import { occStrikeLabel, parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition } from "../live/desk";
import {
  dayText,
  dollarsOf,
  type WheelPhase,
  type WindowPlan,
  wheelStep,
} from "../live/playbook-rule";

/**
 * THE RULE AS A PICTURE (#5073 slice 3; #5037 round 2's PATTERNS row "The rule as a picture": an
 * open playbook draws its rule as its steps or its window, with "you are here", instead of a
 * sentence). Two templates, the two the house runs:
 *
 *  - THE WHEEL, a loop: ① sell a put → ② own 100 shares if assigned → ③ sell a call → back to ①
 *    once they are called away, and ① again when the put expires untouched. The step the book is
 *    on is ringed and labelled in words. Under it, the price strip: the stock now against the sold
 *    contract's strike and breakeven, the zones said in words (Eric's integration note on #5073:
 *    "the wheel drawn as a loop with the price strip").
 *  - A PRE-PRINT WINDOW, on the calendar: the days it holds as a solid band, the days it stands
 *    out as hatching, the print as ◆ and today as ●.
 *
 * Every state is a shape and a word, never hue alone (docs/BRAND.md → Accessibility). Numbers sit
 * on the picture, never in a list beside it (Eric, same note).
 */

/* ── the wheel ─────────────────────────────────────────────────────────────────────────────── */

/** The loop's three stops in a row, the way a phone reads them; the way back runs under them. */
const STOPS = {
  1: { x: 52, y: 58 },
  2: { x: 170, y: 58 },
  3: { x: 288, y: 58 },
} as const;

/** The sentence under the loop: where the book is, and what moves it on — in the book's numbers. */
function wheelSentence(
  phase: WheelPhase,
  symbol: string,
  sold: DeskPosition | undefined,
): string | undefined {
  const occ = sold ? parseOccSymbol(sold.symbol) : undefined;
  const strike = occ ? occStrikeLabel(occ.strike) : undefined;
  const days = sold?.expiresInDays;
  const left = days === undefined ? "" : days === 0 ? ", expiring today" : `, ${days} days left`;
  if (phase === "put-open")
    return `1 put sold${left}. Above ${strike ?? "its strike"} at expiry, it keeps the premium and sells the next put; below, it is assigned 100 ${symbol} and moves to ②.`;
  if (phase === "assigned")
    return `It owns ${symbol} from an assigned put. Next it sells a call on those shares (③).`;
  if (phase === "call-open")
    return `1 call sold on its 100 ${symbol}${left}. Above ${strike ?? "its strike"} at expiry, the shares are called away and it starts again at ①.`;
  if (phase === "flat") return `Nothing open on ${symbol}. Its next move is ①: sell a put.`;
  return `The book holds a ${symbol} contract the wheel did not sell, so the wheel waits.`;
}

export function WheelLoop({
  symbol,
  phase,
  sold,
  spot,
}: {
  readonly symbol: string;
  readonly phase: WheelPhase;
  /** The contract it has sold, on step ① or ③. */
  readonly sold?: DeskPosition;
  /** The stock's price, when the option book quoted it. */
  readonly spot?: number;
}): ReactElement {
  const here = wheelStep(phase);
  const occ = sold ? parseOccSymbol(sold.symbol) : undefined;
  const strike = occ ? occStrikeLabel(occ.strike) : "the strike";
  const stop = (n: 1 | 2 | 3, label: string, sub: string) => {
    const { x, y } = STOPS[n];
    const on = here === n;
    const dy = 34;
    return (
      <g className="pbr-stop" data-here={on || undefined}>
        {on ? <circle className="pbr-halo" cx={x} cy={y} r={19} /> : null}
        <circle className="pbr-node" cx={x} cy={y} r={13} />
        <text className="pbr-num" x={x} y={y + 4.5} textAnchor="middle">
          {n}
        </text>
        <text className="pbr-label" x={x} y={y + dy} textAnchor="middle">
          {label}
        </text>
        <text className="pbr-sub" x={x} y={y + dy + 13} textAnchor="middle">
          {on ? "● you are here" : sub}
        </text>
      </g>
    );
  };
  const sentence = wheelSentence(phase, symbol, sold);
  return (
    <figure className="pbr pbr-wheel">
      <svg
        viewBox="0 0 340 166"
        role="img"
        aria-label={`The wheel on ${symbol}: 1, sell a put; 2, if assigned, own 100 ${symbol}; 3, sell a call on them; then back to 1.${here ? ` It is on step ${here}.` : ""}`}
      >
        <defs>
          <marker
            id="pbr-arrow"
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L8 4 L0 8 z" className="pbr-arrowhead" />
          </marker>
        </defs>
        {/* ① again: the put expires above the strike, the premium is kept, and it sells again */}
        <path
          className="pbr-edge pbr-self"
          d="M 42 44 C 30 10, 74 10, 62 44"
          markerEnd="url(#pbr-arrow)"
        />
        <text className="pbr-edge-label" x={78} y={20}>
          above {strike}: keeps the premium, sells again
        </text>
        {/* ① → ②: assigned below the strike */}
        <path className="pbr-edge" d="M 70 58 L 150 58" markerEnd="url(#pbr-arrow)" />
        <text className="pbr-edge-label" x={110} y={51} textAnchor="middle">
          if below
        </text>
        {/* ② → ③: a call sold on the shares */}
        <path className="pbr-edge" d="M 188 58 L 268 58" markerEnd="url(#pbr-arrow)" />
        {/* ③ → ①: the shares called away, round underneath and back to the start */}
        <path
          className="pbr-edge"
          d="M 288 112 C 288 152, 52 152, 52 112"
          markerEnd="url(#pbr-arrow)"
        />
        <text className="pbr-edge-label" x={170} y={158} textAnchor="middle">
          called away: back to 1
        </text>
        {stop(1, "Sell a put", "about a month out")}
        {stop(2, `Own 100 ${symbol}`, "if assigned")}
        {stop(3, "Sell a call", "on those shares")}
      </svg>
      {occ && sold ? (
        <PriceStrip
          symbol={symbol}
          side={occ.type}
          strike={occ.strike}
          breakeven={dollarsOf(sold.breakeven)}
          {...(spot !== undefined ? { spot } : {})}
        />
      ) : null}
      {sentence ? <figcaption className="pbr-caption">{sentence}</figcaption> : null}
    </figure>
  );
}

/* ── the price strip ───────────────────────────────────────────────────────────────────────── */

const STRIP = { left: 14, right: 326 } as const;

/** A stretch of the axis, left edge to right edge. */
type Span = readonly [number, number];

/** About how wide a figure label sets: 10.5px mono runs near 6.4 units a character. */
const labelWidth = (text: string) => text.length * 6.4;

/**
 * A figure's label beside its tick, reading away from it — unless that would run off the strip's
 * edge, when it drops a row and sits against the edge instead, so a figure is never cut off.
 */
function edgeSafe(
  at: number,
  text: string,
  anchor: "start" | "end",
  y: number,
): { x: number; y: number; textAnchor: "start" | "end" } {
  const w = labelWidth(text);
  if (anchor === "end" && at - w < 0) return { x: 0, y: y + 14, textAnchor: "start" };
  if (anchor === "start" && at + w > 340) return { x: 340, y: y + 14, textAnchor: "end" };
  return { x: at, y, textAnchor: anchor };
}

const money = (n: number) => `$${n.toFixed(2).replace(/\.00$/, "")}`;

/** A put: kept above the strike, part-kept down to the breakeven, lost below it. A covered call:
 *  kept below the strike, called away above it. In strip units. */
function stripZones(
  put: boolean,
  strikeX: number,
  beX: number | undefined,
): { keep: Span; part?: Span; lose?: Span } {
  if (!put) return { keep: [STRIP.left, strikeX], part: [strikeX, STRIP.right] };
  if (beX === undefined) return { keep: [strikeX, STRIP.right] };
  return { keep: [strikeX, STRIP.right], part: [beX, strikeX], lose: [STRIP.left, beX] };
}

/** What the strip draws, in a sentence for a screen reader. */
function stripSentence(put: boolean, strike: number, be: number | undefined): string {
  if (!put)
    return `the covered call keeps its premium below ${money(strike)}; above it the shares are called away at ${money(strike)}`;
  const loses = be !== undefined ? ` and loses below ${money(be)}` : "";
  return `the sold put keeps its premium above ${money(strike)}${loses}`;
}

/**
 * The stock now against a sold contract's lines. A sold put keeps all its premium above the strike
 * and loses below its breakeven: a solid band, a thin line between, hatching. A wheel's sold call
 * is COVERED — it sits on the 100 shares it was assigned — so above its strike nothing is lost:
 * the shares are called away at the strike, and the strip says exactly that, with no breakeven
 * (the naked call's line would be the wrong one). The price is ▼ with its figure.
 */
export function PriceStrip({
  symbol,
  side,
  strike,
  breakeven,
  spot,
}: {
  readonly symbol: string;
  readonly side: "call" | "put";
  readonly strike: number;
  readonly breakeven?: number;
  readonly spot?: number;
}): ReactElement {
  const put = side === "put";
  const be = put ? breakeven : undefined;
  const figures = [strike, be, spot].filter((n): n is number => n !== undefined);
  const lo = Math.min(...figures);
  const hi = Math.max(...figures);
  // Room past the outer figures for their labels to read beside their ticks.
  const pad = Math.max((hi - lo) * 0.45, strike * 0.06);
  const [from, to] = [lo - pad, hi + pad];
  const x = (n: number) => STRIP.left + ((n - from) / (to - from)) * (STRIP.right - STRIP.left);
  const { keep, part, lose } = stripZones(put, x(strike), be === undefined ? undefined : x(be));
  const y = 40;
  const said = stripSentence(put, strike, be);
  // The strike's figure reads toward the kept side and the breakeven's toward the losing side, so
  // the two never overlap however close they sit.
  return (
    <svg
      className="pbr-strip"
      viewBox="0 0 340 92"
      role="img"
      aria-label={`${symbol}${spot !== undefined ? ` at ${money(spot)}` : ""}: ${said}.`}
    >
      <defs>
        <pattern
          id="pbr-hatch"
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <line x1="0" y1="0" x2="0" y2="5" className="pbr-hatch-line" />
        </pattern>
      </defs>
      <line className="pbr-axis" x1={STRIP.left} x2={STRIP.right} y1={y} y2={y} />
      <rect className="pbr-keep" x={keep[0]} y={y - 4} width={keep[1] - keep[0]} height={8} />
      {part ? (
        <rect className="pbr-part" x={part[0]} y={y - 1.5} width={part[1] - part[0]} height={3} />
      ) : null}
      {lose ? (
        <rect
          className="pbr-lose"
          x={lose[0]}
          y={y - 6}
          width={lose[1] - lose[0]}
          height={12}
          fill="url(#pbr-hatch)"
        />
      ) : null}
      <text
        className="pbr-zone"
        x={put ? STRIP.right : STRIP.left}
        y={y - 10}
        textAnchor={put ? "end" : "start"}
      >
        keeps all of it
      </text>
      {put && !lose ? null : (
        <text
          className="pbr-zone"
          x={put ? STRIP.left : STRIP.right}
          y={y - 10}
          textAnchor={put ? "start" : "end"}
        >
          {put ? "loses" : "called away"}
        </text>
      )}
      <line className="pbr-tick" x1={x(strike)} x2={x(strike)} y1={y - 8} y2={y + 10} />
      <text
        className="pbr-fig"
        {...edgeSafe(x(strike), `${money(strike)} strike`, put ? "start" : "end", y + 24)}
      >
        {money(strike)} strike
      </text>
      {be !== undefined ? (
        <>
          <line className="pbr-tick pbr-tick-be" x1={x(be)} x2={x(be)} y1={y - 8} y2={y + 10} />
          <text
            className="pbr-fig pbr-fig-muted"
            {...edgeSafe(x(be), `${money(be)} breakeven`, "end", y + 24)}
          >
            {money(be)} breakeven
          </text>
        </>
      ) : null}
      {spot !== undefined ? (
        <g className="pbr-now">
          <text x={x(spot)} y={y - 20} textAnchor="middle" className="pbr-now-fig">
            ▼ {symbol} {money(spot)}
          </text>
          <line className="pbr-now-line" x1={x(spot)} x2={x(spot)} y1={y - 16} y2={y + 8} />
        </g>
      ) : (
        <text className="pbr-zone" x={170} y={y + 38} textAnchor="middle">
          {symbol}'s price isn't quoted right now
        </text>
      )}
    </svg>
  );
}

/* ── a pre-print window ────────────────────────────────────────────────────────────────────── */

const DAY_MS = 86_400_000;
const daysFrom = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);

function windowSentence(plan: WindowPlan, span: string): string {
  const { symbol, print } = plan;
  const est = print.confirmed ? "" : " (est.)";
  const wait = print.confirmed
    ? ""
    : " It opens only once that date is confirmed; until then it waits.";
  if (plan.phase === "before")
    return `Holds ${symbol} ${span}. ${symbol} prints ${dayText(print.date)}${est}, so its window would open ${dayText(plan.opens)}.${wait}`;
  if (plan.phase === "inside")
    return `Inside its window: it wants to hold ${symbol} through ${dayText(plan.lastLong)}${plan.outBy ? ` and be out by ${dayText(plan.outBy)}` : ", to the close of print day"}.`;
  return `Out of ${symbol} until the print on ${dayText(print.date)}${est}; the next window follows the next print.`;
}

/** How many days before the window opens the axis starts: enough lead-in to see today coming,
 *  never so much that the window shrinks too narrow to label. Further off, today sits at the edge
 *  behind a break. */
const LEAD_DAYS = 10;

const shiftDay = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

export function WindowTimeline({
  plan,
  span,
}: {
  readonly plan: WindowPlan;
  /** The Store's own window sentence ("20 to 6 sessions before the print"). */
  readonly span: string;
}): ReactElement {
  const lead = shiftDay(plan.opens, -LEAD_DAYS);
  const start = plan.today < plan.opens ? (plan.today > lead ? plan.today : lead) : plan.opens;
  const total = Math.max(daysFrom(start, plan.print.date) + 4, 1);
  const L = 14;
  const R = 326;
  const x = (date: string) => L + ((daysFrom(start, date) + 2) / total) * (R - L);
  // Today before the axis begins is drawn at its edge, after a break: off the scale, said in words.
  const offScale = plan.today < start;
  const todayX = offScale ? L : plan.today > plan.print.date ? R : x(plan.today);
  const y = 40;
  const bandEnd = plan.outBy ?? plan.print.date;
  const est = plan.print.confirmed ? "" : " est.";
  // Rows: today above the axis, "holds" on the band, the window's two edges on the first row under
  // it and the print alone on the second, so no two labels share a row they could collide on.
  return (
    <figure className="pbr pbr-window">
      <svg
        viewBox="0 0 340 92"
        role="img"
        aria-label={`${plan.symbol}'s window: holds from ${dayText(plan.opens)} through ${dayText(plan.lastLong)}, the print ${dayText(plan.print.date)}${plan.print.confirmed ? "" : ", estimated"}; today is ${dayText(plan.today)}.`}
      >
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
        <line className="pbr-axis" x1={offScale ? L + 14 : L} x2={R} y1={y} y2={y} />
        {offScale ? (
          <text className="pbr-zone" x={L + 7} y={y + 4} textAnchor="middle">
            ≈
          </text>
        ) : null}
        <rect
          className="pbr-keep"
          x={x(plan.opens)}
          y={y - 6}
          width={Math.max(x(bandEnd) - x(plan.opens), 2)}
          height={12}
        />
        {plan.outBy ? (
          <rect
            className="pbr-lose"
            x={x(plan.outBy)}
            y={y - 6}
            width={Math.max(x(plan.print.date) - x(plan.outBy), 2)}
            height={12}
            fill="url(#pbr-hatch-w)"
          />
        ) : null}
        <text
          className="pbr-zone"
          x={(x(plan.opens) + x(bandEnd)) / 2}
          y={y - 11}
          textAnchor="middle"
        >
          holds {plan.symbol}
        </text>
        <text className="pbr-fig" x={x(plan.opens)} y={y + 22} textAnchor="start">
          opens {dayText(plan.opens)}
        </text>
        {plan.outBy ? (
          <text className="pbr-fig pbr-fig-muted" x={x(plan.outBy)} y={y + 22} textAnchor="end">
            out {dayText(plan.outBy)}
          </text>
        ) : null}
        <text className="pbr-print" x={x(plan.print.date)} y={y + 5} textAnchor="middle">
          ◆
        </text>
        <text className="pbr-fig" x={x(plan.print.date) + 6} y={y + 38} textAnchor="end">
          ◆ print {dayText(plan.print.date)}
          {est}
        </text>
        <g className="pbr-now">
          <line className="pbr-now-line" x1={todayX} x2={todayX} y1={y - 22} y2={y + 6} />
          <text
            className="pbr-now-fig"
            x={todayX}
            y={y - 26}
            textAnchor={todayX < 60 ? "start" : todayX > 280 ? "end" : "middle"}
          >
            ● today{offScale ? `, ${dayText(plan.today)}` : ""}
          </text>
        </g>
      </svg>
      <figcaption className="pbr-caption">{windowSentence(plan, span)}</figcaption>
    </figure>
  );
}
