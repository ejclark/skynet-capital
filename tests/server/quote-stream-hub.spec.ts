import type { UnderlyingQuote } from "../../src/alpaca/alpaca-options-client.js";
import {
  createQuoteStreamHub,
  NO_STREAM_CREDENTIAL,
  type QuoteStreamSinks,
  type QuoteStreamSocket,
  STREAM_BUDGET_FULL,
  type StreamedQuote,
  SYMBOLS_PER_STREAM,
} from "../../src/server/quote-stream-hub.js";

/**
 * The quote stream's upstream (#3407 P4): one socket per MEMBER on that member's own credential,
 * ref-counted per symbol, every frame computed by `quote-view.ts` and nothing computed twice.
 * Observed entirely through a fake socket and a fake snapshot read — no network, no clock.
 */

class FakeSocket implements QuoteStreamSocket {
  startCalls = 0;
  stopCalls = 0;
  readonly subscribed: string[][] = [];
  constructor(readonly sinks: QuoteStreamSinks) {}
  start(): void {
    this.startCalls += 1;
  }
  stop(): void {
    this.stopCalls += 1;
  }
  resubscribe(symbols: readonly string[]): void {
    this.subscribed.push([...symbols]);
  }
}

const SNAPSHOT: UnderlyingQuote = {
  last: 140,
  prevClose: 139,
  lastAt: "2026-10-01T15:00:00Z",
  bid: 139.9,
  ask: 140.1,
};

