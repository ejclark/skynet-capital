import { AlpacaOptionsClient, rowPremium } from "../../src/alpaca/alpaca-options-client.js";
import type { AlpacaTradingTransport } from "../../src/alpaca/trading-transport.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";

/** Substring-keyed fake transport, in the alpaca-connect.spec.ts style. */
function fakeTransport(
  routes: Record<string, unknown>,
  log: Array<{ path: string; body?: unknown }> = [],
): AlpacaTradingTransport {
  const respond = (path: string): Promise<JsonResponse> => {
    const hit = Object.entries(routes).find(([key]) => path.includes(key));
    return Promise.resolve(hit ? { status: 200, body: hit[1] } : { status: 404, body: null });
  };
  return {
    get: (path) => {
      log.push({ path });
      return respond(path);
    },
    post: (path, body) => {
      log.push({ path, body });
      return respond(path);
    },
    delete: (path) => {
      log.push({ path });
      return respond(path);
    },
  };
}

const contract = (symbol: string, expiration: string, strike: string, extra = {}) => ({
  symbol,
  expiration_date: expiration,
  strike_price: strike,
  type: "put",
  ...extra,
});

describe("AlpacaOptionsClient", () => {
  it("derives sorted, deduped expirations from one contracts page", async () => {
    const client = new AlpacaOptionsClient(
      fakeTransport({
        "/v2/options/contracts?": {
          option_contracts: [
            contract("A", "2026-10-16", "100"),
            contract("B", "2026-09-18", "100"),
            contract("C", "2026-09-18", "105"),
          ],
        },
      }),
    );
    expect(await client.getExpirations("MSFT", "2026-08-19")).toEqual(["2026-09-18", "2026-10-16"]);
  });

  it("returns the chain strikes ascending, dropping untradable and unpriced-strike rows", async () => {
    const client = new AlpacaOptionsClient(
      fakeTransport({
        "/v2/options/contracts?": {
          option_contracts: [
            contract("MSFT260918P00430000", "2026-09-18", "430", { close_price: "14.1" }),
            contract("MSFT260918P00420000", "2026-09-18", "420", {
              close_price: "10.7",
              open_interest: "812",
            }),
            contract("DEAD", "2026-09-18", "425", { tradable: false }),
          ],
        },
      }),
    );
    const chain = await client.getChain("MSFT", "2026-09-18", "put");
    expect(chain.map((r) => r.strike)).toEqual([420, 430]);
    expect(chain[0]).toMatchObject({ closePrice: 10.7, openInterest: 812 });
  });

  it("merges indicative quotes from the data host, and fails SOFT when it errors", async () => {
    const withQuotes = new AlpacaOptionsClient(
      fakeTransport({
        "/v2/options/contracts?": {
          option_contracts: [
            contract("MSFT260918P00420000", "2026-09-18", "420", { close_price: "10.7" }),
          ],
        },
      }),
      fakeTransport({
        "/v1beta1/options/snapshots/MSFT": {
          snapshots: {
            MSFT260918P00420000: {
              latestQuote: { bp: 10.5, ap: 10.9 },
              greeks: { delta: -0.42 },
            },
          },
        },
      }),
    );
    const chain = await withQuotes.getChain("MSFT", "2026-09-18", "put");
    expect(chain[0]).toMatchObject({ bid: 10.5, ask: 10.9, delta: -0.42 });
    expect(rowPremium(chain[0] as never)).toBeCloseTo(10.7); // the mid

    const dataDown = new AlpacaOptionsClient(
      fakeTransport({
        "/v2/options/contracts?": {
          option_contracts: [
            contract("MSFT260918P00420000", "2026-09-18", "420", { close_price: "10.7" }),
          ],
        },
      }),
      fakeTransport({}), // every data-host call 404s
    );
    const bare = await dataDown.getChain("MSFT", "2026-09-18", "put");
    expect(bare[0]?.bid).toBeUndefined();
    expect(rowPremium(bare[0] as never)).toBe(10.7); // falls back to last close
  });

  it("carries all five greeks the snapshot quotes, negatives and zeros included", async () => {
    const client = new AlpacaOptionsClient(
      fakeTransport({
        "/v2/options/contracts?": {
          option_contracts: [
            contract("MSFT260918P00420000", "2026-09-18", "420", { close_price: "10.7" }),
          ],
        },
      }),
      fakeTransport({
        "/v1beta1/options/snapshots/MSFT": {
          snapshots: {
            MSFT260918P00420000: {
              latestQuote: { bp: 10.5, ap: 10.9 },
              // A real put: negative delta, negative theta, and a rho that rounds to a true zero.
              greeks: { delta: -0.42, gamma: 0.0138, theta: -0.19, vega: 0.53, rho: 0 },
            },
          },
        },
      }),
    );
    const chain = await client.getChain("MSFT", "2026-09-18", "put");
    expect(chain[0]).toMatchObject({
      delta: -0.42,
      gamma: 0.0138,
      theta: -0.19,
      vega: 0.53,
      rho: 0,
    });
  });

  it("OMITS any greek the feed left missing, null or non-finite — never a false zero", async () => {
    const client = new AlpacaOptionsClient(
      fakeTransport({
        "/v2/options/contracts?": {
          option_contracts: [
            contract("A", "2026-09-18", "410"),
            contract("B", "2026-09-18", "420"),
            contract("C", "2026-09-18", "430"),
          ],
        },
      }),
      fakeTransport({
        "/v1beta1/options/snapshots/MSFT": {
          snapshots: {
            // Each greek gets its own way of being absent — none may surface as a number.
            A: { greeks: { delta: -0.31, gamma: null, theta: "", vega: "not-a-number", rho: NaN } },
            // Shapes `Number()` would happily coerce: [] -> 0, true -> 1, {} -> NaN.
            B: { greeks: { delta: [], gamma: true, theta: {}, vega: [0.5], rho: undefined } },
            C: { latestQuote: { bp: 1.1, ap: 1.3 } }, // no greeks block at all
          },
        },
      }),
    );
    const [a, b, c] = await client.getChain("MSFT", "2026-09-18", "put");
    expect(a).toMatchObject({ delta: -0.31 });
    for (const key of ["gamma", "theta", "vega", "rho"] as const) {
      expect(a?.[key]).toBeUndefined();
      expect(a).not.toHaveProperty(key);
    }
    for (const key of ["delta", "gamma", "theta", "vega", "rho"] as const) {
      expect(b?.[key]).toBeUndefined();
      expect(b).not.toHaveProperty(key);
      expect(c?.[key]).toBeUndefined();
    }
    expect(c).toMatchObject({ bid: 1.1, ask: 1.3 }); // quotes still merge without greeks
  });

  it("parses greeks that arrive as numeric strings, as the contracts endpoint does", async () => {
    const client = new AlpacaOptionsClient(
      fakeTransport({
        "/v2/options/contracts?": {
          option_contracts: [contract("MSFT260918P00420000", "2026-09-18", "420")],
        },
      }),
      fakeTransport({
        "/v1beta1/options/snapshots/MSFT": {
          snapshots: {
            MSFT260918P00420000: { greeks: { delta: "-0.42", theta: "-0.19" } },
          },
        },
      }),
    );
    const chain = await client.getChain("MSFT", "2026-09-18", "put");
    expect(chain[0]).toMatchObject({ delta: -0.42, theta: -0.19 });
    expect(chain[0]?.vega).toBeUndefined();
  });

  it("reads one contract by symbol and answers undefined for a 404", async () => {
    const client = new AlpacaOptionsClient(
      fakeTransport({
        "/v2/options/contracts/MSFT260918P00420000": contract(
          "MSFT260918P00420000",
          "2026-09-18",
          "420",
        ),
      }),
    );
    expect((await client.getContract("MSFT260918P00420000"))?.strike_price).toBe("420");
    expect(await client.getContract("MSFT260918P00990000")).toBeUndefined();
  });

  it("places option orders day-only, with position intent, and limit price only on limits", async () => {
    const log: Array<{ path: string; body?: unknown }> = [];
    const client = new AlpacaOptionsClient(
      fakeTransport(
        { "/v2/orders": { id: "o1", symbol: "MSFT260918P00420000", status: "accepted" } },
        log,
      ),
    );
    await client.placeOptionOrder({
      occSymbol: "MSFT260918P00420000",
      contracts: 2,
      side: "sell",
      type: "limit",
      limitPrice: 10.7,
      positionIntent: "sell_to_open",
    });
    expect(log[0]?.body).toEqual({
      symbol: "MSFT260918P00420000",
      qty: 2,
      side: "sell",
      type: "limit",
      limit_price: 10.7,
      time_in_force: "day",
      position_intent: "sell_to_open",
    });

    await client.placeOptionOrder({
      occSymbol: "MSFT260918P00420000",
      contracts: 1,
      side: "buy",
      type: "market",
      positionIntent: "buy_to_close",
    });
    expect(log[1]?.body).not.toHaveProperty("limit_price");
    expect(log[1]?.body).toMatchObject({ time_in_force: "day" });
  });

  it("underlying price fails soft with no data transport and on error", async () => {
    const bare = new AlpacaOptionsClient(fakeTransport({}));
    expect(await bare.getUnderlyingPrice("MSFT")).toBeUndefined();
    const priced = new AlpacaOptionsClient(
      fakeTransport({}),
      fakeTransport({ "/v2/stocks/MSFT/trades/latest": { trade: { p: 428.6 } } }),
    );
    expect(await priced.getUnderlyingPrice("MSFT")).toBe(428.6);
  });

  describe("getOptionLifecycleActivities (#468 criterion 6)", () => {
    it("reads the four lifecycle activity types, newest first, from the trading transport", async () => {
      const log: Array<{ path: string; body?: unknown }> = [];
      const rows = [
        {
          id: "a1",
          activity_type: "OPEXP",
          symbol: "MSFT260918P00420000",
          qty: "2",
          date: "2026-09-19",
        },
      ];
      const client = new AlpacaOptionsClient(
        fakeTransport({ "/v2/account/activities": rows }, log),
      );
      expect(await client.getOptionLifecycleActivities()).toEqual(rows);
      expect(log[0]?.path).toContain("activity_types=OPEXP%2COPASN%2COPEXC%2COPTRD");
    });

    it("passes a cursor as page_token when given one", async () => {
      const log: Array<{ path: string; body?: unknown }> = [];
      const client = new AlpacaOptionsClient(fakeTransport({ "/v2/account/activities": [] }, log));
      await client.getOptionLifecycleActivities("act-1");
      expect(log[0]?.path).toContain("page_token=act-1");
    });

    it("fails soft to an empty array on a non-2xx response or a malformed body", async () => {
      const errClient = new AlpacaOptionsClient(fakeTransport({}));
      expect(await errClient.getOptionLifecycleActivities()).toEqual([]);
      const badShapeClient = new AlpacaOptionsClient(
        fakeTransport({ "/v2/account/activities": { not: "an array" } }),
      );
      expect(await badShapeClient.getOptionLifecycleActivities()).toEqual([]);
    });

    it("fails soft when the transport itself throws", async () => {
      const throwing: AlpacaTradingTransport = {
        get: () => Promise.reject(new Error("network down")),
        post: () => Promise.reject(new Error("unused")),
        delete: () => Promise.reject(new Error("unused")),
      };
      const client = new AlpacaOptionsClient(throwing);
      expect(await client.getOptionLifecycleActivities()).toEqual([]);
    });
  });
});
