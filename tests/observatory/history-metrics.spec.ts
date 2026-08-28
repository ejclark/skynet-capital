import {
  biggestSingleDayGain,
  dailyChanges,
  dayStreakBoard,
  longestDayStreak,
} from "../../src/observatory/day-trophies.js";
import {
  aggregateDoubling,
  changeOver,
  DAY_MS,
  doubledAt,
  firstAccountToDouble,
  firstAccountToFiftyPercent,
  MONTH_MS,
  reachedMultipleAt,
  seedBaseline,
} from "../../src/observatory/history-metrics.js";
import type { EquitySample } from "../../src/observatory/history-store.js";

const s = (at: string, equity: number, participantId = "x"): EquitySample => ({
  at,
  participantId,
  equity,
  cash: 0,
  realizedPl: 0,
});

const NOW = "2026-08-09T12:00:00.000Z";

describe("changeOver", () => {
  it("measures from the last sample at or before the window start", () => {
    const samples = [
      s("2026-08-07T12:00:00.000Z", 100), // two days back — the day-window baseline
      s("2026-08-08T11:00:00.000Z", 110), // just before the day cutoff → this is the baseline
      s("2026-08-09T09:00:00.000Z", 130),
    ];
    const change = changeOver(samples, DAY_MS, NOW);
    expect(change).toEqual({
      abs: 20,
      pct: (20 / 110) * 100,
      from: "2026-08-08T11:00:00.000Z",
      to: "2026-08-09T09:00:00.000Z",
      partial: false,
    });
  });

  it("marks a young history partial and falls back to the first sample", () => {
    const samples = [s("2026-08-09T10:00:00.000Z", 100), s("2026-08-09T11:00:00.000Z", 105)];
    const change = changeOver(samples, DAY_MS, NOW);
    expect(change?.partial).toBe(true);
    expect(change?.abs).toBe(5);
  });

  it("is null under two samples (the honest 'history still accruing' seam)", () => {
    expect(changeOver([], DAY_MS, NOW)).toBeNull();
    expect(changeOver([s("2026-08-09T10:00:00.000Z", 100)], DAY_MS, NOW)).toBeNull();
  });

  it("orders by timestamp regardless of input order", () => {
    const shuffled = [s("2026-08-09T09:00:00.000Z", 130), s("2026-08-07T12:00:00.000Z", 100)];
    expect(changeOver(shuffled, 3 * DAY_MS, NOW)?.abs).toBe(30);
  });

  it("the monthly window reaches back past samples the daily one excludes", () => {
    const samples = [
      s("2026-07-12T12:00:00.000Z", 100), // ~4 weeks back — inside the 30-day window only
      s("2026-08-08T11:00:00.000Z", 110),
      s("2026-08-09T09:00:00.000Z", 130),
    ];
    expect(changeOver(samples, MONTH_MS, NOW)?.abs).toBe(30); // from the July baseline
    expect(changeOver(samples, DAY_MS, NOW)?.abs).toBe(20); // from yesterday's sample
  });
});

describe("seedBaseline", () => {
  it("returns the earliest sample — the founding record", () => {
    const samples = [s("2026-08-09T09:00:00.000Z", 130), s("2026-08-07T12:00:00.000Z", 100)];
    expect(seedBaseline(samples)?.equity).toBe(100);
  });
  it("is null with no history", () => {
    expect(seedBaseline([])).toBeNull();
  });
});

describe("doubledAt", () => {
  it("finds the first instant equity reached 2× the seed", () => {
    const samples = [
      s("t1", 100),
      s("t2", 150),
      s("t3", 200), // doubled here
      s("t4", 250),
    ];
    expect(doubledAt(samples)?.at).toBe("t3");
  });

  it("is null while the account hasn't doubled", () => {
    expect(doubledAt([s("t1", 100), s("t2", 199)])).toBeNull();
  });

  it("never awards from a non-positive seed (no trophy from a broken baseline)", () => {
    expect(doubledAt([s("t1", 0), s("t2", 100)])).toBeNull();
  });
});

describe("firstAccountToDouble", () => {
  it("awards once, to the earliest doubling across participants", () => {
    const samples = [
      s("t1", 100, "alice"),
      s("t3", 210, "alice"), // alice doubles at t3
      s("t1", 50, "bob"),
      s("t2", 120, "bob"), // bob doubles at t2 — bob wins
    ];
    expect(firstAccountToDouble(samples)).toEqual({ participantId: "bob", at: "t2" });
  });

  it("is null while nobody has doubled", () => {
    expect(firstAccountToDouble([s("t1", 100, "alice"), s("t2", 150, "alice")])).toBeNull();
  });
});

