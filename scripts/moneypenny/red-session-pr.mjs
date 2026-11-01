// A RED PR THAT A SESSION OPENED GETS AN OWNER, FROM THE EVENT THAT REPORTED IT (#6605).
//
// WHY. A hand read of Eric's messages on 2026-11-01 found he spotted the fault first 16 times in 184,
// and 6 of those were PR checks ("5079 fails CI"). Builders stop at opening a PR on purpose (`/ship`:
// never poll), the repair lane drops every pull_request run (repair.mjs `routeFailure`, guard 2), and
// red-lane-pr.mjs only owns a lane's own PRs, a day later. So a session's red PR waited for him.
//
// THE EVENT ALREADY EXISTED. moneypenny-repair.yml fires on every completed Pipeline run, so there is
// no poller here and no workflow edit: triage reaches this file through repair.mjs and decides.
//
// THE ATTEMPT IS A CAPSULE. The repair job starts from the `issue=` output a filed capsule sets, so this
// files one per red PR and the session reads it the way it reads any other. One attempt per PR, behind
// the work dial and the spend breaker, so a build that stays red costs one session and then one line.
//
// THE REST IS ONE LINE ON THE PR: a check that died before it read the PR's code (said, not fixed), a PR
// that changes a protected path, an attempt already spent, a gate that refused. One head gets one line,
// so a re-run never repeats itself, but a re-run that fails on the PR's code can still earn the attempt.
//
// WHAT IT LEAVES ALONE, silently: a `hold-merge` PR (never touched), a lane's or the repair lane's own PR
// (red-lane-pr.mjs owns the first, and the second is the loop guard), dependabot, a stranger, a fork.
// Nothing here merges or arms: the pipeline's arm job does that once the checks pass.
//
// WHAT NEEDS A PROTECTED EDIT. The session's orders still say a run failed on `main`, end a failure it
// cannot fix on `needs-eric`, and ask for an opened PR, so the capsule can only state where the fix
// belongs. And the workflow keys its concurrency on the workflow's name, so a repair session running
// for one PR holds Pipeline's slot and GitHub keeps only the newest event waiting behind it.
//
// SHAPE. Pure core (`routeRedSessionPr`) and a thin gather, like repair.mjs, so every branch is
// fixture-drivable. repair.mjs's `execute` is the act: the triage step runs with no `npm ci`, so nothing
// this file reaches may import a package.
import { readFileSync } from "node:fs";
import { breachOf } from "../envelope-scan.mjs";
import { ARM_GATE_CHECKS, REQUIRED_CHECKS } from "../stuck-pr-decide.mjs";
import { ghRest, ghRestAll, sh, trustedComment, withRetry } from "./gh.mjs";
import { FOOTER, LABELS } from "./labels.mjs";
import { workGate } from "./work-gate.mjs";

/** The one workflow whose PR runs carry the checks that hold a PR. */
const PIPELINE = "Pipeline";
/** Sessions one red PR may cost. A second would only re-read the same diff at Opus rates. */
export const RED_ATTEMPT_CAP = 1;
/** Filled in by the act, once the capsule has a number. */
export const CAPSULE_SLOT = "{capsule}";

const HOLDING = [...REQUIRED_CHECKS, ...ARM_GATE_CHECKS];
/** The last line of every session's PR body (`ship.sh checkbody`, .github/pull_request_template.md). */
const SESSION_FOOTER = /Generated (?:with|by) \[Claude Code\]/;

