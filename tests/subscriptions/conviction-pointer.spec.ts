import type { PlaybookSubscription } from "../../src/domain/types.js";
import type { Conviction } from "../../src/playbooks/conviction-record.js";
import { CONVICTIONS } from "../../src/playbooks/conviction-store.js";
import {
  pointAtRecord,
  pointAtRecords,
  recordFor,
  restated,
} from "../../src/subscriptions/conviction-pointer.js";

/**
 * #5482 slice 2, the MIGRATE step: a subscription whose conviction a record states is pointed at
 * that record, once, and keeps its inline conviction. Everything else is left exactly as it was.
 */

const AT = new Date("2026-10-17T12:00:00.000Z");
const DAY = "2027-01-29";

const view = (over: Partial<Conviction> = {}): Conviction => ({
  id: "ai-dip-test",
  owner: "Eric",
  statedOn: "2026-10-16",
  checkOn: DAY,
  claims: [],
  steers: ["CRWV-WHEEL", "CRWV-LONG-CALL"],
  ...over,
});
const records = [view()];

const sub = (
  playbookId: string,
  over: Partial<PlaybookSubscription> = {},
): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId,
  mode: "standard",
  capitalAllocated: 75_000,
  enabled: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...over,
});
const stated = { reason: "Carried from the wheel's ◆ conviction row", checkOn: DAY };

describe("recordFor — when a conviction matches a record", () => {
  it("is the record that steers the pair and is checked on the conviction's day", () => {
    expect(recordFor("CRWV-WHEEL", stated, records)?.id).toBe("ai-dip-test");
    expect(recordFor("CRWV-LONG-CALL", stated, records)?.id).toBe("ai-dip-test");
  });

  it("is nothing for another day, so a re-dated conviction is never overridden by the record's", () => {
    expect(recordFor("CRWV-WHEEL", { ...stated, checkOn: "2027-04-30" }, records)).toBeUndefined();
  });

  it("is nothing for a pair the record does not steer", () => {
    expect(recordFor("S1-NVDA", stated, records)).toBeUndefined();
  });

  it("is nothing when two records match, because which view the pair belongs to is not decided here", () => {
    const twin = view({ id: "another-view" });
    expect(recordFor("CRWV-WHEEL", stated, [view(), twin])).toBeUndefined();
  });

  it("reads the build's seeded AI-dip view by default, for both live CRWV pairs", () => {
    expect(recordFor("CRWV-WHEEL", stated)?.id).toBe("ai-dip-2026-10");
    expect(recordFor("CRWV-LONG-CALL", stated)?.id).toBe("ai-dip-2026-10");
    expect(CONVICTIONS.get("ai-dip-2026-10")?.checkOn).toBe(DAY);
  });
});

describe("pointAtRecord — a missing pointer added, none ever replaced", () => {
  it("adds the record's id and keeps the inline conviction", () => {
    const s = sub("CRWV-WHEEL", { conviction: stated });
    expect(pointAtRecord(s, records)).toEqual({ ...s, convictionId: "ai-dip-test" });
  });

  it("returns the very subscription when there is nothing to add", () => {
    const noConviction = sub("CRWV-WHEEL");
    const redated = sub("CRWV-WHEEL", { conviction: { ...stated, checkOn: "2027-04-30" } });
    const unsteered = sub("S1-NVDA", { conviction: stated });
    for (const s of [noConviction, redated, unsteered]) expect(pointAtRecord(s, records)).toBe(s);
  });

  it("leaves a pointer already there alone, even one no record answers to", () => {
    const dangling = sub("CRWV-WHEEL", { conviction: stated, convictionId: "gone" });
    expect(pointAtRecord(dangling, records)).toBe(dangling);
  });
});

/**
 * The contract step's piece 2: the bots read a pointed pair's check from its pointer alone and run
 * it exits-only while the pointer is unusable, so a pointer no view can answer is dropped here
 * rather than left to hold its pair shut after a build changes a record.
 */
