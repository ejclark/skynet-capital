import type { ObservatoryEvent } from "../observatory/events.js";
import { fillEventFromMessage, type TradeUpdateMessage } from "./trade-updates-stream-events.js";

export interface TradeUpdatesStreamConfig {
  /** The observatory participant these fills belong to (matches the dashboard row id). */
  readonly participantId: string;
  readonly apiKey: string;
  readonly apiSecret: string;
  /** HTTP base, e.g. https://paper-api.alpaca.markets. Converted to the wss /stream URL. */
  readonly baseUrl: string;
  readonly onEvent: (event: ObservatoryEvent) => void;
  readonly onStatus?: (status: string) => void;
}

/** Derive the account-stream websocket URL from the HTTP base (…/v2 suffix tolerated). */
export function streamUrlFromBase(baseUrl: string): string {
  const root = baseUrl.replace(/\/v2\/?$/, "").replace(/^http/, "ws");
  return `${root}/stream`;
}

/**
 * Subscribes to one account's Alpaca `trade_updates` stream and forwards fills as `fill`
 * observatory events. Frames are binary-wrapped JSON; normalization lives in
 * `fillEventFromMessage` (unit-tested). This class owns only the socket + handshake.
 */
export class AlpacaTradeUpdatesStream {
  private socket?: WebSocket;
  private readonly config: TradeUpdatesStreamConfig;

  constructor(config: TradeUpdatesStreamConfig) {
    this.config = config;
  }

  start(): void {
    const socket = new WebSocket(streamUrlFromBase(this.config.baseUrl));
    socket.binaryType = "arraybuffer";
    this.socket = socket;

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({ action: "auth", key: this.config.apiKey, secret: this.config.apiSecret }),
      );
    });
    socket.addEventListener("message", (event) => this.onMessage(event.data));
    socket.addEventListener("close", () =>
      this.config.onStatus?.(`${this.config.participantId}: closed`),
    );
    socket.addEventListener("error", () =>
      this.config.onStatus?.(`${this.config.participantId}: error`),
    );
  }

  stop(): void {
    this.socket?.close();
  }

  private onMessage(raw: unknown): void {
    const text = typeof raw === "string" ? raw : Buffer.from(raw as ArrayBuffer).toString("utf8");
    let message: TradeUpdateMessage;
    try {
      message = JSON.parse(text) as TradeUpdateMessage;
    } catch {
      return;
    }

    if (message.stream === "authorization") {
      this.socket?.send(JSON.stringify({ action: "listen", data: { streams: ["trade_updates"] } }));
      this.config.onStatus?.(`${this.config.participantId}: listening`);
      return;
    }

    const event = fillEventFromMessage(message, this.config.participantId);
    if (event) {
      this.config.onEvent(event);
    }
  }
}
