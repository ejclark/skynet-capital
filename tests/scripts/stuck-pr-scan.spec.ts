import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "@rstest/core";

// #6881: `scan()` asked `exemptReason` about every verdict kind, so a protected or platter-boarded PR
// left the report whatever was wrong with it. "Waits for Eric's merge by design" holds only for an
// `unarmed` PR. A `headless` one never ran its required checks and an armed `blocked` one cannot
// merge, so branch protection stops Eric's merge as well, and the scan is the one net that names the
// fix. This drives the real script against a stubbed GitHub (a preloaded `fetch`, not a flag
// production would carry), so it pins what `npm run pr:stuck` and the digest's `--stuck` line print.

const NOW = Date.parse("2026-11-05T12:00:00Z");
const ago = (h: number) => new Date(NOW - h * 3.6e6).toISOString();

const ghost = {
  app: { slug: "github-actions" },
  status: "completed",
  conclusion: "cancelled",
  latest_check_runs_count: 0,
  created_at: ago(100),
};
const green = ["verify", "integration tests", "arm auto-merge"].map((name) => ({
  name,
  status: "completed",
  conclusion: "success",
  completed_at: ago(10),
}));

interface Fixture {
  number: number;
  ref: string;
  files: string[];
  armed?: boolean;
  state: string;
  runs: object[];
  suites: object[];
  body?: string;
  createdHoursAgo?: number;
}

const prs: Fixture[] = [
  // A dependabot bump to a workflow whose head carries only a ghost suite: `headless`.
  {
    number: 1,
    ref: "dependabot/github_actions/a",
    files: [".github/workflows/pipeline.yml"],
    state: "blocked",
    runs: [],
    suites: [ghost],
  },
  // A protected PR Eric armed, green but held "blocked" behind a ghost suite.
  {
    number: 2,
    ref: "dependabot/github_actions/b",
    files: [".github/workflows/deploy.yml"],
    armed: true,
    state: "blocked",
    runs: green,
    suites: [ghost],
  },
  // Green and never armed: this one does wait for Eric's merge by design, so it stays skipped.
  {
    number: 3,
    ref: "dependabot/github_actions/c",
    files: [".github/workflows/ci.yml"],
    state: "clean",
    runs: green,
    suites: [],
  },
  // Boarded on the platter below and headless: still named.
  {
    number: 4,
    ref: "feedback/40",
    files: ["docs/x.md"],
    state: "blocked",
    runs: [],
    suites: [ghost],
  },
  // Boarded and unarmed: left to the platter's merge.
  {
    number: 5,
    ref: "feedback/50",
    files: ["docs/y.md"],
    state: "clean",
    runs: green,
    suites: [],
  },
  // The platter itself, too young to be read.
  {
    number: 6,
    ref: "platter/2026-11-05",
    files: [],
    state: "clean",
    runs: [],
    suites: [],
    body: "| 1 | `feedback/40` | green | abc |\n| 2 | `feedback/50` | green | def |",
    createdHoursAgo: 0.1,
  },
];

function routes() {
  const out: Record<string, unknown> = {};
  out["pulls?state=open&per_page=100"] = prs.map((p) => ({
    number: p.number,
    draft: false,
    created_at: ago(p.createdHoursAgo ?? 100),
    head: { sha: `sha${p.number}`, ref: p.ref },
    body: p.body ?? "",
    labels: [],
  }));
  for (const p of prs) {
    out[`commits/sha${p.number}/check-runs?per_page=100`] = {
      check_runs: p.runs,
    };
    out[`commits/sha${p.number}/check-suites?per_page=100`] = {
      check_suites: p.suites,
    };
    out[`pulls/${p.number}`] = {
      number: p.number,
      title: `pr ${p.number}`,
      html_url: `https://github.com/o/r/pull/${p.number}`,
      created_at: ago(p.createdHoursAgo ?? 100),
      auto_merge: p.armed ? { merge_method: "squash" } : null,
      mergeable_state: p.state,
      head: { ref: p.ref },
      labels: [],
    };
    out[`pulls/${p.number}/files?per_page=100`] = p.files.map((filename) => ({
      filename,
    }));
  }
  return out;
}

const root = mkdtempSync(join(tmpdir(), "stuck-pr-scan-"));
afterAll(() => rmSync(root, { recursive: true, force: true }));

function runScan() {
  const routesFile = join(root, "routes.json");
  writeFileSync(routesFile, JSON.stringify(routes()));
  const stub = join(root, "stub-fetch.mjs");
  writeFileSync(
    stub,
    `import { readFileSync } from "node:fs";
Date.now = () => ${NOW};
const routes = JSON.parse(readFileSync(${JSON.stringify(routesFile)}, "utf8"));
globalThis.fetch = async (url) => {
  const path = String(url).replace(/^https:\\/\\/api\\.github\\.com\\/repos\\/[^/]+\\/[^/]+\\//, "");
  const body = routes[path];
  return { ok: body !== undefined, status: body === undefined ? 404 : 200, json: async () => body };
};`,
  );
  const env: NodeJS.ProcessEnv = { ...process.env, GH_TOKEN: "stub" };
  delete env.HTTPS_PROXY;
  delete env.https_proxy;
  const res = spawnSync("node", ["--import", stub, "scripts/stuck-pr-scan.mjs", "--count"], {
    encoding: "utf8",
    env,
  });
  expect(res.status, res.stderr).toBe(0);
  return JSON.parse(res.stdout).stuck as { number: number; kind: string }[] | null;
}

describe("stuck-pr-scan — a protected or boarded PR is skipped only while it waits unarmed (#6881)", () => {
  const stuck = runScan();
  const named = (n: number) => stuck?.find((s) => s.number === n)?.kind;

  it("reads the stubbed GitHub (a null list means the scan could not)", () => {
    expect(stuck).not.toBeNull();
  });

  it("WHEN a .github/workflows/ PR is headless, THEN the scan still lists it", () => {
    expect(named(1)).toBe("headless");
  });

  it("WHEN a protected PR is armed and blocked, THEN the scan still lists it", () => {
    expect(named(2)).toBe("blocked");
  });

  it("WHEN a platter-boarded PR is headless, THEN the scan still lists it", () => {
    expect(named(4)).toBe("headless");
  });

  it("WHEN a protected or boarded PR is green and unarmed, THEN it is left to Eric's merge", () => {
    expect(named(3)).toBeUndefined();
    expect(named(5)).toBeUndefined();
    expect(stuck?.map((s) => s.number).sort()).toEqual([1, 2, 4]);
  });
});
