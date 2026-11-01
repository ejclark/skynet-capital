import { type LongCallPlan, longCallPlan } from "../playbooks/long-call-rules.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import type { DeskOptionRequest } from "./option-trade-service.js";
import { parseJsonRecord } from "./page-shell.js";

/**
 * THE EXIT PLAN AT REVIEW, AND CARRIED ON SUBMIT (#5709 slice 3; Eric, 2026-11-01: "The trade
 * strategy should have exit strategies in mind before executing trades… Exit strategies surfacing
 * during review feels organically part of a review/metrics/analysis process"). The options routes'
 * glue to `long-call-rules.ts`, kept out of `option-api-routes.ts` so that file stays the gate:
 *
 *  - REVIEW: buying a call (course 302) prices the house's long-call plan off the order's own
 *    premium and expiry and puts it on the preview, beside the payoff the review already shows.
 *  - SUBMIT: when the member tapped Carry and the order was accepted, the plan is recorded against
 *    the contract (`exit-plan-store.ts`) and the receipt says so — or says it could not be saved.
 *    Bought without it, a contract the desk does not already hold drops any stale plan, so a new
 *    position never inherits the plan of an earlier, closed one.
 *
 * Calls only: the house has no rule for a bought put. Nothing here places, changes or sells an
 * order; the plan is offered, and a carried plan is something the app reads back, never runs.
 */

/** The one play this plan is for: buy to open a call. */
const BUY_CALL = "302";

type OpenRequest = Extract<DeskOptionRequest, { kind: "open" }>;

/** The plan for a buy-call review, or nothing. Priced only off a premium the preview itself shows. */
export function exitPlanOnReview(
  request: DeskOptionRequest,
  preview: { readonly ok: boolean; readonly estPremium?: number },
  now: Date,
): { readonly exitPlan?: LongCallPlan } {
  if (request.kind !== "open" || request.code !== BUY_CALL) return {};
  if (!(preview.ok && preview.estPremium !== undefined && preview.estPremium > 0)) return {};
  return {
    exitPlan: longCallPlan({
      paid: preview.estPremium,
      contracts: request.contracts,
      expiration: request.expiration,
      today: now.toISOString().slice(0, 10),
    }),
  };
}

/** True only when the body says `exitPlan: "carry"` — anything else is no choice made. */
export function carriesExitPlan(raw: string): boolean {
  return parseJsonRecord(raw)?.exitPlan === "carry";
}

/**
 * After an accepted buy-call order: record or clear the plan, and say what happened. The order
 * already went, so a failed write never turns the receipt into a refusal — it adds the one line.
 */
export function settleExitPlan(
  request: DeskOptionRequest,
  result: { readonly ok: boolean; readonly symbol?: string },
  carry: boolean,
  config: Pick<DashboardServerConfig, "exitPlans" | "hub">,
): { readonly exitPlan?: "carried" | "not-saved" } {
  if (!(request.kind === "open" && request.code === BUY_CALL && result.ok && result.symbol)) {
    return {};
  }
  const store = config.exitPlans;
  if (carry)
    return {
      exitPlan: store?.carry(request.participantId, result.symbol) ? "carried" : "not-saved",
    };
  if (store && !held(config, request, result.symbol))
    store.drop(request.participantId, result.symbol);
  return {};
}

function held(
  config: Pick<DashboardServerConfig, "hub">,
  request: OpenRequest,
  occSymbol: string,
): boolean {
  const desk = config.hub.getState().participants.find((p) => p.id === request.participantId);
  return desk?.positions.some((p) => p.symbol === occSymbol && p.quantity > 0) ?? false;
}
