import type { UnderlyingQuote } from "../alpaca/alpaca-options-client.js";
import type { MarketQuoteTick } from "../alpaca/market-data-stream-events.js";
import { type QuoteView, quoteView } from "../trading/quote-view.js";

/**
 * THE QUOTE STREAM'S UPSTREAM (#3407 P4, the last capability slice) — one market-data socket per
 * MEMBER, on that member's own credential, carrying only the symbols that member is actually
 * looking at. Every surface-facing SSE connection rents a reference to it; the socket opens on the
 * first subscriber and closes on the last.
 *
 * WHY PER MEMBER, and not one shared stream for the whole app (priced on #3407, 2026-10-01):
 *  - Alpaca allows ONE concurrent market-data connection per account, and the bot loop already
 *    holds the host account's (`run-autonomous.ts` → `autonomous-data-connections.ts`, all ten
 *    universe symbols). A second socket on that credential is not a cap problem, it is the
 *    outage written up in `market-data-stream.ts`'s own header: Alpaca kills one as a duplicate
 *    and BOTH readers go quiet.
 *  - The trade surface's identity doctrine is already per-requester — `quote-route.ts` and
 *    `option-chain-route.ts` read "through the REQUESTER'S OWN options client only". A shared
 *    stream would price the header from a different account than the chain beside it.
 *  - The 30-symbol cap never binds, because a member watches ONE committed symbol at a time. The
 *    budget below exists to keep that true (a leaked subscription can't grow the set forever),
 *    not because the limit is close.
 *
 * WHAT A FRAME CARRIES, and why that differs from the fill stream. `desk-events.ts`'s rule is that
 * a frame carries no state the client applies locally — every number comes from a read. Read
 * literally here, a tick would only invalidate the quote query and trigger a REST re-read: hundreds
 * of reads a minute on a liquid name, where today the whole surface spends ONE (`quote-query.ts`
 * fetches on commit and has no refetch interval at all — the price simply stops moving). So the
 * server computes the whole `QuoteView` (it holds `prevClose` from its own snapshot read) and
 * pushes it; the client paints it verbatim and still never re-derives tone or the change math —
 * `quote-view.ts` stays the one place that math lives. The reason behind the original rule survives
 * intact: a dropped frame costs a slightly older price, never a wrong one, and `asOf` puts the age
 * on screen.
 */

/** A pushed frame: the same view the REST route answers, plus when the feed made the tick. */
export interface StreamedQuote extends QuoteView {
  readonly asOf: string;
}

/** The per-connection symbol budget, stated (the done line asks for a stated one). Alpaca's Basic
 *  plan allows 30 on the iex feed; a member watches one, so this is a leak stop, not a ceiling. */
export const SYMBOLS_PER_STREAM = 30;

/** The smallest gap between two frames for one symbol. A liquid name prints far faster than a
 *  member can read; this bounds the SSE write rate without ever dropping the LATEST price (a tick
 *  inside the window is held and flushed when the window closes). */
export const DEFAULT_THROTTLE_MS = 1_000;

/** Said in words when the member's account cannot carry a stream at all — an OAuth session has no
 *  key/secret pair, and the market-data websocket authenticates with one (`credentials.ts`). */
export const NO_STREAM_CREDENTIAL =
  "Live quotes stream through your own connected key, and this account is linked another way — the price here is the one read when you picked the symbol, not a moving one.";

/** Said in words when the budget above is full, rather than quietly serving a price that stops
 *  moving. */
export const STREAM_BUDGET_FULL = `This account is already streaming ${SYMBOLS_PER_STREAM} symbols, the most one connection carries — the price here is the one read when you picked the symbol, not a moving one.`;

export type QuoteListener = (quote: StreamedQuote) => void;

/** The upstream socket, narrowed to what this hub drives — so a spec supplies a fake and the hub
 *  needs no network. `AlpacaMarketDataStream` satisfies it structurally. */
export interface QuoteStreamSocket {
  start(): void;
  stop(): void;
  resubscribe(symbols: readonly string[]): void;
}

export interface QuoteStreamSinks {
  readonly onTrade: (tick: {
    readonly symbol: string;
    readonly price: number;
    readonly at: string;
  }) => void;
  readonly onQuote: (tick: MarketQuoteTick) => void;
}

export interface QuoteStreamHubDeps {
  /**
   * Open (but do not start) the socket for one member, wired to these sinks. `undefined` means
   * this member has no key/secret pair to authenticate a market-data socket with.
   */
  readonly openSocket: (
    requesterId: string,
    sinks: QuoteStreamSinks,
  ) => QuoteStreamSocket | undefined;
  /** One REST read per symbol — the opening frame, and the `prevClose` every later frame needs. */
  readonly snapshot: (requesterId: string, symbol: string) => Promise<UnderlyingQuote | undefined>;
  readonly throttleMs?: number;
  readonly now?: () => number;
  /** Schedule the trailing flush; returns its canceller. Injected so a spec drives the clock. */
  readonly schedule?: (run: () => void, ms: number) => () => void;
}

export type QuoteSubscription =
  | { readonly ok: true; unsubscribe(): void }
  | { readonly ok: false; readonly reason: string };

/** What the SSE route needs, and nothing else. */
export interface QuoteStreamPort {
  subscribe(requesterId: string, symbol: string, listener: QuoteListener): QuoteSubscription;
}

interface SymbolState {
  readonly listeners: Set<QuoteListener>;
  prevClose?: number;
  last?: number;
  bid?: number;
  ask?: number;
  at?: string;
  lastPushAt: number;
  cancelFlush?: () => void;
}

interface Desk {
  readonly socket: QuoteStreamSocket;
  readonly symbols: Map<string, SymbolState>;
}

