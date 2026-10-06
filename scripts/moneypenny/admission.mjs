// THE ADMISSION GATE (#3960 criteria 1, 2, 7) — the throttle between "this issue is ready" and "a
// build session starts on it". Both claim lanes (`claimFeedback`, `claimPlan` in index.mjs) ask it
// AFTER their ready/parking checks and BEFORE they take a lease, so a refused issue holds no lease,
// never gets `in-progress`, and keeps its `ready` label — a later tick (the retry sweep, wired in
// the workflow) asks again via `nextAdmissible`.
//
// PURE HALF: `surfaceOf`, `admitBuild`, `nextAdmissible`, `queueNote`, `isDuplicateQueueNote` — no
// network, no clock. IMPURE HALF: `readInFlight` and `gateAdmission`, every read injectable so a
// spec drives them without a fake `gh` (tests/scripts/moneypenny/admission.spec.ts).
//
// THE RULES, in the order they are asked (the first refusal wins):
//   1. `halt` refuses everything — even `fast-track`. A brake is a brake (work-mode.mjs ACTOR_RULES:
//      fast-track "lets an urgent bug/CVE build under conserve; never under halt").
//   2. `conserve` refuses anything without `fast-track`.
//   3. The in-flight cap: `mode.caps.inFlightCap` open issues already carrying `in-progress`
//      (this issue excluded) refuses anything without `fast-track`.
//   4. THE STARTED-PLAN CAP (#4393 criterion 6): when `mode.caps.startedPlanCap` plans already sit
//      in the board's Waiting column (started, work left, nobody building), a FRESH plan is
//      refused — the next slice of a started plan never is. Stop starting, start finishing.
//      `fast-track` bypasses it, as it does the in-flight cap. Asked only when the caller passes
//      the Waiting list (`waiting`); a continuation (already started by definition) does not.
//   5. THE SURFACE FENCE (criterion 7): an in-flight issue on the same capsule `Surface` refuses,
//      and `fast-track` does NOT bypass it. Urgency changes how soon a build may start, never
//      whether two builds may race the same files — an urgent fix colliding with a half-built
//      change on the same surface is still a collision, and a merge conflict mid-incident is the
//      worst time to meet one.
//
// FENCE MATCHING IS DELIBERATELY SIMPLE: the Surface cell, markdown stripped, lowercased,
// whitespace-collapsed, compared exactly. Two issues describing one surface in different words do
// not collide (a missed fence costs a merge conflict, which the conflict sweep already catches); a
// looser match would queue unrelated work (a false fence costs throughput, silently). Tighten it
// only with measured misses in hand.
//
// ONE PULL RULE FOR EVERY PULLER (#4393 slice 3). What may be pulled at all is `pullable` in
// labels.mjs (the board's Ready column: open, `ready`, buildable, not `in-progress`); this gate
// decides whether it may start NOW. A live session — the claim lanes ask through `gateAdmission`,
// `/work-issues` through the read-only CLI at the foot of this file:
//   node scripts/moneypenny/admission.mjs --check <n>   # {admit, reason, queuedBehind?}; exit 0 | 3
//   node scripts/moneypenny/admission.mjs --next        # the sweep's pick, same JSON; exit 0 | 3
//   node scripts/moneypenny/admission.mjs --queue       # the Ready column, in pick order (JSON)
// The CLI never comments and never labels. A session Eric starts by hand is the EXPEDITE class: it
// never asks, and is still counted — its PR names the issue, which derives `in-progress` (#4402).
import { classOf } from "../rank.mjs";
import { missingDecisionCallout } from "./decision-callout.mjs";
import { ghRestAll, sh } from "./gh.mjs";
import { FOOTER, LABELS, labelNames, notPullableReason, pullable } from "./labels.mjs";
import { isStartedPlan, statusForIssue, subIssueCounts, WAITING } from "./projects.mjs";
import { noticeLine, readWorkMode } from "./work-mode.mjs";

/** Hidden marker on every queue note, so the dedupe finds this lane's own comments. */
export const QUEUE_MARKER = "<!-- moneypenny:queued -->";

/** Surface cells that name no surface — each would otherwise fence every other issue saying it. */
const NO_SURFACE = new Set(["", "-", "—", "–", "n/a", "na", "none", "tbd", "?"]);

