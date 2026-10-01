import { describe, expect, it } from "@rstest/core";
import {
  intentOf,
  planPrInProgress,
  type RestIssue,
  type RestPr,
  syncPrInProgress,
} from "../../../scripts/moneypenny/pr-in-progress.mjs";

// #4393 slice 1, criteria 1 and 2 — one writer of `in-progress` for PR-backed work. Opening a PR
// that names an open issue marks it; closing the last PR that names it unmarks it. The claim lanes
// still pre-apply the label, so every step here must be a no-op on a label already in the right
// state. All IO is injected: no `gh`, no network.

const issue = (
  state: string,
  labels: string[] = [],
  extra: Partial<RestIssue> = {},
): RestIssue => ({
  state,
  labels: labels.map((name) => ({ name })),
  ...extra,
});

function harness({
  pr,
  issues,
  openPrs = [],
  leased = [],
}: {
  pr: RestPr;
  issues: Record<number, RestIssue>;
  openPrs?: RestPr[];
  leased?: number[];
}) {
  const writes: string[] = [];
  let listReads = 0;
  let leaseReads = 0;
  const deps = {
    readPr: () => pr,
    readIssueFn: (n: number) => issues[n] ?? issue("closed"),
    listOpenPrs: () => {
      listReads += 1;
      return openPrs;
    },
    isLeased: (n: number) => {
      leaseReads += 1;
      return leased.includes(n);
    },
    setLabel: (n: number, add: boolean) => {
      writes.push(`${add ? "+" : "-"}${n}`);
      return true;
    },
  };
  return { deps, writes, reads: () => ({ listReads, leaseReads }) };
}

describe("pr-in-progress: opening a PR marks the open issues it names", () => {
  it("adds the label to an open issue named by the PR", () => {
    const h = harness({
      pr: { number: 900, title: "feat(x): y", body: "Part of #4393", head: { ref: "feat/x" } },
      issues: { 4393: issue("open", ["plan"]) },
    });
    syncPrInProgress(900, "opened", h.deps);
    expect(h.writes).toEqual(["+4393"]);
  });

  it("writes nothing when a claim lane already applied it — idempotent with the claim", () => {
    const h = harness({
      pr: { number: 900, title: "x (#12)", body: "", head: { ref: "feat/12-x" } },
      issues: { 12: issue("open", ["in-progress"]) },
    });
    const { plan } = syncPrInProgress(900, "reopened", h.deps);
    expect(h.writes).toEqual([]);
    expect(plan[0]?.reason).toBe("already in-progress");
  });

  it("skips a closed issue and a number that is really a PR", () => {
    const h = harness({
      pr: { number: 900, title: "x (#5) (#6)", body: "", head: { ref: "fix/y" } },
      issues: { 5: issue("closed"), 6: issue("open", [], { pull_request: {} }) },
    });
    syncPrInProgress(900, "opened", h.deps);
    expect(h.writes).toEqual([]);
  });

  it("never reads the open-PR list or the leases to open — only a release needs them", () => {
    const h = harness({
      pr: { number: 900, title: "x (#12)", body: "", head: { ref: "a/b" } },
      issues: { 12: issue("open") },
    });
    syncPrInProgress(900, "opened", h.deps);
    expect(h.reads()).toEqual({ listReads: 0, leaseReads: 0 });
  });

  it("a PR that names nothing does nothing", () => {
    const h = harness({
      pr: { number: 901, title: "docs(research): pce", body: "", head: { ref: "research/pce" } },
      issues: {},
    });
    expect(syncPrInProgress(901, "opened", h.deps).named).toEqual([]);
    expect(h.writes).toEqual([]);
  });
});

describe("pr-in-progress: closing a PR unmarks the issue only when nothing else is building it", () => {
  const pr = { number: 900, title: "feat(x): y", body: "Closes #12", head: { ref: "feat/x" } };

  it("removes the label when this was the last open PR naming the issue", () => {
    const h = harness({ pr, issues: { 12: issue("open", ["in-progress"]) } });
    syncPrInProgress(900, "closed", h.deps);
    expect(h.writes).toEqual(["-12"]);
  });

  it("keeps it while another open PR still names the issue", () => {
    const h = harness({
      pr,
      issues: { 12: issue("open", ["in-progress"]) },
      openPrs: [pr, { number: 901, title: "feat(x): slice 2", body: "Part of #12", head: {} }],
    });
    const { plan } = syncPrInProgress(900, "closed", h.deps);
    expect(h.writes).toEqual([]);
    expect(plan[0]?.reason).toBe("another open PR still names it");
  });

  it("does not count the closing PR itself, even if the list still returns it", () => {
    const h = harness({ pr, issues: { 12: issue("open", ["in-progress"]) }, openPrs: [pr] });
    syncPrInProgress(900, "closed", h.deps);
    expect(h.writes).toEqual(["-12"]);
  });

  it("keeps it while a live claim lease holds the issue — the lane's release path owns it", () => {
    const h = harness({ pr, issues: { 12: issue("open", ["in-progress"]) }, leased: [12] });
    const { plan } = syncPrInProgress(900, "closed", h.deps);
    expect(h.writes).toEqual([]);
    expect(plan[0]?.reason).toBe("a live claim lease still holds it");
  });

  it("does nothing to an issue that carries no label, and reads nothing extra for it", () => {
    const h = harness({ pr, issues: { 12: issue("open") } });
    syncPrInProgress(900, "closed", h.deps);
    expect(h.writes).toEqual([]);
    expect(h.reads()).toEqual({ listReads: 0, leaseReads: 0 });
  });

  it("leaves a closed issue alone — the board already reads it as Done", () => {
    const h = harness({ pr, issues: { 12: issue("closed", ["in-progress"]) } });
    syncPrInProgress(900, "closed", h.deps);
    expect(h.writes).toEqual([]);
  });
});

describe("pr-in-progress: events", () => {
  it.each([
    ["opened", "apply"],
    ["reopened", "apply"],
    ["edited", "apply"],
    ["ready_for_review", "apply"],
    ["closed", "release"],
    ["synchronize", null],
    ["labeled", null],
  ])("%s → %s", (event, want) => {
    expect(intentOf(event)).toBe(want);
  });

  it("an event that neither opens nor ends a build writes nothing", () => {
    expect(
      planPrInProgress({
        event: "labeled",
        facts: [{ number: 1, isOpenIssue: true, hasLabel: false }],
      }),
    ).toEqual([
      { number: 1, action: "none", reason: 'event "labeled" neither opens nor ends a build' },
    ]);
  });
});
