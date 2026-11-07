import { describe, expect, it } from "@rstest/core";
import { needsSessionLine } from "../../../scripts/digest-scan.mjs";
import { parseAsk } from "../../../scripts/moneypenny/ask-card.mjs";
import {
  ASSIGN_CAP,
  ASSIGN_MARKER,
  artifactGap,
  askOnce,
  assignmentComment,
  batchStart,
  decisionLine,
  executeAssignments,
  gather,
  lastAskedAt,
  markedByComments,
  OPEN_CAP,
  plan,
  report,
  routeAssignments,
  UNASSIGN_MARKER,
  unassignmentComment,
} from "../../../scripts/moneypenny/assignments.mjs";
import { routeSweep } from "../../../scripts/moneypenny/events.mjs";

// #4289 (#3818 slice 5): `needs-eric` means one thing — a decision only Eric can make. The dry run
// lists every such issue with the decision it waits on and says what it WOULD assign; it writes
// nothing (live assignment is a separate step after Eric reads a dry run).
const NOW = Date.parse("2026-09-30T12:00:00Z");
const CALLOUT =
  "**Ask.**\n\n> [!IMPORTANT]\n> **Needs from you**\n> 1. Pick A or B? — why\n> 2. second";
const CALLOUT_WITH_OPTIONS = [
  "> [!IMPORTANT]",
  "> **Needs from you**",
  "> 1. Re-arm the breaker? — a bot safety rule",
  ">    - A (predicted, medium): yes",
  ">    - B: no",
].join("\n");
const issue = (over: Record<string, unknown> = {}) => ({
  number: 1,
  title: "t",
  body: CALLOUT,
  state: "open",
  created_at: "2026-09-28T12:00:00Z",
  labels: [{ name: "needs-eric" }],
  assignees: [],
  user: { login: "skynet-envoy[bot]" },
  ...over,
});

describe("decisionLine: the one decision an issue waits on", () => {
  it("reads the first numbered item of the callout", () => {
    expect(decisionLine(CALLOUT)).toBe("Pick A or B? — why");
  });

  it("falls back to the first plain callout line when nothing is numbered", () => {
    expect(decisionLine("> [!IMPORTANT]\n> **Needs from you**\n> Merge it — why")).toBe(
      "Merge it — why",
    );
  });

  it("is null with no callout, a callout below the fold, or a callout that never says Needs from you", () => {
    expect(decisionLine("plain body")).toBeNull();
    expect(decisionLine(null)).toBeNull();
    expect(decisionLine(`top\n<details>\n${CALLOUT}\n</details>`)).toBeNull();
    expect(decisionLine("> [!IMPORTANT]\n> Heads up: something")).toBeNull();
  });
});

describe("plan: the honest queue", () => {
  it("lists every open needs-eric issue, flagging one with no stated decision instead of assigning it", () => {
    const { queue, actions } = plan({
      issues: [issue(), issue({ number: 2, body: "no callout" })],
      now: NOW,
    });
    expect(queue.map((q) => [q.number, q.decision, q.ageDays])).toEqual([
      [1, "Pick A or B? — why", 2],
      [2, null, 2],
    ]);
    expect(actions.map((a) => a.number)).toEqual([1]);
    expect(report({ queue, actions })).toContain("**clear candidate**");
  });
});

