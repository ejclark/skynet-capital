import { heldQuantity } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import { ConfiguredPersona } from "./configured-persona.js";
import { momentumOf, sentimentOf, sharesForNotional } from "./persona.js";

/**
 * Tunable knobs for Sauron. Config, not hardcoded — same rationale as the other personas.
 * The thresholds encode his temperament: he only moves at the EXTREMES of the crowd's emotion,
 * and only once momentum confirms that extreme is exhausting (order reasserting itself).
 */
export interface SauronConfig {
  /** Sentiment at/above which the crowd is euphoric — greed at its peak. */
  readonly euphoriaSentiment: number;
  /** Sentiment at/below which the crowd is in panic — fear at its peak. */
  readonly panicSentiment: number;
  /** Euphoria only counts as exhausting once momentum has rolled over to/below this. */
  readonly rolloverMomentumMax: number;
  /** Panic only counts as exhausting once momentum has turned up to/above this. */
  readonly reboundMomentumMin: number;
  /** Base dollar size per entry; scaled up by how far past the threshold the disorder runs. */
  readonly baseNotional: number;
  /** Cap on the conviction multiplier, so even total disorder can't size without bound. */
  readonly maxConviction: number;
}

const DEFAULT_SAURON_CONFIG: SauronConfig = {
  euphoriaSentiment: 0.7,
  panicSentiment: -0.7,
  rolloverMomentumMax: 0,
  reboundMomentumMin: 0,
  baseNotional: 120_000,
  maxConviction: 2,
};

/**
 * "Sauron." The order-imposer — modelled on Annatar, Lord of Gifts, in the age before the
 * corruption: a mind obsessed with bringing order to chaos, certain it alone can manage the
 * market properly. He READS the crowd's fear and greed but ACTS on neither; personal emotion is
 * set aside so the emotional extremes of others become his opportunity.
 *
 * He moves only at the peaks of disorder, and only once momentum confirms the extreme is
 * exhausting — his patience reads as the demand that the market submit before he commits:
 *  - Euphoria at its top, momentum rolled over → he SELLS into the greed (the crowd's exit is his).
 *  - Panic at its floor, momentum turning up → he BUYS what fear discards (he claims it, and holds).
 * Conviction (position size) scales with how far past the threshold the disorder has run — his
 * pride: the greater the chaos, the more total the order he imposes.
 *
 * Distinct from the News Fader (who fades sentiment alone): Sauron waits for momentum to confirm
 * the turn, so he is colder and more patient — he does not fade a hype that is still building.
 */
export class SauronPersona extends ConfiguredPersona<SauronConfig> {
  readonly id = "sauron";
  readonly name = "Sauron";
  readonly thesis =
    "Impose order on the market's chaos — read the crowd's fear and greed, act on neither; fade exhausted euphoria, claim what panic discards.";

  constructor(config: SauronConfig = DEFAULT_SAURON_CONFIG) {
    super(config);
  }

  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
    const intents: OrderIntent[] = [];

    for (const symbol of Object.keys(context.quotes)) {
      const sentiment = sentimentOf(context, symbol);
      const momentum = momentumOf(context, symbol);
      const held = heldQuantity(portfolio, symbol);

      // Fade exhausting euphoria: the greed has peaked and momentum has rolled over — sell into it.
      if (
        held > 0 &&
        sentiment >= this.config.euphoriaSentiment &&
        momentum <= this.config.rolloverMomentumMax
      ) {
        intents.push({
          symbol,
          side: "sell",
          quantity: held,
          type: "market",
          reason: `Order restored: euphoria ${sentiment.toFixed(2)} exhausting (momentum ${momentum.toFixed(2)}) — selling into the greed`,
        });
        continue;
      }

      // Claim what panic discards: fear has bottomed and momentum is turning up — accumulate.
      if (
        held === 0 &&
        sentiment <= this.config.panicSentiment &&
        momentum >= this.config.reboundMomentumMin
      ) {
        const quote = context.quotes[symbol];
        // Conviction scales with how far past the panic threshold the disorder ran (his pride).
        const excess = this.config.panicSentiment - sentiment; // >= 0 the deeper the panic
        const conviction = Math.min(this.config.maxConviction, 1 + excess);
        const quantity = quote
          ? sharesForNotional(this.config.baseNotional * conviction, quote.ask)
          : 0;
        if (quantity > 0) {
          intents.push({
            symbol,
            side: "buy",
            quantity,
            type: "market",
            reason: `Imposing order: panic ${sentiment.toFixed(2)} exhausting (momentum ${momentum.toFixed(2)}) — claiming the discarded at ${conviction.toFixed(2)}x`,
          });
        }
      }
    }

    return intents;
  }
}
