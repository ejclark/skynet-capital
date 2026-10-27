// CAPSULE STALL — the two ways a CI repair capsule stops moving without anyone noticing (#5727,
// from the 2026-10-18 loop census, docs/process/LEARNING-LOOP.md → "The loop census").
//
//   1. ORPHANED. A `ci-failure` capsule with no linked PR and no `needs-eric`: the repair session
//      never ran, or ended without a PR. #4395 sat 17 days like that; each recurrence added a
//      comment and nothing else, because repair.mjs dispatches only when it FILES a capsule.
//   2. ERODED. A capsule waiting on `needs-eric` whose failing job has since gone green on every
//      push. #5577 held the label two days after that, until someone closed it by hand. The
//      decision it was waiting on no longer blocks anything, so the label comes off. "Green" means
//      the failing step ran and passed: a job that skipped it proves nothing (#6076).
//
// Both ride the `--audit` push tick (scripts/moneypenny/index.mjs), beside audit.mjs, which is at
// its size cap. Same doctrine as audit(): comment and move a label, never decide more than that.
// It NEVER re-dispatches a repair (that needs a workflow edit, which is protected) and NEVER closes
// a capsule — closing stays the shipped sweep's job, when a `Closes #n` PR merges.
//
// REST only (the core bucket — gh.mjs `ghRest` says why), and one comment per capsule per condition,
// deduped by a hidden marker in the comment itself. Pure core (`capsuleIntents` and its helpers) +
// a thin gather/act shell, so every branch is fixture-drivable.
import { ghRest, ghRestAll, sh } from "./gh.mjs";
import { ensureLabel, FOOTER, LABELS } from "./labels.mjs";
import { LOST_RUNNER, normalizeJobName } from "./repair.mjs";

/** A capsule younger than this may still have its repair session running. */
export const ORPHAN_AFTER_HOURS = 24;
/** Consecutive green pushes that count as "the failing job has gone green". */
export const GREEN_PUSHES = 3;
export const ORPHAN_MARKER = "<!-- moneypenny:capsule-orphan -->";
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

/** What the gather needs to read for this capsule, from its labels and age alone — so the costly
 *  per-capsule reads happen only where a condition could still fire. */
export function lookupsFor(issue, nowMs, orphanAfterHours = ORPHAN_AFTER_HOURS) {
  const labels = names(issue.labels);
  if (labels.includes(LABELS.needsEric.name)) return { orphan: false, eroded: true };
  const old = hours(issue.created_at ?? issue.createdAt, nowMs) >= orphanAfterHours;
  return { orphan: old && !labels.includes(LABELS.stall.name), eroded: false };
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

/** The runs that prove a job green: the newest `n` filed after the capsule that tested its fault,
 *  all passing — else null. */
export function greenProof(capsule, n = GREEN_PUSHES) {
  const target = capsuleTarget(capsule);
  if (!target) return null;
  const filed = Date.parse(capsule.createdAt);
  const after = (capsule.recentRuns ?? []).filter((r) => Date.parse(r.createdAt) > filed);
  const { passes } = provenRuns(after, target, n);
  return passes.length >= n ? { ...target, runs: passes } : null;
}

/**
 * An eroded capsule has already said what state it is in, so the orphan flag stays quiet after it —
 * until the fault comes back. A `Failed again` after the eroded comment means the green streak
 * ended, and nothing is repairing it again (#6076: #5955 sat a day and a half like that).
 */
function recurredSinceEroded(comments = []) {
  const eroded = comments.findLastIndex((b) => String(b ?? "").includes(ERODED_MARKER));
  return eroded >= 0 && comments.slice(eroded + 1).some(recurrence);
}

function orphanBody(c) {
  return `🧭 **No repair has reached this** — this capsule was filed **${c.ageHours}h** ago and has no linked PR and no \`${LABELS.needsEric.name}\`. The repair session either never ran or ended without opening a PR, and a recurrence only adds a comment here.\n\nTo move it: open a fix PR that says \`Closes #${c.number}\`, apply \`${LABELS.needsEric.name}\` with the reason if the fix is Eric's call, or close it if the job passes again.\n\n${ORPHAN_MARKER}\n\n${FOOTER}`;
}

function erodedBody(c, proof) {
  const runs = proof.runs.map((r) => `[${r.id}](${r.url})`).join(", ");
  const ran = proof.step ? ` that ran \`${proof.step}\`` : "";
  return `🌤 **Passing again — \`${LABELS.needsEric.name}\` removed** — \`${proof.job}\` (${proof.workflow}) passed on the last ${proof.runs.length} pushes to \`main\`${ran}: ${runs}. The failure this was waiting on has stopped happening, so the decision no longer blocks anything.\n\nThis issue stays open. It closes the usual way, when a PR that says \`Closes #${c.number}\` merges, or by hand if nothing needs fixing. If the decision still stands, re-apply \`${LABELS.needsEric.name}\`: this check removes it only once.\n\n${ERODED_MARKER}\n\n${FOOTER}`;
}

/**
 * The decision, pure. Each capsule carries its labels, age, the trusted comment bodies (for the
 * markers) and whichever lookups `lookupsFor` asked for: `hasLinkedPr` for an orphan candidate,
 * `recentRuns` (newest first, each with its jobs) for an escalated one. A lookup that is absent is
 * unknown, and unknown never fires.
 */
export function capsuleIntents({ capsules = [], orphanAfterHours = ORPHAN_AFTER_HOURS } = {}) {
  const intents = [];
  for (const c of capsules) {
    const labels = names(c.labels);
    const posted = (c.comments ?? []).join("\n");
    if (labels.includes(LABELS.needsEric.name)) {
      const proof = posted.includes(ERODED_MARKER) ? null : greenProof(c);
      if (proof) {
        const kind = "clear-eroded-needs-eric";
        intents.push({ kind, issueNumber: c.number, title: c.title, body: erodedBody(c, proof) });
      }
      continue;
    }
    if (c.ageHours < orphanAfterHours || c.hasLinkedPr !== false) continue;
    if (labels.includes(LABELS.stall.name)) continue;
    // An eroded capsule has already said what state it is in; flagging it orphaned next would be
    // a second comment telling the reader nothing new — unless the fault has come back since.
    if (posted.includes(ORPHAN_MARKER)) continue;
    if (posted.includes(ERODED_MARKER) && !recurredSinceEroded(c.comments)) continue;
    const kind = "flag-capsule-orphan";
    intents.push({ kind, issueNumber: c.number, title: c.title, body: orphanBody(c) });
  }
  return intents;
}

// ── the impure half ───────────────────────────────────────────────────────────

/** Comments the markers may be read from: this repo's people and bots. The repo is public, and a
 *  stranger's comment carrying a marker must not switch a check off (#2224). */
const TRUSTED = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);
const trusted = (c) => TRUSTED.has(c?.author_association) || c?.user?.type === "Bot";

