import { readFileSync } from "node:fs";
import { claimFeedback } from "../../../scripts/moneypenny/index.mjs";
import {
  CLAUDE_READY_LINE,
  feedbackReadyIntent,
  hasPlanLabel,
  isClaudeComment,
  isClaudeReadyLine,
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

// #3818 slice 2 — the guards that must hold before the plan lane is woken. Fixture-driven
// (tests/fixtures/events/plan-*.json): each file is the `ctx` the workflow hands `claimPlan`.
const fixture = (name: string) =>
  JSON.parse(readFileSync(`tests/fixtures/events/${name}.json`, "utf8")) as Parameters<
    typeof planReadyIntent
  >[0];

describe("planReadyIntent — the slice-2 guards (#3818 criteria 5 and 6)", () => {
  it("does not claim a parked plan, even on a plain OWNER 'ready' — and names the label", () => {
    const intent = planReadyIntent(fixture("plan-parked-ready"));
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("parked by needs-eric");
  });

  it.each(["needs-info", "needs-design", "hold-merge"])("refuses a plan parked by %s", (label) => {
    const intent = planReadyIntent({
      payload: {
        issue: { number: 1, state: "open", labels: [{ name: "plan" }, { name: label }] },
        comment: { body: "ready" },
      },
    });
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain(label);
  });

  it("flips on a Claude-authored comment whose first line is the exact hand-off line", () => {
    const intent = planReadyIntent(fixture("plan-claude-ready"));
    expect(intent.ready).toBe(true);
    expect(intent.issue?.number).toBe(3818);
  });

  it("does not flip on a Claude-authored comment that merely opens 'ready — something else'", () => {
    const intent = planReadyIntent(fixture("plan-claude-status"));
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain(CLAUDE_READY_LINE);
  });

  it("still flips on a human OWNER 'ready — use the proposed defaults' (no regression; next-slice is not parking)", () => {
    const intent = planReadyIntent(fixture("plan-owner-ready-defaults"));
    expect(intent.ready).toBe(true);
    expect(intent.issue?.number).toBe(724);
  });
});

describe("the Claude-comment ready line", () => {
  const footer = "\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_";

  it("recognises the footer loosely", () => {
    expect(isClaudeComment(`hi${footer}`)).toBe(true);
    expect(isClaudeComment("hi\n_generated by [Claude Code]_")).toBe(true);
    expect(isClaudeComment("ready — use the proposed defaults")).toBe(false);
  });

  it.each([
    "ready — take slice 1 per the state block",
    "  ready — take slice 1 per the state block  ",
    "ready - take slice 1 per the state block",
  ])("accepts %j as the first line", (line) => {
    expect(isClaudeReadyLine(`${line}${footer}`)).toBe(true);
  });

  it.each([
    "ready — take slice 2 per the state block",
    "ready — take slice 1 per the state block, then slice 2",
    "Ready",
    "ready",
    "notes\nready — take slice 1 per the state block",
  ])("rejects %j", (line) => {
    expect(isClaudeReadyLine(`${line}${footer}`)).toBe(false);
  });
});

describe("claimFeedback — the parking guard (#3818 criterion 5)", () => {
  it("refuses a ready feedback issue that is parked, before touching the lease", () => {
    const result = claimFeedback({
      payload: {
        issue: {
          number: 3194,
          body: "",
          labels: [{ name: "feedback" }, { name: "ready" }, { name: "needs-info" }],
        },
      },
    });
    expect(result.claimed).toBe(false);
    expect(result.reason).toContain("parked by needs-info");
  });
});

// #3960 criterion 1 / #3818 slice 3 — the plan lane also wakes on the `ready` LABEL (an `issues`
// labeled event), under the same parking guard. The comment path above is unchanged.
describe("planReadyIntent — the label-event ready path", () => {
  it("is ready when `ready` is labeled onto an open, buildable plan", () => {
    const intent = planReadyIntent(fixture("plan-ready-label"));
    expect(intent.ready).toBe(true);
    expect(intent.issue?.number).toBe(3960);
    expect(intent.reason).toContain("`ready` label");
  });

  it("refuses a parked plan even on the label", () => {
    const intent = planReadyIntent(fixture("plan-ready-label-parked"));
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("parked by needs-eric");
  });

  it("refuses an issue without the plan label", () => {
    const intent = planReadyIntent(fixture("plan-ready-label-not-plan"));
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("plan label");
  });

  it("ignores any other label landing on a plan", () => {
    const intent = planReadyIntent({
      payload: {
        action: "labeled",
        label: { name: "enhancement" },
        issue: { number: 5, state: "open", labels: [{ name: "plan" }, { name: "enhancement" }] },
      },
    });
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("not `ready`");
  });
});

// #3960 criterion 2 — clearing the last parking label from a still-`ready` issue re-wakes it, so a
// parked-then-cleared issue builds without anyone saying "ready" a second time.
describe("the unpark path — an `unlabeled` parking label on a ready issue", () => {
  const unlabeled = (removed: string, labels: string[], lane = "plan") => ({
    payload: {
      action: "unlabeled",
      label: { name: removed },
      issue: { number: 77, state: "open", labels: [lane, ...labels].map((name) => ({ name })) },
    },
  });

  it("wakes a plan whose needs-eric was cleared while it stayed ready", () => {
    const intent = planReadyIntent(fixture("plan-unparked-ready"));
    expect(intent.ready).toBe(true);
    expect(intent.reason).toContain("unparked (`needs-eric` removed)");
  });

  it("wakes a feedback issue the same way", () => {
    const intent = feedbackReadyIntent(fixture("feedback-unparked-ready"));
    expect(intent.ready).toBe(true);
    expect(intent.issue?.number).toBe(4100);
  });

  it.each(["needs-info", "needs-design", "hold-merge"])(
    "treats removing %s as an unpark",
    (label) => {
      expect(planReadyIntent(unlabeled(label, ["ready"])).ready).toBe(true);
      expect(feedbackReadyIntent(unlabeled(label, ["ready"], "feedback")).ready).toBe(true);
    },
  );

  it("stays asleep when the issue does not carry `ready`", () => {
    const intent = planReadyIntent(unlabeled("needs-eric", []));
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("does not carry `ready`");
  });

  it("stays asleep while a second parking label remains", () => {
    const intent = feedbackReadyIntent(
      unlabeled("needs-eric", ["ready", "needs-info"], "feedback"),
    );
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("parked by needs-info");
  });

  it("stays asleep when the removed label is not a parking label", () => {
    const intent = planReadyIntent(unlabeled("next-slice", ["ready"]));
    expect(intent.ready).toBe(false);
    expect(intent.reason).toContain("not a parking label");
  });

  it("stays asleep on a closed issue", () => {
    const ctx = unlabeled("needs-eric", ["ready"], "feedback");
    ctx.payload.issue = { ...ctx.payload.issue, state: "closed" };
    expect(feedbackReadyIntent(ctx).ready).toBe(false);
  });
});

describe("feedbackReadyIntent — the existing shape is kept", () => {
  it("is ready for a buildable feedback issue with no label event (the labeled:ready step)", () => {
    const intent = feedbackReadyIntent({
      payload: { issue: { number: 1, labels: [{ name: "feedback" }, { name: "ready" }] } },
    });
    expect(intent.ready).toBe(true);
  });

  it("is ready on the `labeled: ready` event itself", () => {
    const intent = feedbackReadyIntent({
      payload: {
        action: "labeled",
        label: { name: "ready" },
        issue: { number: 1, state: "open", labels: [{ name: "feedback" }, { name: "ready" }] },
      },
    });
    expect(intent.ready).toBe(true);
  });

  it("is not this lane's without the feedback label", () => {
    const intent = feedbackReadyIntent({
      payload: { issue: { number: 1, labels: [{ name: "ready" }] } },
    });
    expect(intent.reason).toContain("not a feedback issue");
  });
});
