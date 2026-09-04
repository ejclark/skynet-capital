import { startSharedDataConnections } from "../../src/scripts/autonomous-data-connections.js";

/**
 * The composed shared clock/news/price-stream connections — the fix for the confirmed live
 * bug (2026-09-04): rotating the bot supplying this data never reached these, so isMarketOpen()
 * kept 401ing on the old key forever, blocking every bot's eval loop regardless of any
 * individual bot's own rotation. Verified here via a combined fetch + WebSocket fake, since the
 * module composes real Alpaca clients rather than accepting injected ones.
 */

type SocketListener = (event: { data?: unknown }) => void;

class FakeSocket {
  static instances: FakeSocket[] = [];
  readonly sent: string[] = [];
  private readonly listeners = new Map<string, SocketListener[]>();
  constructor(readonly url: string) {
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
    this.emit("close");
  }
  emit(type: string, event: { data?: unknown } = {}): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

const realWebSocket = globalThis.WebSocket;
const realFetch = globalThis.fetch;

function fakeFetch(isOpenByKey: Record<string, boolean>) {
  // biome-ignore lint/suspicious/useAwait: mock must match fetch's async signature
  globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const key = headers["APCA-API-KEY-ID"] ?? "";
    return {
      status: 200,
      text: async () => JSON.stringify({ is_open: isOpenByKey[key] ?? false, news: [] }),
    } as unknown as Response;
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  FakeSocket.instances = [];
  Reflect.set(globalThis, "WebSocket", FakeSocket);
});

afterEach(() => {
  Reflect.set(globalThis, "WebSocket", realWebSocket);
  globalThis.fetch = realFetch;
});

describe("startSharedDataConnections", () => {
  it("replaceCredentials swaps the clock, news client, and price stream together", async () => {
    fakeFetch({ "old-key": false, "new-key": true });
    const shared = await startSharedDataConnections(
      { apiKey: "old-key", apiSecret: "old-secret" },
      () => undefined,
      ["NVDA"],
    );
    shared.marketDataStream.start();
    const firstSocket = FakeSocket.instances[0];
    if (!firstSocket) throw new Error("start() opened no socket");
    expect(shared.marketClock.isOpen()).toBe(false);

    shared.replaceCredentials({ apiKey: "new-key", apiSecret: "new-secret" });
    // replaceCredentials fires the clock refresh fire-and-forget — flush the macrotask queue so
    // fetchJson's chain (fetch -> .text() -> JSON.parse) has fully settled.
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Clock: the very next refresh reflects the new key.
    expect(shared.marketClock.isOpen()).toBe(true);

    // Price stream: old socket closed, a new one opened authenticating with the new pair.
    expect(FakeSocket.instances).toHaveLength(2);
    const secondSocket = FakeSocket.instances[1];
    if (!secondSocket) throw new Error("replaceCredentials() opened no new socket");
    secondSocket.emit("open");
    expect(JSON.parse(secondSocket.sent[0] ?? "")).toEqual({
      action: "auth",
      key: "new-key",
      secret: "new-secret",
    });

    // News: getNews() no longer 401s (fakeFetch would reject an unrecognized key otherwise —
    // both keys are wired here, so this call succeeding at all after the swap is the proof).
    await expect(shared.getNews(["NVDA"])).resolves.toEqual([]);
  });
});
