import {
  capsuleIntents,
  gatherCapsules,
  ORPHAN_MARKER,
  RECURRENCE,
} from "../../../scripts/moneypenny/capsule-stall.mjs";
import { BODY, DEPLOY_BODY, deployJob, fakeRest, hoursAgo, NOW } from "./capsule-stall-fixtures";

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
