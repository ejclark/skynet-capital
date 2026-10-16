import type { Session } from "../../scripts/research/dip-bounce-sim.mjs";
import { annotate, findEntries, walkTranche } from "../../scripts/research/dip-bounce-sim.mjs";
import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import {
  DIP_BOUNCE_RULE,
  type DipBounceRule,
  type IntradayBar,
  printExclusions,
  replayDipBounce,
} from "../../src/playbooks/dip-bounce.js";

/**
 * The dip-to-bounce rule the bots will observe (#5489 slice 2), pinned two ways: against the study's
 * own simulator on a random tape (the live rule IS the rule that was measured — the same entries and
 * the same target fills), and on constructed tapes for the parts the study amended: the day-3 and
 * 30% signal, and the day-5 gate that keeps the tranche's target sell working instead of handing it
 * off.
 */

type Row = { close: number; open?: number; high?: number; low?: number; volume?: number };

/** One session of 78 five-minute bars from 9:30 ET; `at(minutes)` overrides a bar. */
function session(date: string, price: number, at: Record<number, Row> = {}): IntradayBar[] {
  return Array.from({ length: 78 }, (_, i) => {
    const minutes = 570 + 5 * i;
    const row = at[minutes] ?? { close: price };
    return {
      date,
      minutes,
      open: row.open ?? row.close,
      high: row.high ?? row.close + 0.5,
      low: row.low ?? row.close - 0.5,
      close: row.close,
      volume: row.volume ?? 100,
    };
  });
}

/** A dip bar: closes 2.5 ranges under a flat $100 tape, with too little volume to move VWAP. */
const DIP = { close: 97.5, volume: 1 };

/** A $100 session that dips at 11:10 ET and sits at the dip for the rest of the day, its highs one
 *  half-range short of the target, on too little volume to move VWAP. */
const dipDay = (date: string, at: Record<number, Row> = {}): IntradayBar[] =>
  session(date, 100, {
    700: DIP,
    ...Object.fromEntries(
      Array.from({ length: 51 }, (_, i) => [705 + 5 * i, { close: 97.5, volume: 1 }]),
    ),
    ...at,
  });

const DATES = [
  "2026-10-01",
  "2026-10-02",
  "2026-10-05",
  "2026-10-06",
  "2026-10-07",
  "2026-10-08",
  "2026-10-09",
  "2026-10-12",
  "2026-10-13",
  "2026-10-14",
  "2026-10-15",
] as const;
const day = (n: number): string => DATES[n] ?? "";

describe("the live rule is the rule the study measured", () => {
  /** A seeded random walk, so the comparison covers many crosses without a fixture file. */
  function randomTape(sessions: number, seed: number): IntradayBar[] {
    let s = seed;
    const rand = () => {
      s = (s * 1664525 + 1013904223) % 2 ** 32;
      return s / 2 ** 32;
    };
    let price = 100;
    return Array.from({ length: sessions }, (_, d) =>
      Array.from({ length: 78 }, (_, i) => {
        const open = price;
        price = Math.max(5, price + (rand() - 0.5) * 1.2);
        const spread = 0.3 + rand();
        return {
          date: `2026-09-${String(d + 1).padStart(2, "0")}`,
          minutes: 570 + 5 * i,
          open,
          high: Math.max(open, price) + spread / 2,
          low: Math.min(open, price) - spread / 2,
          close: price,
          volume: Math.round(50 + rand() * 500),
        };
      }),
    ).flat();
  }

  // Nothing in the book binds, so every entry the study's `findEntries` finds is a buy here.
  const unbound: DipBounceRule = {
    ...DIP_BOUNCE_RULE,
    slots: 1e6,
    signalDay: 1e6,
    gateDay: 1e6,
    signalShare: 2,
    gateShare: 2,
    weeklyStop: 1e6,
  };

  it.each([7, 21, 1234])("buys and sells on the same bars at the same prices (seed %i)", (seed) => {
    const bars = randomTape(25, seed);
    const sessions: Session[] = [...new Set(bars.map((b) => b.date))].map((date) => ({
      date,
      bars: bars.filter((b) => b.date === date),
    }));
    const flat = annotate(sessions);
    const entries = findEntries(flat, { k: 2 });
    const walks = entries.map((e) => walkTranche(flat, e, 1, Number.POSITIVE_INFINITY));
    const read = replayDipBounce("TEST", bars, new Set(), unbound);

    const ours = [...read.sold, ...read.held]
      .map(
        (t) =>
          `${t.boughtOn} ${t.boughtAt} ${t.entry.toFixed(6)} ${t.sold?.price.toFixed(6) ?? "held"}`,
      )
      .sort();
    const theirs = walks
      .map((w) => {
        const b = flat[w.entryAt];
        const exit = w.how === "target" ? w.exit.toFixed(6) : "held";
        return `${b?.date} ${b?.minutes} ${w.entry.toFixed(6)} ${exit}`;
      })
      .sort();
    expect(entries.length).toBeGreaterThan(5);
    expect(ours).toEqual(theirs);
  });
});

