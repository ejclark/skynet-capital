import { describe, expect, it } from "@rstest/core";
import {
  classOf,
  digestLine,
  parseSnapshot,
  rankDelta,
  rankOrder,
  rankRow,
  renderRank,
  snapshotMarker,
} from "../../scripts/rank.mjs";

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
    expect(classOf({ labels: ["bug", "P2"] })).toEqual({
      cls: "P2",
      why: "set by hand",
      hand: true,
    });
  });

  // #6871 §4 (Eric's tap on PR-A): fast-track is the only derived P0 — "fix first".
  it("puts fast-track at P0 and nothing else: a bug, a blocker and a constraint are P1", () => {
    expect(classOf({ labels: ["fast-track", "bug"] })).toEqual({
      cls: "P0",
      why: "fix first — pulled before all other work",
    });
    expect(classOf({ labels: ["bug"] })).toEqual({ cls: "P1", why: "something is broken" });
    expect(classOf({ blocks: [4061, 4062] })).toEqual({
      cls: "P1",
      why: "unblocks #4061, #4062",
    });
    expect(classOf({ labels: ["bottleneck"] }).cls).toBe("P1");
  });

  it("lets a hand-set P label hold a fast-track card in a lower lane", () => {
    expect(classOf({ labels: ["fast-track", "P3"] }).cls).toBe("P3");
  });

  it("puts member asks at P1, ideas at P3, the rest at P2, and ignores the board's Horizon", () => {
    expect(classOf({ labels: ["feedback", "member-d7037b4107"] }).cls).toBe("P1");
    expect(classOf({ labels: ["idea"] }).cls).toBe("P3");
    expect(classOf({ labels: ["plan"], horizon: "Later" } as never).cls).toBe("P2");
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

  // The Kind order inside a lane (#6871 §4): a bug still pulls ahead of a blocker and a constraint,
  // as Eric's 2026-09-30 call has it; ready-before-not-ready only breaks ties inside one Kind.
  it("orders a lane by Kind: bug, then blocks other work, then slows delivery", () => {
    const rows = [
      row(20, ["bottleneck", "ready"], now - 90 * H),
      rankRow(issue(21, ["plan", "ready"]), { readyAt: now - 80 * H, blocks: [4], now }),
      row(22, ["bug"], null),
      row(23, ["bug", "ready"], now - 1 * H),
    ].filter((r) => r !== null);
    expect(rankOrder(rows).map((r) => r.number)).toEqual([23, 22, 21, 20]);
    expect(rankOrder(rows).map((r) => r.kind)).toEqual([
      "Bug",
      "Bug",
      "Blocks other work",
      "Slows delivery",
    ]);
  });

  it("puts fast-track alone in P0, ahead of every P1 bug", () => {
    const rows = [
      row(30, ["bug", "ready"], now - 90 * H),
      row(31, ["plan", "ready", "fast-track"], now),
    ];
    expect(rankOrder(rows.filter((r) => r !== null)).map((r) => r.number)).toEqual([31, 30]);
  });

  it("renders a count line and one row per item, read-only", () => {
    const table = renderRank([row(12, ["plan", "ready"], now - 50 * H)].filter((r) => r !== null));
    expect(table).toContain("**1 buildable items · P0 0 · P1 0 · P2 1 · P3 0**");
    expect(table).toContain("| 1 | P2 | #12 Build 12 | improves a surface or a process | 2d |  |");
  });
});

// Slice 3: the rank is derived live, so a merge re-ranks it by the next read; what the digest owes
// Eric is the movement since the last digest, in one line.
describe("rank: the digest delta", () => {
  it("round-trips the snapshot a digest embeds, and reads none from an older digest", () => {
    const text = `## Noise absorbed\n- line\n${snapshotMarker([4060, 2485, 3621])}\n`;
    expect(parseSnapshot(text)).toEqual([4060, 2485, 3621]);
    expect(parseSnapshot("## Noise absorbed\n- no marker")).toBeNull();
    expect(parseSnapshot(snapshotMarker([]))).toEqual([]);
  });

  it("does not count a retirement shifting the tail up a row as a move", () => {
    expect(rankDelta([1, 2, 3, 4], [2, 3, 4])).toEqual({ movedUp: [], retired: [1], added: [] });
  });

  it("counts an item that overtook one still ranked, and names what is new", () => {
    // 4 was labelled bug and jumped the queue; 9 was filed since.
    expect(rankDelta([1, 2, 3, 4], [4, 1, 2, 9, 3])).toEqual({
      movedUp: [4],
      retired: [],
      added: [9],
    });
  });

  it("writes one line, or says a baseline was set when the last digest carried no snapshot", () => {
    expect(digestLine([1, 2, 3, 4], [4, 2, 3], "2026-09-30")).toBe(
      "Rank since 2026-09-30: 1 moved up (#4) · 1 retired (#1) · 0 new.",
    );
    expect(digestLine(null, [1, 2], "2026-09-30")).toBe(
      "Rank: 2 items — baseline set; the next digest reports movement.",
    );
  });
});
