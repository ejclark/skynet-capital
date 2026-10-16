import { runBook } from "../../scripts/research/dip-bounce-book.mjs";
import type { Bar, FlatBar, Session } from "../../scripts/research/dip-bounce-sim.mjs";
import {
  annotate,
  findEntries,
  RANGE_WINDOW,
  recoveryBy,
  walkTranche,
} from "../../scripts/research/dip-bounce-sim.mjs";

/**
 * The arithmetic behind the dip-to-bounce study (#5489 slice 1), pinned on constructed bars with
 * known answers. The failure these exist to prevent is a study that looks like an edge because
 * the simulator was generous: a target filled on a touch rather than a trade-through, an entry
 * that saw its own future, a stuck tranche that quietly dropped out of the recovery denominator,
 * or a late-recovery rule that never actually refused a buy.
 */

const bar = (minutes: number, close: number, spread = 1, volume = 100): Bar => ({
  minutes,
  open: close,
  high: close + spread / 2,
  low: close - spread / 2,
  close,
  volume,
});

/** A quiet session: every 5-minute bar at `price` with a high-low of `spread`. */
const flatSession = (date: string, price = 100, spread = 1): Session => ({
  date,
  bars: Array.from({ length: 78 }, (_, i) => bar(570 + 5 * i, price, spread)),
});

/** Hand-built flat bars for walk tests: `rows` = [day, open, high, low, close]. */
const flatOf = (rows: [number, number, number, number, number][]): FlatBar[] =>
  rows.map(([day, open, high, low, close], i) => ({
    minutes: 600 + 5 * (i % 70),
    open,
    high,
    low,
    close,
    volume: 1,
    date: `2026-09-${String(10 + day).padStart(2, "0")}`,
    day,
    vwap: close,
    range: 1,
  }));

describe("annotate", () => {
  it("leaves the range unit empty until a full window of bars precedes it", () => {
    const flat = annotate([flatSession("2026-09-01"), flatSession("2026-09-02")]);
    expect(flat[RANGE_WINDOW - 1]?.range).toBeNull();
    expect(flat[RANGE_WINDOW]?.range).toBeCloseTo(1, 10);
  });

  it("weights VWAP by volume on the typical price, reset each session", () => {
    const s: Session = {
      date: "2026-09-01",
      bars: [
        { minutes: 570, open: 10, high: 10, low: 10, close: 10, volume: 100 },
        { minutes: 575, open: 20, high: 20, low: 20, close: 20, volume: 300 },
      ],
    };
    const flat = annotate([s, { ...s, date: "2026-09-02" }]);
    expect(flat[1]?.vwap).toBeCloseTo(17.5, 10);
    expect(flat[2]?.vwap).toBeCloseTo(10, 10);
  });
});

describe("findEntries", () => {
  // Warm-up session, then a session whose opening bar carries the volume so VWAP stays ≈ 100.
  const dipDay = (closes: Record<number, number>): Session => ({
    date: "2026-09-02",
    bars: Array.from({ length: 78 }, (_, i) => {
      const minutes = 570 + 5 * i;
      const c = closes[minutes] ?? 100;
      return { ...bar(minutes, c, c === 100 ? 1 : 0), volume: i === 0 ? 1e9 : 1 };
    }),
  });

  it("never enters in the first 30 minutes, and enters once per cross after", () => {
    const flat = annotate([
      flatSession("2026-09-01"),
      dipDay({ 575: 97, 600: 97.5, 605: 97.4, 610: 100, 615: 97.6 }),
    ]);
    const prices = findEntries(flat, { k: 2 }).map((e) => e.price);
    expect(prices).toEqual([97.5, 97.6]);
  });

  it("ladders a second tranche only another k ranges below the last entry", () => {
    const flat = annotate([flatSession("2026-09-01"), dipDay({ 600: 97.5, 605: 96, 610: 95.4 })]);
    expect(findEntries(flat, { k: 2 }).map((e) => e.price)).toEqual([97.5, 95.4]);
  });

  it("skips an excluded print day entirely", () => {
    const flat = annotate([flatSession("2026-09-01"), dipDay({ 600: 97 })]);
    expect(findEntries(flat, { k: 2, exclude: new Set(["2026-09-02"]) })).toEqual([]);
  });
});

