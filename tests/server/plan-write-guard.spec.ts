import type { JsonResponse } from "../../src/http/fetch-json.js";
import { createFollowup } from "../../src/server/feedback-followup.js";
import { isPlanIssue, PLAN_FILING_REFUSAL } from "../../src/server/plan-write-guard.js";

// The app server's token posts as the owner, so on a plan issue its comment or `ready` label is the
// plan lane's go (#7286, named next slice 7). The structural half, that every `ready` write in
// src/server asks this first, is tests/arch/server-label-guard.spec.ts; this is the behaviour.
describe("plan-write-guard", () => {
  it("calls an issue a plan exactly when it carries the plan label, in either label shape", () => {
    expect(isPlanIssue({ labels: ["plan", "ready"] })).toBe(true);
    expect(isPlanIssue({ labels: [{ name: "bug" }, { name: "plan" }] })).toBe(true);
    expect(isPlanIssue({ labels: ["feedback", "ready"] })).toBe(false);
    expect(isPlanIssue({ labels: [] })).toBe(false);
  });

  it("refuses a member's follow-up on their own filing once it has become a ready plan: no comment, no label", async () => {
    const calls: string[] = [];
    const doFetch = (method: string, url: string): Promise<JsonResponse> => {
      calls.push(`${method} ${url}`);
      if (method === "GET") {
        const labels = ["feedback", "bug", "plan", "ready"].map((name) => ({ name }));
        return Promise.resolve({ status: 200, body: { number: 7, state: "open", labels } });
      }
      return Promise.resolve({ status: 201, body: {} });
    };

    const result = await createFollowup(
      { token: "t", repo: "x/y" },
      doFetch,
    )({
      issueNumber: 7,
      body: "looks good, ship it",
    });

    expect(result).toEqual({ ok: false, error: PLAN_FILING_REFUSAL });
    expect(calls).toEqual(["GET https://api.github.com/repos/x/y/issues/7"]);
  });

  it("tells the member what to do instead, in plain words", () => {
    expect(PLAN_FILING_REFUSAL).toMatch(/new feedback/);
    expect(PLAN_FILING_REFUSAL).not.toMatch(/label|lane|token/i);
  });
});