const defaultSchedule = (run: () => void, ms: number): (() => void) => {
  const id = setTimeout(run, ms);
  // Node keeps the process alive for a pending timer; a 1-second flush must never do that.
  id.unref?.();
  return () => clearTimeout(id);
};

export interface QuoteStreamHub extends QuoteStreamPort {
  /** Close one member's socket now — called when that account leaves the roster, so a departed
   *  member's credential stops being used the moment they go (the rule `data-source.ts`'s
   *  `stopParticipantStream` already holds for the fill stream). */
  stopDesk(requesterId: string): void;
}

export function createQuoteStreamHub(deps: QuoteStreamHubDeps): QuoteStreamHub {
  const throttleMs = deps.throttleMs ?? DEFAULT_THROTTLE_MS;
  const now = deps.now ?? (() => Date.now());
  const schedule = deps.schedule ?? defaultSchedule;
  const desks = new Map<string, Desk>();

  /** Build the frame for one symbol, or nothing: with no prior close there is no honest day
   *  change to state, and a fabricated zero would read as "flat today" when the truth is unknown. */
  const frameFor = (symbol: string, state: SymbolState): StreamedQuote | undefined => {
    if (state.last === undefined || state.prevClose === undefined || !state.at) return undefined;
    const view = quoteView(symbol, {
      last: state.last,
      prevClose: state.prevClose,
      ...(state.bid === undefined ? {} : { bid: state.bid }),
      ...(state.ask === undefined ? {} : { ask: state.ask }),
    });
    return { ...view, asOf: state.at };
  };

  const push = (symbol: string, state: SymbolState): void => {
    const frame = frameFor(symbol, state);
    if (!frame) return;
    state.lastPushAt = now();
    for (const listener of state.listeners) listener(frame);
  };

  /** Push now if the window is open, else hold the newest state and flush when it closes. */
  const pushThrottled = (symbol: string, state: SymbolState): void => {
    const waited = now() - state.lastPushAt;
    if (waited >= throttleMs) {
      state.cancelFlush?.();
      state.cancelFlush = undefined;
      push(symbol, state);
      return;
    }
    if (state.cancelFlush) return;
    state.cancelFlush = schedule(() => {
      state.cancelFlush = undefined;
      push(symbol, state);
    }, throttleMs - waited);
  };

  const deskFor = (requesterId: string): Desk | undefined => {
    const existing = desks.get(requesterId);
    if (existing) return existing;
    const symbols = new Map<string, SymbolState>();
    const apply = (symbol: string, change: (state: SymbolState) => void) => {
      const state = symbols.get(symbol);
      if (!state) return;
      change(state);
      pushThrottled(symbol, state);
    };
    const socket = deps.openSocket(requesterId, {
      onTrade: ({ symbol, price, at }) =>
        apply(symbol, (state) => {
          state.last = price;
          state.at = at;
        }),
      onQuote: ({ symbol, bid, ask, at }) =>
        apply(symbol, (state) => {
          state.bid = bid;
          state.ask = ask;
          state.at = at;
        }),
    });
    if (!socket) return undefined;
    const desk: Desk = { socket, symbols };
    desks.set(requesterId, desk);
    socket.start();
    return desk;
  };

  const release = (requesterId: string, symbol: string, listener: QuoteListener): void => {
    const desk = desks.get(requesterId);
    const state = desk?.symbols.get(symbol);
    if (!(desk && state)) return;
    state.listeners.delete(listener);
    if (state.listeners.size > 0) return;
    state.cancelFlush?.();
    desk.symbols.delete(symbol);
    if (desk.symbols.size === 0) {
      desk.socket.stop();
      desks.delete(requesterId);
      return;
    }
    desk.socket.resubscribe([...desk.symbols.keys()]);
  };

  return {
    subscribe(requesterId, symbol, listener) {
      const desk = deskFor(requesterId);
      if (!desk) return { ok: false, reason: NO_STREAM_CREDENTIAL };
      const known = desk.symbols.get(symbol);
      if (known) {
        known.listeners.add(listener);
        const frame = frameFor(symbol, known);
        // A joiner gets the state already on hand, so its first paint isn't a blank wait for the
        // next print — on a quiet name that could be minutes.
        if (frame) listener(frame);
        return { ok: true, unsubscribe: () => release(requesterId, symbol, listener) };
      }
      if (desk.symbols.size >= SYMBOLS_PER_STREAM) {
        return { ok: false, reason: STREAM_BUDGET_FULL };
      }
      const state: SymbolState = { listeners: new Set([listener]), lastPushAt: 0 };
      desk.symbols.set(symbol, state);
      desk.socket.resubscribe([...desk.symbols.keys()]);
      void deps
        .snapshot(requesterId, symbol)
        .then((quote) => {
          // The symbol may already have been released while this read was in flight.
          if (!quote || desks.get(requesterId)?.symbols.get(symbol) !== state) return;
          state.prevClose = quote.prevClose;
          state.last = quote.last;
          if (quote.bid !== undefined) state.bid = quote.bid;
          if (quote.ask !== undefined) state.ask = quote.ask;
          state.at = quote.lastAt ?? new Date(now()).toISOString();
          push(symbol, state);
        })
        .catch(() => {
          // A failed snapshot leaves the stream quiet rather than guessing a prior close; the
          // surface's own REST answer is still on screen and still honest.
        });
      return { ok: true, unsubscribe: () => release(requesterId, symbol, listener) };
    },

    stopDesk(requesterId) {
      const desk = desks.get(requesterId);
      if (!desk) return;
      for (const state of desk.symbols.values()) state.cancelFlush?.();
      desk.socket.stop();
      desks.delete(requesterId);
    },
  };
}
