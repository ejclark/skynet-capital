import { describe, expect, it } from "@rstest/core";
import {
  DEFAULT_HOURS,
  describe as describeStuck,
  isGhostSuite,
  judgePr,
  stuckLine,
} from "../../scripts/stuck-pr-decide.mjs";

// 2026-10-16: #5221 sat 5 days with `verify` and `integration tests` green and auto-merge armed while
// its Merge box read "blocked". Its head carried a ghost: a github-actions check suite with no check
// runs, started by a pull_request event the bare GITHUB_TOKEN identity sent (run 38117526811). These
// fixtures are that shape, taken from the live API the same day. 0 of 144 PRs that merged within
// hours had one; every PR that sat for days did.
const NOW = Date.parse("2026-10-16T12:00:00Z");
const ago = (h: number) => new Date(NOW - h * 3.6e6).toISOString();

const green = (h: number) => [
  { name: "verify", status: "completed", conclusion: "success", completed_at: ago(h + 0.1) },
  { name: "integration tests", status: "completed", conclusion: "success", completed_at: ago(h) },
  {
    name: "arm auto-merge",
    status: "completed",
    conclusion: "success",
    completed_at: ago(h - 0.01),
  },
];
const ghost = (conclusion: string, h = 100) => ({
  app: { slug: "github-actions" },
  status: "completed",
  conclusion,
  latest_check_runs_count: 0,
  created_at: ago(h),
});
const realSuite = {
  app: { slug: "github-actions" },
  status: "completed",
  conclusion: "success",
  latest_check_runs_count: 5,
};
const queuedClaude = {
  app: { slug: "claude" },
  status: "queued",
  conclusion: null,
  latest_check_runs_count: 0,
};
const queuedFly = {
  app: { slug: "fly-io" },
  status: "queued",
  conclusion: null,
  latest_check_runs_count: 0,
};

const pr = (over: Record<string, unknown> = {}) => ({
  number: 5221,
  draft: false,
  labels: [],
  auto_merge: { enabled_by: { login: "skynet-envoy[bot]" } },
  mergeable_state: "blocked",
  ...over,
});

describe("isGhostSuite", () => {
  it("names a github-actions suite that ran no jobs and did not succeed", () => {
    for (const c of ["action_required", "failure", "startup_failure", "cancelled"]) {
      expect(isGhostSuite(ghost(c))).toBe(true);
    }
  });

  it("ignores the queued claude and fly-io suites every PR carries, and any suite that ran jobs", () => {
    expect(isGhostSuite(queuedClaude)).toBe(false);
    expect(isGhostSuite(queuedFly)).toBe(false);
    expect(isGhostSuite(realSuite)).toBe(false);
    expect(isGhostSuite(ghost("skipped"))).toBe(false);
  });
});

describe("judgePr — green, armed, and still blocked (#5221, #4855)", () => {
  it("WHEN the head is green for days, armed, blocked and carries a ghost, names the ghost and the real-identity fix", () => {
    const out = judgePr({
      pr: pr(),
      checkRuns: green(120),
      suites: [queuedClaude, queuedFly, realSuite, ghost("action_required", 120)],
      now: NOW,
    });
    expect(out?.kind).toBe("blocked");
    expect(out?.ghosts).toHaveLength(1);
    expect(out?.why).toContain("ghost");
    expect(out?.fix).toContain("update-branch");
  });

  it("still flags a blocked-but-ghostless PR, saying the cause is not a run", () => {
    const out = judgePr({ pr: pr(), checkRuns: green(30), suites: [realSuite], now: NOW });
    expect(out?.kind).toBe("blocked");
    expect(out?.ghosts).toHaveLength(0);
    expect(out?.why).toContain("no ghost suite explains it");
  });

  it("leaves a healthy merge alone: green for minutes is not stuck", () => {
    expect(
      judgePr({
        pr: pr({ mergeable_state: "clean" }),
        checkRuns: green(0.1),
        suites: [realSuite],
        now: NOW,
      }),
    ).toBeNull();
    expect(
      judgePr({
        pr: pr(),
        checkRuns: green(DEFAULT_HOURS - 0.5),
        suites: [ghost("failure", 1)],
        now: NOW,
      }),
    ).toBeNull();
  });

  it("leaves an armed, green PR in any non-blocked state alone (clean merges itself; dirty belongs to the conflict lane)", () => {
    for (const mergeable_state of ["clean", "dirty", "behind", "unknown", "unstable"]) {
      expect(
        judgePr({ pr: pr({ mergeable_state }), checkRuns: green(50), suites: [], now: NOW }),
      ).toBeNull();
    }
  });
});

