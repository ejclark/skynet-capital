import { notPullableReason, PARKING_LABELS } from "../../scripts/moneypenny/labels.mjs";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import { createFollowup, resolveFeedbackFollowup } from "../../src/server/feedback-followup.js";

// A follow-up is a COMMENT on the existing issue, never an edit to its body (which the build lane
// parses). Since #3912 the build starts on `ready`, not on `feedback`, so a follow-up restarts the
// build only on a filing that is already `ready` — by cycling `ready` — and never adds `ready` to
// one still in Backlog (the backlog gate, docs/FEEDBACK.md → What the lane will build, #5848).
// These specs cover the wire-level behavior with a fake fetch, same discipline as
// feedback-status.spec.ts.
describe("feedback-followup", () => {
  const config = { token: "t", repo: "x/y" };
  const ISSUE = "https://api.github.com/repos/x/y/issues/7";
  type Call = { method: string; url: string; body?: unknown };

  /** A fake GitHub: the comment posts (201), the issue GET answers with `labels` (plus any other
   *  REST fields in `issue`), and each label call answers the next of `labelStatus` (the last one
   *  repeats). Records every call in order. */
  const github = (
    labels: readonly string[],
    labelStatus: number | readonly number[] = 200,
    issue: Record<string, unknown> = {},
  ) => {
    const calls: Call[] = [];
    const statuses = typeof labelStatus === "number" ? [labelStatus] : labelStatus;
    let labelCall = 0;
    const doFetch = (
      method: string,
      url: string,
      _headers: unknown,
      body?: unknown,
    ): Promise<JsonResponse> => {
      calls.push({ method, url, body });
      if (url.endsWith("/comments")) return Promise.resolve({ status: 201, body: {} });
      if (method === "GET" && url === ISSUE) {
        return Promise.resolve({
          status: 200,
          body: { number: 7, state: "open", labels: labels.map((name) => ({ name })), ...issue },
        });
      }
      const status = statuses[Math.min(labelCall, statuses.length - 1)] ?? 200;
      labelCall += 1;
      return Promise.resolve({ status, body: {} });
    };
    return { calls, doFetch };
  };
  const labelCalls = (calls: readonly Call[]) => calls.filter((c) => c.url.includes("/labels"));

  it("on a ready filing, posts the comment, then removes and re-adds ready so the build runs again", async () => {
    const { calls, doFetch } = github(["feedback", "bug", "ready"]);

    const result = await createFollowup(
      config,
      doFetch,
    )({
      issueNumber: 7,
      body: "still happening, here's more detail",
    });

    expect(result).toEqual({
      ok: true,
      url: "https://github.com/x/y/issues/7",
      outcome: "restarted",
    });
    expect(calls[0]).toMatchObject({ method: "POST", url: `${ISSUE}/comments` });
    expect((calls[0]?.body as { body: string } | undefined)?.body).toContain(
      "still happening, here's more detail",
    );
    expect(calls[1]).toMatchObject({ method: "GET", url: ISSUE });
    expect(calls[2]).toMatchObject({ method: "DELETE", url: `${ISSUE}/labels/ready` });
    expect(calls[3]).toMatchObject({ method: "POST", url: `${ISSUE}/labels` });
    expect((calls[3]?.body as { labels: string[] } | undefined)?.labels).toEqual(["ready"]);
    expect(calls).toHaveLength(4);
  });

  it("on a filing still in Backlog, posts the comment and touches no label — a follow-up never skips the gate", async () => {
    const { calls, doFetch } = github(["feedback", "idea"]);

    const result = await createFollowup(config, doFetch)({ issueNumber: 7, body: "more detail" });

    expect(result).toEqual({
      ok: true,
      url: "https://github.com/x/y/issues/7",
      outcome: "backlog",
    });
    expect(labelCalls(calls)).toEqual([]);
  });

  // Every case the claim's pull rule refuses: the follow-up asks that same rule, so it never cycles
  // `ready` on a filing the claim would then refuse — and the outcome says which rule held it.
  const refused: readonly [string, readonly string[], Record<string, unknown>, string][] = [
    ...PARKING_LABELS.map((l): [string, readonly string[], Record<string, unknown>, string] => [
      `carries ${l}`,
      ["feedback", "ready", l],
      {},
      "held",
    ]),
    ["is already in-progress", ["feedback", "ready", "in-progress"], {}, "building"],
    ["carries needs-session", ["feedback", "ready", "needs-session"], {}, "held"],
    [
      "has an open blocker",
      ["feedback", "ready"],
      { issue_dependencies_summary: { blocked_by: 1 } },
      "blocked",
    ],
    [
      "is closed (shipped, ready never removed)",
      ["feedback", "ready"],
      { state: "closed" },
      "closed",
    ],
  ];
  it.each(refused)(
    "leaves a ready filing that %s alone, and says why — the claim would refuse it",
    async (_case, labels, issue, outcome) => {
      const row = { number: 7, state: "open", labels: labels.map((name) => ({ name })), ...issue };
      expect(notPullableReason(row)).not.toBeNull(); // the real rule refuses it

      const { calls, doFetch } = github(labels, 200, issue);
      const result = await createFollowup(config, doFetch)({ issueNumber: 7, body: "more" });

      expect(result).toMatchObject({ ok: true, outcome });
      expect(labelCalls(calls)).toEqual([]);
    },
  );

  it("names the follow-up the same way an original filing is named", async () => {
    const { calls, doFetch } = github(["feedback"]);

    await createFollowup(
      config,
      doFetch,
    )({
      issueNumber: 7,
      body: "more info",
      submitterEmail: "member@example.com",
      submitterName: "Tony",
    });

    const commentBody = (calls[0]?.body as { body: string } | undefined)?.body ?? "";
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

  it("reports the comment failure honestly, and never reads or relabels off a comment that didn't post", async () => {
    const calls: string[] = [];
    const doFetch = (method: string, url: string): Promise<JsonResponse> => {
      calls.push(`${method} ${url}`);
      return Promise.resolve({ status: 403, body: { message: "no write access" } });
    };

    const result = await createFollowup(config, doFetch)({ issueNumber: 7, body: "hi" });

    expect(result).toEqual({ ok: false, error: "GitHub responded 403: no write access." });
    expect(calls).toEqual([`POST ${ISSUE}/comments`]);
  });

  it("still counts the comment as sent when removing ready fails, and never re-adds it", async () => {
    const { calls, doFetch } = github(["feedback", "ready"], 500);

    const result = await createFollowup(config, doFetch)({ issueNumber: 7, body: "hi" });

    expect(result).toEqual({
      ok: true,
      url: "https://github.com/x/y/issues/7",
      outcome: "unchanged",
    });
    expect(labelCalls(calls).map((c) => c.method)).toEqual(["DELETE"]);
  });

  it("retries re-adding ready once when it came off, and restarts if the retry lands", async () => {
    const { calls, doFetch } = github(["feedback", "ready"], [200, 500, 200]);

    const result = await createFollowup(config, doFetch)({ issueNumber: 7, body: "hi" });

    expect(result).toMatchObject({ ok: true, outcome: "restarted" });
    expect(labelCalls(calls).map((c) => c.method)).toEqual(["DELETE", "POST", "POST"]);
  });

  it("reports a stranded filing — ready off and not back on — and logs its number for an operator", async () => {
    const { calls, doFetch } = github(["feedback", "ready"], [200, 500]);
    const warnings: string[] = [];

    const result = await createFollowup(config, doFetch, (line) => warnings.push(line))({
      issueNumber: 7,
      body: "hi",
    });

    expect(result).toMatchObject({ ok: true, outcome: "stranded" });
    expect(labelCalls(calls).map((c) => c.method)).toEqual(["DELETE", "POST", "POST"]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("#7");
  });

  it("still counts the comment as sent when the label read fails or throws", async () => {
    for (const read of [
      () => Promise.resolve({ status: 404, body: {} }),
      () => Promise.reject(new Error("socket hang up")),
    ]) {
      const calls: string[] = [];
      const doFetch = (method: string, url: string): Promise<JsonResponse> => {
        calls.push(`${method} ${url}`);
        if (url.endsWith("/comments")) return Promise.resolve({ status: 201, body: {} });
        return read();
      };

      const result = await createFollowup(config, doFetch)({ issueNumber: 7, body: "hi" });

      expect(result).toMatchObject({ ok: true, outcome: "unchanged" });
      expect(calls.some((c) => c.includes("/labels"))).toBe(false);
    }
  });

  it("is inert without the feedback token, wired once it's set", () => {
    expect(resolveFeedbackFollowup({})).toBeUndefined();
    expect(resolveFeedbackFollowup({ SKYNET_FEEDBACK_GITHUB_TOKEN: "x" })).toBeInstanceOf(Function);
  });
});
