import { describe, expect, it } from "@rstest/core";
import { priorityValues, STATUS_OPTIONS } from "../../../scripts/moneypenny/projects.mjs";
import {
  PRIORITY_WRITES_PER_SWEEP,
  planPriority,
  planPriorityDrift,
  wantedPriorityOf,
} from "../../../scripts/moneypenny/projects-priority.mjs";
import { mergeDrift, reconcileBoard } from "../../../scripts/moneypenny/projects-reconcile.mjs";
import {
  createBoardContext,
  readIssueItemsFromGh,
  syncPriority,
} from "../../../scripts/moneypenny/projects-sync.mjs";

// #6871 slice B1 — the board's Priority field, both ways. Labels stay the source (#4064): the sync
// copies a hand P label, or rank's derived class, into the field; a human drag between priority
// lanes (Eric, 2026-11-04: "Drag sets priority") flows back as that lane's P label. A hidden
// "Synced priority" record of each sync write is what tells the two apart — and the criterion this
// file guards hardest is the third: IF a sync write failed, THEN the sweep SHALL NOT read the
// mismatch as a drag.

const labels = (...names: string[]) => names.map((name) => ({ name }));
const issue = (number: number, names: string[] = [], extra: Record<string, unknown> = {}) => ({
  number,
  state: "open",
  labels: labels(...names),
  ...extra,
});

describe("wantedPriorityOf: the same answer `npm run rank` prints", () => {
  it("a hand-set P label wins over every derived class", () => {
    expect(wantedPriorityOf(issue(1, ["bug", "P3"]))).toBe("P3");
  });

  it("derives the class when no P label is set", () => {
    expect(wantedPriorityOf(issue(1, ["bug"]))).toBe("P0");
    expect(wantedPriorityOf(issue(1, ["member-ask"]))).toBe("P1");
    expect(wantedPriorityOf(issue(1, ["plan"]))).toBe("P2");
    expect(wantedPriorityOf(issue(1, ["idea"]))).toBe("P3");
  });

  it("reads blocking from the REST issue's dependency summary — no per-issue read", () => {
    const blocker = issue(1, ["plan"], { issue_dependencies_summary: { blocking: 2 } });
    expect(wantedPriorityOf(blocker)).toBe("P0");
  });

  it("reads Later from the hand Horizon triage, as rank does", () => {
    expect(wantedPriorityOf(issue(7, ["plan"]), { horizons: { "7": "Later" } })).toBe("P3");
  });
});

describe("planPriority: a drag, a label change, a failed sync, a field never set", () => {
  it("a drag: Priority moved off the record → that lane's label, the old one removed", () => {
    const plan = planPriority({
      current: "P0",
      synced: "P2",
      wanted: "P2",
      labels: labels("plan", "P2"),
    });
    expect(plan).toEqual({ action: "drag", lane: "P0", from: "P2", add: ["P0"], remove: ["P2"] });
  });

  it("a drag onto a derived card adds the label and removes nothing", () => {
    const plan = planPriority({ current: "P1", synced: "P2", wanted: "P2", labels: ["plan"] });
    expect(plan).toMatchObject({ action: "drag", add: ["P1"], remove: [] });
  });

  it("a label change: card and record agree, the labels moved → write the new value", () => {
    const plan = planPriority({ current: "P2", synced: "P2", wanted: "P0" });
    expect(plan).toEqual({ action: "write", value: "P0", from: "P2" });
  });

  it("a failed sync: Priority written, record not — read as a lagging record, never a drag", () => {
    // The sync writes Priority first, record second. Its second write died: card says P0 (what the
    // labels say), record still says P2. That is the sync's own half-write.
    const plan = planPriority({ current: "P0", synced: "P2", wanted: "P0", labels: ["bug"] });
    expect(plan).toEqual({ action: "record", value: "P0" });
  });

  it("a sync whose FIRST write failed changed nothing, so the next one simply writes", () => {
    expect(planPriority({ current: "P2", synced: "P2", wanted: "P0" }).action).toBe("write");
  });

  it("a field never set: no Priority, no record → write, not a drag", () => {
    expect(planPriority({ current: null, synced: null, wanted: "P2" })).toEqual({
      action: "write",
      value: "P2",
      from: null,
    });
  });

  it("a value with no record predates the sync — it is overwritten, not read as a drag", () => {
    expect(planPriority({ current: "P1", synced: null, wanted: "P2" })).toMatchObject({
      action: "write",
      value: "P2",
      from: "P1",
    });
  });

  it("a first sync whose record write failed only needs the record", () => {
    expect(planPriority({ current: "P2", synced: null, wanted: "P2" })).toEqual({
      action: "record",
      value: "P2",
    });
  });

  it("everything in step → nothing to do", () => {
    expect(planPriority({ current: "P2", synced: "P2", wanted: "P2" })).toEqual({ action: "none" });
  });

  it("a lane outside P0–P3 is someone's hand-made lane, left alone", () => {
    expect(planPriority({ current: "Someday", synced: "P2", wanted: "P2" }).action).toBe("foreign");
  });
});

