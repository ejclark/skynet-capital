import { type ReactElement, useId } from "react";
import { parseWindowSpan, ruleTemplateOf } from "../live/playbook-rule";
import type { PlaybookStoreCardView, StrategyCardView } from "../live/playbook-store";

/**
 * A READY PLAY'S SMALL PICTURE (#5435; Eric, #5163 round 5: "i like the compact tile - the ability to
 * communicate strategy via pictures/charts significantly enables us here"). The full pictures shrunk
 * to a list row, in their own visual language and classes (`playbook-open.css`): a held stretch is a
 * filled bar, a stretch out of the stock is hatched, the earnings report is ◆, a loop's steps are
 * numbered rings. Decorative beside the row's own words, so hidden from a screen reader.
 *
 *  - The run-up and the call spread: #5432's line — buy, hold, sell, then the report — at the
 *    pair's own window (`parseWindowSpan`), never a date. The spread adds a dashed ceiling over the
 *    held bar: the most a spread can make.
 *  - The wheel: the loop, ① put → ② shares → ③ call, and the way back under it.
 *  - The long call: one long held bar running through two ◆ reports.
 */

const W = 120;
const H = 48;

function Hatch({ id }: { readonly id: string }): ReactElement {
  return (
    <defs>
      <pattern
        id={id}
        width="4"
        height="4"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(-45)"
      >
        <line x1="0" y1="0" x2="0" y2="4" className="pbr-hatch-line" />
      </pattern>
    </defs>
  );
}

/** The window as a line: held from `buyAway` trading days out to `sellAway`, then the report. */
function WindowThumb({
  buyAway,
  sellAway,
  capped = false,
}: {
  readonly buyAway: number;
  readonly sellAway: number;
  /** A spread's ceiling over the held stretch. */
  readonly capped?: boolean;
}): ReactElement {
  const L = 8;
  const Z = 100;
  const lead = buyAway + 4;
  const x = (away: number) => Z - (away / lead) * (Z - L);
  const y = 28;
  const buyX = x(buyAway);
  const sellX = x(sellAway);
  const hatch = `pbl-hatch-${useId().replace(/:/g, "")}`;
  return (
    <svg className="pbl-thumb" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <Hatch id={hatch} />
      <line className="pbr-axis" x1={L} x2={Z} y1={y} y2={y} />
      <rect className="pbr-keep" x={buyX} y={y - 6} width={Math.max(sellX - buyX, 2)} height={12} />
      {sellAway > 0 ? (
        <rect
          className="pbr-lose"
          x={sellX}
          y={y - 6}
          width={Math.max(Z - sellX, 2)}
          height={12}
          fill={`url(#${hatch})`}
        />
      ) : null}
      {capped ? <line className="pbl-cap" x1={buyX} x2={sellX} y1={y - 12} y2={y - 12} /> : null}
      <text className="pbr-print" x={sellAway === 0 ? Z + 9 : Z + 4} y={y + 5} textAnchor="middle">
        ◆
      </text>
    </svg>
  );
}

/** ① put → ② shares → ③ call, and back under them: `WheelLoop`'s three stops, shrunk. */
function WheelThumb(): ReactElement {
  const stops = [16, 60, 104] as const;
  const y = 18;
  const arrow = `pbl-arrow-${useId().replace(/:/g, "")}`;
  const head = `url(#${arrow})`;
  return (
    <svg className="pbl-thumb" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <defs>
        <marker
          id={arrow}
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L8 4 L0 8 z" className="pbr-arrowhead" />
        </marker>
      </defs>
      <path className="pbr-edge" d={`M 26 ${y} L 49 ${y}`} markerEnd={head} />
      <path className="pbr-edge" d={`M 70 ${y} L 93 ${y}`} markerEnd={head} />
      <path
        className="pbr-edge"
        d={`M 104 ${y + 10} C 104 46, 16 46, 16 ${y + 12}`}
        markerEnd={head}
      />
      {stops.map((cx, i) => (
        <g key={cx} className="pbr-stop">
          <circle className="pbr-node" cx={cx} cy={y} r={9} />
          <text className="pbl-num" x={cx} y={y + 3.5} textAnchor="middle">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Calls held for months, through two earnings reports. */
function LongCallThumb(): ReactElement {
  const y = 28;
  return (
    <svg className="pbl-thumb" viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
      <line className="pbr-axis" x1={8} x2={112} y1={y} y2={y} />
      <rect className="pbr-keep" x={12} y={y - 6} width={92} height={12} />
      {[44, 78].map((cx) => (
        <text key={cx} className="pbr-print" x={cx} y={y - 10} textAnchor="middle">
          ◆
        </text>
      ))}
    </svg>
  );
}

/** The window a strategy's pairs trade: their own, or — for a play that trades another's window on
 *  the same ticker, as the call spread trades the run-up's (`ruleTemplateOf`) — that ticker's. */
function windowOf(
  strategy: StrategyCardView,
  cardsById: ReadonlyMap<string, PlaybookStoreCardView>,
) {
  const own = strategy.pairs
    .map((pair) => parseWindowSpan(cardsById.get(pair.id)?.window))
    .find((span) => span !== undefined);
  if (own || ruleTemplateOf(strategy.strategy) !== "window") return own;
  const tickers = new Set(strategy.pairs.flatMap((pair) => pair.symbols));
  return [...cardsById.values()]
    .filter((card) => card.symbols.length === 1 && tickers.has(card.symbol))
    .map((card) => parseWindowSpan(card.window))
    .find((span) => span !== undefined);
}

/** The picture a ready strategy wears on its list row, from its own first pair's rules; none for a
 *  strategy no picture has been drawn for yet. */
export function StrategyThumb({
  strategy,
  cardsById,
}: {
  readonly strategy: StrategyCardView;
  readonly cardsById: ReadonlyMap<string, PlaybookStoreCardView>;
}): ReactElement | null {
  if (ruleTemplateOf(strategy.strategy) === "wheel") return <WheelThumb />;
  if (strategy.strategy === "long-call") return <LongCallThumb />;
  const windowed = windowOf(strategy, cardsById);
  if (!windowed) return null;
  return (
    <WindowThumb
      buyAway={windowed.opens}
      sellAway={Math.max(windowed.closes - 1, 0)}
      capped={strategy.instrument === "options"}
    />
  );
}
