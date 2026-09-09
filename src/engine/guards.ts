import { type EarningsPrint, etTimeOf, printWithin } from "../domain/earnings-calendar.js";
import { computeEquity, heldQuantity } from "../domain/portfolio.js";
import type {
  MarketContext,
  OrderIntent,
  PlaybookSubscription,
  Portfolio,
} from "../domain/types.js";
import { blocksRiskIncrease, type RiskTier } from "../risk/risk-ladder.js";

/**
 * Risk guardrails, applied by the engine to every persona's raw intents.
 *
 * This is the single place that enforces "you can't do that" — personas stay naive
 * about limits on purpose (DRY: one risk implementation, not one per persona). Guards
 * CLAMP rather than reject where they sensibly can (a friendlier DX: a slightly-too-big
 * order becomes a right-sized order instead of vanishing), and drop intents that clamp
 * to nothing.
 */

/**
 * The two universal findings of the eight-symbol sweep (docs/research/multi-symbol-sweep.md),
 * as guards. Both apply to BUYS only — exits always pass, because a guard that blocks
 * risk-reduction is a hazard, not a discipline.
 *
 * OPT-IN BY CONSTRUCTION: this config is absent from `DEFAULT_RISK_CONFIG`, so evals, the
 * readiness gate, and every existing caller are untouched. The production runner
 * (run-autonomous) is the one place that supplies it. Keep it that way — a discipline field
 * that leaked into the eval path would silently re-score every persona's readiness.
 */
interface TradeDiscipline {
  /** The forward print calendar (S2). Estimates count — they widen the flat window. */
  readonly calendar: readonly EarningsPrint[];
  /** S2: refuse buys when a print is within this many calendar days (default 2 = flat by D-1). */
  readonly printFlatDays?: number;
  /**
   * E1: drop non-`urgent` buys before this ET wall-clock time ("HH:MM", default "10:00").
   * Dropping IS deferring here: the live loop re-evaluates on every market event, so a
   * still-valid intent simply passes on the first post-window cycle.
   */
  readonly deferOpenUntilEt?: string;
}

export interface RiskConfig {
  /** Max fraction of equity any single new position may represent (0.2 = 20%). */
  readonly maxPositionPct: number;
  /** S2 + E1 (opt-in — see `TradeDiscipline`). Absent = both guards inert. */
  readonly discipline?: TradeDiscipline;
  /**
   * The ACCOUNT-level rung of the graduated risk ladder (`src/risk/risk-ladder.ts`), supplied by
   * whoever is watching equity — `SafetyController.riskReading()` in the autonomous lane.
   *
   * Absent means ABSENT, not `clear`: with no reading available the guards behave exactly as they
   * did before the ladder existed, which is what keeps evals, the readiness gate and every current
   * caller untouched. Read the tier from a real reading or leave it off; never default it to
   * `clear`, which would assert a safety this file cannot see.
   */
  readonly accountTier?: RiskTier;
  /**
   * This account's active playbook subscriptions. Scoped to one account already —
   * `RiskConfig` is built per-bot — so a buy's `playbookId` looks itself up here rather than the
   * guard taking an `accountId`. Absent or no match = no sub-allocation clamp, unchanged from
   * pre-subscription behavior.
   */
  readonly subscriptions?: readonly PlaybookSubscription[];
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxPositionPct: 0.2,
};

/**
 * Why a raw intent never made it into `approved` — named so a caller can compute the guard's
 * opportunity cost (would this have paid off?) without re-deriving the logic below. Kept as a
 * closed, stable string union: a new refusal path in this file must add a case here rather than
 * falling through to a vague default, which is exactly what made refusals unattributed before.
 */
export type GuardRefusalReason =
  /** The graduated risk ladder's BLOCK rung (buys only — see `applyGuards`'s own comment on why
   *  gating buys alone is sufficient). */
  | "ladder-block"
  /** S2: a print falls inside the flat window and the intent didn't claim `allowThroughPrint`. */
  | "s2-print"
  /** E1: before the configured open-deferral time and the intent didn't claim `urgent`. */
  | "e1-open"
  /** #885's symbol-targeting filter: the subscription aims at OTHER symbols only. */
  | "subscription-filter"
  /** No live quote for the symbol, or a non-positive ask — nothing to size against. */
  | "no-quote"
  /** Cash on hand rounds down to zero shares at the ask. */
  | "insufficient-cash"
  /** The per-position cap (`maxPositionPct`) leaves zero room at the current equity/holding. */
  | "position-cap"
  /** The subscription's own capital allocation leaves zero room. */
  | "subscription-budget"
  /** A sell against a symbol with nothing (or a non-positive quantity) held. */
  | "nothing-held";

