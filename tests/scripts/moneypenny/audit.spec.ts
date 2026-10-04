import {
  audit,
  CONFLICT_REPAIR_CAP,
  readyPlanCandidate,
  staleInProgressFrom,
} from "../../../scripts/moneypenny/audit.mjs";

// The plan-stall check (#897, closing #877's deferred slice 3) — a ready-flip comment on a
// `plan`-labeled issue that never got claimed or built looks IDENTICAL to "nothing needed" from
// Eric's side. `readyPlanCandidate` is the pure per-issue decision (mirrors `isReadySignal`'s own
// fixture-drivable shape: no network, no clock beyond an injected `nowMs`); `audit()` applies the
// 48h threshold and the one-ping-per-stall memory on top, same split as the other two audit lanes.

const NOW = Date.parse("2026-08-29T12:00:00Z");

const planIssue = (overrides: Record<string, unknown> = {}) => ({
  number: 466,
  title: "[plan] some plan",
  state: "open",
  labels: [{ name: "enhancement" }, { name: "plan" }],
  closedByPullRequests: [],
  ...overrides,
});

const readyComment = (hoursAgo: number, body = "ready") => ({
  body,
  createdAt: new Date(NOW - hoursAgo * 3_600_000).toISOString(),
});

describe("readyPlanCandidate — the pure per-issue stall decision", () => {
  it("is a candidate when a ready comment landed on an open plan issue with no claim", () => {
    const candidate = readyPlanCandidate(planIssue(), [readyComment(50)], false, NOW);
    expect(candidate).toEqual({ title: "[plan] some plan", number: 466, hoursSinceReady: 50 });
  });

  it("uses the FIRST ready comment in comment order (gh lists comments oldest-first)", () => {
    const comments = [readyComment(72), readyComment(10)];
    expect(readyPlanCandidate(planIssue(), comments, false, NOW)?.hoursSinceReady).toBe(72);
  });

  it("is null without the plan label", () => {
    const issue = planIssue({ labels: [{ name: "enhancement" }] });
    expect(readyPlanCandidate(issue, [readyComment(50)], false, NOW)).toBeNull();
  });

  it("is null when a claim is currently held", () => {
    expect(readyPlanCandidate(planIssue(), [readyComment(50)], true, NOW)).toBeNull();
  });

  it("is null on a closed issue — closing is an answer", () => {
    const issue = planIssue({ state: "closed" });
    expect(readyPlanCandidate(issue, [readyComment(50)], false, NOW)).toBeNull();
  });

  it("is null when a PR already links the issue — a build did happen", () => {
    const issue = planIssue({ closedByPullRequests: [{ number: 900 }] });
    expect(readyPlanCandidate(issue, [readyComment(50)], false, NOW)).toBeNull();
  });

  it("is null with no comments at all", () => {
    expect(readyPlanCandidate(planIssue(), [], false, NOW)).toBeNull();
  });

  it("is null when no comment reads as a ready-flip", () => {
    const comments = [readyComment(50, "can you clarify the second bullet?")];
    expect(readyPlanCandidate(planIssue(), comments, false, NOW)).toBeNull();
  });
});

