import { createDefaultPersonas } from "../personas/registry.js";
import { RESTRICT_DRAWDOWN_PCT } from "../risk/risk-ladder.js";
import type { DecisionCyclesPage, DecisionCycleView } from "./decision-json-view.js";
import type { DeskActivityEvent } from "./desk-json-view.js";
import { equityDrawdown } from "./equity-sparkline.js";
import type { EquitySample } from "./history-record.js";
import {
  reasoningForOrder,
  type WireReasoningDeps,
  type WireTradeReasoning,
} from "./wire-reasoning.js";

/**
 * THE THESIS DRAWER'S READ-ONLY SHELL, AS DATA (#3186 slice 4a) — `/api/desk/:id/thesis`. A bot's
 * standing call, its one-line thesis, a track-record chart's markers, and an honest health readout,
 * all composed from data this app already has: the latest decision cycle
 * (`decision-json-view.ts`), the persona's own one-line thesis (`persona.ts`), the desk's own
 * activity events, and equity history.
 *
 * Deliberately NOT the issue's full ask (see the plan): no fabricated confidence number (nothing
 * computes one), a 2-zone entry/exit marker set rather than the issue's 5-zone taxonomy (nothing
 * classifies "why is the bot currently waiting"), and a health readout that is an honest peak-to-
 * trough drawdown proxy — same doctrine `vitals.ts`'s `lossHeadroomGauge` already uses — rather than
 * the account risk ladder's own day-open-baseline reading, which this route has no day-boundary
 * index to reconstruct. The 2-stage auto-suspend/auto-exit safeguard ladder is out of scope for this
 * slice entirely (new autonomous-engine plumbing, tracked as slice 4d).
 */

export type ThesisVerdict = "entering" | "exiting" | "holding" | "standing aside" | "no data yet";

export interface ThesisCall {
  readonly verdict: ThesisVerdict;
  readonly why: string;
  /** Formatted from the latest cycle's `forecast.horizonMs`, when the persona's rule is time-bound. */
  readonly window?: string;
  /** The latest cycle's `forecast.invalidator` — labeled "as of the last cycle," not a persistent
   *  standing invalidator (that data model doesn't exist yet; see slice 4d). */
  readonly invalidator?: string;
  /** When the call was last drawn — absent for the honest "no cycles yet" state. */
  readonly asOf?: string;
}

export interface ThesisMarker {
  readonly n: number;
  readonly kind: "entry" | "exit";
  readonly at: string;
  readonly label: string;
  /** The Activity row this marker cross-links to (`id="act-<orderId>"` on `activity-table.tsx`). */
  readonly activityAnchor: string;
  /** The decision behind this fill, joined by exact order id (same lookup the `/wire` feed
   *  already uses). Absent for a fill that predates the audit trail, or when no lookup is
   *  configured — never fabricated. */
  readonly reasoning?: WireTradeReasoning;
}

export interface ThesisHealth {
  readonly measured: boolean;
  readonly label: string;
  readonly detail?: string;
}

/** One equity point for the track-record chart's backdrop line — the same samples `health` reads,
 *  reshaped for the chart rather than recomputed. */
export interface ThesisEquityPoint {
  readonly t: string;
  readonly value: number;
}

export interface ThesisView {
  readonly personaId?: string;
  /** The persona's one-line thesis, standing in for the issue's fuller paragraph until persona copy
   *  is expanded (a content task, not a data-modeling one — see the plan). Absent for an unknown
   *  persona id. */
  readonly thesis?: string;
  readonly call: ThesisCall;
  readonly health: ThesisHealth;
  readonly equity: readonly ThesisEquityPoint[];
  readonly markers: readonly ThesisMarker[];
}

/** The persona's one-line thesis, by id — absent if the id names no persona in the roster. */
export function personaThesis(personaId: string | undefined): string | undefined {
  if (!personaId) return undefined;
  return createDefaultPersonas().find((p) => p.id === personaId)?.thesis;
}

