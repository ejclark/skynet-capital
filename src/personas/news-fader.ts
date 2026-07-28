import { heldQuantity } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import { momentumOf, type Persona, sentimentOf, sharesForNotional } from "./persona.js";

/**
 * Tunable knobs for the News Fader. Exposed as config (not hardcoded) so we can
 * calibrate behavior without touching logic — and so tests can pin exact thresholds.
 */
export interface NewsFaderConfig {
  /** Sentiment at/above which good news is treated as "hype to fade". */
  readonly hypeSentiment: number;
  /** Momentum at/above which a rip is treated as over-extended. */
  readonly hypeMomentum: number;
  /** Sentiment at/below which bad news is treated as "capitulation to buy". */
  readonly panicSentiment: number;
  /** Momentum at/below which a drop is treated as an over-reaction. */
  readonly panicMomentum: number;
  /** Dollar size for contrarian entries. */
  readonly entryNotional: number;
}

const DEFAULT_NEWS_FADER_CONFIG: NewsFaderConfig = {
  hypeSentiment: 0.5,
  hypeMomentum: 0.03,
  panicSentiment: -0.5,
  panicMomentum: -0.03,
  entryNotional: 10_000,
};

/**
 * "Sell the News." The crowd over-reacts; this persona takes the other side.
 *  - Strong positive news + a sharp rip in something we hold → sell into the hype.
 *  - Strong negative news + a sharp drop in something we're flat on → buy the panic.
 * It never chases strength and never adds to a euphoric name.
 */
export class NewsFaderPersona implements Persona {
  readonly id = "news-fader";
  readonly name = "The News Fader";
  readonly thesis = "The crowd over-reacts to headlines; fade the hype, buy the panic.";

  private readonly config: NewsFaderConfig;

  constructor(config: NewsFaderConfig = DEFAULT_NEWS_FADER_CONFIG) {
    this.config = config;
  }

  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
    const intents: OrderIntent[] = [];

    for (const symbol of Object.keys(context.quotes)) {
      const sentiment = sentimentOf(context, symbol);
      const momentum = momentumOf(context, symbol);
      const held = heldQuantity(portfolio, symbol);

      const isHype = sentiment >= this.config.hypeSentiment && momentum >= this.config.hypeMomentum;
      const isPanic =
        sentiment <= this.config.panicSentiment && momentum <= this.config.panicMomentum;

      if (isHype && held > 0) {
        intents.push({
          symbol,
          side: "sell",
          quantity: held,
          type: "market",
          reason: `Fading hype: sentiment ${sentiment.toFixed(2)}, momentum ${momentum.toFixed(2)}`,
        });
        continue;
      }

      if (isPanic && held === 0) {
        const quote = context.quotes[symbol];
        const quantity = quote ? sharesForNotional(this.config.entryNotional, quote.ask) : 0;
        if (quantity > 0) {
          intents.push({
            symbol,
            side: "buy",
            quantity,
            type: "market",
            reason: `Buying panic: sentiment ${sentiment.toFixed(2)}, momentum ${momentum.toFixed(2)}`,
          });
        }
      }
    }

    return intents;
  }
}
