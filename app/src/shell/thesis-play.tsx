import type { CSSProperties, ReactElement } from "react";
import type { SafeguardLadderEntry, ThesisMarker, ThesisPlay } from "../live/desk";
import { ladderStamp, SAFEGUARD_STATE_GLYPH, SAFEGUARD_STATE_LABEL } from "./safeguard-state";

/**
 * THE BOT'S OWN PLAY, DRAWN (#5327 — Eric's Build pick, #5177 round 5 option C: "I like the visual
 * telling the story"). Under the lore paragraph, the mechanic said plainly beside it: the play's
 * rule as a line on the news-sentiment scale, its trades placed where each decision read the news,
 * one real buy walked through, then what protects the play.
 *
 * Every number arrives in the payload (`thesis-play-view.ts`, the markers' recorded `sentiment` /
 * `momentum`); this component positions and words them and invents none. A value the record does
 * not carry is said in words, never drawn at a guessed spot.
 *
 * Hue never carries meaning alone (a standing reader is red/green colourblind): the buy zone is
 * hatched and the sell zone dotted, a bought mark has a solid ring and a sold one a dashed ring, and
 * every side is also ▲/▼ plus a word. The safeguard rows are plain sentences — Eric read the
 * previous version as "configuration options", so nothing here is boxed or pill-shaped.
 */

/** −1…+1 → 0…100 (% across the line). The scorer is bounded to ±1; the clamp only guards drift. */
function at(score: number): number {
  return ((Math.max(-1, Math.min(1, score)) + 1) / 2) * 100;
}

