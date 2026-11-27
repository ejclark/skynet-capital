import { marketDayKey } from "../domain/market-day.js";
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
 *    A call already inside the time stop was offered no plan, so none is recorded for it.
 *  - STALE PLANS: an accepted close of the whole holding drops its plan; a purchase without the
 *    plan, of a contract the desk does not hold, drops a plan carried on an earlier market day (one
 *    carried today may still be waiting on its own order to fill). The desk snapshot can lag a
 *    fill, and a contract re-bought through another door (a spread, a bot) is not seen here — so
 *    only the owner reads "your plan" (`desk-json-routes.ts`), and the rules read are the same.
 *  - READ BEFORE THE ORDER GOES (#8401). Both rules compare against what the desk held when the
 *    member sized the order, so the route takes the count BEFORE it sends one
 *    (`holdingsBeforeOrder`). Read after, the order's own fill may already be folded in (the
 *    offline writable world does it inside the order POST; live, when the fill frame beats the
 *    audit append): a close of 1 of 2 then compares against the 1 left and reads as whole, and a
 *    fresh buy reads as a contract already held. `settleExitPlan` takes no hub, so it can't re-read.
 *  - UNREAD IS NOT EMPTY (#8336). A desk whose broker read failed sits in the hub as a row with
 *    `positions: []` beside its `error` (`degraded()` in participant-snapshot.ts). That list means
 *    "unknown", never "holds none", so a held count it can't give leaves every plan where it is: a
 *    plan kept a day too long is read back and runs nothing, while one dropped on a broker timeout
 *    is the member's choice lost. Only a close with no count, which sells the whole holding by its
 *    own terms, drops a plan without the read.
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
      today: marketDayKey(now.toISOString()),
    }),
  };
}

/** True only when the body says `exitPlan: "carry"` — anything else is no choice made. */
export function carriesExitPlan(raw: string): boolean {
  return parseJsonRecord(raw)?.exitPlan === "carry";
}

/** The desk's long holdings by contract, as read before an order goes — or `undefined` when the
 *  hub's row is not a reading: no row for the desk, or a row whose broker read failed (its `error`
 *  is set and its empty `positions` mean nothing). A copy, so a later fill can't move it. */
export type HoldingsBeforeOrder = ReadonlyMap<string, number> | undefined;

/** Read the desk's holdings from the hub's last snapshot. Call it BEFORE the order is sent (#8401). */
export function holdingsBeforeOrder(
  config: Pick<DashboardServerConfig, "hub">,
  deskId: string,
): HoldingsBeforeOrder {
  const desk = config.hub.getState().participants.find((p) => p.id === deskId);
  if (!desk || desk.error) return undefined;
  const held = new Map<string, number>();
  for (const p of desk.positions) if (p.quantity > 0) held.set(p.symbol, p.quantity);
  return held;
}

/**
 * After an accepted buy-call order: record or clear the plan, and say what happened. The order
 * already went, so a failed write never turns the receipt into a refusal — it adds the one line.
 * `held` is the desk's holdings read before the order was sent (`holdingsBeforeOrder`).
 */
export function settleExitPlan(
  request: DeskOptionRequest,
  result: { readonly ok: boolean; readonly symbol?: string },
  carry: boolean,
  config: Pick<DashboardServerConfig, "exitPlans" | "now">,
  held: HoldingsBeforeOrder,
): { readonly exitPlan?: "carried" | "not-saved" } {
  const store = config.exitPlans;
  if (!result.ok) return {};
  if (request.kind === "close") {
    if (store && closesWholeHolding(request, held)) {
      store.drop(request.participantId, request.occSymbol);
    }
    return {};
  }
  if (!(request.code === BUY_CALL && result.symbol)) return {};
  const today = marketDayKey((config.now?.() ?? new Date()).toISOString());
  if (carry) {
    if (!offered(request, today)) return {};
    return {
      exitPlan: store?.carry(request.participantId, result.symbol) ? "carried" : "not-saved",
    };
  }
  if (store && held && !held.has(result.symbol)) {
    store.drop(request.participantId, result.symbol, (at) => marketDayKey(at) < today);
  }
  return {};
}

/** Whether the review offered a plan to carry: the time stop is still ahead. The premium plays no
 *  part in the day count, so any positive one prices it. */
function offered(request: OpenRequest, today: string): boolean {
  return (
    longCallPlan({ paid: 1, contracts: 1, expiration: request.expiration, today }).holdDays > 0
  );
}

/** Whether a close sells all of the contract: no count says so by itself; a count does only when
 *  it is at least what the desk held before the order went. An unread desk can't show that, so a
 *  counted close of it is not called whole. */
function closesWholeHolding(
  request: Extract<DeskOptionRequest, { kind: "close" }>,
  held: HoldingsBeforeOrder,
): boolean {
  if (request.contracts === undefined) return true;
  return held !== undefined && request.contracts >= (held.get(request.occSymbol) ?? 0);
}
