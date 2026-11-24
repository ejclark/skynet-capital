import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  auditIntentsOrSkip,
  claimNext,
  isRateLimited,
  sweepShipped,
} from "../../../scripts/moneypenny/index.mjs";
import {
  issue,
  mode,
  noContinuation,
  noHold,
  noOpenPlans,
  noOpenPrs,
} from "../../support/admission-fixtures.js";

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

  const runAudit = (said: string, args: string[] = ["--audit"]) => {
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
    return spawnSync("node", ["scripts/moneypenny/index.mjs", ...args], {
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

  // #6942, 2026-11-24: run 45304863363 died one step earlier, in `Run Moneypenny` (the router, no
  // flag), on its first read of the open issue list. The peek that follows it reads the same way.
  it("passes the router's push tick with one warning when the budget is spent", () => {
    const out = runAudit("API rate limit exceeded for installation ID 157155153.", []);

    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/::warning::route skipped — this token's API budget is spent/);
  });

  it("still fails the router's push tick on a refusal that is not the budget", () => {
    const out = runAudit("Bad credentials", []);

    expect(out.status).not.toBe(0);
    expect(out.stdout).not.toMatch(/route skipped/);
  });

  it("passes the retry-sweep peek with no has_next when the budget is spent", () => {
    const out = runAudit("API rate limit exceeded for installation ID 157155153.", ["--peek-next"]);

    expect(out.status).toBe(0);
    expect(out.stdout).toMatch(/::warning::retry sweep peek skipped — this token's API budget/);
    expect(out.stdout).not.toMatch(/retry sweep peek —/);
  });

  it("still fails the peek on a refusal that is not the budget", () => {
    const out = runAudit("Bad credentials", ["--peek-next"]);

    expect(out.status).not.toBe(0);
  });
});

// #8215, 2026-11-24: the retry sweep's CLAIM reads before it writes. A scan dispatched while the
// budget still had calls left started after it hit 0/5000, and `--claim-next` died in readInFlight
// before any lease or label write: runs 45312271752 and 45319243602 reopened #6942 a 25th and 26th
// time. The read phase now skips like the peek; the claim write itself still throws.
describe("the retry sweep's claim when the budget is gone", () => {
  const SPENT = new Error(
    "Command failed: gh api repos/{owner}/{repo}/issues?state=open&labels=in-progress\n" +
      "gh: API rate limit exceeded for installation ID 157155153. (HTTP 403)",
  );
  const spent = (): never => {
    throw SPENT;
  };
  const sweep = (over: Record<string, unknown> = {}) => {
    const claimed: string[] = [];
    const fake = (lane: string) => () => {
      claimed.push(lane);
      return { claimed: true, reason: "claimed" };
    };
    const deps = {
      readMode: () => ({ ...mode("normal"), until: null, reason: "set to normal" }),
      readReady: () => [issue(8, "a", ["ready", "feedback"])],
      readInFlight: () => [],
      claims: { plan: fake("plan"), feedback: fake("feedback") },
      continuation: noContinuation,
      readPrIssues: noOpenPrs,
      readPlans: noOpenPlans,
      readHold: noHold,
      ...over,
    };
    return { deps, claimed };
  };

  for (const read of ["readInFlight", "readReady", "readMode"]) {
    it(`skips without claiming when ${read} hits the spent budget`, () => {
      const { deps, claimed } = sweep({ [read]: spent });

      expect(claimNext(0, "abc", deps)).toEqual({
        claimed: false,
        reason: "skipped — this token's API budget is spent",
      });
      expect(claimed).toEqual([]);
    });
  }

  it("still throws when the claim write itself hits the spent budget", () => {
    const { deps } = sweep({ claims: { plan: spent, feedback: spent } });

    expect(() => claimNext(0, "abc", deps)).toThrow(/rate limit exceeded/);
  });

  it("still throws on a read failure that is not the budget", () => {
    const { deps } = sweep({
      readInFlight: () => {
        throw new Error("gh api failed: HTTP 404: Not Found");
      },
    });

    expect(() => claimNext(0, "abc", deps)).toThrow(/HTTP 404/);
  });
});

// Every flag in index.mjs's `claimers` table, run end to end with GitHub refusing every call as a
// spent installation does. Each one reaches its reads (the event lanes get a payload that passes
// their pure intent check), and none may turn the `route` job red or claim anything. The table is
// checked against the source, so a new claimer flag without a row here fails this spec.
describe("every claim flag, run end to end with the budget spent", () => {
  const SAID = "API rate limit exceeded for installation ID 157155153.";
  const issueOf = (labels: string[]) => ({
    number: 8215,
    title: "a filed thing",
    state: "open",
    body: "",
    labels: labels.map((name) => ({ name })),
  });
  const rows: Record<string, { event: string; payload?: object; skips?: RegExp }> = {
    "--claim-feedback": {
      event: "issues",
      payload: { action: "labeled", label: { name: "ready" }, issue: issueOf(["feedback"]) },
    },
    "--claim-feedback-reply": {
      event: "issue_comment",
      payload: {
        action: "created",
        issue: issueOf(["feedback", "ready", "needs-info"]),
        comment: { id: 1, body: "the chart on the trade form", author_association: "OWNER" },
      },
    },
    "--claim-plan": {
      event: "issues",
      payload: { action: "labeled", label: { name: "ready" }, issue: issueOf(["plan"]) },
    },
    "--claim-next": {
      event: "workflow_dispatch",
      skips: /::warning::retry sweep skipped — this token's API budget is spent/,
    },
    "--peek-next": {
      event: "push",
      skips: /::warning::retry sweep peek skipped — this token's API budget is spent/,
    },
  };

  it("has a row for every flag in the claimers table", () => {
    const src = readFileSync("scripts/moneypenny/index.mjs", "utf8");
    const table = src.slice(src.indexOf("const claimers = {"));
    const flags = [...table.slice(0, table.indexOf("\n  };")).matchAll(/^\s+"(--[a-z-]+)":/gm)];

    expect(flags.map((m) => m[1]).sort()).toEqual(Object.keys(rows).sort());
  });

  let dir = "";
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  for (const [flag, row] of Object.entries(rows)) {
    it(`${flag} exits 0 and claims nothing`, () => {
      dir = mkdtempSync(join(tmpdir(), "claim-budget-"));
      writeFileSync(join(dir, "gh"), `#!/bin/sh\necho "gh: ${SAID} (HTTP 403)" >&2\nexit 1\n`);
      writeFileSync(
        join(dir, "curl"),
        `#!/bin/sh\necho '{"message":"${SAID}"}'\necho "curl: (22) The requested URL returned error: 403" >&2\nexit 22\n`,
      );
      chmodSync(join(dir, "gh"), 0o755);
      chmodSync(join(dir, "curl"), 0o755);
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        PATH: `${dir}:${process.env.PATH}`,
        GH_TOKEN: "not-a-token",
        GITHUB_EVENT_NAME: row.event,
      };
      delete env.GITHUB_EVENT_PATH;
      delete env.GITHUB_OUTPUT;
      delete env.GITHUB_STEP_SUMMARY;
      const args = ["scripts/moneypenny/index.mjs", flag];
      if (row.payload) {
        writeFileSync(join(dir, "event.json"), JSON.stringify(row.payload));
        args.push("--event", join(dir, "event.json"));
      }
      const out = spawnSync("node", args, { encoding: "utf8", env });

      expect(out.status).toBe(0);
      expect(out.stdout).not.toMatch(/building in this run/);
      if (row.skips) expect(out.stdout).toMatch(row.skips);
    });
  }

  it("--claim-next still fails on a refusal that is not the budget", () => {
    dir = mkdtempSync(join(tmpdir(), "claim-budget-"));
    writeFileSync(
      join(dir, "gh"),
      `#!/bin/sh\necho "gh: Bad credentials (HTTP 401)" >&2\nexit 1\n`,
    );
    writeFileSync(join(dir, "curl"), `#!/bin/sh\necho "curl: (22) error: 401" >&2\nexit 22\n`);
    chmodSync(join(dir, "gh"), 0o755);
    chmodSync(join(dir, "curl"), 0o755);
    const env: NodeJS.ProcessEnv = {
      ...process.env,
      PATH: `${dir}:${process.env.PATH}`,
      GH_TOKEN: "not-a-token",
      GITHUB_EVENT_NAME: "workflow_dispatch",
    };
    delete env.GITHUB_EVENT_PATH;
    delete env.GITHUB_OUTPUT;
    const out = spawnSync("node", ["scripts/moneypenny/index.mjs", "--claim-next"], {
      encoding: "utf8",
      env,
    });

    expect(out.status).not.toBe(0);
    expect(out.stdout).not.toMatch(/retry sweep skipped/);
  });
});
