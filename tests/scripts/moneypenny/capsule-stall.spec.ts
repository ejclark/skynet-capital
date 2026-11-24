import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import {
  type Capsule,
  type CapsuleRun,
  capsuleAudit,
  capsuleIntents,
  capsuleTarget,
  closeProvenCapsule,
  ERODED_MARKER,
  flagCapsuleOrphan,
  greenProof,
  hasLinkedPr,
  jobPassed,
  jobVerdict,
  lookupsFor,
  ORPHAN_MARKER,
  PROVEN_MARKER,
  RECURRENCE,
} from "../../../scripts/moneypenny/capsule-stall.mjs";
import {
  BODY,
  capsule,
  DEPLOY_BODY,
  deployJob,
  hoursAgo,
  NOW,
  run,
  SMOKE,
} from "./capsule-stall-fixtures";

// #5727 — the CI repair loop reaching a terminal state on its own. Two conditions a person used to
// have to remember: a capsule nothing is repairing (#4395, 17 days), and a capsule whose failing
// job went green on every run since (#5577, two days). Comment and flag the first; close the
// second on proof, reading dispatch runs as well as pushes (study 2026-11-01: a workflow that runs
// on dispatch could never prove itself green, so dead capsules sat for days). Never dispatch.

describe("capsuleTarget — which workflow and job a capsule tracks", () => {
  it("reads the same rows repair.mjs writes (the contract the fixtures' BODY stands in for)", () => {
    const source = readFileSync("scripts/moneypenny/repair.mjs", "utf8");
    expect(source).toContain(`\`| **Workflow** | \${run.name} |\``);
    expect(source).toContain(`\`| **Job** | \\\`\${job}\\\` |\``);
  });

  it("reads the metadata table repair.mjs writes, with the matrix leg folded off", () => {
    expect(capsuleTarget({ body: BODY })).toEqual({ workflow: "Moneypenny Events", job: "route" });
  });

  it("falls back to the title when the body has no table", () => {
    expect(capsuleTarget({ title: "[ci] CI — verify" })).toEqual({ workflow: "CI", job: "verify" });
  });

  it("refuses a title clamped at the lint ceiling — the job name in it is cut short", () => {
    expect(capsuleTarget({ title: "[ci] CI — a very long job…" })).toBeNull();
  });
});

describe("jobPassed — every leg of the job succeeded, and at least one ran", () => {
  it("passes when every matrix leg folded onto the job succeeded", () => {
    const jobs = [
      { name: "route (a)", conclusion: "success" },
      { name: "route (b)", conclusion: "success" },
      { name: "other", conclusion: "failure" },
    ];
    expect(jobPassed(jobs, "route")).toBe(true);
  });

  it("fails when one leg failed", () => {
    const jobs = [
      { name: "route (a)", conclusion: "success" },
      { name: "route (b)", conclusion: "failure" },
    ];
    expect(jobPassed(jobs, "route")).toBe(false);
  });

  it("fails when the job did not run at all, or was skipped", () => {
    expect(jobPassed([{ name: "other", conclusion: "success" }], "route")).toBe(false);
    expect(jobPassed([{ name: "route", conclusion: "skipped" }], "route")).toBe(false);
  });
});

describe("jobVerdict — a skipped deploy is not a green deploy (#6076)", () => {
  it("reads the failing step from the capsule's table, and ignores an unknown one", () => {
    expect(capsuleTarget({ body: DEPLOY_BODY })).toEqual({
      workflow: "Pipeline",
      job: "release · deploy bots",
      step: SMOKE,
    });
    const unknown = DEPLOY_BODY.replace(SMOKE, "unknown");
    expect(capsuleTarget({ body: unknown })).toEqual({
      workflow: "Pipeline",
      job: "release · deploy bots",
    });
  });

  it("a debounce skip (jobs 121050112951, 121048415887) proves nothing, step or no step", () => {
    expect(jobVerdict(deployJob("skipped"), "release · deploy bots", SMOKE)).toBeNull();
    expect(jobPassed(deployJob("skipped"), "release · deploy bots", SMOKE)).toBe(false);
    // Without a recorded step: every step after the preflight skipped, so still no proof.
    expect(jobVerdict(deployJob("skipped"), "release · deploy bots")).toBeNull();
  });

  it("a real deploy whose smoke test passed (job 121047616850) is a pass", () => {
    expect(jobVerdict(deployJob("success"), "release · deploy bots", SMOKE)).toBe("pass");
    expect(jobVerdict(deployJob("success"), "release · deploy bots")).toBe("pass");
  });

  it("a failed smoke test is a failure, and a step missing from the job proves nothing", () => {
    expect(jobVerdict(deployJob("failure"), "release · deploy bots", SMOKE)).toBe("fail");
    const noSteps = [{ name: "release · deploy bots", conclusion: "success" }];
    expect(jobVerdict(noSteps, "release · deploy bots", SMOKE)).toBeNull();
  });

  it("a job with no preflight keeps its conclusion when no step was recorded", () => {
    expect(jobVerdict([{ name: "route", conclusion: "success" }], "route")).toBe("pass");
    expect(jobVerdict([{ name: "route", conclusion: "skipped" }], "route")).toBeNull();
  });
});