/** A score as the line labels it: `−0.70`, `+0.70`, with a true minus sign. */
function score(value: number): string {
  if (value === 0) return "0";
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}`;
}

/** A momentum fraction as a price move: `0.003` → `+0.30%`, `0` → `0%`. */
function move(fraction: number): string {
  if (fraction === 0) return "0%";
  return `${fraction > 0 ? "+" : "−"}${Math.abs(fraction * 100).toFixed(2)}%`;
}

/** Marks closer than this (% of the line) stack into the next row — ~22px at 390px wide. */
const MARK_GAP_PCT = 7;
/** Past this many rows a mark overlaps rather than growing the figure without bound; a denser
 *  view is a later round on #5177 ("too many marks for the space"). */
const MAX_MARK_ROWS = 5;

interface PlacedMark {
  readonly marker: ThesisMarker;
  readonly left: number;
  readonly row: number;
}

function placeMarks(marks: readonly ThesisMarker[]): PlacedMark[] {
  const rowEnds: number[] = [];
  return [...marks]
    .map((marker) => ({ marker, left: at(marker.sentiment ?? 0) }))
    .sort((a, b) => a.left - b.left)
    .map(({ marker, left }) => {
      let row = rowEnds.findIndex((end) => left - end >= MARK_GAP_PCT);
      if (row === -1) row = rowEnds.length < MAX_MARK_ROWS ? rowEnds.length : 0;
      rowEnds[row] = left;
      return { marker, left, row };
    });
}

function tradeList(marks: readonly ThesisMarker[]): string {
  return marks.map((m) => `${m.n} ${m.symbol}`).join(" · ");
}

function RuleLine({
  play,
  marks,
}: {
  readonly play: ThesisPlay;
  readonly marks: readonly ThesisMarker[];
}): ReactElement {
  const buyEdge = at(play.buyAtOrBelow);
  const sellEdge = at(play.sellAtOrAbove);
  const drawn = marks.filter((m) => m.sentiment !== undefined);
  const unplaced = marks.filter((m) => m.sentiment === undefined);
  const placed = placeMarks(drawn);
  const rows = placed.reduce((most, p) => Math.max(most, p.row + 1), 0);
  const bought = marks.filter((m) => m.side === "buy");
  const sold = marks.filter((m) => m.side === "sell");
  const pos = (left: number): CSSProperties => ({ left: `${left}%` });
  return (
    <figure className="thesis-play-figure">
      <div className="thesis-play-scale" aria-hidden="true">
        <span className="thesis-play-tick thesis-play-tick-start">−1</span>
        <span className="thesis-play-tick" style={pos(buyEdge)}>
          {score(play.buyAtOrBelow)}
        </span>
        <span className="thesis-play-tick thesis-play-tick-title" style={pos(50)}>
          News sentiment
        </span>
        <span className="thesis-play-tick" style={pos(sellEdge)}>
          {score(play.sellAtOrAbove)}
        </span>
        <span className="thesis-play-tick thesis-play-tick-end">+1</span>
      </div>
      {placed.length > 0 ? (
        <ol
          className="thesis-play-marks"
          style={{ height: `${rows * 22}px` }}
          aria-label="Its trades, placed at the news score each decision read"
        >
          {placed.map(({ marker, left, row }) => (
            <li
              key={marker.activityAnchor}
              className={`thesis-play-mark thesis-play-mark-${marker.side}`}
              style={{ left: `${left}%`, bottom: `${row * 22}px` }}
              aria-label={`Trade ${marker.n}: ${marker.side === "buy" ? "bought" : "sold"} ${marker.symbol} at a news score of ${score(marker.sentiment ?? 0)}`}
            >
              <span aria-hidden="true">{marker.n}</span>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="thesis-play-track">
        <span
          className="thesis-play-zone thesis-play-zone-buy"
          style={{ left: 0, width: `${buyEdge}%` }}
        >
          <span className="visually-hidden">Buy zone</span>
        </span>
        <span
          className="thesis-play-zone thesis-play-zone-wait"
          style={{ left: `${buyEdge}%`, width: `${sellEdge - buyEdge}%` }}
        >
          Waits
        </span>
        <span
          className="thesis-play-zone thesis-play-zone-sell"
          style={{ left: `${sellEdge}%`, width: `${100 - sellEdge}%` }}
        >
          <span className="visually-hidden">Sell zone</span>
        </span>
      </div>
      <div className="thesis-play-ends">
        {/* The value rides with its glyph, unbroken, so 390px wraps between words, never "≥ / 0%". */}
        <span>
          <span aria-hidden="true">▲ </span>Buy once momentum{" "}
          <span className="thesis-play-end-value">≥ {move(play.buyMomentumAtLeast)}</span>
        </span>
        <span className="thesis-play-end-sell">
          Sell all once momentum{" "}
          <span className="thesis-play-end-value">
            ≤ {move(play.sellMomentumAtMost)}
            <span aria-hidden="true"> ▼</span>
          </span>
        </span>
      </div>
      <figcaption className="thesis-play-trades">
        {marks.length === 0 ? (
          <p>No trades from this play yet.</p>
        ) : (
          <>
            <p>
              <span aria-hidden="true">▲ </span>Bought:{" "}
              {bought.length > 0 ? tradeList(bought) : "none yet"}
            </p>
            <p>
              Sold: {sold.length > 0 ? tradeList(sold) : "none yet"}
              <span aria-hidden="true"> ▼</span>
            </p>
            {unplaced.length > 0 ? (
              <p className="note">
                {unplaced.length === 1 ? "Trade" : "Trades"} {unplaced.map((m) => m.n).join(", ")}:
                no news score was recorded on{" "}
                {unplaced.length === 1 ? "its decision" : "their decisions"}, so{" "}
                {unplaced.length === 1 ? "it isn't" : "they aren't"} on the line.
              </p>
            ) : null}
          </>
        )}
      </figcaption>
    </figure>
  );
}

/** "(bad-news words outweighed good)" — what a negative average means for this word-count scorer. */
function tone(sentiment: number): string {
  if (sentiment < 0) return " (bad-news words outweighed good)";
  if (sentiment > 0) return " (good-news words outweighed bad)";
  return "";
}

/** This play's latest buy, in one sentence built from what its decision recorded. */
export function walkThrough(play: ThesisPlay, marks: readonly ThesisMarker[]): string {
  const buy = [...marks].reverse().find((m) => m.side === "buy");
  if (!buy) return "This play hasn't bought anything yet, so there's no trade to walk through.";
  const head = `Trade ${buy.n}, ${buy.symbol}`;
  if (buy.sentiment === undefined || buy.momentum === undefined) {
    return `${head}: its decision didn't record the news score and price move it read, so it can't be walked through.`;
  }
  const stories = play.windows
    ? `its last ${play.windows.sentiment} news stories`
    : "its recent news stories";
  const ticks = play.windows
    ? `its last ${play.windows.momentum} price ticks`
    : "its recent price ticks";
  return (
    `${head}: ${stories} averaged ${score(buy.sentiment)}${tone(buy.sentiment)}, at or below its ` +
    `${score(play.buyAtOrBelow)} line; then the price moved ${move(buy.momentum)} over ${ticks} ` +
    `(it needs ${move(play.buyMomentumAtLeast)} or more) → it bought.`
  );
}

function PlaySafeguards({
  entry,
  asOf,
}: {
  readonly entry: SafeguardLadderEntry | undefined;
  readonly asOf: string | undefined;
}): ReactElement {
  const stamp = ladderStamp(asOf);
  return (
    <section className="thesis-play-guards">
      <h4 className="thesis-play-subhead">
        What protects this play
        {stamp ? <span className="thesis-ladder-asof"> · as of {stamp}</span> : null}
      </h4>
      {entry?.stages ? (
        <ul className="thesis-play-guard-list">
          {entry.stages.map((stage) => (
            <li key={stage.stage}>
              <p className="thesis-play-guard-name">
                {stage.name}:{" "}
                <span className="thesis-play-guard-state">
                  <span aria-hidden="true">{SAFEGUARD_STATE_GLYPH[stage.state]} </span>
                  {SAFEGUARD_STATE_LABEL[stage.state]}
                </span>
              </p>
              <p className="thesis-play-guard-does">{stage.does}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="note">This play's safeguards can't be read here.</p>
      )}
    </section>
  );
}

export function ThesisPlayBlock({
  play,
  markers,
  ladderEntry,
  asOf,
}: {
  readonly play: ThesisPlay;
  readonly markers: readonly ThesisMarker[];
  readonly ladderEntry: SafeguardLadderEntry | undefined;
  /** When the pass the safeguards were read from ran (`ladderAsOf`). */
  readonly asOf: string | undefined;
}): ReactElement {
  // The research build's trades were not made by this rule, so they are named, never drawn.
  const research = new Set(play.researchTrades);
  const ours = markers.filter((m) => m.playbookId === play.playbookId);
  const marks = ours.filter((m) => !research.has(m.n));
  const skipped = ours.filter((m) => research.has(m.n)).map((m) => m.n);
  return (
    <section className="thesis-play">
      <h3 className="thesis-play-name">{play.name}</h3>
      {play.researchBuild ? (
        <p className="note">
          This play's latest trade came from the bot's faster research build, whose thresholds and
          exits differ from the standard rule — so the standard line isn't drawn over its trades.
        </p>
      ) : (
        <>
          <RuleLine play={play} marks={marks} />
          {skipped.length > 0 ? (
            <p className="note">
              {skipped.length === 1 ? "Trade" : "Trades"} {skipped.join(", ")} came from the bot's
              faster research build, whose thresholds and exits differ, so{" "}
              {skipped.length === 1 ? "it isn't" : "they aren't"} on this line.
            </p>
          ) : null}
          <p className="thesis-play-walk">{walkThrough(play, marks)}</p>
        </>
      )}
      <PlaySafeguards entry={ladderEntry} asOf={asOf} />
    </section>
  );
}
