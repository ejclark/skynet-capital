import { COURSES } from "../../src/domain/curriculum.js";
import {
  FIRST_OTM_EXPIRY_MILESTONE,
  FIRST_REALIZED_PROFIT_MILESTONE,
  milestoneCard,
} from "../../src/domain/milestone-catalog.js";

/**
 * Every milestone that can be earned has words to show (#784 slice 5). A gap here is not cosmetic:
 * Activity drops an earn it cannot title, so an untitled milestone is an earn with no row — the half
 * of the plan's falsifier that is easy to miss.
 */
describe("milestoneCard", () => {
  it("titles every ladder milestone with its points, exactly as the curriculum words it", () => {
    for (const course of COURSES) {
      for (const m of course.milestones) {
        expect(milestoneCard(m.id)).toEqual({ title: m.title, points: m.points });
      }
    }
  });

  it("titles both outcome milestones the ladder detector logs", () => {
    expect(milestoneCard(FIRST_OTM_EXPIRY_MILESTONE)?.title).toBeTruthy();
    expect(milestoneCard(FIRST_REALIZED_PROFIT_MILESTONE)?.title).toBeTruthy();
  });

  it("calls an OTM expiry neither a win nor a loss — it is one for a writer, the other for a holder", () => {
    expect(milestoneCard(FIRST_OTM_EXPIRY_MILESTONE)?.title).not.toMatch(/win|profit|loss|lose/i);
  });

  it("knows nothing about an id that names no milestone", () => {
    expect(milestoneCard("first-moon")).toBeUndefined();
  });

  it("leaves first-feedback off the league-wide record, where it would un-pseudonymize a filing", () => {
    expect(milestoneCard("first-feedback")).toBeUndefined();
  });
});
