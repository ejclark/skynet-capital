import { describe, expect, it } from "@rstest/core";
import {
  ASSIGN_MARKER,
  assignmentComment,
  decisionLine,
  plan,
  report,
} from "../../../scripts/moneypenny/assignments.mjs";

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
