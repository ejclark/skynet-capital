import { gradeCheck } from "../../src/domain/comprehension.js";
import { checkFor } from "../../src/domain/comprehension-checks.js";
import type { EarnedMilestone } from "../../src/domain/progression.js";
import {
  renderCheckResult,
  renderComprehensionCheck,
} from "../../src/observatory/comprehension-check-view.js";

const earn = (over: Partial<EarnedMilestone> = {}): EarnedMilestone => ({
  milestoneId: "first-buy",
  code: "101",
  orderId: "o1",
  at: "2026-08-25T14:00:00.000Z",
  ...over,
});

const firstBuy = checkFor("first-buy");
if (!firstBuy) throw new Error("the first-buy check is the fixture this spec is built on");
const perfect = new Map(firstBuy.questions.map((q) => [q.id, String(q.answerIndex)]));
const blankLast = new Map([...perfect].slice(0, firstBuy.questions.length - 1));

describe("the comprehension gate — what stands between an earn and its fanfare", () => {
  it("renders nothing when nothing is pending", () => {
    expect(renderComprehensionCheck([], { back: "/learn" })).toBe("");
  });

  it("renders nothing for a pending earn that no check gates", () => {
    expect(renderComprehensionCheck([earn({ milestoneId: "unmapped" })], { back: "/learn" })).toBe(
      "",
    );
  });

  it("names the course, the concept, and every question with its options", () => {
    const html = renderComprehensionCheck([earn()], { back: "/learn" });
    expect(html).toContain("Course 101 — Owning shares");
    expect(html).toContain("what owning shares actually is");
    for (const q of firstBuy.questions) {
      expect(html).toContain(q.prompt);
      for (const option of q.options) expect(html).toContain(option);
    }
  });

  it("posts answers as indices under a namespaced field, carrying the return path", () => {
    const html = renderComprehensionCheck([earn()], { back: "/learn" });
    expect(html).toContain('method="post" action="/trade"');
    expect(html).toContain('name="check" value="first-buy"');
    expect(html).toContain('name="back" value="/learn"');
    expect(html).toContain('name="a_own" value="0"');
  });

  it("leaves the radios optional, so a blank answer stays possible and honest", () => {
    expect(renderComprehensionCheck([earn()], { back: "/learn" })).not.toContain("required");
  });

  it("promises the retry up front — the gate never reads as a permanent block", () => {
    const html = renderComprehensionCheck([earn()], { back: "/learn" });
    expect(html).toContain("One miss still passes");
    expect(html).toContain("nothing you have earned is ever taken away");
  });

  it("gates one milestone at a time, taking the first that has a check", () => {
    const html = renderComprehensionCheck(
      [earn({ milestoneId: "first-sell", code: "102" }), earn()],
      { back: "/trade" },
    );
    expect(html).toContain("Booking a result");
    expect(html).not.toContain("Owning shares");
  });

  it("honors reduced motion on the result's entrance", () => {
    const html = renderCheckResult(gradeCheck(firstBuy, perfect), { back: "/learn" });
    expect(html).toContain("prefers-reduced-motion");
  });
});

describe("the graded result — never a bare score", () => {
  it("leads with the plain-language verdict and sends a pass back to collect the milestone", () => {
    const html = renderCheckResult(gradeCheck(firstBuy, perfect), { back: "/learn" });
    expect(html).toContain("🎉 Understood");
    expect(html).toContain("Collect the milestone →");
    expect(html).toContain('href="/learn"');
    expect(html).toContain("what owning shares actually is");
  });

  it("shows the reason on every question, including the ones answered correctly", () => {
    const html = renderCheckResult(gradeCheck(firstBuy, perfect), { back: "/learn" });
    for (const q of firstBuy.questions) expect(html).toContain(q.why);
  });

  it("says a blank answer was blank — ABSENT, never a wrong pick invented for the member", () => {
    const html = renderCheckResult(gradeCheck(firstBuy, blankLast), { back: "/learn" });
    expect(html).toContain("You left this one blank.");
  });

  it("offers a retake rather than a dead end when the check is missed", () => {
    const html = renderCheckResult(gradeCheck(firstBuy, new Map()), { back: "/trade?play=101" });
    expect(html).toContain("Not yet — take it again");
    expect(html).toContain("Take it again →");
    expect(html).toContain("Nothing is lost");
  });
});
