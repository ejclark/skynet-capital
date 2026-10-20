import { describe, expect, it } from "@rstest/core";
import {
  ensureGhToken,
  ghRestAll,
  isTransientGhError,
  withRetry,
} from "../../../scripts/moneypenny/gh.mjs";

// 2026-09-05: one `HTTP 504: Gateway Timeout` from `gh api graphql` inside gatherDeps killed a
// whole Moneypenny route run and dispatched a repair session for GitHub's own hiccup
// (docs/LESSONS.md). The retry turns a transient 5xx into a pause; a 4xx still fails fast.
describe("moneypenny gh retry", () => {
  it("classifies GitHub 5xx and network resets as transient, 4xx as not", () => {
    expect(
      isTransientGhError("gh: HTTP 504: Gateway Timeout (https://api.github.com/graphql)"),
    ).toBe(true);
    expect(isTransientGhError("error: HTTP 502 Bad Gateway")).toBe(true);
    expect(isTransientGhError("connect ECONNRESET 140.82.112.6:443")).toBe(true);
    expect(isTransientGhError("gh: HTTP 404: Not Found")).toBe(false);
    expect(isTransientGhError("API rate limit already exceeded for user ID 3472134")).toBe(false);
    expect(isTransientGhError(undefined)).toBe(false);
  });

  // #5354: `ghRest` is curl, which words a 5xx its own way; a 4xx in that wording stays fatal.
  it("classifies curl's wording of a 5xx as transient, and its 4xx as not", () => {
    expect(isTransientGhError("curl: (22) The requested URL returned error: 500\n")).toBe(true);
    expect(isTransientGhError("curl: (22) The requested URL returned error: 503")).toBe(true);
    expect(isTransientGhError("curl: (22) The requested URL returned error: 403")).toBe(false);
    expect(isTransientGhError("curl: (22) The requested URL returned error: 429")).toBe(false);
  });

  // #4675: GitHub's GraphQL internal error names no HTTP status, so `item-edit` got one attempt.
  it("classifies GraphQL's status-less internal error as transient", () => {
    const GH_SAID =
      "GraphQL: Something went wrong while executing your query on 2026-10-05T23:26:22Z. " +
      "Please include `9424:27423:3B6D361:C7247FB:6AC4321D` when reporting this issue.\n";
    expect(isTransientGhError(GH_SAID)).toBe(true);
    expect(isTransientGhError("GraphQL: Could not resolve to a node with the global id")).toBe(
      false,
    );
  });

  it("retries a transient failure with exponential backoff and returns the eventual answer", () => {
    const slept: number[] = [];
    let calls = 0;
    const out = withRetry(
      () => {
        calls += 1;
        if (calls < 3)
          throw Object.assign(new Error("boom"), { stderr: "gh: HTTP 504: Gateway Timeout" });
        return "ok";
      },
      { baseMs: 10, sleep: (ms) => slept.push(ms) },
    );
    expect(out).toBe("ok");
    expect(calls).toBe(3);
    expect(slept).toEqual([10, 20]);
  });

  it("rethrows a non-transient failure on the first try without sleeping", () => {
    const slept: number[] = [];
    let calls = 0;
    expect(() =>
      withRetry(
        () => {
          calls += 1;
          throw Object.assign(new Error("gh: HTTP 404: Not Found"), { stderr: "" });
        },
        { sleep: (ms) => slept.push(ms) },
      ),
    ).toThrow(/404/);
    expect(calls).toBe(1);
    expect(slept).toEqual([]);
  });

  it("gives up after the last attempt and surfaces the final transient error", () => {
    let calls = 0;
    expect(() =>
      withRetry(
        () => {
          calls += 1;
          throw Object.assign(new Error("x"), { stderr: "HTTP 503 Service Unavailable" });
        },
        { attempts: 3, sleep: () => undefined },
      ),
    ).toThrow();
    expect(calls).toBe(3);
  });
});

// #5918: one curl 500 on page 2 of the open-issue read killed `route --audit`; the retry belongs
// to each page, so every caller gets it and the pages already read are never fetched again.
describe("ghRestAll", () => {
  const curl500 = () =>
    Object.assign(new Error("Command failed: curl -sS --fail …&page=2"), {
      stderr: "curl: (22) The requested URL returned error: 500\n",
    });

  it("retries a page that 5xx'd and returns the whole list, re-reading only that page", () => {
    const reads: string[] = [];
    let page2Failures = 1;
    const read = (url: string) => {
      reads.push(url);
      if (url.endsWith("page=1")) return [{ n: 1 }, { n: 2 }];
      if (page2Failures-- > 0) throw curl500();
      return [{ n: 3 }];
    };
    const out = ghRestAll("issues?state=open", { perPage: 2, read, sleep: () => undefined });
    expect(out).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
    expect(reads).toEqual([
      "issues?state=open&per_page=2&page=1",
      "issues?state=open&per_page=2&page=2",
      "issues?state=open&per_page=2&page=2",
    ]);
  });

  it("fails on a 4xx page at once, without sleeping", () => {
    const slept: number[] = [];
    let calls = 0;
    const read = () => {
      calls += 1;
      throw Object.assign(new Error("Command failed: curl … returned error: 403"), {
        stderr: "curl: (22) The requested URL returned error: 403",
      });
    };
    expect(() => ghRestAll("issues", { read, sleep: (ms) => slept.push(ms) })).toThrow(/403/);
    expect(calls).toBe(1);
    expect(slept).toEqual([]);
  });
});

// #5056: the steer read-back hands a live session `node scripts/issues.mjs …` commands; without a
// token in the environment every one died on `curl --fail`'s 401. The gh login is the fallback.
describe("ensureGhToken", () => {
  const withEnv = (env: Record<string, string | undefined>, fn: () => void) => {
    const saved = { GH_TOKEN: process.env.GH_TOKEN, GITHUB_TOKEN: process.env.GITHUB_TOKEN };
    for (const [k, v] of Object.entries(env)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    try {
      fn();
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  };

  it("leaves a token that is already set alone, and never asks gh", () => {
    withEnv({ GH_TOKEN: "set", GITHUB_TOKEN: undefined }, () => {
      ensureGhToken({
        run: () => {
          throw new Error("gh must not be asked");
        },
      });
      expect(process.env.GH_TOKEN).toBe("set");
    });
  });

  it("fills GH_TOKEN from the gh login when nothing is set", () => {
    withEnv({ GH_TOKEN: undefined, GITHUB_TOKEN: undefined }, () => {
      ensureGhToken({ run: () => "from-gh" });
      expect(process.env.GH_TOKEN).toBe("from-gh");
    });
  });

  it("says how to sign in when there is no token and no gh login", () => {
    withEnv({ GH_TOKEN: undefined, GITHUB_TOKEN: undefined }, () => {
      expect(() =>
        ensureGhToken({
          run: () => {
            throw new Error("not logged in");
          },
        }),
      ).toThrow(/gh auth login/);
    });
  });
});
