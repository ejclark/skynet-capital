import {
  benchReturns,
  bsPut,
  car,
  dayZero,
  putSpreadReturn,
  rawReturn,
  realizedVol,
  sectorEtf,
  sharesOutstandingAfter,
  summarize,
  terciles,
  unlockMultiple,
  volumeRatio,
} from "../../scripts/research/lockup-study-math.mjs";

/**
 * #5912 slice 2 — the lockup-expiry event study's arithmetic, specified against constructed series
 * with known answers. The failures these exist to prevent: a window off by one session (day 0 is
 * the first UNLOCKED session, so a slip would credit the run-in to the unlock or vice versa), a
 * benchmark return taken across a gap, and a put spread priced so that a loss reads as a win.
 */

const day = (i: number) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
const series = (closes: number[], volume = 1000) =>
  closes.map((close, i) => ({ date: day(i), close, volume }));

describe("dayZero", () => {
  it("is the first session AFTER the lock-up's last day — the first one insiders may sell", () => {
    const bars = series([10, 10, 10, 10]);
    expect(dayZero(bars, day(1))).toBe(2);
  });
  it("lands on the next session when the last locked day is not a trading day", () => {
    const bars = [day(0), day(3), day(4)].map((date) => ({ date, close: 1 }));
    expect(dayZero(bars, day(1))).toBe(1);
  });
  it("is −1 when the unlock is past the end of the history", () => {
    expect(dayZero(series([1, 1]), day(5))).toBe(-1);
  });
});

describe("car", () => {
  it("sums stock-minus-benchmark daily returns over days a..b inclusive", () => {
    // Stock +10% on day 1, −10% on day 2; benchmark flat. CAR[1,2] = 0.1 + (−0.1).
    const stock = series([100, 110, 99]);
    const bench = series([50, 50, 50]);
    const br = benchReturns(stock, bench);
    expect(car(stock, br, 0, 1, 1)).toBeCloseTo(0.1, 12);
    expect(car(stock, br, 0, 2, 2)).toBeCloseTo(-0.1, 12);
    expect(car(stock, br, 0, 1, 2)).toBeCloseTo(0, 12);
  });
  it("nets the benchmark out: a stock that only tracks its sector has zero abnormal return", () => {
    const stock = series([100, 105, 99.75]);
    const bench = series([20, 21, 19.95]);
    expect(car(stock, benchReturns(stock, bench), 0, 1, 2)).toBeCloseTo(0, 12);
  });
  it("refuses a window that crosses a benchmark gap instead of treating it as a flat day", () => {
    const stock = series([100, 101, 102]);
    const bench = [
      { date: day(0), close: 1 },
      { date: day(2), close: 1 },
    ];
    expect(car(stock, benchReturns(stock, bench), 0, 1, 2)).toBeUndefined();
  });
  it("refuses a window running off either end of the history", () => {
    const stock = series([1, 1, 1]);
    const br = benchReturns(stock, stock);
    expect(car(stock, br, 1, -1, 0)).toBeUndefined();
    expect(car(stock, br, 1, 0, 2)).toBeUndefined();
  });
});

describe("rawReturn", () => {
  it("runs from the close of day a−1 to the close of day b — the put trade's holding period", () => {
    const bars = series([100, 90, 80, 120]);
    expect(rawReturn(bars, 2, -1, 0)).toBeCloseTo(80 / 100 - 1, 12);
    expect(rawReturn(bars, 2, 0, 1)).toBeCloseTo(120 / 90 - 1, 12);
  });
});

describe("realizedVol", () => {
  it("is zero for a constant-growth series and annualizes by √252", () => {
    const steady = series(Array.from({ length: 10 }, (_, i) => 100 * 1.01 ** i));
    expect(realizedVol(steady, 5, -4, 4)).toBeCloseTo(0, 10);
    // Alternating ±log 1.02: sample sd of [+u, −u, +u, −u] over its mean.
    const u = Math.log(1.02);
    const zig = series([100, 102, 100, 102, 100]);
    const xs = [u, -u, u, -u];
    const sd = Math.sqrt(xs.reduce((s, x) => s + x * x, 0) / 3);
    expect(realizedVol(zig, 0, 1, 4)).toBeCloseTo(sd * Math.sqrt(252), 10);
  });
});

describe("volumeRatio", () => {
  it("compares the unlock days' mean volume to a quiet baseline", () => {
    const bars = series([1, 1, 1, 1]).map((b, i) => ({ ...b, volume: i < 2 ? 100 : 150 }));
    expect(volumeRatio(bars, 2, [0, 1], [-2, -1])).toBeCloseTo(1.5, 12);
  });
  it("is undefined when a day has no volume, never a ratio over zero", () => {
    const bars = series([1, 1, 1]).map((b, i) => ({ ...b, volume: i === 0 ? 0 : 10 }));
    expect(volumeRatio(bars, 1, [0, 1], [-1, -1])).toBeUndefined();
  });
});

