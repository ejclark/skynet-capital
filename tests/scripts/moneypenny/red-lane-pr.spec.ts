import { readFileSync } from "node:fs";
import { audit } from "../../../scripts/moneypenny/audit.mjs";
import { pickupHoldReason } from "../../../scripts/moneypenny/pickup-hold.mjs";
import {
  closeRedLanePr,
  gatherRedLanePrs,
  RED_CLOSE_CAP,
  RED_PR_HOURS,
  type RedLanePr,
  redLaneIntents,
  redLaneOrNone,
} from "../../../scripts/moneypenny/red-lane-pr.mjs";
import { nextPickupOf } from "../../../scripts/moneypenny/state-block.mjs";

// #6440 sat red from 10-30, its session over, while `withoutOpenPr` kept #5482 off the queue with no
// age limit. This is the owner it did not have.

const NOW = Date.parse("2026-11-01T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 36e5).toISOString();

const SHA = "aa0917a5c";
const listed = (over: Record<string, unknown> = {}) => ({
  number: 6440,
  title: "feat(convictions): a failed claim's proposal adopts",
  draft: false,
  auto_merge: null,
  user: { login: "skynet-envoy[bot]" },
  head: { ref: "plan/5482", sha: SHA },
  labels: [],
  created_at: hoursAgo(38),
  updated_at: hoursAgo(38),
  ...over,
});
const run = (name: string, conclusion: string | null, h = 37, status = "completed") => ({
  name,
  status,
  conclusion,
  completed_at: status === "completed" ? hoursAgo(h) : null,
  started_at: hoursAgo(h + 0.1),
  html_url: `https://github.com/x/actions/runs/1/job/${name}`,
});
const redChecks = [run("verify", "failure"), run("integration tests", "skipped")];
const readyIssue = {
  number: 5482,
  state: "open",
  labels: [{ name: "ready" }, { name: "plan" }],
};

/** A fake REST seam over one PR's reads, recording every call. */
const fakeRest = (
  pr = listed(),
  {
    checks = redChecks,
    issue = readyIssue as unknown,
    files = ["src/playbooks/claim-proposals.ts"],
    comments = [] as unknown[],
  } = {},
) => {
  const calls: string[] = [];
  const rest = (path: string) => {
    calls.push(path);
    if (path.startsWith("pulls?state=open")) return [pr];
    if (path.startsWith(`commits/${SHA}/check-runs`)) return { check_runs: checks };
    if (path === "issues/5482") return issue;
    if (path.startsWith("pulls/6440/files")) return files.map((filename) => ({ filename }));
    if (path.startsWith("issues/5482/comments")) return comments;
    throw new Error(`unexpected read: ${path}`);
  };
  return { rest, calls };
};
const gather = (...args: Parameters<typeof fakeRest>) =>
  gatherRedLanePrs(NOW, { rest: fakeRest(...args).rest });

const candidate = (over: Partial<RedLanePr> = {}): RedLanePr => ({
  number: 6440,
  title: "feat(convictions): a failed claim's proposal adopts",
  issue: 5482,
  branch: "plan/5482",
  hours: 37,
  failed: "verify",
  failedUrl: "https://github.com/x/actions/runs/1/job/verify",
  priorCloses: 0,
  ...over,
});

describe("gatherRedLanePrs — which PR has nobody left to own it", () => {
  it("names a lane PR whose required check has been red past the age limit", () => {
    expect(RED_PR_HOURS).toBe(24);
    expect(gather()).toEqual([expect.objectContaining({ number: 6440, issue: 5482, hours: 37 })]);
  });

  it("names the failed check and links it, so the next build starts from the failure", () => {
    expect(gather()[0]).toMatchObject({
      failed: "verify",
      failedUrl: "https://github.com/x/actions/runs/1/job/verify",
    });
  });

  // The arm job waits on it, so a lane PR red on it alone never merges, and nothing else re-runs it.
  it("names a lane PR whose only red check is the stability budget", () => {
    const checks = [
      run("verify", "success"),
      run("integration tests", "success"),
      run("stability budget", "failure"),
    ];
    expect(gather(listed(), { checks })[0]).toMatchObject({
      number: 6440,
      failed: "stability budget",
      failedUrl: "https://github.com/x/actions/runs/1/job/stability budget",
    });
  });

  it("leaves a cancelled stability budget alone, which says nothing about the code", () => {
    const checks = [run("verify", "success"), run("stability budget", "cancelled")];
    expect(gather(listed(), { checks })).toEqual([]);
  });

  it("feedback lane branches count too", () => {
    const pr = listed({ head: { ref: "feedback/5482", sha: SHA } });
    expect(gather(pr)).toHaveLength(1);
  });

  it("leaves a PR red for less than the age limit: its session may still be fixing it", () => {
    const pr = listed({ updated_at: hoursAgo(38) });
    expect(gather(pr, { checks: [run("verify", "failure", 23)] })).toEqual([]);
  });

  it("leaves a PR someone touched inside the age limit, at no check read", () => {
    const { rest, calls } = fakeRest(listed({ updated_at: hoursAgo(2) }));
    expect(gatherRedLanePrs(NOW, { rest })).toEqual([]);
    expect(calls).toEqual(["pulls?state=open&per_page=100&page=1"]);
  });

  it("leaves a green PR, and a re-run still in flight", () => {
    expect(gather(listed(), { checks: [run("verify", "success")] })).toEqual([]);
    const rerun = [run("verify", "failure", 37), run("verify", null, 1, "in_progress")];
    expect(gather(listed(), { checks: rerun })).toEqual([]);
  });

  it("a cancelled check is not red", () => {
    expect(gather(listed(), { checks: [run("verify", "cancelled")] })).toEqual([]);
  });

  it("only a lane session's own PR: never a person's, a dependabot's or a platter's", () => {
    expect(gather(listed({ user: { login: "ejclark" } }))).toEqual([]);
    expect(gather(listed({ user: { login: "dependabot[bot]" } }))).toEqual([]);
    expect(gather(listed({ head: { ref: "platter/2026-10-19", sha: SHA } }))).toEqual([]);
    expect(gather(listed({ head: { ref: "feat/5482-thing", sha: SHA } }))).toEqual([]);
  });

  it("leaves a held PR and a draft", () => {
    expect(gather(listed({ labels: [{ name: "hold-merge" }] }))).toEqual([]);
    expect(gather(listed({ draft: true }))).toEqual([]);
  });

  it("leaves a PR while a session is building its issue", () => {
    const issue = { ...readyIssue, labels: [{ name: "ready" }, { name: "in-progress" }] };
    expect(gather(listed(), { issue })).toEqual([]);
  });

  it("leaves a PR whose issue the queue could not take back: closing it releases nothing", () => {
    const closed = { ...readyIssue, state: "closed" };
    const parked = { ...readyIssue, labels: [{ name: "ready" }, { name: "needs-eric" }] };
    const unready = { ...readyIssue, labels: [{ name: "plan" }] };
    const blocked = { ...readyIssue, issue_dependencies_summary: { blocked_by: 1 } };
    for (const issue of [closed, parked, unready, blocked]) {
      expect(gather(listed(), { issue })).toEqual([]);
    }
  });

  it("leaves a protected diff: that class waits for Eric's merge by design", () => {
    expect(gather(listed(), { files: [".github/workflows/pipeline.yml"] })).toEqual([]);
  });

  it("counts the closes this issue has already been through, from the marker on its comments", () => {
    const comments = [
      { body: "chatter" },
      { body: "x <!-- moneypenny:red-pr-closed pr=6300 --> y" },
      { body: "x <!-- moneypenny:red-pr-closed pr=6400 --> y" },
    ];
    expect(gather(listed(), { comments })[0]?.priorCloses).toBe(2);
  });

  it("costs one call a tick when no lane PR is old enough", () => {
    const { rest, calls } = fakeRest(listed({ updated_at: hoursAgo(1) }));
    gatherRedLanePrs(NOW, { rest });
    expect(calls).toHaveLength(1);
  });
});

describe("redLaneOrNone — soft on failure", () => {
  it("a read it cannot make costs one skipped pass, said out loud, never the audit", () => {
    const warned: string[] = [];
    const out = redLaneOrNone(NOW, {
      rest: () => {
        throw new Error("returned error: 503");
      },
      log: (m: string) => warned.push(m),
    });
    expect(out).toEqual([]);
    expect(warned.join("\n")).toContain("red lane PR pass skipped");
  });
});

describe("redLaneIntents", () => {
  it("says what failed, what happens next and where the work went, in plain words", () => {
    const [i] = redLaneIntents([candidate()]);
    expect(i?.kind).toBe("close-red-lane-pr");
    expect(i?.prBody).toContain("verify");
    expect(i?.prBody).toContain("#5482");
    expect(i?.prBody).toContain("git fetch origin pull/6440/head");
    expect(i?.issueBody).toContain("#6440");
    expect(i?.issueBody).toContain("https://github.com/x/actions/runs/1/job/verify");
    expect(i?.issueBody).toContain("git fetch origin pull/6440/head");
    expect(i?.issueBody).toContain("<!-- moneypenny:red-pr-closed pr=6440 -->");
    expect(i?.issueBody).toContain("Generated by");
    expect(i?.prBody).toContain("Generated by");
    expect(i?.handToSession).toBe(false);
  });

  it("past the cap, the issue goes to a live session instead of looping through the lane", () => {
    expect(RED_CLOSE_CAP).toBe(2);
    expect(redLaneIntents([candidate({ priorCloses: 1 })])[0]?.handToSession).toBe(false);
    const [i] = redLaneIntents([candidate({ priorCloses: 2 })]);
    expect(i?.handToSession).toBe(true);
    expect(i?.issueBody).toContain("needs-session");
  });
});

describe("closeRedLanePr — the act", () => {
  const act = (over: Partial<RedLanePr> = {}) => {
    const calls: string[][] = [];
    const [i] = redLaneIntents([candidate(over)]);
    if (!i) throw new Error("expected an intent");
    const line = closeRedLanePr(i, {
      run: (_cmd: string, args: string[]) => {
        calls.push(args);
        return "";
      },
    });
    return { calls, line };
  };

  it("closes the PR first: the issue's marker only counts a close that happened", () => {
    const { calls } = act();
    expect(calls[0]?.slice(0, 3)).toEqual(["pr", "close", "6440"]);
    expect(calls[1]?.slice(0, 3)).toEqual(["issue", "comment", "5482"]);
  });

  it("deletes the branch last, because a new build branches the same name off main", () => {
    // Both lane prompts say `plan/<n>` off `origin/main`; a stale remote branch of that name leaves
    // the new session a rejected push, one step from a force push. The commits stay on the PR. Last,
    // so a delete that fails has already left the issue its handoff.
    expect(act().calls.at(-1)).toEqual([
      "api",
      "-X",
      "DELETE",
      "repos/{owner}/{repo}/git/refs/heads/plan/5482",
    ]);
  });

  it("never merges and never pushes", () => {
    // The verbs only: the comments are allowed to say "nothing was merged".
    const verbs = act({ priorCloses: 2 }).calls.map((args) => args.slice(0, 2).join(" "));
    expect(verbs).toEqual(["pr close", "issue comment", "issue edit", "api -X"]);
  });

  it("adds needs-session only past the cap", () => {
    const { calls } = act({ priorCloses: 2 });
    expect(calls[2]).toEqual(["issue", "edit", "5482", "--add-label", "needs-session"]);
  });
});

// The next build follows the state block and treats the thread as context, so a closed PR the block
// still counts as delivered is lost work (case A), and a block saying `none` holds the plan forever
// while the comment says it is back in the queue (case B). Driven through the real gather, intents
// and act, against the real parser and the real pick-time hold.
describe("the state block after a red plan PR closes", () => {
  const blockComment = (pickup: string) => ({
    id: 777,
    body: `## State block\n\n**Log:** slice 2 -> #6440\n\n${pickup}\n\n**Blocked on:** nothing`,
  });
  const close = (comments: unknown[], { refuseEdit = false } = {}) => {
    const candidates = gatherRedLanePrs(NOW, { rest: fakeRest(listed(), { comments }).rest });
    const [i] = redLaneIntents(candidates);
    if (!i) throw new Error("expected an intent");
    const calls: string[][] = [];
    const warned: string[] = [];
    closeRedLanePr(i, {
      run: (_cmd: string, args: string[]) => {
        calls.push(args);
        if (refuseEdit && args.includes("PATCH")) throw new Error("HTTP 403: refused");
        return "";
      },
      log: (m: string) => warned.push(m),
    });
    const edit = calls.find((a) => a.includes("PATCH"));
    const newBody = edit?.find((a) => a.startsWith("body="))?.slice("body=".length);
    const said = calls.find((a) => a[0] === "issue" && a[1] === "comment")?.at(-1);
    return { calls, edit, newBody, said, warned };
  };
  const planIssue = { number: 5482, labels: [{ name: "plan" }, { name: "ready" }] };

  it("case A: a block naming slice 3 now names the closed PR's work first, then slice 3", () => {
    const { edit, newBody } = close([blockComment("**Next pickup:** slice 3, the ladder")]);
    expect(edit?.slice(0, 4)).toEqual([
      "api",
      "-X",
      "PATCH",
      "repos/{owner}/{repo}/issues/comments/777",
    ]);
    const pickup = nextPickupOf(newBody);
    expect(pickup).toContain("#6440");
    expect(pickup).toContain("git fetch origin pull/6440/head");
    expect(pickup).toContain("slice 3, the ladder");
    expect(pickup?.indexOf("#6440")).toBeLessThan(pickup?.indexOf("slice 3") ?? -1);
  });

  it("case B: a block saying none is no longer held, so `back in the queue` is true", () => {
    const comments = [blockComment("**Next pickup:** none — #6440 closes this issue")];
    expect(
      pickupHoldReason({ issue: planIssue, comments, subIssues: [], blockedBy: {} }),
    ).toContain("names no next pickup");
    const { newBody, said } = close(comments);
    expect(said).toContain("back in the queue");
    expect(
      pickupHoldReason({
        issue: planIssue,
        comments: [{ id: 777, body: newBody }],
        subIssues: [],
        blockedBy: {},
      }),
    ).toBeNull();
  });

  it("keeps the rest of the block, and the bold-whole-line shape parses too", () => {
    const { newBody } = close([blockComment("**Next pickup: slice 3, the ladder. One PR.**")]);
    expect(newBody).toContain("**Log:** slice 2 -> #6440");
    expect(newBody).toContain("**Blocked on:** nothing");
    expect(nextPickupOf(newBody)).toContain("slice 3, the ladder. One PR.");
    expect(nextPickupOf(newBody)).toContain("#6440");
  });

  it("a block with no pickup line gains one naming the work", () => {
    const { newBody } = close([{ id: 777, body: "## State block\n\nsome state" }]);
    expect(nextPickupOf(newBody)).toContain("#6440");
  });

  it("edits only the newest block, and only after the PR has closed", () => {
    const comments = [
      { id: 111, body: "## State block\n\n**Next pickup:** old" },
      blockComment("**Next pickup:** slice 3"),
    ];
    const { calls, edit } = close(comments);
    expect(edit).toContain("repos/{owner}/{repo}/issues/comments/777");
    expect(calls[0]?.slice(0, 2)).toEqual(["pr", "close"]);
    expect(calls[1]).toBe(edit);
  });

  it("no block, no edit: a feedback issue or #5482's plan has nothing to correct", () => {
    const { edit, said } = close([{ id: 9, body: "chatter" }]);
    expect(edit).toBeUndefined();
    expect(said).not.toContain("state block");
  });

  it("an edit that fails costs neither the handoff nor the branch, and the comment says so", () => {
    const { calls, said, warned } = close([blockComment("**Next pickup:** slice 3")], {
      refuseEdit: true,
    });
    expect(warned.join("\n")).toContain("state block");
    expect(said).toContain("could not be corrected");
    expect(said).toContain("still says");
    expect(calls.at(-1)?.slice(0, 3)).toEqual(["api", "-X", "DELETE"]);
  });

  it("when the edit lands, the comment tells the next build the block already says it", () => {
    expect(close([blockComment("**Next pickup:** slice 3")]).said).toContain(
      "state block's next pickup now names this work",
    );
  });
});

describe("the audit carries it", () => {
  it("audit() emits the intent from deps.redLanePrs", () => {
    const workMode = { trackingIssue: 1, title: null, mode: { position: "normal" } };
    const intents = audit({ redLanePrs: [candidate()], workMode } as unknown as Parameters<
      typeof audit
    >[0]);
    expect(intents.map((i: { kind: string }) => i.kind)).toEqual(["close-red-lane-pr"]);
  });

  it("emits nothing while the work spigot is at halt", () => {
    const workMode = { trackingIssue: 1, title: null, mode: { position: "halt" } };
    const intents = audit({ redLanePrs: [candidate()], workMode } as unknown as Parameters<
      typeof audit
    >[0]);
    expect(intents.map((i: { kind: string }) => i.kind)).not.toContain("close-red-lane-pr");
  });

  // An unread gather means the pass never runs, and an unhandled kind is only a `❓` in the receipt:
  // both stay green everywhere above, so the two ends of the wire are pinned here.
  it("the live gather and the executor are both wired", () => {
    const read = (f: string) => readFileSync(`scripts/moneypenny/${f}`, "utf8");
    expect(read("audit.mjs")).toContain("redLanePrs: redLaneOrNone(nowMs)");
    expect(read("index.mjs")).toMatch(/"close-red-lane-pr":\s*\(?i\)?\s*=>\s*closeRedLanePr\(i\)/);
  });
});