describe("audit() — the plan-stall threshold and memory", () => {
  it("flags a ready-but-unclaimed plan issue past 48h", () => {
    const intents = audit({
      readyPlans: [{ title: "[plan] a plan", number: 466, hoursSinceReady: 50 }],
    });
    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("flag-plan-stall");
    expect(intents[0]?.issueNumber).toBe(466);
    expect(intents[0]?.hoursSinceReady).toBe(50);
    expect(intents[0]?.body).toContain("claim/plan-466");
  });

  it("is silent inside the 48h threshold — the trigger may just still be running", () => {
    const intents = audit({
      readyPlans: [{ title: "[plan] fresh", number: 467, hoursSinceReady: 3 }],
    });
    expect(intents).toHaveLength(0);
  });

  it("respects a custom planStallAfterHours threshold", () => {
    const deps = { readyPlans: [{ title: "[plan] x", number: 468, hoursSinceReady: 10 }] };
    expect(audit(deps)).toHaveLength(0);
    expect(audit({ ...deps, planStallAfterHours: 6 })).toHaveLength(1);
  });

  it("never re-flags a plan issue already carrying the stall-flagged label", () => {
    const intents = audit({
      readyPlans: [{ title: "[plan] already pinged", number: 469, hoursSinceReady: 96 }],
      alreadyFlagged: [469],
    });
    expect(intents).toHaveLength(0);
  });

  // #1403 — a repaired PR that goes CONFLICTING again (main moves every ~7min here) used to sit
  // stuck forever: `conflict-flagged` was a lifetime memory, keyed on PR number alone. The dedupe
  // key is now (PR, head sha), read back from the `<!-- moneypenny:conflict … -->` marker the last
  // flag comment embedded.
  it("re-dispatches a conflicted PR whose head moved since its last flag — repaired, then re-dirtied", () => {
    const intents = audit({
      conflictedPRs: [{ title: "feat: x", number: 1284, headRefOid: "newsha2" }],
      alreadyFlaggedPRs: [{ number: 1284, sha: "oldsha1", attempt: 1 }],
    });
    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("flag-conflict");
    expect(intents[0]?.prNumber).toBe(1284);
    expect(intents[0]?.attempt).toBe(2);
    expect(intents[0]?.body).toContain("<!-- moneypenny:conflict sha=newsha2 attempt=2 -->");
  });

  it("does not re-flag a conflicted PR whose head has not moved since its last flag — same conflict, not a new one", () => {
    // Also covers the #1286 shape: a repair session that fails to push leaves the head unchanged,
    // so this must not turn a transient dispatch failure into a comment storm.
    const intents = audit({
      conflictedPRs: [{ title: "feat: x", number: 1286, headRefOid: "samesha" }],
      alreadyFlaggedPRs: [{ number: 1286, sha: "samesha", attempt: 1 }],
    });
    expect(intents).toHaveLength(0);
  });

  it("never re-flags when the last flag's head is unreadable (a pre-rollout comment) — unknown, not a green light", () => {
    const intents = audit({
      conflictedPRs: [{ title: "feat: x", number: 881, headRefOid: "newsha" }],
      alreadyFlaggedPRs: [{ number: 881, sha: null, attempt: 1 }],
    });
    expect(intents).toHaveLength(0);
  });

  it(`stops dispatching and escalates to needs-eric once the repair cap (${CONFLICT_REPAIR_CAP}) is spent`, () => {
    const intents = audit({
      conflictedPRs: [{ title: "feat: x", number: 1373, headRefOid: "sha-n" }],
      alreadyFlaggedPRs: [{ number: 1373, sha: "sha-n-minus-1", attempt: CONFLICT_REPAIR_CAP }],
    });
    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("flag-conflict-cap");
    expect(intents[0]?.prNumber).toBe(1373);
    expect(intents[0]?.body).toContain("needs-eric");
  });

  it("still flags a brand-new conflict once, exactly as before", () => {
    const intents = audit({
      conflictedPRs: [{ title: "feat: y", number: 1400, headRefOid: "sha-a" }],
    });
    expect(intents).toHaveLength(1);
    expect(intents[0]?.kind).toBe("flag-conflict");
    expect(intents[0]?.attempt).toBe(1);
  });

  it("runs alongside the other two audit lanes without cross-talk", () => {
    const intents = audit({
      unclaimedIssues: [{ title: "[event-research] x", number: 1, quietDays: 4 }],
      silentFeedback: [{ title: "some feedback", number: 2, hoursSinceFiled: 10 }],
      readyPlans: [{ title: "[plan] y", number: 3, hoursSinceReady: 60 }],
    });
    expect(intents.map((i) => i.kind).sort()).toEqual([
      "flag-plan-stall",
      "flag-silent-feedback",
      "flag-stall",
    ]);
  });
});

