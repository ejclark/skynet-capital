// Type surface for market.mjs — same arrangement as scripts/crawl/phone.d.mts (`allowJs` is off).

export interface ChainRow {
  occSymbol: string;
  strike: number;
  bid: number;
  ask: number;
  delta: number;
  quotedAt: string;
  closePrice: number;
  quoteSource: "indicative";
}

/** A held contract's mark and yesterday's close, both the house model's; undefined if unquoted. */
export function modelMarks(
  symbols: Record<string, { spot: number; prevClose: number; iv: number }>,
  occ: string,
): { mark: number; lastday: number } | undefined;

export function marketClient(market: {
  expirations: string[];
  symbols: Record<string, { spot: number; prevClose: number; iv: number }>;
  barDays?: number;
}): {
  getUnderlyingPrice(sym: string): Promise<number | undefined>;
  getExpirations(u: string, onOrAfter: string, limit?: number): Promise<string[]>;
  getChain(u: string, expiration: string, type: "call" | "put"): Promise<ChainRow[]>;
  getBars(sym: string): Promise<{ t: string; c: number }[] | undefined>;
};
