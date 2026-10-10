import { useEffect, useMemo, useState } from "react";
import type { DeskPosition } from "../live/desk";
import { type AsideEntry, asideFor, asideHolds, readAside, writeAside } from "../live/mark-aside";
import type { OptionPositions } from "../live/options";
import { type MarkKind, markOf, type PositionMark } from "../live/position-mark";

/** One row's mark, and the Not now holding it aside, if one does. */
export interface RowMark {
  readonly mark: PositionMark;
  readonly aside?: AsideEntry;
}

/** The mark a row shows: none while Not now holds it aside. */
export const shownKind = (row: RowMark | undefined): MarkKind | undefined =>
  row && !row.aside ? row.mark.kind : undefined;

/** "Worth a look first": Review, then Consider, then everything else (a set-aside mark included). */
const LOOK_RANK: Readonly<Record<MarkKind, number>> = { review: 0, consider: 1, onplan: 2 };
export const lookRank = (row: RowMark | undefined): number => {
  const kind = shownKind(row);
  return kind ? LOOK_RANK[kind] : LOOK_RANK.onplan;
};

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
    const entry = entries.find((e) => e.symbol === p.symbol);
    rows.set(
      p.symbol,
      entry && asideHolds(entry, mark, now, spot) ? { mark, aside: entry } : { mark },
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
