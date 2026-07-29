import { heldQuantity } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import { ConfiguredPersona } from "./configured-persona.js";
import { sentimentOf, sharesForNotional } from "./persona.js";

/** Tunable knobs for the Gold Bug. Config, not hardcoded — same rationale as the others. */
export interface GoldBugConfig {
  /** The safe-haven symbol this persona flees to. */
  readonly safeHaven: string;
  /** Average risk-asset sentiment at/below which the market is "risk-off". */
  readonly riskOffSentiment: number;
  /** Dollar size for the flight-to-safety entry. */
  readonly entryNotional: number;
}

const DEFAULT_GOLD_BUG_CONFIG: GoldBugConfig = {
  safeHaven: "GLD",
  riskOffSentiment: -0.3,
  entryNotional: 15_000,
};

/**
 * "The Gold Bug." Distrusts paper assets. When the mood across risk assets turns
 * sour, it flees to the safe haven and hoards it — it never buys a risk asset, and
 * it never pyramids once it holds gold. A permanent bear on everything but metal.
 */
export class GoldBugPersona extends ConfiguredPersona<GoldBugConfig> {
  readonly id = "gold-bug";
  readonly name = "The Gold Bug";
  readonly thesis = "When fear spreads, flee to gold and hold it; never trust a risk asset.";

  constructor(config: GoldBugConfig = DEFAULT_GOLD_BUG_CONFIG) {
    super(config);
  }

  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
    const mood = this.riskAssetMood(context);
    if (mood > this.config.riskOffSentiment) {
      return [];
    }

    if (heldQuantity(portfolio, this.config.safeHaven) !== 0) {
      return [];
    }

    const quote = context.quotes[this.config.safeHaven];
    if (!quote) {
      return [];
    }

    const quantity = sharesForNotional(this.config.entryNotional, quote.ask);
    if (quantity <= 0) {
      return [];
    }

    return [
      {
        symbol: this.config.safeHaven,
        side: "buy",
        quantity,
        type: "market",
        reason: `Flight to safety: risk-asset mood ${mood.toFixed(2)} <= ${this.config.riskOffSentiment}`,
      },
    ];
  }

  /** Average sentiment across every non-safe-haven symbol; neutral (0) when there are none. */
  private riskAssetMood(context: MarketContext): number {
    const riskSymbols = Object.keys(context.quotes).filter((s) => s !== this.config.safeHaven);
    if (riskSymbols.length === 0) {
      return 0;
    }
    const total = riskSymbols.reduce((sum, symbol) => sum + sentimentOf(context, symbol), 0);
    return total / riskSymbols.length;
  }
}