describe("greenProof — skips are left out, a failure ends the streak (#6076)", () => {
  const deployRun = (id: number, h: number, work: "success" | "skipped" | "failure") => ({
    id,
    url: `https://github.com/o/r/actions/runs/${id}`,
    createdAt: hoursAgo(h),
    jobs: deployJob(work),
  });
  const deploy = (recentRuns: CapsuleRun[]) =>
    capsule({
      number: 5955,
      title: "[ci] Pipeline — release · deploy bots",
      body: DEPLOY_BODY,
      labels: ["ci-failure", "needs-eric"],
      recentRuns,
    });

  it("#5955's window — two debounce skips and one real pass — keeps needs-eric", () => {
    const runs = [deployRun(40153426584, 1, "skipped"), deployRun(40152637913, 2, "skipped")];
    runs.push(deployRun(40152435829, 3, "success"));
    expect(capsuleIntents({ capsules: [deploy(runs)] })).toEqual([]);
  });

  it("three real passes behind the skips clear it, citing only the runs that deployed", () => {
    const runs = [1, 3, 5].map((h, n) => deployRun(100 + n, h, "skipped"));
    runs.push(...[2, 4, 6].map((h, n) => deployRun(200 + n, h, "success")));
    runs.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const [intent] = capsuleIntents({ capsules: [deploy(runs)] });
    expect(intent?.kind).toBe("close-proven-capsule");
    expect(intent?.body).toContain(`that ran \`${SMOKE}\``);
    expect(intent?.body).not.toContain("runs/100)");
    expect(greenProof(deploy(runs))?.runs.map((r) => r.id)).toEqual([200, 201, 202]);
  });

  it("a failed deploy newer than the passes ends the streak", () => {
    const runs = [deployRun(4, 1, "failure"), ...[2, 3, 4].map((h) => deployRun(h, h, "success"))];
    expect(greenProof(deploy(runs))).toBeNull();
  });
});

describe("greenProof — a lost runner's capsule can erode like any other (#6274)", () => {
  // #6036 names the step a lost runner left unfinished, with a note after it that no real step
  // carries. Read back verbatim, that note made every later green run prove nothing, so the
  // capsule's needs-eric could never come off. The body here is repair.mjs's own dry-run output.
  const CLAUDE = "Run anthropics/claude-code-action@cab360f6565aa35a51d6ce9e43f1f4287c0a32ea";
  const [filed] = JSON.parse(
    execFileSync(
      "node",
      [
        "scripts/moneypenny/repair.mjs",
        "--dry-run",
        "--event",
        "tests/fixtures/events/workflow-run-runner-lost.json",
      ],
      { encoding: "utf8" },
    ),
  ) as { title: string; body: string }[];
  const researchRun = (id: number, h: number, step = CLAUDE, conclusion = "success") => ({
    id,
    url: `https://github.com/o/r/actions/runs/${id}`,
    createdAt: hoursAgo(h),
    jobs: [
      {
        name: "research due events (uk-gilt-auction-long-2026-11-10, never-assessed)",
        conclusion,
        steps: [{ name: step, conclusion }],
      },
    ],
  });
  const lost = (recentRuns: CapsuleRun[]) =>
    capsule({
      number: 6033,
      title: filed?.title ?? "",
      body: filed?.body ?? "",
      labels: ["ci-failure", "needs-eric"],
      recentRuns,
    });

  it("tracks the step by its own name, the runner note left off", () => {
    expect(filed?.body).toContain("never finished — the runner went away mid-step");
    expect(capsuleTarget(lost([]))).toEqual({
      workflow: "Moneypenny Events (event-research automation)",
      job: "research due events",
      step: CLAUDE,
    });
  });

  it("three green runs of that step close it, needs-eric and all", () => {
    const [intent] = capsuleIntents({
      capsules: [lost([researchRun(3, 1), researchRun(2, 5), researchRun(1, 10)])],
    });
    expect(intent?.kind).toBe("close-proven-capsule");
    expect(intent?.clearNeedsEric).toBe(true);
    expect(intent?.body).toContain(`that ran \`${CLAUDE}\``);
  });

  it("still counts the step after a pin bump renames it — the bump is often the fix", () => {
    const bumped = "Run anthropics/claude-code-action@0123456789abcdef0123456789abcdef01234567";
    const runs = [researchRun(3, 1, bumped), researchRun(2, 5, bumped), researchRun(1, 10)];
    expect(greenProof(lost(runs))?.runs.map((r) => r.id)).toEqual([3, 2, 1]);
    // A different action is a different step, and proves nothing.
    const other = [3, 5, 10].map((h) => researchRun(h, h, "Run actions/checkout@abc"));
    expect(greenProof(lost(other))).toBeNull();
  });

  it("a lost runner again ends the streak", () => {
    const runs = [researchRun(4, 1, CLAUDE, "failure"), ...[2, 3, 4].map((h) => researchRun(h, h))];
    expect(greenProof(lost(runs))).toBeNull();
  });
});

