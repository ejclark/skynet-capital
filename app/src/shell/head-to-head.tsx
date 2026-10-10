import type { ReactElement, Ref } from "react";
import type { BoardCompare, CompareDelta, CompareSide, FieldTone } from "../live/board";

/**
 * THE HEAD-TO-HEAD, SIDE BY SIDE (#5057; Eric's pick on #5037 question 8, 2026-10-10: "side by
 * side comparisons are way easier to understand and cross examine at the line item level than top
 * vs bottom"). Two accounts from the Leaderboard, one table: each account a column, one row per
 * line item with its label between the two values, the tale-of-the-tape layout. On a phone the
 * old pane stacked A's card over the deltas over B's card, so cash sat a card's height from cash.
 *
 * The leader on a line is marked three ways and never by colour alone (a standing reader is
 * red/green colourblind, CLAUDE.md): the word "leads" on the leader's value, its weight, and a
 * ◀/▶ under the label pointing at it. A tie says "even". Only the lines the server ranks carry a
 * lead (`standingsCompareView`'s deltas): cash and invested are context, not a race. Every figure
 * is the server's own string.
 */

export interface HeadToHeadLine {
  readonly label: string;
  readonly a: { readonly text: string; readonly tone: FieldTone };
  readonly b: { readonly text: string; readonly tone: FieldTone };
  /** Who leads on this line and by how much — only where the server ranked it. */
  readonly lead?: Pick<CompareDelta, "lead" | "amount">;
}

/** The line items in the order a phone shows them: the headline race, the P/L, then the context. */
const LINES: ReadonlyArray<
  readonly [label: string, text: (s: CompareSide) => string, tone: (s: CompareSide) => FieldTone]
> = [
  ["Equity", (s) => s.equity, () => "flat"],
  ["Return", (s) => s.returnPct, (s) => s.returnTone],
  ["Unrealized", (s) => s.unrealized, (s) => s.unrealizedTone],
  ["Realized", (s) => s.realized, (s) => s.realizedTone],
  ["Cash", (s) => s.cash, () => "flat"],
  ["Invested", (s) => s.invested, () => "flat"],
];

export function headToHeadLines(compare: BoardCompare): HeadToHeadLine[] {
  return LINES.map(([label, text, tone]) => {
    const delta = compare.deltas.find((d) => d.label === label);
    return {
      label,
      a: { text: text(compare.a), tone: tone(compare.a) },
      b: { text: text(compare.b), tone: tone(compare.b) },
      ...(delta ? { lead: { lead: delta.lead, amount: delta.amount } } : {}),
    };
  });
}

function Value({
  side,
  line,
}: {
  readonly side: "a" | "b";
  readonly line: HeadToHeadLine;
}): ReactElement {
  const leads = line.lead?.lead === side;
  return (
    <td className={`h2h-${side} num${leads ? " h2h-leader" : ""}`}>
      <span className={`h2h-val tone-${line[side].tone}`}>{line[side].text}</span>
      {leads ? <span className="h2h-leads">leads</span> : null}
    </td>
  );
}

/** The label between the two values, and — on a ranked line — the gap, pointing at the leader. */
function Label({
  line,
  names,
}: {
  readonly line: HeadToHeadLine;
  readonly names: { readonly a: string; readonly b: string };
}): ReactElement {
  const lead = line.lead;
  return (
    <th scope="row" className="h2h-mid">
      <span className="h2h-label">{line.label}</span>
      {lead === undefined ? null : lead.lead === "tie" ? (
        <span className="h2h-gap">
          <span aria-hidden="true">= </span>even
        </span>
      ) : (
        <span className="h2h-gap num">
          <span aria-hidden="true">{lead.lead === "a" ? "◀" : "▶"} </span>
          <span className="visually-hidden">{names[lead.lead]} leads by </span>
          {lead.amount}
        </span>
      )}
    </th>
  );
}

function Who({ side }: { readonly side: CompareSide }): ReactElement {
  return (
    <>
      <span className="h2h-name">{side.name}</span>{" "}
      <span className={`chip chip-${side.kind}`}>{side.kind === "bot" ? "BOT" : "HUMAN"}</span>
    </>
  );
}

function Holdings({ compare }: { readonly compare: BoardCompare }): ReactElement {
  return (
    <tbody className="h2h-holdings">
      <tr>
        <th scope="colgroup" colSpan={3} className="h2h-section">
          Holdings overlap
        </th>
      </tr>
      {compare.holdings.length === 0 ? (
        <tr>
          <td colSpan={3} className="note">
            Neither holds an open position yet.
          </td>
        </tr>
      ) : (
        compare.holdings.map((h) => (
          <tr key={h.symbol}>
            <td className="h2h-a num">{h.aValue ?? "·"}</td>
            <th scope="row" className="h2h-mid h2h-sym">
              {h.symbol}
              {h.shared ? <span className="cmp-tag">SHARED</span> : null}
            </th>
            <td className="h2h-b num">{h.bValue ?? "·"}</td>
          </tr>
        ))
      )}
    </tbody>
  );
}

export function HeadToHead({
  compare,
  onClear,
  headingRef,
}: {
  readonly compare: BoardCompare;
  readonly onClear: () => void;
  /** The heading the view moves to when a pair completes (`compare-place.ts`), focusable for it. */
  readonly headingRef?: Ref<HTMLHeadingElement>;
}): ReactElement {
  const names = { a: compare.a.name, b: compare.b.name };
  return (
    <section className="cmp" aria-label={`${names.a} versus ${names.b}`}>
      <header className="cmp-head">
        <h2 tabIndex={-1} ref={headingRef}>
          Head to head
        </h2>
        <button type="button" className="cmp-clear" onClick={onClear}>
          <span aria-hidden="true">× </span>Clear
        </button>
      </header>
      <table className="h2h">
        <caption className="visually-hidden">
          {names.a} versus {names.b}, line by line
        </caption>
        <colgroup>
          <col className="h2h-side" />
          <col className="h2h-midcol" />
          <col className="h2h-side" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="h2h-a">
              <Who side={compare.a} />
            </th>
            <th scope="col" className="h2h-mid h2h-vs">
              vs
            </th>
            <th scope="col" className="h2h-b">
              <Who side={compare.b} />
            </th>
          </tr>
        </thead>
        <tbody>
          {headToHeadLines(compare).map((line) => (
            <tr key={line.label} data-lead={line.lead?.lead}>
              <Value side="a" line={line} />
              <Label line={line} names={names} />
              <Value side="b" line={line} />
            </tr>
          ))}
        </tbody>
        <Holdings compare={compare} />
      </table>
    </section>
  );
}
