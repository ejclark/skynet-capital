import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import { ConfiguredPersona } from "./configured-persona.js";
import { sharesForNotional, signalsOf } from "./persona.js";

/**
 * SAURON — HARDCORE RESEARCH MODE (Eric's directive, 2026-08-20).
 *
 * The goal is NOT a better P/L — it is trade VOLUME as research data: "consider this experimental
 * research that we use to learn from … increase the number of iterations to learn … build
 * confidence ratings in the future." So this mode trades small, often, and in ALL market
 * conditions, and every intent carries its full context (strategy tag + forward expectation) so
 * each iteration is scoreable later.
 *
 * Same eye, faster hands — the character survives, the activation energy drops:
 *  - The two classic moves stay (fade exhausted euphoria / claim what panic discards) with
 *    LOOSENED thresholds, and they now SCALE: entries add small tranches, exits take half off.
 *  - A third play covers ordinary conditions, where the extremes never fire: a momentum scalp
 *    (ride a strong run, exit the moment it breaks). Without it, loosened thresholds alone would
 *    still starve the dataset — sentiment rarely visits the extremes.
 *  - Entries claim `urgent`: the E1 defer-the-open guard is deliberately waived here, because
 *    "all market conditions" includes the open (Eric: develop playbooks to profit in all market
 *    conditions). S2 (flat through earnings prints) is NOT waived — a binary gap corrupts the
 *    dataset more than it teaches.
 *  - Notionals are ~10× smaller than standard Sauron: smaller trades enable higher volume.
 *
 * Still pure (same inputs → same intents), still clamped by the same guards, breakers, and
 * cooldown; the runner arms this persona only when `SKYNET_HARDCORE_BOTS` names it.
 */
export interface SauronHardcoreConfig {
  /** Loosened euphoria/panic thresholds — the extremes fire far more often than ±0.7. */
  readonly euphoriaSentiment: number;
  readonly panicSentiment: number;
  /** Momentum bands confirming an extreme is exhausting (small tolerance around flat). */
  readonly rolloverMomentumMax: number;
  readonly reboundMomentumMin: number;
  /** Dollar size of one extreme-play tranche (scaled by conviction, capped). */
  readonly trancheNotional: number;
  readonly maxConviction: number;
  /** Max tranches held per symbol — heldValue / trancheNotional caps scale-in. */
  readonly maxTranchesPerSymbol: number;
  /** Fraction of the position an euphoria-fade takes off (the rest rides for the next signal). */
  readonly exitFraction: number;
  /** Below this remaining value a fade just closes the position — no dust tails. */
  readonly dustNotional: number;
  /** Momentum scalp: enter on a run at/above this… */
  readonly scalpEntryMomentum: number;
  /** …and exit EVERYTHING (any strategy) when momentum breaks to/below this. */
  readonly stopMomentum: number;
  readonly scalpNotional: number;
}

export const HARDCORE_SAURON_CONFIG: SauronHardcoreConfig = {
  euphoriaSentiment: 0.35,
  panicSentiment: -0.35,
  rolloverMomentumMax: 0.005,
  reboundMomentumMin: -0.005,
  trancheNotional: 12_000,
  maxConviction: 2,
  maxTranchesPerSymbol: 3,
  exitFraction: 0.5,
  dustNotional: 6_000,
  scalpEntryMomentum: 0.012,
  stopMomentum: -0.004,
  scalpNotional: 8_000,
};

/** The two ways a held position leaves: the universal momentum stop, or a scaled euphoria fade. */
function exitIntent(
  cfg: SauronHardcoreConfig,
  symbol: string,
  sentiment: number,
  momentum: number,
  held: number,
  last: number,
): OrderIntent | null {
  // Momentum stop — the thesis behind ANY held tranche is broken; withdraw entirely.
  if (momentum <= cfg.stopMomentum) {
    return {
      symbol,
      side: "sell",
      quantity: held,
      type: "market",
      strategy: "hc-momentum-stop",
      reason: `Hardcore stop: momentum ${momentum.toFixed(3)} broke ${cfg.stopMomentum} — the imposed order failed to hold; withdrawing fully`,
      expectation:
        "Momentum thesis broken — expect further downside or chop; stay flat until a fresh signal fires.",
    };
  }
  // Euphoria fade — take half off into exhausted greed; the rest rides for the next signal.
  if (sentiment >= cfg.euphoriaSentiment && momentum <= cfg.rolloverMomentumMax) {
    const half = Math.ceil(held * cfg.exitFraction);
    const remainderValue = (held - half) * last;
    const quantity = remainderValue < cfg.dustNotional ? held : half;
    return {
      symbol,
      side: "sell",
      quantity,
      type: "market",
      strategy: "hc-euphoria-fade",
      reason: `Hardcore fade: euphoria ${sentiment.toFixed(2)} exhausting (momentum ${momentum.toFixed(3)}) — selling ${quantity === held ? "the position" : "half"} into the greed`,
      expectation:
        "Expect the rally to stall as exhausted greed unwinds; profits banked in tranches — invalidated if momentum re-accelerates, and the remainder rides that case.",
    };
  }
  return null;
}