describe("aggregateDoubling", () => {
  it("sums each participant's seed and latest, and flags the 2×", () => {
    const samples = [
      s("t1", 100, "alice"),
      s("t2", 250, "alice"),
      s("t1", 100, "bob"),
      s("t2", 150, "bob"),
    ];
    expect(aggregateDoubling(samples)).toEqual({ seedTotal: 200, latestTotal: 400, doubled: true });
  });

  it("does not flag below 2×", () => {
    const samples = [s("t1", 100, "alice"), s("t2", 199, "alice")];
    expect(aggregateDoubling(samples)?.doubled).toBe(false);
  });

  it("is null with no history", () => {
    expect(aggregateDoubling([])).toBeNull();
  });
});

// 20:00Z is 4pm EDT — a market close, so the day key is unambiguous and the timezone is load-bearing.
// August 2026: the 14th is a Friday, the 17th the following Monday.
const close = (dayOfMonth: number, equity: number, participantId = "x") =>
  s(`2026-08-${String(dayOfMonth).padStart(2, "0")}T20:00:00.000Z`, equity, participantId);

describe("reachedMultipleAt", () => {
  it("finds the first instant equity reached the multiple of its seed", () => {
    const samples = [s("t1", 100), s("t2", 149), s("t3", 150), s("t4", 300)];
    expect(reachedMultipleAt(samples, 1.5)?.at).toBe("t3");
    expect(reachedMultipleAt(samples, 2)?.at).toBe("t4");
  });

  it("never awards from a non-positive seed", () => {
    expect(reachedMultipleAt([s("t1", 0), s("t2", 100)], 1.5)).toBeNull();
  });
});

describe("firstAccountToFiftyPercent", () => {
  it("awards to whoever crossed +50% first, at the instant it happened", () => {
    const samples = [
      s("t1", 100, "alice"),
      s("t3", 160, "alice"), // alice crosses at t3
      s("t1", 50, "bob"),
      s("t2", 80, "bob"), // bob crosses at t2 — bob wins
    ];
    expect(firstAccountToFiftyPercent(samples)).toEqual({ participantId: "bob", at: "t2" });
  });

  it("is null while nobody has reached +50%", () => {
    expect(firstAccountToFiftyPercent([s("t1", 100, "alice"), s("t2", 140, "alice")])).toBeNull();
  });

  it("is not consumed by the bigger trophy — a doubled account still holds it", () => {
    const samples = [s("t1", 100, "alice"), s("t2", 150, "alice"), s("t3", 220, "alice")];
    expect(doubledAt(samples)?.at).toBe("t3");
    expect(firstAccountToFiftyPercent(samples)).toEqual({ participantId: "alice", at: "t2" });
  });
});

describe("dailyChanges", () => {
  it("collapses intraday samples to the day's last, then measures close to close", () => {
    const changes = dailyChanges([
      s("2026-08-12T14:00:00.000Z", 100), // 10am ET — same trading day as the close below
      close(12, 110),
      close(13, 120),
    ]);
    expect(changes).toEqual([
      {
        participantId: "x",
        day: "2026-08-13",
        at: "2026-08-13T20:00:00.000Z",
        equity: 120,
        abs: 10,
        pct: (10 / 110) * 100,
      },
    ]);
  });

  it("treats Friday to Monday as one change — a weekend has no samples to break", () => {
    const changes = dailyChanges([close(14, 100), close(17, 150)]);
    expect(changes).toHaveLength(1);
    expect(changes[0]?.day).toBe("2026-08-17");
    expect(changes[0]?.abs).toBe(50);
  });

  it("is empty under two recorded days — the first day has nothing behind it", () => {
    expect(dailyChanges([])).toEqual([]);
    expect(dailyChanges([close(12, 100)])).toEqual([]);
    expect(dailyChanges([s("2026-08-12T14:00:00.000Z", 100), close(12, 110)])).toEqual([]);
  });

  it("orders by day regardless of input order", () => {
    const changes = dailyChanges([close(13, 120), close(11, 100), close(12, 110)]);
    expect(changes.map((c) => c.day)).toEqual(["2026-08-12", "2026-08-13"]);
  });

  it("reports 0% rather than infinity when the prior close was zero", () => {
    const changes = dailyChanges([close(12, 0), close(13, 50)]);
    expect(changes[0]).toMatchObject({ abs: 50, pct: 0 });
  });

  it("keeps participants apart instead of blending their curves", () => {
    const changes = dailyChanges([
      close(12, 100, "alice"),
      close(13, 130, "alice"),
      close(12, 500, "bob"),
      close(13, 450, "bob"),
    ]);
    expect(changes.map((c) => [c.participantId, c.abs])).toEqual([
      ["alice", 30],
      ["bob", -50],
    ]);
  });
});

