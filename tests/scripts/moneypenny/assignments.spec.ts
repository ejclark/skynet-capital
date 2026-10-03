import { describe, expect, it } from "@rstest/core";
import {
  ASSIGN_CAP,
  ASSIGN_MARKER,
  assignmentComment,
  decisionLine,
  executeAssignments,
  plan,
  report,
  routeAssignments,
} from "../../../scripts/moneypenny/assignments.mjs";
import { routeSweep } from "../../../scripts/moneypenny/events.mjs";

// #4289 (#3818 slice 5): `needs-eric` means one thing — a decision only Eric can make. The dry run
// lists every such issue with the decision it waits on and says what it WOULD assign; it writes
// nothing (live assignment is a separate step after Eric reads a dry run).
const NOW = Date.parse("2026-09-30T12:00:00Z");
const CALLOUT =
  "**Ask.**\n\n> [!IMPORTANT]\n> **Needs from you**\n> 1. Pick A or B? — why\n> 2. second";
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
    expect(intent.body).toContain("> Pick A or B? — why");
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
    expect(wrapped).toBe(3);
  });

  it("removes an assignment with one DELETE and no comment", () => {
    const { calls, run } = spy();
    const line = executeAssignments(
      { kind: "unassign-eric", number: 7, criterion: 2, why: "issue closed" },
      { run },
    );
    expect(calls).toHaveLength(1);
    expect((calls[0] ?? []).slice(2, 4)).toEqual([
      "DELETE",
      "repos/{owner}/{repo}/issues/7/assignees",
    ]);
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
