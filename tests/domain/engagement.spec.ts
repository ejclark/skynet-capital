import {
  deriveEngagementEarned,
  ENGAGEMENT_MILESTONES,
  engagementMilestone,
} from "../../src/domain/engagement.js";

describe("the engagement track — earned by an action, not a fill", () => {
  it("earns nothing from an empty message history", () => {
    expect(deriveEngagementEarned([])).toEqual([]);
  });

  it("earns first-message dated to the EARLIEST message, not the latest or the call order", () => {
    const earned = deriveEngagementEarned([
      "2026-08-20T10:00:00Z",
      "2026-08-15T09:00:00Z",
      "2026-08-25T11:00:00Z",
    ]);
    expect(earned).toEqual([{ milestoneId: "first-message", at: "2026-08-15T09:00:00Z" }]);
  });

  it("earns exactly once no matter how many messages exist", () => {
    const earned = deriveEngagementEarned(["2026-08-01T00:00:00Z", "2026-08-02T00:00:00Z"]);
    expect(earned).toHaveLength(1);
  });

  it("looks up a real milestone by id, and nothing for an unknown one", () => {
    expect(engagementMilestone("first-message")?.title).toBe("Say hello to Moneypenny");
    expect(engagementMilestone("not-a-real-id")).toBeUndefined();
  });

  it("keeps the milestone table itself honest — points, ids", () => {
    expect(ENGAGEMENT_MILESTONES.every((m) => m.points > 0)).toBe(true);
    expect(new Set(ENGAGEMENT_MILESTONES.map((m) => m.id)).size).toBe(ENGAGEMENT_MILESTONES.length);
  });
});
