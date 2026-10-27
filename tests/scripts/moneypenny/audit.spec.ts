import {
  audit,
  CONFLICT_MARKER,
  CONFLICT_REPAIR_CAP,
  owedAnswer,
  planStallFrom,
  readyPlanCandidate,
  silentFeedbackFrom,
  staleInProgressFrom,
  staleStallFlags,
  untruncated,
  waitingSince,
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

const at = (hoursAgo: number) => new Date(NOW - hoursAgo * 3_600_000).toISOString();
const readyComment = (hoursAgo: number, body = "ready") => ({
  event: "commented",
  body,
  created_at: at(hoursAgo),
});
const labelEvent = (name: string, hoursAgo: number, event = "labeled") => ({
  event,
  created_at: at(hoursAgo),
  label: { name },
});

describe("readyPlanCandidate — the pure per-issue stall decision", () => {
  it("is a candidate when a ready comment landed on an open plan issue with no claim", () => {
    const candidate = readyPlanCandidate(planIssue(), [readyComment(50)], false, NOW);
    expect(candidate).toEqual({ title: "[plan] some plan", number: 466, hoursSinceReady: 50 });
  });

  // #6042 — the first flip was the clock, so #4808 (readied 10-07, worked through three slices on
  // 10-18) still read as 19 days stalled on 10-26.
  it("times the plan from its LATEST ready-flip, not its first", () => {
    const timeline = [readyComment(72), readyComment(10)];
    expect(readyPlanCandidate(planIssue(), timeline, false, NOW)?.hoursSinceReady).toBe(10);
  });

  it("counts the `ready` label as a flip, and an unpark as a fresh start", () => {
    const labelled = [readyComment(300), labelEvent("ready", 30)];
    expect(readyPlanCandidate(planIssue(), labelled, false, NOW)?.hoursSinceReady).toBe(30);
    const unparked = [
      ...labelled,
      labelEvent("needs-eric", 20),
      labelEvent("needs-eric", 4, "unlabeled"),
    ];
    expect(readyPlanCandidate(planIssue(), unparked, false, NOW)?.hoursSinceReady).toBe(4);
  });

  // #6287 — the clock counted only needs-eric / needs-info / next-slice removals as an unpark, so a
  // plan unparked from needs-design or hold-merge read as stalled since its 480h-old flip.
  it.each(["needs-design", "hold-merge", "needs-eric", "needs-info"])(
    "restarts the clock when `%s` comes off after an old flip",
    (label) => {
      const timeline = [
        labelEvent("ready", 480),
        labelEvent(label, 470),
        labelEvent(label, 5 / 60, "unlabeled"),
      ];
      expect(readyPlanCandidate(planIssue(), timeline, false, NOW)?.hoursSinceReady).toBe(0);
    },
  );

  it("is null once the lane took `ready` back after the latest flip — that answered it", () => {
    const withdrawn = [
      readyComment(400),
      labelEvent("ready", 200),
      labelEvent("ready", 180, "unlabeled"),
    ];
    expect(readyPlanCandidate(planIssue(), withdrawn, false, NOW)).toBeNull();
    // A fresh flip after the withdrawal is a new wait.
    const reflipped = [...withdrawn, readyComment(60)];
    expect(readyPlanCandidate(planIssue(), reflipped, false, NOW)?.hoursSinceReady).toBe(60);
  });

  it.each(["next-slice", "in-progress", "needs-eric", "needs-info", "needs-design"])(
    "is null while the plan carries `%s` — something already spoke for it",
    (label) => {
      const issue = planIssue({ labels: [{ name: "plan" }, { name: label }] });
      expect(readyPlanCandidate(issue, [readyComment(50)], false, NOW)).toBeNull();
    },
  );

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

  it("is null with an empty timeline", () => {
    expect(readyPlanCandidate(planIssue(), [], false, NOW)).toBeNull();
  });

  it("is null when no comment reads as a ready-flip", () => {
    const timeline = [readyComment(50, "can you clarify the second bullet?")];
    expect(readyPlanCandidate(planIssue(), timeline, false, NOW)).toBeNull();
  });
});

// #6042 slice 2 — plan flags clear the way silent-feedback flags do: the writer's own test runs on
// flagged plans too, and a flag whose test is false comes off with no comment.
describe("planStallFrom — the plan writer's flags and clears (#6042)", () => {
  const plan = (number: number, labels: string[], extra: Record<string, unknown> = {}) =>
    planIssue({
      number,
      title: `[plan] ${number}`,
      labels: labels.map((name) => ({ name })),
      ...extra,
    });
  const run = (
    issues: ReturnType<typeof plan>[],
    timeline: object[],
    flagged: number[] = [],
    claimed = false,
  ) =>
    planStallFrom(
      issues,
      () => timeline,
      () => claimed,
      NOW,
      flagged,
    );
  const intents = (
    issues: ReturnType<typeof plan>[],
    timeline: object[],
    flagged: number[] = [],
  ) => {
    const plans = run(issues, timeline, flagged);
    return audit({
      readyPlans: plans.readyPlans,
      staleStallFlags: plans.staleFlags,
      alreadyFlagged: flagged,
    });
  };

  it("clears #4808's shape: flagged, then answered by next-slice, with no read and no comment", () => {
    const read = rstest.fn(() => []);
    const answeredPlan = plan(4808, ["plan", "next-slice", "stall-flagged"]);
    const plans = planStallFrom([answeredPlan], read, () => false, NOW, [4808]);
    expect(plans).toEqual({ readyPlans: [], staleFlags: [{ title: "[plan] 4808", number: 4808 }] });
    expect(read).not.toHaveBeenCalled();
    const out = intents([answeredPlan], [], [4808]);
    expect(out.map((i) => [i.kind, i.issueNumber, i.body])).toEqual([
      ["clear-stall", 4808, undefined],
    ]);
  });

  it("clears a flag once the lane took `ready` back", () => {
    const withdrawn = [readyComment(400), labelEvent("ready", 180, "unlabeled")];
    expect(run([plan(4808, ["plan", "stall-flagged"])], withdrawn, [4808]).staleFlags).toHaveLength(
      1,
    );
  });

  it("clears a flag once a claim is held — the plan is being built", () => {
    expect(
      run([plan(7, ["plan", "stall-flagged"])], [readyComment(90)], [7], true).staleFlags,
    ).toHaveLength(1);
  });

  it("leaves a flag alone while its test still holds — still stalled, never re-pinged", () => {
    expect(intents([plan(7, ["plan", "stall-flagged"])], [readyComment(90)], [7])).toEqual([]);
  });

  it("re-flags a cleared plan only on a fresh flip, timed from that flip", () => {
    const cleared = plan(4808, ["plan"]);
    const withdrawn = [readyComment(400), labelEvent("ready", 180, "unlabeled")];
    expect(intents([cleared], withdrawn)).toEqual([]);
    expect(intents([cleared], [...withdrawn, readyComment(10)])).toEqual([]);
    const out = intents([cleared], [...withdrawn, readyComment(49)]);
    expect(out.map((i) => [i.kind, i.issueNumber, i.hoursSinceReady])).toEqual([
      ["flag-plan-stall", 4808, 49],
    ]);
  });

  // #6287 — the push minutes after an unpark posted "Plan never claimed … 480h".
  it.each(["needs-design", "hold-merge"])(
    "sends no stall ping on the push right after `%s` comes off an old-flipped plan",
    (label) => {
      const timeline = [
        labelEvent("ready", 480),
        labelEvent(label, 470),
        labelEvent(label, 5 / 60, "unlabeled"),
      ];
      expect(intents([plan(12, ["plan", "ready"])], timeline)).toEqual([]);
    },
  );

  it("keeps a plan's flag while it is still owed a feedback answer, so the two writers never fight", () => {
    const owed = plan(8, ["plan", "feedback", "ready", "stall-flagged"]);
    expect(run([owed], [labelEvent("ready", 180, "unlabeled")], [8]).staleFlags).toEqual([]);
  });

  it("never clears a repair writer's flag", () => {
    const repair = [
      plan(9, ["plan", "ci-failure", "stall-flagged"]),
      plan(10, ["plan", "next-slice", "stall-flagged"], { title: "[event-research] nvda-q3" }),
    ];
    expect(run(repair, [], [9, 10]).staleFlags).toEqual([]);
  });

  it("reads no claim for a plan with no live flip", () => {
    const claim = rstest.fn(() => false);
    planStallFrom([plan(11, ["plan"])], () => [], claim, NOW, []);
    expect(claim).not.toHaveBeenCalled();
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

  it("posts the cap once per head: the cap comment's own marker silences the next push", () => {
    const [cap] = audit({
      conflictedPRs: [{ title: "feat: x", number: 1373, headRefOid: "sha-n" }],
      alreadyFlaggedPRs: [{ number: 1373, sha: "sha-n-minus-1", attempt: CONFLICT_REPAIR_CAP }],
    });
    const marker = CONFLICT_MARKER.exec(cap?.body ?? "");
    expect(marker?.[1]).toBe("sha-n");
    expect(Number(marker?.[2])).toBe(CONFLICT_REPAIR_CAP + 1);
    const next = audit({
      conflictedPRs: [{ title: "feat: x", number: 1373, headRefOid: "sha-n" }],
      alreadyFlaggedPRs: [{ number: 1373, sha: "sha-n", attempt: CONFLICT_REPAIR_CAP + 1 }],
    });
    expect(next).toHaveLength(0);
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
      silentFeedback: [{ title: "some feedback", number: 2, hoursWaiting: 10 }],
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
        startedPlanCap: 4,
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
      silentFeedback: [{ title: "some feedback", number: 2, hoursWaiting: 10 }],
    });
    expect(intents.map((i) => i.kind)).toEqual([
      "flag-silent-feedback",
      "clear-in-progress",
      "retitle-work-mode",
    ]);
  });
});

describe("untruncated() — a list read at its --limit fails loudly instead of auditing a partial list", () => {
  it("passes a list shorter than the limit through unchanged", () => {
    const rows = [{ number: 1 }, { number: 2 }];
    expect(untruncated(rows, 3, "gh issue list")).toBe(rows);
  });

  it("throws when the read came back exactly at the limit — more may sit behind it", () => {
    // 2026-10-04: 100 rows at --limit 100 with ~140 open; the oldest 40 were invisible.
    const rows = Array.from({ length: 100 }, (_, n) => ({ number: n }));
    expect(() => untruncated(rows, 100, "gh issue list")).toThrow(/may be truncated/);
  });

  it("treats a missing list as empty, not as a crash", () => {
    expect(untruncated(undefined, 100, "gh issue list")).toEqual([]);
  });
});

// #5667: the "no answer yet — re-apply `feedback`" ping went to issues that were never `ready`,
// where re-labelling does nothing: Backlog waits on an explicit ready, not on a retry.
describe("owedAnswer — which feedback issues the stall audit pings", () => {
  const issue = (labels: string[], extra: Record<string, unknown> = {}) => ({
    labels: labels.map((name) => ({ name })),
    ...extra,
  });

  it("pings a ready feedback issue with no PR and no terminal label", () => {
    expect(owedAnswer(issue(["feedback", "ready"]))).toBe(true);
  });

  it("never pings an issue that was never ready", () => {
    expect(owedAnswer(issue(["feedback", "bug", "fast-track"]))).toBe(false);
  });

  it("stays quiet once a PR, a closing, or a terminal label answered it", () => {
    expect(
      owedAnswer(issue(["feedback", "ready"], { closedByPullRequests: [{ number: 1 }] })),
    ).toBe(false);
    expect(owedAnswer(issue(["feedback", "ready"], { state: "CLOSED" }))).toBe(false);
    expect(owedAnswer(issue(["feedback", "ready", "next-slice"]))).toBe(false);
  });
});

// #6042 — every silent-feedback ping between #5680 and 2026-10-26 (10 of 10) landed 3–26 min after
// an old issue was readied, on a build just starting, because the clock was `createdAt`. And the
// label never came off, so 13 open flags held 0 live stalls. The clock now starts when the issue
// last began waiting, `in-progress` is skipped, and a flag whose test is false comes off silently.
describe("the silent-feedback clock and its clear (#6042)", () => {
  const now = Date.parse("2026-10-26T18:00:00Z");
  const at = (hoursAgo: number) => new Date(now - hoursAgo * 3_600_000).toISOString();
  const issue = (number: number, labels: string[], extra: Record<string, unknown> = {}) => ({
    number,
    title: `Feedback ${number}`,
    createdAt: at(500),
    labels: labels.map((name) => ({ name })),
    ...extra,
  });
  const labeled = (name: string, hoursAgo: number, event = "labeled") => ({
    event,
    created_at: at(hoursAgo),
    label: { name },
  });
  const pings = (issues: ReturnType<typeof issue>[], timeline: object[], flagged: number[] = []) =>
    audit({
      silentFeedback: silentFeedbackFrom(issues, () => timeline, now, flagged),
      staleStallFlags: staleStallFlags(issues),
      alreadyFlagged: flagged,
    });

  describe("waitingSince", () => {
    it("is the latest of ready/feedback added or a parking label removed", () => {
      const timeline = [
        labeled("feedback", 500),
        labeled("ready", 200),
        labeled("needs-eric", 150),
        labeled("needs-eric", 2, "unlabeled"),
        labeled("in-progress", 1),
      ];
      expect(waitingSince(timeline, at(500))).toBe(at(2));
    });

    it("falls back when the timeline shows no wait starting", () => {
      expect(waitingSince([labeled("bug", 3)], at(500))).toBe(at(500));
      expect(waitingSince(undefined, at(500))).toBe(at(500));
    });
  });

  it("does not ping an issue filed 500h ago and readied inside the 6h window", () => {
    expect(pings([issue(4760, ["feedback", "ready"])], [labeled("ready", 0.2)])).toEqual([]);
  });

  it("pings it once the wait itself passes 6h, saying how long it has waited", () => {
    const intents = pings([issue(4760, ["feedback", "ready"])], [labeled("ready", 7)]);
    expect(intents.map((i) => [i.kind, i.issueNumber, i.hoursWaiting])).toEqual([
      ["flag-silent-feedback", 4760, 7],
    ]);
    expect(intents[0]?.body).toContain("waited **7h**");
  });

  it("never pings an issue marked in-progress, however long it has waited", () => {
    const building = issue(4201, ["feedback", "ready", "in-progress"]);
    expect(pings([building], [labeled("ready", 40)])).toEqual([]);
  });

  it("skips the timeline read for an issue its memory already covers", () => {
    const read = rstest.fn(() => [labeled("ready", 40)]);
    silentFeedbackFrom([issue(4953, ["feedback", "ready", "stall-flagged"])], read, now, [4953]);
    expect(read).not.toHaveBeenCalled();
  });

  it("clears each stale flag exactly once, with no comment", () => {
    const stale = [
      issue(4606, ["feedback", "stall-flagged"]), // ready came off: never owed
      issue(5070, ["feedback", "ready", "next-slice", "stall-flagged"]),
      issue(6005, ["feedback", "ready", "stall-flagged"], {
        closedByPullRequests: [{ number: 6093 }],
      }),
    ];
    const intents = pings(stale, [], [4606, 5070, 6005]);
    expect(intents.map((i) => [i.kind, i.issueNumber, i.body])).toEqual([
      ["clear-stall", 4606, undefined],
      ["clear-stall", 5070, undefined],
      ["clear-stall", 6005, undefined],
    ]);
    // Once the label is off, the next push has nothing to clear.
    const cleared = stale.map((i) => ({
      ...i,
      labels: i.labels.filter((l) => l.name !== "stall-flagged"),
    }));
    expect(pings(cleared, [])).toEqual([]);
  });

  it("re-pings a cleared issue only 6h or more after a new wait begins", () => {
    const readied = issue(4606, ["feedback", "ready"]);
    expect(pings([readied], [labeled("ready", 300), labeled("ready", 5)])).toEqual([]);
    const intents = pings([readied], [labeled("ready", 300), labeled("ready", 6)]);
    expect(intents.map((i) => [i.kind, i.issueNumber])).toEqual([["flag-silent-feedback", 4606]]);
  });

  it("leaves a flag alone while its test still holds — still stalled, never re-pinged", () => {
    const stalled = issue(4953, ["feedback", "ready", "stall-flagged"]);
    expect(pings([stalled], [labeled("ready", 30)], [4953])).toEqual([]);
  });

  it("leaves the other writers' flags alone, even when no answer is owed", () => {
    const others = [
      issue(4808, ["feedback", "plan", "stall-flagged"]),
      issue(5900, ["feedback", "ci-failure", "stall-flagged"]),
      issue(5929, ["feedback", "stall-flagged"], { title: "[event-research] nvda-q3" }),
      issue(5930, ["stall-flagged"]),
    ];
    expect(staleStallFlags(others)).toEqual([]);
  });
});
