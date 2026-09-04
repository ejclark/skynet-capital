/**
 * Market-hours gating for the live autonomous runner: wraps the Alpaca trading clock in a
 * periodically-refreshed `isOpen()` check so `runLive`'s per-tick evaluation can gate on it
 * without re-fetching on every price event. Pulled out of run-autonomous.ts to keep that file's
 * own complexity budget (`scripts/arch-scan.mjs`'s sibling lint gate) — no behavior beyond the
 * refresh loop it replaces.
 */
import { AlpacaTradingClient } from "../alpaca/alpaca-trading-client.js";
import { FetchAlpacaTradingTransport } from "../alpaca/trading-transport.js";
import { ALPACA_PAPER_BASE_URL } from "../bots/bot.js";

const REFRESH_INTERVAL_MS = 60_000;

export interface ClockCredentials {
  readonly baseUrl?: string;
  readonly apiKey: string;
  readonly apiSecret: string;
}

export interface MarketClock {
  /** Whether the market was open as of the most recent refresh. */
  isOpen(): boolean;
  /**
   * Swap the credentials this clock polls with, in place — for the bot supplying them (the
   * shared market-data account) getting rotated. Rebuilds the client and triggers an immediate
   * refresh rather than waiting up to REFRESH_INTERVAL_MS, so a rotation that fixed a dead key
   * doesn't leave the market gated closed for up to another minute.
   */
  replaceCredentials(creds: ClockCredentials): void;
}

function buildClient(creds: ClockCredentials): AlpacaTradingClient {
  return new AlpacaTradingClient(
    new FetchAlpacaTradingTransport({
      baseUrl: creds.baseUrl ?? ALPACA_PAPER_BASE_URL,
      apiKey: creds.apiKey,
      apiSecret: creds.apiSecret,
    }),
  );
}

/**
 * Starts polling `GET /clock` on an interval and returns a handle exposing the latest reading.
 * Performs one synchronous-to-the-caller refresh before returning, so `isOpen()` reflects a real
 * reading immediately rather than the `false` default.
 */
export async function startMarketClock(creds: ClockCredentials): Promise<MarketClock> {
  let clock = buildClient(creds);
  let marketOpen = false;
  const refreshOpen = async () => {
    try {
      marketOpen = await clock.isMarketOpen();
    } catch (error) {
      console.error("[clock] failed:", error);
    }
  };
  await refreshOpen();
  setInterval(() => void refreshOpen(), REFRESH_INTERVAL_MS);
  return {
    isOpen: () => marketOpen,
    replaceCredentials: (next) => {
      clock = buildClient(next);
      void refreshOpen();
    },
  };
}
