import {
  atmIv,
  expectedMove,
  expiriesOf,
  normalizeChain,
  parseOsi,
  putAtDelta,
  spreadPct,
} from "../../scripts/research/option-chain.mjs";

/**
 * The chain reducers behind the premium-fit instrument (#4469 slice 1).
 *
 * Specified against a hand-built chain rather than a captured Cboe payload: the behaviours worth
 * pinning are the REFUSALS — an empty chain, a one-sided book, a contract Cboe could not solve —
 * and a real payload has none of them on a liquid name. Each is a way a fit study could emit a
 * confident number with nothing behind it, which is the failure this instrument exists to avoid.
 */

const option = (
  osi: string,
  over: Partial<{ bid: number; ask: number; iv: number; delta: number; oi: number }> = {},
) => ({
  option: osi,
  bid: over.bid ?? 1,
  ask: over.ask ?? 1.1,
  iv: over.iv ?? 0.5,
  delta: over.delta ?? -0.2,
  open_interest: over.oi ?? 500,
  volume: 10,
});

const payload = (options: object[], spot = 100) => ({
  timestamp: "2026-10-02 20:35:35",
  data: { symbol: "TEST", current_price: spot, iv30: 55.5, options },
});

describe("parseOsi", () => {
  it("splits a standard contract symbol into root, expiry, right and strike", () => {
    expect(parseOsi("CRWV261002C00050000")).toEqual({
      root: "CRWV",
      expiry: "2026-10-02",
      right: "C",
      strike: 50,
    });
  });

  it("parses a fractional strike without floating-point drift", () => {
    expect(parseOsi("CRWV261106P00082500").strike).toBe(82.5);
  });

  it("parses an adjusted-series root rather than throwing — a wheel must be able to SEE one", () => {
    expect(parseOsi("1CRWV261106P00082500").root).toBe("1CRWV");
  });

  it("refuses something that is not a contract symbol", () => {
    expect(() => parseOsi("CRWV")).toThrow(/not an OSI contract symbol/);
  });
});

describe("normalizeChain", () => {
  it("converts Cboe's vol points to the decimal everything downstream reads", () => {
    expect(normalizeChain(payload([option("TEST261106P00090000")])).iv30).toBeCloseTo(0.555, 12);
  });

  it("refuses a payload with no options array instead of reporting an empty chain", () => {
    expect(() => normalizeChain({ data: { current_price: 100 } })).toThrow(
      /no `data.options` array/,
    );
  });

  it("refuses a chain that came back with zero contracts", () => {
    expect(() => normalizeChain(payload([]))).toThrow(/zero contracts/);
  });

  it("refuses a payload with no usable iv30 — the fit test's whole numerator", () => {
    // The failure this prevents: a missing iv30 becomes NaN, percentileRank counts zero values
    // below it, and the run prints a graded "STAND ASIDE" off an input that was never there.
    const raw = payload([option("TEST261106P00090000")]);
    raw.data.iv30 = undefined as unknown as number;
    expect(() => normalizeChain(raw)).toThrow(/no usable iv30/);
  });

  it("refuses a payload with no usable spot", () => {
    const raw = payload([option("TEST261106P00090000")]);
    raw.data.current_price = 0;
    expect(() => normalizeChain(raw)).toThrow(/no usable spot price/);
  });
});

describe("spreadPct", () => {
  it("measures the spread against the mid", () => {
    expect(spreadPct({ bid: 1, ask: 1.1 })).toBeCloseTo(0.1 / 1.05, 12);
  });

  it("is null on a one-sided book — there is no spread to quote", () => {
    expect(spreadPct({ bid: 0, ask: 1.1 })).toBeNull();
  });
});

describe("atmIv", () => {
  const chain = normalizeChain(
    payload([
      option("TEST261106C00095000", { iv: 0.6 }),
      option("TEST261106P00095000", { iv: 0.7 }),
      option("TEST261106C00120000", { iv: 0.4 }),
    ]),
  );

  it("averages the call and put at the strike nearest spot", () => {
    expect(atmIv(chain.contracts, "2026-11-06", 100)).toEqual({
      expiry: "2026-11-06",
      strike: 95,
      iv: 0.6499999999999999,
    });
  });

  it("drops a leg Cboe could not solve rather than averaging a zero in", () => {
    const unsolved = normalizeChain(
      payload([
        option("TEST261106C00095000", { iv: 0 }),
        option("TEST261106P00095000", { iv: 0.7 }),
      ]),
    );
    expect(atmIv(unsolved.contracts, "2026-11-06", 100).iv).toBeCloseTo(0.7, 12);
  });

  it("returns a null iv when neither leg could be solved — never a zero that reads as cheap", () => {
    const unsolved = normalizeChain(
      payload([option("TEST261106C00095000", { iv: 0 }), option("TEST261106P00095000", { iv: 0 })]),
    );
    expect(atmIv(unsolved.contracts, "2026-11-06", 100).iv).toBeNull();
  });

  it("refuses an expiry the chain does not carry", () => {
    expect(() => atmIv(chain.contracts, "2027-01-15", 100)).toThrow(/no contracts at expiry/);
  });
});

describe("expectedMove", () => {
  it("prices the ATM straddle off mids, as a share of spot", () => {
    const chain = normalizeChain(
      payload([
        option("TEST261106C00100000", { bid: 5, ask: 5.2 }),
        option("TEST261106P00100000", { bid: 4, ask: 4.2 }),
      ]),
    );
    // (5.1 + 4.1) / 100
    expect(expectedMove(chain.contracts, "2026-11-06", 100)?.move).toBeCloseTo(0.092, 12);
  });

  it("is null when a leg has no bid — a move quoted off a one-sided book is invented", () => {
    const chain = normalizeChain(
      payload([
        option("TEST261106C00100000", { bid: 5, ask: 5.2 }),
        option("TEST261106P00100000", { bid: 0, ask: 4.2 }),
      ]),
    );
    expect(expectedMove(chain.contracts, "2026-11-06", 100)).toBeNull();
  });
});

describe("putAtDelta", () => {
  const chain = normalizeChain(
    payload([
      option("TEST261106P00075000", { delta: -0.12 }),
      option("TEST261106P00082000", { delta: -0.22 }),
      option("TEST261106C00082000", { delta: 0.78 }),
    ]),
  );

  it("picks the put whose |delta| is nearest the rung", () => {
    expect(putAtDelta(chain.contracts, "2026-11-06", 0.15)?.strike).toBe(75);
    expect(putAtDelta(chain.contracts, "2026-11-06", 0.25)?.strike).toBe(82);
  });

  it("never returns a call, however close its delta", () => {
    expect(putAtDelta(chain.contracts, "2026-11-06", 0.78)?.right).toBe("P");
  });

  it("skips a put with no bid — a leg you cannot sell is not a candidate", () => {
    const unsellable = normalizeChain(
      payload([option("TEST261106P00075000", { delta: -0.15, bid: 0 })]),
    );
    expect(putAtDelta(unsellable.contracts, "2026-11-06", 0.15)).toBeNull();
  });
});

describe("expiriesOf", () => {
  it("dedupes and sorts ascending", () => {
    const chain = normalizeChain(
      payload([
        option("TEST261204P00090000"),
        option("TEST261106P00090000"),
        option("TEST261106C00090000"),
      ]),
    );
    expect(expiriesOf(chain.contracts)).toEqual(["2026-11-06", "2026-12-04"]);
  });
});
