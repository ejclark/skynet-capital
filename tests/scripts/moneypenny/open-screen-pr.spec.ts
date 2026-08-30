import { classifyAutoMergeResult } from "../../../scripts/moneypenny/open-screen-pr.mjs";

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
    const body = JSON.stringify({ errors: [{ message: "Could not resolve to a node" }] });
    expect(classifyAutoMergeResult(body)).toBe("error");
  });

  it("reads a bare HTTP-level message (no errors key) as an error", () => {
    const body = JSON.stringify({ message: "Bad credentials" });
    expect(classifyAutoMergeResult(body)).toBe("error");
  });

  it("is case-insensitive on the clean-status phrasing", () => {
    const body = JSON.stringify({ errors: [{ message: "already IN CLEAN status" }] });
    expect(classifyAutoMergeResult(body)).toBe("already-clean");
  });
});
