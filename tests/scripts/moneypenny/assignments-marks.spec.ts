import { describe, expect, it } from "@rstest/core";
import { needsSessionLine } from "../../../scripts/digest-scan.mjs";
import {
  ASSIGN_MARKER,
  artifactGap,
  gather,
  markedByComments,
  plan,
  UNASSIGN_MARKER,
  unassignmentComment,
} from "../../../scripts/moneypenny/assignments.mjs";
import { routeSweep } from "../../../scripts/moneypenny/events.mjs";
import { issue, NOW } from "./assignments-fixtures";

// #5955 (study 2026-11-01, "escalation keeps asking"): the lane unassigned Eric when `needs-eric`
// came off at 10-25T02:20, the label came back at 10-26T11:40, and for six days the capsule carried
// the marker, had nobody assigned and was absent from every digest — the code read the marker as
// "he unassigned himself". The marker is still the memory; the lane's own unassign now writes a
// second marker, and "marked" means the newest of the two is an ask.
describe("markedByComments: asked, and not since cleared by this lane", () => {
  const bot = (body: string) => ({ body, user: { type: "Bot" }, author_association: "NONE" });
  const eric = (body: string) => ({ body, user: { type: "User" }, author_association: "OWNER" });
  const stranger = (body: string) => ({
    body,
    user: { type: "User" },
    author_association: "NONE",
  });

  it("is marked after an ask, and unmarked once this lane's unassign follows it", () => {
    expect(markedByComments([bot(`ask\n${ASSIGN_MARKER}`)])).toBe(true);
    expect(markedByComments([bot(`ask\n${ASSIGN_MARKER}`), bot(`off\n${UNASSIGN_MARKER}`)])).toBe(
      false,
    );
  });

  it("is marked again once a later ask follows the unassign", () => {
    const thread = [
      bot(`ask\n${ASSIGN_MARKER}`),
      bot(`off\n${UNASSIGN_MARKER}`),
      eric(`ask again\n${ASSIGN_MARKER}`),
    ];
    expect(markedByComments(thread)).toBe(true);
  });

  it("is unmarked with no comments, and ignores a stranger's marker on this public repo", () => {
    expect(markedByComments([])).toBe(false);
    expect(markedByComments([stranger(`x\n${ASSIGN_MARKER}`)])).toBe(false);
    expect(
      markedByComments([bot(`ask\n${ASSIGN_MARKER}`), stranger(`x\n${UNASSIGN_MARKER}`)]),
    ).toBe(true);
  });

  // The wiring, not just the rule: `gather()` is what both the sweep and the digest plan from.
  it("gather: a returning label on a capsule this lane unassigned asks again and reaches the digest", () => {
    const thread = [bot(`ask\n${ASSIGN_MARKER}`), bot(`off\n${UNASSIGN_MARKER}`)];
    const returned = issue({ number: 5955, title: "[ci] Pipeline — release · deploy bots" });
    const rest = (path: string) => {
      if (path.startsWith("issues?state=open&labels=needs-eric")) return [returned];
      if (path.startsWith("issues?state=all&assignee=")) return [];
      if (path.includes("labels=needs-session")) return [];
      if (path === "pulls?state=open") return [];
      if (path === "issues/5955/comments") return thread;
      throw new Error(`unexpected read ${path}`);
    };
    const deps = gather({ rest });
    expect(deps.markers.has(5955)).toBe(false);
    const { actions, needsYou } = plan({ ...deps, now: NOW });
    expect(actions).toEqual([expect.objectContaining({ kind: "assign", number: 5955 })]);
    expect(needsYou.map((n) => n.number)).toEqual([5955]);

    // And the opposite half still holds: an ask he answered by unassigning himself stays quiet.
    const his = gather({
      rest: (p: string) => (p === "issues/5955/comments" ? [thread[0]] : rest(p)),
    });
    expect(his.markers.has(5955)).toBe(true);
    expect(plan({ ...his, now: NOW }).actions).toEqual([]);
  });

  it("gather: the same rule for a held PR — closed and unassigned, then reopened, it is asked again", () => {
    const held = {
      number: 10,
      title: "platter",
      state: "open",
      draft: false,
      created_at: new Date(NOW - 13 * 36e5).toISOString(),
      labels: [{ name: "hold-merge" }],
      assignees: [],
      head: { ref: "platter/2026-11" },
    };
    const rest = (path: string) => {
      if (path.startsWith("issues?state=")) return [];
      if (path === "pulls?state=open") return [held];
      if (path === "issues/10/comments")
        return [bot(`ask\n${ASSIGN_MARKER}`), bot(`off\n${UNASSIGN_MARKER}`)];
      if (path === "pulls/10/files") return [{ filename: ".github/workflows/x.yml" }];
      throw new Error(`unexpected read ${path}`);
    };
    const deps = gather({ rest, now: NOW });
    expect(deps.markers.has(10)).toBe(false);
    expect(plan({ ...deps, now: NOW }).actions).toEqual([
      expect.objectContaining({ kind: "assign", criterion: 4, number: 10 }),
    ]);
  });

  it("says a closed issue is asked again on reopen, not on relabel", () => {
    expect(unassignmentComment({ why: "issue closed" })).toContain("reopened");
    expect(unassignmentComment({ why: "needs-eric removed" })).not.toContain("reopened");
  });
});