describe("judgePr — green and never armed (#4449's class)", () => {
  it("flags a green, unheld, unarmed PR once it is older than the threshold", () => {
    const out = judgePr({
      pr: pr({ auto_merge: null, mergeable_state: "unstable" }),
      checkRuns: green(29),
      suites: [realSuite],
      now: NOW,
    });
    expect(out?.kind).toBe("unarmed");
    expect(out?.fix).toContain("arm auto-merge");
  });

  it("does not flag a PR held on purpose, a draft, or a conflicted one", () => {
    const base = { auto_merge: null, mergeable_state: "clean" };
    expect(
      judgePr({
        pr: pr({ ...base, labels: [{ name: "hold-merge" }] }),
        checkRuns: green(50),
        suites: [],
        now: NOW,
      }),
    ).toBeNull();
    expect(
      judgePr({ pr: pr({ ...base, draft: true }), checkRuns: green(50), suites: [], now: NOW }),
    ).toBeNull();
    expect(
      judgePr({
        pr: pr({ ...base, mergeable_state: "dirty" }),
        checkRuns: green(50),
        suites: [],
        now: NOW,
      }),
    ).toBeNull();
  });
});

describe("judgePr — the head only ever got the ghost (#4877)", () => {
  it("flags a head with a ghost and no required check run at all", () => {
    const out = judgePr({
      pr: pr(),
      checkRuns: [],
      suites: [queuedClaude, ghost("failure", 40)],
      now: NOW,
    });
    expect(out?.kind).toBe("headless");
    expect(out?.hours).toBe(40);
  });

  it("does not call a red or still-running head headless: those have their own signal", () => {
    const red = [
      { name: "verify", status: "completed", conclusion: "failure", completed_at: ago(50) },
    ];
    const running = [{ name: "verify", status: "in_progress", conclusion: null }];
    expect(judgePr({ pr: pr(), checkRuns: red, suites: [ghost("failure")], now: NOW })).toBeNull();
    expect(
      judgePr({ pr: pr(), checkRuns: running, suites: [ghost("failure")], now: NOW }),
    ).toBeNull();
  });

  it("does not flag a headless head with no ghost (nothing to name) or a fresh ghost", () => {
    expect(judgePr({ pr: pr(), checkRuns: [], suites: [queuedClaude], now: NOW })).toBeNull();
    expect(
      judgePr({ pr: pr(), checkRuns: [], suites: [ghost("action_required", 1)], now: NOW }),
    ).toBeNull();
  });
});

describe("judgePr — a re-run supersedes the run it replaced", () => {
  it("judges the latest run of each required check", () => {
    const rerun = [
      { name: "verify", status: "completed", conclusion: "failure", completed_at: ago(80) },
      { name: "verify", status: "completed", conclusion: "success", completed_at: ago(60) },
      {
        name: "integration tests",
        status: "completed",
        conclusion: "success",
        completed_at: ago(59),
      },
    ];
    expect(judgePr({ pr: pr(), checkRuns: rerun, suites: [], now: NOW })?.kind).toBe("blocked");
  });
});

describe("the digest line", () => {
  it("says unknown, never none, when GitHub could not be read", () => {
    expect(stuckLine(null)).toContain("unknown");
  });

  it("names every stuck PR with its kind and age", () => {
    const stuck = [
      judgePr({ pr: pr(), checkRuns: green(120), suites: [ghost("failure")], now: NOW }),
    ];
    const line = stuckLine(stuck as never);
    expect(line).toContain("#5221 (blocked, 120h)");
    expect(describeStuck(stuck[0] as never)).toContain("pulls/5221/update-branch");
  });

  it("reports an empty list as healthy", () => {
    expect(stuckLine([])).toContain("none");
  });
});
