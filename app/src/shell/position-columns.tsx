import type { ReactElement } from "react";
import type { DeskPosition, PositionEvent } from "../live/desk";
import { GlossaryTerm } from "./glossary-term";
import { greeksParts, type HoldingDecay } from "./holding-decay";
import {
  dayChange,
  GreeksLine,
  held,
  isWritten,
  PositionHead,
  PositionSize,
  ROW_KEY,
  withMinus,
} from "./position-row-spec";

/**
 * THE DESK TABLE'S RANKED COLUMNS (#5071; round 2 of #5037, Q2 R2 — Eric's Build A: "ranked
 * columns, the rest opens in the row, no sideways scroll"). Beside the tower the stage is ~806px,
 * and six columns fit it: Position 236 · θ · Δ 150 · Value 118 · P/L 118 · Model projects 140 ·
 * open 44. The column set follows the TABLE'S OWN WIDTH, never the window
 * (`positions-columns.css`, a container query on `.blotter-scroll`): Moneypenny's rail or the
 * tower takes room the window doesn't know about. Narrower, Model projects and then θ · Δ step
 * into the opened row; wider, Next event and then Best / worst join as columns. Everything else
 * (cost, expiry, the buys, Close) opens in the row (`position-row-open.tsx`).
 *
 * The cells are the phone card's row spec (`position-row-spec.tsx`) laid out as two-line pairs:
 * value over today, P/L over return (More B, 8f2c2da8), headed by the same one-word key the phone
 * card carries (#5076, `ROW_KEY`).
 * @category trading
 */

/** Left to right. `open` is the row's disclosure; the four optional ones come and go by width. */
export const POS_COLUMNS = [
  "pos",
  "greeks",
  "value",
  "pl",
  "model",
  "event",
  "best",
  "open",
] as const;
export type PosColumn = (typeof POS_COLUMNS)[number];

/** A full-width row under a position (its guidance line, its opened row) spans every column. */
export const POS_SPAN = POS_COLUMNS.length;

export const colClass = (key: PosColumn) => `pos-col-${key}`;

/** A two-line header: one word over another, as the cells under it stack their two figures. */
function Pair({ top, under }: { readonly top: string; readonly under: string }): ReactElement {
  return (
    <>
      <span className="pos-th-word">{top}</span>
      <span className="visually-hidden">,</span>{" "}
      <span className="pos-th-word pos-th-under">{under}</span>
    </>
  );
}

export function PositionsHeaderRow(): ReactElement {
  return (
    <tr>
      <th className={colClass("pos")}>Position</th>
      <th className={colClass("greeks")}>
        <span className="pos-cell">
          <GlossaryTerm term="timeDecay">θ</GlossaryTerm>
          <span aria-hidden="true"> · </span>
          <GlossaryTerm term="delta">Δ</GlossaryTerm>
        </span>
      </th>
      <th className={`num ${colClass("value")}`}>
        <Pair top={ROW_KEY.value} under={ROW_KEY.today} />
      </th>
      <th className={`num ${colClass("pl")}`}>
        <Pair top={ROW_KEY.pl} under={ROW_KEY.ret} />
      </th>
      <th className={`num ${colClass("model")}`}>
        <span className="pos-cell">
          <GlossaryTerm term="projection" />
        </span>
      </th>
      <th className={colClass("event")}>
        <span className="pos-cell">Next event</span>
      </th>
      <th className={`num ${colClass("best")}`}>
        <span className="pos-cell">
          <GlossaryTerm term="bestWorst" />
        </span>
      </th>
      <th className={colClass("open")} aria-label="Row detail" />
    </tr>
  );
}

/** "NVDA · $232.10" over "130 shares (breakeven $223.98)": the phone card's left side. */
export function PositionCell({ position }: { readonly position: DeskPosition }): ReactElement {
  return (
    <td className={colClass("pos")}>
      <PositionHead p={position} /> <PositionSize p={position} />
    </td>
  );
}

