import { rstest } from "@rstest/core";
import {
  AlpacaMarketDataStream,
  type MarketDataStreamConfig,
} from "../../src/alpaca/market-data-stream.js";
import type { ObservatoryEvent } from "../../src/observatory/events.js";

/**
 * The market-data stream owns the websocket lifecycle: connect to the chosen feed,
 * authenticate on open, subscribe once the server confirms auth, and forward trade
 * ticks as normalized price events. All behavior is observed through a fake socket —
 * the frames it sends and the events/statuses it reports — never through internals.
 */

type SocketEvent = { data?: unknown; code?: number; reason?: string; message?: string };
type SocketListener = (event: SocketEvent) => void;

/** A fake global WebSocket: records the url and sent frames, lets specs emit server events. */
class FakeSocket {
  static instances: FakeSocket[] = [];
  readonly url: string;
  readonly sent: string[] = [];
  closeCalls = 0;
  private readonly listeners = new Map<string, SocketListener[]>();

  constructor(url: string) {
    this.url = url;
    FakeSocket.instances.push(this);
  }

  addEventListener(type: string, listener: SocketListener): void {
    const existing = this.listeners.get(type) ?? [];
    existing.push(listener);
    this.listeners.set(type, existing);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closeCalls += 1;
    this.emit("close");
  }

