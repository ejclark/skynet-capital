import { heldQuantity } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import { momentumOf, type Persona, sentimentOf, sharesForNotional } from "./persona.js";

/** Tunable knobs for the Retail Investor. Config, not hardcoded — same rationale as the others. */
export interface RetailInvestorConfig {
  /** Sentiment at/above which a name is "everyone's talking about it" — chase it. */
  readonly fomoSentiment: number;
  /** Momentum that must confirm the hype before chasing (no buying a headline alone). */
  readonly fomoMomentum: number;
  /** Sentiment at/below which fear takes over and held names get dumped. */
  readonly panicSentiment: number;
  /** Dollar size for each chase entry. */
  readonly entryNotional: number;
}

const DEFAULT_RETAIL_INVESTOR_CONFIG: RetailInvestorConfig = {
  fomoSentiment: 0.5,
  fomoMomentum: 0.02,
  panicSentiment: -0.5,
  entryNotional: 8_000,
};

/**
 * "The Retail Investor." Trades on emotion — the deliberate mirror of the News Fader.
 *  - Buys names that are ripping on good news it doesn't already own (FOMO).
 *  - Panic-sells anything it holds the moment the news turns ugly.
 * Buys high, sells low; the archetype the Fader is built to take the other side of.
 */
export class RetailInvestorPersona implements Persona {
  readonly id = "retail-investor";
  readonly name = "The Retail Investor";
  readonly thesis = "Buys the hype, sells the fear — the crowd the News Fader trades against.";

  private readonly config: RetailInvestorConfig;

  constructor(config: RetailInvestorConfig = DEFAULT_RETAIL_INVESTOR_CONFIG) {
    this.config = config;
  }

  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
    const intents: OrderIntent[] = [];

    for (const symbol of Object.keys(context.quotes)) {
      const sentiment = sentimentOf(context, symbol);
      const momentum = momentumOf(context, symbol);
      const held = heldQuantity(portfolio, symbol);

      const isFomo = sentiment >= this.config.fomoSentiment && momentum >= this.config.fomoMomentum;
      const isPanic = sentiment <= this.config.panicSentiment;

      if (isFomo && held === 0) {
        const quote = context.quotes[symbol];
        const quantity = quote ? sharesForNotional(this.config.entryNotional, quote.ask) : 0;
        if (quantity > 0) {
          intents.push({
            symbol,
            side: "buy",
            quantity,
            type: "market",
            reason: `Chasing hype: sentiment ${sentiment.toFixed(2)}, momentum ${momentum.toFixed(2)}`,
          });
        }
        continue;
      }

      if (isPanic && held > 0) {
        intents.push({
          symbol,
          side: "sell",
          quantity: held,
          type: "market",
          reason: `Panic selling: sentiment ${sentiment.toFixed(2)}`,
        });
      }
    }

    return intents;
  }
}
