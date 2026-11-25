import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The self-healing lane's router, exercised the way moneypenny.spec.ts exercises its own: feed a
// fixture `workflow_run` payload through `--dry-run` and assert the INTENTS. The dry run never
// executes one, so no spec here can touch GitHub.
//
// The four loop guards are the load-bearing part. A lane that files an issue about its own failure,
// or about a red PR branch it then pushes to, does not heal anything — it bills you for a spiral.
export type Intent = {
  type: string;
  title?: string;
  issue?: number;
  body?: string;
  reason?: string;
};

export const dryRun = (fixture: string): Intent[] =>
  JSON.parse(
    execFileSync(
      "node",
      ["scripts/moneypenny/repair.mjs", "--dry-run", "--event", `tests/fixtures/events/${fixture}`],
      { cwd: process.cwd(), encoding: "utf8" },
    ),
  );

/**
 * The same dry run over a payload written on the spot — for the matrix cases, where the variable
 * is the JOB NAME and a committed fixture per variant would be a file per assertion.
 */
export const dryRunPayload = (payload: object): Intent[] => {
  const dir = mkdtempSync(join(tmpdir(), "repair-payload-"));
  const file = join(dir, "event.json");
  writeFileSync(file, JSON.stringify(payload));
  try {
    return JSON.parse(
      execFileSync("node", ["scripts/moneypenny/repair.mjs", "--dry-run", "--event", file], {
        encoding: "utf8",
      }),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

/** issue-lint exits non-zero on a problem, and execFileSync throws on that. */
export const lintCapsule = (intent: Intent | undefined): string => {
  const dir = mkdtempSync(join(tmpdir(), "repair-body-"));
  const file = join(dir, "body.md");
  writeFileSync(file, intent?.body ?? "");
  try {
    return execFileSync("node", ["scripts/issue-lint.mjs", "--title", intent?.title ?? "", file], {
      encoding: "utf8",
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

/** A failed run on `main`, with whatever failing jobs the case is about. */
export const failedRun = (jobs: string[], openIssues: Intent["title"][] = []) => ({
  repository: { default_branch: "main" },
  workflow_run: {
    id: 33100000001,
    name: "Moneypenny Events (event-research automation)",
    conclusion: "failure",
    event: "workflow_dispatch",
    head_branch: "main",
    html_url: "https://github.com/ejclark/skynet-capital/actions/runs/33100000001",
  },
  failures: jobs.map((job) => ({ job, step: "Run claude-code-action" })),
  deps: {
    openIssues: openIssues.map((title, i) => ({ number: 900 + i, title, labels: [] })),
  },
});
