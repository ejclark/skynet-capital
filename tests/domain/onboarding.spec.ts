import { ENGAGEMENT_MILESTONES } from "../../src/domain/engagement.js";
import {
  deriveOnboarding,
  ONBOARDING_MILESTONE,
  ONBOARDING_STEPS,
  onboardingTotalPoints,
} from "../../src/domain/onboarding.js";

describe("onboarding milestone (M·01)", () => {
  it("has three steps, in the order a member meets them, 30 points in all", () => {
    expect(ONBOARDING_STEPS.map((s) => s.id)).toEqual(["connect", "first-message", "first-trade"]);
    expect(onboardingTotalPoints()).toBe(30);
    expect(ONBOARDING_MILESTONE.code).toBe("M·01");
  });

  it("prices the message step from the engagement track — one source of truth", () => {
    const engagement = ENGAGEMENT_MILESTONES.find((m) => m.id === "first-message");
    const step = ONBOARDING_STEPS.find((s) => s.id === "first-message");
    expect(step?.points).toBe(engagement?.points);
    expect(step?.points).toBe(10);
  });

  it("derives nothing done from no evidence", () => {
    const progress = deriveOnboarding({
      connected: false,
      messaged: false,
      firstFillEarned: false,
    });
    expect(progress.done).toBe(0);
    expect(progress.points).toBe(0);
    expect(progress.complete).toBe(false);
    expect(progress.steps.every((s) => !s.done)).toBe(true);
  });

  it("marks each step from its own ledger, independent of the others", () => {
    const progress = deriveOnboarding({
      connected: false,
      messaged: true,
      firstFillEarned: false,
    });
    expect(progress.steps.map((s) => s.done)).toEqual([false, true, false]);
    expect(progress.done).toBe(1);
    expect(progress.points).toBe(10);
  });

  it("completes at three of three with the full 30", () => {
    const progress = deriveOnboarding({
      connected: true,
      messaged: true,
      firstFillEarned: true,
    });
    expect(progress).toMatchObject({
      done: 3,
      total: 3,
      points: 30,
      totalPoints: 30,
      complete: true,
    });
  });

  it("points every step at the shell route that completes it", () => {
    // Step 1's form lives inside the onboarding page's guide; step 2 opens Moneypenny's rail
    // with her intro (the 2026-09-03 handoff) rather than a feedback page.
    expect(ONBOARDING_STEPS.map((s) => s.route)).toEqual([
      "/app/onboarding",
      "/app/onboarding?moneypenny=intro",
      "/app/trade?play=101",
    ]);
  });
});
