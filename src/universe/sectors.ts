/**
 * Ticker → sector, the one owner (lifted from empire-skyline so every renderer and the projection
 * layer share a single map). Curated so the tickers threaded through the app + fixtures theme
 * correctly; extend as holdings grow.
 */
export type Sector = "tech" | "energy" | "broad" | "gold" | "market";

const SECTOR_BY_TICKER: Record<string, Sector> = {
  NVDA: "tech",
  CRWV: "tech",
  AMD: "tech",
  AVGO: "tech",
  MSFT: "tech",
  GOOG: "tech",
  GOOGL: "tech",
  AAPL: "tech",
  META: "tech",
  TSLA: "tech",
  AMZN: "tech",
  CRM: "tech",
  XOM: "energy",
  CVX: "energy",
  COP: "energy",
  SLB: "energy",
  NEE: "energy",
  EEM: "broad",
  SPY: "broad",
  VOO: "broad",
  QQQ: "broad",
  IWM: "broad",
  VTI: "broad",
  GLD: "gold",
  IAU: "gold",
};

export function sectorOf(symbol: string): Sector {
  return SECTOR_BY_TICKER[symbol.toUpperCase()] ?? "market";
}

export const SECTOR_LABEL: Record<Sector, string> = {
  tech: "TECH",
  energy: "ENERGY",
  broad: "INDEX",
  gold: "SAFE HAVEN",
  market: "MARKET",
};
