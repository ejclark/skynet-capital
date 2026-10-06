/**
 * The ten names the bots always stream, and the ONLY quotes a base persona ever sees (#4777).
 *
 * The Day Trader's big-tech focus, plus the Prospector's warm-up claims (CRWV, MRVL). The price
 * stream carries more than this when a bot needs it — a ticker an enabled playbook trades, or one a
 * bot holds (`autonomous/bots-stream.ts`) — but those extra quotes reach only the playbook that asked
 * for them: every base persona loops over `Object.keys(context.quotes)` with no list of its own, so
 * `tradingRoster` hands it a view cut to this list (`personas/universe-view.ts`). Adding a claim to
 * the Prospector without adding it here is still a silent no-op.
 */
export const BOTS_UNIVERSE: readonly string[] = [
  "AAPL",
  "MSFT",
  "NVDA",
  "GOOGL",
  "AMZN",
  "META",
  "AVGO",
  "TSLA",
  "CRWV",
  "MRVL",
];