describe("biggestSingleDayGain", () => {
  it("names the participant, the day, and both the dollars and the percent", () => {
    const best = biggestSingleDayGain([
      close(10, 100, "alice"),
      close(11, 120, "alice"), // +20
      close(12, 110, "alice"), // −10
      close(13, 160, "alice"), // +50 — the biggest
    ]);
    expect(best).toMatchObject({
      participantId: "alice",
      day: "2026-08-13",
      abs: 50,
      pct: (50 / 110) * 100,
    });
  });

  it("is null when every day was down — a gain trophy requires a gain", () => {
    expect(biggestSingleDayGain([close(10, 100), close(11, 90), close(12, 80)])).toBeNull();
  });

  it("ranks on dollars, so the bigger move wins even at a smaller percent", () => {
    const best = biggestSingleDayGain([
      close(10, 100, "alice"),
      close(11, 200, "alice"), // +$100 at +100%
      close(10, 10_000, "bob"),
      close(11, 11_000, "bob"), // +$1,000 at +10% — bigger in dollars
    ]);
    expect(best?.participantId).toBe("bob");
    expect(best?.abs).toBe(1000);
  });

  it("breaks a dollar tie in favour of the earlier day", () => {
    const best = biggestSingleDayGain([
      close(10, 100),
      close(11, 150), // +50
      close(12, 140),
      close(13, 190), // +50 again
    ]);
    expect(best?.day).toBe("2026-08-11");
  });

  it("is null with no history", () => {
    expect(biggestSingleDayGain([])).toBeNull();
  });
});

describe("longestDayStreak (green)", () => {
  it("counts a run across a weekend as consecutive trading days", () => {
    // Thu 13 → Fri 14 → Mon 17 → Tue 18, all up: three green days after the first recorded one.
    expect(
      longestDayStreak([close(13, 100), close(14, 110), close(17, 120), close(18, 130)], "green"),
    ) //
      .toEqual({
        direction: "green",
        length: 3,
        from: "2026-08-14",
        to: "2026-08-18",
        abs: 30,
        pct: 30,
      });
  });

  it("breaks a run on a flat day, not just a losing one", () => {
    const streak = longestDayStreak(
      [
        close(10, 100),
        close(11, 110), // green
        close(12, 110), // flat — breaks it
        close(13, 120), // green
        close(14, 130), // green
      ],
      "green",
    );
    expect(streak).toMatchObject({ length: 2, from: "2026-08-13", to: "2026-08-14", abs: 20 });
    // Measured from the close BEFORE the run (110), not from the run's own first close.
    expect(streak?.pct).toBeCloseTo(18.18, 2);
  });

  it("never counts the first recorded day as green — it beat nothing", () => {
    expect(longestDayStreak([close(10, 100)], "green")).toBeNull();
    expect(longestDayStreak([close(10, 100), close(11, 150)], "green")).toEqual({
      direction: "green",
      length: 1,
      from: "2026-08-11",
      to: "2026-08-11",
      abs: 50,
      pct: 50,
    });
  });

  it("is null with no history and when no day was green", () => {
    expect(longestDayStreak([], "green")).toBeNull();
    expect(longestDayStreak([close(10, 100), close(11, 90)], "green")).toBeNull();
  });
});

describe("dayStreakBoard", () => {
  it("ranks longest first and omits accounts with no streak rather than zeroing them", () => {
    const board = dayStreakBoard(
      [
        close(10, 100, "alice"),
        close(11, 110, "alice"),
        close(12, 120, "alice"), // alice: 2 green
        close(10, 100, "bob"),
        close(11, 110, "bob"), // bob: 1 green
        close(10, 100, "carol"),
        close(11, 90, "carol"), // carol: never green — absent, not 0
      ],
      "green",
    );
    expect(board).toEqual([
      {
        participantId: "alice",
        direction: "green",
        length: 2,
        from: "2026-08-11",
        to: "2026-08-12",
        abs: 20,
        pct: 20,
      },
      {
        participantId: "bob",
        direction: "green",
        length: 1,
        from: "2026-08-11",
        to: "2026-08-11",
        abs: 10,
        pct: 10,
      },
    ]);
  });

  it("is empty with no history", () => {
    expect(dayStreakBoard([], "green")).toEqual([]);
    expect(dayStreakBoard([], "red")).toEqual([]);
  });
});
