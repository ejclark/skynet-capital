import {
  COMMUNITY_MILESTONES,
  communityMilestone,
  communityTotalPoints,
} from "../../src/domain/community.js";

describe("community track — pure data", () => {
  it("carries the first-feedback milestone", () => {
    expect(COMMUNITY_MILESTONES.map((m) => m.id)).toContain("first-feedback");
  });

  it("looks up a milestone by id, or undefined for a name that isn't real", () => {
    expect(communityMilestone("first-feedback")?.title).toBe("File your first feedback");
    expect(communityMilestone("not-a-real-id")).toBeUndefined();
  });

  it("totals points across the whole track", () => {
    expect(communityTotalPoints()).toBe(COMMUNITY_MILESTONES.reduce((sum, m) => sum + m.points, 0));
    expect(communityTotalPoints()).toBeGreaterThan(0);
  });
});
