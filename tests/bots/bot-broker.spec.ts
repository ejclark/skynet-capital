import type { Bot } from "../../src/bots/bot.js";
import { ALPACA_PAPER_BASE_URL } from "../../src/bots/bot.js";
import { createBotBroker } from "../../src/bots/bot-broker.js";
import type { Persona } from "../../src/personas/persona.js";

/**
 * Fake `fetch` that records every request and serves canned Alpaca responses, so
 * `createBotBroker`'s wiring (transport → client → adapter) is exercised without any
 * network calls or real credentials.
 */
function fakeFetch(responses: Record<string, { status: number; body: unknown }>) {
  const requests: { url: string; method: string; headers: Record<string, string> }[] = [];
  // biome-ignore lint/suspicious/useAwait: mock must match fetch's async signature
  const fetchFn = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    requests.push({
      url: u,
      method: init?.method ?? "GET",
      headers: (init?.headers ?? {}) as Record<string, string>,
    });
    const path = new URL(u).pathname;
    const match = responses[path] ?? { status: 404, body: { message: "not found" } };
    return {
      status: match.status,
      text: async () => JSON.stringify(match.body),
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return { fetchFn, requests };
}

const stubPersona: Persona = {
  id: "test-persona",
  name: "Test Persona",
  thesis: "n/a",
  decide: () => [],
};

function bot(overrides: Partial<Bot["credentials"]> = {}): Bot {
  return {
    persona: stubPersona,
    credentials: { apiKey: "KID", apiSecret: "SECRET", ...overrides },
  };
}

describe("createBotBroker", () => {
  it("targets the default paper endpoint and authenticates with the bot's key/secret", async () => {
    const { fetchFn, requests } = fakeFetch({
      "/v2/account": {
        status: 200,
        body: { id: "a1", cash: "1000", portfolio_value: "1000", status: "ACTIVE" },
      },
      "/v2/positions": { status: 200, body: [] },
    });
    const original = globalThis.fetch;
    globalThis.fetch = fetchFn;
    try {
      const broker = createBotBroker(bot());
      const portfolio = await broker.getPortfolio();

      expect(portfolio).toEqual({ cash: 1000, positions: [] });
      expect(requests.every((r) => r.url.startsWith(ALPACA_PAPER_BASE_URL))).toBe(true);
      expect(requests[0]?.headers["APCA-API-KEY-ID"]).toBe("KID");
      expect(requests[0]?.headers["APCA-API-SECRET-KEY"]).toBe("SECRET");
    } finally {
      globalThis.fetch = original;
    }
  });

  it("honors a bot's custom baseUrl instead of the paper default", async () => {
    const { fetchFn, requests } = fakeFetch({
      "/v2/account": {
        status: 200,
        body: { id: "a1", cash: "50", portfolio_value: "50", status: "ACTIVE" },
      },
      "/v2/positions": { status: 200, body: [] },
    });
    const original = globalThis.fetch;
    globalThis.fetch = fetchFn;
    try {
      const broker = createBotBroker(bot({ baseUrl: "https://custom.example.com" }));
      await broker.getPortfolio();

      expect(requests[0]?.url.startsWith("https://custom.example.com")).toBe(true);
    } finally {
      globalThis.fetch = original;
    }
  });

  // BUG: createBotBroker builds the FetchAlpacaTradingTransport with only
  // { baseUrl, apiKey, apiSecret } — it never forwards bot.credentials.accessToken. A bot
  // connected via OAuth ("Connect with Alpaca") therefore silently authenticates with a
  // blank key/secret pair instead of its Bearer token. Skipped rather than asserting the
  // current (broken) behavior; un-skip once bot-broker.ts forwards accessToken through.
  it.todo(
    "authenticates with a Bearer token when the bot has an accessToken, omitting key/secret headers",
  );

  it("reports a filled order when the wired broker's submit is accepted by the API", async () => {
    const { fetchFn } = fakeFetch({
      "/v2/orders": {
        status: 200,
        body: { id: "o1", symbol: "AAPL", qty: "2", side: "buy", status: "accepted" },
      },
    });
    const original = globalThis.fetch;
    globalThis.fetch = fetchFn;
    try {
      const broker = createBotBroker(bot());
      const intent = {
        symbol: "AAPL",
        quantity: 2,
        side: "buy" as const,
        type: "market" as const,
        reason: "test",
      };
      const result = await broker.submit(intent);

      expect(result).toEqual({
        intent,
        status: "filled",
        filledQuantity: 2,
        orderId: "o1",
      });
    } finally {
      globalThis.fetch = original;
    }
  });

  it("reports a rejected order when the wired broker's submit is rejected by the API", async () => {
    const { fetchFn } = fakeFetch({
      "/v2/orders": {
        status: 200,
        body: { id: "o1", symbol: "AAPL", qty: "2", side: "buy", status: "rejected" },
      },
    });
    const original = globalThis.fetch;
    globalThis.fetch = fetchFn;
    try {
      const broker = createBotBroker(bot());
      const intent = {
        symbol: "AAPL",
        quantity: 2,
        side: "buy" as const,
        type: "market" as const,
        reason: "test",
      };
      const result = await broker.submit(intent);

      expect(result.status).toBe("rejected");
    } finally {
      globalThis.fetch = original;
    }
  });
});
