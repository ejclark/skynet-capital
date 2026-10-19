import { readFileSync } from "node:fs";
import {
  type Capsule,
  type CapsuleRun,
  capsuleAudit,
  capsuleIntents,
  capsuleTarget,
  clearErodedNeedsEric,
  ERODED_MARKER,
  flagCapsuleOrphan,
  gatherCapsules,
  greenProof,
  hasLinkedPr,
  jobPassed,
  lookupsFor,
  ORPHAN_MARKER,
} from "../../../scripts/moneypenny/capsule-stall.mjs";

// #5727 — the CI repair loop reaching a terminal state on its own. Two conditions a person used to
// have to remember: a capsule nothing is repairing (#4395, 17 days), and a `needs-eric` capsule
// whose failing job went green on every push since (#5577, two days). Comment and move a label,
// once per capsule per condition; never dispatch, never close.

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
});

describe("lookupsFor — the costly reads happen only where a condition could fire", () => {
  it("asks for the run history of an escalated capsule, never the orphan read", () => {
    const issue = {
      labels: [{ name: "ci-failure" }, { name: "needs-eric" }],
      created_at: hoursAgo(1),
    };
    expect(lookupsFor(issue, NOW)).toEqual({ orphan: false, eroded: true });
  });

  it("asks for the PR link of an unescalated capsule older than 24h", () => {
    expect(lookupsFor({ labels: ["ci-failure"], created_at: hoursAgo(25) }, NOW)).toEqual({
      orphan: true,
      eroded: false,
    });
  });

  it("asks for nothing on a young capsule, or one already flagged", () => {
    const young = { labels: ["ci-failure"], created_at: hoursAgo(23) };
    const flagged = { labels: ["ci-failure", "stall-flagged"], created_at: hoursAgo(99) };
    expect(lookupsFor(young, NOW)).toEqual({ orphan: false, eroded: false });
    expect(lookupsFor(flagged, NOW)).toEqual({ orphan: false, eroded: false });
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

  it("is not flagged after its needs-eric was cleared as eroded — that comment already spoke", () => {
    const eroded = capsule({ comments: [`🌤 earlier\n${ERODED_MARKER}`] });
    expect(capsuleIntents({ capsules: [eroded] })).toEqual([]);
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

  it("removes needs-eric with the three run ids as evidence", () => {
    const [intent] = capsuleIntents({ capsules: [escalated()] });
    expect(intent).toMatchObject({ kind: "clear-eroded-needs-eric", issueNumber: 5577 });
    for (const id of [301, 302, 303]) {
      expect(intent?.body).toContain(`[${id}](https://github.com/o/r/actions/runs/${id})`);
    }
    expect(intent?.body).toContain("`route` (Moneypenny Events) passed on the last 3 pushes");
    expect(intent?.body).toContain("This issue stays open");
    expect(intent?.body).toContain(ERODED_MARKER);
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

  it("removes it only once — a re-applied needs-eric is the owner's call and stays", () => {
    const again = escalated({ comments: [`🌤 earlier\n${ERODED_MARKER}`] });
    expect(capsuleIntents({ capsules: [again] })).toEqual([]);
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
  const runsPath = "actions/workflows/77/runs?branch=main&event=push&status=completed&per_page=20";
  const jobs = (conclusion: string) => ({ total_count: 1, jobs: [{ name: "route", conclusion }] });

  it("reads PR links for orphan candidates and run history for escalated capsules", () => {
    const io = fakeRest({
      "issues?state=open&labels=ci-failure": [
        issue(1, ["ci-failure"], 48),
        issue(2, ["ci-failure"], 2),
        issue(3, ["ci-failure", "needs-eric"], 48),
        { ...issue(4, ["ci-failure"], 48), pull_request: {} },
      ],
      "issues/1/comments": [
        { body: ORPHAN_MARKER, author_association: "NONE", user: { type: "User" } },
      ],
      "issues/1/timeline": [],
      "issues/3/comments": [],
      "actions/workflows?per_page=100": { workflows: [{ name: "Moneypenny Events", id: 77 }] },
      [runsPath]: {
        workflow_runs: [
          { id: 13, conclusion: "success", created_at: hoursAgo(1), html_url: "u13" },
          { id: 12, conclusion: "cancelled", created_at: hoursAgo(2), html_url: "u12" },
          { id: 11, conclusion: "success", created_at: hoursAgo(3), html_url: "u11" },
          { id: 10, conclusion: "failure", created_at: hoursAgo(4), html_url: "u10" },
        ],
      },
      "actions/runs/13/jobs?per_page=100": jobs("success"),
      "actions/runs/11/jobs?per_page=100": jobs("success"),
      "actions/runs/10/jobs?per_page=100": jobs("success"),
    });
    const capsules = gatherCapsules(NOW, io);

    // #2 is young and #4 is a PR: neither gets a per-capsule read.
    expect(capsules.map((c) => c.number)).toEqual([1, 3]);
    expect(io.asked.some((p) => p.startsWith("issues/2/") || p.startsWith("issues/4/"))).toBe(
      false,
    );
    // A stranger's comment carrying the marker does not switch the check off.
    expect(capsules[0]).toMatchObject({ comments: [], hasLinkedPr: false });
    // The cancelled run tested nothing, so the window skips it.
    expect(capsules[1]?.recentRuns?.map((r) => r.id)).toEqual([13, 11, 10]);
    expect(capsuleIntents({ capsules }).map((i) => [i.kind, i.issueNumber])).toEqual([
      ["flag-capsule-orphan", 1],
      ["clear-eroded-needs-eric", 3],
    ]);
  });

  it("drops the jobs of a run whose job list did not fit one page, so it cannot prove green", () => {
    const io = fakeRest({
      "issues?state=open&labels=ci-failure": [issue(3, ["ci-failure", "needs-eric"], 48)],
      "issues/3/comments": [],
      "actions/workflows?per_page=100": { workflows: [{ name: "Moneypenny Events", id: 77 }] },
      [runsPath]: {
        workflow_runs: [13, 12, 11].map((id, n) => ({
          id,
          conclusion: "success",
          created_at: hoursAgo(n + 1),
          html_url: `u${id}`,
        })),
      },
      "actions/runs/13/jobs?per_page=100": { ...jobs("success"), total_count: 101 },
      "actions/runs/12/jobs?per_page=100": jobs("success"),
      "actions/runs/11/jobs?per_page=100": jobs("success"),
    });
    expect(capsuleIntents({ capsules: gatherCapsules(NOW, io) })).toEqual([]);
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

  it("an eroded capsule loses the label first, and a failed removal posts no comment", () => {
    const calls: string[][] = [];
    const eroded = { ...intent, kind: "clear-eroded-needs-eric" as const };
    const run = (_cmd: string, args: string[]) => {
      calls.push(args);
      return "";
    };
    clearErodedNeedsEric(eroded, { run });
    expect(calls.map((c) => [c[2], c[3]])).toEqual([
      ["DELETE", "repos/{owner}/{repo}/issues/9/labels/needs-eric"],
      ["POST", "repos/{owner}/{repo}/issues/9/comments"],
    ]);

    const failing = () => {
      throw new Error("HTTP 404");
    };
    expect(() => clearErodedNeedsEric(eroded, { run: failing })).toThrow("HTTP 404");
  });
});
