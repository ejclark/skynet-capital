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
// A fault that comes back after the close files a fresh capsule through repair.mjs as any new
// failure does.
//
// REST only (the core bucket — gh.mjs `ghRest` says why), and one comment per capsule per condition,
// deduped by a hidden marker in the comment itself. Pure core (`capsuleIntents` and its helpers) +
// a thin gather/act shell, so every branch is fixture-drivable.
import { ghRest, ghRestAll, sh, trustedComment } from "./gh.mjs";
import { ensureLabel, FOOTER, LABELS } from "./labels.mjs";
import { LOST_RUNNER, normalizeJobName } from "./repair.mjs";

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

/** Whether the gather needs the costlier PR read for this capsule, from its labels and age alone:
 *  only where the orphan flag could still fire. The proof is read for every open capsule, since
 *  green closes any of them. */
export function lookupsFor(issue, nowMs, orphanAfterHours = ORPHAN_AFTER_HOURS) {
  const labels = names(issue.labels);
  if (labels.includes(LABELS.needsEric.name)) return { orphan: false };
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

function provenBody(proof, clearNeedsEric) {
  const runs = proof.runs.map((r) => `[${r.id}](${r.url})`).join(", ");
  const ran = proof.step ? ` that ran \`${proof.step}\`` : "";
  const label = clearNeedsEric
    ? ` \`${LABELS.needsEric.name}\` comes off with it: the decision it waited on no longer blocks anything.`
    : "";
  return `🌤 **Passing again — closed** — \`${proof.job}\` (${proof.workflow}) passed on the last ${proof.runs.length} runs on \`main\`${ran}: ${runs}. The failure this tracked has stopped happening, so there is nothing left here to repair.${label}\n\nIf it comes back, the repair lane files a fresh issue for it; reopen this one only to keep its history together.\n\n${PROVEN_MARKER}\n\n${FOOTER}`;
}

/**
 * The decision, pure. Each capsule carries its labels, age, the trusted comment bodies (for the
 * markers), when its fault last recurred, and whichever lookups `lookupsFor` asked for:
 * `hasLinkedPr` for an orphan candidate, `recentRuns` (newest first, each with its jobs) for the
 * proof. A lookup that is absent is unknown, and unknown never fires. Proof is judged first and
 * for every capsule: a green one closes, whatever else it carries.
 */
export function capsuleIntents({ capsules = [], orphanAfterHours = ORPHAN_AFTER_HOURS } = {}) {
  const intents = [];
  for (const c of capsules) {
    const labels = names(c.labels);
    const posted = (c.comments ?? []).join("\n");
    const escalated = labels.includes(LABELS.needsEric.name);
    // This check speaks once. A proven comment on an OPEN capsule means a person reopened it; a
    // legacy eroded comment beside a present `needs-eric` means the owner re-applied the label
    // after that check removed it. Either is his call and stays, green or not.
    const spoke = posted.includes(PROVEN_MARKER) || (escalated && posted.includes(ERODED_MARKER));
    const proof = spoke ? null : greenProof(c);
    if (proof) {
      const clearNeedsEric = escalated;
      intents.push({
        kind: "close-proven-capsule",
        issueNumber: c.number,
        title: c.title,
        body: provenBody(proof, clearNeedsEric),
        clearNeedsEric,
      });
      continue;
    }
    // Not proven. An escalated capsule waits on its decision; the rest may be orphans.
    if (escalated) continue;
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
    const target = capsuleTarget(i);
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

/**
 * Label first and strict, like audit.mjs's `clearStaleInProgress`: if the `needs-eric` removal
 * fails, nothing closes and no comment claims it did. Then one `gh issue close` carries the comment
 * and the close together, so a closed capsule always says why. "Not planned", not "completed":
 * no fix merged here, the failure stopped on its own, and the shipped sweep's merged-fix closes
 * stay countable apart. A capsule is an issue, never a PR, so the issue subcommand is safe here.
 */
export function closeProvenCapsule(i, { run = sh } = {}) {
  const n = String(i.issueNumber);
  if (i.clearNeedsEric) {
    const label = encodeURIComponent(LABELS.needsEric.name);
    run("gh", ["api", "-X", "DELETE", `${issuePath(i.issueNumber)}/labels/${label}`]);
  }
  run("gh", ["issue", "close", n, "--reason", "not planned", "--comment", i.body]);
  console.log(`::notice::closed #${n} — its failing job is green again`);
  return `🌤 closed #${n} — \`${i.title}\` is passing again`;
}
