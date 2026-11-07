// CAPSULE STALL — the two ways a CI repair capsule stops moving without anyone noticing (#5727,
// from the 2026-10-18 loop census, docs/process/LEARNING-LOOP.md → "The loop census").
//
//   1. ORPHANED. A `ci-failure` capsule with no linked PR and no `needs-eric`: the repair session
//      never ran, or ended without a PR. #4395 sat 17 days like that; each recurrence added a
//      comment and nothing else, because repair.mjs dispatches only when it FILES a capsule.
//   2. PROVEN. A capsule whose failing job has since gone green on every run that tested it. #5577
//      held `needs-eric` two days after that, until someone closed it by hand; the study of
//      2026-11-01 found three more sitting 125–139 hours, one of them for a workflow that runs on
//      `workflow_dispatch`, which the proof — push runs only, then — could never read. The proof
//      now reads dispatch runs beside pushes and CLOSES the capsule, at zero tokens: the failure it
//      tracked has stopped happening, so there is nothing left to repair and no decision left to
//      wait on (`needs-eric` comes off first). "Green" means the failing step ran and passed: a
//      job that skipped it proves nothing (#6076). And the proof counts only runs newer than the
//      fault's last recurrence, so a capsule whose failure is still happening is never closed.
//      (This replaces the earlier "eroded" check, which only removed the label; the decision it
//      recorded — a decision that no longer blocks anything comes off — survives as the close.)
//
// Both ride the `--audit` push tick (scripts/moneypenny/index.mjs), beside audit.mjs, which is at
// its size cap. Same doctrine as audit(): comment, move a label, close on proof — never decide
// more than that. It NEVER re-dispatches a repair (that needs a workflow edit, which is protected).
// A fault that comes back within 14 days REOPENS the capsule through repair.mjs (#6953 slice 2), so
// this check reads only what was said since the newest reopen (`sinceReopen`): the proven comment
// from the last life must not read as "a person reopened it" on the next.
//
// A CLOSE NEVER TAKES THE QUESTION WITH IT (#6953 slice 2). Proof used to close a capsule
// "whatever else it carries", `needs-eric` included — so the ask vanished with the incident, came
// back under the next number, and Eric saw the breaker question 9 times in 5 days. Before closing an
// escalated capsule this now moves its ask (`carryOf`): onto the fix's open PR when one is linked,
// since that PR is the thing his answer acts on; otherwise onto `needs-session`, which the digest
// lists as "needs a session" — a fix with no PR waits on a session that can open one, not on him.
//
// REST only (the core bucket — gh.mjs `ghRest` says why), and one comment per capsule per condition,
// deduped by a hidden marker in the comment itself. Pure core (`capsuleIntents` and its helpers) +
// a thin gather/act shell, so every branch is fixture-drivable.
import { decisionLine } from "./assignments.mjs";
import { ghRest, ghRestAll, sh, trustedComment } from "./gh.mjs";
import { ensureLabel, FOOTER, LABELS } from "./labels.mjs";
import { LOST_RUNNER, normalizeJobName, REOPEN_DAYS, REOPEN_MARKER } from "./repair.mjs";

/** A capsule younger than this may still have its repair session running. */
export const ORPHAN_AFTER_HOURS = 24;
/** Consecutive green runs (push or dispatch) that count as "the failing job has gone green". */
export const GREEN_PUSHES = 3;
export const ORPHAN_MARKER = "<!-- moneypenny:capsule-orphan -->";
export const PROVEN_MARKER = "<!-- moneypenny:capsule-proven -->";
/** Left by the earlier label-only check. Still read: a capsule carrying it AND `needs-eric` is
 *  one whose owner re-applied the label after that check spoke, which stays his call. */
export const ERODED_MARKER = "<!-- moneypenny:capsule-eroded -->";

