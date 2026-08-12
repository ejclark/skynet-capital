import { type EarningsPrint, printWithin } from "../domain/earnings-calendar.js";
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
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxPositionPct: 0.2,
};

/** ET wall-clock "HH:MM" for an ISO timestamp — the whole market day is anchored on ET. */
const etTimeOf = (iso: string): string =>
  new Date(iso).toLocaleTimeString("sv-SE", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
  });

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
    // Trade discipline first (S2/E1, buys only): a dropped entry needs no sizing.
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
