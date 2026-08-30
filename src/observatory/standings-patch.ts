import type { FieldTone, WorldPatchOp } from "../universe/world-patch.js";
import type { DashboardData } from "./dashboard-data.js";
import { formatCurrency, formatSigned, pct, plClass } from "./render-atoms.js";
import { type CohortStats, cohortStats } from "./standings-cohort.js";
import { formatMetric, type LeaderMetric, metricValue } from "./standings-metric.js";

/**
 * THE STANDINGS FIELD PATCH — what the live board says instead of re-rendering itself.
 *
 * A pure function of (previous dashboard state, next dashboard state) → the ops that move the page
 * from one to the other: a row's value/bar, the two cohort cards, the match bar, the versus
 * read line. Every value is formatted HERE, on the server, by the same helpers the initial render
 * used, so the browser never re-derives a number and the two can't drift.
 *
 * Two things it deliberately refuses to fake:
 *  - **A change it can't express becomes a `reframe`**, not a partial update. The field ladder
 *    gaining or losing a row, the cohort lead flipping (which moves the LEADS badge and the card
 *    order), or a head-to-head compare being on screen all mean the page's STRUCTURE moved; the
 *    honest answer is a fresh frame, never half-patched numbers around stale furniture.
 *  - **Nothing is emitted for a value that did not move.** "Only the changed pieces" is the whole
 *    point; an op per tick per row would be a re-render wearing a patch's clothes.
 */

export interface StandingsPatchOptions {
  readonly metric: LeaderMetric;
  /** `?a=` — when a compare is armed or showing, the view is analytical and keeps full renders. */
  readonly aId?: string;
  readonly bId?: string;
}

export interface RowView {
  readonly key: string;
  readonly value: string;
  readonly tone: FieldTone;
  readonly bar: number;
  readonly sortValue: number;
}

/** Mirrors `fieldLadder` in standings-view.ts — same sort, same widths, same tone rule. No
 *  ordinal: the view no longer renders one, so there is no rank text to patch. */
export function rowViews(data: DashboardData, metric: LeaderMetric): RowView[] {
  const live = data.participants.filter((p) => !p.error);
  const ranked = [...live].sort((a, b) => metricValue(b, metric) - metricValue(a, metric));
  const maxAbs = ranked.reduce((m, p) => Math.max(m, Math.abs(metricValue(p, metric))), 0) || 1;
  return ranked.map((p) => {
    const v = metricValue(p, metric);
    return {
      key: p.id,
      value: formatMetric(v, metric),
      tone: metric === "equity" ? "flat" : plClass(v),
      bar: Math.max(2, (Math.abs(v) / maxAbs) * 100),
      sortValue: v,
    };
  });
}

export type TextMap = Record<string, string>;
export type ToneMap = Record<string, FieldTone>;

/** Mirrors `cohortCard` — the ten numbers one card shows, already formatted. */
export function cohortView(stats: CohortStats): { text: TextMap; tone: ToneMap } {
  return {
    text: {
      count: String(stats.count),
      countUnit: ` account${stats.count === 1 ? "" : "s"}`,
      totalEquity: formatCurrency(stats.totalEquity),
      avgEquity: formatCurrency(stats.avgEquity),
      unrealized: formatSigned(stats.totalUnrealized),
      return: pct(stats.returnPct),
      breadth: `${stats.breadthPct.toFixed(0)}%`,
      spread: `${stats.spread.toFixed(2)}%`,
      // No best performer yet renders as an em dash and an EMPTY figure — never a fabricated 0%.
      bestName: stats.best ? stats.best.name : "—",
      bestPct: stats.best ? pct(stats.best.pct) : "",
    },
    tone: {
      unrealized: plClass(stats.totalUnrealized),
      return: plClass(stats.returnPct),
      bestPct: stats.best ? plClass(stats.best.pct) : "flat",
    },
  };
}

