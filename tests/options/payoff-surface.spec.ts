import {
  type OptionLeg,
  type PayoffGrid,
  type PayoffPoint,
  type PayoffSurface,
  payoffSurface,
  type StockLeg,
  type StructureLeg,
  structureEntryCost,
  structureValue,
} from "../../src/options/payoff-surface.js";

/**
 * Anchors come from the exact Black–Scholes formula computed with a double-precision `erf` — a
 * different algorithm from the module's Abramowitz–Stegun Φ, so these are genuine outside checks
 * rather than the code grading its own homework. That Φ is good to ~7.5e-8 absolute, which lands
 * a premium within ~1e-5 per share and therefore ~1e-3 once the 100-share multiplier is applied:
 * dollar-denominated MODEL anchors are asserted to 2 decimals. Expiration-day and σ→0 numbers are
 * plain arithmetic with no Φ in them at all, and are asserted to 9 and 6.
 */

/** S=100, K=100, 30d, σ=25%, r=5% — the shared 30-day at-the-money anchor. */
const CALL_100 = 3.0626001437;
/** Same contract at the 110 strike. */
const CALL_110 = 0.3618698289;
/** The 100/110 debit call spread's model value at t=0, in dollars. */
const SPREAD_AT_OPEN = 270.0730314846;

const LONG_100_CALL: OptionLeg = {
  kind: "call",
  quantity: 1,
  strike: 100,
  daysToExpiry: 30,
  volatility: 0.25,
  entryPrice: CALL_100,
};
const SHORT_110_CALL: OptionLeg = {
  kind: "call",
  quantity: -1,
  strike: 110,
  daysToExpiry: 30,
  volatility: 0.25,
  entryPrice: CALL_110,
};
/** Long the 100 call, short the 110 call — a $10-wide debit vertical on a 30-day cycle. */
const VERTICAL: readonly StructureLeg[] = [LONG_100_CALL, SHORT_110_CALL];

const RATE = { rate: 0.05 } as const;

function markOf(legs: readonly StructureLeg[], spot: number, daysForward: number): number {
  const value = structureValue(legs, { spot, daysForward, ...RATE });
  if (value === undefined) throw new Error(`expected a value at ${spot} / ${daysForward}d`);
  return value;
}

function surfaceOf(legs: readonly StructureLeg[], grid: PayoffGrid): PayoffSurface {
  const surface = payoffSurface(legs, grid);
  if (!surface) throw new Error("expected a surface");
  return surface;
}

/** One cell of the surface, by (date, price) index — the shape a renderer will walk. */
function pointOf(surface: PayoffSurface, dateIndex: number, priceIndex: number): PayoffPoint {
  const point = surface.rows[dateIndex]?.[priceIndex];
  if (!point) throw new Error(`expected a point at row ${dateIndex}, column ${priceIndex}`);
  return point;
}

describe("structureEntryCost", () => {
  it("prices a single long call as a debit of premium × 100", () => {
    expect(structureEntryCost([LONG_100_CALL])).toBeCloseTo(306.26001437, 6);
  });

  it("nets the two legs of a vertical into one debit", () => {
    expect(structureEntryCost(VERTICAL)).toBeCloseTo(SPREAD_AT_OPEN, 6);
  });

  it("reports a sold structure as a negative cost — a credit received, not a debit", () => {
    const shortPut: OptionLeg = { ...LONG_100_CALL, kind: "put", quantity: -1, entryPrice: 2.5 };
    expect(structureEntryCost([shortPut])).toBeCloseTo(-250, 9);
  });

  it("counts a stock leg in shares, not contracts", () => {
    const shares: StockLeg = { kind: "stock", quantity: 100, entryPrice: 50 };
    expect(structureEntryCost([shares])).toBe(5000);
  });

  it("returns ABSENT for an empty structure rather than a $0 cost", () => {
    expect(structureEntryCost([])).toBeUndefined();
  });

  it("returns ABSENT when a leg cannot describe a contract", () => {
    expect(structureEntryCost([{ ...LONG_100_CALL, strike: 0 }])).toBeUndefined();
    expect(structureEntryCost([{ ...LONG_100_CALL, quantity: Number.NaN }])).toBeUndefined();
    expect(structureEntryCost([{ ...LONG_100_CALL, entryPrice: Number.NaN }])).toBeUndefined();
  });
});

