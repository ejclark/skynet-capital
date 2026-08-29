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
   * This account's active playbook subscriptions (issue #885). Scoped to one account already —
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
 * S2 (never hold the print) + E1 (don't trade the open), entry side. Returns null to drop the
 * buy, or the intent untouched. The S2 exit side (flattening an EXISTING position before a
 * print) is an action, not a clamp — it belongs to the playbook engine, which owns exits.
 */
function clampDiscipline(
  intent: OrderIntent,
  context: MarketContext,
  discipline: TradeDiscipline,
): OrderIntent | null {
  const print = printWithin(
    intent.symbol,
    context.asOf,
    discipline.printFlatDays ?? 2,
    discipline.calendar,
  );
  if (print && !intent.allowThroughPrint) {
    return null; // S2: don't open what you'd be forced to flatten before the print.
  }
  const openUntil = discipline.deferOpenUntilEt ?? "10:00";
  if (!intent.urgent && etTimeOf(context.asOf) < openUntil) {
    return null; // E1: the open's spread is a certain cost; a non-urgent entry can wait it out.
  }
  return intent;
}

/** Clamp a buy so it neither overspends cash nor breaches the per-position cap. */
function clampBuy(
  intent: OrderIntent,
  portfolio: Portfolio,
  context: MarketContext,
  config: RiskConfig,
): OrderIntent | null {
  const quote = context.quotes[intent.symbol];
  if (!quote || quote.ask <= 0) {
    return null;
  }

  const equity = computeEquity(portfolio, context.quotes);
  const existingValue = heldQuantity(portfolio, intent.symbol) * quote.ask;
  const positionBudget = Math.max(0, config.maxPositionPct * equity - existingValue);

  const affordable = Math.floor(portfolio.cash / quote.ask);
  const withinPosition = Math.floor(positionBudget / quote.ask);
  const bounds = [intent.quantity, affordable, withinPosition];

  // Subscription capital sub-allocation (issue #885): a playbook trades exactly one symbol, so
  // the value already held in that symbol IS what's deployed under the subscription — no
  // separate ledger to keep in sync with fills. `existingValue` is reused unchanged.
  const subscription = intent.playbookId
    ? config.subscriptions?.find((s) => s.playbookId === intent.playbookId && s.enabled)
    : undefined;
  if (subscription) {
    const subscriptionBudget = Math.max(0, subscription.capitalAllocated - existingValue);
    bounds.push(Math.floor(subscriptionBudget / quote.ask));
  }

  const quantity = Math.min(...bounds);

  return quantity > 0 ? { ...intent, quantity } : null;
}

/** Clamp a sell so it never sells more than is actually held (no accidental shorting). */
function clampSell(intent: OrderIntent, portfolio: Portfolio): OrderIntent | null {
  const held = heldQuantity(portfolio, intent.symbol);
  const quantity = Math.min(intent.quantity, Math.max(0, held));
  return quantity > 0 ? { ...intent, quantity } : null;
}

/**
 * Apply all guards to a batch of intents against a single portfolio snapshot.
 * Note: guards size each intent against the *starting* portfolio for the cycle;
 * intra-cycle interaction between orders is deliberately out of scope for slice 1.
 */
export function applyGuards(
  intents: readonly OrderIntent[],
  portfolio: Portfolio,
  context: MarketContext,
  config: RiskConfig = DEFAULT_RISK_CONFIG,
): OrderIntent[] {
  const approved: OrderIntent[] = [];
  const ladderBlocks = config.accountTier !== undefined && blocksRiskIncrease(config.accountTier);
  for (const intent of intents) {
    // The ladder's BLOCK rung, ahead of everything else: no point sizing an order that is refused.
    //
    // A buy is the risk-INCREASING side here, and a sell can only ever be risk-reducing, because
    // `clampSell` below refuses to sell more than is actually held (no accidental shorting). So
    // blocking buys alone satisfies the rung exactly: new risk is refused, EXISTING POSITIONS ARE
    // UNTOUCHED, and exits stay open — including the force-flatten sells the bottom rung emits.
    if (intent.side === "buy" && ladderBlocks) {
      continue;
    }
    // Trade discipline next (S2/E1, buys only): a dropped entry needs no sizing.
    const disciplined =
      intent.side === "buy" && config.discipline
        ? clampDiscipline(intent, context, config.discipline)
        : intent;
    if (!disciplined) {
      continue;
    }
    const guarded =
      disciplined.side === "buy"
        ? clampBuy(disciplined, portfolio, context, config)
        : clampSell(disciplined, portfolio);
    if (guarded) {
      approved.push(guarded);
    }
  }
  return approved;
}
