import {
  currentDayStreak,
  dayStreakBoard,
  longestDayStreak,
} from "../../src/observatory/day-trophies.js";
import type { EquitySample } from "../../src/observatory/history-store.js";

/**
 * LOSING RUNS AND RUN TOTALS (#780). The green side is covered in `history-metrics.spec.ts`; this
 * file pins the three things that were new: the red counterpart, what a run was worth, and the run
 * still open at the last recorded day.
 *
 * The invariant worth guarding hardest is that a run's percent is COMPOUNDED, not summed. Three
 * +10% days from $100 land at $133.10 — a 33.10% run, not 30% — and a UI that added the daily
 * numbers would be quietly overstating every long streak.
 */

const close = (day: number, equity: number, participantId = "x"): EquitySample => ({
  at: `2026-08-${String(day).padStart(2, "0")}T20:00:00.000Z`,
  participantId,
  equity,
  cash: 0,
  realizedPl: 0,
});

describe("longestDayStreak (red)", () => {
  it("counts a run of down days and reports the loss as a negative total", () => {
    // Thu 13 → Fri 14 → Mon 17: two down days, and the weekend does not break them.
    const streak = longestDayStreak([close(13, 100), close(14, 90), close(17, 80)], "red");
    expect(streak).toEqual({
      direction: "red",
      length: 2,
      from: "2026-08-14",
      to: "2026-08-17",
      abs: -20,
      pct: -20,
    });
  });

  it("ends a red run on a flat day the same way a green one ends", () => {
    const streak = longestDayStreak(
      [
        close(10, 100),
        close(11, 90), // red
        close(12, 90), // flat — ends it
        close(13, 80), // red
        close(14, 70), // red
      ],
      "red",
    );
    expect(streak).toMatchObject({ length: 2, from: "2026-08-13", to: "2026-08-14", abs: -20 });
    expect(streak?.pct).toBeCloseTo(-22.22, 2);
  });

  it("is null for a book that never had two down days, rather than a zero-length run", () => {
    expect(longestDayStreak([close(10, 100), close(11, 110)], "red")).toBeNull();
    expect(longestDayStreak([], "red")).toBeNull();
  });

  it("keeps the two directions independent on the same history", () => {
    const samples = [close(10, 100), close(11, 110), close(12, 120), close(13, 100)];
    expect(longestDayStreak(samples, "green")).toMatchObject({ length: 2, abs: 20 });
    expect(longestDayStreak(samples, "red")).toMatchObject({ length: 1, abs: -20 });
  });
});

describe("run totals", () => {
  it("compounds the run's percent rather than summing the daily ones", () => {
    // +10% three times from $100 → $133.10. Summing the days would claim 30%.
    const streak = longestDayStreak(
      [close(10, 100), close(11, 110), close(12, 121), close(13, 133.1)],
      "green",
    );
    expect(streak?.length).toBe(3);
    expect(streak?.abs).toBeCloseTo(33.1, 6);
    expect(streak?.pct).toBeCloseTo(33.1, 6);
  });

  it("reports 0% rather than dividing by a zero starting equity", () => {
    const streak = longestDayStreak([close(10, 0), close(11, 50), close(12, 80)], "green");
    expect(streak).toMatchObject({ length: 2, abs: 80, pct: 0 });
  });

  it("measures the run's dollars, not the equity it happened to end at", () => {
    const board = dayStreakBoard([close(10, 5_000), close(11, 5_400), close(12, 5_900)], "green");
    expect(board[0]).toMatchObject({ participantId: "x", length: 2, abs: 900 });
  });
});

describe("currentDayStreak", () => {
  it("reports the run open at the most recent recorded day, whichever way it is going", () => {
    expect(currentDayStreak([close(10, 100), close(11, 110), close(12, 120)])).toMatchObject({
      direction: "green",
      length: 2,
      to: "2026-08-12",
    });
    expect(currentDayStreak([close(10, 100), close(11, 110), close(12, 95)])).toMatchObject({
      direction: "red",
      length: 1,
      to: "2026-08-12",
    });
  });

  it("is null when the last recorded day was flat — a flat day ends a run and starts none", () => {
    expect(currentDayStreak([close(10, 100), close(11, 110), close(12, 110)])).toBeNull();
  });

  it("is null before any day-over-day change exists", () => {
    expect(currentDayStreak([])).toBeNull();
    expect(currentDayStreak([close(10, 100)])).toBeNull();
  });

  it("reads the participant with the most recent recorded day on a mixed history", () => {
    const streak = currentDayStreak([
      close(10, 100, "alice"),
      close(11, 90, "alice"), // alice's last recorded day is the 11th
      close(10, 100, "bob"),
      close(11, 110, "bob"),
      close(12, 130, "bob"), // bob's is the 12th — the more recent
    ]);
    expect(streak).toMatchObject({ direction: "green", length: 2, to: "2026-08-12", abs: 30 });
  });
});
