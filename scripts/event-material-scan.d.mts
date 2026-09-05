// Type surface for the part of event-material-scan.mjs worth testing directly — same arrangement
// as envelope-scan.d.mts: the scripts/ tree is plain ESM with `allowJs` off, so a spec that
// imports from it needs this rather than a repo-wide loosening.

/** Where one price came from: the bar's own close, or the session print in the payload's meta. */
export type PriceSource = "bar-close" | "meta.regularMarketPrice";

/** One dated price read out of a Yahoo v8 chart payload. */
export type PriceRead = {
  price: number;
  /** Exchange-local date of the session the price belongs to, `YYYY-MM-DD`. */
  asOf: string;
  source: PriceSource;
};

/** The latest session's price from a Yahoo v8 chart payload — or a throw. Never an older close. */
export function closeFromChart(body: unknown, symbol: string): PriceRead;