const names = (labels = []) => labels.map((l) => (typeof l === "string" ? l : l?.name));
const hours = (fromIso, nowMs) => Math.floor((nowMs - Date.parse(fromIso)) / 3_600_000);

/**
 * Which workflow, job and step a capsule tracks. Read from the metadata table `repair.mjs`'s
 * `issueBody` writes (`| **Workflow** | … |`, `| **Job** | \`…\` |`, `| **Failing step** | … |`);
 * the title is the fallback, since a long signature is clamped to 120 characters there and the table
 * never is. The step is what a green run has to have RUN to prove anything (#6076); a capsule that
 * never recorded one (`unknown`, or the title fallback) carries none. A lost runner's row carries
 * repair.mjs's `LOST_RUNNER` note after the name, which no real step does, so it comes off (#6274).
 */
export function capsuleTarget(issue = {}) {
  const body = String(issue.body ?? "");
  const workflow = /^\| \*\*Workflow\*\* \| (.+?) \|$/m.exec(body)?.[1];
  const job = /^\| \*\*Job\*\* \| `(.+?)` \|$/m.exec(body)?.[1];
  const row = /^\| \*\*Failing step\*\* \| (.+?) \|$/m.exec(body)?.[1];
  const step = row?.endsWith(LOST_RUNNER) ? row.slice(0, -LOST_RUNNER.length) : row;
  if (workflow && job)
    return step && step !== "unknown" ? { workflow, job, step } : { workflow, job };
  const m = /^\[ci\] (.+?) — (.+)$/.exec(String(issue.title ?? ""));
  return m && !m[2].endsWith("…") ? { workflow: m[1], job: m[2] } : null;
}

/**
 * A step as a later run would name it. GitHub names an unnamed `uses:` step `Run owner/action@<ref>`,
 * so a pin bump — often the very workflow fix a `needs-eric` capsule waits on — renames it; the
 * `@<ref>` is dropped on both sides so the bumped step still counts as the one that failed (#6274).
 */
const stepKey = (name) => String(name ?? "").replace(/^(Run [^@\s]+)@\S+$/, "$1");

/** GitHub's own bookkeeping steps — they run whether or not the job did any work. */
const BOOKKEEPING = /^(Set up job|Complete job|Post .*)$/;

/**
 * One matrix leg's verdict on the capsule's fault: `pass`, `fail`, or null when it proves nothing.
 * A job can conclude `success` without doing its work — #5955's "green" deploys were preflight
 * debounce skips that never deployed (#6076) — so with a recorded step, only that step having run
 * and succeeded is a pass. With none, the job's conclusion stands unless every step after a
 * preflight was skipped.
 */
function legVerdict(leg, step) {
  if (leg?.conclusion === "failure" || leg?.conclusion === "timed_out") return "fail";
  if (leg?.conclusion !== "success") return null;
  const steps = leg.steps ?? [];
  if (step) {
    const ran = steps.find((s) => stepKey(s?.name) === stepKey(step))?.conclusion;
    if (ran === "failure") return "fail";
    return ran === "success" ? "pass" : null;
  }
  const preflight = steps.findIndex((s) => /preflight/i.test(String(s?.name ?? "")));
  if (preflight < 0) return "pass";
  const work = steps.slice(preflight + 1).filter((s) => !BOOKKEEPING.test(String(s?.name ?? "")));
  return work.length && work.every((s) => s?.conclusion === "skipped") ? null : "pass";
}

/**
 * This job's verdict in one run, every matrix leg folded onto its name: any leg failing fails it,
 * every leg passing passes it, anything else — no leg at all, a skipped or cancelled leg, the step
 * not run — proves nothing and is null.
 */
export function jobVerdict(jobs = [], job, step) {
  const mine = (jobs ?? []).filter((j) => normalizeJobName(j?.name) === job);
  if (!mine.length) return null;
  const verdicts = mine.map((leg) => legVerdict(leg, step));
  if (verdicts.includes("fail")) return "fail";
  return verdicts.every((v) => v === "pass") ? "pass" : null;
}