const SURFACE_ROW = /^[ \t]*\|[ \t]*\**[ \t]*surface[ \t]*\**[ \t]*\|([^|\n]*)/im;

/**
 * The capsule's `| **Surface** | … |` cell, normalised for the fence: markdown links reduced to
 * their text, backticks and bold stripped, whitespace collapsed, lowercased. Null when the body has
 * no Surface row or the cell names nothing (`—`, `n/a`, `tbd`).
 */
export function surfaceOf(body) {
  const m = SURFACE_ROW.exec(String(body ?? ""));
  if (!m) return null;
  const text = m[1]
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return NO_SURFACE.has(text) ? null : text;
}

const hasLabel = (issue, name) => labelNames(issue?.labels).includes(name);

// ── the started-plan cap (#4393 slice 4) ─────────────────────────────────────────────────────────

/** Is this a plan that has not started yet — the only kind the started-plan cap ever refuses? */
export function isFreshPlan(issue) {
  const labels = labelNames(issue?.labels);
  return (
    labels.includes(LABELS.plan.name) &&
    !isStartedPlan({ labels, subIssues: subIssueCounts(issue) })
  );
}

/**
 * The open plans the board shows in **Waiting** — the same `statusForIssue` the board's columns
 * come from, so the cap and the column a human reads never disagree (the in-flight cap's rule:
 * `normal.inFlightCap` 3 is the board's own WIP limit). A blocked plan reads Blocked, not
 * Waiting, and so is not counted: it is waiting on a decision, not on a builder.
 */
export function waitingPlans(openPlans = []) {
  return (openPlans ?? []).filter((p) => {
    if (!p) return false;
    const labels = labelNames(p.labels);
    const column = statusForIssue({
      state: String(p.state ?? "open").toLowerCase(),
      labels,
      subIssues: subIssueCounts(p),
      decisionCalloutMissing: missingDecisionCallout({
        labels,
        body: p.body,
        author: p.user?.login ?? p.author,
      }),
    });
    return column === WAITING;
  });
}

/**
 * The pure admission decision. `inFlight` is every open issue carrying `in-progress` (this issue
 * is excluded here, so a caller may pass the raw list); `mode` is `readWorkMode()`'s result.
 *
 * @returns {{ admit: boolean, reason: string, queuedBehind?: number }}
 */
export function admitBuild({ issue, inFlight = [], mode, waiting }) {
  const fastTrack = hasLabel(issue, LABELS.fastTrack.name);
  const position = mode?.position;
  if (position === "halt") return { admit: false, reason: "work-mode is halt" };
  if (position === "conserve" && !fastTrack) {
    return { admit: false, reason: "queued: conserve mode" };
  }
  const others = (inFlight ?? []).filter((i) => i && i.number !== issue?.number);
  const cap = mode?.caps?.inFlightCap ?? 0;
  if (others.length >= cap && !fastTrack) {
    return { admit: false, reason: `queued: ${others.length} of ${cap} in flight` };
  }
  const planCap = mode?.caps?.startedPlanCap;
  if (Array.isArray(waiting) && Number.isInteger(planCap) && !fastTrack && isFreshPlan(issue)) {
    const idle = waiting.filter((i) => i && i.number !== issue?.number);
    if (idle.length >= planCap) {
      return {
        admit: false,
        reason: `queued: ${idle.length} started plans waiting (cap ${planCap}) — finish one before starting a new plan`,
      };
    }
  }
  const surface = surfaceOf(issue?.body);
  const blocker = surface ? others.find((i) => surfaceOf(i.body) === surface) : undefined;
  if (blocker) {
    return {
      admit: false,
      reason: `queued behind #${blocker.number} (same surface: ${surface})`,
      queuedBehind: blocker.number,
    };
  }
  return { admit: true, reason: fastTrack ? `admitted (fast-track, ${position})` : "admitted" };
}