describe("walkTranche", () => {
  const entry = { i: 0, price: 100, range: 1 };

  it("fills the target only on a trade-through, never on a touch", () => {
    const flat = flatOf([
      [0, 100, 100, 100, 100],
      [0, 100, 101, 99.5, 100.5],
      [0, 100.5, 101.2, 100.4, 101],
    ]);
    const w = walkTranche(flat, entry, 1);
    expect([w.how, w.exitAt, w.exit, w.age]).toEqual(["target", 2, 101, 0]);
    expect(w.worstPct).toBeCloseTo(-0.5, 10);
  });

  it("pays the open when the next session gaps through the target", () => {
    const flat = flatOf([
      [0, 100, 100, 100, 100],
      [1, 102, 102.5, 101.8, 102],
    ]);
    const w = walkTranche(flat, entry, 1);
    expect([w.how, w.exit, w.age]).toEqual(["target", 102, 1]);
  });

  it("hands off at the close of day 5 when the bounce never comes", () => {
    const rows: [number, number, number, number, number][] = [[0, 100, 100, 100, 100]];
    for (let d = 1; d <= 7; d++) rows.push([d, 99, 99.5, 98, 99 - d / 10]);
    const w = walkTranche(flatOf(rows), entry, 1);
    expect([w.how, w.age, w.exit]).toEqual(["handoff", 5, 98.5]);
    expect(w.worstPct).toBeCloseTo(-2, 10);
  });

  it("marks a tranche the sample ran out on as censored, not as a loss or a win", () => {
    const flat = flatOf([
      [0, 100, 100, 100, 100],
      [1, 99, 99.5, 98, 99],
      [2, 99, 99.5, 98, 98.8],
    ]);
    const w = walkTranche(flat, entry, 1);
    expect([w.how, w.age, w.exit]).toEqual(["censored", 2, 98.8]);
  });
});

describe("recoveryBy", () => {
  it("drops a stuck tranche from a horizon the sample cannot yet see", () => {
    const flat = flatOf([
      [0, 100, 100, 100, 100],
      [0, 100, 101.5, 100, 101],
      [1, 99, 99.5, 98, 99],
      [2, 99, 99.5, 98, 99],
    ]);
    const hit = walkTranche(flat, { i: 0, price: 100, range: 1 }, 1);
    const stuck = walkTranche(flat, { i: 2, price: 99, range: 1 }, 1);
    const [d0, d1, d3] = recoveryBy([hit, stuck], 2, flat, [0, 1, 3]);
    expect(d0).toEqual({ day: 0, n: 2, pct: 50 });
    expect(d1).toEqual({ day: 1, n: 2, pct: 50 });
    expect(d3).toEqual({ day: 3, n: 1, pct: 100 });
  });
});

describe("runBook", () => {
  // One name, six quiet sessions at 99 after an entry at 100 that never bounces; a second dip
  // signal arrives each day.
  const sessions = Array.from({ length: 6 }, (_, d) =>
    flatSession(`2026-09-${String(10 + d).padStart(2, "0")}`, d === 0 ? 100 : 99, 0.2),
  );
  const flat = annotate(sessions).map((b) => ({ ...b, range: 1 }));
  const entries = [0, 1, 2, 3, 4].map((d) => ({
    i: d * 78 + 20,
    price: flat[d * 78 + 20]?.close ?? 0,
    range: 1,
  }));
  const walks = (h: number) => entries.map((e) => walkTranche(flat, e, 1, h));
  const name = {
    sym: "TEST",
    flat,
    entries,
    ruled: walks(5),
    open: walks(Number.POSITIVE_INFINITY),
  };

  it("refuses a new buy in a name holding a tranche at day 3", () => {
    const b = runBook([name], { rule: "full", costBps: 0 });
    expect(b.refused["day-3 signal"]).toBe(2);
    expect(b.trades).toBe(3);
  });

  it("buys every signal with the rule off, and the slots cap still binds", () => {
    expect(runBook([name], { rule: "off" }).trades).toBe(5);
    const capped = runBook([name], { rule: "off", slots: 2 });
    expect([capped.trades, capped.refused["slots full"]]).toEqual([2, 3]);
  });
});
