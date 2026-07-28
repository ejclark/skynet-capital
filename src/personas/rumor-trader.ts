import { heldQuantity } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import { momentumOf, type Persona, sentimentOf, sharesForNotional } from "./persona.js";

/** Tunable knobs for the Rumor Trader. Config, not hardcoded — same rationale as the others. */
export interface RumorTraderConfig {
  /** Lower edge of the "rumor building" sentiment band — below this it's just noise. */
  readonly rumorSentimentMin: number;
  /** Upper edge of the band — above this the news is already out; too late to accumulate. */
  readonly rumorSentimentMax: number;
  /** Momentum must be rising (not just positive sentiment) to confirm the whisper. */
  readonly rumorMomentumMin: number;
  /** Sentiment at/above which the headline has landed — sell the news into the euphoria. */
  readonly newsSentiment: number;
  /** Dollar size per rumor entry. */
  readonly entryNotional: number;
}

export const DEFAULT_RUMOR_TRADER_CONFIG: RumorTraderConfig = {
  rumorSentimentMin: 0.2,
  rumorSentimentMax: 0.6,
  rumorMomentumMin: 0.005,
  newsSentiment: 0.75,
  entryNotional: 100_000,
};

/**
 * "The Rumor Trader." Buys the whisper, sells the headline. It accumulates while a story
 * is still building — moderate, rising sentiment with confirming momentum — and exits into
 * the euphoric spike when the news actually lands. It deliberately will NOT chase a name
 * that's already euphoric (that's the exit, not the entry), which is what separates it from
 * the Retail Investor who buys the top.
 */
export class RumorTraderPersona implements Persona {
  readonly id = "rumor-trader";
  readonly name = "The Rumor Trader";
  readonly thesis = "Buy the whisper, sell the headline — accumulate the build, exit the euphoria.";

  private readonly config: RumorTraderConfig;

  constructor(config: RumorTraderConfig = DEFAULT_RUMOR_TRADER_CONFIG) {
    this.config = config;
  }

  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
    const intents: OrderIntent[] = [];

    for (const symbol of Object.keys(context.quotes)) {
      const sentiment = sentimentOf(context, symbol);
      const momentum = momentumOf(context, symbol);
      const held = heldQuantity(portfolio, symbol);

      if (held > 0 && sentiment >= this.config.newsSentiment) {
        intents.push({
          symbol,
          side: "sell",
          quantity: held,
          type: "market",
          reason: `Selling the news: sentiment ${sentiment.toFixed(2)} >= ${this.config.newsSentiment}`,
        });
        continue;
      }

      const rumorBuilding =
        sentiment >= this.config.rumorSentimentMin &&
        sentiment <= this.config.rumorSentimentMax &&
        momentum >= this.config.rumorMomentumMin;

      if (held === 0 && rumorBuilding) {
        const quote = context.quotes[symbol];
        const quantity = quote ? sharesForNotional(this.config.entryNotional, quote.ask) : 0;
        if (quantity > 0) {
          intents.push({
            symbol,
            side: "buy",
            quantity,
            type: "market",
            reason: `Buying the rumor: sentiment ${sentiment.toFixed(2)}, momentum ${momentum.toFixed(2)}`,
          });
        }
      }
    }

    return intents;
  }
}
