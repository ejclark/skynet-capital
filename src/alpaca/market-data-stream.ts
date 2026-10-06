import type { ObservatoryEvent } from "../observatory/events.js";
import {
  type AlpacaMarketMessage,
  type MarketQuoteTick,
  priceEventFromMessage,
  quoteTickFromMessage,
} from "./market-data-stream-events.js";

/** Ceiling on the reconnect backoff — a minute of missed ticks is the worst gap an outage costs. */
const MAX_RECONNECT_DELAY_MS = 60_000;

export interface MarketDataStreamConfig {
  readonly apiKey: string;
  readonly apiSecret: string;
  /** Symbols to receive trade ticks for. */
  readonly symbols: readonly string[];
  /** Data feed; the free tier is "iex". */
  readonly feed?: string;
  /** Called with every normalized price event. */
  readonly onEvent: (event: ObservatoryEvent) => void;
  /**
   * Also subscribe to NBBO quotes for the same symbols, delivered to `onQuote` (#3407 P4, the
   * quote stream). Off by default: the bot loop wants trade ticks only, and a quote subscription
   * on a liquid name is an order of magnitude more traffic than the trades on it.
   */
  readonly quotes?: boolean;
  /** Called with every bid/ask pair, when `quotes` is on. */
  readonly onQuote?: (tick: MarketQuoteTick) => void;
  /** Optional lifecycle logging. */
  readonly onStatus?: (status: string) => void;
}

/**
 * Subscribes to Alpaca's real-time market-data websocket and forwards trade ticks as
 * `price` events. The parsing/normalization lives in `priceEventFromMessage` (unit-tested);
 * this class only owns the socket lifecycle. Messages arrive as JSON arrays of tick objects.
 */
export class AlpacaMarketDataStream {
  private socket?: WebSocket;
  private config: MarketDataStreamConfig;
  // Confirmed live 2026-09-04: a credential rotated during the boot-time reconcile (before the
  // caller's own first start() runs) made replaceCredentials open a socket immediately, and the
  // caller's subsequent start() then opened a SECOND one on the same account — Alpaca killed one
  // as a duplicate connection ~10s later ("[market-data] error"/"closed"), leaving zero ticks
  // flowing and the eval loop stalled even with a perfectly valid credential. Tracking whether
  // the caller has ever actually started this stream fixes it: before that, a credential swap
  // only updates config (the caller's own start() opens the one real connection); after, it
  // reconnects in place exactly as before.
  private started = false;
  /** True between the broker's `authenticated` ack and the socket closing — the only window in
   *  which a subscribe/unsubscribe frame means anything. */
  private authenticated = false;
  // Confirmed live 2026-10-06: the bots app's socket died ~60s after boot (error → closed, never
  // authenticated) and nothing reopened it, so no tick arrived, maybeEvaluate never ran, and every
  // subscribed playbook sat silent through the open. An unexpected close of the CURRENT socket now
  // schedules a reconnect with capped exponential backoff (1s → 60s), reset by a successful auth;
  // stop() and a credential swap retire the socket first, so their close never reconnects.
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private reconnectAttempts = 0;

  constructor(config: MarketDataStreamConfig) {
    this.config = config;
  }

  /**
   * Change the symbol set in place (#3407 P4, the quote stream). Alpaca takes `subscribe` and
   * `unsubscribe` at any point after auth — the set only LOOKED fixed at boot because `subscribe()`
   * had exactly one caller, the authenticated handler. Before auth (or on a closed socket) this
   * just records the set; the handshake's own subscribe then sends the current one.
   */
  resubscribe(symbols: readonly string[]): void {
    const dropped = this.config.symbols.filter((symbol) => !symbols.includes(symbol));
    const added = symbols.filter((symbol) => !this.config.symbols.includes(symbol));
    this.config = { ...this.config, symbols: [...symbols] };
    if (!(this.authenticated && this.socket)) return;
    if (dropped.length > 0) this.send("unsubscribe", dropped);
    if (added.length > 0) this.send("subscribe", added);
  }

  /** Swap the credentials this stream authenticates with, in place — reconnects with the new
   *  pair if already running. A brief gap in ticks is harmless (momentum state persists
   *  independently); staying on a rotated-away dead key is not. */
  replaceCredentials(apiKey: string, apiSecret: string): void {
    this.config = { ...this.config, apiKey, apiSecret };
    if (this.started) {
      this.stop();
      this.start();
    }
  }

  start(): void {
    this.clearReconnect();
    this.started = true;
    this.authenticated = false;
    const feed = this.config.feed ?? "iex";
    const socket = new WebSocket(`wss://stream.data.alpaca.markets/v2/${feed}`);
    this.socket = socket;

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({ action: "auth", key: this.config.apiKey, secret: this.config.apiSecret }),
      );
    });
    socket.addEventListener("message", (event) => this.onMessage(event.data));
    socket.addEventListener("close", () => {
      // A closed socket can carry no subscription, so a resubscribe across the gap must record
      // the set rather than send a frame into a dead connection — the next handshake sends it.
      const current = this.socket === socket;
      if (current) this.authenticated = false;
      this.config.onStatus?.("closed");
      if (current) this.scheduleReconnect();
    });
    socket.addEventListener("error", () => {
      if (this.socket === socket) this.authenticated = false;
      this.config.onStatus?.("error");
    });
  }

  /** Close on purpose: retires the socket before closing it, so its close never reconnects. */
  stop(): void {
    this.clearReconnect();
    const socket = this.socket;
    this.socket = undefined;
    this.authenticated = false;
    socket?.close();
  }

  private scheduleReconnect(): void {
    const delayMs = Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    this.config.onStatus?.(`reconnecting in ${delayMs / 1000}s`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.start();
    }, delayMs);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private onMessage(raw: unknown): void {
    const text = typeof raw === "string" ? raw : String(raw);
    let messages: AlpacaMarketMessage[];
    try {
      const parsed: unknown = JSON.parse(text);
      messages = Array.isArray(parsed) ? parsed : [parsed as AlpacaMarketMessage];
    } catch {
      return;
    }

    for (const message of messages) {
      if (message.T === "success" && "msg" in message) {
        if ((message as { msg?: string }).msg === "authenticated") {
          this.authenticated = true;
          this.reconnectAttempts = 0;
          this.subscribe();
          this.config.onStatus?.("authenticated");
        }
        continue;
      }
      const event = priceEventFromMessage(message);
      if (event) {
        this.config.onEvent(event);
        continue;
      }
      const quote = this.config.onQuote ? quoteTickFromMessage(message) : null;
      if (quote) {
        this.config.onQuote?.(quote);
      }
    }
  }

  private subscribe(): void {
    this.send("subscribe", this.config.symbols);
  }

  /** One subscribe/unsubscribe frame, carrying the quote channel too when it's on. */
  private send(action: "subscribe" | "unsubscribe", symbols: readonly string[]): void {
    if (symbols.length === 0 || !this.socket) {
      return;
    }
    this.socket.send(
      JSON.stringify({
        action,
        trades: symbols,
        ...(this.config.quotes ? { quotes: symbols } : {}),
      }),
    );
  }
}