/** A run counts toward "the last pushes" only if it actually tested something. */
const DECIDED = new Set(["success", "failure"]);

/**
 * The newest completed push runs on `main` of one workflow filed after the capsule, each with its
 * jobs, read newest first until `provenRuns` has its answer — so a streak of debounce skips is paged
 * past, up to one page of 20, instead of filling the window (#6076). A run whose jobs do not fit one
 * page is left without them, so `jobPassed` cannot be proven by a partial list.
 */
function recentRuns(workflowId, target, filedIso, { rest }) {
  const page = rest(
    `actions/workflows/${workflowId}/runs?branch=main&event=push&status=completed&per_page=20`,
  );
  const filed = Date.parse(filedIso);
  const runs = [];
  for (const r of page?.workflow_runs ?? []) {
    const counts = DECIDED.has(r.conclusion) && Date.parse(r.created_at) > filed;
    if (!counts) continue;
    const jobs = rest(`actions/runs/${r.id}/jobs?per_page=100`);
    const whole = (jobs?.jobs ?? []).length >= (jobs?.total_count ?? 0);
    runs.push({ id: r.id, url: r.html_url, createdAt: r.created_at, jobs: whole ? jobs.jobs : [] });
    if (provenRuns(runs, target).ended) break;
  }
  return runs;
}

/** Read every open capsule and the lookups each one needs. Loud on failure, like audit.mjs. */
export function gatherCapsules(nowMs, { rest = ghRest, restAll = ghRestAll } = {}) {
  const open = restAll(`issues?state=open&labels=${encodeURIComponent(LABELS.ciFailure.name)}`);
  let workflowIds;
  const capsules = [];
  for (const i of open.filter((x) => !x.pull_request)) {
    const need = lookupsFor(i, nowMs);
    if (!(need.orphan || need.eroded)) continue;
    const read = restAll(`issues/${i.number}/comments`).filter(trusted);
    const comments = read.map((c) => c.body ?? "");
    const lastRecurrence = read.filter((c) => recurrence(c.body)).at(-1)?.created_at;
    const c = {
      number: i.number,
      title: i.title,
      body: i.body,
      createdAt: i.created_at,
      ageHours: hours(i.created_at, nowMs),
      labels: names(i.labels),
      comments,
    };
    if (need.orphan) {
      c.hasLinkedPr = hasLinkedPr(restAll(`issues/${i.number}/timeline`), lastRecurrence);
    }
    const target = need.eroded && !comments.join("\n").includes(ERODED_MARKER) && capsuleTarget(i);
    if (target) {
      workflowIds ??= new Map(
        (rest("actions/workflows?per_page=100")?.workflows ?? []).map((w) => [w.name, w.id]),
      );
      const id = workflowIds.get(target.workflow);
      if (id) c.recentRuns = recentRuns(id, target, i.created_at, { rest });
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
 * Label first and strict, like audit.mjs's `clearStaleInProgress`: if the removal fails, no comment
 * claims it happened. A comment lost after a good removal costs the explanation, never a storm: the
 * label is gone, so this check cannot fire on the capsule again.
 */
export function clearErodedNeedsEric(i, { run = sh } = {}) {
  const label = encodeURIComponent(LABELS.needsEric.name);
  run("gh", ["api", "-X", "DELETE", `${issuePath(i.issueNumber)}/labels/${label}`]);
  run("gh", ["api", "-X", "POST", `${issuePath(i.issueNumber)}/comments`, "-f", `body=${i.body}`]);
  console.log(`::notice::needs-eric removed from #${i.issueNumber} — its failing job is green`);
  return `🌤 \`${LABELS.needsEric.name}\` removed — \`${i.title}\` is passing again (#${i.issueNumber})`;
}
