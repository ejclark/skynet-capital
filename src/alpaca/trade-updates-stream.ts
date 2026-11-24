import type { TradeActivityRecord } from "../observatory/activity-store.js";
import type { ObservatoryEvent } from "../observatory/events.js";
import { assertPaperTradingHost } from "./paper-host.js";
import {
  activitiesFromMessage,
  fillEventFromMessage,
  type TradeUpdateMessage,
} from "./trade-updates-stream-events.js";

export interface TradeUpdatesStreamConfig {
  /** The observatory participant these fills belong to (matches the dashboard row id). */
  readonly participantId: string;
  readonly apiKey: string;
  readonly apiSecret: string;
  /** HTTP base, e.g. https://paper-api.alpaca.markets. Converted to the wss /stream URL. */
  readonly baseUrl: string;
  readonly onEvent: (event: ObservatoryEvent) => void;
  /** Durable trade-activity capture — every order update, not just fills (see activity-store.ts). */
  readonly onActivity?: (record: TradeActivityRecord) => void;
  readonly onStatus?: (status: string) => void;
  /**
   * Called once each time a REOPENED socket is listening again, with the moment the stream first
   * dropped (ISO). Fills that landed in the gap never reach this socket, so the server re-reads
   * the account's recent orders into the ledger here (#8251). Never called for the first listen:
   * the boot reconcile already covers everything before it.
   */
  readonly onResume?: (droppedAt: string) => void;
}

/** Ceiling on the reopen backoff — the same minute the price stream caps at. */
const MAX_RECONNECT_DELAY_MS = 60_000;

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
  private listening = false;
  private readonly config: TradeUpdatesStreamConfig;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private reconnectAttempts = 0;
  /** When the stream first dropped since it last listened — the gap `onResume` re-reads. */
  private droppedAt: string | undefined;

  /** Throws (paper-only, `paper-host.ts`) for any host but paper trading. */
  constructor(config: TradeUpdatesStreamConfig) {
    assertPaperTradingHost(config.baseUrl);
    this.config = config;
  }

  start(): void {
    this.droppedAt = undefined;
    this.reconnectAttempts = 0;
    this.open();
  }

  /** Close on purpose: retires the socket before closing it and cancels a pending reopen, so
   *  neither its close nor the timer ever reopens it (a rotation or a removal, `data-source.ts`). */
  stop(): void {
    this.clearReconnect();
    const socket = this.socket;
    this.socket = undefined;
    this.listening = false;
    socket?.close();
  }

  // Confirmed in #8251: the close handler only reported status, so one dropped socket stopped
  // every fill for that account until the next deploy. An unexpected close or error of the CURRENT
  // socket now reopens with capped backoff (1s → 60s), reset by an authorized answer — the price
  // stream's pattern (`market-data-stream.ts`). A refused sign-in is NOT unexpected: it retires
  // the socket first, so it stays closed (the 2026-09-30 flood, see `onAuthorization`).
  private open(): void {
    this.clearReconnect();
    const socket = new WebSocket(streamUrlFromBase(this.config.baseUrl));
    socket.binaryType = "arraybuffer";
    this.socket = socket;
    this.listening = false;

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({ action: "auth", key: this.config.apiKey, secret: this.config.apiSecret }),
      );
    });
    socket.addEventListener("message", (event) => {
      if (this.socket === socket) this.onMessage(event.data);
    });
    socket.addEventListener("close", () => {
      this.config.onStatus?.(`${this.config.participantId}: closed`);
      this.dropped(socket);
    });
    socket.addEventListener("error", () => {
      this.config.onStatus?.(`${this.config.participantId}: error`);
      this.dropped(socket);
    });
  }

  /** The current socket went away without `stop()` or a refusal: note when, and reopen once. */
  private dropped(socket: WebSocket): void {
    if (this.socket !== socket) return;
    this.socket = undefined;
    this.listening = false;
    // An error need not be followed by a close; a half-open socket would still count against the
    // broker's connection limit when the reopen signs in. Retired first, so this close is a no-op.
    try {
      socket.close();
    } catch {
      // already closing
    }
    this.droppedAt ??= new Date().toISOString();
    const delayMs = Math.min(MAX_RECONNECT_DELAY_MS, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    this.config.onStatus?.(`${this.config.participantId}: reconnecting in ${delayMs / 1000}s`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.open();
    }, delayMs);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  /**
   * Alpaca answers `auth` with an `authorization` frame — and answers a `listen` sent on an
   * unauthorized socket with ANOTHER `authorization` frame. Replying `listen` to every such frame
   * without reading its status was an unbounded ping-pong at network round-trip speed: on
   * 2026-09-30 one participant's rejected keys flooded the log and pinned the dashboard's single
   * vCPU until authed API calls stopped answering. So: `listen` exactly once, only on
   * `authorized`; anything else closes the socket and says why. No retry — bad keys stay bad
   * until a credential rotation, which starts a fresh stream (`data-source.ts`). The socket is
   * retired before it closes, so the drop handler never reopens a refusal.
   */
  private onAuthorization(status: string | undefined): void {
    if (status !== "authorized") {
      this.config.onStatus?.(
        `${this.config.participantId}: unauthorized (${status ?? "no status"})`,
      );
      this.stop();
      return;
    }
    if (this.listening) return;
    this.listening = true;
    this.reconnectAttempts = 0;
    this.socket?.send(JSON.stringify({ action: "listen", data: { streams: ["trade_updates"] } }));
    this.config.onStatus?.(`${this.config.participantId}: listening`);
    const droppedAt = this.droppedAt;
    this.droppedAt = undefined;
    if (droppedAt) this.config.onResume?.(droppedAt);
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
      this.onAuthorization(message.data?.status);
      return;
    }

    for (const record of activitiesFromMessage(message, this.config.participantId)) {
      this.config.onActivity?.(record);
    }
    const event = fillEventFromMessage(message, this.config.participantId);
    if (event) {
      this.config.onEvent(event);
    }
  }
}