const createdMs = (i) => {
  const t = Date.parse(i?.createdAt ?? i?.created_at ?? "");
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

/** The rank class (`P0`–`P3`) and bug-expedite flag `npm run rank` gives an issue, from its labels. */
const rankOf = (i) => classOf({ labels: labelNames(i.labels) });

/**
 * THE PULL ORDER: the pullable issues (`pullable`, labels.mjs) in the order a puller takes them.
 * `fast-track` goes first (it is urgent by definition), then the same order `npm run rank` shows —
 * class (a hand-set `P0`–`P3` wins), an expedited bug first inside its class (Eric, 2026-09-30:
 * bugs found mid-build are the next pull) — then oldest by `createdAt`, then lowest number.
 * Oldest-first alone picked a P3 idea (#784) over P0 work on the sweep's first live tick.
 */
export function pullQueue(readyIssues = []) {
  return (readyIssues ?? [])
    .filter((i) => i && pullable(i))
    .map((i) => ({ i, r: rankOf(i) }))
    .sort(
      (a, b) =>
        Number(hasLabel(b.i, LABELS.fastTrack.name)) -
          Number(hasLabel(a.i, LABELS.fastTrack.name)) ||
        a.r.cls.localeCompare(b.r.cls) ||
        Number(Boolean(b.r.expedite)) - Number(Boolean(a.r.expedite)) ||
        createdMs(a.i) - createdMs(b.i) ||
        (a.i.number ?? 0) - (b.i.number ?? 0),
    )
    .map(({ i }) => i);
}

/**
 * For the retry sweep: the first issue in `pullQueue` order the gate admits, or null. One per
 * call — admitting it changes the in-flight list the next pick sees. `waiting` is `waitingPlans`
 * over the open plans; without it a fresh plan the cap would refuse could top the pick every tick
 * and starve the feedback items queued behind it.
 */
export function nextAdmissible(readyIssues = [], inFlight = [], mode, waiting) {
  return (
    pullQueue(readyIssues).find((issue) => admitBuild({ issue, inFlight, mode, waiting }).admit) ??
    null
  );
}

/**
 * The whole question a puller asks before starting `issue` (#4393 criteria 10–11): is it pullable
 * at all, then would the gate admit it now. Pure; the CLI's `--check` is this plus the reads.
 *
 * @returns {{ admit: boolean, reason: string, queuedBehind?: number }}
 */
export function checkAdmission({ issue, inFlight = [], mode, waiting }) {
  const notPullable = notPullableReason(issue);
  if (notPullable) return { admit: false, reason: `not pullable: ${notPullable}` };
  return admitBuild({ issue, inFlight, mode, waiting });
}

/** The first body line a queue note carries — also the dedupe key. */
const reasonLine = (reason) => `⏸ **Not started yet** — ${reason}.`;

/** The comment a refused issue gets. Carries the lane FOOTER and the hidden marker. */
export function queueNote(reason) {
  return [
    QUEUE_MARKER,
    reasonLine(reason),
    "",
    "This issue keeps `ready`; the lane retries it on a later tick — nothing to do here. " +
      "An urgent bug or CVE can take `fast-track` to skip the queue (never the halt, never the " +
      "same-surface fence).",
    "",
    FOOTER,
  ].join("\n");
}

/** Did this lane's newest queue note already say exactly this? (Comments oldest-first, as gh.) */
export function isDuplicateQueueNote(comments = [], reason) {
  const ours = (comments ?? []).filter((c) => String(c?.body ?? "").includes(QUEUE_MARKER));
  const newest = ours[ours.length - 1];
  return Boolean(newest && String(newest.body).includes(reasonLine(reason)));
}

/**
 * Open issues carrying `label`, OLDEST FIRST, over REST (the core bucket — gh.mjs's header). One
 * page of 100: for `in-progress` the cap is single digits, so 100 is far past any legitimate state;
 * for `ready` the sweep wants the oldest, which is exactly what the first ascending page holds.
 * PRs are dropped (the issues endpoint returns them too). A non-list answer throws — never "none".
 */
export function readOpenIssues(label, exec = sh) {
  const rows = JSON.parse(
    exec("gh", [
      "api",
      `repos/{owner}/{repo}/issues?state=open&labels=${label}&sort=created&direction=asc&per_page=100`,
    ]) || "[]",
  );
  if (!Array.isArray(rows)) throw new Error(`the open \`${label}\` read did not return a list`);
  return rows
    .filter((r) => !r.pull_request)
    .map((r) => ({
      number: r.number,
      title: r.title ?? "",
      state: r.state ?? "open",
      body: r.body ?? "",
      labels: r.labels ?? [],
      createdAt: r.created_at,
      issue_dependencies_summary: r.issue_dependencies_summary, // the pull rule's blocker count
      sub_issues_summary: r.sub_issues_summary, // the started-plan cap's "has it started?"
      user: r.user ? { login: r.user.login } : undefined, // the Blocked rule's callout check
    }));
}

/**
 * Every open `plan` issue, PAGINATED (85 were open on 2026-10-05 — one page of 100 is not enough
 * headroom, and a truncated list would undercount Waiting and let a fresh plan through). Same row
 * shape as `readOpenIssues`. `ghRestAll` throws rather than hand back half a list.
 */
export function readOpenPlans(readAll = ghRestAll) {
  return readAll(`issues?state=open&labels=${LABELS.plan.name}`)
    .filter((r) => r && !r.pull_request)
    .map((r) => ({
      number: r.number,
      title: r.title ?? "",
      state: r.state ?? "open",
      body: r.body ?? "",
      labels: r.labels ?? [],
      createdAt: r.created_at,
      sub_issues_summary: r.sub_issues_summary,
      user: r.user ? { login: r.user.login } : undefined,
    }));
}

/**
 * What the cap needs for one issue: the Waiting list, and the issue with its own sub-issue counts
 * taken from the plan list when the caller's copy lacks them (an event payload or `gh issue view`
 * JSON may; the REST plan list always carries `sub_issues_summary`). Pure.
 */
export function startedPlanInputs(issue, openPlans = []) {
  const self = (openPlans ?? []).find((p) => p?.number === issue?.number);
  const withCounts =
    self && issue?.sub_issues_summary === undefined
      ? { ...issue, sub_issues_summary: self.sub_issues_summary }
      : issue;
  return { issue: withCounts, waiting: waitingPlans(openPlans) };
}

/** Every open issue carrying `in-progress` — the list the cap and the fence count. */
export const readInFlight = (exec = sh) => readOpenIssues(LABELS.inProgress.name, exec);

const readComments = (n) =>
  JSON.parse(sh("gh", ["issue", "view", String(n), "--json", "comments"]) || "{}").comments ?? [];

const postComment = (n, body) => sh("gh", ["issue", "comment", String(n), "--body", body]);

/**
 * The impure call both claim lanes make. Reads the dial and the in-flight list, asks `admitBuild`,
 * and on refusal posts ONE queue note (skipped when the newest one already says the same thing).
 * An unreadable in-flight list refuses without a note — fail closed, and a GitHub blip is not news
 * for the issue's thread. A broken work-mode CONFIG still throws (work-mode.mjs's doctrine).
 *
 * @returns {{ admit: boolean, reason: string, queuedBehind?: number }}
 */
export function gateAdmission(issue, deps = {}) {
  const {
    readMode = () => readWorkMode(),
    readInFlight: inFlightOf = () => readInFlight(),
    readPlans = () => readOpenPlans(),
    started = false,
    comments = readComments,
    comment = postComment,
    log = console.log,
  } = deps;
  const mode = readMode();
  if (mode.warning) log(`::warning::${mode.warning}`);
  log(noticeLine(mode));
  let inFlight;
  try {
    inFlight = inFlightOf();
  } catch (err) {
    const reason = "queued: the in-flight list could not be read";
    log(`::warning::#${issue.number} ${reason} — ${String(err?.message).slice(0, 200)}`);
    return { admit: false, reason };
  }
  let verdict = admitBuild({ issue, inFlight, mode });
  // The started-plan cap reads the open plans only when everything cheaper has admitted and the
  // issue might be a fresh plan: a feedback item, a continuation (`started`), a plan already
  // carrying `next-slice`, or a halt costs no read.
  if (verdict.admit && !started && isFreshPlan(issue)) {
    let gated;
    try {
      gated = startedPlanInputs(issue, readPlans());
    } catch (err) {
      const reason = "queued: the open plans could not be read";
      log(`::warning::#${issue.number} ${reason} — ${String(err?.message).slice(0, 200)}`);
      return { admit: false, reason };
    }
    verdict = admitBuild({ issue: gated.issue, inFlight, mode, waiting: gated.waiting });
  }
  if (verdict.admit) {
    log(`::notice::#${issue.number} ${verdict.reason}`);
    return verdict;
  }
  log(`::notice::not building #${issue.number} — ${verdict.reason}`);
  try {
    if (isDuplicateQueueNote(comments(issue.number), verdict.reason)) {
      log(`· #${issue.number} already carries this queue note — not repeating it`);
    } else {
      comment(issue.number, queueNote(verdict.reason));
    }
  } catch (err) {
    log(
      `::warning::could not post the queue note on #${issue.number}: ${String(err?.stderr || err?.message).slice(0, 200)}`,
    );
  }
  return verdict;
}

// ── the CLI (#4393 slice 3) — read-only; never comments, never labels ────────────────────────────

/** One issue over REST (core bucket). A PR number throws: a PR is never pulled. */
export function readIssue(n, exec = sh) {
  const r = JSON.parse(exec("gh", ["api", `repos/{owner}/{repo}/issues/${n}`]) || "{}");
  if (r.pull_request) throw new Error(`#${n} is a pull request, not an issue`);
  if (!r.number) throw new Error(`#${n} did not read as an issue`);
  const { number, title = "", state = "open", body = "", labels = [], created_at } = r;
  const { issue_dependencies_summary, sub_issues_summary } = r;
  return {
    number,
    title,
    state,
    body,
    labels,
    createdAt: created_at,
    issue_dependencies_summary,
    sub_issues_summary,
  };
}

const USAGE = "usage: admission.mjs --check <issue-number> | --next | --queue";

/**
 * The CLI, every read injectable. Exit codes: 0 admitted (or `--queue` printed), 3 refused —
 * including an unreadable issue or in-flight list (fail closed, as `gateAdmission` does), 2 a usage
 * error. A broken work-mode CONFIG still throws (work-mode.mjs's doctrine), so the shell sees 1.
 */
export function runCli(argv = [], io = {}) {
  const {
    readMode = () => readWorkMode(),
    readInFlight: inFlightOf = () => readInFlight(),
    readReady = () => readOpenIssues(LABELS.ready.name),
    readIssue: issueOf = (n) => readIssue(n),
    readPlans = () => readOpenPlans(),
    print = (line) => console.log(line),
    printErr = (line) => console.error(line),
  } = io;
  const out = (verdict) => {
    print(JSON.stringify(verdict));
    return verdict.admit ? 0 : 3;
  };
  const refuse = (reason, err) =>
    out({ admit: false, reason: `${reason}: ${err?.message ?? err}` });
  if (argv.includes("--queue")) {
    let ready;
    try {
      ready = readReady();
    } catch (err) {
      printErr(`the open \`ready\` issues could not be read: ${err?.message ?? err}`);
      return 3;
    }
    const rows = pullQueue(ready).map((i) => ({ number: i.number, title: i.title ?? "" }));
    print(JSON.stringify(rows));
    return 0;
  }
  const checkIdx = argv.indexOf("--check");
  const n = checkIdx >= 0 ? Number(argv[checkIdx + 1]) : null;
  if (!(argv.includes("--next") || (Number.isInteger(n) && n > 0))) {
    printErr(USAGE);
    return 2;
  }
  const mode = readMode();
  let inFlight;
  try {
    inFlight = inFlightOf();
  } catch (err) {
    return refuse("the in-flight list could not be read", err);
  }
  if (argv.includes("--next")) {
    let ready;
    let waiting;
    try {
      ready = readReady();
    } catch (err) {
      return refuse("the open `ready` issues could not be read", err);
    }
    try {
      waiting = waitingPlans(readPlans());
    } catch (err) {
      return refuse("the open plans could not be read", err);
    }
    const pick = nextAdmissible(ready, inFlight, mode, waiting);
    if (!pick) {
      const why = `nothing admissible (${pullQueue(ready).length} pullable, ${inFlight.length} in flight, ${waiting.length} plans waiting, work-mode=${mode.position})`;
      return out({ admit: false, reason: why });
    }
    return out({ number: pick.number, ...admitBuild({ issue: pick, inFlight, mode, waiting }) });
  }
  let issue;
  try {
    issue = issueOf(n);
  } catch (err) {
    return refuse(`#${n} could not be read`, err);
  }
  const verdict = checkAdmission({ issue, inFlight, mode });
  if (!(verdict.admit && isFreshPlan(issue))) return out({ number: n, ...verdict });
  let gated;
  try {
    gated = startedPlanInputs(issue, readPlans());
  } catch (err) {
    return refuse("the open plans could not be read", err);
  }
  return out({ number: n, ...checkAdmission({ inFlight, mode, ...gated }) });
}

if (import.meta.url === `file://${process.argv[1]}`)
  process.exitCode = runCli(process.argv.slice(2));