/** Did this job pass in this run — and, given the capsule's failing step, did that step run green? */
export function jobPassed(jobs = [], job, step) {
  return jobVerdict(jobs, job, step) === "pass";
}

/** The trusted `Failed again` comment `repair.mjs` posts on every recurrence of an open capsule. */
export const RECURRENCE = "Failed again — ";
const recurrence = (body) =>
  String(body ?? "")
    .trimStart()
    .startsWith(RECURRENCE);

/**
 * Does the issue timeline show a PR that references it, still open or merged? A merged PR counts
 * only if it merged after `since` — the capsule's latest recurrence — because a fault that came
 * back after the merge was not fixed by it (#6076: mention-only #5982 kept #5955 "linked" for days).
 */
export function hasLinkedPr(timeline = [], since) {
  const after = since ? Date.parse(since) : Number.NEGATIVE_INFINITY;
  return (timeline ?? []).some((e) => {
    if (e?.event === "connected") return true;
    const pr = e?.event === "cross-referenced" ? e.source?.issue : null;
    if (!pr?.pull_request) return false;
    if (pr.state === "open") return true;
    const merged = Date.parse(pr.pull_request.merged_at ?? "");
    return Number.isFinite(merged) && merged > after;
  });
}

/**
 * The held fix PR the timeline links to this capsule, or null — where an escalated capsule's ask can
 * go and still be seen. Two tests, each closing a way the ask could land wrong:
 *   - it says it closes this capsule (`Closes #N` and kin), so a PR that only mentions the number —
 *     a digest, a research note — is never taken for the fix;
 *   - it carries `hold-merge`, so the assignment lane's criterion 4 asks Eric about it. An unheld
 *     PR either auto-merges, which answers nothing he was asked, or sits where no list sees it.
 * The newest such PR wins. Only a cross-reference names its PR; `connected` does not. Pure.
 */
export function openLinkedPr(timeline = [], number = null) {
  const closes =
    number && new RegExp(`\\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\\s+#${number}\\b`, "i");
  let found = null;
  for (const e of timeline ?? []) {
    const pr = e?.event === "cross-referenced" ? e.source?.issue : null;
    if (!(pr?.pull_request && pr.state === "open" && pr.number)) continue;
    if (closes && !closes.test(String(pr.body ?? ""))) continue;
    if (!names(pr.labels).includes(LABELS.holdMerge.name)) continue;
    found = pr.number;
  }
  return found;
}

/** The comments since the newest reopen — the capsule's current life. Oldest first in, and out. */
export function sinceReopen(comments = []) {
  const last = comments.findLastIndex((c) => String(c ?? "").includes(REOPEN_MARKER));
  return last === -1 ? comments : comments.slice(last + 1);
}

/**
 * Where an escalated capsule's ask goes before a green close: its held fix PR (`openLinkedPr`), else
 * a session. `openPr` is the gather's read; absent reads as no PR, because listing the ask for a
 * session loses nothing, while closing with it nowhere is the failure this exists for. Pure.
 */
export function carryOf(c) {
  const decision = decisionLine(c.body);
  return c.openPr ? { pr: c.openPr, decision } : { session: true, decision };
}

/** Whether the gather needs the costlier PR read for this capsule, from its labels and age alone:
 *  only where the orphan flag could still fire. The proof is read for every open capsule, since
 *  green closes any of them. */
export function lookupsFor(issue, nowMs, orphanAfterHours = ORPHAN_AFTER_HOURS) {
  const labels = names(issue.labels);
  if (labels.includes(LABELS.needsEric.name) || labels.includes(LABELS.needsSession.name)) {
    return { orphan: false };
  }
  const old = hours(issue.created_at ?? issue.createdAt, nowMs) >= orphanAfterHours;
  return { orphan: old && !labels.includes(LABELS.stall.name) };
}

