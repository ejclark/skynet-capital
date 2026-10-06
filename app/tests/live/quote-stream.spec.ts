import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { connectQuoteStream, useQuoteStream } from "../../src/live/quote-stream";

/**
 * The quote's push channel (#3407 P4): one source per committed symbol, each `quote` frame written
 * into the `["quote", symbol]` query every ticket surface already reads, and the frame's OWN symbol
 * deciding where it lands — never the caller's prop.
 */

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  readonly url: string;
  readonly listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>();
  closed = false;
  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, listener: (event: MessageEvent<string>) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  emit(type: string, data: string) {
    for (const l of this.listeners.get(type) ?? []) l({ data } as MessageEvent<string>);
  }
  close() {
    this.closed = true;
  }
}

const frame = (symbol: string, last: number) =>
  JSON.stringify({
    symbol,
    last,
    change: 1,
    changePct: 0.7,
    tone: "pos",
    asOf: "2026-10-01T15:00:00Z",
  });

describe("connectQuoteStream", () => {
  beforeEach(() => {
    FakeEventSource.instances.length = 0;
    (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
  });
  afterEach(() => {
    (globalThis as { EventSource?: unknown }).EventSource = undefined;
  });

  it("opens the symbol's stream and writes each frame into that symbol's query", () => {
    const client = new QueryClient();

    const dispose = connectQuoteStream(client, "NVDA");
    const source = FakeEventSource.instances[0];
    expect(source?.url).toBe("/api/trade/quote-stream?symbol=NVDA");

    source?.emit("quote", frame("NVDA", 141));
    expect(client.getQueryData(["quote", "NVDA"])).toMatchObject({
      last: 141,
      asOf: expect.any(String),
    });

    source?.emit("quote", frame("NVDA", 142));
    expect(client.getQueryData(["quote", "NVDA"])).toMatchObject({ last: 142 });

    dispose();
    expect(source?.closed).toBe(true);
  });

  it("files a frame under the SERVER's symbol, not the one asked for", () => {
    const client = new QueryClient();
    connectQuoteStream(client, "NVDA");

    FakeEventSource.instances[0]?.emit("quote", frame("AAPL", 250));

    expect(client.getQueryData(["quote", "AAPL"])).toMatchObject({ last: 250 });
    expect(client.getQueryData(["quote", "NVDA"])).toBeUndefined();
  });

  it("opens nothing where the browser has no EventSource", () => {
    (globalThis as { EventSource?: unknown }).EventSource = undefined;
    const dispose = connectQuoteStream(new QueryClient(), "NVDA");
    expect(FakeEventSource.instances).toHaveLength(0);
    expect(() => dispose()).not.toThrow();
  });
});

describe("useQuoteStream", () => {
  beforeEach(() => {
    FakeEventSource.instances.length = 0;
    (globalThis as { EventSource?: unknown }).EventSource = FakeEventSource;
  });
  afterEach(() => {
    (globalThis as { EventSource?: unknown }).EventSource = undefined;
  });

  const wrap = (client: QueryClient) => (props: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, props.children);

  it("opens nothing for an uncommitted symbol or when the surface owns no query", () => {
    const client = new QueryClient();
    renderHook(() => useQuoteStream("", true), { wrapper: wrap(client) });
    renderHook(() => useQuoteStream("NVDA", false), { wrapper: wrap(client) });
    expect(FakeEventSource.instances).toHaveLength(0);
  });

  it("re-opens on the next symbol and closes the one before it", () => {
    const client = new QueryClient();
    const { rerender, unmount } = renderHook(({ symbol }) => useQuoteStream(symbol), {
      wrapper: wrap(client),
      initialProps: { symbol: "NVDA" },
    });
    expect(FakeEventSource.instances[0]?.url).toContain("symbol=NVDA");

    rerender({ symbol: "AAPL" });
    expect(FakeEventSource.instances[0]?.closed).toBe(true);
    expect(FakeEventSource.instances[1]?.url).toContain("symbol=AAPL");

    unmount();
    expect(FakeEventSource.instances[1]?.closed).toBe(true);
  });
});
