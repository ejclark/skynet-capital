import { heldQuantity, positionFor } from "../domain/portfolio.js";
import type { MarketContext, OrderIntent, Portfolio } from "../domain/types.js";
import type { Persona } from "./persona.js";
import { sharesForNotional } from "./persona.js";

/**
 * **The Prospector** — the warm-up persona whose job is to *generate executions*, not to be right.
 *
 * Every other persona waits for its signal (Sauron for exhausted extremes, the Day Trader for
 * momentum). That is correct behavior and it means most days they do nothing — which is useless when
 * the goal is to exercise the live trading path and find the bugs in it. The Prospector inverts the
 * priority: it **stakes a small claim on every symbol it is given**, then works each claim until it
 * either pays or peters out. Entry is unconditional; the only judgment is in the exit.
 *
 * ## The exit asymmetry (deliberate, and not the textbook version)
 *
 * Losers are cut on a **fixed stop** from entry. Winners are NOT closed at a fixed take-profit target
 * — that is the classic way to leave a trend on the table, and in a regime where a name can run for
 * weeks it is a guaranteed way to book pennies and miss the move. Instead a winner rides a
 * **trailing stop measured from its peak**, and the trail only arms once the position has cleared a
 * minimum runway. The position therefore exits *because the move ended*, not because it hit a number
 * chosen in advance.
 *
 * The asymmetry is the whole edge claim: small bounded losses, unbounded-until-it-rolls-over winners.
 * It is honest about what it is — an experiment harness, not an alpha model.
 *
 * ## Why this one is stateful
 *
 * Every other persona is a pure function of (context, portfolio). A trailing stop needs the *peak
 * since entry*, which neither argument carries — the broker reports average cost, never the high-water
 * mark. So the Prospector keeps a per-symbol peak in memory, advanced on each `decide`. It stays
 * deterministic (feed it a sequence of contexts and the output is fixed) and therefore testable; the
 * peak resets whenever the position goes flat. A restart forgets the peak and re-arms from the current
 * price — conservative in the right direction: it can exit a winner early, never hold a loser longer.
 */
export interface ProspectorConfig {
  /** The symbols to stake claims on. */
  readonly claims: readonly string[];
  /** Base dollar stake per claim, before conviction scaling. */
  readonly baseNotional: number;
  /**
   * Per-symbol conviction multiplier on the base stake (1 = base, 2 = double). Absent = 1.
   * Conviction sizes the bet; it never changes whether the bet is placed.
   */
  readonly conviction: Readonly<Record<string, number>>;
  /** Cut a loser at this loss from entry (0.03 = −3%). */
  readonly stopPct: number;
  /** Arm the trailing stop only after the peak has cleared this gain (0.03 = +3%). */
  readonly runwayPct: number;
  /** Once armed, exit when price falls this far from the peak (0.02 = 2% off the high). */
  readonly trailPct: number;
  /** Never hold more than this many claims at once — keeps each experiment small. */
  readonly maxConcurrent: number;
}

const DEFAULT_PROSPECTOR_CONFIG: ProspectorConfig = {
  claims: [],
  baseNotional: 2_500,
  conviction: {},
  stopPct: 0.04,
  runwayPct: 0.03,
  trailPct: 0.025,
  maxConcurrent: 6,
};

/**
 * The warm-up experiment plan (2026-08-10), sized small and deliberately structured as a comparison
 * rather than three unrelated bets. Conviction is the *only* dial that differs per name — every claim
 * is entered regardless, so the plan tests the harness even where it has no view.
 *
 *  - **NVDA** — earnings 2026-08-26. The pre-earnings drift Eric's thesis names (run up into the
 *    print, fade after), on the strongest fundamental backdrop of the three. Highest conviction.
 *  - **MRVL** — earnings 2026-08-27, one day behind NVDA. Structurally the *same* trade on the same
 *    AI-infrastructure theme, which makes the pair a natural control: if the two diverge sharply,
 *    that is information about the thesis (or the harness), not noise.
 *  - **CRWV** — earnings 2026-08-11 *tomorrow*, with a 15.5% implied move against a 16.76% average
 *    realized move over the last four quarters. That gap is a long-VOLATILITY edge, and this system
 *    trades equities only — so holding the common through the print is a directional coin flip with
 *    fat tails, not an edge trade. Taken at the smallest size precisely because it is the honest
 *    gamble of the three, and the P/L should be read as a variance sample, not a verdict.
 *
 * Exit for all three is the asymmetry above: −4% cuts, winners trail 2.5% off their peak once they
 * have cleared +3%. Nothing is closed at a fixed target — the pre-earnings runway is the whole point.
 */
