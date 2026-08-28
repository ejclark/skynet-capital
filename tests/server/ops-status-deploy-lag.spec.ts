import type { JsonResponse } from "../../src/http/fetch-json.js";
import {
  computeDeploySignals,
  createDeployLagFetcher,
  resolveDeployLagFetcher,
} from "../../src/server/ops-status-deploy-lag.js";

const LINK = {
  href: "https://github.com/x/y/actions/workflows/pipeline.yml",
  label: "Open Actions",
};
const HEAD = "4f234c0000000000000000000000000000000bb";
const RELEASED = "8c65f6500000000000000000000000000000cc";

/** Routes a fake GitHub REST response by matching a substring in the request URL — keeps every
 *  spec below readable as "when GitHub says X, the panel says Y" instead of URL plumbing. */
function fakeGithub(byMatch: readonly [string, JsonResponse][]) {
  return (_method: string, url: string): Promise<JsonResponse> => {
    const hit = byMatch.find(([needle]) => url.includes(needle));
    return Promise.resolve(hit ? hit[1] : { status: 404, body: null });
  };
}

const CURRENT_RUNS = {
  status: 200,
  body: { workflow_runs: [{ id: 1, head_sha: HEAD }] },
};
const CURRENT_JOBS = {
  status: 200,
  body: {
    jobs: [
      { name: "release · deploy", conclusion: "success" },
      {
        name: "release · deploy bots",
        conclusion: "success",
        steps: [{ name: "Deploy bots", conclusion: "success" }],
      },
    ],
  },
};

describe("computeDeploySignals", () => {
  const config = { token: "t", repo: "x/y" };

  it("reads both apps as current when the newest run's jobs cover both", async () => {
    const doFetch = fakeGithub([
      ["/commits/main", { status: 200, body: { sha: HEAD } }],
      ["/runs?event=push&branch=main&per_page=20", CURRENT_RUNS],
      ["/actions/runs/1/jobs", CURRENT_JOBS],
    ]);

    const { app, bots } = await computeDeploySignals(config, LINK, doFetch);
    expect(app.verdict).toBe("ok");
    expect(bots.verdict).toBe("ok");
  });

  it("flags the bots app STALE when a bot-relevant path changed since its last deploy", async () => {
    const doFetch = fakeGithub([
      ["/commits/main", { status: 200, body: { sha: HEAD } }],
      [
        "/runs?event=push&branch=main&per_page=20",
        { status: 200, body: { workflow_runs: [{ id: 1, head_sha: RELEASED }] } },
      ],
      [
        "/actions/runs/1/jobs",
        {
          status: 200,
          body: {
            jobs: [
              { name: "release · deploy", conclusion: "success" },
              {
                name: "release · deploy bots",
                conclusion: "success",
                steps: [{ name: "Deploy bots", conclusion: "success" }],
              },
            ],
          },
        },
      ],
      [
        `/compare/${RELEASED}...${HEAD}`,
        {
          status: 200,
          body: {
            commits: [
              { sha: HEAD, commit: { message: "feat: ship it" }, author: { login: "eric" } },
            ],
            files: [{ filename: "src/bots/runner.ts" }],
          },
        },
      ],
    ]);

    const { app, bots } = await computeDeploySignals(config, LINK, doFetch);
    // Same baseline run served both compares here — the app side is genuinely one commit behind
    // too (a human merge, so "unknown" cause, not the silent-merge outage #492 catches).
    expect(app.verdict).toBe("attention");
    expect(app.detail).toContain("cause unclear");
    expect(bots.verdict).toBe("attention");
    expect(bots.detail).toContain("STALE");
  });

  it("degrades to unknown, not a throw, when GitHub is unreachable", async () => {
    const { app, bots } = await computeDeploySignals(config, LINK, () =>
      Promise.reject(new Error("network down")),
    );
    expect(app.verdict).toBe("unknown");
    expect(bots.verdict).toBe("unknown");
    expect(app.link).toEqual(LINK);
  });
});

describe("createDeployLagFetcher", () => {
  it("caches within the TTL window — one GitHub round trip serves several renders", async () => {
    let calls = 0;
    const doFetch = fakeGithub([
      ["/commits/main", { status: 200, body: { sha: HEAD } }],
      ["/runs?event=push&branch=main&per_page=20", CURRENT_RUNS],
      ["/actions/runs/1/jobs", CURRENT_JOBS],
    ]);
    const counted = (method: "GET" | "POST" | "PUT" | "DELETE", url: string) => {
      calls++;
      return doFetch(method, url);
    };
    const fetcher = createDeployLagFetcher({ token: "t", repo: "x/y" }, counted);

    const now = new Date("2026-08-28T12:00:00.000Z");
    await fetcher(now);
    const firstCallCount = calls;
    await fetcher(new Date(now.getTime() + 1_000));

    expect(calls).toBe(firstCallCount); // no new GitHub calls inside the TTL
  });
});

describe("resolveDeployLagFetcher", () => {
  it("is inert without the feedback token, wired once it's set", () => {
    expect(resolveDeployLagFetcher({})).toBeUndefined();
    expect(resolveDeployLagFetcher({ SKYNET_FEEDBACK_GITHUB_TOKEN: "x" })).toBeInstanceOf(Function);
  });
});