/** One raw intent the guards refused outright this cycle — the persona's own ask, unfiltered,
 *  paired with which rule refused it. */
export interface GuardRefusal {
  readonly intent: OrderIntent;
  readonly reason: GuardRefusalReason;
}

/** `approved` is exactly what `applyGuards` has always returned; `refused` is additive — every
 *  raw intent this cycle that did NOT make it into `approved`, in original order, each with the
 *  specific rule that dropped it. `refused.length === intents.length - approved.length` always. */
export interface GuardResult {
  readonly approved: readonly OrderIntent[];
  readonly refused: readonly GuardRefusal[];
}

type DisciplineOutcome =
  | { readonly ok: true; readonly intent: OrderIntent }
  | { readonly ok: false; readonly reason: "s2-print" | "e1-open" };

/**
 * S2 (never hold the print) + E1 (don't trade the open), entry side. The S2 exit side
 * (flattening an EXISTING position before a print) is an action, not a clamp — it belongs to the
 * playbook engine, which owns exits.
 */
function clampDiscipline(
  intent: OrderIntent,
  context: MarketContext,
  discipline: TradeDiscipline,
): DisciplineOutcome {
  const print = printWithin(
    intent.symbol,
    context.asOf,
    discipline.printFlatDays ?? 2,
    discipline.calendar,
  );
  if (print && !intent.allowThroughPrint) {
    return { ok: false, reason: "s2-print" }; // don't open what you'd be forced to flatten before the print.
  }
  const openUntil = discipline.deferOpenUntilEt ?? "10:00";
  if (!intent.urgent && etTimeOf(context.asOf) < openUntil) {
    return { ok: false, reason: "e1-open" }; // the open's spread is a certain cost; a non-urgent entry can wait.
  }
  return { ok: true, intent };
}

type BuySizingOutcome =
  | { readonly ok: true; readonly intent: OrderIntent }
  | {
      readonly ok: false;
      readonly reason: Extract<
        GuardRefusalReason,
        | "subscription-filter"
        | "no-quote"
        | "insufficient-cash"
        | "position-cap"
        | "subscription-budget"
      >;
    };

type SellSizingOutcome =
  | { readonly ok: true; readonly intent: OrderIntent }
  | { readonly ok: false; readonly reason: Extract<GuardRefusalReason, "nothing-held"> };

/** Clamp a buy so it neither overspends cash nor breaches the per-position cap. */
function clampBuy(
  intent: OrderIntent,
  portfolio: Portfolio,
  context: MarketContext,
  config: RiskConfig,
): BuySizingOutcome {
  const quote = context.quotes[intent.symbol];
  if (!quote || quote.ask <= 0) {
    return { ok: false, reason: "no-quote" };
  }

  // Subscription capital sub-allocation: a playbook trades exactly one symbol, so
  // the value already held in that symbol IS what's deployed under the subscription — no
  // separate ledger to keep in sync with fills. `existingValue` is reused unchanged.
  const subscription = intent.playbookId
    ? config.subscriptions?.find((s) => s.playbookId === intent.playbookId && s.enabled)
    : undefined;
  // Symbol-targeting filter (#885): a subscription with a non-empty `symbols` list refuses a buy
  // outright in any OTHER symbol — this is aim/restriction, not a soft preference. Entry side
  // only, same posture as every discipline guard in this file: a guard blocks opening risk, never
  // closing it, so an exit is never gated by this filter (see `clampSell`).
  if (subscription?.symbols?.length && !subscription.symbols.includes(intent.symbol)) {
    return { ok: false, reason: "subscription-filter" };
  }

  const equity = computeEquity(portfolio, context.quotes);
  const existingValue = heldQuantity(portfolio, intent.symbol) * quote.ask;
  const positionBudget = Math.max(0, config.maxPositionPct * equity - existingValue);

  const affordable = Math.floor(portfolio.cash / quote.ask);
  const withinPosition = Math.floor(positionBudget / quote.ask);

  const subscriptionBudgetShares = subscription
    ? Math.floor(Math.max(0, subscription.capitalAllocated - existingValue) / quote.ask)
    : undefined;

  const bounds = [intent.quantity, affordable, withinPosition];
  if (subscriptionBudgetShares !== undefined) bounds.push(subscriptionBudgetShares);
  const quantity = Math.min(...bounds);

  if (quantity > 0) {
    return { ok: true, intent: { ...intent, quantity } };
  }
  // Attribute the specific bound that hit zero — checked in the same priority a reader would
  // reach for the fix: no cash at all is the most actionable, the position cap next, the
  // subscription's own allocation last (it's the narrowest and rarest budget of the three).
  if (affordable <= 0) return { ok: false, reason: "insufficient-cash" };
  if (withinPosition <= 0) return { ok: false, reason: "position-cap" };
  return { ok: false, reason: "subscription-budget" };
}