/**
 * Walk runs newest first: a pass counts, a run that proves nothing is left out, and a failure ends
 * the walk — the newest runs that tested the fault must all be green. `ended` says no later run can
 * change the answer, so the gather stops reading.
 */
export function provenRuns(runs, target, n = GREEN_PUSHES) {
  const passes = [];
  for (const r of runs ?? []) {
    const verdict = jobVerdict(r.jobs, target.job, target.step);
    if (verdict === "fail") return { passes, ended: true };
    if (verdict === "pass") passes.push(r);
    if (passes.length >= n) return { passes, ended: true };
  }
  return { passes, ended: false };
}

/** The moment the proof starts counting from: the capsule's filing, or the fault's last recurrence
 *  if that is later. A run from before the fault last came back cannot speak for it as it is now. */
export function proofCut(capsule) {
  const filed = Date.parse(capsule.createdAt ?? "");
  const back = Date.parse(capsule.recurredAt ?? "");
  return Number.isFinite(back) && back > filed ? back : filed;
}

/** The runs that prove a job green: the newest `n` after the capsule's last recurrence (or its
 *  filing) that tested its fault, all passing — else null. */
export function greenProof(capsule, n = GREEN_PUSHES) {
  const target = capsuleTarget(capsule);
  if (!target) return null;
  const cut = proofCut(capsule);
  const after = (capsule.recentRuns ?? []).filter((r) => Date.parse(r.createdAt) > cut);
  const { passes } = provenRuns(after, target, n);
  return passes.length >= n ? { ...target, runs: passes } : null;
}

function orphanBody(c) {
  return `🧭 **No repair has reached this** — this capsule was filed **${c.ageHours}h** ago and has no linked PR and no \`${LABELS.needsEric.name}\`. The repair session either never ran or ended without opening a PR, and a recurrence only adds a comment here.\n\nTo move it: open a fix PR that says \`Closes #${c.number}\`, apply \`${LABELS.needsEric.name}\` with the reason if the fix is Eric's call, or close it if the job passes again.\n\n${ORPHAN_MARKER}\n\n${FOOTER}`;
}

/**
 * The PR a capsule tracks, when it tracks one (red-session-pr.mjs writes the row). `main`'s runs say
 * nothing about such a capsule: `integration tests` also runs on push, and three green pushes there
 * would close a capsule on a PR still red. So its end is the PR's: closed, merged or not, leaves
 * nothing to repair (#6605).
 */
export function redPrOf(issue = {}) {
  const number = /^\| \*\*PR\*\* \| #(\d+) \|$/m.exec(String(issue.body ?? ""))?.[1];
  return number ? Number(number) : null;
}

function prGoneBody(pr, clearNeedsEric) {
  const how = pr.merged ? "merged" : "was closed";
  const label = clearNeedsEric
    ? ` \`${LABELS.needsEric.name}\` comes off with it: the decision it waited on was about that PR.`
    : "";
  return `🌤 **Closed with its PR** — #${pr.number} ${how}, so there is nothing left here to repair.${label}\n\n${PROVEN_MARKER}\n\n${FOOTER}`;
}

/** Where the ask went, said in the close comment, so the close never reads as the ask answered. */
function carryLine(carry) {
  if (!carry) return "";
  const ask = carry.decision ? `: "${carry.decision}"` : "";
  const where = carry.pr
    ? `moves to #${carry.pr}, the fix it waits on${ask}. That PR is what an answer acts on, so the question sits there, not on this incident.`
    : `moves to \`${LABELS.needsSession.name}\` — the digest's "needs a session" line${ask}. No fix PR is open, so the next step is a session that can open one, not a decision.`;
  return `\n\n\`${LABELS.needsEric.name}\` comes off, and the ask ${where}`;
}

