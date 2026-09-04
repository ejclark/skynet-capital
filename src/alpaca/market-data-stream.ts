import type { ObservatoryEvent } from "../observatory/events.js";
import { type AlpacaMarketMessage, priceEventFromMessage } from "./market-data-stream-events.js";

export interface MarketDataStreamConfig {
  readonly apiKey: string;
  readonly apiSecret: string;
  /** Symbols to receive trade ticks for. */
  readonly symbols: readonly string[];
  /** Data feed; the free tier is "iex". */
  readonly feed?: string;
  /** Called with every normalized price event. */
  readonly onEvent: (event: ObservatoryEvent) => void;
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

  constructor(config: MarketDataStreamConfig) {
    this.config = config;
  }

  /** Swap the credentials this stream authenticates with, in place — reconnects with the new
   *  pair. A brief gap in ticks is harmless (momentum state persists independently); staying on
   *  a rotated-away dead key is not. */
  replaceCredentials(apiKey: string, apiSecret: string): void {
    this.config = { ...this.config, apiKey, apiSecret };
    this.stop();
    this.start();
  }

  start(): void {
    const feed = this.config.feed ?? "iex";
    const socket = new WebSocket(`wss://stream.data.alpaca.markets/v2/${feed}`);
    this.socket = socket;

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({ action: "auth", key: this.config.apiKey, secret: this.config.apiSecret }),
      );
    });
    socket.addEventListener("message", (event) => this.onMessage(event.data));
    socket.addEventListener("close", () => this.config.onStatus?.("closed"));
    socket.addEventListener("error", () => this.config.onStatus?.("error"));
  }

  stop(): void {
    this.socket?.close();
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
          this.subscribe();
          this.config.onStatus?.("authenticated");
        }
        continue;
      }
      const event = priceEventFromMessage(message);
      if (event) {
        this.config.onEvent(event);
      }
    }
  }

  private subscribe(): void {
    if (this.config.symbols.length === 0 || !this.socket) {
      return;
    }
    this.socket.send(JSON.stringify({ action: "subscribe", trades: this.config.symbols }));
  }
}