/** "2h" / "3d" — plain and short; omits anything that doesn't reduce cleanly, rather than showing
 *  a fractional unit nobody asked for. */
function formatHorizon(horizonMs: number): string | undefined {
  const hours = horizonMs / 3_600_000;
  if (hours < 1) return undefined;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function verdictFor(cycle: DecisionCycleView | undefined): ThesisVerdict {
  if (!cycle) return "no data yet";
  const placed = cycle.outcomes.find((o) => o.action === "placed");
  if (placed) return placed.side === "sell" ? "exiting" : "entering";
  if (cycle.status === "observed" || cycle.status === "quiet") return "holding";
  return "standing aside";
}

function callFor(page: DecisionCyclesPage): ThesisCall {
  const cycle = page.cycles[0];
  if (!cycle) {
    return { verdict: "no data yet", why: "No decision cycles recorded yet." };
  }
  const primary = cycle.outcomes[0] ?? cycle.refusedIntents?.[0];
  const why = primary?.reason ?? cycle.headline;
  const forecast = cycle.outcomes.find((o) => o.forecast)?.forecast;
  return {
    verdict: verdictFor(cycle),
    why,
    ...(forecast?.horizonMs !== undefined ? { window: formatHorizon(forecast.horizonMs) } : {}),
    ...(forecast ? { invalidator: forecast.invalidator } : {}),
    asOf: cycle.at,
  };
}

/** Peak-to-trough drawdown against the risk ladder's own restrict-rung cap — same honest proxy
 *  `vitals.ts`'s `lossHeadroomGauge` uses, for the same reason: reconstructing the ladder's own
 *  day-open-baseline reading needs a day-boundary index this view doesn't have. */
function healthFor(samples: readonly EquitySample[]): ThesisHealth {
  const dd = equityDrawdown(samples);
  if (!dd) return { measured: false, label: "not yet measured" };
  const ddFraction = dd.ddPct / 100;
  const label = ddFraction >= RESTRICT_DRAWDOWN_PCT ? "drawing down" : "steady";
  return {
    measured: true,
    label,
    detail: `${dd.ddPct.toFixed(1)}% off peak (${(RESTRICT_DRAWDOWN_PCT * 100).toFixed(0)}% cap)`,
  };
}

/** Buy → entry, sell → exit, oldest first, numbered — a 2-zone simplification of the issue's 5-zone
 *  taxonomy (entry/take-profit/hold/wait-event-dependent/avoid), which nothing in this repo
 *  classifies yet (see the plan). Only filled events carry a real marker. */
function markersFrom(
  events: readonly DeskActivityEvent[],
  findByOrderId: WireReasoningDeps["findByOrderId"],
): ThesisMarker[] {
  const filled = [...events]
    .filter((e) => e.filled > 0)
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return filled.map((event, index) => {
    const reasoning = reasoningForOrder(event.orderId, { findByOrderId });
    return {
      n: index + 1,
      kind: event.side === "sell" ? "exit" : "entry",
      at: event.at,
      label: `${event.side === "sell" ? "Sell" : "Buy"} ${event.filled} ${event.display}`,
      activityAnchor: `act-${event.orderId}`,
      ...(reasoning ? { reasoning } : {}),
    };
  });
}

function equityPoints(samples: readonly EquitySample[]): ThesisEquityPoint[] {
  return [...samples]
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
    .map((s) => ({ t: s.at, value: s.equity }));
}

export function thesisView(
  personaId: string | undefined,
  decisions: DecisionCyclesPage,
  activity: readonly DeskActivityEvent[],
  equitySamples: readonly EquitySample[],
  findByOrderId?: WireReasoningDeps["findByOrderId"],
): ThesisView {
  const thesis = personaThesis(personaId);
  return {
    ...(personaId ? { personaId } : {}),
    ...(thesis ? { thesis } : {}),
    call: callFor(decisions),
    health: healthFor(equitySamples),
    equity: equityPoints(equitySamples),
    markers: markersFrom(activity, findByOrderId),
  };
}
