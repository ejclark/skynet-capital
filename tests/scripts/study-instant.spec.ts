import { describe, expect, it } from "@rstest/core";
import { loadInput, shiftCalendar, shiftDay } from "../../scripts/study/worlds/inputs.mjs";
import {
  checkInstant,
  DEFAULT_INSTANT,
  INSTANT,
  worldInstant,
} from "../../scripts/study/worlds/instant.mjs";

// A study world on its own instant (#8005): the profile worlds stand on 2026-10-08, before the
// campaigns, editions and quests a cross-feature study walks through existed. A world names its own
// instant, and a layer can move a whole book by whole weeks so every weekday, session and fill hour
// still holds (scripts/study/worlds/inputs.mjs, instant.mjs).

describe("the instant a world stands on", () => {
  it("is the default unless the process was started for a world that names its own", () => {
    expect(INSTANT).toBe(process.env.STUDY_INSTANT ?? DEFAULT_INSTANT);
  });

  it("accepts a New York time with its offset and nothing looser", () => {
    expect(checkInstant("2026-11-19T15:00:00-05:00")).toBe("2026-11-19T15:00:00-05:00");
    expect(() => checkInstant("2026-11-19")).toThrow(/not a New York time/);
    expect(() => checkInstant("2026-11-19T15:00:00Z")).toThrow(/not a New York time/);
  });

  it("is read per world from a run's manifest, and from its one instant before there were many", () => {
    const manifest = {
      instant: DEFAULT_INSTANT,
      instants: { "profile-today": DEFAULT_INSTANT, later: "2026-11-19T15:00:00-05:00" },
    };
    expect(worldInstant(manifest, "later")).toBe("2026-11-19T15:00:00-05:00");
    expect(worldInstant({ instant: DEFAULT_INSTANT }, "later")).toBe(DEFAULT_INSTANT);
  });
});

describe("moving a book by whole weeks", () => {
  it("moves a day, and a day the market is shut back to the session before it", () => {
    expect(shiftDay("2026-11-06", 42)).toBe("2026-12-18");
    // Two expiries six weeks on land on Christmas and New Year's Day: the expiry is the Thursday.
    expect(shiftDay("2026-11-13", 42)).toBe("2026-12-24");
    expect(shiftDay("2026-11-20", 42)).toBe("2026-12-31");
  });

  it("moves the expiry inside an OCC symbol and leaves keys, tokens and prose alone", () => {
    const moved = shiftCalendar(
      {
        "2026-10-09": "a key is not a fact",
        symbol: "CRWV261106P00080000",
        at: "@-2d 10:31",
        note: "expires 2026-11-06",
        listed: ["2026-10-30", "2026-11-06"],
        commit: "dccf617c00a86a2852fbbaa79c30d5fa5482ac9d",
      },
      42,
    );
    expect(moved).toEqual({
      "2026-10-09": "a key is not a fact",
      symbol: "CRWV261218P00080000",
      at: "@-2d 10:31",
      note: "expires 2026-11-06",
      listed: ["2026-12-11", "2026-12-18"],
      commit: "dccf617c00a86a2852fbbaa79c30d5fa5482ac9d",
    });
  });

  it("refuses a shift that is not whole weeks, which would move fills off their sessions", () => {
    expect(() => shiftCalendar({ d: "2026-11-06" }, 40)).toThrow(/whole weeks/);
  });

  it("leaves the profile worlds where they were", () => {
    const today = loadInput("profile-today") as {
      instant?: string;
      market: { expirations: string[] };
    };
    expect(today.instant).toBeUndefined();
    expect(today.market.expirations[0]).toBe("2026-10-09");
  });
});