/** Mirrors `matchBar` — the tug-of-war split by AVERAGE equity per account. */
export function matchView(
  humans: CohortStats,
  bots: CohortStats,
): { text: TextMap; bar: Record<string, number> } {
  const sum = humans.avgEquity + bots.avgEquity;
  const humanPct = Math.round((sum > 0 ? humans.avgEquity / sum : 0.5) * 100);
  const botPct = 100 - humanPct;
  const tied = humans.avgEquity === bots.avgEquity;
  const leadsHumans = humans.avgEquity > bots.avgEquity;
  return {
    text: {
      humanLabel: `Humans ${humanPct}%`,
      botLabel: `${botPct}% Bots`,
      readLeader: tied ? "" : leadsHumans ? "Humans" : "Bots",
      readRest: tied
        ? "Dead even — the match is tied"
        : ` lead the match · ${leadsHumans ? humanPct : botPct}% of the field`,
    },
    bar: { human: humanPct, bot: botPct, divider: humanPct },
  };
}

/** Mirrors the `versus-read` line beneath the cards. */
export function versusView(humans: CohortStats, bots: CohortStats): TextMap {
  return {
    totalLeader: humans.totalEquity >= bots.totalEquity ? "Humans" : "Bots",
    totalGap: formatCurrency(Math.abs(humans.totalEquity - bots.totalEquity)),
    avgLeader: humans.avgEquity >= bots.avgEquity ? "Humans" : "Bots",
    avgGap: formatCurrency(Math.abs(humans.avgEquity - bots.avgEquity)),
  };
}

const sameMap = <T>(a: Record<string, T>, b: Record<string, T>): boolean =>
  Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((k) => a[k] === b[k]);

const reframe = (reason: string): WorldPatchOp[] => [{ kind: "reframe", reason }];

/** One op per keyed block whose rendered content actually moved. */
function blockOp(
  key: string,
  before: { text: TextMap; tone?: ToneMap; bar?: Record<string, number> },
  after: { text: TextMap; tone?: ToneMap; bar?: Record<string, number> },
): WorldPatchOp[] {
  const still =
    sameMap(before.text, after.text) &&
    sameMap(before.tone ?? {}, after.tone ?? {}) &&
    sameMap(before.bar ?? {}, after.bar ?? {});
  if (still) return [];
  return [
    {
      kind: "field",
      key,
      text: after.text,
      ...(after.tone ? { tone: after.tone } : {}),
      ...(after.bar ? { bar: after.bar } : {}),
    },
  ];
}

/**
 * The producer. Pure — no clock, no DOM, no server — so the whole live board is specifiable from a
 * pair of dashboard snapshots.
 */
export function standingsFieldOps(
  prev: DashboardData,
  next: DashboardData,
  options: StandingsPatchOptions,
): WorldPatchOp[] {
  if (options.aId || options.bId) {
    return reframe("head-to-head compare keeps the full-render path");
  }
  const before = rowViews(prev, options.metric);
  const after = rowViews(next, options.metric);
  if (before.length !== after.length || !before.every((r) => after.some((x) => x.key === r.key))) {
    return reframe("the field gained or lost a row");
  }

  const prevHumans = cohortStats(prev.participants, "human", "Humans");
  const prevBots = cohortStats(prev.participants, "bot", "Bots");
  const nextHumans = cohortStats(next.participants, "human", "Humans");
  const nextBots = cohortStats(next.participants, "bot", "Bots");
  if (
    prevHumans.totalEquity >= prevBots.totalEquity !==
    nextHumans.totalEquity >= nextBots.totalEquity
  ) {
    return reframe("the cohort lead changed sides");
  }

  const ops: WorldPatchOp[] = [];
  const wasByKey = new Map(before.map((r) => [r.key, r]));
  for (const row of after) {
    const was = wasByKey.get(row.key);
    if (was && was.value === row.value && was.tone === row.tone && was.bar === row.bar) {
      continue;
    }
    ops.push({
      kind: "field",
      key: row.key,
      text: { value: row.value },
      tone: { value: row.tone, bar: row.tone },
      bar: { bar: row.bar },
      sortValue: row.sortValue,
    });
  }

  ops.push(...blockOp("cohort:human", cohortView(prevHumans), cohortView(nextHumans)));
  ops.push(...blockOp("cohort:bot", cohortView(prevBots), cohortView(nextBots)));
  ops.push(...blockOp("match", matchView(prevHumans, prevBots), matchView(nextHumans, nextBots)));
  ops.push(
    ...blockOp(
      "versus",
      { text: versusView(prevHumans, prevBots) },
      { text: versusView(nextHumans, nextBots) },
    ),
  );
  return ops;
}
