import {
  breadthShare,
  breadthVote,
  drawdownVote,
  episodesByReading,
  forward,
  indexVotes,
  MIN_BREADTH,
  meanVote,
  readingOf,
  runsOf,
  SLOW,
  scoreOf,
  sma,
  smoothReadings,
  trendVote,
  vixLevelVote,
  vixTermVote,
} from "../../scripts/research/market-reading-math.mjs";

/**
 * The market reading's votes, score and graders (plan #5496). Specified against constructed series
 * with known answers: the failures these exist to prevent are a missing input reading as a neutral
 * 0 (which drags every score toward "mixed"), a vote that peeks past the session it describes, and
 * a forward window that grades an unfinished outcome.
 */

describe("sma", () => {
  it("has no value until n closes exist, then averages the trailing n", () => {
    expect(sma([1, 2, 3, 4], 3)).toEqual([null, null, 2, 3]);
  });
});

describe("trendVote", () => {
  it("is +1 only when the close and the 50-session sit above the 200-session", () => {
    expect(trendVote(110, 105, 100)).toBe(1);
    expect(trendVote(90, 95, 100)).toBe(-1);
  });
  it("is 0 when the close and the 50-session disagree about the 200-session", () => {
    expect(trendVote(98, 105, 100)).toBe(0); // a pullback inside an uptrend
    expect(trendVote(103, 95, 100)).toBe(0); // a bounce inside a downtrend
  });
  it("refuses to vote before the 200-session average exists", () => {
    expect(trendVote(110, 105, null)).toBeNull();
  });
});

describe("drawdownVote", () => {
  it("uses the house lines: within 3% is +1, 10% or more under is −1", () => {
    expect(drawdownVote(-0.029)).toBe(1);
    expect(drawdownVote(-0.03)).toBe(0);
    expect(drawdownVote(-0.099)).toBe(0);
    expect(drawdownVote(-0.1)).toBe(-1);
    expect(drawdownVote(null)).toBeNull();
  });
});

describe("vixLevelVote and vixTermVote", () => {
  it("reads the house VIX buckets: calm +1, elevated 0, fear −1", () => {
    expect(vixLevelVote(16.5)).toBe(1);
    expect(vixLevelVote(20)).toBe(0);
    expect(vixLevelVote(25)).toBe(-1);
    expect(vixLevelVote(null)).toBeNull();
  });
  it("reads contango as calm and backwardation as stress", () => {
    expect(vixTermVote(16.46, 18.49)).toBe(1); // 0.890
    expect(vixTermVote(20.38, 20.71)).toBe(0); // 0.984
    expect(vixTermVote(30, 28)).toBe(-1);
    expect(vixTermVote(20, null)).toBeNull(); // before VIX3M existed
  });
});

describe("breadth", () => {
  it("counts only funds that have an average, and refuses a share from too few", () => {
    const few = Array.from({ length: MIN_BREADTH - 1 }, () => true);
    expect(breadthShare([...few, null]).share).toBeNull();
    const nine = [true, true, true, false, false, false, false, false, false];
    expect(breadthShare(nine)).toEqual({ up: 3, of: 9, share: 1 / 3 });
  });
  it("votes +1 at 60% or more above, −1 at 40% or fewer", () => {
    expect(breadthVote(6 / 9)).toBe(1);
    expect(breadthVote(5 / 9)).toBe(0);
    expect(breadthVote(4 / 9)).toBe(0);
    expect(breadthVote(3 / 9)).toBe(-1);
  });
});

describe("meanVote and scoreOf", () => {
  it("drops a missing index instead of reading it as neutral", () => {
    expect(meanVote([1, null])).toBe(1);
    expect(meanVote([1, -1])).toBe(0);
    expect(meanVote([null, null])).toBeNull();
  });
  it("averages the votes present and needs four of the five", () => {
    expect(scoreOf({ trend: 1, drawdown: 0.5, vixLevel: 1, vixTerm: 1, breadth: -1 })).toBe(50);
    expect(scoreOf({ trend: 1, drawdown: 1, vixLevel: 1, vixTerm: null, breadth: 1 })).toBe(100);
    expect(scoreOf({ trend: 1, drawdown: 1, vixLevel: 1, vixTerm: null, breadth: null })).toBe(
      null,
    );
  });
});

describe("readingOf", () => {
  it("cuts the score into five readings at ±20 and ±60", () => {
    expect(readingOf(60)).toBe("bull");
    expect(readingOf(59)).toBe("leaning bull");
    expect(readingOf(20)).toBe("leaning bull");
    expect(readingOf(19)).toBe("mixed");
    expect(readingOf(-19)).toBe("mixed");
    expect(readingOf(-20)).toBe("leaning bear");
    expect(readingOf(-59)).toBe("leaning bear");
    expect(readingOf(-60)).toBe("bear");
    expect(readingOf(null)).toBeNull();
  });
});

describe("indexVotes", () => {
  it("never reads a close after the session it votes on", () => {
    const rising = Array.from({ length: SLOW + 10 }, (_, i) => 100 + i);
    const crash = [...rising, 50, 50, 50];
    // The votes up to the last rising session are identical whatever follows them.
    expect(indexVotes(crash).slice(0, rising.length)).toEqual(indexVotes(rising));
    expect(indexVotes(rising).at(-1)).toMatchObject({ trend: 1, drawdown: 1 });
    expect(indexVotes(crash).at(-1)).toMatchObject({ drawdown: -1 });
  });
});

describe("forward", () => {
  it("returns the h-session return and the lowest close on the way", () => {
    const closes = [100, 95, 90, 104];
    const out = forward(closes, 0, 3);
    expect(out?.ret).toBeCloseTo(0.04, 12);
    expect(out?.low).toBeCloseTo(-0.1, 12);
  });
  it("grades nothing when the window has not finished", () => {
    expect(forward([100, 101, 102], 0, 3)).toBeNull();
  });
});

describe("episodesByReading", () => {
  it("splits a reading into episodes on gaps longer than the horizon", () => {
    const labels = ["bear", "bear", "bull", "bear", null, "bull"];
    const eps = episodesByReading(labels, 1);
    expect(eps.get("bear")).toEqual([[0, 1], [3]]);
    expect(eps.get("bull")).toEqual([[2], [5]]);
  });
});

describe("smoothReadings and runsOf", () => {
  it("smooths a one-day dip out of a bull run", () => {
    expect(smoothReadings([80, 80, 80, -40, 80], 5)).toEqual([
      "bull",
      "bull",
      "bull",
      "leaning bull",
      "leaning bull",
    ]);
    expect(smoothReadings([null, 70], 5)).toEqual([null, "bull"]);
  });
  it("counts consecutive labels as runs", () => {
    expect(runsOf(["bull", "bull", "mixed", "bull"])).toEqual([
      { reading: "bull", n: 2 },
      { reading: "mixed", n: 1 },
      { reading: "bull", n: 1 },
    ]);
  });
});