// The composition order inside routeSweep is behaviour, not arrangement: every lane in that sweep
// plans from one pre-write snapshot, so two of them can disagree about the same issue in one tick.
describe("routeSweep: a close beats an ask on the same issue", () => {
  const needsEricIssue = issue({ number: 42, title: "shipped but still labelled" });

  it("drops the assignment for an issue this same tick is closing as shipped", () => {
    const intents = routeSweep({
      shippedFeedback: [{ number: 42, title: "shipped but still labelled", pr: 99 }],
      assignments: { issues: [needsEricIssue], prs: [], markers: new Set() },
      now: NOW,
      issueCards: true,
    }) as { kind: string; number?: number; issueNumber?: number }[];
    expect(intents.map((i) => i.kind)).toEqual(["close-shipped"]);
  });

  it("still asks when nothing in the tick touches that issue (with per-issue cards on)", () => {
    const intents = routeSweep({
      assignments: { issues: [needsEricIssue], prs: [], markers: new Set() },
      now: NOW,
      issueCards: true,
    }) as { kind: string }[];
    expect(intents.map((i) => i.kind)).toEqual(["assign-eric"]);
  });

  // #7939 slice 2: the decisions page carries criterion 1's asks, so no card goes out per issue.
  it("sends no per-issue card for an issue ask by default", () => {
    const intents = routeSweep({
      assignments: { issues: [needsEricIssue], prs: [], markers: new Set() },
      now: NOW,
    }) as { kind: string }[];
    expect(intents).toEqual([]);
  });
});