describe("pointAtRecord — a stale pointer is dropped", () => {
  const known = { held: [], ids: new Set<string>(["a-members-view"]) };

  it("drops a pointer at a seeded record that no longer steers the pair, and re-matches", () => {
    const narrowed = [view({ steers: ["CRWV-LONG-CALL"] })];
    const s = sub("CRWV-WHEEL", { conviction: stated, convictionId: "ai-dip-test" });
    const next = pointAtRecord(s, narrowed);
    expect(next).not.toHaveProperty("convictionId");
    expect(next.conviction).toEqual(stated);
    // Another seeded record that steers the pair on the same day is matched in its place.
    const moved = [...narrowed, view({ id: "successor-view", steers: ["CRWV-WHEEL"] })];
    expect(pointAtRecord(s, moved).convictionId).toBe("successor-view");
  });

  it("drops a pointer no record holds only where members' ids are known", () => {
    const dangling = sub("CRWV-WHEEL", { conviction: stated, convictionId: "gone" });
    expect(pointAtRecord(dangling, records, known)).toEqual({
      ...sub("CRWV-WHEEL", { conviction: stated }),
      convictionId: "ai-dip-test",
    });
    // Without them, "gone" could be a member's view the bots hold, so it stays.
    expect(pointAtRecord(dangling, records)).toBe(dangling);
  });

  it("drops a stale pointer on the poll and reports the move", () => {
    const input = { sauron: [sub("S1-NVDA", { convictionId: "ai-dip-test" })] };
    const members = { heldBy: () => [], ids: new Set<string>() };
    const { state, moves } = pointAtRecords(input, AT, records, members);
    expect(state.sauron?.[0]).not.toHaveProperty("convictionId");
    expect(moves).toEqual([{ accountId: "sauron", playbookId: "S1-NVDA", from: "ai-dip-test" }]);
  });

  it("keeps a pointer at a seeded record that steers the pair, whatever its inline copy says", () => {
    const s = sub("CRWV-WHEEL", {
      conviction: { ...stated, checkOn: "2027-04-30" },
      convictionId: "ai-dip-test",
    });
    expect(pointAtRecord(s, records, known)).toBe(s);
  });
});

describe("restated — a pointer never outlives the conviction it described", () => {
  it("drops the pointer when the new conviction states another day", () => {
    const s = sub("CRWV-WHEEL", {
      conviction: { ...stated, checkOn: "2027-04-30" },
      convictionId: "ai-dip-test",
    });
    const next = restated(s, records);
    expect(next).not.toHaveProperty("convictionId");
    expect(next.conviction?.checkOn).toBe("2027-04-30");
  });

  it("points a conviction that now matches, and keeps the one it already had", () => {
    expect(restated(sub("CRWV-WHEEL", { conviction: stated }), records).convictionId).toBe(
      "ai-dip-test",
    );
    expect(
      restated(sub("CRWV-WHEEL", { conviction: stated, convictionId: "ai-dip-test" }), records)
        .convictionId,
    ).toBe("ai-dip-test");
  });
});

describe("pointAtRecords — the migration", () => {
  const live = () => ({
    sauron: [
      sub("CRWV-WHEEL", { conviction: stated }),
      sub("CRWV-LONG-CALL", { conviction: stated, mode: "aggressive" }),
      sub("S1-NVDA"),
    ],
  });

  it("points both live CRWV subscriptions and touches nothing else on them", () => {
    const { state, pointed } = pointAtRecords(live(), AT, records);
    expect(pointed).toEqual(["sauron/CRWV-WHEEL", "sauron/CRWV-LONG-CALL"]);
    const [wheel, call, nvda] = state.sauron ?? [];
    expect(wheel).toEqual({
      ...sub("CRWV-WHEEL", { conviction: stated }),
      convictionId: "ai-dip-test",
      updatedAt: AT.toISOString(),
    });
    expect(call).toMatchObject({ mode: "aggressive", capitalAllocated: 75_000, enabled: true });
    expect(call?.conviction).toEqual(stated);
    expect(nvda).toEqual(sub("S1-NVDA"));
  });

  it("is idempotent: a second run changes nothing and hands back the very state it was given", () => {
    const first = pointAtRecords(live(), AT, records);
    const second = pointAtRecords(first.state, new Date("2026-10-18T00:00:00.000Z"), records);
    expect(second.pointed).toEqual([]);
    expect(second.state).toBe(first.state);
  });

  it("keeps the inline conviction of a subscription no record states, and does not stamp it", () => {
    const input = {
      sauron: [sub("CRWV-WHEEL", { conviction: { ...stated, checkOn: "2027-04-30" } })],
      banker: [sub("CRWV-WHEEL")],
    };
    const { state, pointed } = pointAtRecords(input, AT, records);
    expect(pointed).toEqual([]);
    expect(state).toBe(input);
  });

  it("points a paused subscription too — it resumes under the same record", () => {
    const { state } = pointAtRecords(
      { sauron: [sub("CRWV-WHEEL", { conviction: stated, enabled: false })] },
      AT,
      records,
    );
    expect(state.sauron?.[0]).toMatchObject({ convictionId: "ai-dip-test", enabled: false });
  });

  it("never replaces a pointer an owner or a later slice already wrote", () => {
    const input = { sauron: [sub("CRWV-WHEEL", { conviction: stated, convictionId: "gone" })] };
    expect(pointAtRecords(input, AT, records).state).toBe(input);
  });

  it("points against the build's seeded records when none are passed", () => {
    const { pointed, state } = pointAtRecords(live(), AT);
    expect(pointed).toEqual(["sauron/CRWV-WHEEL", "sauron/CRWV-LONG-CALL"]);
    expect(state.sauron?.map((s) => s.convictionId)).toEqual([
      "ai-dip-2026-10",
      "ai-dip-2026-10",
      undefined,
    ]);
  });
});