export class SauronHardcorePersona extends ConfiguredPersona<SauronHardcoreConfig> {
  readonly id = "sauron";
  readonly name = "Sauron";
  readonly thesis =
    "Impose order on the market's chaos — hardcore research mode: the same eye, faster hands; small tranches probe every extreme and every run, and each order carries its thesis.";

  constructor(config: SauronHardcoreConfig = HARDCORE_SAURON_CONFIG) {
    super(config);
  }

  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
    const intents: OrderIntent[] = [];
    for (const symbol of Object.keys(context.quotes)) {
      const intent = this.decideSymbol(context, portfolio, symbol);
      if (intent) intents.push(intent);
    }
    return intents;
  }

  /** One symbol, one intent per cycle — exits outrank entries; the cooldown paces the rest. */
  private decideSymbol(
    context: MarketContext,
    portfolio: Portfolio,
    symbol: string,
  ): OrderIntent | null {
    const cfg = this.config;
    const { sentiment, momentum, held } = signalsOf(context, portfolio, symbol);
    const quote = context.quotes[symbol];
    if (!(quote && quote.last > 0)) return null;

    if (held > 0) {
      const exit = exitIntent(cfg, symbol, sentiment, momentum, held, quote.last);
      if (exit) return exit;
      // Held but no exit signal: fall through — scale-in below may still add a tranche.
    }

    // Entries share one budget: never more than maxTranches worth of the symbol.
    const trancheRoom = held * quote.last < cfg.trancheNotional * cfg.maxTranchesPerSymbol;
    if (!trancheRoom) return null;

    // Claim what panic discards — a small tranche each time the signal re-fires, not one big bet.
    if (sentiment <= cfg.panicSentiment && momentum >= cfg.reboundMomentumMin) {
      const excess = cfg.panicSentiment - sentiment;
      const conviction = Math.min(cfg.maxConviction, 1 + excess);
      const quantity = sharesForNotional(cfg.trancheNotional * conviction, quote.ask);
      if (quantity <= 0) return null;
      return {
        symbol,
        side: "buy",
        quantity,
        type: "market",
        urgent: true,
        strategy: "hc-panic-claim",
        reason: `Hardcore claim: panic ${sentiment.toFixed(2)} exhausting (momentum ${momentum.toFixed(3)}) — tranche ${conviction.toFixed(2)}x into the discarded`,
        expectation: `Expect a mean-reversion bounce off the fear low while momentum holds above ${cfg.reboundMomentumMin}; invalidated by momentum breaking ${cfg.stopMomentum} (the stop exits).`,
      };
    }

    // Momentum scalp — the ordinary-conditions play; extremes are rare, runs are daily.
    if (
      momentum >= cfg.scalpEntryMomentum &&
      sentiment > cfg.panicSentiment &&
      sentiment < cfg.euphoriaSentiment
    ) {
      const quantity = sharesForNotional(cfg.scalpNotional, quote.ask);
      if (quantity <= 0) return null;
      return {
        symbol,
        side: "buy",
        quantity,
        type: "market",
        urgent: true,
        strategy: "hc-momentum-scalp",
        reason: `Hardcore scalp: momentum ${momentum.toFixed(3)} running (sentiment ${sentiment.toFixed(2)} unremarkable) — small tranche rides the run`,
        expectation: `Expect the intraday run to extend while momentum holds; invalidated by momentum rolling below ${cfg.stopMomentum}, which exits the whole position.`,
      };
    }

    return null;
  }
}