  emit(type: string, event: SocketEvent = {}): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

const realWebSocket = globalThis.WebSocket;

beforeEach(() => {
  // Fake timers so a reconnect a spec's close schedules never fires a real socket after it ends.
  rstest.useFakeTimers();
  FakeSocket.instances = [];
  Reflect.set(globalThis, "WebSocket", FakeSocket);
});

afterEach(() => {
  rstest.useRealTimers();
  Reflect.set(globalThis, "WebSocket", realWebSocket);
});

function startStream(overrides: Partial<MarketDataStreamConfig> = {}) {
  const events: ObservatoryEvent[] = [];
  const statuses: string[] = [];
  const stream = new AlpacaMarketDataStream({
    apiKey: "key-id",
    apiSecret: "key-secret",
    symbols: ["NVDA", "SPY"],
    onEvent: (event) => events.push(event),
    onStatus: (status) => statuses.push(status),
    ...overrides,
  });
  stream.start();
  const socket = FakeSocket.instances[FakeSocket.instances.length - 1];
  if (!socket) {
    throw new Error("start() opened no socket");
  }
  return { stream, socket, events, statuses };
}

const frame = (messages: unknown): { data: string } => ({ data: JSON.stringify(messages) });
const AUTHENTICATED = [{ T: "success", msg: "authenticated" }];

describe("AlpacaMarketDataStream", () => {
  describe("when started", () => {
    it("connects to the free iex feed by default", () => {
      const { socket } = startStream();
      expect(socket.url).toBe("wss://stream.data.alpaca.markets/v2/iex");
    });

    it("connects to the configured feed instead when one is given", () => {
      const { socket } = startStream({ feed: "sip" });
      expect(socket.url).toBe("wss://stream.data.alpaca.markets/v2/sip");
    });

    it("authenticates with the configured credentials as soon as the socket opens", () => {
      const { socket } = startStream();

      socket.emit("open");

      expect(socket.sent).toHaveLength(1);
      expect(JSON.parse(socket.sent[0] ?? "")).toEqual({
        action: "auth",
        key: "key-id",
        secret: "key-secret",
      });
    });
  });

  describe("when the server confirms authentication", () => {
    it("subscribes to trades for the configured symbols and reports the milestone", () => {
      const { socket, statuses } = startStream();

      socket.emit("message", frame(AUTHENTICATED));

      expect(JSON.parse(socket.sent[socket.sent.length - 1] ?? "")).toEqual({
        action: "subscribe",
        trades: ["NVDA", "SPY"],
      });
      expect(statuses).toContain("authenticated");
    });

    it("sends no subscribe frame when there are no symbols to watch", () => {
      const { socket, statuses } = startStream({ symbols: [] });

      socket.emit("message", frame(AUTHENTICATED));

      expect(socket.sent).toEqual([]);
      expect(statuses).toContain("authenticated");
    });

    it("does not subscribe on other success chatter (e.g. the initial connect ack)", () => {
      const { socket, statuses } = startStream();

      socket.emit("message", frame([{ T: "success", msg: "connected" }]));

      expect(socket.sent).toEqual([]);
      expect(statuses).not.toContain("authenticated");
    });
  });

  describe("when trade ticks arrive", () => {
    it("forwards each tick in a batch as a normalized price event", () => {
      const { socket, events } = startStream();

      socket.emit(
        "message",
        frame([
          { T: "t", S: "NVDA", p: 142.5, t: "2026-07-28T14:30:00Z" },
          { T: "t", S: "SPY", p: 560.25, t: "2026-07-28T14:30:01Z" },
        ]),
      );

      expect(events).toEqual([
        { type: "price", symbol: "NVDA", price: 142.5, at: "2026-07-28T14:30:00Z" },
        { type: "price", symbol: "SPY", price: 560.25, at: "2026-07-28T14:30:01Z" },
      ]);
    });

    it("handles a bare (non-array) message object too", () => {
      const { socket, events } = startStream();

      socket.emit("message", frame({ T: "t", S: "NVDA", p: 141, t: "2026-07-28T14:31:00Z" }));

      expect(events).toEqual([
        { type: "price", symbol: "NVDA", price: 141, at: "2026-07-28T14:31:00Z" },
      ]);
    });

    it("decodes binary frames by stringifying them", () => {
      const { socket, events } = startStream();

      socket.emit("message", {
        data: Buffer.from(
          JSON.stringify([{ T: "t", S: "GLD", p: 205, t: "2026-07-28T14:32:00Z" }]),
        ),
      });

      expect(events).toEqual([
        { type: "price", symbol: "GLD", price: 205, at: "2026-07-28T14:32:00Z" },
      ]);
    });
  });

  describe("when noise arrives on the wire", () => {
    it("emits nothing for non-trade messages (quotes, subscription acks)", () => {
      const { socket, events } = startStream();

      socket.emit(
        "message",
        frame([
          { T: "q", S: "NVDA" },
          { T: "subscription", trades: ["NVDA"] },
        ]),
      );

      expect(events).toEqual([]);
    });

    it("drops a malformed frame and keeps the stream alive for the next tick", () => {
      const { socket, events } = startStream();

      socket.emit("message", { data: "not json {{" });
      socket.emit("message", frame([{ T: "t", S: "NVDA", p: 143, t: "2026-07-28T14:33:00Z" }]));

      expect(events).toEqual([
        { type: "price", symbol: "NVDA", price: 143, at: "2026-07-28T14:33:00Z" },
      ]);
    });
  });

  describe("lifecycle", () => {
    it("stop() closes the socket, which reports the closed status", () => {
      const { stream, socket, statuses } = startStream();

      stream.stop();

      expect(socket.closeCalls).toBe(1);
      expect(statuses).toContain("closed");
    });

    it("reports a socket error through the status callback", () => {
      const { socket, statuses } = startStream();

      socket.emit("error");

      expect(statuses).toContain("error");
    });

    it("says why a socket errored when the runtime reports a reason (#4864)", () => {
      const { socket, statuses } = startStream();

      socket.emit("error", { message: "Unexpected server response: 429" });

      expect(statuses).toContain("error — Unexpected server response: 429");
    });

    it("reports a close's code and reason", () => {
      const { socket, statuses } = startStream();

      socket.emit("close", { code: 1008, reason: "connection limit exceeded" });

      expect(statuses).toContain("closed — code 1008: connection limit exceeded");
    });

    it("reports Alpaca's in-band refusal frame instead of swallowing it", () => {
      const { socket, statuses } = startStream();

      socket.emit("message", frame([{ T: "error", code: 406, msg: "connection limit exceeded" }]));

      expect(statuses).toContain("rejected — 406 connection limit exceeded");
    });
  });

  describe("replaceCredentials", () => {
    it("before start(): only updates config — opens no socket of its own", () => {
      // Confirmed live 2026-09-04: a credential rotated during the boot-time reconcile (which
      // runs before the caller's own first start()) used to open a socket immediately here, and
      // the caller's subsequent start() then opened a SECOND one on the same account — Alpaca
      // killed one as a duplicate connection ~10s later, leaving zero ticks flowing.
      const stream = new AlpacaMarketDataStream({
        apiKey: "old-key",
        apiSecret: "old-secret",
        symbols: ["NVDA"],
        onEvent: () => undefined,
      });

      stream.replaceCredentials("new-key", "new-secret");

      expect(FakeSocket.instances).toHaveLength(0);

      stream.start();

      expect(FakeSocket.instances).toHaveLength(1);
      const socket = FakeSocket.instances[0];
      if (!socket) throw new Error("start() opened no socket");
      socket.emit("open");
      expect(JSON.parse(socket.sent[0] ?? "")).toEqual({
        action: "auth",
        key: "new-key",
        secret: "new-secret",
      });
    });

    it("closes the old socket and opens a new one authenticating with the new pair", () => {
      const { stream, socket: firstSocket } = startStream();

      stream.replaceCredentials("new-key", "new-secret");

      expect(firstSocket.closeCalls).toBe(1);
      expect(FakeSocket.instances).toHaveLength(2);
      const secondSocket = FakeSocket.instances[1];
      if (!secondSocket) throw new Error("replaceCredentials() opened no new socket");
      secondSocket.emit("open");
      expect(JSON.parse(secondSocket.sent[0] ?? "")).toEqual({
        action: "auth",
        key: "new-key",
        secret: "new-secret",
      });
    });

    it("keeps the original symbols and feed across the swap", () => {
      const { stream } = startStream({ feed: "sip", symbols: ["NVDA"] });

      stream.replaceCredentials("new-key", "new-secret");

      const secondSocket = FakeSocket.instances[1];
      if (!secondSocket) throw new Error("replaceCredentials() opened no new socket");
      expect(secondSocket.url).toBe("wss://stream.data.alpaca.markets/v2/sip");
      secondSocket.emit("open");
      secondSocket.emit("message", frame(AUTHENTICATED));
      expect(JSON.parse(secondSocket.sent[secondSocket.sent.length - 1] ?? "")).toEqual({
        action: "subscribe",
        trades: ["NVDA"],
      });
    });
  });

  // #3407 P4, the quote stream: the symbol set only LOOKED fixed at boot (subscribe() had one
  // caller), and the quote channel is opt-in so the bot loop's traffic is unchanged.
  describe("quotes", () => {
    it("subscribes to the quote channel beside trades only when asked", () => {
      const { socket } = startStream({ quotes: true, symbols: ["NVDA"] });

      socket.emit("message", frame(AUTHENTICATED));

      expect(JSON.parse(socket.sent[socket.sent.length - 1] ?? "")).toEqual({
        action: "subscribe",
        trades: ["NVDA"],
        quotes: ["NVDA"],
      });
    });

    it("forwards a bid/ask pair to onQuote, and never as a price event", () => {
      const quotes: unknown[] = [];
      const { socket, events } = startStream({ quotes: true, onQuote: (q) => quotes.push(q) });

      socket.emit(
        "message",
        frame([
          { T: "q", S: "NVDA", bp: 141.2, ap: 141.3, t: "2026-10-01T15:01:00Z" },
          { T: "t", S: "NVDA", p: 141.25, t: "2026-10-01T15:01:01Z" },
        ]),
      );

      expect(quotes).toEqual([
        { symbol: "NVDA", bid: 141.2, ask: 141.3, at: "2026-10-01T15:01:00Z" },
      ]);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ type: "price", price: 141.25 });
    });

    it("drops a quote message when no onQuote is wired (the bot loop's case)", () => {
      const { socket, events } = startStream();

      socket.emit("message", frame([{ T: "q", S: "NVDA", bp: 1, ap: 2, t: "x" }]));

      expect(events).toEqual([]);
    });
  });

