import type { UnderlyingQuote } from "../alpaca/alpaca-options-client.js";
import type { QuoteStreamSinks, QuoteStreamSocket } from "./quote-stream-hub.js";

/**
 * The trade page's live quote, fed by REST polling instead of a market-data websocket (#5001).
 *
 * Alpaca allows ONE market-data socket per USER LOGIN per endpoint (docs → streaming-market-data →
 * Connection limit) — not per paper account. The bots app holds that socket for its eval loop; a
 * quote-hub socket opened for a member on the same login was refused or evicted the bots', and no
 * tick means no evaluation and no trades (#4864). A socket can't tell which login owns a key, so the
 * hub opens none: this poller satisfies the hub's `QuoteStreamSocket` port and reads the member's
 * own snapshot on a timer. The bots always keep the socket; the trade page trades a sub-second tick
 * for a few-seconds-old price, and the frame's `asOf` still says how old.
 *
 * Rate: the interval stretches with the symbol count (≥ 1s per symbol), so one member's desk stays
 * at or under ~60 snapshot reads a minute against Alpaca's 200/min per key.
 */
export interface QuotePollerDeps {
  readonly sinks: QuoteStreamSinks;
  readonly snapshot: (symbol: string) => Promise<UnderlyingQuote | undefined>;
  readonly minIntervalMs?: number;
  /** Schedule the next poll; returns its canceller. Injected so a spec drives the clock. */
  readonly schedule?: (run: () => void, ms: number) => () => void;
}

export const DEFAULT_POLL_MS = 3_000;
const PER_SYMBOL_MS = 1_000;

const defaultSchedule = (run: () => void, ms: number): (() => void) => {
  const id = setTimeout(run, ms);
  id.unref?.();
  return () => clearTimeout(id);
};

export function createQuotePoller(deps: QuotePollerDeps): QuoteStreamSocket {
  const schedule = deps.schedule ?? defaultSchedule;
  const minIntervalMs = deps.minIntervalMs ?? DEFAULT_POLL_MS;
  let symbols: string[] = [];
  let cancel: (() => void) | undefined;
  let running = false;

  const intervalMs = () => Math.max(minIntervalMs, symbols.length * PER_SYMBOL_MS);

  const pollOnce = async (): Promise<void> => {
    await Promise.all(
      symbols.map(async (symbol) => {
        const quote = await deps.snapshot(symbol).catch(() => undefined);
        // A failed read stays quiet: the hub shows the last good frame with its age, never a guess.
        if (!quote) return;
        const at = quote.lastAt ?? new Date().toISOString();
        deps.sinks.onTrade({ symbol, price: quote.last, at });
        if (quote.bid !== undefined && quote.ask !== undefined) {
          deps.sinks.onQuote({ symbol, bid: quote.bid, ask: quote.ask, at });
        }
      }),
    );
  };

  const loop = (): void => {
    if (!running) return;
    cancel = schedule(() => {
      void pollOnce().finally(loop);
    }, intervalMs());
  };

  return {
    start() {
      if (running) return;
      running = true;
      loop();
    },
    stop() {
      running = false;
      cancel?.();
      cancel = undefined;
    },
    resubscribe(next) {
      symbols = [...next];
    },
  };
}
