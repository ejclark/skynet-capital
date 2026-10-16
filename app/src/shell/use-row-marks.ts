import { useEffect, useMemo, useState } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { Decision, DeskPosition } from "../live/desk";
import { type AsideEntry, asideFor, asideHolds, readAside, writeAside } from "../live/mark-aside";
import type { OptionPositions } from "../live/options";
import { type MarkKind, markOf, type PositionMark, pastLine } from "../live/position-mark";

/** One row's mark, and the Not now holding it aside, if one does. */
export interface RowMark {
  readonly mark: PositionMark;
  readonly aside?: AsideEntry;
  /** How far past its line the position sits, in percent (`pastLine`): the order inside a mark. */
  readonly past: number;
}

/** The mark a row shows: none while Not now holds it aside. */
export const shownKind = (row: RowMark | undefined): MarkKind | undefined =>
  row && !row.aside ? row.mark.kind : undefined;

/** "Worth a look first": Review, then Consider, then On plan, and a mark Not now set aside last —
 *  it stepped out of the way, so the fact's urgency never pulls it back up. */
const LOOK_RANK: Readonly<Record<MarkKind | "aside", number>> = {
  review: 0,
  consider: 1,
  onplan: 2,
  aside: 3,
};

/** One row as the look sort weighs it. */
export interface LookItem {
  readonly p: DeskPosition;
  readonly row: RowMark | undefined;
  /** Its place in the server's order. */
  readonly i: number;
}

const rankOf = (x: LookItem) => LOOK_RANK[x.row?.aside ? "aside" : (x.row?.mark.kind ?? "onplan")];
const clockOf = (x: LookItem) =>
  x.p.isOption && x.p.expiresInDays !== undefined && !x.row?.aside
    ? x.p.expiresInDays
    : Number.POSITIVE_INFINITY;
const pastOf = (x: LookItem) => (x.row && !x.row.aside ? x.row.past : 0);

/**
 * The look sort's order (#5083): the mark first, then inside it the fact's urgency — an option's
 * expiry, soonest first, ahead of shares, which have no clock — then how far past its line, then
 * the server's order (largest first), which `i` carries.
 */
export function lookOrder(a: LookItem, b: LookItem): number {
  const [ca, cb] = [clockOf(a), clockOf(b)];
  return (
    rankOf(a) - rankOf(b) ||
    (ca === cb ? 0 : ca < cb ? -1 : 1) ||
    pastOf(b) - pastOf(a) ||
    a.i - b.i
  );
}

/**
 * Which row each decision card speaks on (#5083): a card on a holding, on that holding's row; a
 * playbook idea, on the row of the name it fits — the shares when the account holds them, else the
 * first contract on that stock. The pager that carried them retired with #5070, taking their
 * lessons ("What is IV crush?") with it; the sentence and the lesson now open with the row's
 * guidance. A card on nothing the list holds stays on the Map lens alone.
 */
export function decisionsByRow(
  positions: readonly DeskPosition[],
  decisions: readonly Decision[],
): ReadonlyMap<string, readonly Decision[]> {
  const stockOf = (p: DeskPosition) => parseOccSymbol(p.symbol)?.underlying ?? p.symbol;
  const out = new Map<string, Decision[]>();
  for (const d of decisions) {
    const row =
      d.kind === "idea"
        ? (positions.find((p) => p.symbol === d.symbol) ??
          positions.find((p) => stockOf(p) === d.symbol))
        : positions.find((p) => p.symbol === d.symbol);
    if (row) out.set(row.symbol, [...(out.get(row.symbol) ?? []), d]);
  }
  return out;
}

/**
 * Every row's fact badge (#5070) plus this viewer's Not now on it, for one account. A sold
 * option's mark reads its stock's price off the option book the blotter already holds (the same
 * read as the Money strip and Trade's option card), so it never asks for a second one. The clock is
 * read per render: a mark set aside until Friday's close is back on the first render after it.
 */
export function useRowMarks(
  deskId: string,
  positions: readonly DeskPosition[],
  book: OptionPositions | undefined,
): {
  readonly rows: ReadonlyMap<string, RowMark>;
  readonly setAside: (symbol: string) => void;
  readonly undo: (symbol: string) => void;
} {
  const [entries, setEntries] = useState<readonly AsideEntry[]>(() => readAside(deskId));
  // Another account's page reuses this component: read its own entries, never carry these over.
  useEffect(() => setEntries(readAside(deskId)), [deskId]);

  const spots = useMemo(() => {
    const out = new Map<string, number>();
    if (book?.available)
      for (const r of book.rows) if (r.spot !== undefined) out.set(r.symbol, r.spot);
    return out;
  }, [book]);

  const now = new Date();
  const rows = new Map<string, RowMark>();
  for (const p of positions) {
    const spot = spots.get(p.symbol);
    const mark = markOf(p, spot);
    const past = pastLine(p, mark, spot);
    const entry = entries.find((e) => e.symbol === p.symbol);
    rows.set(
      p.symbol,
      entry && asideHolds(entry, mark, now, spot) ? { mark, aside: entry, past } : { mark, past },
    );
  }

  const keep = (next: readonly AsideEntry[]) => {
    setEntries(next);
    writeAside(deskId, next);
  };
  // Writes drop entries that no longer hold, so storage never grows past the book.
  const live = () =>
    entries.filter((e) => {
      const row = rows.get(e.symbol);
      return row?.aside === e;
    });
  return {
    rows,
    setAside: (symbol) => {
      const row = rows.get(symbol);
      if (!row) return;
      keep([...live().filter((e) => e.symbol !== symbol), asideFor(symbol, row.mark, new Date())]);
    },
    undo: (symbol) => keep(live().filter((e) => e.symbol !== symbol)),
  };
}
