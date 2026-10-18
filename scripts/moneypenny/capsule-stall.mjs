// CAPSULE STALL — the two ways a CI repair capsule stops moving without anyone noticing (#5727,
// from the 2026-10-18 loop census, docs/process/LEARNING-LOOP.md → "The loop census").
//
//   1. ORPHANED. A `ci-failure` capsule with no linked PR and no `needs-eric`: the repair session
//      never ran, or ended without a PR. #4395 sat 17 days like that; each recurrence added a
//      comment and nothing else, because repair.mjs dispatches only when it FILES a capsule.
//   2. ERODED. A capsule waiting on `needs-eric` whose failing job has since gone green on every
//      push. #5577 held the label two days after that, until someone closed it by hand. The
//      decision it was waiting on no longer blocks anything, so the label comes off.
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
import { normalizeJobName } from "./repair.mjs";

/** A capsule younger than this may still have its repair session running. */
export const ORPHAN_AFTER_HOURS = 24;
/** Consecutive green pushes that count as "the failing job has gone green". */
export const GREEN_PUSHES = 3;
export const ORPHAN_MARKER = "<!-- moneypenny:capsule-orphan -->";
export const ERODED_MARKER = "<!-- moneypenny:capsule-eroded -->";

const names = (labels = []) => labels.map((l) => (typeof l === "string" ? l : l?.name));
const hours = (fromIso, nowMs) => Math.floor((nowMs - Date.parse(fromIso)) / 3_600_000);

/**
 * Which workflow and job a capsule tracks. Read from the metadata table `repair.mjs`'s `issueBody`
 * writes (`| **Workflow** | … |`, `| **Job** | \`…\` |`); the title is the fallback, since a long
 * signature is clamped to 120 characters there and the table never is.
 */
export function capsuleTarget(issue = {}) {
  const body = String(issue.body ?? "");
  const workflow = /^\| \*\*Workflow\*\* \| (.+?) \|$/m.exec(body)?.[1];
  const job = /^\| \*\*Job\*\* \| `(.+?)` \|$/m.exec(body)?.[1];
  if (workflow && job) return { workflow, job };
  const m = /^\[ci\] (.+?) — (.+)$/.exec(String(issue.title ?? ""));
  return m && !m[2].endsWith("…") ? { workflow: m[1], job: m[2] } : null;
}

/** Did this job pass in this run? Every matrix leg folded onto its name must have succeeded, and at
 *  least one must exist — a job that did not run at all proves nothing. */
export function jobPassed(jobs = [], job) {
  const mine = (jobs ?? []).filter((j) => normalizeJobName(j?.name) === job);
  return mine.length > 0 && mine.every((j) => j.conclusion === "success");
}

/** Does the issue timeline show a PR that references it, still open or merged? */
export function hasLinkedPr(timeline = []) {
  return (timeline ?? []).some((e) => {
    if (e?.event === "connected") return true;
    const pr = e?.event === "cross-referenced" ? e.source?.issue : null;
    return Boolean(pr?.pull_request) && (pr.state === "open" || Boolean(pr.pull_request.merged_at));
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

/** The runs that prove a job green: the newest `n` filed after the capsule, all passing — else null. */
export function greenProof(capsule, n = GREEN_PUSHES) {
  const target = capsuleTarget(capsule);
  if (!target) return null;
  const filed = Date.parse(capsule.createdAt);
  const runs = (capsule.recentRuns ?? [])
    .filter((r) => Date.parse(r.createdAt) > filed)
    .slice(0, n);
  if (runs.length < n || !runs.every((r) => jobPassed(r.jobs, target.job))) return null;
  return { ...target, runs };
}

function orphanBody(c) {
  return `🧭 **No repair has reached this** — this capsule was filed **${c.ageHours}h** ago and has no linked PR and no \`${LABELS.needsEric.name}\`. The repair session either never ran or ended without opening a PR, and a recurrence only adds a comment here.\n\nTo move it: open a fix PR that says \`Closes #${c.number}\`, apply \`${LABELS.needsEric.name}\` with the reason if the fix is Eric's call, or close it if the job passes again.\n\n${ORPHAN_MARKER}\n\n${FOOTER}`;
}

function erodedBody(c, proof) {
  const runs = proof.runs.map((r) => `[${r.id}](${r.url})`).join(", ");
  return `🌤 **Passing again — \`${LABELS.needsEric.name}\` removed** — \`${proof.job}\` (${proof.workflow}) passed on the last ${proof.runs.length} pushes to \`main\`: ${runs}. The failure this was waiting on has stopped happening, so the decision no longer blocks anything.\n\nThis issue stays open. It closes the usual way, when a PR that says \`Closes #${c.number}\` merges, or by hand if nothing needs fixing. If the decision still stands, re-apply \`${LABELS.needsEric.name}\`: this check removes it only once.\n\n${ERODED_MARKER}\n\n${FOOTER}`;
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
    // a second comment telling the reader nothing new.
    if (posted.includes(ORPHAN_MARKER) || posted.includes(ERODED_MARKER)) continue;
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
 * The newest completed push runs on `main` of one workflow, each with its jobs. A run whose jobs do
 * not fit one page is left without them, so `jobPassed` cannot be proven by a partial list.
 */
function recentRuns(workflowId, { rest }) {
  const page = rest(
    `actions/workflows/${workflowId}/runs?branch=main&event=push&status=completed&per_page=20`,
  );
  return (page?.workflow_runs ?? [])
    .filter((r) => DECIDED.has(r.conclusion))
    .slice(0, GREEN_PUSHES)
    .map((r) => {
      const jobs = rest(`actions/runs/${r.id}/jobs?per_page=100`);
      const whole = (jobs?.jobs ?? []).length >= (jobs?.total_count ?? 0);
      return { id: r.id, url: r.html_url, createdAt: r.created_at, jobs: whole ? jobs.jobs : [] };
    });
}

/** Read every open capsule and the lookups each one needs. Loud on failure, like audit.mjs. */
export function gatherCapsules(nowMs, { rest = ghRest, restAll = ghRestAll } = {}) {
  const open = restAll(`issues?state=open&labels=${encodeURIComponent(LABELS.ciFailure.name)}`);
  let workflowIds;
  const capsules = [];
  for (const i of open.filter((x) => !x.pull_request)) {
    const need = lookupsFor(i, nowMs);
    if (!(need.orphan || need.eroded)) continue;
    const comments = restAll(`issues/${i.number}/comments`)
      .filter(trusted)
      .map((c) => c.body ?? "");
    const c = {
      number: i.number,
      title: i.title,
      body: i.body,
      createdAt: i.created_at,
      ageHours: hours(i.created_at, nowMs),
      labels: names(i.labels),
      comments,
    };
    if (need.orphan) c.hasLinkedPr = hasLinkedPr(restAll(`issues/${i.number}/timeline`));
    const target = need.eroded && !comments.join("\n").includes(ERODED_MARKER) && capsuleTarget(i);
    if (target) {
      workflowIds ??= new Map(
        (rest("actions/workflows?per_page=100")?.workflows ?? []).map((w) => [w.name, w.id]),
      );
      const id = workflowIds.get(target.workflow);
      if (id) c.recentRuns = recentRuns(id, { rest });
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
