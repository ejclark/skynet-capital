import {
  armStrikes,
  blockInterval,
  DELTA_MISS,
  expiryFor,
  type FloorEntry,
  headlineFloor,
  putAbsDelta,
  putValue,
  quarterOf,
  saleResult,
  strikeForPutDelta,
  TARGET_DELTA,
} from "../../scripts/research/wheel-cap-math.mjs";

/**
 * The wheel strike-cap study's pure half (#6598 slice 1, Study A). The failures these exist to
 * prevent: a cap that reads as helping because the idle cycles it causes were dropped, a floor band
 * built with outcomes the bot could not yet have seen on the sale day, and a sold put that rides a
 * print the live wheel would never hold it across.
 */

const day = (from: string, n: number): string =>
  new Date(Date.parse(`${from}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

const entry = (t: number, date: string, maturedOn: string, further: number): FloorEntry => ({
  t,
  date,
  maturedOn,
  bucket: 3,
  wide: true,
  vix: "calm",
  further,
});

/** `count` one-session episodes, 60 calendar days apart from `from` (each its own cluster). */
function spaced(count: number, from: string, further: number, matured = "2001-01-01", t0 = 0) {
  return Array.from({ length: count }, (_, k) =>
    entry(t0 + k * 100, day(from, k * 60), matured, further),
  );
}

const STATE = { bucket: 3, wide: true, vix: "calm" };

describe("putValue and putAbsDelta", () => {
  it("prices an at-the-money put at zero rate by the closed form", () => {
    // S = K, r = 0: put = S·(2·N(σ√T/2) − 1); σ 0.2, T 1 → 7.966
    expect(putValue(100, 100, 0.2, 1)).toBeCloseTo(7.966, 2);
  });

  it("is the intrinsic value when no time or vol is left", () => {
    expect(putValue(90, 100, 0.3, 0)).toBe(10);
    expect(putValue(110, 100, 0, 0.5)).toBe(0);
  });

  it("finds the strike whose put |delta| is the target, nearer spot when vol is low", () => {
    const calm = strikeForPutDelta(100, 0.25, 30 / 365);
    const wild = strikeForPutDelta(100, 0.9, 30 / 365);
    expect(putAbsDelta(100, calm, 0.25, 30 / 365)).toBeCloseTo(TARGET_DELTA, 6);
    expect(putAbsDelta(100, wild, 0.9, 30 / 365)).toBeCloseTo(TARGET_DELTA, 6);
    expect(calm).toBeGreaterThan(wild);
    expect(calm).toBeLessThan(100);
  });
});

describe("armStrikes", () => {
  const at = { spot: 100, vol: 0.4, years: 30 / 365 };
  const playbook = strikeForPutDelta(100, 0.4, 30 / 365);

  it("sells the playbook's strike when the cap sits above it, or there is no cap", () => {
    expect(armStrikes({ ...at, cap: playbook + 5 })).toMatchObject({
      capped: playbook,
      binds: false,
      blocked: false,
    });
    expect(armStrikes({ ...at, cap: null })).toMatchObject({ capped: playbook, binds: false });
  });

  it("moves the strike down to the cap while its delta stays in the picker's window", () => {
    const k = armStrikes({ ...at, cap: playbook - 1 });
    expect(k).toMatchObject({ capped: playbook - 1, binds: true, blocked: false });
    expect(putAbsDelta(100, playbook - 1, 0.4, 30 / 365)).toBeGreaterThanOrEqual(
      TARGET_DELTA - DELTA_MISS,
    );
  });

  it("sells nothing when the cap is below the window, as the live picker would", () => {
    const k = armStrikes({ ...at, cap: 60 });
    expect(k).toMatchObject({ capped: null, binds: true, blocked: true });
  });
});

describe("saleResult", () => {
  const at = { spot: 100, vol: 0.4, years: 30 / 365 };

  it("scores an idle cycle as zero, never as missing", () => {
    expect(saleResult({ ...at, strike: null, closeAtExpiry: 50 })).toEqual({
      sold: false,
      premium: 0,
      assigned: false,
      pnl: 0,
    });
  });

  it("keeps the whole premium when the put expires out of the money", () => {
    const r = saleResult({ ...at, strike: 90, closeAtExpiry: 95 });
    expect(r.assigned).toBe(false);
    expect(r.pnl).toBeCloseTo(r.premium, 12);
    expect(r.premium).toBeCloseTo(putValue(100, 90, 0.4, 30 / 365) / 90, 12);
  });

  it("marks assigned shares at the expiry close, per dollar secured", () => {
    const r = saleResult({ ...at, strike: 90, closeAtExpiry: 81 });
    expect(r.assigned).toBe(true);
    expect(r.pnl).toBeCloseTo(r.premium - 0.1, 12);
  });
});

describe("expiryFor", () => {
  it("takes the latest Friday 14 to 45 days out", () => {
    // 2026-10-30 is a Friday; +45 is Mon 12-14, so the latest Friday is 12-11 (42 days).
    expect(expiryFor("2026-10-30", null)).toEqual({ expiry: "2026-12-11", days: 42 });
  });

  it("never holds a put across the next print", () => {
    expect(expiryFor("2026-10-30", "2026-12-01")).toEqual({ expiry: "2026-11-27", days: 28 });
  });

  it("is dark when no Friday in the window clears the print (CRWV before 11-10)", () => {
    expect(expiryFor("2026-10-30", "2026-11-10")).toBeNull();
  });
});

describe("headlineFloor", () => {
  it("reads the own sample's median once it has 8 episodes", () => {
    const names = new Map([["A", { sym: "A", entries: spaced(8, "2001-01-01", -0.2) }]]);
    expect(headlineFloor({ sym: "A", state: STATE, names, asOf: "2010-01-01" })).toMatchObject({
      p50: -0.2,
      sample: "own",
      level: "exact",
      units: 8,
    });
  });

  it("ignores every outcome that had not finished by the sale day", () => {
    const known = spaced(8, "2001-01-01", -0.2);
    const unseen = spaced(8, "2003-01-01", -0.9, "2010-06-01", 5000);
    const names = new Map([["A", { sym: "A", entries: [...known, ...unseen] }]]);
    expect(headlineFloor({ sym: "A", state: STATE, names, asOf: "2010-01-01" })?.p50).toBe(-0.2);
    expect(headlineFloor({ sym: "A", state: STATE, names, asOf: "2010-06-01" })?.p50).toBeLessThan(
      -0.2,
    );
  });

  it("falls back to the pooled basket, counted in clusters, when its own history is thin", () => {
    const names = new Map([
      ["A", { sym: "A", entries: spaced(2, "2001-01-01", -0.1) }],
      ["B", { sym: "B", entries: spaced(8, "2003-01-01", -0.3) }],
    ]);
    expect(headlineFloor({ sym: "A", state: STATE, names, asOf: "2010-01-01" })).toMatchObject({
      sample: "pooled",
      level: "exact",
      units: 10,
      p50: -0.3,
    });
  });

  it("relaxes the VIX match before giving up on a level", () => {
    const entries = spaced(8, "2001-01-01", -0.15).map((e) => ({ ...e, vix: "fear" }));
    const names = new Map([["A", { sym: "A", entries }]]);
    expect(headlineFloor({ sym: "A", state: STATE, names, asOf: "2010-01-01" })).toMatchObject({
      sample: "own",
      level: "dd+sector",
    });
  });

  it("states no floor when no level reaches 8 units", () => {
    const names = new Map([["A", { sym: "A", entries: spaced(3, "2001-01-01", -0.1) }]]);
    expect(headlineFloor({ sym: "A", state: STATE, names, asOf: "2010-01-01" })).toBeNull();
  });
});

describe("blockInterval", () => {
  const rows = [
    { q: "2020Q1", v: 1 },
    { q: "2020Q1", v: 3 },
    { q: "2020Q2", v: -1 },
    { q: "2020Q3", v: 5 },
  ];

  it("means over rows, counts whole blocks, and repeats exactly under its seed", () => {
    const a = blockInterval(
      rows,
      (r) => r.v,
      (r) => r.q,
    );
    const b = blockInterval(
      rows,
      (r) => r.v,
      (r) => r.q,
    );
    expect(a).toEqual(b);
    expect(a).toMatchObject({ mean: 2, blocks: 3, rows: 4 });
    if (!a) throw new Error("blockInterval returned null on four rows");
    expect(a.lo).toBeLessThanOrEqual(a.mean);
    expect(a.hi).toBeGreaterThanOrEqual(a.mean);
  });

  it("has no width when every row reads the same", () => {
    const flat = blockInterval(
      rows,
      () => 0.5,
      (r) => r.q,
    );
    expect(flat).toMatchObject({ mean: 0.5, lo: 0.5, hi: 0.5 });
  });

  it("is null on no rows", () => {
    expect(
      blockInterval(
        [],
        () => 0,
        () => "x",
      ),
    ).toBeNull();
  });
});

describe("quarterOf", () => {
  it("names the calendar quarter a sale is resampled with", () => {
    expect(quarterOf("2022-01-03")).toBe("2022Q1");
    expect(quarterOf("2022-09-30")).toBe("2022Q3");
    expect(quarterOf("2022-10-01")).toBe("2022Q4");
  });
});
