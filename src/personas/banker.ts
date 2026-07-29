import { positionFor } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import { ConfiguredPersona } from "./configured-persona.js";
import { momentumOf, sharesForNotional } from "./persona.js";

/** Tunable knobs for the Banker. Config, not hardcoded — same rationale as the others. */
export interface BankerConfig {
  /** The steady, liquid names the bank underwrites; it ignores everything else. */
  readonly book: readonly string[];
  /** |momentum| at/below which the tape counts as CALM — the only regime the bank opens risk in. */
  readonly calmBand: number;
  /** Gain fraction at which income is banked (disciplined harvest — never lets a win round-trip). */
  readonly harvestPct: number;
  /** Loss fraction at which the vault is protected (cut, dignified, no doubling down). */
  readonly protectPct: number;
  /** Dollar size per underwriting. */
  readonly entryNotional: number;
}

const DEFAULT_BANKER_CONFIG: BankerConfig = {
  book: ["SPY", "VOO", "QQQ", "MSFT", "AAPL", "GLD"],
  calmBand: 0.008,
  harvestPct: 0.04,
  protectPct: 0.05,
  entryNotional: 100_000,
};

/**
 * "The Banker." The house's income engine and the character-class home of the class-102 income
 * plays (covered call / cash-covered put spirit, expressed in slice-1 equity mechanics). It
 * underwrites steady names ONLY in a calm tape, harvests gains with discipline the moment they
 * mature, and protects the vault on drawdown — it never chases and never speculates. Its realized
 * income is the honest peg for the tournament prize pot (in-app points, no transfers needed):
 * the bank funds the house from interest, not wires.
 */
export class BankerPersona extends ConfiguredPersona<BankerConfig> {
  readonly id = "banker";
  readonly name = "The Banker";
  readonly thesis = "The house's income engine; underwrites calm markets, banks gains on schedule.";

  private readonly book: Set<string>;

  constructor(config: BankerConfig = DEFAULT_BANKER_CONFIG) {
    super(config);
    this.book = new Set(config.book);
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: grandfathered (21) — decompose target, do not grow
  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
    const intents: OrderIntent[] = [];

    for (const symbol of Object.keys(context.quotes)) {
      if (!this.book.has(symbol)) {
        continue;
      }
      const quote = context.quotes[symbol];
      if (!(quote && quote.last > 0)) {
        continue;
      }
      const momentum = momentumOf(context, symbol);
      const held = positionFor(portfolio, symbol);

      // Open risk only in a CALM tape — income is written in quiet markets, never chased in loud ones.
      if (!held && Math.abs(momentum) <= this.config.calmBand) {
        const quantity = sharesForNotional(this.config.entryNotional, quote.ask);
        if (quantity > 0) {
          intents.push({
            symbol,
            side: "buy",
            quantity,
            type: "market",
            reason: `Underwriting: calm tape (|momentum| ${Math.abs(momentum).toFixed(3)} <= ${this.config.calmBand})`,
          });
        }
        continue;
      }

      if (held && held.quantity > 0 && held.avgPrice > 0) {
        const gain = (quote.last - held.avgPrice) / held.avgPrice;
        if (gain >= this.config.harvestPct) {
          intents.push({
            symbol,
            side: "sell",
            quantity: held.quantity,
            type: "market",
            reason: `Banking income: ${symbol} +${(gain * 100).toFixed(1)}% >= ${this.config.harvestPct * 100}% harvest`,
          });
        } else if (gain <= -this.config.protectPct) {
          intents.push({
            symbol,
            side: "sell",
            quantity: held.quantity,
            type: "market",
            reason: `Protecting the vault: ${symbol} ${(gain * 100).toFixed(1)}% <= -${this.config.protectPct * 100}%`,
          });
        }
      }
    }

    return intents;
  }
}
