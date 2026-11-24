// Shared fixtures for the capsule-stall specs (#5727): one clock, the metadata table a capsule
// carries, and builders for a run and a capsule, so every spec file reads the same world.
import type { Capsule, CapsuleRun } from "../../../scripts/moneypenny/capsule-stall.mjs";

export const NOW = Date.parse("2026-10-18T12:00:00Z");
export const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

/** The metadata table `repair.mjs`'s `issueBody` writes, for one matrix leg of `route`. */
export const BODY = [
  "**`route` failed on `main` and the work it carries is not getting done.**",
  "",
  "| | |",
  "|---|---|",
  "| **Workflow** | Moneypenny Events |",
  "| **Job** | `route` |",
  "| **Matrix leg** | `route (feedback)` |",
  "| **Run** | [1](https://x/1) |",
].join("\n");

export const run = (id: number, h: number, conclusion = "success"): CapsuleRun => ({
  id,
  url: `https://github.com/o/r/actions/runs/${id}`,
  createdAt: hoursAgo(h),
  jobs: [{ name: "route", conclusion }],
});

export const capsule = (overrides: Partial<Capsule> = {}): Capsule => ({
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

// #6076 — the real `release · deploy bots` jobs behind #5955's false erosion. Two were preflight
// debounce skips (jobs 121050112951, 121048415887): every step after the preflight skipped, job
// conclusion `success`. One really deployed (121047616850): the smoke test ran and passed.
export const SMOKE = "Smoke test the bots release";
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
export const deployJob = (work: "success" | "skipped" | "failure") => [
  {
    name: "release · deploy bots",
    conclusion: work === "failure" ? "failure" : "success",
    steps: deploySteps(work),
  },
];
export const DEPLOY_BODY = [
  "**`release · deploy bots` failed on `main` and the work it carries is not getting done.**",
  "",
  "| | |",
  "|---|---|",
  "| **Workflow** | Pipeline |",
  "| **Job** | `release · deploy bots` |",
  `| **Failing step** | ${SMOKE} |`,
  "| **Run** | [39822385658](https://x/39822385658) |",
].join("\n");

/** A fake REST reader keyed by path, recording what was asked. A timeline nobody routed reads as
 *  empty — an escalated capsule's is read for where its ask would go — and `asked` still says so. */
export function fakeRest(routes: Record<string, unknown>) {
  const asked: string[] = [];
  const read = (path: string) => {
    asked.push(path);
    if (!(path in routes) && /^issues\/\d+\/timeline$/.test(path)) return [];
    if (!(path in routes)) throw new Error(`unexpected read ${path}`);
    return routes[path];
  };
  return { asked, rest: read, restAll: (p: string) => read(p) as unknown[] };
}
