import {
  hasPlanLabel,
  isReadySignal,
  planReadyIntent,
} from "../../../scripts/moneypenny/plan-claim.mjs";

// The plan lane's pure decision (#823) — a ready-flip comment on a `plan`-labeled issue should
// dispatch a build, same as a `feedback` label does today. Fixture-shaped payloads, no network, no
// clock — this is the seam `claimPlan` (scripts/moneypenny/index.mjs, formerly postmaster.mjs) calls before ever touching the lease.

describe("isReadySignal — the ready-flip pattern match", () => {
  it.each([
    "ready",
    "Ready!",
    "ready, go ahead",
    "go",
    "go ahead",
    "go for it",
    "aligned, execute",
    "aligned — build it",
    "lgtm",
    "lgtm, ship it",
    "ship it",
    "approve",
    "approved",
    "ready — use the proposed defaults", // Eric's actual phrasing on #724 — verified live, 0/8
    "ready, go with option A",
    "Ready: build it",
  ])("matches %j", (text) => {
    expect(isReadySignal(text)).toBe(true);
  });

  it.each([
    "",
    "not ready yet",
    "don't ship this",
    "already scoped this last week",
    "go over this again please",
    "let's not ship it yet",
    "this looks great, thanks for the detail",
    "can you clarify the second bullet?",
    "ready to discuss more",
    "ready when you have time",
    "I'm not ready — need more time",
    "already ready to go",
  ])("does not match %j", (text) => {
    expect(isReadySignal(text)).toBe(false);
  });
});

describe("hasPlanLabel", () => {
  it("finds the plan label among others", () => {
    expect(hasPlanLabel({ labels: [{ name: "enhancement" }, { name: "plan" }] })).toBe(true);
  });

  it("is false with no plan label, or no labels at all", () => {
    expect(hasPlanLabel({ labels: [{ name: "enhancement" }] })).toBe(false);
    expect(hasPlanLabel({})).toBe(false);
  });
});

describe("planReadyIntent — the pure ready-flip decision", () => {
  const planIssue = (overrides = {}) => ({
    number: 823,
    state: "open",
    labels: [{ name: "enhancement" }, { name: "plan" }],
    body: "a fully scoped plan",
    ...overrides,
  });

  it("is ready on a ready comment against an open plan issue", () => {
    const intent = planReadyIntent({
      payload: { issue: planIssue(), comment: { body: "ready" } },
    });
    expect(intent.ready).toBe(true);
    expect(intent.issue?.number).toBe(823);
  });

  it("is not ready without the plan label", () => {
    const intent = planReadyIntent({
      payload: {
        issue: planIssue({ labels: [{ name: "enhancement" }] }),
        comment: { body: "ready" },
      },
    });
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("plan label");
  });

  it("is not ready when the comment doesn't read as a ready-flip", () => {
    const intent = planReadyIntent({
      payload: { issue: planIssue(), comment: { body: "can you clarify the second bullet?" } },
    });
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("ready-flip");
  });

  it("is not ready on a closed issue", () => {
    const intent = planReadyIntent({
      payload: { issue: planIssue({ state: "closed" }), comment: { body: "ready" } },
    });
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("not open");
  });

  it("is not ready with no comment or no issue in the payload", () => {
    expect(planReadyIntent({ payload: { issue: planIssue() } }).ready).toBe(false);
    expect(planReadyIntent({ payload: { comment: { body: "ready" } } }).ready).toBe(false);
  });
});
