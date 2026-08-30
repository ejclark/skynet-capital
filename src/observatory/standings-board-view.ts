import type { FieldTone } from "../universe/world-patch.js";
import type { DashboardData } from "./dashboard-data.js";
import {
  participantInvested,
  participantReturnPct,
  participantUnrealized,
} from "./participant-card.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { formatCurrency, formatSigned, pct, plClass } from "./render-atoms.js";
import { cohortStats } from "./standings-cohort.js";
import type { LeaderMetric } from "./standings-metric.js";
import {
  cohortView,
  matchView,
  rowViews,
  type TextMap,
  type ToneMap,
  versusView,
} from "./standings-patch.js";

/**
 * THE BOARD AS DATA — the JSON views `/api/board` serves the React shell.
 *
 * Split from standings-patch.ts when the compare view pushed that file past the size cap: the
 * patch module owns "what changed between two snapshots", this one owns "the whole board, as a
 * client renders it from scratch". Both build on the same view-model helpers, so a value can
 * never mean one thing in a snapshot and another in the op that later moves it.
 */

/** Union of both sides' holdings, heaviest combined value first — shared with the HTML compare
 *  (standings-view.ts) so the union-and-sort rule exists exactly once. */
export function holdingsUnion(
  a: ParticipantSnapshot,
  b: ParticipantSnapshot,
): ReadonlyArray<{ symbol: string; aValue?: number; bValue?: number }> {
  const byA = new Map(a.positions.map((p) => [p.symbol, p.marketValue]));
  const byB = new Map(b.positions.map((p) => [p.symbol, p.marketValue]));
  const symbols = [...new Set([...byA.keys(), ...byB.keys()])].sort(
    (x, y) => (byA.get(y) ?? 0) + (byB.get(y) ?? 0) - ((byA.get(x) ?? 0) + (byB.get(x) ?? 0)),
  );
  return symbols.map((symbol) => {
    const av = byA.get(symbol);
    const bv = byB.get(symbol);
    return {
      symbol,
      ...(av === undefined ? {} : { aValue: av }),
      ...(bv === undefined ? {} : { bValue: bv }),
    };
  });
}

/** One field-ladder row as the JSON API serves it — the same formatted value/tone/bar the patch
 *  ops carry, plus the identity fields a client needs to render a row from scratch. */
interface BoardViewRow {
  readonly key: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly value: string;
  readonly tone: FieldTone;
  readonly bar: number;
  readonly sortValue: number;
}

/** One keyed display block (cohort card / match bar / versus line), same shape as a `field` op. */
interface BoardViewBlock {
  readonly text: TextMap;
  readonly tone?: ToneMap;
  readonly bar?: Record<string, number>;
}

export interface StandingsBoardView {
  readonly rows: readonly BoardViewRow[];
  readonly blocks: Readonly<Record<string, BoardViewBlock>>;
}

/**
 * The initial JSON snapshot for a patch-consuming client (`/api/board`). Every value is formatted
 * by the SAME helpers `standingsFieldOps` uses, and the blocks carry the SAME keys the `field` ops
 * address — so a client renders this once and then applies ops verbatim, never re-deriving a
 * number (the doctrine at the top of this file, extended over JSON).
 */
export function standingsBoardView(data: DashboardData, metric: LeaderMetric): StandingsBoardView {
  const byId = new Map(data.participants.map((p) => [p.id, p]));
  const humans = cohortStats(data.participants, "human", "Humans");
  const bots = cohortStats(data.participants, "bot", "Bots");
  return {
    rows: rowViews(data, metric).map((row) => ({
      ...row,
      name: byId.get(row.key)?.displayName ?? row.key,
      kind: byId.get(row.key)?.kind === "bot" ? "bot" : "human",
    })),
    blocks: {
      "cohort:human": cohortView(humans),
      "cohort:bot": cohortView(bots),
      match: matchView(humans, bots),
      versus: { text: versusView(humans, bots) },
    },
  };
}

/** One side of a head-to-head, formatted. Mirrors `compareColumn` in standings-view.ts. */
interface CompareSide {
  readonly key: string;
  readonly name: string;
  readonly kind: "human" | "bot";
  readonly equity: string;
  readonly cash: string;
  readonly invested: string;
  readonly unrealized: string;
  readonly unrealizedTone: FieldTone;
  readonly returnPct: string;
  readonly returnTone: FieldTone;
}

/** A signed delta between the sides. Mirrors `deltaRow`: lead names WHO leads, never a placing. */
interface CompareDelta {
  readonly label: string;
  readonly lead: "a" | "b" | "tie";
  readonly amount: string;
}

/** One row of the holdings union — shared symbols carry both values. Mirrors `holdingsCompare`. */
interface CompareHolding {
  readonly symbol: string;
  readonly aValue?: string;
  readonly bValue?: string;
  readonly shared: boolean;
  readonly heavier: "a" | "b" | "even";
}

export interface StandingsCompareView {
  readonly a: CompareSide;
  readonly b: CompareSide;
  readonly deltas: readonly CompareDelta[];
  readonly holdings: readonly CompareHolding[];
}

function compareSide(snapshot: ParticipantSnapshot): CompareSide {
  const pl = participantUnrealized(snapshot);
  const returned = participantReturnPct(snapshot);
  return {
    key: snapshot.id,
    name: snapshot.displayName,
    kind: snapshot.kind === "bot" ? "bot" : "human",
    equity: formatCurrency(snapshot.equity),
    cash: formatCurrency(snapshot.cash),
    invested: formatCurrency(participantInvested(snapshot)),
    unrealized: formatSigned(pl),
    unrealizedTone: plClass(pl),
    returnPct: pct(returned),
    returnTone: plClass(returned),
  };
}

function compareDelta(
  label: string,
  aVal: number,
  bVal: number,
  fmt: (n: number) => string,
): CompareDelta {
  const d = aVal - bVal;
  return { label, lead: d === 0 ? "tie" : d > 0 ? "a" : "b", amount: fmt(Math.abs(d)) };
}

/**
 * The head-to-head as data (`/api/board?a=&b=`) — the JSON twin of `headToHead` in
 * standings-view.ts, same helpers, same union-and-sort rule for the holdings overlap.
 */
export function standingsCompareView(
  a: ParticipantSnapshot,
  b: ParticipantSnapshot,
): StandingsCompareView {
  return {
    a: compareSide(a),
    b: compareSide(b),
    deltas: [
      compareDelta("Equity", a.equity, b.equity, formatCurrency),
      compareDelta("Unrealized", participantUnrealized(a), participantUnrealized(b), formatSigned),
      compareDelta("Return", participantReturnPct(a), participantReturnPct(b), pct),
    ],
    holdings: holdingsUnion(a, b).map(({ symbol, aValue: av, bValue: bv }) => ({
      symbol,
      ...(av === undefined ? {} : { aValue: formatCurrency(av) }),
      ...(bv === undefined ? {} : { bValue: formatCurrency(bv) }),
      shared: av !== undefined && bv !== undefined,
      heavier: (av ?? 0) === (bv ?? 0) ? "even" : (av ?? 0) > (bv ?? 0) ? "a" : "b",
    })),
  };
}
