import type { ServerResponse } from "node:http";
import type { DashboardServerConfig } from "../../src/server/dashboard-server-config.js";
import { serveChain } from "../../src/server/option-chain-route.js";

/**
 * The options ticket's chain data, degrading exactly as the legacy `ticketData` degraded: a bad
 * param 400s, an unlinked session gets an honest note instead of an error, and a broker read
 * failure never blocks the ticket — only the premium estimate goes missing.
 */

function fakeRes() {
  const out: { status?: number; body?: string } = {};
  const res = {
    writeHead: (status: number) => {
      out.status = status;
      return res;
    },
    end: (body?: string) => {
      out.body = body;
    },
  } as unknown as ServerResponse;
  return { res, out };
}

const config = (client: unknown): DashboardServerConfig =>
  ({ optionsClientFor: () => client }) as unknown as DashboardServerConfig;

describe("serveChain", () => {
  it("400s parameters that aren't a symbol and a side", async () => {
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=!!&type=put", config(undefined), "human-ann");
    expect(out.status).toBe(400);
  });

  it("400s a malformed expiration rather than passing it to the broker", async () => {
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=put&exp=not-a-date", config(undefined), "human-ann");
    expect(out.status).toBe(400);
  });

  it("tells an unlinked session the honest note instead of erroring", async () => {
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=put", config(undefined), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    expect(body.chainNote).toContain("isn't linked to one yet");
    expect(body.reason).toBe("unlinked");
  });

  it("serves expirations, the requested expiration's rows, and the premium precomputed", async () => {
    const client = {
      getExpirations: () => Promise.resolve(["2026-09-18", "2026-10-16"]),
      getChain: () =>
        Promise.resolve([{ occSymbol: "NVDA261016P00100000", strike: 100, bid: 2, ask: 3 }]),
      getUnderlyingPrice: () => Promise.resolve(105),
      getUnderlyingQuote: () => Promise.resolve(undefined),
    };
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=put&exp=2026-10-16", config(client), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    expect(body.expiration).toBe("2026-10-16");
    expect(body.spot).toBe(105);
    expect(body.rows[0].premium).toBe(2.5); // the bid/ask mid, computed server-side
  });

  it("carries the quote header's view off the same snapshot, spot = last, no second price read (#3299 slice 1)", async () => {
    let priceReads = 0;
    const client = {
      getExpirations: () => Promise.resolve(["2026-10-16"]),
      getChain: () =>
        Promise.resolve([{ occSymbol: "NVDA261016P00100000", strike: 100, bid: 2, ask: 3 }]),
      getUnderlyingPrice: () => {
        priceReads += 1;
        return Promise.resolve(105);
      },
      getUnderlyingQuote: () =>
        Promise.resolve({ last: 181.32, prevClose: 179.18, bid: 181.28, ask: 181.32 }),
    };
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=put", config(client), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    expect(body.spot).toBe(181.32);
    expect(body.quote).toEqual({
      symbol: "NVDA",
      last: 181.32,
      change: 2.14,
      changePct: 1.19,
      tone: "pos",
      bid: 181.28,
      ask: 181.32,
      mid: 181.3,
    });
    expect(priceReads).toBe(0);
  });

  it("carries volume/delta/gamma/theta/vega when the chain client supplies them, and omits them (never null/0) when it doesn't (#2017 Phase 1 slice 14)", async () => {
    const client = {
      getExpirations: () => Promise.resolve(["2026-09-18", "2026-10-16"]),
      getChain: () =>
        Promise.resolve([
          {
            occSymbol: "NVDA261016P00100000",
            strike: 100,
            bid: 2,
            ask: 3,
            volume: 214,
            delta: -0.42,
            gamma: 0.0138,
            theta: -0.19,
            vega: 0.53,
            rho: 0.01, // out of scope — must NOT appear on the row below
          },
          { occSymbol: "NVDA261016P00105000", strike: 105, bid: 1, ask: 1.5 }, // none supplied
        ]),
      getUnderlyingPrice: () => Promise.resolve(105),
      getUnderlyingQuote: () => Promise.resolve(undefined),
    };
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=put&exp=2026-10-16", config(client), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    const [full, bare] = body.rows;
    expect(full).toMatchObject({
      volume: 214,
      delta: -0.42,
      gamma: 0.0138,
      theta: -0.19,
      vega: 0.53,
    });
    expect(full).not.toHaveProperty("rho");
    for (const key of ["volume", "delta", "gamma", "theta", "vega"]) {
      expect(bare).not.toHaveProperty(key);
    }
  });

  it("reports quote coverage — how many strikes the feed quoted, or unavailable (#3407 P2)", async () => {
    const quoted = {
      getExpirations: () => Promise.resolve(["2026-10-16"]),
      getChain: () =>
        Promise.resolve([
          { occSymbol: "A", strike: 100, bid: 2, ask: 3, quoteSource: "indicative" },
          { occSymbol: "B", strike: 105 },
        ]),
      getUnderlyingPrice: () => Promise.resolve(105),
      getUnderlyingQuote: () => Promise.resolve(undefined),
    };
    const first = fakeRes();
    await serveChain(first.res, "/x?symbol=NVDA&type=put", config(quoted), "human-ann");
    const body = JSON.parse(first.out.body ?? "{}");
    expect(body.quotes).toMatchObject({ source: "indicative", quoted: 1, total: 2 });
    expect(typeof body.quotes.asOf).toBe("string");
    expect(body.rows[0]).not.toHaveProperty("quoteSource"); // provenance rides `quotes`, not each row

    const bare = { ...quoted, getChain: () => Promise.resolve([{ occSymbol: "A", strike: 100 }]) };
    const second = fakeRes();
    await serveChain(second.res, "/x?symbol=NVDA&type=put", config(bare), "human-ann");
    expect(JSON.parse(second.out.body ?? "{}").quotes).toMatchObject({
      source: "unavailable",
      quoted: 0,
      total: 1,
    });
  });

  it("falls back to the first expiration when the requested one isn't listed", async () => {
    const client = {
      getExpirations: () => Promise.resolve(["2026-09-18"]),
      getChain: () => Promise.resolve([]),
      getUnderlyingPrice: () => Promise.resolve(105),
      getUnderlyingQuote: () => Promise.resolve(undefined),
    };
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=put&exp=2026-12-18", config(client), "human-ann");
    expect(JSON.parse(out.body ?? "{}").expiration).toBe("2026-09-18");
  });

  it("gives up gracefully when the underlying has no listed options", async () => {
    const client = {
      getExpirations: () => Promise.resolve([]),
      getChain: () => Promise.resolve([]),
      getUnderlyingPrice: () => Promise.resolve(105),
      getUnderlyingQuote: () => Promise.resolve(undefined),
    };
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=ZZZZ&type=call", config(client), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    expect(body.chainNote).toContain("No listed options found for ZZZZ");
    expect(body.reason).toBe("no-options");
  });

  it("degrades a chain failure to the honest can't-estimate note", async () => {
    const client = { getExpirations: () => Promise.reject(new Error("feed down")) };
    const { res, out } = fakeRes();
    await serveChain(res, "/x?symbol=NVDA&type=call", config(client), "human-ann");
    const body = JSON.parse(out.body ?? "{}");
    expect(body.chainNote).toContain("premiums just can't be estimated");
    expect(body.reason).toBe("failed");
  });
});
