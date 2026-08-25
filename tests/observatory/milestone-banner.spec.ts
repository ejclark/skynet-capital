import type { EarnedMilestone } from "../../src/domain/progression.js";
import { renderMilestoneBanner } from "../../src/observatory/milestone-banner.js";

const earn = (over: Partial<EarnedMilestone>): EarnedMilestone => ({
  milestoneId: "first-buy",
  code: "101",
  orderId: "o1",
  at: "2026-08-25T14:00:00.000Z",
  ...over,
});

describe("the unlock banner — fanfare for what went right", () => {
  it("renders nothing when there is nothing to celebrate", () => {
    expect(renderMilestoneBanner([], { back: "/trade" })).toBe("");
  });

  it("names the completed course AND the rung it just opened", () => {
    const html = renderMilestoneBanner([earn({})], { back: "/trade" });
    expect(html).toContain("Milestone unlocked");
    expect(html).toContain("<b>101</b> complete");
    expect(html).toContain("Buy your first stock");
    expect(html).toContain("102 — Sell stock</b> is now open");
  });

  it("claims through a POST carrying the milestone ids and the return path", () => {
    const html = renderMilestoneBanner(
      [earn({}), earn({ milestoneId: "first-sell", code: "102" })],
      { back: "/learn" },
    );
    expect(html).toContain('method="post" action="/trade"');
    expect(html).toContain('name="ack" value="first-buy,first-sell"');
    expect(html).toContain('name="back" value="/learn"');
  });

  it("celebrates the top rung as the ladder finished, not with a phantom next course", () => {
    const html = renderMilestoneBanner([earn({ milestoneId: "first-long-call", code: "302" })], {
      back: "/trade",
    });
    expect(html).toContain("the whole ladder is yours");
    expect(html).not.toContain("is now open");
  });

  it("celebrates a community earn on its own terms — FILED, with the issue number as proof", () => {
    const html = renderMilestoneBanner([], {
      back: "/learn",
      contributions: [
        { milestoneId: "first-feedback", issueNumber: 567, at: "2026-08-25T14:00:00.000Z" },
      ],
    });
    expect(html).toContain("Milestone unlocked");
    expect(html).toContain("File your first piece of feedback");
    expect(html).toContain("filed ✓");
    expect(html).toContain("<b>#567</b>");
    // it is not a trade, so it must never claim a course number or a fill
    expect(html).not.toContain("complete —");
    expect(html).not.toContain("filled ✓");
  });

  it("claims both tracks through the one form, so a member never claims twice", () => {
    const html = renderMilestoneBanner([earn({})], {
      back: "/learn",
      contributions: [
        { milestoneId: "first-feedback", issueNumber: 567, at: "2026-08-25T14:00:00.000Z" },
      ],
    });
    expect(html).toContain('name="ack" value="first-buy,first-feedback"');
  });
});
