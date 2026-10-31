import { describe, expect, it } from "@rstest/core";
import {
  ATTEMPTS,
  armPr,
  classifyArmFailure,
  rateLimitWaitSeconds,
  runWithRetry,
} from "../../scripts/arm-merge.mjs";

// The arm job's failures, verbatim where we have them. #6093 (2026-10-26) sat green and unarmed
// because the inline helper retried only rate limits and GitHub answered with its GraphQL internal
// error; #5940/#6019 because main moved under the arm call itself (#5932).
const GRAPHQL_HICCUP =
  "GraphQL: Something went wrong while executing your query on 2026-10-26T14:28:39Z. " +
  "Please include `8C14:2F3E:1A2B3C:4D5E6F:6A1B2C3D` when reporting this issue.";
const BASE_MOVED =
  "GraphQL: Base branch was modified. Review and try the merge again. (mergePullRequest)";
const CLEAN = "X Pull request ejclark/skynet-capital#4750 is in clean status";
const UNSTABLE = "X Pull request ejclark/skynet-capital#4750 is in unstable status";
const RATE = "GraphQL: API rate limit already exceeded for installation ID 1234";

const fail = (stderr: string) => Object.assign(new Error("Command failed: gh"), { stderr });

/** A fake `run`: each call consumes the next scripted answer — a string returns, an Error throws. */
function scripted(answers: Array<string | Error>) {
  const calls: string[][] = [];
  const run = (cmd: string, args: string[]) => {
    calls.push([cmd, ...args]);
    const next = answers.shift();
    if (next === undefined) throw new Error("scripted run exhausted");
    if (next instanceof Error) throw next;
    return next;
  };
  return { run, calls };
}

const noop = () => {
  // the specs assert on calls and return values, not on waits or log lines
};
const quiet = { sleep: noop, log: noop, waitFor: () => 30 };

describe("classifyArmFailure", () => {
  it("names each failure the arm job has hit by its kind", () => {
    expect(classifyArmFailure(GRAPHQL_HICCUP)).toBe("transient");
    expect(classifyArmFailure("gh: HTTP 502: Bad Gateway")).toBe("transient");
    expect(classifyArmFailure(BASE_MOVED)).toBe("base-moved");
    expect(classifyArmFailure(CLEAN)).toBe("already-green");
    expect(classifyArmFailure(UNSTABLE)).toBe("already-green");
    expect(classifyArmFailure(RATE)).toBe("rate-limit");
    expect(classifyArmFailure("gh: HTTP 429: Too Many Requests")).toBe("rate-limit");
  });

  it("treats an already-landed mutation as done, not a failure", () => {
    expect(classifyArmFailure("X Pull request #12 was already merged")).toBe("done");
    expect(classifyArmFailure("Auto merge is already enabled")).toBe("done");
  });

  it("leaves a 4xx or validation error fatal", () => {
    expect(classifyArmFailure("gh: HTTP 403: Resource not accessible by integration")).toBe(
      "fatal",
    );
    expect(classifyArmFailure("GraphQL: Pull request is in draft state")).toBe("fatal");
    expect(classifyArmFailure(undefined)).toBe("fatal");
  });
});

describe("runWithRetry", () => {
  it("retries a GraphQL hiccup with backoff and returns the next success", () => {
    const { run, calls } = scripted([fail(GRAPHQL_HICCUP), "ok"]);
    const waits: number[] = [];
    const r = runWithRetry("gh", ["api", "x"], { ...quiet, run, sleep: (ms) => waits.push(ms) });
    expect(r).toEqual({ kind: "ok", out: "ok" });
    expect(calls).toHaveLength(2);
    expect(waits).toEqual([5000]);
  });

  it("is bounded: the third transient failure throws", () => {
    const { run, calls } = scripted([
      fail(GRAPHQL_HICCUP),
      fail(GRAPHQL_HICCUP),
      fail(GRAPHQL_HICCUP),
      "never",
    ]);
    expect(() => runWithRetry("gh", ["api", "x"], { ...quiet, run })).toThrow();
    expect(calls).toHaveLength(ATTEMPTS);
  });

  it("fails a fatal error on the first try", () => {
    const { run, calls } = scripted([fail("gh: HTTP 404: Not Found"), "never"]);
    expect(() => runWithRetry("gh", ["api", "x"], { ...quiet, run })).toThrow();
    expect(calls).toHaveLength(1);
  });

  it("waits out a rate limit for the reset, not the short backoff", () => {
    const { run } = scripted([fail(RATE), "ok"]);
    const waits: number[] = [];
    runWithRetry("gh", ["api", "x"], {
      ...quiet,
      run,
      sleep: (ms) => waits.push(ms),
      waitFor: () => 120,
    });
    expect(waits).toEqual([120_000]);
  });
});

describe("rateLimitWaitSeconds", () => {
  it("waits until the later reset plus 5s, clamped to [30, 900]", () => {
    const now = () => 1_000_000_000_000; // ms — the resets are epoch seconds
    expect(rateLimitWaitSeconds({ run: () => "1000000100", now })).toBe(105);
    expect(rateLimitWaitSeconds({ run: () => "1000000001", now })).toBe(30);
    expect(rateLimitWaitSeconds({ run: () => "1000009999", now })).toBe(900);
    expect(
      rateLimitWaitSeconds({
        run: () => {
          throw new Error("no");
        },
        now,
      }),
    ).toBe(30);
  });
});

describe("armPr", () => {
  it("arms auto-merge through a transient GraphQL error (#6093)", () => {
    const { run, calls } = scripted([fail(GRAPHQL_HICCUP), ""]);
    expect(armPr(6093, { ...quiet, run })).toBe("armed");
    expect(calls.map((c) => c.join(" "))).toEqual([
      "gh pr merge --auto --squash 6093",
      "gh pr merge --auto --squash 6093",
    ]);
  });

  it("merges directly when GitHub says the PR is already clean or unstable (#4750)", () => {
    const { run, calls } = scripted([fail(UNSTABLE), "merged"]);
    expect(armPr(4750, { ...quiet, run })).toBe("merged");
    expect(calls[1]).toEqual(["gh", "pr", "merge", "--squash", "4750"]);
  });

  it("falls through to a retried direct merge when the base moves under the arm call (#5932)", () => {
    const { run, calls } = scripted([fail(BASE_MOVED), fail(BASE_MOVED), "merged"]);
    expect(armPr(5940, { ...quiet, run })).toBe("merged");
    expect(calls).toHaveLength(3);
  });

  it("gives up after three moved bases and fails (#4939)", () => {
    const { run, calls } = scripted([
      fail(CLEAN),
      fail(BASE_MOVED),
      fail(BASE_MOVED),
      fail(BASE_MOVED),
      "never",
    ]);
    expect(() => armPr(1, { ...quiet, run })).toThrow();
    expect(calls).toHaveLength(1 + ATTEMPTS);
  });

  it("calls a retried merge that had in fact landed done", () => {
    const { run } = scripted([
      fail(CLEAN),
      fail(GRAPHQL_HICCUP),
      fail("X Pull request #9 was already merged"),
    ]);
    expect(armPr(9, { ...quiet, run })).toBe("done");
  });

  it("still fails on an error no retry fixes", () => {
    const { run } = scripted([fail("gh: HTTP 403: Resource not accessible by integration")]);
    expect(() => armPr(1, { ...quiet, run })).toThrow();
  });
});