describe("hasLinkedPr — a PR that references the capsule, open or merged", () => {
  const xref = (state: string, merged_at: string | null) => ({
    event: "cross-referenced",
    source: { issue: { state, pull_request: { merged_at } } },
  });

  it("counts an open PR and a merged one", () => {
    expect(hasLinkedPr([xref("open", null)])).toBe(true);
    expect(hasLinkedPr([xref("closed", "2026-10-17T00:00:00Z")])).toBe(true);
  });

  it("counts a PR linked from the sidebar", () => {
    expect(hasLinkedPr([{ event: "connected" }])).toBe(true);
  });

  it("does not count a PR closed unmerged, or a reference from another issue", () => {
    const fromIssue = { event: "cross-referenced", source: { issue: { state: "open" } } };
    expect(hasLinkedPr([xref("closed", null), fromIssue, { event: "labeled" }])).toBe(false);
  });

  it("does not count a merged PR the fault recurred after (#6076: mention-only #5982)", () => {
    const merged = [xref("closed", "2026-10-23T00:00:00Z")];
    expect(hasLinkedPr(merged, "2026-10-25T02:23:00Z")).toBe(false);
    expect(hasLinkedPr(merged, "2026-10-22T00:00:00Z")).toBe(true);
    // An open PR is a repair still in flight, whenever the last recurrence was.
    expect(hasLinkedPr([xref("open", null)], "2026-10-25T02:23:00Z")).toBe(true);
  });
});

describe("lookupsFor — the PR read only where an orphan could fire", () => {
  it("never asks the orphan read for an escalated capsule", () => {
    const issue = {
      labels: [{ name: "ci-failure" }, { name: "needs-eric" }],
      created_at: hoursAgo(1),
    };
    expect(lookupsFor(issue, NOW)).toEqual({ orphan: false });
  });

  it("asks for the PR link of an unescalated capsule older than 24h", () => {
    expect(lookupsFor({ labels: ["ci-failure"], created_at: hoursAgo(25) }, NOW)).toEqual({
      orphan: true,
    });
  });

  it("asks for nothing extra on a young capsule, or one already flagged", () => {
    const young = { labels: ["ci-failure"], created_at: hoursAgo(23) };
    const flagged = { labels: ["ci-failure", "stall-flagged"], created_at: hoursAgo(99) };
    expect(lookupsFor(young, NOW)).toEqual({ orphan: false });
    expect(lookupsFor(flagged, NOW)).toEqual({ orphan: false });
  });
});

