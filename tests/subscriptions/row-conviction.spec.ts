import { findPair } from "../../src/playbooks/pair-table.js";
import { carriedReason, rowConviction } from "../../src/subscriptions/row-conviction.js";

/**
 * A ◆ row's conviction (#4469 slice 3c part 3): the check day and reason the poll migration writes
 * as the owner's own view on a ◆ pair (`pair-conviction-migration.ts`). The inline carry that once
 * copied it onto the subscription is gone (#5482, the inline carry's replacement): the bots hold a
 * ◆ pair with no pointer exits-only, copy or not.
 */

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
