import { FetchAlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";

/** Capture the headers fetchJson sends, without any network. */
function captureHeaders(): { captured: { headers: Record<string, string> }; restore: () => void } {
  const original = globalThis.fetch;
  const captured: { headers: Record<string, string> } = { headers: {} };
  // biome-ignore lint/suspicious/useAwait: mock must match fetch's async signature
  globalThis.fetch = (async (_url: string | URL, init?: RequestInit) => {
    captured.headers = (init?.headers ?? {}) as Record<string, string>;
    return { status: 200, text: async () => "{}" } as unknown as Response;
  }) as unknown as typeof fetch;
  return {
    captured,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

describe("FetchAlpacaTradingTransport auth headers", () => {
  it("uses the classic APCA key/secret headers when no token is present", async () => {
    const cap = captureHeaders();
    const t = new FetchAlpacaTradingTransport({
      baseUrl: "https://paper-api.alpaca.markets",
      apiKey: "KID",
      apiSecret: "SECRET",
    });
    await t.get("/v2/account");
    cap.restore();
    expect(cap.captured.headers["APCA-API-KEY-ID"]).toBe("KID");
    expect(cap.captured.headers["APCA-API-SECRET-KEY"]).toBe("SECRET");
    expect(cap.captured.headers.Authorization).toBeUndefined();
  });

  it("uses an OAuth Bearer header when an accessToken is present (and omits key/secret)", async () => {
    const cap = captureHeaders();
    const t = new FetchAlpacaTradingTransport({
      baseUrl: "https://paper-api.alpaca.markets",
      apiKey: "",
      apiSecret: "",
      accessToken: "tok-123",
    });
    await t.post("/v2/orders", { symbol: "AAPL" });
    cap.restore();
    expect(cap.captured.headers.Authorization).toBe("Bearer tok-123");
    expect(cap.captured.headers["APCA-API-KEY-ID"]).toBeUndefined();
    expect(cap.captured.headers["APCA-API-SECRET-KEY"]).toBeUndefined();
  });
});
