import {
  type CommunityFiling,
  deriveCommunityEarned,
} from "../../src/domain/community-progression.js";

const filing = (over: Partial<CommunityFiling>): CommunityFiling => ({
  issueNumber: 100,
  filedAt: "2026-08-29T14:00:00.000Z",
  ...over,
});

describe("deriveCommunityEarned — milestones from real filings, never a checkbox", () => {
  it("earns nothing from zero filings", () => {
    expect(deriveCommunityEarned([])).toEqual([]);
  });

  it("earns the first-feedback milestone from a single filing — the issue number is the proof", () => {
    const earned = deriveCommunityEarned([filing({ issueNumber: 42 })]);
    expect(earned).toEqual([
      { milestoneId: "first-feedback", issueNumber: 42, at: "2026-08-29T14:00:00.000Z" },
    ]);
  });

  it("uses the EARLIEST filing as evidence when there are several", () => {
    const earned = deriveCommunityEarned([
      filing({ issueNumber: 2, filedAt: "2026-08-25T00:00:00.000Z" }),
      filing({ issueNumber: 1, filedAt: "2026-08-20T00:00:00.000Z" }),
      filing({ issueNumber: 3, filedAt: "2026-08-27T00:00:00.000Z" }),
    ]);
    expect(earned).toEqual([
      { milestoneId: "first-feedback", issueNumber: 1, at: "2026-08-20T00:00:00.000Z" },
    ]);
  });

  it("is idempotent — the same filings always derive the same earn", () => {
    const filings = [filing({ issueNumber: 7 })];
    expect(deriveCommunityEarned(filings)).toEqual(deriveCommunityEarned(filings));
  });
});
