import type { JsonResponse } from "../../src/http/fetch-json.js";
import { createFollowup, resolveFeedbackFollowup } from "../../src/server/feedback-followup.js";

// A follow-up is a COMMENT on the existing issue, never an edit to its body (which the build lane
// parses) — and it re-triggers a build by cycling the `feedback` label, the same retry path
// postmaster.mjs already documents ("re-apply the feedback label to retry the build"). These specs
// cover the wire-level behavior with a fake fetch, same discipline as feedback-status.spec.ts.
describe("feedback-followup", () => {
  const config = { token: "t", repo: "x/y" };
  const call = (method: string, url: string, body?: unknown) => ({ method, url, body });

  it("posts the member's words as a comment, then removes and re-adds the feedback label", async () => {
    const calls: { method: string; url: string; body?: unknown }[] = [];
    const doFetch = (method: string, url: string, _headers: unknown, body?: unknown) => {
      calls.push(call(method, url, body));
      return Promise.resolve({
        status: method === "POST" && url.endsWith("/comments") ? 201 : 200,
        body: {},
      });
    };

    const result = await createFollowup(
      config,
      doFetch,
    )({
      issueNumber: 7,
      body: "still happening, here's more detail",
    });

    expect(result).toEqual({ ok: true, url: "https://github.com/x/y/issues/7" });
    expect(calls[0]).toMatchObject({
      method: "POST",
      url: "https://api.github.com/repos/x/y/issues/7/comments",
    });
    expect((calls[0]?.body as { body: string } | undefined)?.body).toContain(
      "still happening, here's more detail",
    );
    expect(calls[1]).toMatchObject({
      method: "DELETE",
      url: "https://api.github.com/repos/x/y/issues/7/labels/feedback",
    });
    expect(calls[2]).toMatchObject({
      method: "POST",
      url: "https://api.github.com/repos/x/y/issues/7/labels",
    });
    expect((calls[2]?.body as { labels: string[] } | undefined)?.labels).toEqual(["feedback"]);
  });

  it("names the follow-up the same way an original filing is named", async () => {
    let commentBody = "";
    const doFetch = (
      _m: string,
      url: string,
      _h: unknown,
      body?: unknown,
    ): Promise<JsonResponse> => {
      if (url.endsWith("/comments")) commentBody = (body as { body: string }).body;
      return Promise.resolve({ status: url.endsWith("/comments") ? 201 : 200, body: {} });
    };

    await createFollowup(
      config,
      doFetch,
    )({
      issueNumber: 1,
      body: "more info",
      submitterEmail: "member@example.com",
      submitterName: "Tony",
    });

    expect(commentBody).toContain("Follow-up from **Tony**");
    expect(commentBody).not.toContain("member@example.com");
  });

  it("rejects an empty follow-up before ever calling GitHub", async () => {
    let called = false;
    const doFetch = (): Promise<JsonResponse> => {
      called = true;
      return Promise.resolve({ status: 201, body: {} });
    };

    const result = await createFollowup(config, doFetch)({ issueNumber: 7, body: "   " });

    expect(result).toMatchObject({ ok: false });
    expect(called).toBe(false);
  });

  it("reports the comment failure honestly, and never retriggers a build off a comment that didn't post", async () => {
    let labelCallMade = false;
    const doFetch = (_method: string, url: string): Promise<JsonResponse> => {
      if (url.includes("/labels")) labelCallMade = true;
      return Promise.resolve({ status: 403, body: { message: "no write access" } });
    };

    const result = await createFollowup(config, doFetch)({ issueNumber: 7, body: "hi" });

    expect(result).toEqual({ ok: false, error: "GitHub responded 403: no write access." });
    expect(labelCallMade).toBe(false);
  });

  it("still reports success when the label retrigger fails — the comment already posted", async () => {
    const doFetch = (_m: string, url: string): Promise<JsonResponse> =>
      Promise.resolve(
        url.endsWith("/comments") ? { status: 201, body: {} } : { status: 404, body: {} },
      );

    const result = await createFollowup(config, doFetch)({ issueNumber: 7, body: "hi" });

    expect(result.ok).toBe(true);
  });

  it("is inert without the feedback token, wired once it's set", () => {
    expect(resolveFeedbackFollowup({})).toBeUndefined();
    expect(resolveFeedbackFollowup({ SKYNET_FEEDBACK_GITHUB_TOKEN: "x" })).toBeInstanceOf(Function);
  });
});
