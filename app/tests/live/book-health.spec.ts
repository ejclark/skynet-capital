import {
  balanceRead,
  committedShareOf,
  DETECTOR_NAME,
  dollars,
  findingReading,
  HEALTH_GLYPH,
  type HealthFinding,
  healthLine,
  idleShareOf,
  LEVEL_WORD,
  type PlayHealth,
  playsByIdle,
  refusedCount,
  standingFor,
  standingLine,
  targetLine,
} from "../../src/live/book-health";

const counts = (gate: number, signal: number) => ({
  available: true as const,
  counts: { gate, signal, byDetector: {} },
});

/** #5493 slice 2 — the head's line for the book's health: counts by level, each level its own
 *  glyph and word, never hue alone; nothing at all when the server could not read the book. */
describe("healthLine", () => {
  it("says nothing for a book the server could not read, or an older server's payload", () => {
    expect(healthLine({ available: false })).toBeNull();
    expect(healthLine(undefined)).toBeNull();
  });

  it("says Balanced when nothing is found — a claim only a read book supports", () => {
    const line = healthLine(counts(0, 0));
    expect(line?.level).toBe("balanced");
    expect(line?.parts).toEqual([]);
    expect(line?.label).toMatch(/^Balanced/);
  });

  it("counts gates before signals, each with its own glyph and word", () => {
    const line = healthLine(counts(1, 2));
    expect(line?.level).toBe("gate");
    expect(line?.parts.map((p) => `${p.glyph} ${p.text}`)).toEqual(["■ 1 gate", "◆ 2 signals"]);
    expect(line?.label).toBe("Book health: 1 gate, 2 signals");
  });

  it("leaves out a level with nothing at it, and leads with the worst level present", () => {
    expect(healthLine(counts(0, 1))?.parts.map((p) => p.text)).toEqual(["1 signal"]);
    expect(healthLine(counts(0, 1))?.level).toBe("signal");
    expect(healthLine(counts(3, 0))?.parts.map((p) => p.text)).toEqual(["3 gates"]);
  });

  it("gives every level a glyph unique among the levels — the word and shape carry it", () => {
    const glyphs = Object.values(HEALTH_GLYPH);
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });
});

const found = (over: Partial<HealthFinding> & Pick<HealthFinding, "detector">): HealthFinding => ({
  level: "signal",
  reading: 0.5,
  threshold: 0.25,
  words: "A sentence.",
  ...over,
});

const play = (over: Partial<PlayHealth> & Pick<PlayHealth, "playbookId">): PlayHealth => ({
  mode: "standard",
  enabled: true,
  openPositions: 0,
  refusalsLastSession: {},
  ...over,
});

/** #5493 slice 3 — what the Balance section draws from the server's field: the owner's findings
 *  and plays, counts alone for anyone else, nothing for a book that was not read. */
describe("balanceRead", () => {
  it("is unread for a book the server could not read, and for an older server", () => {
    expect(balanceRead({ available: false })).toEqual({ kind: "unread" });
    expect(balanceRead(undefined)).toEqual({ kind: "unread" });
  });

  it("is counts-only when the payload carries no findings — a non-owner's copy", () => {
    expect(balanceRead(counts(0, 2))).toEqual({ kind: "counts" });
  });

  it("is the owner's findings and plays, and an empty list of findings is a read book, not a missing one", () => {
    const f = found({ detector: "idle" });
    expect(balanceRead({ ...counts(0, 1), findings: [f], plays: [] })).toEqual({
      kind: "owner",
      findings: [f],
      plays: [],
    });
    expect(balanceRead({ ...counts(0, 0), findings: [] })).toEqual({
      kind: "owner",
      findings: [],
      plays: [],
    });
  });
});

describe("the words a finding wears", () => {
  it("names every detector and both levels, and a level's word is never its glyph", () => {
    expect(Object.keys(DETECTOR_NAME).sort()).toEqual([
      "concentrated",
      "idle",
      "imbalanced",
      "looping",
      "stuck",
    ]);
    expect(LEVEL_WORD).toEqual({ gate: "Gate", signal: "Signal" });
  });

  it("reads a share against its line, over or under", () => {
    expect(findingReading(found({ detector: "concentrated", reading: 0.46, threshold: 0.4 }))).toBe(
      "46% · over the 40% line",
    );
    expect(findingReading(found({ detector: "imbalanced", reading: 0.04, threshold: 0.1 }))).toBe(
      "4% · under the 10% line",
    );
    expect(findingReading(found({ detector: "idle", reading: 0.61, threshold: 0.6 }))).toBe(
      "61% · over the 60% line",
    );
  });

  it("reads an imbalance against a play's target: the share, the target, the points, the level's line", () => {
    const band = { target: 0.7, direction: "over" as const, drift: 0.052, signal: 0.05, gate: 0.1 };
    expect(
      findingReading(
        found({ detector: "imbalanced", level: "signal", reading: 0.752, threshold: 0.75, band }),
      ),
    ).toBe("75.2% · over the 70% target by 5.2 points, signal at 5");
    expect(
      findingReading(
        found({
          detector: "imbalanced",
          level: "gate",
          reading: 0.58,
          threshold: 0.6,
          band: { ...band, direction: "under", drift: -0.12 },
        }),
      ),
    ).toBe("58% · under the 70% target by 12 points, gate at 10");
  });

  it("keeps the placeholder's line for an imbalance with no target behind it", () => {
    expect(findingReading(found({ detector: "imbalanced", reading: 0.95, threshold: 0.9 }))).toBe(
      "95% · over the 90% line",
    );
  });

  it("reads a stuck position as sessions held against the level's line", () => {
    expect(
      findingReading(found({ detector: "stuck", level: "gate", reading: 5, threshold: 5 })),
    ).toBe("held 5 sessions · gate at 5");
    expect(
      findingReading(found({ detector: "stuck", level: "signal", reading: 1, threshold: 1 })),
    ).toBe("held 1 session · signal at 1");
  });

  it("reads a looping play as checks all refused, or as sessions in a row", () => {
    expect(findingReading(found({ detector: "looping", loop: "options-level", reading: 6 }))).toBe(
      "refused on all 6 checks",
    );
    expect(findingReading(found({ detector: "looping", loop: "no-window", reading: 5 }))).toBe(
      "5 sessions in a row",
    );
    expect(findingReading(found({ detector: "looping", loop: "open-no-entry", reading: 5 }))).toBe(
      "5 sessions in a row",
    );
  });
});

