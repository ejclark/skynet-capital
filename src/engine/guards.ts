import { computeEquity, heldQuantity } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";

/**
 * Risk guardrails, applied by the engine to every persona's raw intents.
 *
 * This is the single place that enforces "you can't do that" — personas stay naive
 * about limits on purpose (DRY: one risk implementation, not one per persona). Guards
 * CLAMP rather than reject where they sensibly can (a friendlier DX: a slightly-too-big
 * order becomes a right-sized order instead of vanishing), and drop intents that clamp
 * to nothing.
 */
export interface RiskConfig {
  /** Max fraction of equity any single new position may represent (0.2 = 20%). */
  readonly maxPositionPct: number;
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxPositionPct: 0.2,
};

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
  const quantity = Math.min(intent.quantity, affordable, withinPosition);

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
  for (const intent of intents) {
    const guarded =
      intent.side === "buy"
        ? clampBuy(intent, portfolio, context, config)
        : clampSell(intent, portfolio);
    if (guarded) {
      approved.push(guarded);
    }
  }
  return approved;
}