/** A recording `io` for `syncPriority`; `fresh` is what a re-read of the card returns. */
function recorder(fresh?: { priority?: string; syncedPriority?: string }) {
  const calls: string[] = [];
  return {
    calls,
    io: {
      readFresh: () => {
        calls.push("readFresh");
        return fresh ? { id: "PVTI_1", ...fresh } : undefined;
      },
      setPriority: (v: string) => calls.push(`priority=${v}`),
      setRecord: (v: string) => calls.push(`record=${v}`),
      addLabel: (v: string) => calls.push(`+${v}`),
      removeLabel: (v: string) => calls.push(`-${v}`),
    },
  };
}

describe("syncPriority: the order of writes is what makes a failure safe", () => {
  it("writes Priority before its record", () => {
    const { calls, io } = recorder();
    syncPriority({ issue: issue(1, ["bug"]), item: { id: "PVTI_1" }, fresh: true, io });
    expect(calls).toEqual(["priority=P0", "record=P0"]);
  });

  it("a drag: old label off, new label on, record last, Priority untouched", () => {
    const { calls, io } = recorder();
    const plan = syncPriority({
      issue: issue(1, ["plan", "P2"]),
      item: { id: "PVTI_1", priority: "P0", syncedPriority: "P2" },
      fresh: true,
      io,
    });
    expect(plan.action).toBe("drag");
    expect(calls).toEqual(["-P2", "+P0", "record=P0"]);
  });

  it("a record write that throws leaves the card as the failed-sync case, which heals", () => {
    const { io } = recorder();
    const card = { id: "PVTI_1", priority: "P2", syncedPriority: "P2" };
    expect(() =>
      syncPriority({
        issue: issue(1, ["bug"]),
        item: card,
        fresh: true,
        io: {
          ...io,
          setPriority: (v: string) => {
            card.priority = v;
          },
          setRecord: () => {
            throw new Error("GraphQL: Something went wrong");
          },
        },
      }),
    ).toThrow(/went wrong/);
    // Next sync, labels unchanged: the card now says P0, the record P2.
    const next = recorder();
    const plan = syncPriority({ issue: issue(1, ["bug"]), item: card, fresh: true, io: next.io });
    expect(plan).toEqual({ action: "record", value: "P0" });
    expect(next.calls).toEqual(["record=P0"]);
  });

  it("held (sweep) values are re-read before acting — a drag made since is not overwritten", () => {
    // The sweep read the card empty at its start; Eric has since dragged it to P1.
    const { calls, io } = recorder({ priority: "P1" });
    const plan = syncPriority({ issue: issue(1, ["plan"]), item: { id: "PVTI_1" }, io });
    expect(calls[0]).toBe("readFresh");
    // No record yet, so it is not read as a drag — but the stale "write P2 over nothing" is
    // re-planned against what the card holds now.
    expect(plan).toMatchObject({ action: "write", from: "P1" });
  });

  it("a fresh card (just added) is not re-read", () => {
    const { calls, io } = recorder();
    syncPriority({ issue: issue(1, ["plan"]), item: { id: "PVTI_1" }, fresh: true, io });
    expect(calls).not.toContain("readFresh");
  });

  it("an in-step card costs nothing — no re-read, no write", () => {
    const { calls, io } = recorder();
    const item = { id: "PVTI_1", priority: "P2", syncedPriority: "P2" };
    expect(syncPriority({ issue: issue(1, ["plan"]), item, io }).action).toBe("none");
    expect(calls).toEqual([]);
  });

  it("skips a closed issue, and a board that has no record field yet", () => {
    const { calls, io } = recorder();
    const item = { id: "PVTI_1" };
    expect(syncPriority({ issue: { ...issue(1), state: "closed" }, item, io })).toMatchObject({
      action: "skipped",
    });
    expect(syncPriority({ issue: issue(1), item, ready: false, io })).toMatchObject({
      action: "skipped",
      reason: expect.stringMatching(/Synced priority/),
    });
    expect(calls).toEqual([]);
  });
});