export const WARM_UP_CLAIMS: Pick<ProspectorConfig, "claims" | "conviction"> = {
  claims: ["NVDA", "MRVL", "CRWV"],
  conviction: { NVDA: 2, MRVL: 1.25, CRWV: 0.5 },
};

export class ProspectorPersona implements Persona {
  readonly id = "prospector";
  readonly name = "The Prospector";
  readonly thesis =
    "Stakes a small claim on every name in the plan, cuts the barren ones fast, and lets a paying seam run until it stops paying.";

  private readonly config: ProspectorConfig;
  /** High-water price per symbol since the current position was opened. */
  private readonly peaks = new Map<string, number>();

  constructor(config: Partial<ProspectorConfig> = {}) {
    this.config = { ...DEFAULT_PROSPECTOR_CONFIG, ...config };
  }

  decide(context: MarketContext, portfolio: Portfolio): OrderIntent[] {
    const intents: OrderIntent[] = [];
    let open = this.config.claims.filter((s) => heldQuantity(portfolio, s) > 0).length;

    for (const symbol of this.config.claims) {
      const price = context.quotes[symbol]?.last ?? 0;
      if (price <= 0) continue;
      const held = heldQuantity(portfolio, symbol);

      if (held <= 0) {
        this.peaks.delete(symbol);
        const stake = open < this.config.maxConcurrent ? this.stakeClaim(symbol, price) : undefined;
        if (stake) {
          open++;
          intents.push(stake);
        }
        continue;
      }

      const exit = this.workClaim(symbol, price, held, positionFor(portfolio, symbol)?.avgPrice);
      if (exit) intents.push(exit);
    }

    return intents;
  }

  /** Unconditional entry: the claim is staked because it is in the plan, not because of a signal. */
  private stakeClaim(symbol: string, price: number): OrderIntent | undefined {
    const conviction = this.config.conviction[symbol] ?? 1;
    const quantity = sharesForNotional(this.config.baseNotional * conviction, price);
    if (quantity <= 0) return undefined;
    return {
      symbol,
      side: "buy",
      quantity,
      type: "market",
      reason: `Claim staked: ${symbol} @ ${price.toFixed(2)}, conviction ${conviction.toFixed(2)}x base $${this.config.baseNotional}`,
    };
  }

  /** The only judgment in this persona: cut a barren claim, or let a paying one run until it rolls over. */
  private workClaim(
    symbol: string,
    price: number,
    held: number,
    entry: number | undefined,
  ): OrderIntent | undefined {
    if (!entry || entry <= 0) return undefined;
    const peak = Math.max(this.peaks.get(symbol) ?? price, price);
    this.peaks.set(symbol, peak);

    const fromEntry = (price - entry) / entry;
    if (fromEntry <= -this.config.stopPct) {
      return {
        symbol,
        side: "sell",
        quantity: held,
        type: "market",
        reason: `Barren claim: ${symbol} ${(fromEntry * 100).toFixed(2)}% from entry, stop ${(-this.config.stopPct * 100).toFixed(2)}%`,
      };
    }

    // The trail arms only after real runway, so ordinary noise cannot end a young winner.
    const peakGain = (peak - entry) / entry;
    const offPeak = (peak - price) / peak;
    if (peakGain < this.config.runwayPct || offPeak < this.config.trailPct) return undefined;
    return {
      symbol,
      side: "sell",
      quantity: held,
      type: "market",
      reason: `Seam played out: ${symbol} peaked +${(peakGain * 100).toFixed(2)}%, now ${(offPeak * 100).toFixed(2)}% off the high (trail ${(this.config.trailPct * 100).toFixed(2)}%)`,
    };
  }
}
