import type { TickerEntry } from "./types.js";

/**
 * Crypto pairs in Alpaca's `BASE/USD` paper-trading shape (not stock tickers — the slash is load-
 * bearing, matching how Alpaca's own crypto asset symbols are formatted). This is the majors-only
 * subset of what Alpaca lists; Alpaca's own roster is the source of truth and can add or retire a
 * pair independently of this file — a miss here still falls through to free text same as any other
 * symbol.
 */
export const CRYPTO: readonly TickerEntry[] = [
  { symbol: "BTC/USD", name: "Bitcoin", sector: "Crypto" },
  { symbol: "ETH/USD", name: "Ethereum", sector: "Crypto" },
  { symbol: "LTC/USD", name: "Litecoin", sector: "Crypto" },
  { symbol: "BCH/USD", name: "Bitcoin Cash", sector: "Crypto" },
  { symbol: "DOGE/USD", name: "Dogecoin", sector: "Crypto" },
  { symbol: "SHIB/USD", name: "Shiba Inu", sector: "Crypto" },
  { symbol: "AVAX/USD", name: "Avalanche", sector: "Crypto" },
  { symbol: "LINK/USD", name: "Chainlink", sector: "Crypto" },
  { symbol: "UNI/USD", name: "Uniswap", sector: "Crypto" },
  { symbol: "AAVE/USD", name: "Aave", sector: "Crypto" },
  { symbol: "SOL/USD", name: "Solana", sector: "Crypto" },
  { symbol: "SUSHI/USD", name: "SushiSwap", sector: "Crypto" },
  { symbol: "GRT/USD", name: "The Graph", sector: "Crypto" },
  { symbol: "MKR/USD", name: "Maker", sector: "Crypto" },
  { symbol: "YFI/USD", name: "yearn.finance", sector: "Crypto" },
  { symbol: "USDT/USD", name: "Tether", sector: "Crypto" },
  { symbol: "USDC/USD", name: "USD Coin", sector: "Crypto" },
  { symbol: "PAXG/USD", name: "PAX Gold", sector: "Crypto" },
  { symbol: "CRV/USD", name: "Curve DAO", sector: "Crypto" },
  { symbol: "BAT/USD", name: "Basic Attention Token", sector: "Crypto" },
];
