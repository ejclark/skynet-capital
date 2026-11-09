import { editions, editionView, parseEdition } from "../../src/domain/edition.js";
import {
  bollinger,
  checkSectors,
  type EditionSectors,
  neededCloses,
  RANGE_SESSIONS,
  rangeDates,
  SECTOR_FUNDS,
  sectorBases,
  sectorsView,
} from "../../src/domain/edition-sectors.js";
import { GICS_SECTORS } from "../../src/domain/sector-coverage.js";

// The whole market on the landing page (#7077 slice 1b, round 3's AT1–AT3): an edition carries each
// fund's closes, the periods' starting dates are fixed by the calendar, and the moves are worked out
// of the closes, so a typed percentage can never disagree with its prices.

type Fail = (what: string) => never;
const fail: Fail = (what) => {
  throw new Error(what);
};

/** Every fund at 100 on each needed date and `close` on the edition's own date. */
function flat(date: string, close = 100): EditionSectors {
  const dates = neededCloses(date);
  const row = Object.fromEntries(dates.map((d) => [d, d === date ? close : 100]));
  return {
    source: "spec",
    closes: Object.fromEntries(SECTOR_FUNDS.map((f) => [f.fund, row])),
  };
}

describe("the sector overview's periods", () => {
  it("counts each period from the calendar: the day before, last week's close, a month, the year", () => {
    expect(sectorBases("2026-11-06")).toEqual({
      day: "2026-11-05",
      week: "2026-10-30",
      month: "2026-10-06",
      ytd: "2025-12-31",
    });
  });

  it("measures a Monday's week from the Friday before, and skips a weekend a month back", () => {
    const monday = sectorBases("2026-11-09");
    expect(monday.day).toBe("2026-11-06");
    expect(monday.week).toBe("2026-11-06");
    // Mar 31 → Feb 28, a Saturday in 2026, so the Friday before.
    expect(sectorBases("2026-03-31").month).toBe("2026-02-27");
  });
});

describe("checkSectors — what an edition must carry", () => {
  it("draws all 11 GICS sectors and the S&P 500, the market first (AT1)", () => {
    expect(SECTOR_FUNDS).toHaveLength(12);
    expect(SECTOR_FUNDS[0]).toEqual({ name: "S&P 500", fund: "SPY" });
    expect(SECTOR_FUNDS.slice(1)).toEqual(GICS_SECTORS);
  });

  it("accepts every fund with exactly its needed closes", () => {
    expect(() => checkSectors(flat("2026-11-06"), "2026-11-06", fail)).not.toThrow();
  });

  it("refuses a missing fund, a fund it does not draw, and a missing or extra close", () => {
    const ok = flat("2026-11-06");
    const { XLK: _, ...noXlk } = ok.closes;
    expect(() => checkSectors({ ...ok, closes: noXlk }, "2026-11-06", fail)).toThrow(
      /no closes for XLK/,
    );
    const extra = { ...ok.closes, QQQ: ok.closes.SPY };
    expect(() => checkSectors({ ...ok, closes: extra }, "2026-11-06", fail)).toThrow(/QQQ is not/);
    const { "2025-12-31": __, ...noYtd } = ok.closes.SPY as Record<string, number>;
    expect(() =>
      checkSectors({ ...ok, closes: { ...ok.closes, SPY: noYtd } }, "2026-11-06", fail),
    ).toThrow(/SPY needs closes on exactly/);
    const plus = { ...ok.closes.SPY, "2026-09-01": 99 };
    expect(() =>
      checkSectors({ ...ok, closes: { ...ok.closes, SPY: plus } }, "2026-11-06", fail),
    ).toThrow(/SPY needs closes on exactly/);
  });

  it("refuses a price that is not a positive number, a date with no session, and no source", () => {
    const ok = flat("2026-11-06");
    const zero = { ...ok.closes.XLE, "2026-11-06": 0 };
    expect(() =>
      checkSectors({ ...ok, closes: { ...ok.closes, XLE: zero } }, "2026-11-06", fail),
    ).toThrow(/XLE 2026-11-06 must be a price/);
    expect(() => checkSectors(flat("2026-11-06"), "2026-11-07", fail)).toThrow(/not a session/);
    expect(() => checkSectors({ ...ok, source: " " }, "2026-11-06", fail)).toThrow(/source/);
  });

  it("is checked when an edition loads, naming the file", () => {
    const [e] = editions().filter((x) => x.sectors);
    expect(e).toBeDefined();
    const broken = { ...e, sectors: { ...e?.sectors, closes: {} } };
    expect(() => parseEdition(broken, "x.json", e?.date ?? "")).toThrow(
      /editions: x.json: sectors/,
    );
  });
});

