import { describe, expect, it } from "@rstest/core";
import {
  laneBranch,
  REKICK_MARKER,
  rekickIntent,
  rekickPr,
} from "../../../scripts/moneypenny/rekick-pr.mjs";

// #5936 row 3. A lane build that outlives its 1-hour App token pushes and opens its PR with the
// Actions job token, whose events start no workflow: #5935 (48h), #7089 (16h) sat with zero checks
// until a person reopened them. The build job's post-build step re-mints the App token and edits the
// PR's body once, which sends `pull_request.edited` and starts `verify`; the arm job accepts `edited`.

const RUN = "https://github.com/ejclark/skynet-capital/actions/runs/1";

const pr = (over: Record<string, unknown> = {}) => ({
  number: 7089,
  title: "feat(landing): the next part",
  body: "## Summary\n\n- CI not started — opened with the job token (#5936)",
  draft: false,
  mergeable_state: "clean",
  head: { sha: "a1b2c3d", ref: "feedback/7077" },
  ...over,
});
const actionsSuite = (over: Record<string, unknown> = {}) => ({
  app: { slug: "github-actions" },
  status: "queued",
  conclusion: null,
  latest_check_runs_count: 0,
  ...over,
});
const verifyRun = { name: "verify", status: "in_progress", conclusion: null, started_at: "x" };

describe("laneBranch — the slug the build job passes names the branch its session pushed", () => {
  it("maps plan-<n> and feedback-<n> to their lane branches", () => {
    expect(laneBranch("plan-5912")).toBe("plan/5912");
    expect(laneBranch("feedback-7077")).toBe("feedback/7077");
  });

  it("names no branch for anything else", () => {
    expect(laneBranch("research-pce")).toBeNull();
    expect(laneBranch("")).toBeNull();
  });
});

describe("rekickIntent — only a head CI never started gets the edit", () => {
  it("WHEN the head has no required run and no Actions suite (the job token opened it), edits once", () => {
    const i = rekickIntent({ pr: pr(), checkRuns: [], suites: [], runUrl: RUN });
    expect(i?.prNumber).toBe(7089);
    expect(i?.body.startsWith(pr().body)).toBe(true);
    expect(i?.body).toContain(RUN);
    expect(new RegExp(REKICK_MARKER.source).exec(i?.body ?? "")?.[1]).toBe("a1b2c3d");
  });

  it("WHEN the only Actions suite is a ghost with no jobs (#5221's shape), still edits", () => {
    const ghost = actionsSuite({ status: "completed", conclusion: "failure" });
    expect(rekickIntent({ pr: pr(), checkRuns: [], suites: [ghost] })).not.toBeNull();
  });

  it("WHEN the App token opened it, its suite is queued: leaves a healthy PR untouched", () => {
    expect(rekickIntent({ pr: pr(), checkRuns: [], suites: [actionsSuite()] })).toBeNull();
  });

  it("WHEN verify has reported, does nothing", () => {
    expect(rekickIntent({ pr: pr(), checkRuns: [verifyRun], suites: [] })).toBeNull();
  });

  it("WHEN this head was already edited for, does nothing: one edit per head", () => {
    const first = rekickIntent({ pr: pr(), checkRuns: [], suites: [] });
    const again = rekickIntent({ pr: pr({ body: first?.body }), checkRuns: [], suites: [] });
    expect(again).toBeNull();
    const moved = pr({ body: first?.body, head: { sha: "e5f6", ref: "feedback/7077" } });
    expect(rekickIntent({ pr: moved, checkRuns: [], suites: [] })).not.toBeNull();
  });

  it("skips a draft (verify skips drafts) and a conflicted PR (no run starts on one)", () => {
    expect(rekickIntent({ pr: pr({ draft: true }), checkRuns: [], suites: [] })).toBeNull();
    const dirty = pr({ mergeable_state: "dirty" });
    expect(rekickIntent({ pr: dirty, checkRuns: [], suites: [] })).toBeNull();
  });

  it("reads an empty body as empty, never as the text 'null'", () => {
    const i = rekickIntent({ pr: pr({ body: null }), checkRuns: [], suites: [] });
    expect(i?.body).not.toContain("null");
  });
});

describe("rekickPr — the post-build step, soft on every failure", () => {
  const reads = (open: unknown[], extra: Record<string, unknown> = {}) => {
    const paths: string[] = [];
    const rest = (path: string) => {
      paths.push(path);
      if (path.startsWith("pulls?")) return open;
      if (path.includes("/check-runs")) return extra.checkRuns ?? { check_runs: [] };
      if (path.includes("/check-suites")) return extra.suites ?? { check_suites: [] };
      if (path.startsWith("pulls/")) return pr();
      throw new Error(`unexpected read ${path}`);
    };
    return { rest, paths };
  };

  it("finds the lane's open PR by its branch and PATCHes its body with the App token", () => {
    const { rest, paths } = reads([pr()]);
    const calls: string[][] = [];
    const line = rekickPr("feedback-7077", {
      rest,
      runUrl: RUN,
      log: () => undefined,
      run: (_c, args) => {
        calls.push(args);
        return "";
      },
    });
    expect(paths[0]).toContain("head=ejclark%3Afeedback%2F7077");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.slice(0, 4)).toEqual([
      "api",
      "-X",
      "PATCH",
      "repos/{owner}/{repo}/pulls/7089",
    ]);
    expect(calls[0]?.join(" ")).toContain("moneypenny:rekick sha=a1b2c3d");
    expect(calls[0]?.join(" ")).not.toMatch(/close|reopen|force/);
    expect(line).toContain("#7089");
  });

  it("WHEN verify already runs on the PR, writes nothing", () => {
    const { rest } = reads([pr()], { checkRuns: { check_runs: [verifyRun] } });
    const calls: string[][] = [];
    rekickPr("plan-5912", {
      rest,
      log: () => undefined,
      run: (_c, a) => {
        calls.push(a);
        return "";
      },
    });
    expect(calls).toEqual([]);
  });

  it("WHEN the build opened no PR, writes nothing", () => {
    const { rest } = reads([]);
    const calls: string[][] = [];
    const line = rekickPr("plan-5912", {
      rest,
      log: () => undefined,
      run: (_c, a) => {
        calls.push(a);
        return "";
      },
    });
    expect(calls).toEqual([]);
    expect(line).toMatch(/no open PR/);
  });

  it("a slug that names no lane build reads nothing", () => {
    const { rest, paths } = reads([pr()]);
    rekickPr("research-pce", { rest, log: () => undefined, run: () => "" });
    expect(paths).toEqual([]);
  });

  it("WHEN a read or the edit fails, warns and does not throw: the audit's headless pass is the net", () => {
    const logs: string[] = [];
    const broken = () => {
      throw new Error("HTTP 401: Bad credentials");
    };
    expect(() => rekickPr("plan-5912", { rest: broken, log: (l) => logs.push(l) })).not.toThrow();
    expect(logs.join("\n")).toMatch(/::warning::.*401/);

    const { rest } = reads([pr()]);
    const out = rekickPr("plan-5912", {
      rest,
      log: (l) => logs.push(l),
      run: () => {
        throw Object.assign(new Error("gh failed"), { stderr: "HTTP 403" });
      },
    });
    expect(out).toMatch(/could not/);
  });
});