describe("structureValue — expiration day, hand-computed", () => {
  it("pays nothing below the long strike", () => {
    expect(markOf(VERTICAL, 90, 30)).toBeCloseTo(0, 9);
  });

  it("pays the intrinsic of the long leg between the strikes", () => {
    expect(markOf(VERTICAL, 105, 30)).toBeCloseTo(500, 9);
  });

  it("caps at the $10 width above the short strike", () => {
    expect(markOf(VERTICAL, 120, 30)).toBeCloseTo(1000, 9);
    expect(markOf(VERTICAL, 400, 30)).toBeCloseTo(1000, 9);
  });

  it("makes max profit width − debit and max loss the debit itself", () => {
    const surface = surfaceOf(VERTICAL, { prices: [80, 130], daysForward: [30], ...RATE });
    expect(pointOf(surface, 0, 0).profit).toBeCloseTo(-SPREAD_AT_OPEN, 6);
    expect(pointOf(surface, 0, 1).profit).toBeCloseTo(1000 - SPREAD_AT_OPEN, 6);
  });

  it("prices a covered call the same way the ticket's payoff math does", () => {
    const covered: readonly StructureLeg[] = [
      { kind: "stock", quantity: 100, entryPrice: 100 },
      {
        kind: "call",
        quantity: -1,
        strike: 105,
        daysToExpiry: 30,
        volatility: 0.25,
        entryPrice: 2,
      },
    ];
    expect(structureEntryCost(covered)).toBeCloseTo(9800, 9);
    // Called away at 110: (strike − spot + premium) × 100 = (105 − 100 + 2) × 100.
    expect(markOf(covered, 110, 30) - 9800).toBeCloseTo(700, 9);
  });
});

describe("structureValue — any date, not just expiration", () => {
  it("matches the exact model value of the vertical at t=0", () => {
    expect(markOf(VERTICAL, 100, 0)).toBeCloseTo(SPREAD_AT_OPEN, 2);
  });

  it("matches the exact model value halfway through the cycle", () => {
    expect(markOf(VERTICAL, 105, 15)).toBeCloseTo(506.5360494018, 2);
  });

  it("bleeds a long call's value as the slice walks toward expiry at a flat spot", () => {
    const now = markOf([LONG_100_CALL], 100, 0);
    const midway = markOf([LONG_100_CALL], 100, 15);
    const nearly = markOf([LONG_100_CALL], 100, 29);
    expect(now).toBeGreaterThan(midway);
    expect(midway).toBeGreaterThan(nearly);
  });

  it("marks a leg past its expiry at intrinsic against the slice price", () => {
    expect(markOf([LONG_100_CALL], 117, 60)).toBeCloseTo(1700, 9);
    expect(markOf([LONG_100_CALL], 80, 60)).toBeCloseTo(0, 9);
  });
});

describe("structureValue — the independent IV adjustment", () => {
  it("lifts a long option when volatility is shifted up and drops it when shifted down", () => {
    const base = markOf([LONG_100_CALL], 100, 10);
    const richer = structureValue([LONG_100_CALL], {
      spot: 100,
      daysForward: 10,
      volatilityShift: 0.1,
      ...RATE,
    });
    const cheaper = structureValue([LONG_100_CALL], {
      spot: 100,
      daysForward: 10,
      volatilityShift: -0.1,
      ...RATE,
    });
    expect(richer ?? 0).toBeGreaterThan(base);
    expect(cheaper ?? 0).toBeLessThan(base);
  });

  it("clamps a shift that would drive volatility negative to the σ→0 limit", () => {
    const collapsed = structureValue([LONG_100_CALL], {
      spot: 110,
      daysForward: 0,
      volatilityShift: -5,
      ...RATE,
    });
    expect(collapsed).toBeCloseTo(1041.011562358, 6);
  });
});