describe("the 20-day range (AT8)", () => {
  it("draws from the edition's session and the 19 before it, holidays skipped", () => {
    const span = rangeDates("2026-11-06");
    expect(span).toHaveLength(RANGE_SESSIONS);
    expect(span[0]).toBe("2026-10-12");
    expect(span.at(-1)).toBe("2026-11-06");
    // Thanksgiving (Thu Nov 26) is no session, so the window ending Mon Nov 30 steps over it.
    expect(rangeDates("2026-11-30")).not.toContain("2026-11-26");
  });

  it("needs every band close as well as each period's start, and refuses an edition without them", () => {
    const needed = neededCloses("2026-11-06");
    for (const d of rangeDates("2026-11-06")) expect(needed).toContain(d);
    for (const d of Object.values(sectorBases("2026-11-06"))) expect(needed).toContain(d);
    const ok = flat("2026-11-06");
    const { "2026-10-20": _, ...gap } = ok.closes.XLB as Record<string, number>;
    expect(() =>
      checkSectors({ ...ok, closes: { ...ok.closes, XLB: gap } }, "2026-11-06", fail),
    ).toThrow(/XLB needs closes on exactly/);
  });

  it("is the 20-day average two population standard deviations either side, and the last close", () => {
    // Mean 5, population deviation 2 (Bollinger's own definition), so the band is 1 to 9.
    expect(bollinger([2, 4, 4, 4, 5, 5, 7, 9])).toEqual({ low: 1, mid: 5, high: 9, close: 9 });
    expect(bollinger([100, 100, 100])).toEqual({ low: 100, mid: 100, high: 100, close: 100 });
  });
});

describe("sectorsView — the moves, worked out of the closes", () => {
  it("works each period's move in percent, to two places, the market first", () => {
    const view = sectorsView(flat("2026-11-06", 97.531), "2026-11-06");
    expect(view.rows).toHaveLength(12);
    expect(view.rows[0]).toMatchObject({ fund: "SPY", market: true });
    expect(view.rows[1]?.market).toBeUndefined();
    expect(view.rows[0]?.moves).toEqual({ day: -2.47, week: -2.47, month: -2.47, ytd: -2.47 });
    expect(view.from.week).toBe("2026-10-30");
  });

  it("serves the checked-in edition's real closes as moves, never the closes themselves", () => {
    const view = editionView(editions(), new Date("2026-11-08T15:00:00Z"), () => undefined);
    const sectors = view.edition?.sectors;
    expect(sectors?.rows).toHaveLength(12);
    expect(sectors).not.toHaveProperty("closes");
    // SPY closed at 755.72 on Oct 30 and 735.29 on Nov 6 (Yahoo, fetched 2026-11-09).
    expect(sectors?.rows[0]?.moves.week).toBe(-2.7);
    // Nov 6's close sat under SPY's 20-day band (739.54 to 787.19) after the week's fall.
    expect(sectors?.rows[0]?.range).toEqual({
      low: 739.54,
      mid: 763.36,
      high: 787.19,
      close: 735.29,
    });
  });
});
