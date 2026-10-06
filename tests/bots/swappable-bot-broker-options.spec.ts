import type { Bot } from "../../src/bots/bot.js";
import { SwappableBotBroker } from "../../src/bots/swappable-bot-broker.js";
import type { Persona } from "../../src/personas/persona.js";
import { anOptionIntent } from "../support/builders.js";

// The bot's broker is also its option market and option order tracker (#4642 slice 5): it owns
// the credentials AND outlives a rotation, so an order left working — and the quote caches — carry
// over to the rebuilt client, while every read after the rotation uses the new key.

interface Seen {
  readonly method: string;
  readonly url: string;
  readonly key: string | undefined;
}

/** Answers by `METHOD path` (the pathname, query dropped); anything unscripted is a 404. */
function fakeFetch(routes: Record<string, unknown>) {
  const seen: Seen[] = [];
  // biome-ignore lint/suspicious/useAwait: mock must match fetch's async signature
  const fetchFn = (async (url: string | URL, init?: RequestInit) => {
    const u = new URL(String(url));
    const method = init?.method ?? "GET";
    const headers = (init?.headers ?? {}) as Record<string, string>;
    seen.push({ method, url: String(url), key: headers["APCA-API-KEY-ID"] });
    const body = routes[`${method} ${u.pathname}`];
    return {
      status: body === undefined ? 404 : 200,
      text: async () => JSON.stringify(body ?? { message: "not found" }),
    } as unknown as Response;
  }) as unknown as typeof fetch;
  return { fetchFn, seen };
}

const persona: Persona = { id: "sauron", name: "Sauron", thesis: "n/a", decide: () => [] };
const bot: Bot = { persona, credentials: { apiKey: "OLD-KEY", apiSecret: "old" } };
const PUT = "CRWV261106P00085000";

async function withFetch<T>(fetchFn: typeof fetch, run: () => Promise<T>): Promise<T> {
  const original = globalThis.fetch;
  globalThis.fetch = fetchFn;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

describe("SwappableBotBroker — options", () => {
  it("hands an option order to the option flow, and keeps one it could not cancel pending across a rotation", async () => {
    const working = { id: "o1", symbol: PUT, qty: "1", side: "sell", status: "pending_cancel" };
    const { fetchFn, seen } = fakeFetch({
      "GET /v2/account": {
        id: "a",
        cash: "50000",
        portfolio_value: "50000",
        status: "ACTIVE",
        options_trading_level: 1,
      },
      "GET /v2/positions": [],
      "GET /v2/orders": [],
      "GET /v1beta1/options/snapshots": {
        snapshots: { [PUT]: { latestQuote: { bp: 2, ap: 2.2, t: new Date().toISOString() } } },
      },
      "POST /v2/orders": { ...working, status: "new" },
      "GET /v2/orders/o1": working,
      "DELETE /v2/orders/o1": null,
    });
    await withFetch(fetchFn, async () => {
      const broker = new SwappableBotBroker(bot, {
        optionOrderTiming: { waitMs: 0, settleAttempts: 0 },
      });
      const result = await broker.submit(
        anOptionIntent({ clientOrderId: "sk1-sauron-CRWV-mg1x2-0" }),
      );
      expect(result).toMatchObject({ status: "working", orderId: "o1" });
      expect(seen.find((s) => s.method === "POST")?.url).toContain("paper-api.alpaca.markets");

      broker.replaceCredentials({ apiKey: "NEW-KEY", apiSecret: "new" });
      const before = seen.length;
      expect([...(await broker.settle())]).toEqual(["CRWV"]);
      const after = seen.slice(before);
      expect(after.map((s) => `${s.method} ${new URL(s.url).pathname}`)).toEqual([
        "GET /v2/orders/o1",
        "DELETE /v2/orders/o1",
      ]);
      expect(after.every((s) => s.key === "NEW-KEY")).toBe(true);
    });
  });

  it("reads option quotes with the credentials in force at that moment, from the data host", async () => {
    const { fetchFn, seen } = fakeFetch({
      "GET /v2/options/contracts": { option_contracts: [] },
    });
    await withFetch(fetchFn, async () => {
      const broker = new SwappableBotBroker(bot);
      const request = (asOf: string) => ({
        asOf,
        underlyings: ["CRWV"],
        skip: new Set<string>(),
        demand: () => ({ chains: [], contracts: [PUT] }),
      });
      await broker.readOptionMarket(request("2026-10-07T15:00:00Z"));
      broker.replaceCredentials({ apiKey: "NEW-KEY", apiSecret: "new" });
      await broker.readOptionMarket(request("2026-10-08T15:00:00Z"));

      const expirations = seen.filter((s) => s.url.includes("/v2/options/contracts"));
      expect(expirations.map((s) => s.key)).toEqual(["OLD-KEY", "NEW-KEY"]);
      const snapshots = seen.filter((s) => s.url.includes("/v1beta1/options/snapshots"));
      expect(snapshots[0]?.url).toContain("data.alpaca.markets");
    });
  });
});
