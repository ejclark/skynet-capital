import { readFileSync } from "node:fs";
import { audit } from "../../../scripts/moneypenny/audit.mjs";
import {
  gatherStuckBranches,
  type StuckBranch,
  stuckBranchesOrNone,
  UPDATE_CAP,
  updateIntents,
  updateStuckBranch,
} from "../../../scripts/moneypenny/stuck-branch-update.mjs";

// #6325 has sat green and armed for days: GitHub reads it `blocked`, and its head carries a Pipeline
// run cancelled in the same second as the green one. stuck-pr-decide.mjs names the fix, and only a
// session that ran the scan could read it. This applies it. It is a workaround until that cancelled
// run is explained.

const NOW = Date.parse("2026-11-01T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 36e5).toISOString();
const SHA = "ca294d49c";

const listed = (over: Record<string, unknown> = {}) => ({
  number: 6325,
  title: "feat(feedback): a filing says waiting",
  draft: false,
  auto_merge: { merge_method: "squash" },
  user: { login: "skynet-envoy[bot]" },
  head: { ref: "feedback/6316", sha: SHA },
  labels: [],
  created_at: hoursAgo(120),
  updated_at: hoursAgo(120),
  ...over,
});
const green = (name: string) => ({
  name,
  status: "completed",
  conclusion: "success",
  completed_at: hoursAgo(119),
});
const greenChecks = [green("verify"), green("integration tests")];
const suite = (conclusion: string, runs = 0, slug = "github-actions") => ({
  app: { slug },
  status: "completed",
  conclusion,
  latest_check_runs_count: runs,
  created_at: hoursAgo(120),
});
/** #6325's real suites: one green Pipeline, one cancelled with no jobs, the two apps that sit queued. */
const liveSuites = [
  { app: { slug: "claude" }, status: "queued", conclusion: null, latest_check_runs_count: 0 },
  suite("success", 5),
  suite("cancelled"),
];

const fakeRest = (
  pr = listed(),
  {
    suites = liveSuites as unknown[],
    checks = greenChecks as unknown[],
    state = "blocked",
    files = ["src/server/work-status.ts"],
    comments = [] as unknown[],
  } = {},
) => {
  const calls: string[] = [];
  const rest = (path: string) => {
    calls.push(path);
    if (path.startsWith("pulls?state=open")) return [pr];
    if (path.startsWith(`commits/${SHA}/check-suites`)) return { check_suites: suites };
    if (path.startsWith(`commits/${SHA}/check-runs`)) return { check_runs: checks };
    if (path.startsWith("pulls/6325/files")) return files.map((filename) => ({ filename }));
    if (path === "pulls/6325") return { ...pr, mergeable_state: state };
    if (path.startsWith("issues/6325/comments")) return comments;
    throw new Error(`unexpected read: ${path}`);
  };
  return { rest, calls };
};
const yes = () => true;
const gather = (...args: Parameters<typeof fakeRest>) =>
  gatherStuckBranches(NOW, { rest: fakeRest(...args).rest, takeHourlyLease: yes });

const branch = (over: Partial<StuckBranch> = {}): StuckBranch => ({
  number: 6325,
  title: "feat(feedback): a filing says waiting",
  hours: 119,
  headSha: SHA,
  headRef: "feedback/6316",
  dependabot: false,
  triedShas: [],
  ...over,
});

describe("gatherStuckBranches — which green, armed PR is held by a cancelled suite", () => {
  it("names #6325's shape: green, armed, blocked, a cancelled suite with no jobs", () => {
    expect(gather()).toEqual([expect.objectContaining({ number: 6325, headSha: SHA, hours: 119 })]);
  });

  it("counts a cancelled Actions suite that did start jobs", () => {
    expect(gather(listed(), { suites: [suite("cancelled", 3)] })).toHaveLength(1);
  });

  it("leaves a head with no cancelled suite: that blocker is not a run", () => {
    expect(gather(listed(), { suites: [suite("success", 5)] })).toEqual([]);
    expect(gather(listed(), { suites: [suite("cancelled", 0, "fly-io")] })).toEqual([]);
  });

  it("leaves a PR that is not `blocked`, not green, not armed, draft, held or young", () => {
    expect(gather(listed(), { state: "clean" })).toEqual([]);
    expect(gather(listed(), { checks: [green("verify")] })).toEqual([]);
    expect(gather(listed({ auto_merge: null }))).toEqual([]);
    expect(gather(listed({ draft: true }))).toEqual([]);
    expect(gather(listed({ labels: [{ name: "hold-merge" }] }))).toEqual([]);
    expect(gather(listed({ created_at: hoursAgo(1) }))).toEqual([]);
  });

  it("leaves a protected diff: that class waits for Eric's merge by design", () => {
    expect(gather(listed(), { files: [".github/workflows/pipeline.yml"] })).toEqual([]);
  });

  it("marks a dependabot PR, which takes an empty commit and not a merge commit", () => {
    const pr = listed({
      user: { login: "dependabot[bot]" },
      head: { ref: "dependabot/x", sha: SHA },
    });
    expect(gather(pr)[0]).toMatchObject({ dependabot: true, headRef: "dependabot/x" });
    expect(gather()[0]?.dependabot).toBe(false);
  });

  it("reads which heads were already tried from the marker on the PR's comments", () => {
    const comments = [
      { body: "chatter" },
      { body: "x <!-- moneypenny:update-branch sha=old1 --> y" },
      { body: "x <!-- moneypenny:update-branch sha=old2 --> y" },
    ];
    expect(gather(listed(), { comments })[0]?.triedShas).toEqual(["old1", "old2"]);
  });
});

describe("at most hourly", () => {
  it("does not take the hourly lease, or read past the list, with no candidate", () => {
    const { rest, calls } = fakeRest(listed({ auto_merge: null }));
    let asked = 0;
    const takeHourlyLease = () => {
      asked += 1;
      return true;
    };
    expect(gatherStuckBranches(NOW, { rest, takeHourlyLease })).toEqual([]);
    expect(asked).toBe(0);
    expect(calls).toHaveLength(1);
  });

  it("reads nothing past the list when this hour's lease is already taken", () => {
    const { rest, calls } = fakeRest();
    expect(gatherStuckBranches(NOW, { rest, takeHourlyLease: () => false })).toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it("a head with no cancelled suite stops at one read", () => {
    const { rest, calls } = fakeRest(listed(), { suites: [suite("success", 5)] });
    gatherStuckBranches(NOW, { rest, takeHourlyLease: yes });
    expect(calls).toHaveLength(2);
  });
});

describe("stuckBranchesOrNone — soft on failure", () => {
  it("a read it cannot make costs one skipped pass, said out loud", () => {
    const warned: string[] = [];
    const out = stuckBranchesOrNone(NOW, {
      rest: () => {
        throw new Error("returned error: 503");
      },
      takeHourlyLease: yes,
      log: (m: string) => warned.push(m),
    });
    expect(out).toEqual([]);
    expect(warned.join("\n")).toContain("stuck-branch pass skipped");
  });
});

describe("updateIntents — once per head, and a cap", () => {
  it("updates a head it has not tried", () => {
    const [i] = updateIntents([branch()]);
    expect(i?.kind).toBe("update-stuck-branch");
    expect(i?.body).toContain(`<!-- moneypenny:update-branch sha=${SHA} -->`);
    expect(i?.body).toContain("Generated by");
  });

  it("says plainly that this is a workaround", () => {
    expect(updateIntents([branch()])[0]?.body).toContain("workaround");
  });

  it("does not try the same head twice", () => {
    expect(updateIntents([branch({ triedShas: [SHA] })])).toEqual([]);
  });

  it("a new head is a new try, up to the cap", () => {
    expect(UPDATE_CAP).toBe(3);
    expect(updateIntents([branch({ triedShas: ["a", "b"] })])).toHaveLength(1);
    // An update that lands a new cancelled suite would otherwise repeat hourly, forever.
    expect(updateIntents([branch({ triedShas: ["a", "b", "c"] })])).toEqual([]);
  });
});

describe("updateStuckBranch — the act", () => {
  const act = (over: Partial<StuckBranch> = {}, fails = false) => {
    const calls: string[][] = [];
    const warned: string[] = [];
    const [i] = updateIntents([branch(over)]);
    if (!i) throw new Error("expected an intent");
    const line = updateStuckBranch(i, {
      run: (_cmd: string, args: string[]) => {
        calls.push(args);
        if (fails && calls.length > 1) throw new Error("HTTP 422: refused");
        return "";
      },
      log: (m: string) => warned.push(m),
    });
    return { calls, line, warned };
  };

  it("posts the marker first, then asks GitHub to update the branch at that exact head", () => {
    const { calls } = act();
    expect(calls[0]?.slice(0, 3)).toEqual(["pr", "comment", "6325"]);
    expect(calls[1]).toEqual([
      "api",
      "-X",
      "PUT",
      "repos/{owner}/{repo}/pulls/6325/update-branch",
      "-f",
      `expected_head_sha=${SHA}`,
    ]);
  });

  // Live on #6314, 2026-11-01: dependabot answered the App's `@dependabot rebase` with "Sorry, only
  // users with push access can use that command", the comment itself exited 0, and the receipt said
  // the PR had a new head. No comment command is the way in under this token.
  describe("dependabot's own PR", () => {
    const TREE = "tree1234";
    const NEW = "new5678";
    const actDependabot = (over: Partial<StuckBranch> = {}, refuse = "") => {
      const calls: string[][] = [];
      const warned: string[] = [];
      const [i] = updateIntents([
        branch({ dependabot: true, headRef: "dependabot/npm_and_yarn/x-1.2.3", ...over }),
      ]);
      if (!i) throw new Error("expected an intent");
      const line = updateStuckBranch(i, {
        run: (_cmd: string, args: string[]) => {
          calls.push(args);
          const text = args.join(" ");
          if (refuse && text.includes(refuse)) throw new Error("HTTP 422: refused");
          if (text.includes(`git/commits/${SHA}`)) return TREE;
          if (text.includes("-X POST")) return NEW;
          return "";
        },
        log: (m: string) => warned.push(m),
      });
      return { calls, line, warned };
    };

    it("never posts a dependabot command: that token is refused and the comment still exits 0", () => {
      const { calls } = actDependabot();
      expect(calls.flat().join(" ")).not.toContain("@dependabot");
    });

    it("adds an empty commit dependabot may rebase over, on top of the head it read", () => {
      const { calls } = actDependabot();
      expect(calls[1]).toEqual([
        "api",
        `repos/{owner}/{repo}/git/commits/${SHA}`,
        "--jq",
        ".tree.sha",
      ]);
      const commit = calls[2] ?? [];
      expect(commit.slice(0, 4)).toEqual(["api", "-X", "POST", "repos/{owner}/{repo}/git/commits"]);
      expect(commit).toContain(`tree=${TREE}`);
      expect(commit).toContain(`parents[]=${SHA}`);
      // GitHub's documented marker: without it dependabot stops maintaining a PR it did not push.
      expect(commit.find((a) => a.startsWith("message="))).toContain("[dependabot skip]");
    });

    it("moves the branch without force, so a head that moved since the read refuses it", () => {
      const { calls } = actDependabot();
      expect(calls[3]).toEqual([
        "api",
        "-X",
        "PATCH",
        "repos/{owner}/{repo}/git/refs/heads/dependabot/npm_and_yarn/x-1.2.3",
        "-f",
        `sha=${NEW}`,
      ]);
      expect(calls).toHaveLength(4);
      expect(calls.flat().join(" ")).not.toContain("force");
    });

    it("says it gave a new head only once the branch has moved", () => {
      expect(actDependabot().line).toContain("gave #6325 a new head");
      const { line, warned } = actDependabot({}, "git/refs/heads");
      expect(line).not.toContain("gave #6325 a new head");
      expect(line).toContain("could not update");
      expect(warned.join("\n")).toContain("could not update #6325");
    });
  });

  it("never force-pushes and never merges: the only writes are those two", () => {
    const verbs = act().calls.map((c) => c.slice(0, 3).join(" "));
    expect(verbs).toEqual(["pr comment 6325", "api -X PUT"]);
  });

  it("a refused update is reported, not a red run: the marker stops a retry on this head", () => {
    const { line, warned } = act({}, true);
    expect(warned.join("\n")).toContain("could not update #6325");
    expect(line).toContain("could not update");
  });
});

describe("the audit carries it", () => {
  it("audit() emits the intent from deps.stuckBranches", () => {
    const workMode = { trackingIssue: 1, title: null, mode: { position: "normal" } };
    const intents = audit({ stuckBranches: [branch()], workMode } as unknown as Parameters<
      typeof audit
    >[0]);
    expect(intents.map((i: { kind: string }) => i.kind)).toEqual(["update-stuck-branch"]);
  });

  it("emits nothing while the work spigot is at halt: updating lands work", () => {
    const workMode = { trackingIssue: 1, title: null, mode: { position: "halt" } };
    const intents = audit({ stuckBranches: [branch()], workMode } as unknown as Parameters<
      typeof audit
    >[0]);
    expect(intents.map((i: { kind: string }) => i.kind)).not.toContain("update-stuck-branch");
  });

  // An unread gather means the pass never runs, a missing lease means it never gets past the list,
  // and an unhandled kind is only a `❓` in the receipt: all three stay green everywhere above.
  it("the live gather, the hourly lease and the executor are all wired", () => {
    const read = (f: string) => readFileSync(`scripts/moneypenny/${f}`, "utf8");
    expect(read("audit.mjs")).toContain("stuckBranches: stuckBranchesOrNone(nowMs, hourly)");
    // A dry run takes no lease, so it can never spend the real tick's hour.
    expect(read("index.mjs")).toContain("dry ? {} : { takeHourlyLease: takeUpdateBranchLease }");
    expect(read("index.mjs")).toContain("gatherAuditDeps(Date.now(), hourly)");
    expect(read("index.mjs")).toMatch(
      /"update-stuck-branch":\s*\(?i\)?\s*=>\s*updateStuckBranch\(i\)/,
    );
  });
});
