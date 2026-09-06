import { describe, expect, it } from "@rstest/core";
import { isTransientGhError, withRetry } from "../../../scripts/moneypenny/gh.mjs";

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
