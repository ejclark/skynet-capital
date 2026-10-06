import {
  AlpacaOptionMarket,
  MAX_CHAIN_READS_PER_REFRESH,
  type OptionMarketReader,
} from "../../src/adapters/alpaca-option-market.js";
import type { ContractSnapshot, OptionChainRow } from "../../src/alpaca/alpaca-options-client.js";
import {
  type ListedExpirations,
  NO_OPTION_DEMAND,
  type OptionDemand,
  type OptionMarketRequest,
} from "../../src/domain/types.js";

// The option market port (#4642 slice 5): expirations once per underlying per ET day, chains and
// named contracts TTL-cached and bounded, nothing read for a skipped underlying, never a throw.

const AS_OF = "2026-10-07T15:00:00.000Z"; // 11:00 ET
const PUT = "CRWV261106P00085000";
const HELD = "NVDA261113C00190000";

class FakeReader implements OptionMarketReader {
  readonly calls: string[] = [];
  failExpirations = false;
  failChainFor = new Set<string>();
  failSnapshots = false;
  chainRows: OptionChainRow[] = [
    {
      occSymbol: PUT,
      strike: 85,
      bid: 2,
      ask: 2.2,
      delta: -0.21,
      openInterest: 1200,
      quotedAt: "2026-10-07T14:59:00Z",
    },
  ];

  getExpirations(underlying: string, onOrAfter: string): Promise<string[]> {
    this.calls.push(`expirations ${underlying} ${onOrAfter}`);
    if (this.failExpirations) return Promise.reject(new Error("503"));
    return Promise.resolve(["2026-10-30", "2026-11-06"]);
  }

  getChain(
    underlying: string,
    expiration: string,
    type: "call" | "put",
  ): Promise<OptionChainRow[]> {
    this.calls.push(`chain ${underlying} ${expiration} ${type}`);
    if (this.failChainFor.has(expiration)) return Promise.reject(new Error("429"));
    return Promise.resolve(this.chainRows);
  }

  getContractSnapshots(occSymbols: readonly string[]): Promise<Map<string, ContractSnapshot>> {
    this.calls.push(`snapshots ${occSymbols.join(",")}`);
    if (this.failSnapshots) return Promise.reject(new Error("socket hang up"));
    return Promise.resolve(
      new Map(
        occSymbols.map((occ) => [
          occ,
          { bid: 4.1, ask: 4.3, greeks: { delta: 0.48 }, quotedAt: "2026-10-07T14:58:00Z" },
        ]),
      ),
    );
  }
}

