import { isRateLimited, sweepShipped } from "../../scripts/moneypenny.mjs";

/**
 * What the postmaster does when the GraphQL budget runs out.
 *
 * `gatherDeps` is fail-closed by design and must stay that way: an unreadable dependency that
 * returned `[]` would be indistinguishable from an empty queue, which is exactly the class of bug
 * #475 was. But a rate limit is not a wrong answer, it is a transient one — and on 2026-08-26
 * treating it as fatal took the whole lane down for an hour, because `route` threw and the research
 * and feedback jobs both need its outputs. One optional sweep should not be able to stop the tick.
 *
 * So these cases pin a narrow exception and its edges: a budget error degrades, everything else
 * still throws.
 */

const RATE_LIMIT = new Error(
  "gh issue list (shipped) failed: GraphQL: API rate limit already exceeded for user ID 3472134.",
);
const noop = (): void => undefined;
const NO_DEPS = { isMerged: () => false, recheckRefs: () => [], warn: noop };

describe("recognising an exhausted budget", () => {
  it("knows the message gh actually prints", () => {
    expect(isRateLimited(RATE_LIMIT)).toBe(true);
  });

  it("knows the machine-readable forms too, which gh swallows", () => {
    expect(isRateLimited(new Error("RATE_LIMITED"))).toBe(true);
    expect(isRateLimited(new Error("RATE_LIMIT_EXCEEDED"))).toBe(true);
  });

  it("does not mistake an ordinary failure for one", () => {
    // The failures that MUST stay fatal — each one could be silently under-reporting.
    expect(isRateLimited(new Error("Unknown JSON field: closedByPullRequests"))).toBe(false);
    expect(isRateLimited(new Error("HTTP 404: Not Found"))).toBe(false);
    expect(isRateLimited(new Error("Bad credentials"))).toBe(false);
    expect(isRateLimited(undefined)).toBe(false);
  });
});

describe("the sweep when the budget is gone", () => {
  it("skips rather than taking the tick down with it", () => {
    const result = sweepShipped(() => {
      throw RATE_LIMIT;
    }, NO_DEPS);

    expect(result).toEqual([]);
  });

  it("still throws on any other failure, so an unreadable queue never reads as an empty one", () => {
    expect(() =>
      sweepShipped(() => {
        throw new Error("Unknown JSON field: closedByPullRequests");
      }, NO_DEPS),
    ).toThrow(/Unknown JSON field/);
  });

  it("reads the list lazily, since that query is the one most likely to hit the budget", () => {
    // Evaluated as an argument, the throw would escape before the guard was ever entered — which
    // is how the first draft of this fix silently did nothing.
    let called = false;
    sweepShipped(() => {
      called = true;
      throw RATE_LIMIT;
    }, NO_DEPS);

    expect(called).toBe(true);
  });

  it("passes a readable list straight through, untouched", () => {
    const issues = [
      { number: 7, title: "a filed thing", closedByPullRequestsReferences: [{ number: 42 }] },
    ];

    expect(sweepShipped(() => issues, { ...NO_DEPS, isMerged: () => true })).toEqual([
      { number: 7, title: "a filed thing", pr: 42 },
    ]);
  });
});