/** Clamp a sell so it never sells more than is actually held (no accidental shorting). */
function clampSell(intent: OrderIntent, portfolio: Portfolio): SellSizingOutcome {
  const held = heldQuantity(portfolio, intent.symbol);
  const quantity = Math.min(intent.quantity, Math.max(0, held));
  return quantity > 0
    ? { ok: true, intent: { ...intent, quantity } }
    : { ok: false, reason: "nothing-held" };
}

/**
 * Apply all guards to a batch of intents against a single portfolio snapshot, and say why for
 * every one that didn't survive — the data `docs/plans/where-are-we-documenting-*.md`'s "guard
 * opportunity cost" measure scores against. Note: guards size each intent against the *starting*
 * portfolio for the cycle; intra-cycle interaction between orders is deliberately out of scope
 * for slice 1.
 */
export function applyGuardsWithVerdicts(
  intents: readonly OrderIntent[],
  portfolio: Portfolio,
  context: MarketContext,
  config: RiskConfig = DEFAULT_RISK_CONFIG,
): GuardResult {
  const approved: OrderIntent[] = [];
  const refused: GuardRefusal[] = [];
  const ladderBlocks = config.accountTier !== undefined && blocksRiskIncrease(config.accountTier);
  for (const intent of intents) {
    // The ladder's BLOCK rung, ahead of everything else: no point sizing an order that is refused.
    //
    // A buy is the risk-INCREASING side here, and a sell can only ever be risk-reducing, because
    // `clampSell` below refuses to sell more than is actually held (no accidental shorting). So
    // blocking buys alone satisfies the rung exactly: new risk is refused, EXISTING POSITIONS ARE
    // UNTOUCHED, and exits stay open — including the force-flatten sells the bottom rung emits.
    if (intent.side === "buy" && ladderBlocks) {
      refused.push({ intent, reason: "ladder-block" });
      continue;
    }
    // Trade discipline next (S2/E1, buys only): a dropped entry needs no sizing.
    let disciplined = intent;
    if (intent.side === "buy" && config.discipline) {
      const outcome = clampDiscipline(intent, context, config.discipline);
      if (!outcome.ok) {
        refused.push({ intent, reason: outcome.reason });
        continue;
      }
      disciplined = outcome.intent;
    }
    const outcome =
      disciplined.side === "buy"
        ? clampBuy(disciplined, portfolio, context, config)
        : clampSell(disciplined, portfolio);
    if (outcome.ok) {
      approved.push(outcome.intent);
    } else {
      refused.push({ intent, reason: outcome.reason });
    }
  }
  return { approved, refused };
}

/**
 * The pre-existing surface — every current caller (the trading engine, the readiness evals, the
 * risk specs) keeps this exact signature and behavior unchanged. `applyGuardsWithVerdicts` is the
 * additive superset the autonomous audit trail reads from.
 */
export function applyGuards(
  intents: readonly OrderIntent[],
  portfolio: Portfolio,
  context: MarketContext,
  config: RiskConfig = DEFAULT_RISK_CONFIG,
): OrderIntent[] {
  return [...applyGuardsWithVerdicts(intents, portfolio, context, config).approved];
}