describe("plan: assignments (criteria 1–4)", () => {
  it("criterion 1: assigns a needs-eric issue that states its decision", () => {
    expect(plan({ issues: [issue()], now: NOW }).actions).toEqual([
      expect.objectContaining({ kind: "assign", criterion: 1, number: 1 }),
    ]);
  });

  it("criterion 3: never asks twice — a marked issue gets no second assignment", () => {
    expect(plan({ issues: [issue()], markers: new Set([1]), now: NOW }).actions).toEqual([]);
  });

  it("leaves an issue Eric already holds by hand alone", () => {
    const held = issue({ assignees: [{ login: "ejclark" }] });
    expect(plan({ issues: [held], now: NOW }).actions).toEqual([]);
  });

  it("criterion 2: removes only its own assignment once the label is gone or the issue closed", () => {
    const off = issue({ labels: [], assignees: [{ login: "ejclark" }] });
    const closed = issue({ number: 3, state: "closed", assignees: [{ login: "ejclark" }] });
    const handAssigned = issue({ number: 4, labels: [], assignees: [{ login: "ejclark" }] });
    const { actions } = plan({
      issues: [off, closed, handAssigned],
      markers: new Set([1, 3]),
      now: NOW,
    });
    expect(actions.map((a) => [a.kind, a.number, a.why])).toEqual([
      ["unassign", 1, "needs-eric removed"],
      ["unassign", 3, "issue closed"],
    ]);
  });

  it("criterion 4: assigns a held or platter PR only after 12h unmerged", () => {
    const pr = (over: Record<string, unknown>) => ({
      number: 10,
      state: "open",
      labels: [{ name: "hold-merge" }],
      created_at: "2026-09-29T12:00:00Z",
      head: { ref: "fix/x" },
      assignees: [],
      ...over,
    });
    const { actions } = plan({
      prs: [
        pr({}),
        pr({ number: 11, labels: [], head: { ref: "platter/2026-09-29" } }),
        pr({ number: 12, created_at: "2026-09-30T06:00:00Z" }),
        pr({ number: 13, labels: [] }),
        pr({ number: 14, draft: true }),
      ],
      now: NOW,
    });
    expect(actions.map((a) => [a.number, a.criterion])).toEqual([
      [10, 4],
      [11, 4],
    ]);
  });

  // Found by the first live run (2026-10-02): #4436 was assigned under criterion 4, and the next
  // tick saw it among `issues` as marked + assigned + no needs-eric and wanted it cleared — an
  // assign/unassign loop pushing at Eric twice a cycle.
  it("criterion 4 outranks criterion 2: a still-held PR is never unassigned for lacking needs-eric", () => {
    const asIssue = issue({ number: 10, labels: [], assignees: [{ login: "ejclark" }] });
    const held = {
      number: 10,
      title: "held",
      state: "open",
      labels: [{ name: "hold-merge" }],
      created_at: "2026-09-29T12:00:00Z",
      assignees: [{ login: "ejclark" }],
    };
    expect(
      plan({ issues: [asIssue], prs: [held], markers: new Set([10]), now: NOW }).actions,
    ).toEqual([]);
    // …and once it stops being held, criterion 2 clears it as before.
    expect(plan({ issues: [asIssue], prs: [], markers: new Set([10]), now: NOW }).actions).toEqual([
      expect.objectContaining({ kind: "unassign", criterion: 2, number: 10 }),
    ]);
  });

  it("criterion 3 covers a held PR too: once marked, an unassign is his answer, not a prompt to re-ask", () => {
    const held = {
      number: 10,
      title: "held",
      state: "open",
      labels: [{ name: "hold-merge" }],
      created_at: "2026-09-29T12:00:00Z",
      assignees: [],
    };
    // Unmarked: ask. Marked and he took himself off: never again — otherwise every push re-assigns
    // him, since nothing else in `gather()` can even see a PR that is neither needs-eric nor his.
    expect(plan({ prs: [held], now: NOW }).actions).toHaveLength(1);
    expect(plan({ prs: [held], markers: new Set([10]), now: NOW }).actions).toEqual([]);
  });

  it("asks once when a held PR also carries needs-eric", () => {
    const both = issue({ number: 10 });
    const pr = {
      number: 10,
      state: "open",
      labels: ["hold-merge"],
      created_at: "2026-09-28T00:00:00Z",
    };
    expect(plan({ issues: [both], prs: [pr], now: NOW }).actions).toHaveLength(1);
  });
});

describe("assignmentComment", () => {
  it("quotes the decision and carries the marker criteria 2–3 key on", () => {
    const body = assignmentComment({ decision: "Pick A or B?" });
    expect(body).toContain("> Pick A or B?");
    expect(body).toContain(ASSIGN_MARKER);
  });
});

