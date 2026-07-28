import { heldQuantity } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import { momentumOf, type Persona, sharesForNotional } from "./persona.js";

/** Tunable knobs for the Futurist. Config, not hardcoded — same rationale as the News Fader. */
export interface FuturistConfig {
  /** Momentum at/above which a name is treated as a confirmed breakout worth buying. */
  readonly breakoutMomentum: number;
  /** Dollar size for each new entry. */
  readonly entryNotional: number;
}

const DEFAULT_FUTURIST_CONFIG: FuturistConfig = {
  breakoutMomentum: 0.02,
  entryNotional: 12_000,
};

/**
 * "The Dreamer." Buys strength in the names it believes are the future, and holds.
 * The deliberate mirror-image of the News Fader: it BUYS momentum the Fader sells,
 * and it ignores news sentiment entirely — headlines are noise, the trend is signal.
 * It only opens positions it doesn't already have (no pyramiding in slice 1).
 */
export class FuturistPersona implements Persona {
  readonly id = "futurist";
  readonly name = "The Futurist";
  readonly thesis = "Own the future early; buy confirmed strength and hold through the noise.";

  private readonly config: FuturistConfig;

  constructor(config: FuturistConfig = DEFAULT_FUTURIST_CONFIG) {
    this.config = config;
  }

  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
    const intents: OrderIntent[] = [];

    for (const symbol of Object.keys(context.quotes)) {
      const momentum = momentumOf(context, symbol);
      const alreadyHeld = heldQuantity(portfolio, symbol) !== 0;

      if (momentum >= this.config.breakoutMomentum && !alreadyHeld) {
        const quote = context.quotes[symbol];
        const quantity = quote ? sharesForNotional(this.config.entryNotional, quote.ask) : 0;
        if (quantity > 0) {
          intents.push({
            symbol,
            side: "buy",
            quantity,
            type: "market",
            reason: `Breakout entry: momentum ${momentum.toFixed(2)} >= ${this.config.breakoutMomentum}`,
          });
        }
      }
    }

    return intents;
  }
}
