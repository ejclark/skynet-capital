import { readFileSync } from "node:fs";
import { limitRejected } from "../../../scripts/moneypenny/repair.mjs";
import { dryRun, dryRunPayload, failedRun, lintCapsule } from "./repair-fixtures";

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