// The live half (#4289's remaining piece): the push sweep routes `plan()`'s actions as intents and
// writes them. Everything below is pure or injected — nothing here reaches GitHub.
describe("routeAssignments: the sweep's intents", () => {
  it("is a no-op without the gathered deps, so every non-push event routes as it did before", () => {
    expect(routeAssignments({})).toEqual([]);
    expect(routeAssignments({ assignments: null })).toEqual([]);
  });

  it("turns an assignable issue into one intent carrying the comment to post", () => {
    const [intent, ...rest] = routeAssignments({
      assignments: { issues: [issue()], prs: [], markers: new Set() },
      now: NOW,
    });
    expect(rest).toEqual([]);
    if (!intent) throw new Error("one intent expected");
    expect(intent).toMatchObject({ kind: "assign-eric", number: 1, criterion: 1 });
    expect(intent.body).toContain("> 1. Pick A or B? — why");
    expect(intent.body).toContain("> 2. second");
  });

  it("caps new asks at ASSIGN_CAP and takes the oldest numbers first", () => {
    const many = [9, 7, 1, 5, 3].map((number) => issue({ number }));
    const intents = routeAssignments({
      assignments: { issues: many, prs: [], markers: new Set() },
      now: NOW,
    });
    expect(intents).toHaveLength(ASSIGN_CAP);
    expect(intents.map((i) => i.number)).toEqual([1, 3, 5]);
  });

  it("never caps a removal, and puts removals ahead of the asks", () => {
    const stale = [20, 21, 22, 23].map((number) =>
      issue({ number, labels: [], assignees: [{ login: "ejclark" }] }),
    );
    const intents = routeAssignments({
      assignments: {
        issues: [...stale, issue({ number: 1 })],
        prs: [],
        markers: new Set([20, 21, 22, 23]),
      },
      now: NOW,
    });
    expect(intents.map((i) => [i.kind, i.number])).toEqual([
      ["unassign-eric", 20],
      ["unassign-eric", 21],
      ["unassign-eric", 22],
      ["unassign-eric", 23],
      ["assign-eric", 1],
    ]);
  });

  it("gives a held PR a decision of its own — the merge click is the ask", () => {
    const [intent] = routeAssignments({
      assignments: {
        issues: [],
        prs: [
          {
            number: 10,
            title: "held",
            state: "open",
            labels: [{ name: "hold-merge" }],
            created_at: "2026-09-29T12:00:00Z",
            assignees: [],
          },
        ],
        markers: new Set(),
      },
      now: NOW,
    });
    if (!intent) throw new Error("one intent expected");
    expect(intent).toMatchObject({ kind: "assign-eric", number: 10, criterion: 4 });
    expect(intent.body).toContain("Merge this held PR");
    // …and claims nothing it never checked: `heldPrHours` reads state/draft/label/age only, and
    // `hold-merge` also goes on a PR held for a taste fork.
    expect(intent.body).not.toMatch(/green|protected/i);
  });
});

