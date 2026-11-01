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
  gatherCapsules,
  greenProof,
  hasLinkedPr,
  jobPassed,
  jobVerdict,
  lookupsFor,
  ORPHAN_MARKER,
  PROVEN_MARKER,
  RECURRENCE,
} from "../../../scripts/moneypenny/capsule-stall.mjs";

// #5727 — the CI repair loop reaching a terminal state on its own. Two conditions a person used to
// have to remember: a capsule nothing is repairing (#4395, 17 days), and a capsule whose failing
// job went green on every run since (#5577, two days). Comment and flag the first; close the
// second on proof, reading dispatch runs as well as pushes (study 2026-11-01: a workflow that runs
// on dispatch could never prove itself green, so dead capsules sat for days). Never dispatch.

const NOW = Date.parse("2026-10-18T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

/** The metadata table `repair.mjs`'s `issueBody` writes, for one matrix leg of `route`. */
const BODY = [
  "**`route` failed on `main` and the work it carries is not getting done.**",
  "",
  "| | |",
  "|---|---|",
  "| **Workflow** | Moneypenny Events |",
  "| **Job** | `route` |",
  "| **Matrix leg** | `route (feedback)` |",
  "| **Run** | [1](https://x/1) |",
].join("\n");

const run = (id: number, h: number, conclusion = "success"): CapsuleRun => ({
  id,
  url: `https://github.com/o/r/actions/runs/${id}`,
  createdAt: hoursAgo(h),
  jobs: [{ name: "route", conclusion }],
});

const capsule = (overrides: Partial<Capsule> = {}): Capsule => ({
  number: 4395,
  title: "[ci] Moneypenny Events — route",
  body: BODY,
  createdAt: hoursAgo(48),
  ageHours: 48,
  labels: ["ci-failure"],
  comments: [],
  hasLinkedPr: false,
  ...overrides,
});

describe("capsuleTarget — which workflow and job a capsule tracks", () => {
  it("reads the same rows repair.mjs writes (the contract BODY above stands in for)", () => {
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

// #6076 — the real `release · deploy bots` jobs behind #5955's false erosion. Two were preflight
// debounce skips (jobs 121050112951, 121048415887): every step after the preflight skipped, job
// conclusion `success`. One really deployed (121047616850): the smoke test ran and passed.
const SMOKE = "Smoke test the bots release";
const deploySteps = (work: "success" | "skipped" | "failure") => [
  { name: "Set up job", conclusion: "success" },
  { name: "Run actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1", conclusion: "success" },
  { name: "Set up flyctl", conclusion: "success" },
  { name: "Preflight — should the bots app deploy?", conclusion: "success" },
  { name: "Resolve image", conclusion: work === "skipped" ? "skipped" : "success" },
  { name: "Capture previous bots image", conclusion: work === "skipped" ? "skipped" : "success" },
  { name: "Deploy bots", conclusion: work === "skipped" ? "skipped" : "success" },
  { name: SMOKE, conclusion: work },
  {
    name: "Roll back bots to previous image",
    conclusion: work === "failure" ? "success" : "skipped",
  },
  {
    name: "Post Run actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
    conclusion: "success",
  },
  { name: "Complete job", conclusion: "success" },
];
const deployJob = (work: "success" | "skipped" | "failure") => [
  {
    name: "release · deploy bots",
    conclusion: work === "failure" ? "failure" : "success",
    steps: deploySteps(work),
  },
];
const DEPLOY_BODY = [
  "**`release · deploy bots` failed on `main` and the work it carries is not getting done.**",
  "",
  "| | |",
  "|---|---|",
  "| **Workflow** | Pipeline |",
  "| **Job** | `release · deploy bots` |",
  `| **Failing step** | ${SMOKE} |`,
  "| **Run** | [39822385658](https://x/39822385658) |",
].join("\n");

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

/** A fake REST reader keyed by path, recording what was asked. */
function fakeRest(routes: Record<string, unknown>) {
  const asked: string[] = [];
  const read = (path: string) => {
    asked.push(path);
    if (!(path in routes)) throw new Error(`unexpected read ${path}`);
    return routes[path];
  };
  return { asked, rest: read, restAll: (p: string) => read(p) as unknown[] };
}

describe("gatherCapsules — REST reads, only where a condition could fire", () => {
  const issue = (n: number, labels: string[], h: number) => ({
    number: n,
    title: "[ci] Moneypenny Events — route",
    body: BODY,
    created_at: hoursAgo(h),
    labels: labels.map((name) => ({ name })),
  });
  const runsPath = (event: string) =>
    `actions/workflows/77/runs?branch=main&event=${event}&status=completed&per_page=20`;
  const jobs = (conclusion: string) => ({ total_count: 1, jobs: [{ name: "route", conclusion }] });
  const bot = (body: string, created_at: string) => ({
    body,
    created_at,
    author_association: "NONE",
    user: { type: "Bot" },
  });
  const pushRuns = {
    workflow_runs: [
      { id: 13, conclusion: "success", created_at: hoursAgo(1), html_url: "u13" },
      { id: 12, conclusion: "cancelled", created_at: hoursAgo(2), html_url: "u12" },
      { id: 11, conclusion: "success", created_at: hoursAgo(3), html_url: "u11" },
      { id: 10, conclusion: "failure", created_at: hoursAgo(4), html_url: "u10" },
    ],
  };

  it("reads PR links for orphan candidates and run history for every capsule", () => {
    const io = fakeRest({
      "issues?state=open&labels=ci-failure": [
        issue(1, ["ci-failure"], 48),
        issue(2, ["ci-failure"], 2),
        issue(3, ["ci-failure", "needs-eric"], 48),
        { ...issue(4, ["ci-failure"], 48), pull_request: {} },
      ],
      "issues/1/comments": [
        { body: ORPHAN_MARKER, author_association: "NONE", user: { type: "User" } },
        bot(`${RECURRENCE}run [9](u9), job \`route\`.`, hoursAgo(0.5)),
      ],
      "issues/1/timeline": [],
      "issues/2/comments": [],
      "issues/3/comments": [],
      "actions/workflows?per_page=100": { workflows: [{ name: "Moneypenny Events", id: 77 }] },
      [runsPath("push")]: pushRuns,
      [runsPath("workflow_dispatch")]: { workflow_runs: [] },
      "actions/runs/13/jobs?per_page=100": jobs("success"),
      "actions/runs/11/jobs?per_page=100": jobs("success"),
      "actions/runs/10/jobs?per_page=100": jobs("success"),
    });
    const capsules = gatherCapsules(NOW, io);

    // #4 is a PR and gets no read; #2 is young, so no PR read, but its proof is still read.
    expect(capsules.map((c) => c.number)).toEqual([1, 2, 3]);
    expect(io.asked.some((p) => p.startsWith("issues/4/"))).toBe(false);
    expect(io.asked).not.toContain("issues/2/timeline");
    // A stranger's comment carrying the marker does not switch the check off; the recurrence from
    // half an hour ago is newer than every green run, so #1 is not proven and stays an orphan.
    expect(capsules[0]?.comments).toEqual([expect.stringContaining(RECURRENCE)]);
    expect(capsules[0]).toMatchObject({ hasLinkedPr: false, recurredAt: hoursAgo(0.5) });
    // The cancelled run tested nothing, so the window skips it.
    expect(capsules[2]?.recentRuns?.map((r) => r.id)).toEqual([13, 11, 10]);
    expect(capsuleIntents({ capsules }).map((i) => [i.kind, i.issueNumber])).toEqual([
      ["flag-capsule-orphan", 1],
      ["close-proven-capsule", 3],
    ]);
  });

  it("reads each runs page and job list once per gather, however many capsules share the workflow", () => {
    const io = fakeRest({
      "issues?state=open&labels=ci-failure": [
        issue(5, ["ci-failure", "needs-eric"], 48),
        issue(6, ["ci-failure", "needs-eric"], 48),
      ],
      "issues/5/comments": [],
      "issues/6/comments": [],
      "actions/workflows?per_page=100": { workflows: [{ name: "Moneypenny Events", id: 77 }] },
      [runsPath("push")]: pushRuns,
      [runsPath("workflow_dispatch")]: { workflow_runs: [] },
      "actions/runs/13/jobs?per_page=100": jobs("success"),
      "actions/runs/11/jobs?per_page=100": jobs("success"),
      "actions/runs/10/jobs?per_page=100": jobs("success"),
    });
    const capsules = gatherCapsules(NOW, io);
    expect(capsuleIntents({ capsules }).map((i) => i.issueNumber)).toEqual([5, 6]);
    const counts = new Map<string, number>();
    for (const p of io.asked) counts.set(p, (counts.get(p) ?? 0) + 1);
    expect(counts.get(runsPath("push"))).toBe(1);
    expect(counts.get("actions/runs/13/jobs?per_page=100")).toBe(1);
    expect(counts.get("actions/workflows?per_page=100")).toBe(1);
  });

  it("proves a workflow that runs on dispatch green from its dispatch runs (zero tokens)", () => {
    const io = fakeRest({
      "issues?state=open&labels=ci-failure": [issue(3, ["ci-failure"], 48)],
      "issues/3/comments": [],
      "issues/3/timeline": [],
      "actions/workflows?per_page=100": { workflows: [{ name: "Moneypenny Events", id: 77 }] },
      [runsPath("push")]: { workflow_runs: [] },
      [runsPath("workflow_dispatch")]: pushRuns,
      "actions/runs/13/jobs?per_page=100": jobs("success"),
      "actions/runs/11/jobs?per_page=100": jobs("success"),
      "actions/runs/10/jobs?per_page=100": jobs("success"),
    });
    const [intent] = capsuleIntents({ capsules: gatherCapsules(NOW, io) });
    expect(intent).toMatchObject({ kind: "close-proven-capsule", issueNumber: 3 });
    expect(intent?.body).toContain("[13](u13), [11](u11), [10](u10)");
  });

  it("a failing dispatch run newer than green pushes ends the streak — no close", () => {
    const io = fakeRest({
      "issues?state=open&labels=ci-failure": [issue(3, ["ci-failure", "needs-eric"], 48)],
      "issues/3/comments": [],
      "actions/workflows?per_page=100": { workflows: [{ name: "Moneypenny Events", id: 77 }] },
      [runsPath("push")]: pushRuns,
      [runsPath("workflow_dispatch")]: {
        workflow_runs: [
          { id: 20, conclusion: "failure", created_at: hoursAgo(0.5), html_url: "u20" },
        ],
      },
      "actions/runs/20/jobs?per_page=100": jobs("failure"),
    });
    const capsules = gatherCapsules(NOW, io);
    expect(capsules[0]?.recentRuns?.map((r) => r.id)).toEqual([20]);
    expect(capsuleIntents({ capsules })).toEqual([]);
    // The walk ended at the failure: no push run's jobs were read.
    expect(io.asked).not.toContain("actions/runs/13/jobs?per_page=100");
  });

  it("drops the jobs of a run whose job list did not fit one page, so it cannot prove green", () => {
    const io = fakeRest({
      "issues?state=open&labels=ci-failure": [issue(3, ["ci-failure", "needs-eric"], 48)],
      "issues/3/comments": [],
      "actions/workflows?per_page=100": { workflows: [{ name: "Moneypenny Events", id: 77 }] },
      [runsPath("push")]: {
        workflow_runs: [13, 12, 11].map((id, n) => ({
          id,
          conclusion: "success",
          created_at: hoursAgo(n + 1),
          html_url: `u${id}`,
        })),
      },
      [runsPath("workflow_dispatch")]: { workflow_runs: [] },
      "actions/runs/13/jobs?per_page=100": { ...jobs("success"), total_count: 101 },
      "actions/runs/12/jobs?per_page=100": jobs("success"),
      "actions/runs/11/jobs?per_page=100": jobs("success"),
    });
    expect(capsuleIntents({ capsules: gatherCapsules(NOW, io) })).toEqual([]);
  });
});

describe("gatherCapsules — #5955's shape, read live (#6076)", () => {
  const runsPath = "actions/workflows/9/runs?branch=main&event=push&status=completed&per_page=20";
  const dispatchPath =
    "actions/workflows/9/runs?branch=main&event=workflow_dispatch&status=completed&per_page=20";
  const workflows = { workflows: [{ name: "Pipeline", id: 9 }] };
  const bot = (body: string, created_at: string) => ({
    body,
    created_at,
    author_association: "NONE",
    user: { type: "Bot" },
  });
  const issue = (labels: string[]) => ({
    number: 5955,
    title: "[ci] Pipeline — release · deploy bots",
    body: DEPLOY_BODY,
    created_at: hoursAgo(48),
    labels: labels.map((name) => ({ name })),
  });

  it("pages past debounce skips and stops reading once three real deploys passed", () => {
    const work = ["skipped", "success", "skipped", "success", "success", "success"] as const;
    const runs = work.map((_, n) => ({
      id: 60 - n,
      conclusion: "success",
      created_at: hoursAgo(n + 1),
      html_url: `u${60 - n}`,
    }));
    runs.push({ id: 1, conclusion: "success", created_at: hoursAgo(72), html_url: "u1" });
    const routes: Record<string, unknown> = {
      "issues?state=open&labels=ci-failure": [issue(["ci-failure", "needs-eric"])],
      "issues/5955/comments": [],
      "actions/workflows?per_page=100": workflows,
      [runsPath]: { workflow_runs: runs },
      [dispatchPath]: { workflow_runs: [] },
    };
    work.forEach((w, n) => {
      routes[`actions/runs/${60 - n}/jobs?per_page=100`] = { total_count: 1, jobs: deployJob(w) };
    });
    const io = fakeRest(routes);
    const [intent] = capsuleIntents({ capsules: gatherCapsules(NOW, io) });
    expect(intent?.body).toContain("[59](u59), [57](u57), [56](u56)");
    // The sixth run (55) is never read: three passes already answered it.
    expect(io.asked).not.toContain("actions/runs/55/jobs?per_page=100");
    expect(io.asked).not.toContain("actions/runs/1/jobs?per_page=100");
  });

  it("flags it orphaned: recurred after the merged PR, and no real deploy has passed since", () => {
    const io = fakeRest({
      "issues?state=open&labels=ci-failure": [issue(["ci-failure"])],
      "issues/5955/comments": [
        bot(`${RECURRENCE}run [7](u7), job \`release · deploy bots\`.`, hoursAgo(30)),
      ],
      "issues/5955/timeline": [
        {
          event: "cross-referenced",
          source: { issue: { state: "closed", pull_request: { merged_at: hoursAgo(40) } } },
        },
      ],
      "actions/workflows?per_page=100": workflows,
      // One green deploy since the recurrence, and the rest before it: not proof.
      [runsPath]: {
        workflow_runs: [
          { id: 8, conclusion: "success", created_at: hoursAgo(20), html_url: "u8" },
          { id: 7, conclusion: "failure", created_at: hoursAgo(30), html_url: "u7" },
          { id: 6, conclusion: "success", created_at: hoursAgo(36), html_url: "u6" },
        ],
      },
      [dispatchPath]: { workflow_runs: [] },
      "actions/runs/8/jobs?per_page=100": { total_count: 1, jobs: deployJob("success") },
    });
    const capsules = gatherCapsules(NOW, io);
    expect(capsules[0]?.hasLinkedPr).toBe(false);
    expect(capsules[0]?.recurredAt).toBe(hoursAgo(30));
    // Runs from before the recurrence are never read: they cannot speak for the fault as it is now.
    expect(io.asked).not.toContain("actions/runs/6/jobs?per_page=100");
    expect(capsuleIntents({ capsules }).map((i) => [i.kind, i.issueNumber])).toEqual([
      ["flag-capsule-orphan", 5955],
    ]);
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