  describe("resubscribe", () => {
    it("unsubscribes what left and subscribes what arrived, on both channels", () => {
      const { stream, socket } = startStream({ quotes: true, symbols: ["NVDA"] });
      socket.emit("message", frame(AUTHENTICATED));
      const before = socket.sent.length;

      stream.resubscribe(["NVDA", "AAPL"]);
      stream.resubscribe(["AAPL"]);

      const sent = socket.sent.slice(before).map((raw) => JSON.parse(raw));
      expect(sent).toEqual([
        { action: "subscribe", trades: ["AAPL"], quotes: ["AAPL"] },
        { action: "unsubscribe", trades: ["NVDA"], quotes: ["NVDA"] },
      ]);
    });

    it("sends nothing when the set did not change", () => {
      const { stream, socket } = startStream({ symbols: ["NVDA"] });
      socket.emit("message", frame(AUTHENTICATED));
      const before = socket.sent.length;

      stream.resubscribe(["NVDA"]);

      expect(socket.sent).toHaveLength(before);
    });

    it("before auth: records the set, and the handshake subscribes to it", () => {
      const { stream, socket } = startStream({ symbols: [] });

      stream.resubscribe(["NVDA"]);
      expect(socket.sent).toEqual([]);

      socket.emit("message", frame(AUTHENTICATED));

      expect(JSON.parse(socket.sent[socket.sent.length - 1] ?? "")).toEqual({
        action: "subscribe",
        trades: ["NVDA"],
      });
    });

    it("after a close: records the set rather than writing into a dead socket", () => {
      const { stream, socket } = startStream({ symbols: ["NVDA"] });
      socket.emit("message", frame(AUTHENTICATED));
      socket.emit("close");
      const before = socket.sent.length;

      stream.resubscribe(["AAPL"]);

      expect(socket.sent).toHaveLength(before);
    });
  });