function harness(start = Date.parse(AS_OF)) {
  const reader = new FakeReader();
  let now = start;
  let built = 0;
  const market = new AlpacaOptionMarket(
    () => {
      built += 1;
      return reader;
    },
    { now: () => now },
  );
  return {
    reader,
    market,
    built: () => built,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

function request(
  over: Partial<OptionMarketRequest> = {},
  demand?: OptionDemand,
): OptionMarketRequest {
  return {
    asOf: AS_OF,
    underlyings: ["CRWV"],
    skip: new Set(),
    demand: () =>
      demand ?? {
        chains: [{ underlying: "CRWV", expiration: "2026-11-06", type: "put" }],
        contracts: [],
      },
    ...over,
  };
}

describe("AlpacaOptionMarket", () => {
  it("costs no network at all when nothing is traded and nothing is asked for", async () => {
    const h = harness();
    const market = await h.market.readOptionMarket(
      request({ underlyings: [], demand: () => NO_OPTION_DEMAND }),
    );
    expect(market).toEqual({ listed: {}, contracts: {} });
    expect(h.reader.calls).toEqual([]);
  });

  it("reads the listed expirations once per underlying per ET day and hands them to the demand", async () => {
    const h = harness();
    const seen: ListedExpirations[] = [];
    const req = request({
      demand: (listed) => {
        seen.push(listed);
        return NO_OPTION_DEMAND;
      },
    });
    await h.market.readOptionMarket(req);
    await h.market.readOptionMarket(req);
    expect(seen[1]).toEqual({ CRWV: ["2026-10-30", "2026-11-06"] });
    expect(h.reader.calls).toEqual(["expirations CRWV 2026-10-07"]);

    // The next ET day reads again.
    await h.market.readOptionMarket({ ...req, asOf: "2026-10-08T14:00:00Z" });
    expect(h.reader.calls).toEqual(["expirations CRWV 2026-10-07", "expirations CRWV 2026-10-08"]);
  });

  it("does not cache a failed expirations read — the next cycle tries again", async () => {
    const h = harness();
    h.reader.failExpirations = true;
    const first = await h.market.readOptionMarket(request());
    expect(first?.listed).toEqual({});
    h.reader.failExpirations = false;
    const second = await h.market.readOptionMarket(request());
    expect(second?.listed).toEqual({ CRWV: ["2026-10-30", "2026-11-06"] });
  });

  it("maps a chain's rows to quotes stamped with when this process read them", async () => {
    const h = harness();
    const market = await h.market.readOptionMarket(request());
    expect(market?.contracts[PUT]).toEqual({
      occSymbol: PUT,
      underlying: "CRWV",
      type: "put",
      strike: 85,
      expiration: "2026-11-06",
      bid: 2,
      ask: 2.2,
      delta: -0.21,
      openInterest: 1200,
      quotedAt: "2026-10-07T14:59:00Z",
      fetchedAt: AS_OF,
    });
  });

  it("serves a chain from cache inside its 60s TTL, then reads it again", async () => {
    const h = harness();
    await h.market.readOptionMarket(request());
    h.advance(59_000);
    const cached = await h.market.readOptionMarket(request());
    expect(cached?.contracts[PUT]?.fetchedAt).toBe(AS_OF);
    expect(h.reader.calls.filter((c) => c.startsWith("chain"))).toHaveLength(1);
    h.advance(1_000);
    await h.market.readOptionMarket(request());
    expect(h.reader.calls.filter((c) => c.startsWith("chain"))).toHaveLength(2);
  });

  it("keeps no chain whose quote feed came back empty, so the next cycle can get the quotes", async () => {
    const h = harness();
    h.reader.chainRows = [{ occSymbol: PUT, strike: 85, closePrice: 2.4 }];
    await h.market.readOptionMarket(request());
    await h.market.readOptionMarket(request());
    expect(h.reader.calls.filter((c) => c.startsWith("chain"))).toHaveLength(2);
  });

  it(`reads at most ${MAX_CHAIN_READS_PER_REFRESH} chains from the network per refresh`, async () => {
    const h = harness();
    const expirations = ["10-09", "10-16", "10-23", "10-30", "11-06", "11-13"].map(
      (d) => `2026-${d}`,
    );
    await h.market.readOptionMarket(
      request(
        {},
        {
          chains: expirations.map((expiration) => ({
            underlying: "CRWV",
            expiration,
            type: "put" as const,
          })),
          contracts: [],
        },
      ),
    );
    expect(h.reader.calls.filter((c) => c.startsWith("chain"))).toHaveLength(
      MAX_CHAIN_READS_PER_REFRESH,
    );
  });

  it("reads nothing at all for a skipped underlying — no expirations, chain or contract", async () => {
    const h = harness();
    const market = await h.market.readOptionMarket(
      request(
        { underlyings: ["CRWV", "NVDA"], skip: new Set(["CRWV", "NVDA"]) },
        {
          chains: [{ underlying: "CRWV", expiration: "2026-11-06", type: "put" }],
          contracts: [HELD],
        },
      ),
    );
    expect(h.reader.calls).toEqual([]);
    expect(market).toEqual({ listed: {}, contracts: {} });
  });

  it("reads a held contract by snapshot, its strike, type and expiry from the OCC symbol", async () => {
    const h = harness();
    const market = await h.market.readOptionMarket(
      request({ underlyings: [] }, { chains: [], contracts: [HELD] }),
    );
    expect(market?.contracts[HELD]).toEqual({
      occSymbol: HELD,
      underlying: "NVDA",
      type: "call",
      strike: 190,
      expiration: "2026-11-13",
      bid: 4.1,
      ask: 4.3,
      delta: 0.48,
      quotedAt: "2026-10-07T14:58:00Z",
      fetchedAt: AS_OF,
    });
    // Cached for 30s; a contract the chain already carried is never read twice.
    await h.market.readOptionMarket(request({}, { chains: [], contracts: [HELD] }));
    await h.market.readOptionMarket(
      request(
        {},
        {
          chains: [{ underlying: "CRWV", expiration: "2026-11-06", type: "put" }],
          contracts: [PUT],
        },
      ),
    );
    expect(h.reader.calls.filter((c) => c.startsWith("snapshots"))).toEqual([`snapshots ${HELD}`]);
  });

  it("fails soft piece by piece: a failed chain or snapshot read leaves the rest intact", async () => {
    const h = harness();
    h.reader.failChainFor.add("2026-10-30");
    h.reader.failSnapshots = true;
    const market = await h.market.readOptionMarket(
      request(
        {},
        {
          chains: [
            { underlying: "CRWV", expiration: "2026-10-30", type: "put" },
            { underlying: "CRWV", expiration: "2026-11-06", type: "put" },
          ],
          contracts: [HELD],
        },
      ),
    );
    expect(Object.keys(market?.contracts ?? {})).toEqual([PUT]);
    expect(market?.listed).toEqual({ CRWV: ["2026-10-30", "2026-11-06"] });
  });

  it("never throws: a demand that throws reads as no quotes this cycle", async () => {
    const h = harness();
    const market = await h.market.readOptionMarket(
      request({
        demand: () => {
          throw new Error("bug in a playbook");
        },
      }),
    );
    expect(market).toBeUndefined();
  });

  it("builds its client at call time, so a rotated key is used on the very next cycle", async () => {
    const h = harness();
    await h.market.readOptionMarket(request());
    await h.market.readOptionMarket(request());
    expect(h.built()).toBe(2);
  });
});