// #6953 slice 2, call 1: half the asks in the 2026-11-06 digest could not be completed by his
// answer, because the thing his "yes" would act on did not exist yet — #6942 asked him to merge a
// branch with no PR, #6620 was a held PR carrying only a patch, #6618 asked him to merge #6620.
// The missing actor is a session, so none of them is assigned to him; all are listed for one.
describe("no ask before its artifact exists (#6953)", () => {
  const ask = (line: string) => `**Ask.**\n\n> [!IMPORTANT]\n> **Needs from you**\n> 1. ${line}`;
  const branchAsk = issue({
    number: 6942,
    body: ask("Merge the tested fix on branch `fix/breaker-stepless-cancelled-leg`? — protected."),
  });
  const heldPatch = {
    number: 6620,
    title: "held patch",
    state: "open",
    created_at: "2026-09-28T00:00:00Z",
    labels: [{ name: "hold-merge" }],
    head: { ref: "fix/node-24" },
    assignees: [],
  };

  it("does not assign a merge of a branch no open PR is built from, and lists it for a session", () => {
    const planned = plan({ issues: [branchAsk], now: NOW });
    expect(planned.actions).toEqual([]);
    expect(planned.needsYou).toEqual([]);
    expect(planned.needsSession).toEqual([
      expect.objectContaining({
        number: 6942,
        why: expect.stringContaining("`fix/breaker-stepless-cancelled-leg`"),
      }),
    ]);
  });

  it("asks as usual once a PR is open from that branch", () => {
    const pr = { ...heldPatch, number: 7001, head: { ref: "fix/breaker-stepless-cancelled-leg" } };
    const planned = plan({ issues: [branchAsk], prs: [pr], now: NOW });
    expect(planned.actions.map((a) => a.number)).toContain(6942);
    expect(planned.needsSession).toEqual([]);
  });

  it("only a merge ask is held to it: a branch named in any other ask is still his", () => {
    const other = issue({ body: ask("Delete the stale branch `platter/old`? — tidy.") });
    expect(plan({ issues: [other], now: NOW }).actions).toHaveLength(1);
  });

  it("never assigns a held PR whose only files are patches, nor a merge ask that names one", () => {
    const merge6620 = issue({ number: 6618, body: ask("Merge #6620 once it boards the platter?") });
    const planned = plan({
      issues: [merge6620],
      prs: [heldPatch],
      patchOnly: new Set([6620]),
      now: NOW,
    });
    expect(planned.actions).toEqual([]);
    expect(planned.needsYou).toEqual([]);
    expect(planned.needsSession.map((n) => n.number)).toEqual([6618, 6620]);
    // The same PR with a real file is criterion 4 as before.
    expect(plan({ prs: [heldPatch], now: NOW }).actions).toEqual([
      expect.objectContaining({ kind: "assign", criterion: 4, number: 6620 }),
    ]);
  });

  it("one he already holds stays in Needs you — he holds it — and is listed for a session too", () => {
    const his = { ...branchAsk, assignees: [{ login: "ejclark" }] };
    const planned = plan({ issues: [his], now: NOW });
    expect(planned.needsYou.map((n) => n.number)).toEqual([6942]);
    expect(planned.needsSession.map((n) => n.number)).toEqual([6942]);
  });

  it("lists every needs-session issue that still waits: open, or closed by a proof close", () => {
    const capsule = {
      state: "closed",
      state_reason: "not_planned",
      closed_at: new Date(NOW - 2 * 864e5).toISOString(),
      labels: [{ name: "ci-failure" }, { name: "needs-session" }],
    };
    const row = (number: number, over: Record<string, unknown>) => ({
      number,
      title: `s${number}`,
      body: "",
      ...over,
    });
    const planned = plan({
      sessionIssues: [
        row(1, { state: "open" }),
        row(2, { ...capsule, body: ask("Merge it?") }),
        row(3, { ...capsule, state_reason: "completed" }),
        row(4, { ...capsule, state_reason: null, pull_request: {} }),
        // Past the reopen window a fault has been quiet 14 days: nothing is left waiting.
        row(5, { ...capsule, closed_at: new Date(NOW - 15 * 864e5).toISOString() }),
        // A not-planned close that is no CI capsule: another lane's, and not this list's.
        row(6, { ...capsule, labels: [{ name: "needs-session" }] }),
      ],
      now: NOW,
    });
    expect(planned.needsSession).toEqual([
      expect.objectContaining({ number: 1, why: "labelled needs-session" }),
      expect.objectContaining({ number: 2, decision: "Merge it?" }),
    ]);
  });

  it("the base branch a PR merges into is never read as a head with no PR", () => {
    const into = issue({ body: ask("Merge #6900 into the `main` branch? — it is green.") });
    expect(plan({ issues: [into], now: NOW }).needsSession).toEqual([]);
  });

  it("lists a carried ask exactly as long as repair.mjs would reopen its capsule", async () => {
    const { REOPEN_SINCE_MS } = await import("../../../scripts/moneypenny/assignments.mjs");
    const { REOPEN_DAYS } = await import("../../../scripts/moneypenny/repair.mjs");
    expect(REOPEN_SINCE_MS).toBe(REOPEN_DAYS * 864e5);
  });

  it("artifactGap reads the whole callout, not only its first item", () => {
    const two = ask("Pick a name? — taste\n> 2. Merge branch `x/y` after?");
    expect(artifactGap({ number: 1, body: two })).toContain("`x/y`");
    expect(artifactGap({ number: 1, body: two }, { openHeads: new Set(["x/y"]) })).toBeNull();
  });

  it("gather reads the file lists of held and named PRs, and the needs-session issues", () => {
    const asked: string[] = [];
    const held = { ...heldPatch, created_at: new Date(NOW - 13 * 36e5).toISOString() };
    const rest = (path: string): unknown[] => {
      asked.push(path);
      if (path.startsWith("issues?state=open&labels=needs-eric")) {
        return [issue({ number: 6618, body: ask("Merge #6620? — and #6794 is an issue") })];
      }
      if (path === "pulls?state=open") return [held];
      if (path === "pulls/6620/files") return [{ filename: "MONEYPENNY-EVENTS-6618.patch" }];
      if (path === "issues?state=open&labels=needs-session") return [{ number: 9 }];
      if (path.startsWith("issues?state=closed&labels=needs-session,ci-failure&since=")) {
        return [{ number: 10 }];
      }
      return [];
    };
    const deps = gather({ rest, now: NOW });
    expect([...deps.patchOnly]).toEqual([6620]);
    expect(deps.sessionIssues).toEqual([{ number: 9 }, { number: 10 }]);
    // #6794 is not an open PR, so its files are never read.
    expect(asked).not.toContain("pulls/6794/files");
  });

  it("the digest's needs-a-session line counts and names them", () => {
    expect(needsSessionLine({ needsSession: [] })).toBe(
      "- Needs a session: nothing is waiting on a session.",
    );
    expect(
      needsSessionLine({ needsSession: [{ number: 6942, why: "asks for a merge of branch `x`" }] }),
    ).toBe(
      "- Needs a session: 1 waiting on a session, not on you — #6942 asks for a merge of branch `x`.",
    );
  });
});
