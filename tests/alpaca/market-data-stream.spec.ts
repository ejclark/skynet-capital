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

type SocketListener = (event: { data?: unknown }) => void;

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

  emit(type: string, event: { data?: unknown } = {}): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

const realWebSocket = globalThis.WebSocket;

beforeEach(() => {
  FakeSocket.instances = [];
  Reflect.set(globalThis, "WebSocket", FakeSocket);
});

afterEach(() => {
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
});