function harness(
  options: {
    readonly credentialed?: (requesterId: string) => boolean;
    readonly snapshot?: (
      requesterId: string,
      symbol: string,
    ) => Promise<UnderlyingQuote | undefined>;
    readonly throttleMs?: number;
  } = {},
) {
  const sockets = new Map<string, FakeSocket>();
  const flushes: Array<{ run: () => void; ms: number }> = [];
  let clock = 1_000;
  const hub = createQuoteStreamHub({
    openSocket: (requesterId, sinks) => {
      if (options.credentialed && !options.credentialed(requesterId)) return undefined;
      const socket = new FakeSocket(sinks);
      sockets.set(requesterId, socket);
      return socket;
    },
    snapshot: options.snapshot ?? (async () => SNAPSHOT),
    throttleMs: options.throttleMs ?? 0,
    now: () => clock,
    schedule: (run, ms) => {
      const entry = { run, ms };
      flushes.push(entry);
      return () => {
        const at = flushes.indexOf(entry);
        if (at >= 0) flushes.splice(at, 1);
      };
    },
  });
  return {
    hub,
    sockets,
    flushes,
    advance: (ms: number) => {
      clock += ms;
    },
    socketFor: (requesterId: string) => {
      const socket = sockets.get(requesterId);
      if (!socket) throw new Error(`no socket opened for ${requesterId}`);
      return socket;
    },
  };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createQuoteStreamHub", () => {
  it("opens one socket per member and subscribes the symbol that member asked for", async () => {
    const h = harness();
    const frames: StreamedQuote[] = [];

    const sub = h.hub.subscribe("human-eric", "NVDA", (q) => frames.push(q));

    expect(sub.ok).toBe(true);
    const socket = h.socketFor("human-eric");
    expect(socket.startCalls).toBe(1);
    expect(socket.subscribed).toEqual([["NVDA"]]);

    // The snapshot read is what supplies prevClose; the opening frame rides it.
    await settle();
    expect(frames).toEqual([
      {
        symbol: "NVDA",
        last: 140,
        change: 1,
        changePct: 0.72,
        tone: "pos",
        bid: 139.9,
        ask: 140.1,
        mid: 140,
        asOf: "2026-10-01T15:00:00Z",
      },
    ]);
  });

  it("pushes a trade tick as a recomputed view, carrying the feed's own time", async () => {
    const h = harness();
    const frames: StreamedQuote[] = [];
    h.hub.subscribe("human-eric", "NVDA", (q) => frames.push(q));
    await settle();

    h.socketFor("human-eric").sinks.onTrade({
      symbol: "NVDA",
      price: 138,
      at: "2026-10-01T15:05:00Z",
    });

    expect(frames[frames.length - 1]).toMatchObject({
      last: 138,
      change: -1,
      tone: "neg",
      asOf: "2026-10-01T15:05:00Z",
    });
  });

  it("pushes a quote tick as a new bid/ask/mid on the same last price", async () => {
    const h = harness();
    const frames: StreamedQuote[] = [];
    h.hub.subscribe("human-eric", "NVDA", (q) => frames.push(q));
    await settle();

    h.socketFor("human-eric").sinks.onQuote({
      symbol: "NVDA",
      bid: 140.5,
      ask: 140.7,
      at: "2026-10-01T15:06:00Z",
    });

    expect(frames[frames.length - 1]).toMatchObject({
      last: 140,
      bid: 140.5,
      ask: 140.7,
      mid: 140.6,
      asOf: "2026-10-01T15:06:00Z",
    });
  });

  it("drops an inverted book rather than pricing a mid from it — quote-view's own rule", async () => {
    const h = harness();
    const frames: StreamedQuote[] = [];
    h.hub.subscribe("human-eric", "NVDA", (q) => frames.push(q));
    await settle();

    h.socketFor("human-eric").sinks.onQuote({ symbol: "NVDA", bid: 141, ask: 140, at: "t" });

    const latest = frames[frames.length - 1];
    expect(latest?.mid).toBeUndefined();
    expect(latest?.bid).toBeUndefined();
    expect(latest?.last).toBe(140);
  });

  it("stays silent when the snapshot fails — there is no honest day change without a prior close", async () => {
    const h = harness({ snapshot: async () => undefined });
    const frames: StreamedQuote[] = [];

    h.hub.subscribe("human-eric", "NVDA", (q) => frames.push(q));
    await settle();
    h.socketFor("human-eric").sinks.onTrade({ symbol: "NVDA", price: 150, at: "t" });

    expect(frames).toEqual([]);
  });

  it("stays silent when the snapshot read throws", async () => {
    const h = harness({
      snapshot: () => Promise.reject(new Error("broker said no")),
    });
    const frames: StreamedQuote[] = [];

    h.hub.subscribe("human-eric", "NVDA", (q) => frames.push(q));
    await settle();

    expect(frames).toEqual([]);
  });

  it("shares one socket across two symbols, and hands a second reader the state already held", async () => {
    const h = harness();
    const first: StreamedQuote[] = [];
    const second: StreamedQuote[] = [];

    h.hub.subscribe("human-eric", "NVDA", (q) => first.push(q));
    await settle();
    h.hub.subscribe("human-eric", "AAPL", () => undefined);
    h.hub.subscribe("human-eric", "NVDA", (q) => second.push(q));

    expect(h.sockets.size).toBe(1);
    expect(h.socketFor("human-eric").startCalls).toBe(1);
    expect(h.socketFor("human-eric").subscribed).toEqual([["NVDA"], ["NVDA", "AAPL"]]);
    // A joiner paints immediately rather than waiting for the next print — on a quiet name that
    // could be minutes of a blank header.
    expect(second).toHaveLength(1);
    expect(second[0]).toMatchObject({ symbol: "NVDA", last: 140 });
  });

  it("gives each member their own socket — never one shared connection", () => {
    const h = harness();

    h.hub.subscribe("human-eric", "NVDA", () => undefined);
    h.hub.subscribe("human-ann", "NVDA", () => undefined);

    expect(h.sockets.size).toBe(2);
    expect(h.socketFor("human-eric")).not.toBe(h.socketFor("human-ann"));
  });

  it("delivers a member's frames only to that member", async () => {
    const h = harness();
    const eric: StreamedQuote[] = [];
    const ann: StreamedQuote[] = [];
    h.hub.subscribe("human-eric", "NVDA", (q) => eric.push(q));
    h.hub.subscribe("human-ann", "NVDA", (q) => ann.push(q));
    await settle();
    eric.length = 0;
    ann.length = 0;

    h.socketFor("human-eric").sinks.onTrade({ symbol: "NVDA", price: 142, at: "t" });

    expect(eric).toHaveLength(1);
    expect(ann).toEqual([]);
  });

  it("releases a symbol with its last reader, and closes the socket with the last symbol", () => {
    const h = harness();
    const a = h.hub.subscribe("human-eric", "NVDA", () => undefined);
    const b = h.hub.subscribe("human-eric", "NVDA", () => undefined);
    const c = h.hub.subscribe("human-eric", "AAPL", () => undefined);
    if (!(a.ok && b.ok && c.ok)) throw new Error("subscribe refused");
    const socket = h.socketFor("human-eric");

    a.unsubscribe();
    expect(socket.stopCalls).toBe(0);
    b.unsubscribe();
    expect(socket.subscribed[socket.subscribed.length - 1]).toEqual(["AAPL"]);
    expect(socket.stopCalls).toBe(0);

    c.unsubscribe();
    expect(socket.stopCalls).toBe(1);

    // The next reader gets a brand-new socket, not the stopped one.
    h.hub.subscribe("human-eric", "NVDA", () => undefined);
    expect(h.socketFor("human-eric")).not.toBe(socket);
  });

  it("refuses in words when the member has no key/secret pair to authenticate with", () => {
    const h = harness({ credentialed: (id) => id !== "oauth-only" });

    const sub = h.hub.subscribe("oauth-only", "NVDA", () => undefined);

    expect(sub).toEqual({ ok: false, reason: NO_STREAM_CREDENTIAL });
    expect(h.sockets.size).toBe(0);
  });

  it("refuses in words at the stated symbol budget rather than quietly freezing a price", () => {
    const h = harness();
    for (let i = 0; i < SYMBOLS_PER_STREAM; i += 1) {
      h.hub.subscribe("human-eric", `SYM${i}`, () => undefined);
    }

    const sub = h.hub.subscribe("human-eric", "ONEMORE", () => undefined);

    expect(sub).toEqual({ ok: false, reason: STREAM_BUDGET_FULL });
    // An already-streaming symbol is still served; the budget counts distinct symbols, not readers.
    expect(h.hub.subscribe("human-eric", "SYM0", () => undefined).ok).toBe(true);
  });

  it("holds a tick inside the throttle window and flushes the newest when it closes", async () => {
    const h = harness({ throttleMs: 1_000 });
    const frames: StreamedQuote[] = [];
    h.hub.subscribe("human-eric", "NVDA", (q) => frames.push(q));
    await settle();
    const sinks = h.socketFor("human-eric").sinks;
    frames.length = 0;

    h.advance(1_000);
    sinks.onTrade({ symbol: "NVDA", price: 141, at: "t1" });
    expect(frames).toHaveLength(1);

    // Two more inside the window: no writes, one scheduled flush, and it carries the LATEST price.
    sinks.onTrade({ symbol: "NVDA", price: 142, at: "t2" });
    sinks.onTrade({ symbol: "NVDA", price: 143, at: "t3" });
    expect(frames).toHaveLength(1);
    expect(h.flushes).toHaveLength(1);

    h.advance(1_000);
    h.flushes[0]?.run();
    expect(frames).toHaveLength(2);
    expect(frames[1]).toMatchObject({ last: 143, asOf: "t3" });
  });

  it("stopDesk closes a departed member's socket now, without touching anyone else's", () => {
    const h = harness();
    h.hub.subscribe("human-eric", "NVDA", () => undefined);
    h.hub.subscribe("human-ann", "NVDA", () => undefined);

    h.hub.stopDesk("human-eric");

    expect(h.socketFor("human-eric").stopCalls).toBe(1);
    expect(h.socketFor("human-ann").stopCalls).toBe(0);
    expect(() => h.hub.stopDesk("nobody")).not.toThrow();
  });

  it("drops a snapshot that lands after its symbol was released", async () => {
    let resolveSnapshot: ((q: UnderlyingQuote) => void) | undefined;
    const h = harness({
      snapshot: () =>
        new Promise<UnderlyingQuote>((resolve) => {
          resolveSnapshot = resolve;
        }),
    });
    const frames: StreamedQuote[] = [];
    const sub = h.hub.subscribe("human-eric", "NVDA", (q) => frames.push(q));
    if (!sub.ok) throw new Error("subscribe refused");

    sub.unsubscribe();
    resolveSnapshot?.(SNAPSHOT);
    await settle();

    expect(frames).toEqual([]);
  });
});
