import type { JsonResponse } from "../../src/http/fetch-json.js";
import { createStatusFetcher, resolveFeedbackStatus } from "../../src/server/feedback-status.js";

// GitHub is the source of truth for a filed issue's state — these specs cover the fold from raw
// issue JSON into the app's own four-outcome vocabulary (docs/FEEDBACK.md, "the four ways a build
// session ends"), and that a fetch failure never surfaces as an error, only a missing badge.
describe("feedback-status", () => {
  const config = { token: "t", repo: "x/y" };

  const fakeFetch =
    (byIssue: Record<number, JsonResponse>) =>
    (_method: string, url: string): Promise<JsonResponse> => {
      const n = Number(url.split("/").pop());
      return Promise.resolve(byIssue[n] ?? { status: 404, body: null });
    };

  it("reads a closed issue as shipped, regardless of its labels", async () => {
    const fetch = createStatusFetcher(
      config,
      fakeFetch({ 7: { status: 200, body: { state: "closed", labels: [] } } }),
    );

    expect((await fetch([7])).get(7)).toBe("shipped");
  });

  it("reads an open issue with no triage label as open", async () => {
    const fetch = createStatusFetcher(
      config,
      fakeFetch({ 7: { status: 200, body: { state: "open", labels: [{ name: "feedback" }] } } }),
    );

    expect((await fetch([7])).get(7)).toBe("open");
  });

  it("reads needs-info and needs-eric labels off an open issue", async () => {
    const fetch = createStatusFetcher(
      config,
      fakeFetch({
        1: { status: 200, body: { state: "open", labels: ["feedback", "needs-info"] } },
        2: { status: 200, body: { state: "open", labels: ["feedback", "needs-eric"] } },
        3: { status: 200, body: { state: "open", labels: ["feedback", "next-slice"] } },
      }),
    );

    const statuses = await fetch([1, 2, 3]);
    expect(statuses.get(1)).toBe("needs-info");
    expect(statuses.get(2)).toBe("needs-eric");
    expect(statuses.get(3)).toBe("next-slice");
  });

  it("prefers needs-eric over needs-info when both somehow land on one issue", async () => {
    const fetch = createStatusFetcher(
      config,
      fakeFetch({
        1: { status: 200, body: { state: "open", labels: ["needs-eric", "needs-info"] } },
      }),
    );

    expect((await fetch([1])).get(1)).toBe("needs-eric");
  });

  it("omits an issue entirely rather than erroring when GitHub is unreachable", async () => {
    const fetch = createStatusFetcher(config, () => Promise.reject(new Error("network down")));

    const statuses = await fetch([7]);
    expect(statuses.has(7)).toBe(false);
  });

  it("omits an issue when GitHub responds with something other than 200", async () => {
    const fetch = createStatusFetcher(config, fakeFetch({ 7: { status: 404, body: null } }));

    expect((await fetch([7])).has(7)).toBe(false);
  });

  it("doesn't re-fetch an issue it already has a fresh answer for", async () => {
    let calls = 0;
    const fetch = createStatusFetcher(config, (): Promise<JsonResponse> => {
      calls++;
      return Promise.resolve({ status: 200, body: { state: "open", labels: [] } });
    });

    await fetch([7]);
    await fetch([7]);

    expect(calls).toBe(1);
  });
});

describe("resolveFeedbackStatus", () => {
  it("is inert without the feedback token, wired once it's set", () => {
    expect(resolveFeedbackStatus({})).toBeUndefined();
    expect(resolveFeedbackStatus({ SKYNET_FEEDBACK_GITHUB_TOKEN: "x" })).toBeInstanceOf(Function);
  });
});
