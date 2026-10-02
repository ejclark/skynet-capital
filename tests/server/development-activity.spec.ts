import type { JsonResponse } from "../../src/http/fetch-json.js";
import {
  createMergedPullRequestFetcher,
  resolveDevelopmentActivity,
} from "../../src/server/development-activity.js";

/**
 * The merged-PR read behind Activity's development kind (#784 slice 4). GitHub owns the merge, so
 * these specs cover the narrowing — which payloads honestly yield a feed row and which are dropped —
 * plus the two things a member-facing surface depends on: a closed-unmerged PR never reads as shipped
 * work, and a GitHub failure degrades to "nothing new" rather than an error or an empty claim.
 */
describe("development-activity", () => {
  const config = { token: "t", repo: "x/y" };

  const pull = (over: Record<string, unknown> = {}) => ({
    number: 4272,
    title: "feat(activity): development events for merged PRs",
    html_url: "https://github.com/x/y/pull/4272",
    merged_at: "2026-10-02T12:00:00Z",
    user: { login: "claude" },
    ...over,
  });

  const fakeFetch = (res: JsonResponse, calls?: { count: number }) => (): Promise<JsonResponse> => {
    if (calls) calls.count += 1;
    return Promise.resolve(res);
  };

  it("narrows one merged pull request into the fields a feed row needs", async () => {
    const read = createMergedPullRequestFetcher(config, fakeFetch({ status: 200, body: [pull()] }));

    expect(await read()).toEqual([
      {
        number: 4272,
        title: "feat(activity): development events for merged PRs",
        author: "claude",
        url: "https://github.com/x/y/pull/4272",
        mergedAt: "2026-10-02T12:00:00Z",
      },
    ]);
  });

  it("drops a pull request closed WITHOUT merging — the feed may never read that as shipped work", async () => {
    const read = createMergedPullRequestFetcher(
      config,
      fakeFetch({ status: 200, body: [pull({ merged_at: null }), pull({ number: 9 })] }),
    );

    expect((await read()).map((m) => m.number)).toEqual([9]);
  });

  it("drops a payload that cannot say what it is about, rather than inventing a title or a link", async () => {
    const read = createMergedPullRequestFetcher(
      config,
      fakeFetch({
        status: 200,
        body: [
          pull({ title: "" }),
          pull({ html_url: undefined }),
          pull({ number: "4272" }),
          pull({ number: 7 }),
        ],
      }),
    );

    expect((await read()).map((m) => m.number)).toEqual([7]);
  });

  it("leaves the author absent when GitHub named none, rather than guessing one", async () => {
    const read = createMergedPullRequestFetcher(
      config,
      fakeFetch({ status: 200, body: [pull({ user: null })] }),
    );

    expect((await read())[0]).not.toHaveProperty("author");
  });

  it("asks GitHub once inside the cache window, however many renders arrive", async () => {
    const calls = { count: 0 };
    const read = createMergedPullRequestFetcher(
      config,
      fakeFetch({ status: 200, body: [pull()] }, calls),
    );

    await read();
    await read();

    expect(calls.count).toBe(1);
  });

  it("degrades to nothing new on a failed read, never an error", async () => {
    const read = createMergedPullRequestFetcher(config, () =>
      Promise.reject(new Error("github down")),
    );

    expect(await read()).toEqual([]);
  });

  it("keeps the last good answer when a later read fails — a blip never empties the record", async () => {
    let fail = false;
    const read = createMergedPullRequestFetcher(config, () =>
      fail
        ? Promise.reject(new Error("github down"))
        : Promise.resolve({ status: 200, body: [pull()] }),
    );

    await read();
    fail = true;
    // Past the cache window, so the second call really does re-read.
    const clock = Date.now;
    Date.now = () => clock() + 10 * 60_000;
    try {
      expect((await read()).map((m) => m.number)).toEqual([4272]);
    } finally {
      Date.now = clock;
    }
  });

  it("treats a non-200 or non-array body as nothing new, not as an empty repo", async () => {
    const read = createMergedPullRequestFetcher(
      config,
      fakeFetch({ status: 403, body: { message: "no access" } }),
    );

    expect(await read()).toEqual([]);
  });

  it("stays inert until the GitHub token is configured", () => {
    expect(resolveDevelopmentActivity({})).toBeUndefined();
    expect(resolveDevelopmentActivity({ SKYNET_FEEDBACK_GITHUB_TOKEN: "t" })).toBeDefined();
  });
});
