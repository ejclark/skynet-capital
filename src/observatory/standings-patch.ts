import type { FieldTone, WorldPatchOp } from "../universe/world-patch.js";
import type { DashboardData } from "./dashboard-data.js";
import { plClass } from "./render-atoms.js";
import {
  type LeaderMetric,
  metricKnown,
  metricText,
  metricValue,
  rankValue,
} from "./standings-metric.js";
import { partyFields, partyView, seatKeys } from "./standings-party.js";

/**
 * THE STANDINGS FIELD PATCH — what the live board says instead of re-rendering itself.
 *
 * A pure function of (previous dashboard state, next dashboard state) → the ops that move the page
 * from one to the other: a row's value/bar and the party's table (#8253). Every value is formatted HERE, on the server, by the same helpers the initial render
 * used, so the browser never re-derives a number and the two can't drift.
 *
 * Two things it deliberately refuses to fake:
 *  - **A change it can't express becomes a `reframe`**, not a partial update. The field ladder
 *    gaining or losing a row, a seat taken or left at the party's table, or a head-to-head compare
 *    being on screen all mean the page's STRUCTURE moved; the
 *    honest answer is a fresh frame, never half-patched numbers around stale furniture.
 *  - **Nothing is emitted for a value that did not move.** "Only the changed pieces" is the whole
 *    point; an op per tick per row would be a re-render wearing a patch's clothes.
 */

export interface StandingsPatchOptions {
  readonly metric: LeaderMetric;
  /** `?a=` — when a compare is armed or showing, the view is analytical and keeps full renders. */
  readonly aId?: string;
  readonly bId?: string;
  /** Whether an account's first fill has landed (#8253) — the same read the snapshot is built
   *  with, so the party's table moves from the same op as the Field. */
  readonly isSeated?: (participantId: string) => boolean;
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
  const ranked = [...live].sort((a, b) => rankValue(b, metric) - rankValue(a, metric));
  const maxAbs =
    ranked
      .filter((p) => metricKnown(p, metric))
      .reduce((m, p) => Math.max(m, Math.abs(metricValue(p, metric))), 0) || 1;
  return ranked.map((p) => {
    const v = metricKnown(p, metric) ? metricValue(p, metric) : 0;
    return {
      key: p.id,
      value: metricText(p, metric),
      tone: metric === "equity" ? "flat" : plClass(v),
      bar: Math.max(2, (Math.abs(v) / maxAbs) * 100),
      sortValue: rankValue(p, metric),
    };
  });
}

export type TextMap = Record<string, string>;
export type ToneMap = Record<string, FieldTone>;

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

  const prevParty = partyView(prev, options.isSeated);
  const nextParty = partyView(next, options.isSeated);
  if (seatKeys(prevParty) !== seatKeys(nextParty)) {
    return reframe("the party's table gained or lost a seat");
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

  ops.push(...blockOp("party", partyFields(prevParty), partyFields(nextParty)));
  return ops;
}