describe("payoffSurface — shape and honesty", () => {
  const GRID: PayoffGrid = { prices: [90, 100, 110], daysForward: [0, 15, 30], ...RATE };

  it("returns one row per date and one point per price, in the order asked for", () => {
    const surface = surfaceOf(VERTICAL, GRID);
    expect(surface.rows).toHaveLength(3);
    expect(surface.prices).toEqual([90, 100, 110]);
    expect(surface.daysForward).toEqual([0, 15, 30]);
    for (const row of surface.rows) {
      expect(row).toHaveLength(3);
    }
    const cell: PayoffPoint = pointOf(surface, 1, 2);
    expect(cell.price).toBe(110);
    expect(cell.daysForward).toBe(15);
  });

  it("measures every profit from the same entry cost", () => {
    const surface = surfaceOf(VERTICAL, GRID);
    expect(surface.entryCost).toBeCloseTo(SPREAD_AT_OPEN, 6);
    for (const row of surface.rows) {
      for (const point of row) {
        expect(point.profit).toBeCloseTo(point.value - surface.entryCost, 9);
      }
    }
  });

  it("is a surface, not a line — the same price marks differently on different dates", () => {
    const surface = surfaceOf(VERTICAL, GRID);
    expect(pointOf(surface, 0, 1).value).not.toBeCloseTo(pointOf(surface, 2, 1).value, 3);
  });

  it("returns ABSENT rather than a misleading plane when anything is undescribable", () => {
    expect(payoffSurface([], GRID)).toBeUndefined();
    expect(payoffSurface(VERTICAL, { ...GRID, prices: [] })).toBeUndefined();
    expect(payoffSurface(VERTICAL, { ...GRID, daysForward: [] })).toBeUndefined();
    expect(payoffSurface(VERTICAL, { ...GRID, prices: [100, Number.NaN] })).toBeUndefined();
    expect(payoffSurface(VERTICAL, { ...GRID, prices: [100, -5] })).toBeUndefined();
    expect(payoffSurface(VERTICAL, { ...GRID, daysForward: [Number.NaN] })).toBeUndefined();
    expect(payoffSurface(VERTICAL, { ...GRID, rate: Number.NaN })).toBeUndefined();
    expect(payoffSurface(VERTICAL, { ...GRID, volatilityShift: Number.NaN })).toBeUndefined();
  });
});

describe("structureValue — degenerate inputs are defined, never NaN", () => {
  it("holds a finite value across every degenerate corner of the grid", () => {
    const corners: readonly StructureLeg[][] = [
      [LONG_100_CALL],
      [{ ...LONG_100_CALL, volatility: 0 }],
      [{ ...LONG_100_CALL, daysToExpiry: 0 }],
      [{ ...LONG_100_CALL, daysToExpiry: -30 }],
      [{ ...LONG_100_CALL, volatility: 0, daysToExpiry: 0 }],
      [...VERTICAL, { kind: "stock", quantity: -100, entryPrice: 100 }],
    ];
    for (const legs of corners) {
      for (const daysForward of [0, 15, 30, 45]) {
        for (const spot of [0.01, 50, 100, 1000]) {
          for (const volatilityShift of [-5, 0, 0.5]) {
            const value = structureValue(legs, { spot, daysForward, volatilityShift, ...RATE });
            expect(Number.isFinite(value ?? Number.NaN)).toBe(true);
          }
        }
      }
    }
  });

  it("defaults the risk-free rate to zero when it is omitted", () => {
    const omitted = structureValue([LONG_100_CALL], { spot: 100, daysForward: 5 });
    const explicit = structureValue([LONG_100_CALL], { spot: 100, daysForward: 5, rate: 0 });
    expect(omitted).toBe(explicit);
  });
});
