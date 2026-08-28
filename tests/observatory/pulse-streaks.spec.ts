import type { EquitySample } from "../../src/observatory/history-store.js";
import { pulseStreaks } from "../../src/observatory/pulse-streaks.js";
import type { RoundTrip } from "../../src/trading/round-trips.js";
import { tradeStats } from "../../src/trading/trade-stats.js";

/**
 * The Pulse page's streaks section (#780). Two groups, never merged: trading-day runs off the
 * recorded equity curve, and trade runs off closed round trips. Each group says out loud when it
 * has nothing rather than showing a zero, and each carries the caption that tells a reader which
 * of the two they are looking at.
 */

const close = (day: number, equity: number): EquitySample => ({
  at: `2026-08-${String(day).padStart(2, "0")}T20:00:00.000Z`,
  participantId: "sauron",
  equity,
  cash: 0,
  realizedPl: 0,
});

const trip = (realized: number, day: number): RoundTrip => ({
  symbol: "NVDA",
  quantity: 10,
  entryPrice: 100,
  exitPrice: 100 + realized / 10,
  openedAt: `2026-08-${String(day).padStart(2, "0")}T14:00:00.000Z`,
  closedAt: `2026-08-${String(day).padStart(2, "0")}T19:00:00.000Z`,
  holdMs: 5 * 60 * 60 * 1000,
  realized,
  returnPct: realized / 10,
});

const groups = (samples: readonly EquitySample[], trips: readonly RoundTrip[] = []) =>
  pulseStreaks(samples, tradeStats(trips), "UTC");

const row = (samples: readonly EquitySample[], label: string) =>
  groups(samples)[0]?.rows.find((r) => r.label === label);

describe("pulseStreaks — trading-day runs", () => {
  it("shows the open run, both longest runs, and what each was worth", () => {
    const day = groups([close(10, 100), close(11, 110), close(12, 120), close(13, 100)])[0];
    expect(day?.title).toBe("Trading-day runs");
    expect(day?.rows.map((r) => r.label)).toEqual([
      "Running red",
      "Longest green run",
      "Longest red run",
    ]);
    expect(day?.rows[1]).toMatchObject({ value: "2 trading days", tone: "pos" });
    expect(day?.rows[1]?.note).toBe("2026-08-11 → 2026-08-12 · +$20 · +20.00%");
  });

  it("tones an open losing run negative and reports its loss as a negative total", () => {
    const running = row([close(10, 100), close(11, 90)], "Running red");
    expect(running).toMatchObject({ value: "1 trading day", tone: "neg" });
    expect(running?.note).toBe("2026-08-11 → 2026-08-11 · -$10 · -10.00%");
  });

  it("says it needs history rather than showing a zero-day run", () => {
    const day = groups([close(10, 100)])[0];
    expect(day?.rows).toEqual([]);
    expect(day?.empty).toContain("two recorded days");
  });

  it("keeps the caption naming what it counted, so the two families can't be conflated", () => {
    const [day, trade] = groups([close(10, 100), close(11, 110)], [trip(50, 11)]);
    expect(day?.caption).toContain("weekends and holidays never break a run");
    expect(trade?.caption).toContain("scratch");
  });
});

describe("pulseStreaks — trade runs", () => {
  it("counts consecutive winners and losers over closed round trips", () => {
    const trade = groups(
      [],
      [trip(100, 10), trip(60, 11), trip(-40, 12), trip(-30, 13), trip(-20, 14)],
    )[1];
    expect(trade?.rows).toEqual([
      { label: "Running cold", value: "3 losses", note: "in a row at the last close", tone: "neg" },
      {
        label: "Longest win streak",
        value: "2 trades",
        note: "consecutive winners",
        tone: "pos",
      },
      {
        label: "Longest loss streak",
        value: "3 trades",
        note: "consecutive losers",
        tone: "neg",
      },
    ]);
  });

  it("says a single win in the singular", () => {
    const trade = groups([], [trip(100, 10)])[1];
    expect(trade?.rows[0]).toMatchObject({ label: "Running hot", value: "1 win", tone: "pos" });
  });

  it("omits a family of streak that never happened rather than printing zero", () => {
    const trade = groups([], [trip(100, 10), trip(60, 11)])[1];
    expect(trade?.rows.map((r) => r.label)).toEqual(["Running hot", "Longest win streak"]);
  });

  it("says it needs a decided trade when nothing has closed", () => {
    const trade = groups([close(10, 100), close(11, 110)])[1];
    expect(trade?.rows).toEqual([]);
    expect(trade?.empty).toContain("closed round trip");
  });
});
