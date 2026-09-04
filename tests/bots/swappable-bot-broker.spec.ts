import type { Bot } from "../../src/bots/bot.js";
import { SwappableBotBroker } from "../../src/bots/swappable-bot-broker.js";
import type { Persona } from "../../src/personas/persona.js";

/** Same fake-fetch shape as `tests/bots/bot-broker.spec.ts`, kept local rather than shared
 *  since each test file's fixture stays small and self-contained. */
function fakeFetch(responses: Record<string, { status: number; body: unknown }>) {
  const requests: { url: string; headers: Record<string, string> }[] = [];
  // biome-ignore lint/suspicious/useAwait: mock must match fetch's async signature
  const fetchFn = (async (url: string | URL, init?: RequestInit) => {
    const u = String(url);
    requests.push({ url: u, headers: (init?.headers ?? {}) as Record<string, string> });
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

function bot(apiKey: string): Bot {
  return { persona: stubPersona, credentials: { apiKey, apiSecret: `secret-for-${apiKey}` } };
}

describe("SwappableBotBroker", () => {
  it("delegates getPortfolio to the broker built from its initial credentials", async () => {
    const { fetchFn, requests } = fakeFetch({
      "/v2/account": {
        status: 200,
        body: { id: "a1", cash: "100", portfolio_value: "100", status: "ACTIVE" },
      },
      "/v2/positions": { status: 200, body: [] },
    });
    const original = globalThis.fetch;
    globalThis.fetch = fetchFn;
    try {
      const broker = new SwappableBotBroker(bot("OLD-KEY"));
      await broker.getPortfolio();
      expect(requests[0]?.headers["APCA-API-KEY-ID"]).toBe("OLD-KEY");
    } finally {
      globalThis.fetch = original;
    }
  });

  it("uses the new credentials on the next call after replaceCredentials, not before", async () => {
    const { fetchFn, requests } = fakeFetch({
      "/v2/account": {
        status: 200,
        body: { id: "a1", cash: "100", portfolio_value: "100", status: "ACTIVE" },
      },
      "/v2/positions": { status: 200, body: [] },
    });
    const original = globalThis.fetch;
    globalThis.fetch = fetchFn;
    try {
      const broker = new SwappableBotBroker(bot("OLD-KEY"));
      await broker.getPortfolio();
      expect(requests[0]?.headers["APCA-API-KEY-ID"]).toBe("OLD-KEY");
      const beforeSwap = requests.length;

      broker.replaceCredentials({ apiKey: "NEW-KEY", apiSecret: "new-secret" });
      await broker.getPortfolio();

      const afterSwap = requests.slice(beforeSwap);
      expect(afterSwap.length).toBeGreaterThan(0);
      for (const r of afterSwap) {
        expect(r.headers["APCA-API-KEY-ID"]).toBe("NEW-KEY");
        expect(r.headers["APCA-API-SECRET-KEY"]).toBe("new-secret");
      }
    } finally {
      globalThis.fetch = original;
    }
  });

  it("reports a filled order through the current broker after a swap", async () => {
    const { fetchFn } = fakeFetch({
      "/v2/orders": {
        status: 200,
        body: { id: "o1", symbol: "AAPL", qty: "1", side: "buy", status: "accepted" },
      },
    });
    const original = globalThis.fetch;
    globalThis.fetch = fetchFn;
    try {
      const broker = new SwappableBotBroker(bot("OLD-KEY"));
      broker.replaceCredentials({ apiKey: "NEW-KEY", apiSecret: "new-secret" });
      const intent = {
        symbol: "AAPL",
        quantity: 1,
        side: "buy" as const,
        type: "market" as const,
        reason: "test",
      };

      const result = await broker.submit(intent);

      expect(result).toEqual({ intent, status: "filled", filledQuantity: 1, orderId: "o1" });
    } finally {
      globalThis.fetch = original;
    }
  });
});
