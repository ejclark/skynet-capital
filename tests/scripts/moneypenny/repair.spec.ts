import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { logArgVariants, sanitizeLog } from "../../../scripts/moneypenny/repair-logs.mjs";

// The self-healing lane's router, exercised the way moneypenny.spec.ts exercises its own: feed a
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
      ["scripts/moneypenny/repair.mjs", "--dry-run", "--event", `tests/fixtures/events/${fixture}`],
      { cwd: process.cwd(), encoding: "utf8" },
    ),
  );

describe("moneypenny repair — routing a failed run", () => {
  it("files one capsule issue for a fresh failure on main, and asks for a repair session", () => {
    const [intent, ...rest] = dryRun("workflow-run-failed.json");

    expect(rest).toEqual([]);
    expect(intent?.type).toBe("open-issue");
    expect(intent?.title).toBe("[ci] Moneypenny Events — build feedback issue");
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

  it("files for a run that failed with no jobs — the workflow file itself was rejected", () => {
    // 2026-08-22: a duplicate job key made moneypenny-events.yml (then postmaster.yml) unparseable. GitHub names the run after
    // the file path and creates zero jobs, so "no failing job" is the loudest failure there is.
    const [intent] = dryRun("workflow-run-unparseable.json");

    expect(intent?.type).toBe("open-issue");
    expect(intent?.body).toContain("zero jobs were created");
    expect(intent?.body).toContain("scripts/workflow-lint.mjs");
  });

  it("ignores a red PR branch — that failure belongs to the PR and its author", () => {
    expect(dryRun("workflow-run-failed-on-pr.json")).toEqual([]);
  });

  it("ignores its own failure — the guard that stops the lane feeding itself", () => {
    expect(dryRun("workflow-run-repair-self.json")).toEqual([]);
  });

  it("does nothing at all for a run that succeeded", () => {
    const dir = mkdtempSync(join(tmpdir(), "repair-"));
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
    const out = execFileSync(
      "node",
      ["scripts/moneypenny/repair.mjs", "--dry-run", "--event", file],
      {
        encoding: "utf8",
      },
    );
    rmSync(dir, { recursive: true, force: true });

    expect(JSON.parse(out)).toEqual([]);
  });
});

describe("moneypenny repair — the issue it writes", () => {
  it("satisfies the capsule contract it asks humans to follow (docs/ISSUES.md)", () => {
    const [intent] = dryRun("workflow-run-failed.json");
    const dir = mkdtempSync(join(tmpdir(), "repair-body-"));
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

// 2026-08-26, run 33021825722: this lane filed #670 with an empty evidence fold reading "(log
// fetch failed: the response contains terminal escape sequences; pass --allow-escape-sequences to
// output it anyway)". Actions logs are colourized and `gh api` refuses to print them by default,
// so the repair session it dispatched opened with no evidence at all. That failure, specced.
describe("moneypenny repair — fetching the evidence", () => {
  it("asks gh for a colourized log, which it refuses to print unless asked", () => {
    const [best] = logArgVariants(98353791650);

    expect(best).toContain("--allow-escape-sequences");
    expect(best?.at(-1)).toBe("repos/{owner}/{repo}/actions/jobs/98353791650/logs");
  });

  it("keeps a bare fallback for a gh too old to know the flag", () => {
    const variants = logArgVariants(1);

    expect(variants).toHaveLength(2);
    expect(variants.at(-1)).not.toContain("--allow-escape-sequences");
  });

  it("strips the escapes, the BOM and the timestamps so the fold reads as text", () => {
    const raw = "\uFEFF2026-08-26T23:03:39.9335057Z \x1b[31mError: unauthorized\x1b[0m";

    expect(sanitizeLog(raw)).toBe("Error: unauthorized");
  });

  it("leaves the Actions annotations alone — they are the diagnosis, not decoration", () => {
    const raw = "2026-08-26T23:03:39.9371678Z ##[error]App creation was refused";

    expect(sanitizeLog(raw)).toBe("##[error]App creation was refused");
  });
});
