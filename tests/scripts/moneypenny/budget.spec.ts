import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  auditIntentsOrSkip,
  isRateLimited,
  sweepShipped,
} from "../../../scripts/moneypenny/index.mjs";

/**
 * What Moneypenny does when the GraphQL budget runs out.
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

// #6942 (2026-11-07): run 42321492817's push-tick audit died on its first timeline read with the
// App installation's REST budget at 0, and `route` went red over a quota, not a defect. The
// message below is the one `ghRest` built for that read, `GitHub said:` suffix and all.
describe("the audit tick when the budget is gone", () => {
  const SPENT = new Error(
    "Command failed: curl -sS --fail-with-body … issues/5365/timeline?per_page=100&page=1\n" +
      "curl: (22) The requested URL returned error: 403\n" +
      "GitHub said: API rate limit exceeded for installation ID 157155153.",
  );

  it("skips with one warning instead of failing the step", () => {
    const lines: string[] = [];
    const result = auditIntentsOrSkip(
      () => {
        throw SPENT;
      },
      (line) => lines.push(line),
    );

    expect(result).toBeNull();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^::warning::audit skipped — this token's API budget is spent/);
  });

  it("still throws on any other read failure, so a broken read never looks like no stalls", () => {
    expect(() =>
      auditIntentsOrSkip(() => {
        throw new Error("gh issue list failed: HTTP 404: Not Found");
      }, noop),
    ).toThrow(/HTTP 404/);
  });

  it("hands readable intents straight back, an empty list included", () => {
    const intents = [{ type: "flag-stall", number: 7 }];

    expect(auditIntentsOrSkip(() => intents, noop)).toBe(intents);
    expect(auditIntentsOrSkip(() => [], noop)).toEqual([]);
  });
});

// The wiring, through the real CLI: `gh` and `curl` on PATH answer every call the way GitHub
// answers a spent installation. Before #6942's fix the step died in `gatherDeps`, the ROUTER's read,
// which the audit never used and which ran ahead of any guard.
describe("the audit step, run end to end with GitHub refusing every call", () => {
  let dir = "";
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const runAudit = (said: string) => {
    dir = mkdtempSync(join(tmpdir(), "audit-budget-"));
    writeFileSync(join(dir, "gh"), `#!/bin/sh\necho "gh: ${said} (HTTP 403)" >&2\nexit 1\n`);
    writeFileSync(
      join(dir, "curl"),
      `#!/bin/sh\necho '{"message":"${said}"}'\necho "curl: (22) The requested URL returned error: 403" >&2\nexit 22\n`,
    );
    chmodSync(join(dir, "gh"), 0o755);
    chmodSync(join(dir, "curl"), 0o755);
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      GH_TOKEN: "not-a-token",
      GITHUB_EVENT_NAME: "push",
    };
    delete env.GITHUB_EVENT_PATH;
    delete env.GITHUB_STEP_SUMMARY;
    return spawnSync("node", ["scripts/moneypenny/index.mjs", "--audit"], {
      encoding: "utf8",
      env,
    });
  };

  it("passes with one warning when the budget is spent", () => {
    const out = runAudit("API rate limit exceeded for installation ID 157155153.");

    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/::warning::audit skipped — this token's API budget is spent/);
  });

  it("still fails on a refusal that is not the budget", () => {
    const out = runAudit("Bad credentials");

    expect(out.status).not.toBe(0);
    expect(out.stdout).not.toMatch(/audit skipped/);
  });
});
