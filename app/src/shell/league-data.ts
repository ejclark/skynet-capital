import type { BoardMetric, BoardRow } from "../live/board";

/**
 * The league card's reading of the board (#3689 slice 4): the top of the field, every row the
 * viewer owns (a member can own several entries: themselves plus their bots), and the one gap
 * that matters, meaning how far the viewer is from the entry just above them.
 *
 * The gap is the only figure computed here rather than by the server. It's a subtraction of two
 * values the board already ranks by (`sortValue`), shown in the metric's own unit, so it can't
 * disagree with the ladder beside it.
 */

export interface LeagueLine {
  readonly rank: number;
  readonly row: BoardRow;
  readonly owned: boolean;
}

export interface LeagueReading {
  /** Top N, then (after a gap marker) any owned rows below it, in rank order. */
  readonly top: readonly LeagueLine[];
  readonly below: readonly LeagueLine[];
  /** The viewer's own rank, for the phone's one-line league (#3689 slice 8). */
  readonly meRank?: number;
  /** The sentence under the ladder, or undefined when the viewer isn't on the board. */
  readonly gap?: {
    readonly leading: boolean;
    readonly amount?: string;
    readonly aheadName?: string;
    readonly aheadOwned?: boolean;
  };
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** The gap in the metric's unit: dollars for money metrics, points for the return %. */
export function formatGap(delta: number, metric: BoardMetric): string {
  return metric === "return" ? `${delta.toFixed(1)} pts` : money.format(Math.ceil(delta));
}

export function readLeague(
  rows: readonly BoardRow[],
  ownedIds: readonly string[],
  metric: BoardMetric,
  topN = 5,
  /** Whose gap to report: the viewer's own (human) entry when they have one. */
  meId?: string,
): LeagueReading {
  const ranked = [...rows]
    .sort((a, b) => b.sortValue - a.sortValue)
    .map((row, i) => ({ rank: i + 1, row, owned: ownedIds.includes(row.key) }));
  const top = ranked.slice(0, topN);
  const below = ranked.slice(topN).filter((l) => l.owned);

  const me = ranked.find((l) => l.row.key === meId) ?? ranked.find((l) => l.owned) ?? undefined;
  if (!me) return { top, below };
  const ahead = ranked[me.rank - 2];
  if (!ahead) return { top, below, meRank: me.rank, gap: { leading: true } };
  return {
    top,
    below,
    meRank: me.rank,
    gap: {
      leading: false,
      amount: formatGap(ahead.row.sortValue - me.row.sortValue, metric),
      aheadName: ahead.row.name,
      aheadOwned: ahead.owned,
    },
  };
}