  describe("when the socket drops on its own", () => {
    it("reconnects after a backoff, and the new socket re-authenticates and resubscribes", () => {
      const { socket, statuses } = startStream();
      socket.emit("error");
      socket.emit("close");

      expect(statuses).toContain("reconnecting in 1s");
      expect(FakeSocket.instances).toHaveLength(1);

      rstest.advanceTimersByTime(1000);
      const next = FakeSocket.instances[1];
      if (!next) throw new Error("no reconnect socket");
      next.emit("open");
      next.emit("message", frame(AUTHENTICATED));

      expect(JSON.parse(next.sent[0] ?? "")).toMatchObject({ action: "auth" });
      expect(JSON.parse(next.sent[1] ?? "")).toEqual({
        action: "subscribe",
        trades: ["NVDA", "SPY"],
      });
    });

    it("doubles the backoff on each failed attempt, capped at a minute", () => {
      const { statuses } = startStream();
      for (let i = 0; i < 8; i += 1) {
        FakeSocket.instances[FakeSocket.instances.length - 1]?.emit("close");
        rstest.runOnlyPendingTimers();
      }

      expect(statuses.filter((s) => s.startsWith("reconnecting"))).toEqual([
        "reconnecting in 1s",
        "reconnecting in 2s",
        "reconnecting in 4s",
        "reconnecting in 8s",
        "reconnecting in 16s",
        "reconnecting in 32s",
        "reconnecting in 60s",
        "reconnecting in 60s",
      ]);
    });

    it("resets the backoff once a reconnect authenticates", () => {
      const { socket, statuses } = startStream();
      socket.emit("close");
      rstest.runOnlyPendingTimers();
      const second = FakeSocket.instances[1];
      second?.emit("message", frame(AUTHENTICATED));
      second?.emit("close");

      expect(statuses.filter((s) => s.startsWith("reconnecting"))).toEqual([
        "reconnecting in 1s",
        "reconnecting in 1s",
      ]);
    });
  });

  describe("when closed on purpose", () => {
    it("stop() never reconnects, and cancels a reconnect already pending", () => {
      const { stream, socket } = startStream();
      socket.emit("close");
      stream.stop();
      rstest.runAllTimers();

      expect(FakeSocket.instances).toHaveLength(1);
    });

    it("a credential swap opens exactly one new socket — the retired one's close does not add a second", () => {
      const { stream } = startStream();
      stream.replaceCredentials("new-key", "new-secret");
      rstest.runAllTimers();

      expect(FakeSocket.instances).toHaveLength(2);
    });
  });
});