/** What time and a $1 move in the stock do to the holding, one per line. A share has no time
 *  decay and moves a dollar a share; an option the feed didn't quote reads "—". */
export function GreeksContent({
  position,
  decay,
  delta,
}: {
  readonly position: DeskPosition;
  readonly decay?: HoldingDecay;
  readonly delta?: number;
}): ReactElement {
  if (!position.isOption) {
    const { count, short } = held(position.quantity);
    const move = greeksParts(undefined, short ? -count : count).delta;
    return (
      <span className="pos-card-greeks">
        <span className="pos-greek muted">no time decay</span>
        {move ? (
          <>
            <span className="visually-hidden">,</span>{" "}
            <span className="pos-greek">
              Δ <span className="pos-card-greek-fig num">{move}</span> per $1
            </span>
          </>
        ) : null}
      </span>
    );
  }
  const parts = greeksParts(decay, delta);
  return parts.theta || parts.delta ? <GreeksLine {...parts} /> : <span className="muted">—</span>;
}

/** The value, and today's change under it: "−$550" over "−$60 today". */
export function ValueCell({ position }: { readonly position: DeskPosition }): ReactElement {
  const day = dayChange(position);
  return (
    <td className={`num ${colClass("value")}`}>
      <span className="pos-fig">{withMinus(position.value)}</span>{" "}
      <span className={`pos-fig-under tone-${day.tone}`}>
        {day.text ? `${day.text} today` : "no change today"}
      </span>
    </td>
  );
}

/** The P/L, the boldest figure on the row, and its return under it. A sold option's return is on
 *  the premium it collected, said with the premium: "−116% of $255". */
export function PlCell({ position }: { readonly position: DeskPosition }): ReactElement {
  const premium = isWritten(position) ? position.costBasis.replace(/^-/, "") : undefined;
  return (
    <td className={`num ${colClass("pl")} tone-${position.totalTone}`}>
      <b className="pos-fig pos-fig--pl">{withMinus(position.totalPl)}</b>{" "}
      {position.returnPct === "—" ? null : (
        <span className="pos-fig-under">
          {withMinus(position.returnPct)}
          {premium ? ` of ${premium}` : ""}
        </span>
      )}
    </td>
  );
}

/** Model projects (#4952 supplies it): a dash until the guidance model has a projection for the
 *  position, never a made-up figure. When it lands it is drawn as a projection, not a fact. */
export function ProjectionContent(): ReactElement {
  return (
    <>
      <span className="muted" aria-hidden="true">
        —
      </span>
      <span className="visually-hidden">no projection yet</span>
    </>
  );
}

/** "Earnings Oct 28" (the date glued so a wrap never splits "Oct / 28"), with "before expiry" said
 *  in words beneath when it lands while the option is alive (never a colour alone). A market-wide
 *  print reads muted: it moves everything. */
export function EventContent({ event }: { readonly event?: PositionEvent }): ReactElement {
  if (!event) return <span className="muted">—</span>;
  const own = event.scope === "stock";
  return (
    <>
      <span className={own ? "next-event-label" : "next-event-label muted"}>
        {event.label.replace(/ (\w{3}) (\d{1,2})$/, " $1 $2")}
      </span>
      {own && event.beforeExpiry ? <span className="next-event-when">before expiry</span> : null}
    </>
  );
}

/** Best over worst, held to expiry; the sign and the word ("unlimited") carry which is which. */
export function BestWorstContent({ position }: { readonly position: DeskPosition }): ReactElement {
  const { best, worst } = position;
  if (!(best && worst)) return <span className="muted">—</span>;
  return (
    <span className="best-worst">
      <span className={best === "unlimited" ? "muted" : "tone-pos"}>{best}</span>
      <span className={worst === "unlimited" ? "muted" : "tone-neg"}>{worst}</span>
    </span>
  );
}