function provenBody(proof, carry) {
  const runs = proof.runs.map((r) => `[${r.id}](${r.url})`).join(", ");
  const ran = proof.step ? ` that ran \`${proof.step}\`` : "";
  return `🌤 **Passing again — closed** — \`${proof.job}\` (${proof.workflow}) passed on the last ${proof.runs.length} runs on \`main\`${ran}: ${runs}. The failure this tracked has stopped happening, so there is nothing left here to repair.${carryLine(carry)}\n\nIf it comes back within ${REOPEN_DAYS} days, the repair lane reopens this issue rather than filing a new one.\n\n${PROVEN_MARKER}\n\n${FOOTER}`;
}

/**
 * The decision, pure. Each capsule carries its labels, age, the trusted comment bodies (for the
 * markers), when its fault last recurred, and whichever lookups `lookupsFor` asked for:
 * `hasLinkedPr` for an orphan candidate, `recentRuns` (newest first, each with its jobs) for the
 * proof. A lookup that is absent is unknown, and unknown never fires. Proof is judged first and
 * for every capsule: a green one closes, and an escalated one moves its ask first (`carryOf`).
 * Markers count only since the newest reopen (`sinceReopen`).
 */
export function capsuleIntents({ capsules = [], orphanAfterHours = ORPHAN_AFTER_HOURS } = {}) {
  const intents = [];
  for (const c of capsules) {
    const labels = names(c.labels);
    const posted = sinceReopen(c.comments ?? []).join("\n");
    const escalated = labels.includes(LABELS.needsEric.name);
    // This check speaks once. A proven comment on an OPEN capsule means a person reopened it; a
    // legacy eroded comment beside a present `needs-eric` means the owner re-applied the label
    // after that check removed it. Either is his call and stays, green or not.
    const spoke = posted.includes(PROVEN_MARKER) || (escalated && posted.includes(ERODED_MARKER));
    // No carry here: the ask was about that PR, and its merge or close is the answer.
    if (!spoke && c.redPr?.state === "closed") {
      intents.push({
        kind: "close-proven-capsule",
        issueNumber: c.number,
        title: c.title,
        body: prGoneBody(c.redPr, escalated),
        clearNeedsEric: escalated,
        said: `closed with #${c.redPr.number}`,
      });
      continue;
    }
    const proof = spoke ? null : greenProof(c);
    if (proof) {
      const carry = escalated ? carryOf(c) : undefined;
      intents.push({
        kind: "close-proven-capsule",
        issueNumber: c.number,
        title: c.title,
        body: provenBody(proof, carry),
        clearNeedsEric: escalated,
        ...(carry ? { carry } : {}),
      });
      continue;
    }
    // Not proven. An escalated capsule waits on its decision, a handed-off one on its session (the
    // reopen said so, #6953); the rest may be orphans.
    if (escalated || labels.includes(LABELS.needsSession.name)) continue;
    if (c.ageHours < orphanAfterHours || c.hasLinkedPr !== false) continue;
    if (labels.includes(LABELS.stall.name)) continue;
    if (posted.includes(ORPHAN_MARKER)) continue;
    const kind = "flag-capsule-orphan";
    intents.push({ kind, issueNumber: c.number, title: c.title, body: orphanBody(c) });
  }
  return intents;
}

// ── the impure half ───────────────────────────────────────────────────────────

/** A run counts toward "the last pushes" only if it actually tested something. */
const DECIDED = new Set(["success", "failure"]);

/** The two ways a run lands on `main` that can test a fault: a push, and a dispatch — a workflow
 *  that runs only on `workflow_dispatch` (the research lane, the catch-up clock) has no push runs
 *  at all, which is how a capsule for one could never prove itself green. */
const RUN_EVENTS = ["push", "workflow_dispatch"];

/**
 * The newest completed runs on `main` of one workflow after the capsule's proof cut, each with its
 * jobs, read newest first until `provenRuns` has its answer — so a streak of debounce skips is paged
 * past, up to one page of 20 per event, instead of filling the window (#6076). Push and dispatch
 * runs are merged into one timeline before any job is read, so a failing dispatch run newer than
 * three green pushes ends the walk the way any newer failure does. A run whose jobs do not fit one
 * page is left without them, so `jobPassed` cannot be proven by a partial list.
 */
