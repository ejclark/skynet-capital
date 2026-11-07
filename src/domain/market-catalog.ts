/**
 * MARKET CATALOG — the markets a campaign can be about that are not one GICS sector, each played
 * through the one US-listed ETF that tracks it (#6949 slice 2).
 *
 * Eric (2026-11-06): "ensure we have means to include markets and sectors of interest for people to
 * play." A sector already has its SPDR fund (`GICS_SECTORS` in sector-coverage.ts). Oil, gold, Japan
 * and bonds have no US stock, so the plan's default is: played through a US-listed ETF the order
 * path already trades, never through a new order path (no futures, no foreign listings, no crypto).
 * That keeps the honesty rule — never offer a move that cannot be placed.
 *
 * ONE TABLE, ONE JOIN KEY. A campaign names a market by `id`; the loader (campaigns.ts) checks the
 * id is here and that the market's fund is in the campaign's cast. A member's form (slice 3) picks
 * from this list, so it can hold no market this file does not name. Every fund below is in
 * `ticker-directory/etfs.ts` (the spec pins it): adding a market is a row here plus, if the fund is
 * new to the directory, a row there.
 */

export interface MarketEntry {
  /** Slug a campaign file names. */
  readonly id: string;
  /** What a member reads on the form. */
  readonly name: string;
  /** The US-listed ETF the market is played through. */
  readonly fund: string;
  /** What owning the fund does, in a clause, so the form never hides what is actually bought. */
  readonly holds: string;
}

export const MARKETS: readonly MarketEntry[] = [
  {
    id: "us-large-caps",
    name: "US large companies",
    fund: "SPY",
    holds: "the S&P 500's 500 large US companies",
  },
  { id: "us-small-caps", name: "US small companies", fund: "IWM", holds: "the Russell 2000" },
  {
    id: "developed-markets",
    name: "Developed markets outside the US",
    fund: "VEA",
    holds: "stocks in Europe, Japan and other developed countries",
  },
  { id: "japan", name: "Japan", fund: "EWJ", holds: "large and mid-size Japanese companies" },
  {
    id: "emerging-markets",
    name: "Emerging markets",
    fund: "EEM",
    holds: "stocks in China, India, Taiwan, Brazil and other emerging countries",
  },
  {
    id: "oil",
    name: "Crude oil",
    fund: "USO",
    holds: "oil futures contracts (it tracks the oil price, not oil companies)",
  },
  { id: "gold", name: "Gold", fund: "GLD", holds: "bars of physical gold" },
  { id: "silver", name: "Silver", fund: "SLV", holds: "bars of physical silver" },
  {
    id: "long-treasuries",
    name: "Long US Treasury bonds",
    fund: "TLT",
    holds: "US government bonds that mature in 20 years or more",
  },
  {
    id: "high-yield-credit",
    name: "High-yield corporate bonds",
    fund: "HYG",
    holds: "bonds of companies with lower credit ratings",
  },
];

/** A market by its slug, or undefined. */
export function marketById(id: string): MarketEntry | undefined {
  return MARKETS.find((m) => m.id === id);
}
