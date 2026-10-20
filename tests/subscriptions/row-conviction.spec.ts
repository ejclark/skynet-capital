import type { PlaybookSubscription } from "../../src/domain/types.js";
import { findPair } from "../../src/playbooks/pair-table.js";
import {
  carriedReason,
  carryRowConvictions,
  rowConviction,
} from "../../src/subscriptions/row-conviction.js";

/**
 * A ◆ row's conviction rides on every subscription to it that states none (#4469 slice 3c part 3),
 * so the bots' check (criterion 12) applies to Eric's wheel on CRWV without anyone re-typing it.
 * Since #5482's contract step only a row no single conviction record steers is carried onto; a row
 * one record steers is reached by its pointer (`pointAtRecord`), so the cases below that carry pass
 * no records.
 */

const AT = new Date("2026-10-09T12:00:00.000Z");

/** No conviction record steers any row: the carry's own ground. */
const NO_RECORDS = [] as const;

const sub = (
  playbookId: string,
  over: Partial<PlaybookSubscription> = {},
): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId,
  mode: "aggressive",
  capitalAllocated: 75_000,
  enabled: true,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...over,
});

describe("rowConviction", () => {
  it("is the CRWV wheel row's check date, with a reason that says where it came from", () => {
    const crwv = findPair("CRWV-WHEEL");
    expect(rowConviction(crwv)).toEqual({
      reason: carriedReason(crwv as NonNullable<typeof crwv>),
      checkOn: "2027-01-29",
    });
    expect(rowConviction(crwv)?.reason).toMatch(
      /^Carried from the wheel on CRWV's ◆ conviction row: /,
    );
  });

  it("is nothing for a ✓, ? or – row, or an id no row names", () => {
    for (const id of ["S1-NVDA", "SAURON", "TACO-DJT", "NOPE-1"]) {
      expect(rowConviction(findPair(id))).toBeUndefined();
    }
  });
});

describe("carryRowConvictions", () => {
  it("puts the row's conviction on a ◆ subscription that states none, and stamps the change", () => {
    const { state, carried } = carryRowConvictions(
      { sauron: [sub("CRWV-WHEEL"), sub("S1-NVDA")] },
      AT,
      findPair,
      NO_RECORDS,
    );
    expect(carried).toEqual(["sauron/CRWV-WHEEL"]);
    const [wheel, runUp] = state.sauron ?? [];
    expect(wheel?.conviction?.checkOn).toBe("2027-01-29");
    expect(wheel?.updatedAt).toBe(AT.toISOString());
    // Everything else on the subscription is as it was: budget, mode, on or paused.
    expect(wheel).toMatchObject({ mode: "aggressive", capitalAllocated: 75_000, enabled: true });
    expect(runUp).toEqual(sub("S1-NVDA"));
  });

  it("carries onto a paused subscription too — it resumes under the same test", () => {
    const { state } = carryRowConvictions(
      { sauron: [sub("CRWV-WHEEL", { enabled: false })] },
      AT,
      findPair,
      NO_RECORDS,
    );
    expect(state.sauron?.[0]?.conviction?.checkOn).toBe("2027-01-29");
    expect(state.sauron?.[0]?.enabled).toBe(false);
  });

  it("never replaces a conviction the owner stated — a new date after a failed check holds", () => {
    const own = { reason: "Still believe the premium pays", checkOn: "2027-04-30" };
    const input = { sauron: [sub("CRWV-WHEEL", { conviction: own })] };
    const { state, carried } = carryRowConvictions(input, AT);
    expect(carried).toEqual([]);
    expect(state).toBe(input);
  });

  it("carries nothing onto a ◆ row one record steers: the pointer pass reaches it (#5482)", () => {
    // The build's seeded AI-dip view steers the CRWV wheel.
    const input = { sauron: [sub("CRWV-WHEEL")] };
    const { state, carried } = carryRowConvictions(input, AT);
    expect(carried).toEqual([]);
    expect(state).toBe(input);
  });

  it("never carries a copy back beside a pointer, so a pointed pair is not rewritten every poll", () => {
    const input = { sauron: [sub("CRWV-WHEEL", { convictionId: "a-members-view" })] };
    expect(carryRowConvictions(input, AT, findPair, NO_RECORDS).state).toBe(input);
  });

  it("hands back the very state it was given when nothing is carried, so the caller writes nothing", () => {
    const input = { sauron: [sub("S1-NVDA")], banker: [sub("SAURON")] };
    expect(carryRowConvictions(input, AT).state).toBe(input);
  });
});