describe("the entry: two ranges under session VWAP, from 10:00 ET", () => {
  it("buys a tranche at the dip bar's close with its target one range higher", () => {
    const read = replayDipBounce("MU", [...session(day(0), 100), ...dipDay(day(1))]);
    expect(read.held).toHaveLength(1);
    expect(read.held[0]).toMatchObject({ boughtOn: day(1), boughtAt: 700, entry: 97.5 });
    expect(read.held[0]?.target).toBeCloseTo(98.5, 6);
  });

  it("never buys in the first 30 minutes, nor before a full session sets the range", () => {
    const early = replayDipBounce("MU", [
      ...session(day(0), 100),
      ...session(day(1), 100, { 595: DIP }),
    ]);
    const warmUp = replayDipBounce("MU", session(day(0), 100, { 700: DIP }));
    expect(early.held).toEqual([]);
    expect(warmUp.held).toEqual([]);
  });

  it("buys nothing on an excluded session (a print day and one either side)", () => {
    const bars = [...session(day(0), 100), ...dipDay(day(1))];
    expect(replayDipBounce("MU", bars, new Set([day(1)])).held).toEqual([]);
    expect(replayDipBounce("MU", bars, new Set([day(0)])).held).toHaveLength(1);
  });

  it("buys once per cross, and again only another two ranges lower", () => {
    const bars = [
      ...session(day(0), 100),
      ...dipDay(day(1), {
        705: { close: 97.4, volume: 1 },
        710: { close: 95.4, volume: 1 },
        715: { close: 95.4, volume: 1 },
      }),
    ];
    const read = replayDipBounce("MU", bars);
    const buys = [...read.sold, ...read.held].sort((a, b) => a.boughtAt - b.boughtAt);
    expect(buys.map((t) => [t.boughtAt, t.entry])).toEqual([
      [700, 97.5],
      [710, 95.4],
    ]);
  });
});

describe("the exit: a resting sell one range above the buy", () => {
  it("fills only when a bar trades through the target, never on a touch or on the buy's own bar", () => {
    const touch = { close: 98, open: 98, high: 98.5, low: 97.5, volume: 1 };
    const through = { close: 98.2, open: 98, high: 98.7, low: 97.9, volume: 1 };
    const bars = [
      ...session(day(0), 100),
      ...dipDay(day(1), { 700: { ...DIP, high: 99 }, 705: touch, 710: through }),
    ];
    const read = replayDipBounce("MU", bars);
    expect(read.sold[0]).toMatchObject({ boughtAt: 700 });
    expect(read.sold[0]?.sold).toEqual({ on: day(1), at: 710, price: 98.5 });
  });

  it("pays the open when the next session gaps above the target", () => {
    const bars = [...session(day(0), 100), ...dipDay(day(1)), ...session(day(2), 99)];
    expect(replayDipBounce("MU", bars).sold[0]?.sold).toEqual({ on: day(2), at: 570, price: 99 });
  });
});

