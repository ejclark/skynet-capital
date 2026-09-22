import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CouncilStore,
  councilFilePathFrom,
  EMPTY_COUNCIL,
  parseCouncilState,
  weekKey,
} from "../../src/server/council-store.js";

describe("weekKey", () => {
  it("gives the same ISO week for every day in a Mon-Sun span", () => {
    // 2026-09-07 is a Monday; the week runs through 2026-09-13 (Sunday).
    const days = Array.from({ length: 7 }, (_, i) => new Date(Date.UTC(2026, 8, 7 + i, 12, 0, 0)));
    const keys = new Set(days.map(weekKey));
    expect(keys.size).toBe(1);
  });

  it("crosses into the next ISO week on the following Monday", () => {
    expect(weekKey(new Date(Date.UTC(2026, 8, 13)))).not.toBe(
      weekKey(new Date(Date.UTC(2026, 8, 14))),
    );
  });
});

describe("parseCouncilState — total, defensive", () => {
  it("parses a full state and drops junk fields", () => {
    const state = parseCouncilState({
      weeks: {
        "2026-W37": {
          abc123: { text: "NVDA runs", at: "2026-09-07T12:00:00.000Z", junk: 1 },
        },
      },
      extra: "ignored",
    });
    expect(state).toEqual({
      weeks: { "2026-W37": { abc123: { text: "NVDA runs", at: "2026-09-07T12:00:00.000Z" } } },
    });
  });

  it("drops an oversized or empty line rather than trusting it", () => {
    const state = parseCouncilState({
      weeks: {
        "2026-W37": {
          a: { text: "", at: "2026-09-07T12:00:00.000Z" },
          b: { text: "x".repeat(281), at: "2026-09-07T12:00:00.000Z" },
          c: { text: "fine", at: "2026-09-07T12:00:00.000Z" },
        },
      },
    });
    expect(state).toEqual({
      weeks: { "2026-W37": { c: { text: "fine", at: expect.any(String) } } },
    });
  });

  it("returns null for non-objects and never throws", () => {
    expect(parseCouncilState(null)).toBeNull();
    expect(parseCouncilState("nope")).toBeNull();
    expect(parseCouncilState([1, 2])).toBeNull();
    expect(parseCouncilState({})).toEqual({ weeks: {} });
  });

  it("keeps an optional playbookId when present, drops it when not a string", () => {
    const state = parseCouncilState({
      weeks: {
        "2026-W37": { a: { text: "fine", at: "2026-09-07T12:00:00.000Z", playbookId: "S1-NVDA" } },
      },
    });
    expect(state?.weeks["2026-W37"]?.a?.playbookId).toBe("S1-NVDA");
  });
});

describe("councilFilePathFrom", () => {
  it("derives a sibling council.json next to the controls file — no new env var", () => {
    expect(councilFilePathFrom("/data/bot-controls.json")).toBe("/data/council.json");
    expect(councilFilePathFrom("data/bot-controls.json")).toBe("data/council.json");
    expect(councilFilePathFrom("bot-controls.json")).toBe("council.json");
  });
});

describe("CouncilStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-council-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("loads empty state when no file exists", () => {
    const store = new CouncilStore(join(dir, "council.json"));
    expect(store.load()).toEqual(EMPTY_COUNCIL);
  });

  it("submits a line and reads it back under the given week and member", () => {
    const store = new CouncilStore(join(dir, "council.json"));
    store.submit("2026-W37", "abc123", { text: "NVDA runs", at: "2026-09-07T12:00:00.000Z" });
    expect(store.load()).toEqual({
      weeks: { "2026-W37": { abc123: { text: "NVDA runs", at: "2026-09-07T12:00:00.000Z" } } },
    });
  });

  it("replaces a member's own line for the same week — a resubmit is an edit, not a second entry", () => {
    const store = new CouncilStore(join(dir, "council.json"));
    store.submit("2026-W37", "abc123", { text: "first take", at: "2026-09-07T12:00:00.000Z" });
    store.submit("2026-W37", "abc123", { text: "revised take", at: "2026-09-08T09:00:00.000Z" });
    const week = store.load().weeks["2026-W37"];
    expect(Object.keys(week ?? {})).toEqual(["abc123"]);
    expect(week?.abc123?.text).toBe("revised take");
  });

  it("keeps different members' lines separate within the same week", () => {
    const store = new CouncilStore(join(dir, "council.json"));
    store.submit("2026-W37", "abc123", { text: "bullish", at: "2026-09-07T12:00:00.000Z" });
    store.submit("2026-W37", "def456", { text: "bearish", at: "2026-09-07T12:05:00.000Z" });
    const week = store.load().weeks["2026-W37"];
    expect(week?.abc123?.text).toBe("bullish");
    expect(week?.def456?.text).toBe("bearish");
  });

  it("keeps different weeks' lines from the same member separate", () => {
    const store = new CouncilStore(join(dir, "council.json"));
    store.submit("2026-W37", "abc123", { text: "week 37", at: "2026-09-07T12:00:00.000Z" });
    store.submit("2026-W38", "abc123", { text: "week 38", at: "2026-09-14T12:00:00.000Z" });
    expect(store.load().weeks["2026-W37"]?.abc123?.text).toBe("week 37");
    expect(store.load().weeks["2026-W38"]?.abc123?.text).toBe("week 38");
  });
});