// #3960 — the board's In Progress column reads the `in-progress` label, so a build that died
// without its terminal step would leave a ghost counting against the WIP limit of 3. The audit
// takes a label quiet past 6h back off, with one comment; the label's absence is the memory.
describe("audit() — clearing a stale in-progress label", () => {
  const w = (number: number, hoursQuiet: number) => ({
    number,
    title: `Build ${number}`,
    hoursQuiet,
  });

  it("clears a label quiet for 6h or more, with the one plain comment", () => {
    const intents = audit({ staleInProgress: [w(4200, 6), w(4201, 30)] });
    expect(intents.map((i) => [i.kind, i.issueNumber])).toEqual([
      ["clear-in-progress", 4200],
      ["clear-in-progress", 4201],
    ]);
    expect(intents[0]?.body).toContain(
      "Cleared `in-progress`: no activity for 6h. Re-apply it when work resumes.",
    );
  });

  it("leaves a label alone inside the 6h window — the build may simply be running", () => {
    expect(audit({ staleInProgress: [w(4202, 5)] })).toHaveLength(0);
  });

  it("respects a custom inProgressStaleAfterHours threshold", () => {
    const deps = { staleInProgress: [w(4203, 3)] };
    expect(audit(deps)).toHaveLength(0);
    expect(audit({ ...deps, inProgressStaleAfterHours: 2 })).toHaveLength(1);
  });

  it("does not read the stall-flagged memory — removing the label is its own", () => {
    // A stall-flagged issue can still carry a ghost label; the one-ping rule for stall comments
    // must not keep the column lying.
    const intents = audit({ staleInProgress: [w(4204, 12)], alreadyFlagged: [4204] });
    expect(intents).toHaveLength(1);
  });
});

// 2026-10-04 — the gather filtered `in-progress` out of the newest-100 open-issue read, so the
// oldest plans (positions 110–124 of 139) were invisible and held every in-flight slot as ghosts.
// The gather now reads the label directly; this pins the shaping it hands `audit()`.
describe("staleInProgressFrom() — the in-flight issues and how long each has been quiet", () => {
  const now = Date.parse("2026-10-04T12:00:00Z");
  const issue = (number: number, updatedAt: string, labels: string[]) => ({
    number,
    title: `Plan ${number}`,
    updatedAt,
    labels: labels.map((name) => ({ name })),
  });

  it("keeps only issues carrying in-progress, with whole hours quiet", () => {
    const rows = staleInProgressFrom(
      [
        issue(3651, "2026-10-03T15:24:36Z", ["plan", "in-progress"]),
        issue(3939, "2026-10-03T04:21:51Z", ["in-progress"]),
        issue(4100, "2026-10-01T00:00:00Z", ["plan", "ready"]),
      ],
      now,
    );
    expect(rows).toEqual([
      { number: 3651, title: "Plan 3651", hoursQuiet: 20 },
      { number: 3939, title: "Plan 3939", hoursQuiet: 31 },
    ]);
  });

  it("feeds audit() so a ghost older than any page window still clears", () => {
    const rows = staleInProgressFrom([issue(3407, "2026-10-03T00:33:18Z", ["in-progress"])], now);
    expect(audit({ staleInProgress: rows }).map((i) => [i.kind, i.issueNumber])).toEqual([
      ["clear-in-progress", 3407],
    ]);
  });
});

// #3960 slice 4 (criterion 4's write half) — this push-driven audit IS "the next lane run", so it
// is where the spigot's dashboard catches up with the dial. The decision rules live in
// work-mode-title.spec.ts; what matters here is that the dial is wired into this lane and costs the
// other four checks nothing.
describe("audit() — syncing the work spigot's title", () => {
  const expired = {
    trackingIssue: 4153,
    title: "Work mode: CONSERVE until 2026-09-29",
    mode: {
      position: "normal" as const,
      until: null,
      caps: {
        inFlightCap: 3,
        researchPerTick: 6,
        governorDispatches: 4,
        grindWidth: 200,
        continuationsPerDay: 3,
      },
      reason: "conserve expired at the end of 2026-09-29 (UTC)",
    },
  };

  it("emits one retitle intent when the title has gone stale", () => {
    const intents = audit({ workMode: expired });
    expect(intents.map((i) => [i.kind, i.issueNumber, i.newTitle])).toEqual([
      ["retitle-work-mode", 4153, "Work mode: NORMAL"],
    ]);
  });

  it("is silent when the dial could not be read, and when the title already matches", () => {
    expect(audit({ workMode: null })).toHaveLength(0);
    expect(audit({})).toHaveLength(0);
    expect(audit({ workMode: { ...expired, title: "Work mode: NORMAL" } })).toHaveLength(0);
  });

  it("does not disturb the other audit lanes", () => {
    const intents = audit({
      workMode: expired,
      staleInProgress: [{ title: "Build 4205", number: 4205, hoursQuiet: 9 }],
      silentFeedback: [{ title: "some feedback", number: 2, hoursSinceFiled: 10 }],
    });
    expect(intents.map((i) => i.kind)).toEqual([
      "flag-silent-feedback",
      "clear-in-progress",
      "retitle-work-mode",
    ]);
  });
});
