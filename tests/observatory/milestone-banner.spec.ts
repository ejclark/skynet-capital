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

  it("302 now opens 401, not the ladder's end (#1671 extended it)", () => {
    const html = renderMilestoneBanner([earn({ milestoneId: "first-long-call", code: "302" })], {
      back: "/trade",
    });
    expect(html).toContain("401 — Vertical spread</b> is now open");
    expect(html).not.toContain("the whole ladder is yours");
  });

  it("celebrates the top rung (501) as the ladder finished, not with a phantom next course", () => {
    const html = renderMilestoneBanner([earn({ milestoneId: "first-zero-dte", code: "501" })], {
      back: "/trade",
    });
    expect(html).toContain("the whole ladder is yours");
    expect(html).not.toContain("is now open");
  });
});