describe("planPriorityDrift: which cards the sweep touches", () => {
  const URL = (n: number) => `https://github.com/ejclark/skynet-capital/issues/${n}`;
  const numberOf = (item: { content?: { url?: string } }) =>
    Number(/(\d+)$/.exec(item.content?.url ?? "")?.[1]) || null;
  const card = (n: number, priority?: string, syncedPriority?: string) => ({
    id: `PVTI_${n}`,
    content: { url: URL(n) },
    ...(priority ? { priority } : {}),
    ...(syncedPriority ? { syncedPriority } : {}),
  });

  it("drags first, then writes; closed and in-step cards are skipped", () => {
    const { drift } = planPriorityDrift({
      items: [card(1), card(2, "P2", "P2"), card(3, "P0", "P2"), card(4)],
      openIssues: [issue(1, ["plan"]), issue(2, ["plan"]), issue(3, ["plan"])],
      numberOf,
    });
    expect(drift.map((d) => [d.number, d.plan.action])).toEqual([
      [3, "drag"],
      [1, "write"],
    ]);
  });

  it("skips a card whose issue the sync would skip (a ci-failure tracker)", () => {
    const { drift } = planPriorityDrift({
      items: [card(1)],
      openIssues: [issue(1, ["ci-failure"])],
      numberOf,
    });
    expect(drift).toEqual([]);
  });

  it("caps the writes per sweep and says how many wait — drags are never capped", () => {
    const items = [card(1), card(2), card(3), card(9, "P0", "P2")];
    const openIssues = [1, 2, 3, 9].map((n) => issue(n, ["plan"]));
    const { drift, deferred } = planPriorityDrift({ items, openIssues, numberOf, cap: 1 });
    expect(drift.map((d) => d.number)).toEqual([9, 1]);
    expect(deferred).toBe(2);
    expect(PRIORITY_WRITES_PER_SWEEP).toBeGreaterThan(0);
  });
});

describe("mergeDrift: one sync per issue, whatever drifted", () => {
  it("joins a card wrong on both counts into one entry", () => {
    const plan = { action: "write" as const, value: "P0", from: null };
    expect(
      mergeDrift(
        [{ number: 5, have: "Backlog", want: "Ready" }],
        [
          { number: 5, plan },
          { number: 2, plan },
        ],
      ),
    ).toEqual([
      { number: 2, priority: plan },
      { number: 5, have: "Backlog", want: "Ready", priority: plan },
    ]);
  });
});

