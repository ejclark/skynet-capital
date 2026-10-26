import {
  classifyAutoMergeResult,
  hasOpenScreenPr,
  parkedScreenPrs,
} from "../../../scripts/moneypenny/open-screen-pr.mjs";

// The pure part of open-screen-pr.mjs (issue #915's PR-instead-of-direct-push fix) — mirrors
// scripts/ship.sh's own two-failure-shape handling for `enablePullRequestAutoMerge` (2026-08-26: a
// GraphQL-level failure carries an `errors` array, an HTTP-level one — rate limit, bad token —
// comes back as a bare `{"message": ...}` with no `errors` key; checking only for `errors` let a
// never-armed PR read as armed).
describe("open-screen-pr: classifyAutoMergeResult", () => {
  it("reads a clean success as armed", () => {
    const body = JSON.stringify({
      data: { enablePullRequestAutoMerge: { pullRequest: { number: 1 } } },
    });
    expect(classifyAutoMergeResult(body)).toBe("armed");
  });

  it("reads an already-clean-status refusal as already-clean, not an error", () => {
    const body = JSON.stringify({
      errors: [{ message: "Pull request  is in clean status" }],
    });
    expect(classifyAutoMergeResult(body)).toBe("already-clean");
  });

  it("reads a GraphQL errors array as an error", () => {
    const body = JSON.stringify({
      errors: [{ message: "Could not resolve to a node" }],
    });
    expect(classifyAutoMergeResult(body)).toBe("error");
  });

  it("reads a bare HTTP-level message (no errors key) as an error", () => {
    const body = JSON.stringify({ message: "Bad credentials" });
    expect(classifyAutoMergeResult(body)).toBe("error");
  });

  it("is case-insensitive on the clean-status phrasing", () => {
    const body = JSON.stringify({
      errors: [{ message: "already IN CLEAN status" }],
    });
    expect(classifyAutoMergeResult(body)).toBe("already-clean");
  });
});

// The race behind a 19-PR conflict backlog found 2026-09-19: two open screen PRs both rewrite the
// same event doc's header line in place, so whichever merges second is a guaranteed conflict. This
// pure predicate is the guard a screen run checks before opening a competing PR.
describe("open-screen-pr: hasOpenScreenPr", () => {
  it("is false with no open PRs", () => {
    expect(hasOpenScreenPr([])).toBe(false);
  });

  it("is false when open PRs exist but none are screen branches", () => {
    expect(hasOpenScreenPr([{ head: { ref: "feature/foo" } }, { head: { ref: "fix/bar" } }])).toBe(
      false,
    );
  });

  it("is true when a screen branch is already open", () => {
    expect(hasOpenScreenPr([{ head: { ref: "moneypenny/screen-123-1" } }])).toBe(true);
  });

  it("tolerates malformed or missing head data", () => {
    // @ts-expect-error — exercising defensive handling of a shape the real API shouldn't send
    expect(hasOpenScreenPr([{}, { head: {} }, null])).toBe(false);
  });

  // #6072: #5931 sat `needs-eric` + `conflict-flagged` for six days and blocked every screen. A
  // parked PR cannot merge unattended, so it cannot race — it must not hold the guard.
  it.each(["conflict-flagged", "needs-eric", "hold-merge"])(
    "is false when the only open screen PR carries %s",
    (label) => {
      const prs = [{ head: { ref: "moneypenny/screen-1-1" }, labels: [{ name: label }] }];
      expect(hasOpenScreenPr(prs)).toBe(false);
    },
  );

  it("is still true while a non-parked screen PR is open beside a parked one", () => {
    const prs = [
      {
        head: { ref: "moneypenny/screen-1-1" },
        labels: [{ name: "conflict-flagged" }],
      },
      { head: { ref: "moneypenny/screen-2-1" }, labels: [{ name: "bug" }] },
    ];
    expect(hasOpenScreenPr(prs)).toBe(true);
  });
});

describe("open-screen-pr: parkedScreenPrs", () => {
  it("returns only screen PRs carrying a parked label", () => {
    const parked = {
      number: 5931,
      head: { ref: "moneypenny/screen-39446026887-1" },
      labels: [{ name: "needs-eric" }, { name: "conflict-flagged" }],
    };
    const prs = [
      parked,
      { number: 2, head: { ref: "moneypenny/screen-2-1" }, labels: [] },
      {
        number: 3,
        head: { ref: "feature/x" },
        labels: [{ name: "hold-merge" }],
      },
    ];
    expect(parkedScreenPrs(prs)).toEqual([parked]);
  });

  it("tolerates a PR with no labels array", () => {
    expect(parkedScreenPrs([{ number: 1, head: { ref: "moneypenny/screen-1-1" } }])).toEqual([]);
  });
});