function recentRuns(workflowId, target, cutMs, { rest }) {
  const seen = new Set();
  const candidates = [];
  for (const event of RUN_EVENTS) {
    const page = rest(
      `actions/workflows/${workflowId}/runs?branch=main&event=${event}&status=completed&per_page=20`,
    );
    for (const r of page?.workflow_runs ?? []) {
      const counts = DECIDED.has(r.conclusion) && Date.parse(r.created_at) > cutMs;
      if (counts && !seen.has(r.id)) {
        seen.add(r.id);
        candidates.push(r);
      }
    }
  }
  candidates.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const runs = [];
  for (const r of candidates) {
    const jobs = rest(`actions/runs/${r.id}/jobs?per_page=100`);
    const whole = (jobs?.jobs ?? []).length >= (jobs?.total_count ?? 0);
    runs.push({ id: r.id, url: r.html_url, createdAt: r.created_at, jobs: whole ? jobs.jobs : [] });
    if (provenRuns(runs, target).ended) break;
  }
  return runs;
}

/** Read every open capsule and the lookups each one needs. Loud on failure, like audit.mjs.
 *  Run pages and job lists are read once per gather, not once per capsule: three capsules on one
 *  workflow (the study's shape) share every one of them. */
export function gatherCapsules(nowMs, { rest = ghRest, restAll = ghRestAll } = {}) {
  const open = restAll(`issues?state=open&labels=${encodeURIComponent(LABELS.ciFailure.name)}`);
  const once = new Map();
  const cached = (path) => {
    if (!once.has(path)) once.set(path, rest(path));
    return once.get(path);
  };
  let workflowIds;
  const capsules = [];
  for (const i of open.filter((x) => !x.pull_request)) {
    const need = lookupsFor(i, nowMs);
    const read = restAll(`issues/${i.number}/comments`).filter(trustedComment);
    const comments = read.map((c) => c.body ?? "");
    const recurredAt = read.filter((c) => recurrence(c.body)).at(-1)?.created_at;
    const c = {
      number: i.number,
      title: i.title,
      body: i.body,
      createdAt: i.created_at,
      ageHours: hours(i.created_at, nowMs),
      labels: names(i.labels),
      comments,
      recurredAt,
    };
    if (need.orphan) {
      c.hasLinkedPr = hasLinkedPr(restAll(`issues/${i.number}/timeline`), recurredAt);
    }
    // Where its ask would go if proof closes it — read only for the few capsules that carry one.
    if (c.labels.includes(LABELS.needsEric.name)) {
      c.openPr = openLinkedPr(restAll(`issues/${i.number}/timeline`), i.number);
    }
    const redPr = redPrOf(i);
    if (redPr) {
      const pr = cached(`pulls/${redPr}`);
      c.redPr = { number: redPr, state: pr?.state, merged: Boolean(pr?.merged) };
    }
    const target = redPr ? null : capsuleTarget(i);
    if (target) {
      workflowIds ??= new Map(
        (cached("actions/workflows?per_page=100")?.workflows ?? []).map((w) => [w.name, w.id]),
      );
      const id = workflowIds.get(target.workflow);
      if (id) c.recentRuns = recentRuns(id, target, proofCut(c), { rest: cached });
    }
    capsules.push(c);
  }
  return capsules;
}

/**
 * The `--audit` entry: fixture capsules when a fixture carries them, the live read otherwise. A
 * read that fails turns the run red but never takes the rest of the audit down with it — the stall,
 * conflict and in-progress checks in the same run still act.
 */
