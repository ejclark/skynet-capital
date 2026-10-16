/**
 * One 5-minute bar of a session, on New York's wall clock — the unit the dip-to-bounce playbook
 * (#5489) reads. `minutes` is the bar's START in ET minutes since midnight (570 = 9:30), so a bar
 * closes at `minutes + BAR_MINUTES`. Pure data: the Alpaca reader builds it, the rule consumes it.
 */
export interface IntradayBar {
  /** The ET market day, `YYYY-MM-DD`. */
  readonly date: string;
  readonly minutes: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

/** Minutes a bar spans. */
export const BAR_MINUTES = 5;

/**
 * The bars a pass can see for a ticker, oldest first, or undefined when none have been read yet.
 * SYNCHRONOUS on purpose: a persona's reads are pure and the decision pass awaits nothing here;
 * the feed behind it (`intraday-bars-feed.ts`) refreshes on its own clock. Asking for a ticker is
 * what tells the feed to fetch it.
 */
export type IntradayBarsOf = (symbol: string) => readonly IntradayBar[] | undefined;

/**
 * Reads a ticker's 5-minute regular-hours bars between two ET dates, oldest first. `undefined` means
 * the feed could not be read; an empty array is a real answer of no bars. A READ: whatever
 * implements it is handed a `get` and nothing that places an order.
 */
export type FetchIntradayBars = (
  symbol: string,
  /** `YYYY-MM-DD`, inclusive. */
  startDate: string,
  /** `YYYY-MM-DD`, inclusive. */
  endDate: string,
) => Promise<readonly IntradayBar[] | undefined>;
