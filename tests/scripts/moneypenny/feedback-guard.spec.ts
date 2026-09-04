import { stallGuardComment, visibleOutcome } from "../../../scripts/moneypenny/feedback-guard.mjs";

// #1028's mechanical guard — a `build-feedback` session's own contract (feedback-build.md) is
// "exactly one of four visible endings, always". A prompt can only promise that; #1020's run 172
// broke it silently (9 turns, is_error: false, only the receipt posted). `visibleOutcome` is the
// pure decision this guard makes once the workflow step has gathered the issue's real state — no
// network, no clock, fixture-drivable like every other pure half in this router.

const issue = (overrides: Record<string, unknown> = {}) => ({
  state: "open",
  labels: [],
  commentCount: 1,
  ...overrides,
});

describe("visibleOutcome — the pure silent-stall decision", () => {
  it("is silent when only the initial receipt landed and nothing else happened", () => {
    expect(visibleOutcome(issue(), false)).toBe(false);
  });

  it("is visible when a PR on the feedback branch exists, regardless of state", () => {
    expect(visibleOutcome(issue(), true)).toBe(true);
  });

  it("is visible when a terminal label landed (needs-info)", () => {
    expect(visibleOutcome(issue({ labels: [{ name: "needs-info" }] }), false)).toBe(true);
  });

  it("is visible when a terminal label landed (next-slice)", () => {
    expect(visibleOutcome(issue({ labels: [{ name: "next-slice" }] }), false)).toBe(true);
  });

  it("is visible when a terminal label landed (needs-eric)", () => {
    expect(visibleOutcome(issue({ labels: [{ name: "needs-eric" }] }), false)).toBe(true);
  });

  it("is visible when the issue was closed with no label and no matching PR", () => {
    expect(visibleOutcome(issue({ state: "CLOSED", commentCount: 1 }), false)).toBe(true);
  });

  it("is visible when more than the receipt comment landed, even with no PR or label", () => {
    expect(visibleOutcome(issue({ commentCount: 2 }), false)).toBe(true);
  });

  it("is silent with zero comments too (a receipt that never posted is still silence)", () => {
    expect(visibleOutcome(issue({ commentCount: 0 }), false)).toBe(false);
  });

  it("an unrelated label (e.g. feedback, curated) does not count as a visible outcome", () => {
    const withUnrelatedLabels = issue({ labels: [{ name: "feedback" }, { name: "curated" }] });
    expect(visibleOutcome(withUnrelatedLabels, false)).toBe(false);
  });
});

describe("stallGuardComment — the comment this guard posts", () => {
  it("names the issue's own lease-release command so a retry is one command away", () => {
    const body = stallGuardComment(1234, "https://example.com/run/1");
    expect(body).toContain("claim/feedback-1234");
    expect(body).toContain("--release feedback-1234");
    expect(body).toContain("https://example.com/run/1");
    expect(body).toContain("#1028");
  });

  it("degrades gracefully with no run URL rather than printing 'undefined'", () => {
    const body = stallGuardComment(5, undefined);
    expect(body).not.toContain("undefined");
    expect(body).toContain("No run URL was available");
  });
});