/** Steps that run before the PR's code does. Dependencies are the one way a PR can break them. */
const BEFORE_THE_CODE = /^(?:Set up |Restore |Install |Run actions\/|Post |Complete job)/;
const DEPENDENCY_FILE = /(?:^|\/)(?:package(?:-lock)?\.json|\.nvmrc|mise\.toml)$/;
/** repair.mjs's `LOST_RUNNER` note; red-session-pr.spec.ts pins that the two still agree. */
const RUNNER_WENT_AWAY = /the runner went away/;
/** repair.mjs's `runnerStarved` and `parseFailure` labels. A file GitHub rejected may be this PR's. */
const NO_RUNNER = /^\(no runner/;
const REJECTED = /^\(the workflow never started/;
const WORKFLOW_FILE = /^\.github\//;

const MARKER = /<!-- moneypenny:red-session-pr sha=(\w+) attempted=([01]) -->/;
/** The hidden memory on the PR: which heads this lane spoke about, and which got a session. */
export const markerFor = (sha, attempted) =>
  `<!-- moneypenny:red-session-pr sha=${sha} attempted=${attempted ? 1 : 0} -->`;

/** One capsule per PR, so a title is the dedupe key, as a signature is on `main`. */
export const capsuleTitle = (number) => `[ci] ${PIPELINE} — PR #${number} is red`;

const LOG_TAIL = 3500;
const FILES_SHOWN = 30;

/** repair.mjs's own labels for a run it could not read a failed job from all start with a bracket. */
const unnamedJob = (failure) => String(failure?.job ?? "").startsWith("(");

function redChecks(run, failures = []) {
  if (run?.conclusion !== "failure" || run?.event !== "pull_request" || run?.name !== PIPELINE) {
    return [];
  }
  return failures.filter((f) => HOLDING.includes(f.job) || unnamedJob(f));
}

/** Pure: why this PR is not this lane's to speak on, or null when it is. */
function notOursReason(pr, run, defaultBranch = "main") {
  if (pr.state !== "open") return `#${pr.number} is no longer open`;
  if (pr.draft) return `#${pr.number} is a draft`;
  if ((pr.labels ?? []).some((l) => l?.name === LABELS.holdMerge.name)) {
    return `#${pr.number} carries \`${LABELS.holdMerge.name}\``;
  }
  if (pr.base?.ref !== defaultBranch) return `#${pr.number} is aimed at \`${pr.base?.ref}\``;
  if (pr.head?.sha !== run.head_sha) return `a newer push replaced the head that failed`;
  if (pr.user?.type !== "User" || !trustedComment(pr)) {
    return `#${pr.number} was opened by ${pr.user?.login}, not by a session on this repo`;
  }
  if (!SESSION_FOOTER.test(pr.body ?? "")) return `#${pr.number} has no session's footer`;
  // A collaborator can open from a fork, and a session sent there could not push the fix.
  if (pr.head?.repo?.full_name !== pr.base?.repo?.full_name) return `#${pr.number} is a fork`;
  return null;
}

/** Pure: why this failure says nothing about the PR's own code, or null. */
function outsideReason(failure, files = []) {
  // A job that could not be read says nothing either way, so it is not called outside the diff.
  if (NO_RUNNER.test(failure.job)) return failure.step ?? failure.job;
  if (REJECTED.test(failure.job)) {
    return files.some((f) => WORKFLOW_FILE.test(f)) ? null : (failure.step ?? failure.job);
  }
  if (unnamedJob(failure)) return null;
  const step = failure.step ?? "";
  if (RUNNER_WENT_AWAY.test(step)) return step;
  if (!BEFORE_THE_CODE.test(step)) return null;
  return files.some((f) => DEPENDENCY_FILE.test(f)) ? null : step;
}

const named = (failures) => failures.map((f) => `\`${f.job}\``).join(" and ");

function line(run, sentence, attempted) {
  const failed = `([the failed run](${run.html_url}))`;
  return `${sentence} ${failed}\n\n${markerFor(run.head_sha, attempted)}\n\n${FOOTER}`;
}

function capsuleBody(run, pr, failure, red, files) {
  const tail = (failure.logTail ?? "").slice(-LOG_TAIL).trim();
  const shown = files.slice(0, FILES_SHOWN);
  const rest = files.length - shown.length;
  const others = red.filter((f) => f !== failure);
  return [
    `**\`${failure.job}\` failed on PR #${pr.number}, a session's PR that no lane owns.**`,
    "",
    "| | |",
    "|---|---|",
    `| **Workflow** | ${run.name} |`,
    `| **Job** | \`${failure.job}\` |`,
    `| **Failing step** | ${failure.step ?? "unknown"} |`,
    `| **Run** | [${run.id}](${run.html_url}) |`,
    `| **PR** | #${pr.number} |`,
    `| **Branch** | \`${pr.head.ref}\` at \`${run.head_sha.slice(0, 7)}\` |`,
    ...(others.length ? [`| **Also red** | ${named(others)} |`] : []),
    "",
    `- This failed on the PR's branch, not on \`main\`: the code to read is at \`${pr.head.ref}\`.`,
    `- The fix belongs on that branch, so #${pr.number} re-runs its own checks and lands itself.`,
    `- A failure outside these files is not this PR's to change: say so on #${pr.number}.`,
    `- Nothing here merges or arms: the pipeline's arm job does that once the checks pass.`,
    "",
    "<details>",
    "<summary><strong>The evidence</strong> — the PR's files, and the log tail</summary>",
    "",
    `The files #${pr.number} changes:`,
    "",
    ...shown.map((f) => `- \`${f}\``),
    ...(rest > 0 ? [`- …and ${rest} more.`] : []),
    "",
    "```text",
    tail || "(no log captured)",
    "```",
    "",
    "</details>",
  ].join("\n");
}

/**
 * Decide what a failed PR run means. Pure.
 *
 * @param ctx {{ run: object, defaultBranch?: string, failures: object[] }}
 * @param deps {{ pr?: object, files?: string[], comments?: object[], gate?: {dispatch: boolean, reason: string}, rules?: object[], openIssues?: {number: number, title: string}[] }}
 * @returns intents — `[]` means this run was not about a red PR at all.
 */
export function routeRedSessionPr(ctx, deps = {}) {
  const run = ctx.run ?? {};
  const red = redChecks(run, ctx.failures);
  const { pr, files = [], comments = [], gate, rules = [] } = deps;
  const capsules = [...(deps.openIssues ?? []), ...(deps.closedIssues ?? [])];
  if (!(red.length && pr)) return [];

  const skip = (reason) => [{ type: "skip", issue: pr.number, reason }];
  const notOurs = notOursReason(pr, run, ctx.defaultBranch);
  if (notOurs) return skip(notOurs);

  const spoken = comments
    .filter(trustedComment)
    .map((c) => MARKER.exec(c.body ?? ""))
    .filter(Boolean);
  const saidThisHead = spoken.some((m) => m[1] === run.head_sha);
  const say = (sentence) =>
    saidThisHead
      ? skip("already spoke about this head")
      : [{ type: "say-on-pr", number: pr.number, body: line(run, sentence, false) }];
  const checks = named(red);

  const inside = red.filter((f) => !outsideReason(f, files));
  if (!inside.length) {
    const why = outsideReason(red[0], files);
    return say(
      `**${checks} failed at \`${why}\`, which is outside this PR's own changes, so nothing here was changed.** A re-run may clear it.`,
    );
  }

  const noSession = (why) => say(`**${checks} failed, and no repair session was sent: ${why}.**`);
  const guarded = files.filter((f) => breachOf(f, rules));
  if (guarded.length) {
    const paths = guarded
      .slice(0, 3)
      .map((f) => `\`${f}\``)
      .join(", ");
    return noSession(`this PR changes ${paths}, a protected path a repair session may not touch`);
  }

  const title = capsuleTitle(pr.number);
  // A capsule is the attempt, open or closed: its line on the PR is soft, so it may be all there is.
  const filed = capsules.find((i) => i.title === title);
  const attempts = spoken.filter((m) => m[2] === "1").length;
  if (filed || attempts >= RED_ATTEMPT_CAP) {
    const where = filed ? ` (#${filed.number})` : "";
    return noSession(`this PR already had its repair session${where}`);
  }
  if (!gate) return noSession("the work dial could not be read");
  if (!gate.dispatch) return noSession(gate.reason);

  return [
    {
      type: "open-issue",
      title,
      body: capsuleBody(run, pr, inside[0], red, files),
      labels: [LABELS.ciFailure.name],
      dispatch: true,
      sayOnPr: {
        number: pr.number,
        body: line(
          run,
          `**${checks} failed at \`${run.head_sha.slice(0, 7)}\`, and ${CAPSULE_SLOT} sends a repair session to it.**`,
          true,
        ),
      },
    },
  ];
}

/** The PR behind a run: the one its payload names on this base, or whichever open PR holds that
 *  head. A fork's head is not looked up: it is not this lane's, and the read can refuse it. */
function prNumberOf(run, read, defaultBranch) {
  const listed = run.pull_requests ?? [];
  const carried = (listed.find((p) => p.base?.ref === defaultBranch) ?? listed[0])?.number;
  if (carried) return carried;
  if (run.head_repository?.full_name !== run.repository?.full_name) return undefined;
  const held = read(`commits/${run.head_sha}/pulls`) ?? [];
  return held.find((p) => p.state === "open")?.number;
}

function gateOrRefusal(gate) {
  try {
    return gate();
  } catch (err) {
    return { dispatch: false, reason: `refused: ${String(err?.message ?? err).slice(0, 200)}` };
  }
}

const envelopeRules = () => JSON.parse(readFileSync("envelope.json", "utf8")).protected ?? [];

/**
 * Read what `routeRedSessionPr` needs, in the order it can stop: a run that is not a red PR's costs
 * nothing, and a PR that is not a session's costs one read. Loud on failure, like repair.mjs's reads:
 * the triage job going red is better than a guess. Only the gate turns into a refusal, because a gate
 * that cannot answer has answered.
 */
export function gatherRedSessionPr(
  run,
  failures,
  { rest = ghRest, gate = workGate, rules = envelopeRules, defaultBranch = "main" } = {},
) {
  if (!redChecks(run, failures).length) return {};
  const read = (path) => withRetry(() => rest(path));
  const number = prNumberOf(run, read, defaultBranch);
  if (!number) return {};
  const pr = read(`pulls/${number}`);
  if (notOursReason(pr, run, defaultBranch)) return { pr };
  return {
    pr,
    files: ghRestAll(`pulls/${number}/files`, { read: rest }).map((f) => f.filename),
    comments: ghRestAll(`issues/${number}/comments`, { read: rest }),
    gate: gateOrRefusal(gate),
    rules: typeof rules === "function" ? rules() : rules,
  };
}

/** One comment on a PR, over the endpoint that takes a PR's number. */
export function sayOnPr(number, body, { run = sh } = {}) {
  run("gh", [
    "api",
    "-X",
    "POST",
    `repos/{owner}/{repo}/issues/${number}/comments`,
    "-f",
    `body=${body}`,
  ]);
}