describe("a play's numbers", () => {
  it("derives idle and committed shares only from an allocation, never a guessed zero", () => {
    const p = play({ playbookId: "A", allocation: 20_000, committed: 5_000, idle: 15_000 });
    expect(idleShareOf(p)).toBe(0.75);
    expect(committedShareOf(p)).toBe(0.25);
    const uncapped = play({ playbookId: "B", committed: 5_000 });
    expect(idleShareOf(uncapped)).toBeUndefined();
    expect(committedShareOf(uncapped)).toBeUndefined();
    expect(
      committedShareOf(play({ playbookId: "C", allocation: 0, committed: 0 })),
    ).toBeUndefined();
  });

  it("holds a bar to the budget even when the book is over it", () => {
    expect(committedShareOf(play({ playbookId: "A", allocation: 10, committed: 25 }))).toBe(1);
  });

  it("orders the plays most idle first, the unknown last, and the id breaks a tie", () => {
    const plays = [
      play({ playbookId: "UNCAPPED" }),
      play({ playbookId: "FULL", allocation: 100, committed: 100, idle: 0 }),
      play({ playbookId: "TIE-B", allocation: 100, committed: 50, idle: 50 }),
      play({ playbookId: "EMPTY", allocation: 100, committed: 0, idle: 100 }),
      play({ playbookId: "TIE-A", allocation: 200, committed: 100, idle: 100 }),
    ];
    expect(playsByIdle(plays).map((p) => p.playbookId)).toEqual([
      "EMPTY",
      "TIE-A",
      "TIE-B",
      "FULL",
      "UNCAPPED",
    ]);
    // The input is never reordered in place.
    expect(plays[0]?.playbookId).toBe("UNCAPPED");
  });

  it("sums what the guards refused across reasons", () => {
    expect(
      refusedCount(
        play({ playbookId: "A", refusalsLastSession: { "options-level": 4, "no-quote": 2 } }),
      ),
    ).toBe(6);
    expect(refusedCount(play({ playbookId: "A" }))).toBe(0);
  });

  it("says where a play stands against its target, inside its band or past a line, in words", () => {
    const at = { target: 0.7, signal: 0.05, gate: 0.1 };
    expect(targetLine({ ...at, share: 0.661, drift: -0.039, level: "inside" })).toBe(
      "Target 70% · now 66.1% · inside its 5-point band",
    );
    expect(targetLine({ ...at, share: 0.752, drift: 0.052, level: "signal" })).toBe(
      "Target 70% · now 75.2% · 5.2 points over, signal at 5",
    );
    expect(targetLine({ ...at, share: 0.58, drift: -0.12, level: "gate" })).toBe(
      "Target 70% · now 58% · 12 points under, gate at 10",
    );
  });

  it("writes a budget in whole dollars", () => {
    expect(dollars(45_000)).toBe("$45,000");
    expect(dollars(1_234_567)).toBe("$1,234,567");
  });
});

/** #5493 slice 5 — how long a finding has stood and which way it is going: a glyph and words, so
 *  the direction never rides on hue, and nothing at all when the server keeps no history. */
describe("standingLine", () => {
  const HOUR = 60 * 60 * 1000;
  const standing = (trend: "new" | "worse" | "better" | "steady", ms = 0) => ({
    since: "2026-10-12T12:00:00.000Z",
    standingMs: ms,
    trend,
  });

  it("says nothing without a standing", () => {
    expect(standingLine(undefined)).toBeNull();
  });

  it("gives each direction its own glyph and word", () => {
    const lines = (["worse", "better", "steady", "new"] as const).map((t) =>
      standingLine(standing(t, 5 * 24 * HOUR)),
    );
    expect(lines.map((l) => `${l?.glyph} ${l?.word}`)).toEqual([
      "▲ Worse",
      "▼ Easing",
      "▬ Steady",
      "✦ New",
    ]);
    expect(new Set(lines.map((l) => l?.glyph)).size).toBe(4);
  });

  it("says how long it has stood, in the unit a phone has room for", () => {
    expect(standingFor(10 * 60 * 1000)).toBe("under an hour");
    expect(standingFor(HOUR)).toBe("1 hour");
    expect(standingFor(30 * HOUR)).toBe("30 hours");
    expect(standingFor(48 * HOUR)).toBe("2 days");
    expect(standingFor(5 * 24 * HOUR + 3 * HOUR)).toBe("5 days");
  });

  it("words the whole line for a screen reader, and a new finding as first seen", () => {
    expect(standingLine(standing("worse", 3 * 24 * HOUR))?.label).toBe("Worse, standing 3 days");
    expect(standingLine(standing("new"))?.label).toBe("New, first seen just now");
  });
});
