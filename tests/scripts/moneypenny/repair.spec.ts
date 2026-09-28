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

/**
 * The same dry run over a payload written on the spot — for the matrix cases, where the variable
 * is the JOB NAME and a committed fixture per variant would be a file per assertion.
 */
const dryRunPayload = (payload: object): Intent[] => {
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

/** A failed run on `main`, with whatever failing jobs the case is about. */
const failedRun = (jobs: string[], openIssues: Intent["title"][] = []) => ({
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

describe("moneypenny repair — routing a failed run", () => {
  it("files one capsule issue for a fresh failure on main, and asks for a repair session", () => {
    const [intent, ...rest] = dryRun("workflow-run-failed.json");

    expect(rest).toEqual([]);
    expect(intent?.type).toBe("open-issue");
    expect(intent?.title).toBe(
      "[ci] Moneypenny Events (event-research automation) — build feedback issue",
    );
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

// #3913 gap 1, measured 2026-09-28: `research due events` is ONE failing job, but GitHub reports it
// once per matrix leg with the leg's values in the name — so the signature was unique per event and
// one fault filed 19 open `ci-failure` issues (35% of the backlog), 16 of them over the 120-char
// title ceiling. The leg is evidence; the job is the key.
describe("moneypenny repair — a matrix job is one fault, not one per leg", () => {
  const legs = [
    "research due events (fomc-2026-09-16, event-passed-unscored)",
    "research due events (uk-cpi-2026-09-16, event-passed-unscored)",
    "research due events (vix-expiration-2026-09-16, event-passed-unscored)",
  ];
  const folded = "[ci] Moneypenny Events (event-research automation) — research due events";

  it("files one issue for a run where three legs of the same job failed", () => {
    const intents = dryRunPayload(failedRun(legs));

    expect(intents).toHaveLength(1);
    expect(intents[0]?.type).toBe("open-issue");
    expect(intents[0]?.title).toBe(folded);
    expect(intents[0]?.title?.length).toBeLessThanOrEqual(120);
  });

  it("keeps the other legs as evidence in the fold rather than dropping them", () => {
    const body = dryRunPayload(failedRun(legs))[0]?.body ?? "";

    expect(body).toContain("**`research due events` failed on `main`");
    expect(body).toContain("| **Legs failed** | 3 of this job, in this one run |");
    expect(body).toContain("The other 2 matrix legs that failed in this run:");
    expect(body).toContain("uk-cpi-2026-09-16");
    expect(body.indexOf("uk-cpi-2026-09-16")).toBeGreaterThan(body.indexOf("<details>"));
  });

  it("comments once on the already-open issue, whatever the leg count", () => {
    const intents = dryRunPayload(failedRun(legs, [folded]));

    expect(intents).toHaveLength(1);
    expect(intents[0]?.type).toBe("comment");
    expect(intents[0]?.issue).toBe(900);
    expect(intents[0]?.body).toContain("3 matrix legs of this job failed in that one run");
  });

  it("still separates two genuinely different failing jobs", () => {
    const intents = dryRunPayload(failedRun([legs[0] as string, "route"]));

    expect(intents.map((i) => i.title)).toEqual([
      folded,
      "[ci] Moneypenny Events (event-research automation) — route",
    ]);
  });

  it("strips only the trailing group, so a job named with a parenthetical keeps it", () => {
    const [intent] = dryRunPayload(failedRun(["verify (strict) (node-24, ubuntu)"]));

    expect(intent?.title).toBe(
      "[ci] Moneypenny Events (event-research automation) — verify (strict)",
    );
  });

  // #3229: GitHub truncates a job name at 100 chars and appends a literal `...`, so the leg's
  // values arrive with no closing paren — and that issue's title reached 153 chars.
  it("folds a leg GitHub truncated mid-parenthetical, closing paren and all", () => {
    const truncated =
      "research due events (mu-2026-09-30-print, interval-elapsed, staleness-ceiling, 2026-09-16, bar-cl...";
    const [intent] = dryRunPayload(failedRun([truncated, legs[0] as string]));

    expect(intent?.title).toBe(folded);
    expect(intent?.body).toContain("| **Legs failed** | 2 of this job, in this one run |");
  });

  it("clamps the title to issue-lint's fatal ceiling, so the lane passes its own gate", () => {
    const [intent] = dryRunPayload(failedRun([`deploy ${"the-observatory-bundle-".repeat(5)}`]));

    expect(intent?.title?.length).toBe(120);
    expect(intent?.title?.endsWith("…")).toBe(true);
  });

  it("flags a leg that died at a different step — folding must not hide a second fault", () => {
    const payload = failedRun([legs[0] as string, legs[1] as string]);
    payload.failures[1] = { job: legs[1] as string, step: "Record this session's cost" };
    const body = dryRunPayload(payload)[0]?.body ?? "";

    expect(body).toContain("died at `Record this session's cost`");
    expect(body).toContain("may be a second fault");
  });

  it("leaves an all-parentheses job name alone — the rejected-workflow shape is not a matrix leg", () => {
    const [intent] = dryRunPayload(failedRun(["(the workflow never started)"]));

    expect(intent?.title).toBe(
      "[ci] Moneypenny Events (event-research automation) — (the workflow never started)",
    );
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