describe("capsuleIntents — an orphaned capsule", () => {
  it("is flagged once it is past 24h with no linked PR and no needs-eric", () => {
    const [intent, ...rest] = capsuleIntents({ capsules: [capsule()] });
    expect(rest).toEqual([]);
    expect(intent).toMatchObject({ kind: "flag-capsule-orphan", issueNumber: 4395 });
    expect(intent?.body).toContain("**48h**");
    expect(intent?.body).toContain("Closes #4395");
    expect(intent?.body).toContain(ORPHAN_MARKER);
  });

  it("is left alone under 24h", () => {
    expect(capsuleIntents({ capsules: [capsule({ ageHours: 23 })] })).toEqual([]);
  });

  it("is left alone with a linked PR, or when the PR read never happened", () => {
    expect(capsuleIntents({ capsules: [capsule({ hasLinkedPr: true })] })).toEqual([]);
    expect(capsuleIntents({ capsules: [capsule({ hasLinkedPr: undefined })] })).toEqual([]);
  });

  it("comments once: the stall-flagged label or its own marker stops a second flag", () => {
    const labelled = capsule({ labels: ["ci-failure", "stall-flagged"] });
    const marked = capsule({ comments: [`🧭 earlier\n${ORPHAN_MARKER}`] });
    expect(capsuleIntents({ capsules: [labelled, marked] })).toEqual([]);
  });

  it("is closed, not flagged, once its job has passed three runs since it was filed", () => {
    const green = capsule({ recentRuns: [run(303, 1), run(302, 5), run(301, 10)] });
    const [intent, ...rest] = capsuleIntents({ capsules: [green] });
    expect(rest).toEqual([]);
    expect(intent).toMatchObject({ kind: "close-proven-capsule", issueNumber: 4395 });
    expect(intent?.clearNeedsEric).toBe(false);
    expect(intent?.body).toContain(PROVEN_MARKER);
  });

  it("is never closed while its failure is still happening: a recurrence newer than the passes", () => {
    // Three green runs, then the fault came back (the recurrence comment repair.mjs leaves). The
    // runs before that recurrence prove nothing about the fault as it stands now.
    const back = capsule({
      recentRuns: [run(303, 1), run(302, 5), run(301, 10)],
      recurredAt: hoursAgo(0.5),
    });
    const [intent] = capsuleIntents({ capsules: [back] });
    expect(intent?.kind).toBe("flag-capsule-orphan");
  });

  it("reads the same recurrence prefix repair.mjs writes", () => {
    const source = readFileSync("scripts/moneypenny/repair.mjs", "utf8");
    expect(source).toContain(`\`${RECURRENCE}run [`);
  });
});

describe("capsuleIntents — a needs-eric capsule whose job went green", () => {
  const escalated = (overrides: Partial<Capsule> = {}) =>
    capsule({
      number: 5577,
      labels: ["ci-failure", "needs-eric"],
      recentRuns: [run(303, 1), run(302, 5), run(301, 10)],
      ...overrides,
    });

  it("closes it, needs-eric removed, with the three run ids as evidence", () => {
    const [intent] = capsuleIntents({ capsules: [escalated()] });
    expect(intent).toMatchObject({
      kind: "close-proven-capsule",
      issueNumber: 5577,
      clearNeedsEric: true,
    });
    for (const id of [301, 302, 303]) {
      expect(intent?.body).toContain(`[${id}](https://github.com/o/r/actions/runs/${id})`);
    }
    expect(intent?.body).toContain("`route` (Moneypenny Events) passed on the last 3 runs");
    expect(intent?.body).toContain("`needs-eric` comes off");
    expect(intent?.body).toContain(PROVEN_MARKER);
  });

  it("is never flagged orphaned while it carries needs-eric", () => {
    const red = escalated({ recentRuns: [run(303, 1, "failure"), run(302, 5), run(301, 10)] });
    expect(capsuleIntents({ capsules: [red] })).toEqual([]);
  });

  it("needs all three: two greens are not enough", () => {
    expect(
      capsuleIntents({ capsules: [escalated({ recentRuns: [run(2, 1), run(1, 2)] })] }),
    ).toEqual([]);
  });

  it("does not count runs from before the capsule was filed", () => {
    const old = escalated({ recentRuns: [run(303, 1), run(302, 5), run(301, 60)] });
    expect(capsuleIntents({ capsules: [old] })).toEqual([]);
  });

  it("stays open while a recurrence is newer than the passes — the failure is still happening", () => {
    const back = escalated({ recurredAt: hoursAgo(0.5) });
    expect(capsuleIntents({ capsules: [back] })).toEqual([]);
  });

  it("speaks once: a capsule a person reopened after the close, or re-labelled after the old check, stays", () => {
    const reopened = escalated({ comments: [`🌤 earlier\n${PROVEN_MARKER}`] });
    expect(capsuleIntents({ capsules: [reopened] })).toEqual([]);
    const relabelled = escalated({ comments: [`🌤 earlier\n${ERODED_MARKER}`] });
    expect(capsuleIntents({ capsules: [relabelled] })).toEqual([]);
    // A legacy eroded capsule nobody re-labelled is simply open and green: it closes.
    const legacy = escalated({ labels: ["ci-failure"], comments: [`🌤 earlier\n${ERODED_MARKER}`] });
    expect(capsuleIntents({ capsules: [legacy] }).map((i) => i.kind)).toEqual([
      "close-proven-capsule",
    ]);
  });

  it("closes a proven capsule even while a repair PR is open — the merge then lands on a closed issue", () => {
    const withPr = escalated({ labels: ["ci-failure"], hasLinkedPr: true });
    expect(capsuleIntents({ capsules: [withPr] }).map((i) => i.kind)).toEqual([
      "close-proven-capsule",
    ]);
  });

  it("does nothing when it cannot tell which job the capsule tracks", () => {
    expect(greenProof(escalated({ body: "", title: "something else" }))).toBeNull();
  });
});

