import { audit, readyPlanCandidate } from "../../scripts/postmaster-audit.mjs";

// The plan-stall check (#897, closing #877's deferred slice 3) — a ready-flip comment on a
// `plan`-labeled issue that never got claimed or built looks IDENTICAL to "nothing needed" from
// Eric's side. `readyPlanCandidate` is the pure per-issue decision (mirrors `isReadySignal`'s own
// fixture-drivable shape: no network, no clock beyond an injected `nowMs`); `audit()` applies the
// 48h threshold and the one-ping-per-stall memory on top, same split as the other two audit lanes.

const NOW = Date.parse("2026-08-29T12:00:00Z");

const planIssue = (overrides: Record<string, unknown> = {}) => ({
  number: 466,
  title: "[plan] some plan",
  state: "open",
  labels: [{ name: "enhancement" }, { name: "plan" }],
  closedByPullRequests: [],
  ...overrides,
});

const readyComment = (hoursAgo: number, body = "ready") => ({
  body,
  createdAt: new Date(NOW - hoursAgo * 3_600_000).toISOString(),
});

describe("readyPlanCandidate — the pure per-issue stall decision", () => {
  it("is a candidate when a ready comment landed on an open plan issue with no claim", () => {
    const candidate = readyPlanCandidate(planIssue(), [readyComment(50)], false, NOW);
    expect(candidate).toEqual({ title: "[plan] some plan", number: 466, hoursSinceReady: 50 });
  });

  it("uses the FIRST ready comment in comment order (gh lists comments oldest-first)", () => {
    const comments = [readyComment(72), readyComment(10)];
    expect(readyPlanCandidate(planIssue(), comments, false, NOW)?.hoursSinceReady).toBe(72);
  });

  it("is null without the plan label", () => {
    const issue = planIssue({ labels: [{ name: "enhancement" }] });
    expect(readyPlanCandidate(issue, [readyComment(50)], false, NOW)).toBeNull();
  });

  it("is null when a claim is currently held", () => {
    expect(readyPlanCandidate(planIssue(), [readyComment(50)], true, NOW)).toBeNull();
  });

  it("is null on a closed issue — closing is an answer", () => {
    const issue = planIssue({ state: "closed" });
    expect(readyPlanCandidate(issue, [readyComment(50)], false, NOW)).toBeNull();
  });

  it("is null when a PR already links the issue — a build did happen", () => {
    const issue = planIssue({ closedByPullRequests: [{ number: 900 }] });
    expect(readyPlanCandidate(issue, [readyComment(50)], false, NOW)).toBeNull();
  });

  it("is null with no comments at all", () => {
    expect(readyPlanCandidate(planIssue(), [], false, NOW)).toBeNull();
  });

  it("is null when no comment reads as a ready-flip", () => {
    const comments = [readyComment(50, "can you clarify the second bullet?")];
    expect(readyPlanCandidate(planIssue(), comments, false, NOW)).toBeNull();
  });
});

describe("audit() — the plan-stall threshold and memory", () => {
  it("flags a ready-but-unclaimed plan issue past 48h", () => {
    const intents = audit({
      readyPlans: [{ title: "[plan] a plan", number: 466, hoursSinceReady: 50 }],
    });
    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("flag-plan-stall");
    expect(intents[0]?.issueNumber).toBe(466);
    expect(intents[0]?.hoursSinceReady).toBe(50);
    expect(intents[0]?.body).toContain("claim/plan-466");
  });

  it("is silent inside the 48h threshold — the trigger may just still be running", () => {
    const intents = audit({
      readyPlans: [{ title: "[plan] fresh", number: 467, hoursSinceReady: 3 }],
    });
    expect(intents).toHaveLength(0);
  });

  it("respects a custom planStallAfterHours threshold", () => {
    const deps = { readyPlans: [{ title: "[plan] x", number: 468, hoursSinceReady: 10 }] };
    expect(audit(deps)).toHaveLength(0);
    expect(audit({ ...deps, planStallAfterHours: 6 })).toHaveLength(1);
  });

  it("never re-flags a plan issue already carrying the stall-flagged label", () => {
    const intents = audit({
      readyPlans: [{ title: "[plan] already pinged", number: 469, hoursSinceReady: 96 }],
      alreadyFlagged: [469],
    });
    expect(intents).toHaveLength(0);
  });

  it("runs alongside the other two audit lanes without cross-talk", () => {
    const intents = audit({
      unclaimedIssues: [{ title: "[event-research] x", number: 1, quietDays: 4 }],
      silentFeedback: [{ title: "some feedback", number: 2, hoursSinceFiled: 10 }],
      readyPlans: [{ title: "[plan] y", number: 3, hoursSinceReady: 60 }],
    });
    expect(intents.map((i) => i.kind).sort()).toEqual([
      "flag-plan-stall",
      "flag-silent-feedback",
      "flag-stall",
    ]);
  });
});
