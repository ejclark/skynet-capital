import type { PlaybookCard } from "../../src/live/bot-playbooks";
import {
  inGap,
  laneFor,
  laneSummary,
  placeIn,
  tradesFor,
  weekVerdict,
} from "../../src/live/check-week";
import type { CheckWeek, PlaybookHeartbeat } from "../../src/live/heartbeat";

/** #5073 slice 2 — the pure half of drawing a bot's week: whose lane is whose, where an instant
 *  sits, and the words in place of the shapes. */

const OPEN = Date.parse("2026-10-05T13:30:00Z");
const CLOSE = Date.parse("2026-10-05T20:00:00Z");
const verdict: PlaybookHeartbeat = {
  mode: "standard",
  state: "long",
  since: "2026-10-05T13:30:00Z",
  sinceIsLowerBound: false,
};
const week: CheckWeek = {
  bucketMs: 1_800_000,
  now: CLOSE,
  sessions: [{ date: "2026-10-05", openAt: OPEN, closeAt: CLOSE }],
  checks: [Array.from({ length: 13 }, () => 1)],
  gaps: [],
  lanes: [
    { playbookId: "CRWV-WHEEL", mode: "standard", states: [[]] },
    { playbookId: "CRWV-WHEEL", mode: "aggressive", slot: 1, states: [[]] },
    { mode: "standard", slot: 0, states: [["long", "long", "flat", null]] },
  ],
  trades: [
    { at: OPEN + 60_000, symbol: "CRWV", side: "sell", playbookId: "CRWV-WHEEL" },
    { at: OPEN + 120_000, symbol: "NVDA", side: "buy" },
  ],
};
const card = (over: Partial<PlaybookCard>): PlaybookCard => ({
  key: "k",
  state: "long",
  ...over,
});

describe("laneFor", () => {
  it("finds a named card's lane by its id, in its own mode when it runs in two", () => {
    expect(laneFor(card({ playbookId: "CRWV-WHEEL", mode: "aggressive" }), week, null)?.slot).toBe(
      1,
    );
    expect(laneFor(card({ playbookId: "CRWV-WHEEL" }), week, null)?.mode).toBe("standard");
    expect(laneFor(card({ playbookId: "S1-NVDA" }), week, null)).toBeUndefined();
  });

  it("finds a nameless card's lane by the slot of the verdict line it was read from", () => {
    expect(laneFor(card({ verdict }), week, [verdict])?.states[0]?.[0]).toBe("long");
    expect(laneFor(card({}), week, [verdict])).toBeUndefined();
  });
});

describe("tradesFor", () => {
  it("gives a card only its own playbook's trades, and a nameless card none", () => {
    expect(tradesFor(card({ playbookId: "CRWV-WHEEL" }), week).map((t) => t.symbol)).toEqual([
      "CRWV",
    ]);
    expect(tradesFor(card({}), week)).toEqual([]);
  });
});

describe("placeIn · inGap", () => {
  const session = week.sessions[0];
  it("places an instant through its session, and nothing outside it", () => {
    if (!session) throw new Error("session expected");
    expect(placeIn(session, OPEN)).toBe(0);
    expect(placeIn(session, (OPEN + CLOSE) / 2)).toBe(0.5);
    expect(placeIn(session, CLOSE + 1)).toBeUndefined();
  });
  it("marks every half hour a gap touches", () => {
    if (!session) throw new Error("session expected");
    const gapped = { ...week, gaps: [{ from: OPEN + 20 * 60_000, to: OPEN + 40 * 60_000 }] };
    expect([0, 1, 2].map((b) => inGap(gapped, session, b))).toEqual([true, true, false]);
  });
});

describe("weekVerdict", () => {
  it("says none missed on a week with no gap", () => {
    expect(weekVerdict(week)).toEqual({ ok: true, glyph: "✓", word: "none missed" });
  });
  it("counts the gaps and names the longest", () => {
    const v = weekVerdict({
      ...week,
      gaps: [
        { from: OPEN, to: OPEN + 3 * 60_000 },
        { from: OPEN + 3_600_000, to: OPEN + 3_600_000 + 75 * 60_000 },
      ],
    });
    expect(v?.ok).toBe(false);
    expect(v?.glyph).toBe("✕");
    expect(v?.word).toBe("2 gaps with no check");
    expect(v?.detail).toMatch(/^Longest: no check recorded .+ for 1h 15m$/);
  });
});

describe("laneSummary", () => {
  it("says the answer given most of the half hours asked, and the trades placed", () => {
    const lane = week.lanes[2];
    expect(laneSummary(lane, [], false)).toBe(
      "This week: wants to hold in 2 of 3 half hours asked.",
    );
    expect(laneSummary(undefined, week.trades.slice(0, 1), false)).toBe(
      "This week: no check asked it. 1 trade placed.",
    );
    expect(laneSummary(lane, [], true)).toBe("This week: can't fire.");
  });
});

describe("weekVerdict — before the week has begun", () => {
  it("claims nothing before this week's first open", () => {
    expect(weekVerdict({ ...week, checks: [Array.from({ length: 13 }, () => null)] })).toBe(
      undefined,
    );
  });
});

describe("tradesFor — a playbook in two modes", () => {
  it("keeps to the mode its card's lane draws", () => {
    const both = {
      ...week,
      trades: [
        {
          at: OPEN,
          symbol: "CRWV",
          side: "sell" as const,
          playbookId: "CRWV-WHEEL",
          mode: "standard",
        },
        {
          at: OPEN,
          symbol: "CRWV",
          side: "sell" as const,
          playbookId: "CRWV-WHEEL",
          mode: "aggressive",
        },
      ],
    };
    expect(
      tradesFor(card({ playbookId: "CRWV-WHEEL", mode: "aggressive" }), both).map((t) => t.mode),
    ).toEqual(["aggressive"]);
  });
});