describe("a member's view handed over (#5482 slice 6c) — the owner's act is the match", () => {
  const ada = view({
    id: "crwv-floor-2026-10",
    owner: "Ada",
    checkOn: "2027-02-26",
    steers: ["CRWV-WHEEL"],
  });
  const members = (held: Record<string, Conviction[]>, ids: string[] = [ada.id]) => ({
    heldBy: (accountId: string) => held[accountId] ?? [],
    ids: new Set(ids),
  });

  it("points every subscription on a named account to a pair it steers, whatever day it states", () => {
    const input = {
      sauron: [sub("CRWV-WHEEL"), sub("CRWV-LONG-CALL", { conviction: stated })],
      banker: [sub("CRWV-WHEEL")],
    };
    const { state, pointed } = pointAtRecords(input, AT, records, members({ sauron: [ada] }));
    expect(pointed).toEqual(["sauron/CRWV-WHEEL", "sauron/CRWV-LONG-CALL"]);
    expect(state.sauron?.map((s) => s.convictionId)).toEqual([ada.id, "ai-dip-test"]);
    // Another member's bot is never steered by Ada's view.
    expect(state.banker?.[0]?.convictionId).toBeUndefined();
  });

  it("takes over from a seeded record's pointer, and hands it back once taken back", () => {
    const seeded = {
      sauron: [sub("CRWV-WHEEL", { conviction: stated, convictionId: "ai-dip-test" })],
    };
    const over = pointAtRecords(seeded, AT, records, members({ sauron: [ada] }));
    expect(over.state.sauron?.[0]?.convictionId).toBe(ada.id);
    // Taken back: still a member's id, held by no account — dropped, and the seeded match runs again.
    const back = pointAtRecords(over.state, AT, records, members({}));
    expect(back.pointed).toEqual(["sauron/CRWV-WHEEL"]);
    expect(back.state.sauron?.[0]?.convictionId).toBe("ai-dip-test");
  });

  it("drops a pointer at a member's view that no longer steers the pair, leaving none when nothing matches", () => {
    const input = { sauron: [sub("CRWV-LONG-CALL", { convictionId: ada.id })] };
    const { state } = pointAtRecords(input, AT, records, members({ sauron: [ada] }));
    expect(state.sauron?.[0]?.convictionId).toBeUndefined();
  });

  it("is idempotent, and drops a pointer no record or member holds (#5482 contract piece 2)", () => {
    const input = {
      sauron: [
        sub("CRWV-WHEEL", { convictionId: ada.id }),
        sub("S1-NVDA", { convictionId: "gone" }),
      ],
    };
    const run = pointAtRecords(input, AT, records, members({ sauron: [ada] }));
    expect(run.pointed).toEqual(["sauron/S1-NVDA"]);
    expect(run.state.sauron?.map((s) => s.convictionId)).toEqual([ada.id, undefined]);
    const again = pointAtRecords(run.state, AT, records, members({ sauron: [ada] }));
    expect(again.pointed).toEqual([]);
    expect(again.state).toBe(run.state);
  });

  it("never decides between two of a member's views on one pair: it keeps the one already pointed", () => {
    const twin = { ...ada, id: "crwv-twin-2026-10" };
    const pointedAtTwin = { sauron: [sub("CRWV-WHEEL", { convictionId: twin.id })] };
    const both = members({ sauron: [ada, twin] }, [ada.id, twin.id]);
    expect(pointAtRecords(pointedAtTwin, AT, records, both).state).toBe(pointedAtTwin);
  });

  it("survives a restated conviction: the pointer stays on the view while it is handed over", () => {
    const here = { held: [ada], ids: new Set([ada.id]) };
    const next = restated(
      sub("CRWV-WHEEL", { conviction: { ...stated, checkOn: "2027-06-30" }, convictionId: ada.id }),
      records,
      here,
    );
    expect(next.convictionId).toBe(ada.id);
    expect(pointAtRecord(sub("CRWV-WHEEL"), records, here).convictionId).toBe(ada.id);
  });
});
