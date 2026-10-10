import { describe, expect, it } from "@rstest/core";
import { ensureGhToken, isTransientGhError, withRetry } from "../../../scripts/moneypenny/gh.mjs";

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