describe("the late-recovery rule, as the study amended it", () => {
  /** Bought on session 1, then stuck at the buy price (its high never trades through the target). */
  const stuck = (sessions: number, last: Record<number, Row> = {}) => [
    ...session(day(0), 100),
    ...dipDay(day(1)),
    ...Array.from({ length: sessions }, (_, i) =>
      session(day(2 + i), 97.5, i === sessions - 1 ? last : {}),
    ).flat(),
  ];

  it("holds overnight with its target working and no level before day 3", () => {
    const read = replayDipBounce("MU", stuck(2));
    expect(read.held[0]).toMatchObject({ age: 2, level: "none" });
    expect(read.level).toBe("none");
    expect(read.wouldBe).toEqual([
      expect.objectContaining({ side: "sell", kind: "resting", price: read.held[0]?.target }),
    ]);
  });

  it("signals at day 3 and refuses a new buy in the name, saying why", () => {
    const read = replayDipBounce("MU", stuck(3, { 700: { close: 95, volume: 1 } }));
    expect(read.held).toHaveLength(1);
    expect(read.held[0]).toMatchObject({ age: 3, level: "signal" });
    expect(read.level).toBe("signal");
    expect(read.refused).toEqual([
      { on: day(4), at: 700, price: 95, why: "signal: a tranche is 3 sessions old" },
    ]);
  });

  it("gates at day 5 and keeps the tranche's target sell working — no hand-off, no sale", () => {
    const read = replayDipBounce("MU", stuck(5));
    expect(read.sold).toEqual([]);
    expect(read.held[0]).toMatchObject({ age: 5, level: "gate", entry: 97.5 });
    expect(read.level).toBe("gate");
    expect(read.reasons[0]).toContain("its target sell keeps working");
    expect(read.wouldBe).toEqual([
      expect.objectContaining({
        side: "sell",
        kind: "resting",
        why: expect.stringContaining("kept working"),
      }),
    ]);
  });

  it("sells the gated tranche at its target when the bounce comes late (the study's median: day 9)", () => {
    const bars = [...stuck(7), ...session(day(9), 99)];
    const read = replayDipBounce("MU", bars);
    expect(read.held).toEqual([]);
    expect(read.sold[0]).toMatchObject({ age: 8, level: "gate", sold: { on: day(9), price: 99 } });
  });

  it("signals at 30% of the allocation tied up and gates at 50%", () => {
    const small: DipBounceRule = { ...DIP_BOUNCE_RULE, slots: 3 };
    // One carried tranche of three is 33%: the next session's dip is refused.
    const thirty = replayDipBounce(
      "MU",
      stuck(1, { 700: { close: 95, volume: 1 } }),
      new Set(),
      small,
    );
    expect(thirty.refused[0]?.why).toBe("signal: 33% of the allocation tied up");
    expect(thirty.tiedUp).toBeCloseTo(1 / 3, 6);
    expect(thirty.reasons).toContain("signal: 33% of the allocation tied up");

    const half: DipBounceRule = { ...DIP_BOUNCE_RULE, slots: 2 };
    const fifty = replayDipBounce(
      "MU",
      stuck(1, { 700: { close: 95, volume: 1 } }),
      new Set(),
      half,
    );
    expect(fifty.refused[0]?.why).toBe("gate: 50% of the allocation tied up");
    expect(fifty.level).toBe("gate");
  });

  it("gates new buys for the week after the book loses 8% of its allocation in five sessions", () => {
    // Three $1,000 tranches bought near $95 and marked at $50 lose about $1,430: over 8% of a
    // $15,000 book. The stop trips at Thursday's close; Friday's dip is refused for it.
    const book: DipBounceRule = { ...DIP_BOUNCE_RULE, slots: 15 };
    const bars = [
      ...session(day(0), 100),
      ...dipDay(day(1), {
        705: { close: 95.4, volume: 1 },
        // The deepest buy's price for the rest of the day, so no tranche reaches its target.
        ...Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [710 + 5 * i, { close: 93.3, volume: 1 }]),
        ),
      }),
      ...[2, 3, 4, 5].flatMap((n) => session(day(n), 50)),
      ...session(day(6), 50, { 700: { close: 45, volume: 1 } }),
    ];
    const read = replayDipBounce("MU", bars, new Set(), book);
    expect(read.refused.at(-1)?.why).toContain("down 8%");
    expect(read.level).toBe("gate");
  });
});

describe("what it would do is never an order", () => {
  it("names a would-be buy on the bar that signalled, in its own type", () => {
    const read = replayDipBounce("MU", [
      ...session(day(0), 100),
      ...session(day(1), 100).slice(0, 27),
      {
        date: day(1),
        minutes: 705,
        open: 97.5,
        high: 98,
        low: 97,
        close: 97.5,
        volume: 1,
      },
    ]);
    const buy = read.wouldBe[0];
    expect(buy).toMatchObject({ side: "buy", kind: "market", price: 97.5, shares: 10 });
    // Not an OrderIntent: no `quantity`, no `type`, no `symbol` the trader could submit.
    expect(buy && "quantity" in buy).toBe(false);
    expect(buy && "type" in buy).toBe(false);
  });
});

describe("print exclusions", () => {
  const calendar: readonly EarningsPrint[] = [
    { symbol: "MU", date: "2026-09-30", status: "confirmed", source: "test" },
    { symbol: "NVDA", date: "2026-10-01", status: "confirmed", source: "test" },
  ];

  it("excludes the print day and one session either side, for that ticker only", () => {
    const dates = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"];
    expect([...printExclusions("MU", dates, calendar)]).toEqual([
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
    ]);
  });

  it("counts sessions, not calendar days, across a weekend", () => {
    const friday: readonly EarningsPrint[] = [
      { symbol: "MU", date: "2026-10-09", status: "confirmed", source: "test" },
    ];
    expect([...printExclusions("MU", ["2026-10-08", "2026-10-12", "2026-10-13"], friday)]).toEqual([
      "2026-10-08",
      "2026-10-12",
    ]);
  });
});
