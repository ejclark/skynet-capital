import {
  deriveEngagementEarned,
  ENGAGEMENT_MILESTONES,
  engagementMilestone,
} from "../../src/domain/engagement.js";

describe("the engagement track — earned by an action, not a fill", () => {
  it("earns nothing from an empty filing history", () => {
    expect(deriveEngagementEarned([])).toEqual([]);
  });

  it("earns first-feedback dated to the EARLIEST filing, not the latest or the call order", () => {
    const earned = deriveEngagementEarned([
      "2026-08-20T10:00:00Z",
      "2026-08-15T09:00:00Z",
      "2026-08-25T11:00:00Z",
    ]);
    expect(earned).toEqual([{ milestoneId: "first-feedback", at: "2026-08-15T09:00:00Z" }]);
  });

  it("earns exactly once no matter how many filings exist", () => {
    const earned = deriveEngagementEarned(["2026-08-01T00:00:00Z", "2026-08-02T00:00:00Z"]);
    expect(earned).toHaveLength(1);
  });

  it("looks up a real milestone by id, and nothing for an unknown one", () => {
    expect(engagementMilestone("first-feedback")?.title).toBe("File your first feedback");
    expect(engagementMilestone("not-a-real-id")).toBeUndefined();
  });

  it("keeps the milestone table itself honest — points, ids", () => {
    expect(ENGAGEMENT_MILESTONES.every((m) => m.points > 0)).toBe(true);
    expect(new Set(ENGAGEMENT_MILESTONES.map((m) => m.id)).size).toBe(ENGAGEMENT_MILESTONES.length);
  });
});
