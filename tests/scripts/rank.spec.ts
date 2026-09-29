import { describe, expect, it } from "@rstest/core";
import { classOf, rankOrder, rankRow, renderRank } from "../../scripts/rank.mjs";

// #4064's ordering rule: a coarse class with a one-line why, then oldest-ready-first inside a
// class, with an item past one delivery unit ranked below the ready units in its class. The
// fixtures are shaped on the first live run (#4060 unblocking three sub-issues, #3407 at ~22 PRs).
const H = 3600e3;
const now = Date.parse("2026-09-29T18:00:00Z");
const issue = (number: number, labels: string[], body = "| **Size** | ~2 PRs |") => ({
  number,
  title: `Build ${number}`,
  body,
  labels: labels.map((name) => ({ name })),
});

describe("rank: the class", () => {
  it("lets a hand-set P0–P3 label win over every signal, highest first", () => {
    expect(classOf({ labels: ["bottleneck", "P3"], blocks: [7] })).toEqual({
      cls: "P3",
      why: "set by hand",
      hand: true,
    });
    expect(classOf({ labels: ["P2", "P1"] }).cls).toBe("P1");
  });

  it("puts work that unblocks open issues, then measured constraints, at P0", () => {
    expect(classOf({ blocks: [4061, 4062] }).why).toBe("unblocks #4061, #4062");
    expect(classOf({ labels: ["bottleneck"] }).cls).toBe("P0");
  });

  it("puts broken things and member asks at P1, ideas and Later at P3, the rest at P2", () => {
    expect(classOf({ labels: ["bug"] }).cls).toBe("P1");
    expect(classOf({ labels: ["feedback", "member-d7037b4107"] }).cls).toBe("P1");
    expect(classOf({ labels: ["idea"] }).cls).toBe("P3");
    expect(classOf({ labels: ["plan"], horizon: "Later" }).cls).toBe("P3");
    expect(classOf({ labels: ["plan"] })).toEqual({
      cls: "P2",
      why: "improves a surface or a process",
    });
  });
});

describe("rank: what counts as a buildable backlog item", () => {
  it("skips anything parked, outside the queue, or a CI capsule", () => {
    expect(rankRow(issue(1, ["plan", "ready", "needs-eric"]), { now })).toBeNull();
    expect(rankRow(issue(2, ["enhancement"]), { now })).toBeNull();
    expect(rankRow(issue(3, ["bug", "ci-failure"]), { now })).toBeNull();
  });

  it("ranks the open sub-issues instead of their parent", () => {
    const parent = {
      ...issue(3955, ["plan", "ready"]),
      sub_issues_summary: { total: 5, completed: 1 },
    };
    expect(rankRow(parent, { now })).toBeNull();
    const drained = { ...parent, sub_issues_summary: { total: 5, completed: 5 } };
    expect(rankRow(drained, { now })?.number).toBe(3955);
  });

  it("marks split-first, a pending remainder, and hours since ready", () => {
    const row = rankRow(issue(3407, ["plan", "ready", "next-slice"], "| **Size** | ~22 PRs |"), {
      readyAt: now - 50 * H,
      now,
    });
    expect(row).toMatchObject({ splitFirst: true, remainder: true, readyHours: 50, ready: true });
  });
});

describe("rank: the order", () => {
  const row = (number: number, labels: string[], readyAt: number | null, body?: string) =>
    rankRow(issue(number, labels, body), { readyAt, now });

  it("orders by class, then ready units, then split-first, then oldest-ready", () => {
    const rows = [
      row(10, ["plan"], null),
      row(11, ["plan", "ready"], now - 5 * H),
      row(12, ["plan", "ready"], now - 50 * H),
      row(13, ["plan", "ready"], now - 99 * H, "| **Size** | ~9 PRs |"),
      row(14, ["bottleneck"], null),
    ].filter((r) => r !== null);
    expect(rankOrder(rows).map((r) => r.number)).toEqual([14, 12, 11, 13, 10]);
  });

  it("renders a count line and one row per item, read-only", () => {
    const table = renderRank([row(12, ["plan", "ready"], now - 50 * H)].filter((r) => r !== null));
    expect(table).toContain("**1 buildable items · P0 0 · P1 0 · P2 1 · P3 0**");
    expect(table).toContain("| 1 | P2 | #12 Build 12 | improves a surface or a process | 2d |  |");
  });
});