export function capsuleAudit(fixture, { gather = gatherCapsules, nowMs = Date.now() } = {}) {
  if (fixture) return capsuleIntents({ capsules: fixture.capsules ?? [] });
  try {
    return capsuleIntents({ capsules: gather(nowMs) });
  } catch (err) {
    console.log(`::error::capsule stall check failed — ${String(err?.message).slice(0, 300)}`);
    process.exitCode = 1;
    return [];
  }
}

const issuePath = (n) => `repos/{owner}/{repo}/issues/${n}`;

/** Comment, then apply `stall-flagged` — the same one-ping memory audit.mjs's flags use. */
export function flagCapsuleOrphan(i, { run = sh, ensure = ensureLabel } = {}) {
  run("gh", ["api", "-X", "POST", `${issuePath(i.issueNumber)}/comments`, "-f", `body=${i.body}`]);
  ensure(LABELS.stall);
  run("gh", [
    "api",
    "-X",
    "POST",
    `${issuePath(i.issueNumber)}/labels`,
    "-f",
    `labels[]=${LABELS.stall.name}`,
  ]);
  console.log(`::warning::orphaned capsule — #${i.issueNumber} has no PR and no needs-eric`);
  return `🧭 orphaned capsule — \`${i.title}\` (commented on #${i.issueNumber})`;
}

/** One per capsule on a PR: a close that fails after it posted retries without posting again. */
const carriedMarker = (n) => `<!-- moneypenny:ask-carried #${n} -->`;

/** What the fix's PR is told when the ask moves onto it. */
function carriedToPrBody(i) {
  // A quote, not a `Needs from you` callout: a callout in a comment is one no list can see.
  const ask = i.carry.decision ? `\n\n> ${i.carry.decision}` : "";
  return `The question on #${i.issueNumber} moves here: that capsule closed because its job is passing again, and this held PR is the fix it was waiting on.${ask}\n\n${carriedMarker(i.issueNumber)}\n\n${FOOTER}`;
}

/**
 * The ask moves first, then the label, then the close — each strict, so a failure stops the chain
 * before anything claims the ask went somewhere it did not. Moving it: a comment on the fix's PR,
 * or `needs-session` on the capsule, which survives the close and is what the digest lists.
 * Then, like audit.mjs's `clearStaleInProgress`, if the `needs-eric` removal fails nothing closes.
 * One `gh issue close` carries the comment and the close together, so a closed capsule always says
 * why. "Not planned", not "completed": no fix merged here, the failure stopped on its own, and the
 * shipped sweep's merged-fix closes stay countable apart. A capsule is an issue, never a PR, so the
 * issue subcommand is safe here.
 */
export function closeProvenCapsule(
  i,
  { run = sh, ensure = ensureLabel, restAll = ghRestAll } = {},
) {
  const n = String(i.issueNumber);
  if (i.carry?.pr) {
    const said = restAll(`issues/${i.carry.pr}/comments`)
      .filter(trustedComment)
      .some((c) => String(c.body ?? "").includes(carriedMarker(i.issueNumber)));
    const body = carriedToPrBody(i);
    if (!said) {
      run("gh", ["api", "-X", "POST", `${issuePath(i.carry.pr)}/comments`, "-f", `body=${body}`]);
    }
  } else if (i.carry?.session) {
    ensure(LABELS.needsSession);
    const label = `labels[]=${LABELS.needsSession.name}`;
    run("gh", ["api", "-X", "POST", `${issuePath(i.issueNumber)}/labels`, "-f", label]);
  }
  if (i.clearNeedsEric) {
    const label = encodeURIComponent(LABELS.needsEric.name);
    run("gh", ["api", "-X", "DELETE", `${issuePath(i.issueNumber)}/labels/${label}`]);
  }
  run("gh", ["issue", "close", n, "--reason", "not planned", "--comment", i.body]);
  const said = i.said ?? "is passing again";
  console.log(`::notice::closed #${n} — ${said}`);
  return `🌤 closed #${n} — \`${i.title}\` ${said}`;
}