describe("capsuleAudit — never takes the rest of the audit down", () => {
  afterEach(() => {
    process.exitCode = 0;
  });

  it("uses a fixture's capsules, and an audit fixture without any yields nothing", () => {
    expect(capsuleAudit({ capsules: [capsule()] })).toHaveLength(1);
    expect(capsuleAudit({})).toEqual([]);
  });

  it("turns the run red on a failed read and returns no intents", () => {
    const log = rstest.spyOn(console, "log").mockImplementation(() => undefined);
    const gather = () => {
      throw new Error("HTTP 502");
    };
    expect(capsuleAudit(undefined, { gather, nowMs: NOW })).toEqual([]);
    expect(process.exitCode).toBe(1);
    expect(log.mock.calls.flat().join("\n")).toContain("capsule stall check failed — HTTP 502");
    log.mockRestore();
  });

  // #6942, run 44213063274 (2026-11-18): the installation's REST bucket hit 0/5000 mid-step and the
  // capsule read's 403 turned `route` red, though `auditIntentsOrSkip` already skips a spent budget
  // for the rest of the audit — this catch swallowed the error before that guard could see it.
  it("skips without turning the run red when the token's budget is spent", () => {
    const log = rstest.spyOn(console, "log").mockImplementation(() => undefined);
    const gather = () => {
      throw new Error(
        "Command failed: curl -sS --fail-with-body\ncurl: (22) The requested URL returned error: 403\n" +
          "GitHub said: API rate limit exceeded for installation ID 157155153.",
      );
    };
    expect(capsuleAudit(undefined, { gather, nowMs: NOW })).toEqual([]);
    expect(process.exitCode).not.toBe(1);
    const said = log.mock.calls.flat().join("\n");
    expect(said).toContain("::warning::capsule stall check skipped");
    expect(said).not.toContain("::error::");
    log.mockRestore();
  });
});

describe("the writes — REST, and in an order that cannot storm", () => {
  const intent = { kind: "flag-capsule-orphan" as const, issueNumber: 9, title: "t", body: "b" };

  beforeEach(() => {
    rstest.spyOn(console, "log").mockImplementation(() => undefined);
  });
  afterEach(() => {
    rstest.restoreAllMocks();
  });

  it("an orphan gets its comment, then stall-flagged", () => {
    const calls: string[][] = [];
    const ensured: string[] = [];
    flagCapsuleOrphan(intent, {
      run: (_cmd, args) => {
        calls.push(args);
        return "";
      },
      ensure: (l) => ensured.push(l.name),
    });
    expect(calls).toEqual([
      ["api", "-X", "POST", "repos/{owner}/{repo}/issues/9/comments", "-f", "body=b"],
      ["api", "-X", "POST", "repos/{owner}/{repo}/issues/9/labels", "-f", "labels[]=stall-flagged"],
    ]);
    expect(ensured).toEqual(["stall-flagged"]);
  });

  it("a proven capsule closes with its comment, needs-eric removed first when it carries one", () => {
    const calls: string[][] = [];
    const run = (_cmd: string, args: string[]) => {
      calls.push(args);
      return "";
    };
    const proven = { ...intent, kind: "close-proven-capsule" as const, clearNeedsEric: true };
    closeProvenCapsule(proven, { run });
    expect(calls).toEqual([
      ["api", "-X", "DELETE", "repos/{owner}/{repo}/issues/9/labels/needs-eric"],
      ["issue", "close", "9", "--reason", "not planned", "--comment", "b"],
    ]);

    calls.length = 0;
    closeProvenCapsule({ ...proven, clearNeedsEric: false }, { run });
    expect(calls).toEqual([["issue", "close", "9", "--reason", "not planned", "--comment", "b"]]);

    // Label first and strict: a failed removal closes nothing, so no comment claims it happened.
    const failing = () => {
      throw new Error("HTTP 404");
    };
    expect(() => closeProvenCapsule(proven, { run: failing })).toThrow("HTTP 404");
  });
});
