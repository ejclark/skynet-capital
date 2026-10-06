/**
 * The ten names the bots always stream, and the ONLY quotes a base persona ever sees (#4777).
 *
 * The Day Trader's big-tech focus, plus the Prospector's warm-up claims (CRWV, MRVL). The price
 * stream carries more than this when a bot needs it — a ticker an enabled playbook trades, or one a
 * bot holds (`autonomous/bots-stream.ts`) — but those extra quotes reach only the playbook that asked
 * for them: every base persona loops over `Object.keys(context.quotes)` with no list of its own, so
 * `tradingRoster` hands it a view cut to this list (`personas/universe-view.ts`). Adding a claim to
 * the Prospector without adding it here is still a silent no-op.
 *
 * The playbooks that run a persona's own rules as a fixed basket (`HC-SAURON`, `SAURON`) read this
 * same list, so their basket is exactly what the persona sees — never the wider stream.
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

/**
 * The held share tickers nothing on a bot will ever sell (#4777): outside the ten names, which are
 * all its base persona sees, and outside every basket `managed` holds — the symbols its playbooks
 * trade, running or paused (a paused playbook still exits). G1-GOOG unsubscribed while its bot
 * holds GOOG is the case: priced by the stream, sold by nothing. ONE rule, so the bots' `UNMANAGED`
 * log (`autonomous/bots-stream.ts`) and the owner's roll call (`observatory/bot-heartbeat-view.ts`)
 * can never disagree about which lot is orphaned. Callers pass share tickers only: an option
 * contract is looked after by expiry hygiene whatever the roster.
 */
export function unmanagedTickers(
  held: Iterable<string>,
  managed: ReadonlySet<string>,
  universe: readonly string[] = BOTS_UNIVERSE,
): string[] {
  return [...new Set(held)].filter((s) => !(universe.includes(s) || managed.has(s)));
}