describe("the board reads carry Priority and its record", () => {
  it("priorityValues keeps only what GitHub set", () => {
    expect(priorityValues({ priority: { name: "P1" }, synced: { text: "P1" } })).toEqual({
      priority: "P1",
      syncedPriority: "P1",
    });
    expect(priorityValues({ priority: null, synced: null })).toEqual({});
  });

  it("the per-issue lookup asks for both fields and returns them on the item", () => {
    let query = "";
    const items = readIssueItemsFromGh(
      { number: 9, html_url: "https://github.com/ejclark/skynet-capital/issues/9" },
      {
        gh: (argv: string[]) => {
          query = argv.join(" ");
          return JSON.stringify({
            data: {
              projectOwner: { projectV2: { id: "PVT_1" } },
              repository: {
                issue: {
                  projectItems: {
                    nodes: [
                      {
                        id: "PVTI_9",
                        project: { number: 2 },
                        priority: { name: "P0" },
                        synced: { text: "P2" },
                      },
                    ],
                  },
                },
              },
            },
          });
        },
      },
    );
    expect(query).toContain('fieldValueByName(name:"Priority")');
    expect(query).toContain('fieldValueByName(name:"Synced priority")');
    expect(items[0]).toMatchObject({ id: "PVTI_9", priority: "P0", syncedPriority: "P2" });
  });
});

describe("reconcileBoard: a drag is carried back before anything overwrites", () => {
  const URL = (n: number) => `https://github.com/ejclark/skynet-capital/issues/${n}`;
  const board = (items: Record<string, unknown>[]) =>
    createBoardContext({
      readItems: () => ({ items: items as never, totalCount: items.length }),
      readFields: () => [{ id: "F_status", name: "Status", options: [] }],
      readProject: () => ({ id: "PVT_1", number: 2 }),
    });

  it("syncs a dragged card even when its Status is right, and logs the drag", () => {
    const synced: number[] = [];
    const lines: string[] = [];
    const result = reconcileBoard({
      board: board([
        {
          id: "PVTI_3",
          status: "Backlog",
          priority: "P0",
          syncedPriority: "P2",
          content: { type: "Issue", url: URL(3) },
        },
        {
          id: "PVTI_4",
          status: "Backlog",
          priority: "P2",
          syncedPriority: "P2",
          content: { type: "Issue", url: URL(4) },
        },
      ]),
      readOpenIssues: () => [issue(3, ["plan"]), issue(4, ["plan"])],
      rateLimit: () => ({ remaining: 5000 }),
      ensureColumns: () => STATUS_OPTIONS,
      readMode: () => ({ position: "normal", caps: { inFlightCap: 3, startedPlanCap: 4 } }),
      buildContext: () => ({}),
      horizons: {},
      sync: (n) => {
        synced.push(n);
        return {
          status: "Backlog",
          priority: { action: "drag", lane: "P0", from: "P2", add: ["P0"], remove: [] },
        };
      },
      log: (l) => lines.push(l),
    });
    expect(synced).toEqual([3]);
    expect(result.drift).toEqual([
      {
        number: 3,
        priority: { action: "drag", lane: "P0", from: "P2", add: ["P0"], remove: [] },
      },
    ]);
    expect(lines.join("\n")).toMatch(/1 priority drag\(s\)/);
    expect(lines.join("\n")).toMatch(/#3: Status "Backlog"; dragged P2 → P0 — label P0/);
  });

  it("a dry run names the drag and the writes without syncing", () => {
    const lines: string[] = [];
    let calls = 0;
    reconcileBoard({
      board: board([
        { id: "PVTI_1", status: "Backlog", content: { type: "Issue", url: URL(1) } },
        {
          id: "PVTI_3",
          status: "Backlog",
          priority: "P1",
          syncedPriority: "P3",
          content: { type: "Issue", url: URL(3) },
        },
      ]),
      readOpenIssues: () => [issue(1, ["bug"]), issue(3, ["idea", "P3"])],
      rateLimit: () => ({ remaining: 5000 }),
      ensureColumns: () => STATUS_OPTIONS,
      readMode: () => ({ position: "normal", caps: { inFlightCap: 3, startedPlanCap: 4 } }),
      buildContext: () => ({}),
      horizons: {},
      dryRun: true,
      sync: () => {
        calls += 1;
        return {};
      },
      log: (l) => lines.push(l),
    });
    expect(calls).toBe(0);
    expect(lines).toContain("#1: Priority (none) → P0");
    expect(lines).toContain("#3: dragged P3 → P1 — label P1, removing P3");
  });
});
