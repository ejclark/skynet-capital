import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import {
  limitRejected,
  REOPEN_MARKER,
  readFailures,
  recurrenceCount,
  reopenable,
  routeFailure,
  withRecurrence,
} from "../../../scripts/moneypenny/repair.mjs";
import {
  annotationLines,
  logArgVariants,
  sanitizeLog,
} from "../../../scripts/moneypenny/repair-logs.mjs";

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

/** issue-lint exits non-zero on a problem, and execFileSync throws on that. */
const lintCapsule = (intent: Intent | undefined): string => {
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

  it("names a runner outage as one — never as a rejected workflow file", () => {
    // #4656: run 37370406790's jobs queued 15 minutes, got no runner, and were cancelled unstarted.
    // With no `failure` job to find, the lane filed "GitHub rejected the workflow file" for a file
    // that parsed fine, and dispatched a repair session to hunt a syntax error that did not exist.
    const [intent, ...rest] = dryRun("workflow-run-runner-starved.json");

    expect(rest).toEqual([]);
    expect(intent?.type).toBe("open-issue");
    expect(intent?.title).toBe(
      "[ci] Moneypenny Events (event-research automation) — (no runner was ever assigned)",
    );
    expect(intent?.body).toContain("`route` (ubuntu-latest)");
    expect(intent?.body).toContain("`sync project status` (ubuntu-latest)");
    expect(intent?.body).not.toContain("dep-warden review");
    expect(intent?.body).toContain("gh run rerun 37370406790 --failed");
    expect(intent?.body).not.toContain("rejected the workflow file");
  });

  // #6356: Pipeline run 41103012157 failed at `release · deploy bots`, but the triage's read of its
  // jobs showed no failed one, and the lane filed "GitHub rejected the workflow file" for a run
  // named `Pipeline` with five jobs — so the deploy-bots recurrence never reached its open capsule.
  const parsedRunReadEarly = {
    repository: { default_branch: "main" },
    workflow_run: {
      id: 41103012157,
      name: "Pipeline",
      path: ".github/workflows/pipeline.yml",
      conclusion: "failure",
      event: "push",
      head_branch: "main",
      html_url: "https://github.com/ejclark/skynet-capital/actions/runs/41103012157",
    },
    jobs: [
      { id: 1, name: "release · deploy", conclusion: "success", runner_name: "r", steps: [] },
      { id: 2, name: "release · deploy bots", status: "in_progress", runner_name: "r", steps: [] },
      { id: 3, name: "verify", conclusion: "skipped", runner_name: "", steps: [] },
    ],
    deps: { openIssues: [] },
  };

  it("never calls a run that parsed a rejected workflow file", () => {
    const [intent, ...rest] = dryRunPayload(parsedRunReadEarly);

    expect(rest).toEqual([]);
    expect(intent?.title).toBe("[ci] Pipeline — (the failed job could not be read)");
    expect(intent?.body).not.toContain("rejected the workflow file");
    expect(intent?.body).toContain("`release · deploy bots` (in_progress)");
    expect(intent?.body).toContain("gh run view 41103012157 --json jobs");
  });

  it("still calls zero jobs on a path-named run a rejected file, even with `path` set", () => {
    const payload = structuredClone(parsedRunReadEarly);
    payload.workflow_run.name = ".github/workflows/pipeline.yml";
    payload.jobs = [];
    const [intent] = dryRunPayload(payload);

    expect(intent?.body).toContain("zero jobs were created");
  });

  it("names the step a lost runner left unfinished — never 'unknown'", () => {
    // #6033: run 40304642365's research leg died 50 minutes in with claude-code-action frozen at
    // `in_progress`. No step failed, so the capsule read "Failing step: unknown" over an empty
    // fold, and the repair session had to dig the "runner lost communication" annotation out itself.
    const [intent, ...rest] = dryRun("workflow-run-runner-lost.json");
    const body = intent?.body ?? "";

    expect(rest).toEqual([]);
    expect(intent?.title).toBe(
      "[ci] Moneypenny Events (event-research automation) — research due events",
    );
    expect(body).toContain(
      "| **Failing step** | Run anthropics/claude-code-action@cab360f6565aa35a51d6ce9e43f1f4287c0a32ea (never finished — the runner went away mid-step) |",
    );
    expect(body).not.toContain("| **Failing step** | unknown |");
    expect(body).toContain("check-runs/121511697452/annotations");
    expect(body).toContain("gh run rerun 40304642365 --failed");
  });

  it("keeps 'unknown' for a failed job whose steps all finished — no runner story invented", () => {
    const payload = JSON.parse(
      readFileSync("tests/fixtures/events/workflow-run-runner-lost.json", "utf8"),
    );
    for (const step of payload.jobs[1].steps) step.status = "completed";
    const [intent] = dryRunPayload(payload);

    expect(intent?.body).toContain("| **Failing step** | unknown |");
    expect(intent?.body).not.toContain("runner went away");
  });

  it("still reports the real failure when a run has one beside a starved job", () => {
    const payload = JSON.parse(
      readFileSync("tests/fixtures/events/workflow-run-runner-starved.json", "utf8"),
    );
    payload.jobs.push({
      id: 1,
      name: "build feedback issue",
      conclusion: "failure",
      runner_name: "GitHub Actions 1",
      steps: [{ name: "Run claude-code-action", conclusion: "failure" }],
    });
    const [intent, ...rest] = dryRunPayload(payload);

    expect(rest).toEqual([]);
    expect(intent?.title).toBe(
      "[ci] Moneypenny Events (event-research automation) — build feedback issue",
    );
    expect(intent?.body).toContain("Run claude-code-action");
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

// Study 2026-11-01 ("limit rejections are not faults"): a lane the usage limit refused dies as a
// red run, and this lane read every such run as a fault — #6098 took 16 recurrence comments in 15
// hours from one session limit. A repair session cannot fix a refusal. The two real log shapes that
// NAME a limit, numbers only: the output file's `rate_limit_event` with status rejected, and the
// envelope's `api_error_status` 429. The action's own result print (is_error true, zero cost, one
// turn) names nothing, and an expired token prints the same thing (#6579's first scenario).
describe("moneypenny repair — a usage-limit rejection is not a fault", () => {
  const shortPrint =
    '{\n  "type": "result",\n  "subtype": "success",\n  "is_error": true,\n  "duration_ms": 394,\n  "num_turns": 1,\n  "total_cost_usd": 0,\n  "permission_denials_count": 0\n}\n';
  const rejectedEvent =
    '{\n  "type": "rate_limit_event",\n  "rate_limit_info": {\n    "status": "rejected",\n    "rateLimitType": "five_hour"\n  }\n}\n';
  const realFailure =
    '{\n  "type": "result",\n  "subtype": "success",\n  "is_error": true,\n  "duration_ms": 106446,\n  "num_turns": 25,\n  "total_cost_usd": 0.9303738000000001\n}\n{\n  "type": "rate_limit_event",\n  "rate_limit_info": {\n    "status": "allowed_warning"\n  }\n}\n';
  // What the CLI really returned for an invalid CLAUDE_CODE_OAUTH_TOKEN, cut to the fields that count.
  const authFailure =
    '{\n  "total_cost_usd": 0,\n  "terminal_reason": "api_error",\n  "is_error": true,\n  "num_turns": 1,\n  "subtype": "success",\n  "api_error_status": 401,\n  "result": "Failed to authenticate. API Error: 401 Invalid bearer token",\n  "type": "result"\n}\n';

  it("reads the two shapes that name a limit, and not a session that ran and then failed", () => {
    expect(limitRejected(rejectedEvent)).toBe(true);
    expect(limitRejected('"api_error_status": 429,')).toBe(true);
    expect(limitRejected(realFailure)).toBe(false);
    expect(limitRejected("")).toBe(false);
    expect(limitRejected(undefined)).toBe(false);
    // The lane's own script text mentions the field names; prose is not an envelope.
    expect(limitRejected('COST=$(jq -r "$F | .total_cost_usd"); echo is_error=$ERR')).toBe(false);
    // A transient 429 the CLI retried leaves this line too; alone it says nothing about the death.
    expect(limitRejected('"error": "rate_limit",\n"is_api_error_message": true')).toBe(false);
  });

  it("does not take a first-call death at zero cost for a limit: an expired token dies that way", () => {
    expect(limitRejected(shortPrint)).toBe(false);
    expect(limitRejected(authFailure)).toBe(false);
  });

  it("lets the session's own last API status overrule a limit event earlier in its log", () => {
    expect(limitRejected(`${rejectedEvent}${authFailure}`)).toBe(false);
    expect(limitRejected(`"api_error_status": 401,\n"api_error_status": 429,`)).toBe(true);
  });

  it("files an expired token, in the full log and in the short print, and asks for a repair", () => {
    for (const logTail of [authFailure, shortPrint]) {
      const payload = failedRun(["research due events (x)"]);
      payload.failures[0] = { ...payload.failures[0], logTail } as never;
      const [intent, ...rest] = dryRunPayload(payload);
      expect(rest).toEqual([]);
      expect(intent).toMatchObject({ type: "open-issue", dispatch: true });
    }
  });

  it("comments a recurrence of it on the open capsule — a dead token stays loud", () => {
    const title = "[ci] Moneypenny Events (event-research automation) — research due events";
    const payload = failedRun(["research due events (x)"], [title]);
    payload.failures[0] = { ...payload.failures[0], logTail: shortPrint } as never;
    expect(dryRunPayload(payload).map((i) => i.type)).toEqual(["comment"]);
  });

  it("tells the capsule's reader what an unexplained death may be, and only then", () => {
    const body = (logTail: string) => {
      const payload = failedRun(["research due events (x)"]);
      payload.failures[0] = { ...payload.failures[0], logTail } as never;
      return dryRunPayload(payload)[0]?.body ?? "";
    };
    const note = "no API status in this log";

    expect(body(shortPrint)).toContain(note);
    expect(body(realFailure)).toContain(note);
    expect(body(authFailure)).not.toContain(note);
    expect(body("##[error]Process completed with exit code 1.")).not.toContain(note);
  });

  it("keeps the note inside the capsule contract", () => {
    const payload = failedRun(["research due events (x)"]);
    payload.failures[0] = { ...payload.failures[0], logTail: shortPrint } as never;
    expect(lintCapsule(dryRunPayload(payload)[0])).toContain("satisfies the capsule contract");
  });

  // A limit can only end a step that runs a Claude session. A failing spec's code frame or a printed
  // fixture can carry these exact strings in any job's log, and that is a test failure, not a limit.
  it("does not read a job that ran no Claude session as a limit, whatever its log quotes", () => {
    const quoted = `expect(limitRejected('"api_error_status": 429,')).toBe(true);\n${rejectedEvent}`;
    const payload = {
      ...failedRun(["verify"]),
      failures: [{ job: "verify", step: "Run npm test", logTail: quoted }],
    };
    expect(dryRunPayload(payload).map((i) => i.type)).toEqual(["open-issue"]);

    const unnamed = { ...payload, failures: [{ job: "verify", logTail: quoted }] };
    expect(dryRunPayload(unnamed).map((i) => i.type)).toEqual(["open-issue"]);
  });

  it("does not send a job that ran no Claude session to check its token", () => {
    const payload = {
      ...failedRun(["verify"]),
      failures: [{ job: "verify", step: "Run npm test", logTail: shortPrint }],
    };
    expect(dryRunPayload(payload)[0]?.body).not.toContain("no API status in this log");
  });

  it("knows the step as the real workflows name it, pin and all", () => {
    const payload = {
      ...failedRun(["build plan issue"]),
      failures: [
        {
          job: "build plan issue",
          step: "Run anthropics/claude-code-action@1d6de8cb0c237e7c15e9e1bdf973826ebae490cc",
          logTail: rejectedEvent,
        },
      ],
    };
    expect(dryRunPayload(payload).map((i) => i.type)).toEqual(["skip"]);
  });

  it("a session that worked for 25 turns and then died on the limit is still a refusal", () => {
    // A research leg beside #6098: 25 turns, $0.93, then the five-hour window closed on it.
    const spentThenRejected = `${realFailure.replace("allowed_warning", "rejected")}`;
    expect(limitRejected(spentThenRejected)).toBe(true);
    const payload = failedRun(
      ["research due events (x)"],
      ["[ci] Moneypenny Events (event-research automation) — research due events"],
    );
    payload.failures[0] = { ...payload.failures[0], logTail: spentThenRejected } as never;
    expect(dryRunPayload(payload).map((i) => i.type)).toEqual(["skip"]);
  });

  it("skips the rejected leg: no capsule, no recurrence comment, no repair session", () => {
    const intents = dryRun("workflow-run-limit-rejected.json");
    expect(intents.map((i) => i.type)).toEqual(["skip"]);
    expect(intents[0]?.reason).toContain("usage limit");
    expect(intents[0]?.issue).toBe(900);
  });

  it("opens nothing when no capsule is open either — a refusal never files one", () => {
    const fixture = JSON.parse(
      readFileSync("tests/fixtures/events/workflow-run-limit-rejected.json", "utf8"),
    );
    const intents = dryRunPayload({ ...fixture, deps: { openIssues: [] } });
    expect(intents.map((i) => i.type)).toEqual(["skip"]);
    expect(intents[0]?.issue).toBeUndefined();
  });

  it("still files a leg that spent real turns and money, whatever the limit warning says", () => {
    const payload = failedRun(["research due events (x)"]);
    payload.failures[0] = { ...payload.failures[0], logTail: realFailure } as never;
    expect(dryRunPayload(payload).map((i) => i.type)).toEqual(["open-issue"]);
  });

  it("files the real leg of a matrix run whose other leg was refused, and only that one", () => {
    const payload = failedRun(["research due events (a)", "research due events (b)"]);
    payload.failures[0] = { ...payload.failures[0], logTail: rejectedEvent } as never;
    payload.failures[1] = { ...payload.failures[1], logTail: realFailure } as never;
    const intents = dryRunPayload(payload);
    expect(intents.map((i) => i.type)).toEqual(["open-issue"]);
    expect(intents[0]?.body).not.toContain("research due events (a)");
  });
});

// #6579's second scenario: the evidence of a limit lives in the session's output file, which GitHub
// never sees unless a workflow step prints it. Only the research lane does. The build legs of runs
// 40338251576 (19 turns, $0.85) and 40450370027 (19 turns, $0.99) print the action's short result
// instead, so a limit death there cannot be told from any other failure, and stays a fault.
describe("moneypenny repair — only a lane that prints the evidence can show a limit", () => {
  const title = "[ci] Moneypenny Events (event-research automation) — build feedback issue";
  const leg = (logTail: string, open: string[] = []) => {
    const payload = failedRun(["build feedback issue"], open);
    payload.failures[0] = { ...payload.failures[0], logTail } as never;
    return dryRunPayload(payload);
  };
  const buildLegPrint =
    '{\n  "type": "result",\n  "subtype": "success",\n  "is_error": true,\n  "duration_ms": 240000,\n  "num_turns": 19,\n  "total_cost_usd": 0.8507,\n  "permission_denials_count": 0\n}\n';
  // What the build lanes print once their workflow step lands (the result's fields, no transcript).
  const printedEvidence = (status: number, event: string) =>
    `[\n  {\n    "type": "rate_limit_event",\n    "rate_limit_info": {\n      "status": "${event}",\n      "rateLimitType": "five_hour",\n      "resetsAt": 1793025000\n    }\n  },\n  {\n    "type": "result",\n    "is_error": true,\n    "num_turns": 19,\n    "total_cost_usd": 0.8507,\n    "terminal_reason": "api_error",\n    "api_error_status": ${status}\n  }\n]`;

  it("keeps a build leg's bare print loud: it cannot show a limit, so it may not claim one", () => {
    expect(leg(buildLegPrint)[0]).toMatchObject({ type: "open-issue", title, dispatch: true });
    expect(leg(buildLegPrint, [title]).map((i) => i.type)).toEqual(["comment"]);
  });

  it("reads the same leg as a refusal once the lane prints what ended the session", () => {
    const refused = `${buildLegPrint}${printedEvidence(429, "rejected")}`;
    expect(leg(refused).map((i) => i.type)).toEqual(["skip"]);
    expect(leg(refused, [title]).map((i) => i.type)).toEqual(["skip"]);
  });

  it("still files that leg when what it prints names another cause", () => {
    expect(leg(`${buildLegPrint}${printedEvidence(401, "allowed")}`)[0]?.type).toBe("open-issue");
  });

  // By the step's name, not the file's: the usage reading step names the same file and prints nothing
  // a failure can be read from. `dep-warden` only runs on `pull_request`, and `routeFailure` ignores
  // those, so its print could never be read.
  it("lets no new Claude lane on main ship without printing what ended its session", () => {
    const workflow = readFileSync(".github/workflows/moneypenny-events.yml", "utf8");
    // One block per job (two-space keys under `jobs:`), comments out: they mention the file too.
    const jobs = workflow
      .slice(workflow.indexOf("\njobs:\n"))
      .split(/^(?= {2}[a-z][\w-]*:$)/m)
      .slice(1)
      .map((block) => block.replace(/^\s*#.*$/gm, ""));
    const runsClaude = jobs.filter((job) => job.includes("uses: anthropics/claude-code-action@"));
    const silent = runsClaude
      .filter((job) => !job.includes("Surface the swallowed Claude result on failure"))
      .map((job) => job.trim().split(":")[0] ?? "");

    expect(runsClaude.length).toBeGreaterThanOrEqual(4);
    expect(silent.filter((n) => n !== "dep-warden")).toEqual([]);
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

    expect(lintCapsule(intent)).toContain("satisfies the capsule contract");
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

  it("falls back to the job's failure annotations — where a lost runner's diagnosis lives (#6033)", () => {
    const annotations = [
      {
        annotation_level: "failure",
        message: "The hosted runner lost communication with the server.",
      },
      {
        annotation_level: "notice",
        message: "The ubuntu-latest label will migrate to Ubuntu 26 beginning October 19, 2026.",
      },
    ];

    expect(annotationLines(annotations)).toEqual([
      "##[error]The hosted runner lost communication with the server.",
    ]);
    expect(annotationLines({ message: "Not Found" })).toEqual([]);
  });
});

// #4374, measured 2026-10-01: guard 3's dedupe reads only OPEN capsules, so the window shuts the
// instant the fixing PR merges — while runs started on pre-fix commits keep finishing for minutes
// after. Run 36800376847 started 01:17:21Z on `ec0605b8`; #4361 merged and closed #4359 (identical
// signature) at 01:20:06Z; 49s later this lane filed #4374 as a brand-new fault and burned a full
// Opus repair session on a bug that no longer existed. The guard is purely temporal — a run that
// STARTED before the fix merged cannot have carried it — so it can never silence the net.
describe("moneypenny repair — a run already fixed while it was in flight", () => {
  const signature = "[ci] Moneypenny Events (event-research automation) — build plan issue";

  /** The #4374 shape: a failed run, plus a closed capsule for the same signature. */
  const inFlight = (
    runStartedAt: string,
    closedAt: string | undefined,
    title = signature,
    stateReason: string | undefined = "COMPLETED",
  ) => ({
    repository: { default_branch: "main" },
    workflow_run: {
      id: 36800376847,
      name: "Moneypenny Events (event-research automation)",
      conclusion: "failure",
      event: "workflow_dispatch",
      head_branch: "main",
      head_sha: "ec0605b8aa474d1eb59e2a686f9d734b37c9703a",
      run_started_at: runStartedAt,
      html_url: "https://github.com/ejclark/skynet-capital/actions/runs/36800376847",
    },
    failures: [{ job: "build plan issue", step: "Run anthropics/claude-code-action" }],
    deps: { openIssues: [], closedIssues: [{ number: 4359, title, closedAt, stateReason }] },
  });

  it("comments on the closed capsule instead of filing a fresh one", () => {
    const intents = dryRunPayload(inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z"));

    expect(intents).toHaveLength(1);
    expect(intents[0]?.type).toBe("comment");
    expect(intents[0]?.issue).toBe(4359);
  });

  it("dispatches no repair session — the whole cost this guard exists to avoid", () => {
    const intents = dryRunPayload(inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z"));

    expect(intents.some((i) => i.type === "open-issue")).toBe(false);
    expect(intents.every((i) => !("dispatch" in i))).toBe(true);
  });

  it("says why it stayed quiet, with both timestamps — silence is not an option", () => {
    const body = dryRunPayload(inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z"))[0]?.body;

    expect(body).toContain("Stale echo, not a recurrence");
    expect(body).toContain("2026-10-01T01:17:21Z");
    expect(body).toContain("2026-10-01T01:20:06Z");
    expect(body).toContain("ec0605b8");
  });

  // A run that started after the close carried the fix, so the fault outlived it: loud, and on the
  // same number since #6953 — the capsule reopens rather than a new one being filed.
  it("reopens the capsule when the fault outlives the fix — the run started AFTER the close", () => {
    const intents = dryRunPayload(inFlight("2026-10-01T01:25:00Z", "2026-10-01T01:20:06Z"));

    expect(intents[0]).toMatchObject({ type: "reopen-issue", issue: 4359, dispatch: true });
    expect(intents[0]?.title).toBe(signature);
  });

  it("files when the closed capsule is a different signature", () => {
    const intents = dryRunPayload(
      inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z", "[ci] Pipeline — release · deploy"),
    );

    expect(intents[0]?.type).toBe("open-issue");
    expect(intents[0]?.title).toBe(signature);
  });

  // Fail-safe direction: this guard may only suppress a report it can PROVE is stale. Where a
  // timestamp is missing or unparseable it must fall through to filing — a lane that goes quiet on
  // a malformed payload is worse than one that files twice.
  it("files when the run carries no start time to compare against", () => {
    const payload = inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z") as {
      workflow_run: { run_started_at?: string };
    };
    delete payload.workflow_run.run_started_at;

    expect(dryRunPayload(payload)[0]?.type).toBe("open-issue");
  });

  it("files when the closed capsule carries no close time", () => {
    expect(dryRunPayload(inFlight("2026-10-01T01:17:21Z", undefined))[0]?.type).toBe("open-issue");
  });

  it("files when a timestamp is present but unparseable", () => {
    expect(dryRunPayload(inFlight("2026-10-01T01:17:21Z", "not a date"))[0]?.type).toBe(
      "open-issue",
    );
  });

  // Guard 3 still wins: an OPEN capsule means the fault is live, whatever a closed twin says.
  it("prefers the open capsule's recurrence comment over the stale-echo path", () => {
    const payload = inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z");
    payload.deps.openIssues = [{ number: 4374, title: signature, labels: [] }] as never;

    const [intent] = dryRunPayload(payload);
    expect(intent?.issue).toBe(4374);
    expect(intent?.body).toContain("Failed again");
  });

  // #6579's third scenario. The audit tick closes a capsule once three runs pass, as "not planned",
  // with no fix anywhere (capsule-stall.mjs). It rides every push, so that close overlaps the push's
  // own Pipeline run — and if that run then fails, nothing about it predates a fix.
  it("reports a failure in a run that overlaps a proof close: no fix merged, so nothing is stale", () => {
    const intents = dryRunPayload(
      inFlight("2026-11-01T12:38:50Z", "2026-11-01T12:41:24Z", signature, "NOT_PLANNED"),
    );

    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({ type: "reopen-issue", title: signature, dispatch: true });
  });

  it("reports when the closed capsule does not say why it closed — it may only suppress on proof", () => {
    const payload = inFlight("2026-10-01T01:17:21Z", "2026-10-01T01:20:06Z");
    delete (payload.deps.closedIssues[0] as { stateReason?: string }).stateReason;

    expect(dryRunPayload(payload)[0]).toMatchObject({ type: "reopen-issue", dispatch: true });
  });

  // The whole guard hangs on `closedIssues()` asking gh for the reason: a stub that returns only the
  // fields it was asked for, as gh does, turns a dropped field into a filed capsule here.
  describe("through the live gather, against a gh that returns only the fields it is asked for", () => {
    const liveRun = (stateReason: string) => {
      const dir = mkdtempSync(join(tmpdir(), "repair-gh-"));
      try {
        const log = join(dir, "gh.log");
        const out = join(dir, "output");
        const closed = {
          number: 4359,
          title: signature,
          closedAt: "2026-11-01T12:41:24Z",
          stateReason,
          labels: [{ name: "ci-failure" }, { name: "stall-flagged" }],
          body: "| | |\n|---|---|\n| **Run** | [1](u) |",
        };
        writeFileSync(
          join(dir, "gh"),
          `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(args) + "\\n");
if (args[0] === "issue" && args[1] === "list") {
  const fields = args[args.indexOf("--json") + 1].split(",");
  const rows = args[args.indexOf("--state") + 1] === "closed" ? [${JSON.stringify(closed)}] : [];
  console.log(JSON.stringify(rows.map((r) => Object.fromEntries(fields.map((f) => [f, r[f]])))));
} else if (args[0] === "issue" && args[1] === "create") {
  console.log("https://github.com/ejclark/skynet-capital/issues/9001");
} else {
  console.log("[]");
}
`,
          { mode: 0o755 },
        );
        const event = join(dir, "event.json");
        const { deps: _deps, ...payload } = inFlight(
          "2026-11-01T12:38:50Z",
          "2026-11-01T12:41:24Z",
          signature,
          stateReason,
        );
        writeFileSync(event, JSON.stringify(payload));
        execFileSync("node", ["scripts/moneypenny/repair.mjs", "--event", event], {
          encoding: "utf8",
          env: {
            ...process.env,
            PATH: `${dir}${delimiter}${process.env.PATH}`,
            GITHUB_OUTPUT: out,
          },
        });
        const calls: string[][] = readFileSync(log, "utf8")
          .trim()
          .split("\n")
          .map((line) => JSON.parse(line));
        const dispatched = existsSync(out) ? readFileSync(out, "utf8") : "";
        return { calls, dispatched };
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    };
    const did = (calls: string[][], verb: string) =>
      calls.some(([cmd, sub]) => cmd === "issue" && sub === verb);

    it("reopens, counts and dispatches past a proof close — one number, not a new one", () => {
      const { calls, dispatched } = liveRun("NOT_PLANNED");
      expect(did(calls, "create")).toBe(false);
      expect(did(calls, "reopen")).toBe(true);
      const edit = calls.find(([cmd, sub]) => cmd === "issue" && sub === "edit");
      expect(edit?.at(-1)).toContain("| **Came back after a close** | 1 time |");
      expect(calls).toContainEqual([
        "api",
        "-X",
        "DELETE",
        "repos/{owner}/{repo}/issues/4359/labels/stall-flagged",
      ]);
      expect(dispatched).toContain("issue=4359");
    });

    it("still stays quiet past a close a merged fix made", () => {
      const { calls, dispatched } = liveRun("COMPLETED");
      expect(did(calls, "comment")).toBe(true);
      expect(did(calls, "create")).toBe(false);
      expect(dispatched).toBe("");
    });
  });
});

// #6356, the live half: the jobs read that came back empty was GitHub lagging (the same endpoint
// answered 502 minutes later). A re-read after a wait finds the real failed job, which then
// routes as a recurrence onto its open capsule instead of a new mislabelled one.
describe("moneypenny repair — re-reading a run's jobs before filing a guess", () => {
  const run = { id: 7, name: "Pipeline", conclusion: "failure" };
  const failed = [
    {
      id: 2,
      name: "release · deploy bots",
      conclusion: "failure",
      runner_name: "r",
      steps: [{ name: "Smoke test the bots release", conclusion: "failure" }],
    },
  ];
  const reads = (...answers: (object[] | Error)[]) => {
    let i = 0;
    return () => {
      const answer = answers[Math.min(i++, answers.length - 1)] ?? [];
      if (answer instanceof Error) throw answer;
      return answer;
    };
  };

  it("waits and re-reads until the failed job shows up", () => {
    const waited: number[] = [];
    const failures = readFailures(run, {
      fetchJobs: reads([], new Error("HTTP 502"), failed),
      logOf: () => "log",
      sleep: (ms: number) => waited.push(ms),
      waits: [1, 2, 3],
    });

    expect(failures).toEqual([
      { job: "release · deploy bots", step: "Smoke test the bots release", logTail: "log" },
    ]);
    expect(waited).toEqual([1, 2]);
  });

  it("files the honest unread shape once the waits run out", () => {
    const failures = readFailures(run, {
      fetchJobs: reads([]),
      logOf: () => "",
      sleep: () => undefined,
      waits: [1, 2],
    });

    expect(failures[0]?.job).toBe("(the failed job could not be read)");
  });

  // #6406: run 41121443220 concluded failure while every read for a minute still had `release ·
  // deploy bots` at `in_progress`, so the lane filed the unread shape beside #5955's open capsule.
  const stillRunning = [
    { id: 2, name: "release · deploy bots", status: "in_progress", conclusion: null, steps: [] },
    { id: 3, name: "verify", status: "completed", conclusion: "skipped", steps: [] },
  ];

  it("keeps re-reading past the first minute while a job still reads as running", () => {
    const waited: number[] = [];
    const failures = readFailures(run, {
      fetchJobs: reads(stillRunning, stillRunning, stillRunning, failed),
      logOf: () => "log",
      sleep: (ms: number) => waited.push(ms),
      waits: [1, 2],
      staleWaits: [60, 60],
    });

    expect(failures[0]?.job).toBe("release · deploy bots");
    expect(failures[0]?.step).toBe("Smoke test the bots release");
    expect(waited).toEqual([1, 2, 60]);
  });

  it("files the unread shape only once the extended waits also run out", () => {
    const waited: number[] = [];
    const failures = readFailures(run, {
      fetchJobs: reads(stillRunning),
      logOf: () => "",
      sleep: (ms: number) => waited.push(ms),
      waits: [1],
      staleWaits: [60, 60],
    });

    expect(failures[0]?.job).toBe("(the failed job could not be read)");
    expect(waited).toEqual([1, 60, 60]);
  });

  it("does not extend the waits for a read with no job still running", () => {
    const waited: number[] = [];
    readFailures(run, {
      fetchJobs: reads([{ ...stillRunning[1] }]),
      logOf: () => "",
      sleep: (ms: number) => waited.push(ms),
      waits: [1, 2],
      staleWaits: [60],
    });

    expect(waited).toEqual([1, 2]);
  });

  it("goes red rather than guessing when the last read still throws", () => {
    expect(() =>
      readFailures(run, {
        fetchJobs: reads(new Error("HTTP 502")),
        logOf: () => "",
        sleep: () => undefined,
        waits: [1],
      }),
    ).toThrow("HTTP 502");
  });

  it("does not wait at all on a rejected file — zero jobs on a path-named run is final", () => {
    const waited: number[] = [];
    const failures = readFailures(
      { ...run, name: ".github/workflows/pipeline.yml" },
      { fetchJobs: reads([]), logOf: () => "", sleep: (ms: number) => waited.push(ms) },
    );

    expect(failures[0]?.job).toBe("(the workflow never started)");
    expect(waited).toEqual([]);
  });
});

// #6953 slice 2 — one fault, one number, across closes. Guard 3 read only OPEN capsules, so the
// breaker's `route` failure, proven green and closed by the audit tick between trips, was filed 9
// times in 5 days (#6640 → #6942) and dispatched a repair session each time.
describe("moneypenny repair — a fault back after a close reopens its capsule (#6953)", () => {
  const title = "[ci] Moneypenny Events (event-research automation) — route";
  const runAt = (started: string, id = 1) => ({
    id,
    name: "Moneypenny Events (event-research automation)",
    conclusion: "failure",
    event: "push",
    head_branch: "main",
    run_started_at: started,
    html_url: `https://github.com/o/r/actions/runs/${id}`,
  });
  const failures = [{ job: "route", step: "List due events" }];
  const closed = (number: number, closedAt: string, over: Record<string, unknown> = {}) => ({
    number,
    title,
    closedAt,
    stateReason: "NOT_PLANNED",
    labels: ["ci-failure"],
    body: "| | |\n|---|---|\n| **Run** | [1](u) |",
    ...over,
  });
  const route = (started: string, closedIssues: ReturnType<typeof closed>[], openIssues = []) =>
    routeFailure(
      { run: runAt(started), defaultBranch: "main", failures },
      { openIssues, closedIssues },
    );

  it("reopens a capsule closed within 14 days, with a count, and dispatches a repair", () => {
    const [intent] = route("2026-11-03T00:50:00Z", [closed(6640, "2026-11-02T14:08:20Z")]);
    expect(intent).toMatchObject({ type: "reopen-issue", issue: 6640, dispatch: true });
    expect(intent?.issueBody).toContain("| **Came back after a close** | 1 time |");
    // The recurrence line capsule-stall.mjs keys its proof cut on, and the marker it reads lives by.
    expect(intent?.body?.startsWith("Failed again — run [1]")).toBe(true);
    expect(intent?.body).toContain(REOPEN_MARKER);
  });

  it("files fresh past the window — an old close no longer owns the signature", () => {
    const [intent] = route("2026-11-20T00:00:00Z", [closed(6640, "2026-11-02T14:08:20Z")]);
    expect(intent?.type).toBe("open-issue");
  });

  it("reopens the newest of several closed capsules", () => {
    const back = reopenable(
      runAt("2026-11-06T08:10:00Z"),
      [
        closed(6640, "2026-11-02T14:08:20Z"),
        closed(6921, "2026-11-06T08:09:55Z"),
        closed(6900, "2026-11-05T13:52:30Z"),
      ],
      title,
    );
    expect(back?.number).toBe(6921);
  });

  it("an open capsule still wins: a recurrence comments, it never reopens a closed twin", () => {
    const [intent] = route("2026-11-03T00:50:00Z", [closed(6640, "2026-11-02T14:08:20Z")], [
      { number: 6763, title, labels: [] },
    ] as never);
    expect(intent).toMatchObject({ type: "comment", issue: 6763 });
  });

  it("reopens without a repair session when the close handed its ask to a session, or to Eric", () => {
    for (const label of ["needs-session", "needs-eric"]) {
      const [intent] = route("2026-11-03T00:50:00Z", [
        closed(6640, "2026-11-02T14:08:20Z", { labels: ["ci-failure", label] }),
      ]);
      expect(intent).toMatchObject({ type: "reopen-issue", issue: 6640, dispatch: false });
      expect(intent?.body).toContain(`carries \`${label}\``);
    }
  });

  it("drops the labels that described the last life, and only those present", () => {
    const [intent] = route("2026-11-03T00:50:00Z", [
      closed(6640, "2026-11-02T14:08:20Z", {
        labels: ["ci-failure", "in-progress", "stall-flagged", "released"],
      }),
    ]);
    expect(intent?.removeLabels).toEqual(["in-progress", "stall-flagged"]);
  });

  it("never reopens a duplicate, whose number was retired for another", () => {
    const [intent] = route("2026-11-03T00:50:00Z", [
      closed(6640, "2026-11-02T14:08:20Z", { stateReason: "DUPLICATE" }),
    ]);
    expect(intent?.type).toBe("open-issue");
  });

  it("spends no body edit when the body has no table to count in", () => {
    const [intent] = route("2026-11-03T00:50:00Z", [
      closed(6640, "2026-11-02T14:08:20Z", { body: "no table" }),
    ]);
    expect(intent).toMatchObject({ type: "reopen-issue", issue: 6640 });
    expect(intent?.issueBody).toBeUndefined();
    expect(intent?.body).toContain("come back after a close 1 time");
  });

  it("counts up from the body's row, which sits with the metadata table", () => {
    const body = [
      "| | |",
      "|---|---|",
      "| **Run** | [1](u) |",
      "| **Legs failed** | 2 of this job, in this one run |",
      "",
      "- talking point",
    ].join("\n");
    const once = withRecurrence(body, 1);
    expect(once.split("\n")[4]).toBe("| **Came back after a close** | 1 time |");
    expect(recurrenceCount(once)).toBe(1);
    const thrice = withRecurrence(once, 3);
    expect(recurrenceCount(thrice)).toBe(3);
    expect(thrice.match(/Came back after a close/g)).toHaveLength(1);
    expect(withRecurrence("no table here", 2)).toBe("no table here");
    expect(recurrenceCount(undefined)).toBe(0);
  });

  // The slice's replay check: the measured 2026-11-02..11-06 sequence. Each trip's run starts a few
  // minutes before the capsule it filed; each close is the audit tick's proof close between trips.
  it("replayed over the 11-02..11-06 breaker sequence, files 1 issue number, not 9", () => {
    const trips = [
      ["2026-11-02T00:57:58Z", "2026-11-02T14:08:20Z"],
      ["2026-11-03T00:53:52Z", "2026-11-03T07:40:13Z"],
      ["2026-11-03T07:42:15Z", "2026-11-03T15:59:47Z"],
      ["2026-11-03T16:12:10Z", "2026-11-04T01:55:54Z"],
      ["2026-11-04T02:14:37Z", "2026-11-05T00:49:55Z"],
      ["2026-11-05T00:56:42Z", "2026-11-05T07:23:38Z"],
      ["2026-11-05T07:27:29Z", "2026-11-05T13:52:30Z"],
      ["2026-11-06T00:56:47Z", "2026-11-06T08:09:55Z"],
      ["2026-11-06T08:13:44Z", null],
    ] as const;
    const replay = (reopens: boolean) => {
      let next = 6640;
      const open: { number: number; title: string; labels: string[] }[] = [];
      const shut: ReturnType<typeof closed>[] = [];
      const numbers = new Set<number>();
      for (const [filedAt, closedAt] of trips) {
        const started = new Date(Date.parse(filedAt) - 5 * 60_000).toISOString();
        for (const i of route(started, reopens ? shut : [], open as never)) {
          if (i.type === "open-issue") open.push({ number: next++, title, labels: [] });
          if (i.type === "reopen-issue") {
            shut.splice(
              shut.findIndex((c) => c.number === i.issue),
              1,
            );
            open.push({ number: i.issue as number, title, labels: [] });
          }
        }
        numbers.add(open[0]?.number as number);
        if (closedAt) shut.push(closed(open.shift()?.number as number, closedAt));
      }
      return numbers;
    };
    expect([...replay(true)]).toEqual([6640]);
    // The falsifier's other half: the same trips without the reopen file under 9 numbers.
    expect(replay(false).size).toBe(9);
  });
});
