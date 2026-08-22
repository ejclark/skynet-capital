import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The self-healing lane's router, exercised the way postmaster.spec.ts exercises its own: feed a
// fixture `workflow_run` payload through `--dry-run` and assert the INTENTS. The dry run never
// executes one, so no spec here can touch GitHub.
//
// The four loop guards are the load-bearing part. A lane that files an issue about its own failure,
// or about a red PR branch it then pushes to, does not heal anything — it bills you for a spiral.
type Intent = { type: string; title?: string; issue?: number; body?: string; reason?: string };

const dryRun = (fixture: string): Intent[] =>
  JSON.parse(
    execFileSync(
      "node",
      ["scripts/ci-medic.mjs", "--dry-run", "--event", `tests/fixtures/events/${fixture}`],
      { cwd: process.cwd(), encoding: "utf8" },
    ),
  );

describe("ci medic — routing a failed run", () => {
  it("files one capsule issue for a fresh failure on main, and asks for a repair session", () => {
    const [intent, ...rest] = dryRun("workflow-run-failed.json");

    expect(rest).toEqual([]);
    expect(intent?.type).toBe("open-issue");
    expect(intent?.title).toBe("[ci] Postmaster — build feedback issue");
    expect(intent?.body).toContain("Run set -euo pipefail");
  });

  it("comments on the recurrence instead of filing a second issue", () => {
    const [intent] = dryRun("workflow-run-failed-again.json");

    expect(intent?.type).toBe("comment");
    expect(intent?.issue).toBe(480);
    expect(intent?.body).toContain("Failed again");
  });

  it("goes quiet once a signature is escalated — Eric's queue is not a firehose", () => {
    const [intent] = dryRun("workflow-run-failed-escalated.json");

    expect(intent?.type).toBe("skip");
    expect(intent?.reason).toContain("escalated");
  });

  it("ignores a red PR branch — that failure belongs to the PR and its author", () => {
    expect(dryRun("workflow-run-failed-on-pr.json")).toEqual([]);
  });

  it("ignores its own failure — the guard that stops the lane feeding itself", () => {
    expect(dryRun("workflow-run-medic-self.json")).toEqual([]);
  });

  it("does nothing at all for a run that succeeded", () => {
    const dir = mkdtempSync(join(tmpdir(), "medic-"));
    const file = join(dir, "ok.json");
    writeFileSync(
      file,
      JSON.stringify({
        repository: { default_branch: "main" },
        workflow_run: { id: 1, name: "Pipeline", conclusion: "success", head_branch: "main" },
        failures: [],
        deps: { openIssues: [] },
      }),
    );
    const out = execFileSync("node", ["scripts/ci-medic.mjs", "--dry-run", "--event", file], {
      encoding: "utf8",
    });
    rmSync(dir, { recursive: true, force: true });

    expect(JSON.parse(out)).toEqual([]);
  });
});

describe("ci medic — the issue it writes", () => {
  it("satisfies the capsule contract it asks humans to follow (docs/ISSUES.md)", () => {
    const [intent] = dryRun("workflow-run-failed.json");
    const dir = mkdtempSync(join(tmpdir(), "medic-body-"));
    const file = join(dir, "body.md");
    writeFileSync(file, intent?.body ?? "");

    // issue-lint exits non-zero on a problem; execFileSync throws on that.
    const out = execFileSync(
      "node",
      ["scripts/issue-lint.mjs", "--title", intent?.title ?? "", file],
      { encoding: "utf8" },
    );
    rmSync(dir, { recursive: true, force: true });

    expect(out).toContain("satisfies the capsule contract");
  });

  it("puts the evidence in a fold, not above it", () => {
    const [intent] = dryRun("workflow-run-failed.json");
    const body = intent?.body ?? "";

    expect(body.indexOf("<details>")).toBeGreaterThan(-1);
    expect(body.indexOf("Process completed with exit code 1")).toBeGreaterThan(
      body.indexOf("<details>"),
    );
  });
});