describe("executeAssignments: the two writes", () => {
  const spy = () => {
    const calls: string[][] = [];
    const run = (_cmd: string, args: string[]) => {
      calls.push(args);
      return "";
    };
    return { calls, run };
  };

  // Order is a correctness choice, not a style one: the marker comment is this lane's memory, so a
  // comment that lands without its assignment silences the item in BOTH channels forever (criterion
  // 1 skips a marked issue, and needsYou drops it). Assignment first keeps the phone push.
  it("assigns BEFORE commenting, so a half-write still leaves Eric holding the item", () => {
    const { calls, run } = spy();
    executeAssignments(
      { kind: "assign-eric", number: 7, criterion: 1, why: "w", body: "the ask" },
      { run },
    );
    expect(calls.map((a) => [a[2], a[3]])).toEqual([
      ["POST", "repos/{owner}/{repo}/issues/7/assignees"],
      ["POST", "repos/{owner}/{repo}/issues/7/comments"],
    ]);
    expect(calls[1] ?? []).toContain("body=the ask");
  });

  it("sends every write through the retry wrapper, so GitHub's own 5xx does not strand a half-write", () => {
    const { run } = spy();
    let wrapped = 0;
    const retry = <T>(fn: () => T) => {
      wrapped += 1;
      return fn();
    };
    executeAssignments(
      { kind: "assign-eric", number: 7, criterion: 1, why: "w", body: "the ask" },
      { run, retry },
    );
    expect(wrapped).toBe(2);
    executeAssignments(
      { kind: "unassign-eric", number: 7, criterion: 2, why: "w" },
      { run, retry },
    );
    expect(wrapped).toBe(4);
  });

  it("removes an assignment with a DELETE, then leaves its own unassign marker", () => {
    const { calls, run } = spy();
    const line = executeAssignments(
      { kind: "unassign-eric", number: 7, criterion: 2, why: "issue closed" },
      { run },
    );
    expect(calls.map((a) => [a[2], a[3]])).toEqual([
      ["DELETE", "repos/{owner}/{repo}/issues/7/assignees"],
      ["POST", "repos/{owner}/{repo}/issues/7/comments"],
    ]);
    expect(calls[1]?.at(-1)).toContain(UNASSIGN_MARKER);
    expect(calls[1]?.at(-1)).toContain("issue closed");
    expect(line).toContain("issue closed");
  });

  it("writes through the issues REST route, which serves a PR number too (criterion 4)", () => {
    const { calls, run } = spy();
    executeAssignments(
      { kind: "assign-eric", number: 10, criterion: 4, why: "w", body: "merge it" },
      { run },
    );
    expect(calls.every((a) => a[0] === "api")).toBe(true);
    expect(calls.every((a) => !a.includes("issue"))).toBe(true);
  });
});

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
    }) as { kind: string; number?: number; issueNumber?: number }[];
    expect(intents.map((i) => i.kind)).toEqual(["close-shipped"]);
  });

  it("still asks when nothing in the tick touches that issue", () => {
    const intents = routeSweep({
      assignments: { issues: [needsEricIssue], prs: [], markers: new Set() },
      now: NOW,
    }) as { kind: string }[];
    expect(intents.map((i) => i.kind)).toEqual(["assign-eric"]);
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

// #6953 slice 3: two batches a day, at most OPEN_CAP open, ranked, and his reply read back.
describe("the batch rhythm", () => {
  const AFTER_8 = Date.parse("2026-11-07T14:05:00Z");
  const many = [9, 7, 1, 5, 3].map((number) => issue({ number }));
  const route = (assignments: Record<string, unknown>, now = AFTER_8) =>
    routeAssignments({
      assignments: { issues: many, prs: [], markers: new Set(), ...assignments },
      now,
    });

  it("starts a batch at 14:00Z and 21:30Z", () => {
    expect(new Date(batchStart(Date.parse("2026-11-07T14:05:00Z"))).toISOString()).toBe(
      "2026-11-07T14:00:00.000Z",
    );
    expect(new Date(batchStart(Date.parse("2026-11-07T21:31:00Z"))).toISOString()).toBe(
      "2026-11-07T21:30:00.000Z",
    );
    expect(new Date(batchStart(Date.parse("2026-11-07T03:00:00Z"))).toISOString()).toBe(
      "2026-11-06T21:30:00.000Z",
    );
  });

  it("sends nothing new once this window's batch has gone out", () => {
    expect(route({ lastAskAt: Date.parse("2026-11-07T14:01:00Z") })).toEqual([]);
    expect(route({ lastAskAt: Date.parse("2026-11-07T13:59:00Z") })).toHaveLength(ASSIGN_CAP);
  });

  it("still clears removals between batches", () => {
    const stale = issue({ number: 20, labels: [], assignees: [{ login: "ejclark" }] });
    const intents = route({ issues: [stale], markers: new Set([20]), lastAskAt: AFTER_8 });
    expect(intents.map((i) => i.kind)).toEqual(["unassign-eric"]);
  });

  it("never lets more than OPEN_CAP be open at once", () => {
    const held = [101, 102, 103, 104].map((number) =>
      issue({ number, assignees: [{ login: "ejclark" }] }),
    );
    const intents = route({ issues: [...held, ...many], markers: new Set([101, 102, 103, 104]) });
    expect(OPEN_CAP).toBe(5);
    expect(intents).toHaveLength(1);
  });

  it("ranks bot rules ahead of internal asks, then oldest first", () => {
    const internal = issue({ number: 1, title: "Raise the debt gates?" });
    const bots = issue({ number: 8, title: "Let the breaker re-arm?" });
    const intents = route({ issues: [internal, bots] });
    expect(intents.map((i) => i.number)).toEqual([8, 1]);
  });

  it("lets a stop go between batches and past the open cap", () => {
    const stop = issue({ number: 50, labels: [{ name: "needs-eric" }, { name: "fast-track" }] });
    const held = [101, 102, 103, 104, 105].map((number) =>
      issue({ number, assignees: [{ login: "ejclark" }] }),
    );
    const intents = route({
      issues: [stop, ...held, ...many],
      markers: new Set([101, 102, 103, 104, 105]),
      lastAskAt: AFTER_8,
    });
    expect(intents.map((i) => i.number)).toEqual([50]);
  });

  it("tells each card how many asks wait", () => {
    const [first] = route({});
    expect(first?.body).toContain("2 more asks next batch.");
  });
});

describe("lastAskedAt", () => {
  it("is the newest ask marker from a trusted comment", () => {
    const at = (iso: string, body: string, type = "Bot") => ({
      body,
      created_at: iso,
      user: { type },
      author_association: "NONE",
    });
    expect(
      lastAskedAt([
        at("2026-11-07T14:00:00Z", ASSIGN_MARKER),
        at("2026-11-07T21:30:00Z", "hello"),
        at("2026-11-08T01:00:00Z", ASSIGN_MARKER, "User"),
      ]),
    ).toBe(Date.parse("2026-11-07T14:00:00Z"));
  });
});

describe("his reply is read back in the same tick", () => {
  const thread = [
    {
      body: assignmentComment({ items: parseAsk(CALLOUT_WITH_OPTIONS) }),
      user: { type: "Bot", login: "skynet-envoy[bot]" },
      author_association: "NONE",
      created_at: "2026-11-07T00:00:00Z",
    },
    {
      id: 9,
      body: "A",
      user: { type: "User", login: "ejclark" },
      author_association: "OWNER",
      created_at: "2026-11-07T01:00:00Z",
    },
  ];
  const asked = issue({ number: 4, body: CALLOUT_WITH_OPTIONS, assignees: [{ login: "ejclark" }] });
  const open = (comments: unknown[]) =>
    gather({
      now: NOW,
      rest: (path: string) => {
        if (path.startsWith("issues?state=open&labels=needs-eric")) return [asked];
        if (path.includes("/comments")) return comments;
        return [];
      },
    });

  it("gathers the reply, routes a read-back ahead of any new ask, and scores it", () => {
    const deps = open(thread);
    expect(deps.replies).toHaveLength(1);
    const [intent] = routeAssignments({ assignments: deps, now: NOW });
    expect(intent).toMatchObject({ kind: "readback-eric", number: 4 });
    expect(intent?.body).toContain("Read as: A.");
    expect(intent?.body).toContain("match");
  });

  it("reads nothing when the reply is not an answer", () => {
    const chatty = [thread[0], { ...thread[1], body: "why is this asked?" }];
    expect(open(chatty).replies).toEqual([]);
  });
});

describe("askOnce carries a read-back out under the lease, once", () => {
  const intent = {
    kind: "readback-eric",
    number: 4,
    body: "Read as: A.",
    criterion: 1,
    why: "x",
  } as const;
  const run = (calls: string[]) => (_cmd: string, args: readonly string[]) => {
    calls.push(args.join(" "));
    return "";
  };
  const ask = {
    body: ASSIGN_MARKER,
    user: { type: "Bot" },
    author_association: "NONE",
    created_at: "2026-11-07T00:00:00Z",
  };

  it("clears the label, the assignment and answers", () => {
    const calls: string[] = [];
    const line = askOnce(intent, {
      run: run(calls),
      retry: <T>(fn: () => T) => fn(),
      rest: () => [ask],
      read: () => ({ body: "x" }),
    } as never);
    expect(line).toContain("read #4");
    expect(calls).toHaveLength(3);
  });

  it("does nothing when another sweep already cleared it", () => {
    const calls: string[] = [];
    const line = askOnce(intent, {
      run: run(calls),
      retry: <T>(fn: () => T) => fn(),
      rest: () => [],
      read: () => ({ body: "x" }),
    } as never);
    expect(line).toContain("already cleared");
    expect(calls).toEqual([]);
  });
});

describe("a read-back and a stale unassign never double up", () => {
  it("plans the read-back only, for an issue whose label a failed read-back already took off", () => {
    const reply = {
      number: 4,
      title: "t",
      ask: {},
      card: null,
      reply: {},
      answer: { kind: "yes" },
    };
    const stale = issue({ number: 4, labels: [], assignees: [{ login: "ejclark" }] });
    const { actions, holding } = plan({
      issues: [stale],
      prs: [],
      markers: new Set([4]),
      replies: [reply as never],
      now: NOW,
    });
    expect(actions.map((a) => a.kind)).toEqual(["readback"]);
    expect(holding).toBe(0);
  });
});