describe("bsPut / putSpreadReturn", () => {
  it("prices an ATM put near 0.4·σ√T·S, the textbook rule of thumb", () => {
    expect(bsPut(100, 100, 0.6, 14 / 252)).toBeCloseTo(0.4 * 0.6 * Math.sqrt(14 / 252) * 100, 0);
  });
  it("satisfies the bounds: worth at least intrinsic, never more than the strike", () => {
    expect(bsPut(80, 100, 0.5, 0.1)).toBeGreaterThan(20);
    expect(bsPut(80, 100, 0.5, 0.1)).toBeLessThan(100);
    expect(bsPut(80, 100, 0.5, 0)).toBe(20);
  });
  it("loses the whole debit when the stock finishes at or above the long strike", () => {
    expect(putSpreadReturn({ entry: 100, exit: 100, sigma: 0.6 })).toBeCloseTo(-1, 12);
    expect(putSpreadReturn({ entry: 100, exit: 130, sigma: 0.6 })).toBeCloseTo(-1, 12);
  });
  it("pays the full width at or below the short strike, so the return is width over debit", () => {
    const at = putSpreadReturn({ entry: 100, exit: 85, sigma: 0.6 });
    const years = 14 / 252;
    const debit = bsPut(100, 100, 0.6, years) - bsPut(100, 90, 0.6, years);
    expect(at).toBeCloseTo(10 / debit - 1, 10);
    expect(putSpreadReturn({ entry: 100, exit: 50, sigma: 0.6 })).toBeCloseTo(at as number, 10);
  });
  it("costs more at a higher vol, so the same fall returns less", () => {
    const cheap = putSpreadReturn({ entry: 100, exit: 94, sigma: 0.5 }) as number;
    const rich = putSpreadReturn({ entry: 100, exit: 94, sigma: 0.8 }) as number;
    expect(rich).toBeLessThan(cheap);
  });
});

describe("summarize / terciles", () => {
  it("reports n, mean, median, t and the share below zero, skipping non-numbers", () => {
    const s = summarize([-0.02, -0.01, 0.03, undefined, Number.NaN]);
    expect(s.n).toBe(3);
    expect(s.mean).toBeCloseTo(0, 12);
    expect(s.median).toBeCloseTo(-0.01, 12);
    expect(s.negShare).toBeCloseTo(2 / 3, 12);
    expect(s.t).toBeCloseTo(0, 10);
  });
  it("splits a list into thirds", () => {
    expect(terciles([1, 2, 3, 4, 5, 6, 7, 8, 9])).toEqual([4, 7]);
  });
});

describe("sectorEtf", () => {
  it("benchmarks a drug developer to XBI, not the megacap pharma in XLV", () => {
    expect(sectorEtf("2834")).toBe("XBI");
    expect(sectorEtf("2836")).toBe("XBI");
    expect(sectorEtf("3841")).toBe("XLV");
  });
  it("maps software and semis to XLK, REITs to XLRE before the rest of finance", () => {
    expect(sectorEtf("7372")).toBe("XLK");
    expect(sectorEtf("3674")).toBe("XLK");
    expect(sectorEtf("6798")).toBe("XLRE");
    expect(sectorEtf("6199")).toBe("XLF");
  });
  it("falls back to IWM for a code no sector claims", () => {
    expect(sectorEtf("9999")).toBe("IWM");
  });
});

describe("sharesOutstandingAfter", () => {
  it("reads the offering summary's outstanding-after-this-offering line", () => {
    expect(
      sharesOutstandingAfter(
        "Common stock to be outstanding after this offering 123,456,789 shares (or 125,000,000 shares if the underwriters exercise their option)",
      ),
    ).toBe(123456789);
  });
  it("reads the inverted phrasing", () => {
    expect(
      sharesOutstandingAfter(
        "Immediately after this offering, 45,000,000 shares of common stock will be outstanding after this offering.",
      ),
    ).toBe(45000000);
  });
  it("is undefined when the filing does not say", () => {
    expect(sharesOutstandingAfter("We are offering 9,375,000 shares.")).toBeUndefined();
  });
  // Verbatim from CrowdStrike's 424B4 (CIK 0001535527, fetched 2026-10-20): reading the first line
  // alone counted 18M public shares as the company and 179M locked Class B shares as nothing.
  const CRWD =
    "The Offering Class A common stock offered by us 18,000,000 shares Class A common stock to be outstanding after this offering 18,000,000 shares (20,700,000 shares, if the underwriters exercise their option to purchase additional shares in full) Class B common stock to be outstanding after this offering 178,688,971 shares Total Class A and Class B common stock to be outstanding after this offering 196,688,971 shares (199,388,971 shares, if the underwriters exercise their option)";
  it("takes a dual-class summary's Total line, not the Class A line", () => {
    expect(sharesOutstandingAfter(CRWD)).toBe(196688971);
  });
  it("sums the class lines when a dual-class summary has no Total line", () => {
    const noTotal = CRWD.slice(0, CRWD.indexOf(" Total"));
    expect(sharesOutstandingAfter(noTotal)).toBe(18000000 + 178688971);
  });
});

describe("unlockMultiple", () => {
  it("is the locked shares over the shares sold", () => {
    expect(unlockMultiple(196688971, 18000000)).toBeCloseTo(178688971 / 18000000, 10);
  });
  it("reads a near-zero multiple as unknown — the parse missed the insiders' class", () => {
    expect(unlockMultiple(18000000, 18000000)).toBeUndefined();
    expect(unlockMultiple(undefined, 18000000)).toBeUndefined();
  });
});
