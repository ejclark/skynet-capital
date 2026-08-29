#!/usr/bin/env node
// FEEDBACK-TO-SHIPPED LATENCY — is "it's getting slower" a real number? (#896)
//
// docs/LESSONS.md banks Eric's own words, 2026-08-29: "the total time to think on feedback to
// build features has been increasing." Nothing in the repo measured that before this script — the
// friction audit that surfaced the complaint had to answer it by reading PR/issue timestamps by
// hand. This is that answer, made repeatable.
//
//   node scripts/latency-scan.mjs                 # human report
//   node scripts/latency-scan.mjs --json           # machine shape (for /secretary's digest)
//   node scripts/latency-scan.mjs --table          # markdown table, one row per issue
//   ... --since=YYYY-MM-DD                         # window start (default: 45 days before --today)
//   ... --today=YYYY-MM-DD                         # deterministic "now" override (tests, backfills)
//   ... --explain                                  # state as JSON on stdin instead of GitHub (specs)
//
// TWO TIMELINES (#896's acceptance criteria):
//   plan issue     — open → first `ready`-flip comment → closed (the `plan` label; readiness
//                    detection reuses `isReadySignal` from postmaster-plan-claim.mjs verbatim, so
//                    "what counts as ready" never drifts into a second definition)
//   feedback issue — open → closed (the `feedback` label; no ready-gate in that lane)
//
// CLOSED-AT STANDS IN FOR "SHIPPED", ON PURPOSE. The obvious source of truth for "merged" would be
// the linking PR's `merged_at` — but this repo's own shipped-scan closes an issue itself once it
// detects the merge (deploy-lag.mjs's header explains why: a GITHUB_TOKEN-armed merge emits no
// native `push`, so GitHub's own "Closes #N" auto-close does not fire the way a hand-merged PR's
// would). Checked against #852 live: its `closed` event carries no `commit_id` at all — the close
// is the shipped-scan's own API call, not GitHub's native link. `closed_at` is therefore already
// the honest "this shipped" timestamp for this repo's issues, not a proxy one step removed from it,
// and fetching every linked PR's `merged_at` on top would be a second, more expensive way to ask
// the same question. A plan issue closed by hand with no PR at all reads as "shipped" too rarely to
// be worth guarding against yet — if that ever shows up in the data, split it out then.
//
// DETECT-ONLY, NOT A GATE (#896's explicit constraint). This is a baseline-and-trend instrument,
// the same doctrine as comms-scan.mjs: read the numbers for a while before anyone ratchets a budget
// on them. No `--candidate` mode — there is nothing yet for a coach to dispatch against.
//
// Loud-failure doctrine: an unreadable GitHub response is an error, never a silent zero.
import { readFileSync } from "node:fs";
import { ghRest } from "./postmaster-gh.mjs";
import { isReadySignal } from "./postmaster-plan-claim.mjs";

const DEFAULT_WINDOW_DAYS = 45;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PAGES = 5; // 500 issues per label — this repo's whole history fits in one page today.

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const has = (name) => process.argv.includes(`--${name}`);

/** Days between two ISO timestamps, one decimal place. Either side missing → null, not 0 — an
 *  issue still open has no "closed" half to measure, and that is a different fact than "instant". */
export function daysBetween(fromIso, toIso) {
  if (!(fromIso && toIso)) return null;
  const ms = Date.parse(toIso) - Date.parse(fromIso);
  if (!Number.isFinite(ms)) return null;
  return Math.round((ms / 86_400_000) * 10) / 10;
}

/** The earliest comment on or after `afterIso` that reads as a ready-flip, or null. Reuses the
 *  exact signal `postmaster-plan-claim.mjs` dispatches a build on — this is not a second, looser
 *  definition of "ready", it is the same one read after the fact. */
export function firstReadyCommentAt(comments = [], afterIso) {
  const after = afterIso ? Date.parse(afterIso) : -Infinity;
  const hits = comments
    .filter((c) => isReadySignal(c?.body) && Date.parse(c?.createdAt) >= after)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  return hits[0]?.createdAt ?? null;
}

/** Pure. One plan issue's three-timestamp breakdown: open → ready → closed. */
export function planLatency(plan = {}) {
  const { number, title, state, createdAt, closedAt, comments = [] } = plan;
  const readyAt = firstReadyCommentAt(comments, createdAt);
  return {
    number,
    title,
    state,
    readyAt,
    openToReadyDays: daysBetween(createdAt, readyAt),
    readyToClosedDays: daysBetween(readyAt, closedAt),
    openToClosedDays: daysBetween(createdAt, closedAt),
  };
}

/** Pure. One feedback issue's single span: open → closed. */
export function feedbackLatency(issue = {}) {
  const { number, title, state, createdAt, closedAt } = issue;
  return { number, title, state, openToClosedDays: daysBetween(createdAt, closedAt) };
}

function finiteNums(xs) {
  return xs.filter((n) => typeof n === "number" && Number.isFinite(n));
}

export function median(xs) {
  const ys = finiteNums(xs).sort((a, b) => a - b);
  if (!ys.length) return null;
  const mid = Math.floor(ys.length / 2);
  return ys.length % 2 ? ys[mid] : Math.round(((ys[mid - 1] + ys[mid]) / 2) * 10) / 10;
}

export function mean(xs) {
  const ys = finiteNums(xs);
  if (!ys.length) return null;
  return Math.round((ys.reduce((a, b) => a + b, 0) / ys.length) * 10) / 10;
}

/** Pure. Rolls per-issue rows into the numbers a digest actually wants: medians (robust to one
 *  slow outlier skewing an average), plus enough counts to say how much data backs them. */
export function summarizeLatency(planRows = [], feedbackRows = []) {
  const closedPlans = planRows.filter((r) => r.state === "closed");
  const closedFeedback = feedbackRows.filter((r) => r.state === "closed");
  const withReady = planRows.filter((r) => r.readyAt);
  return {
    plans: {
      total: planRows.length,
      closed: closedPlans.length,
      open: planRows.length - closedPlans.length,
      withReadySignal: withReady.length,
      medianOpenToClosedDays: median(closedPlans.map((r) => r.openToClosedDays)),
      meanOpenToClosedDays: mean(closedPlans.map((r) => r.openToClosedDays)),
      medianOpenToReadyDays: median(withReady.map((r) => r.openToReadyDays)),
      medianReadyToClosedDays: median(withReady.map((r) => r.readyToClosedDays)),
    },
    feedback: {
      total: feedbackRows.length,
      closed: closedFeedback.length,
      open: feedbackRows.length - closedFeedback.length,
      medianOpenToClosedDays: median(closedFeedback.map((r) => r.openToClosedDays)),
      meanOpenToClosedDays: mean(closedFeedback.map((r) => r.openToClosedDays)),
    },
  };
}

/** Pure. Human-readable report — the digest-paste-ready default. */
export function renderReport(summary, { since, today } = {}) {
  const { plans: p, feedback: f } = summary;
  const lines = [`Feedback-to-shipped latency — since ${since ?? "?"} (as of ${today ?? "?"})`, ""];
  lines.push(
    `  plans:    ${p.closed}/${p.total} closed · median open→closed ${fmt(p.medianOpenToClosedDays)} ` +
      `(mean ${fmt(p.meanOpenToClosedDays)})`,
  );
  if (p.withReadySignal) {
    lines.push(
      `            ${p.withReadySignal} carried a detectable ready-flip · median open→ready ` +
        `${fmt(p.medianOpenToReadyDays)} · ready→closed ${fmt(p.medianReadyToClosedDays)}`,
    );
  } else {
    lines.push("            no plan issue in this window carried a detectable ready-flip comment");
  }
  lines.push(
    `  feedback: ${f.closed}/${f.total} closed · median open→closed ${fmt(f.medianOpenToClosedDays)} ` +
      `(mean ${fmt(f.meanOpenToClosedDays)})`,
  );
  return lines.join("\n");
}

const fmt = (d) => (d === null || d === undefined ? "-" : `${d}d`);

/** Pure. Markdown table — one row per issue, plans then feedback, for pasting into a digest. */
export function renderTable(planRows = [], feedbackRows = []) {
  const lines = [
    "| issue | kind | state | open→ready | ready→closed | open→closed |",
    "|---|---|---|---:|---:|---:|",
    ...planRows.map(
      (r) =>
        `| #${r.number} | plan | ${r.state} | ${fmt(r.openToReadyDays)} | ${fmt(r.readyToClosedDays)} | ${fmt(r.openToClosedDays)} |`,
    ),
    ...feedbackRows.map(
      (r) => `| #${r.number} | feedback | ${r.state} | - | - | ${fmt(r.openToClosedDays)} |`,
    ),
  ];
  return lines.join("\n");
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function defaultSince(today) {
  return isoDate(new Date(Date.parse(`${today}T00:00:00Z`) - DEFAULT_WINDOW_DAYS * 86_400_000));
}

/** Impure: page a labeled-issue list from the CORE REST bucket (never GraphQL — see
 *  postmaster-gh.mjs's own header on why). Filters out pull requests (the issues endpoint returns
 *  both) and anything opened before `sinceDate`. */
function listLabeledIssues(label, sinceDate) {
  const items = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = ghRest(`issues?labels=${label}&state=all&per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    items.push(...batch);
    if (batch.length < 100) break;
  }
  const sinceMs = Date.parse(`${sinceDate}T00:00:00Z`);
  return items.filter((i) => !i.pull_request && Date.parse(i.created_at) >= sinceMs);
}

/** Impure: gather both timelines for real. Plan issues also carry their comments, since the
 *  ready-flip lives there; feedback issues need only their own open/close stamps. */
function gatherLatencyDeps(sinceDate) {
  const plans = listLabeledIssues("plan", sinceDate).map((i) => {
    const comments = ghRest(`issues/${i.number}/comments?per_page=100`) ?? [];
    return {
      number: i.number,
      title: i.title,
      state: i.state,
      createdAt: i.created_at,
      closedAt: i.closed_at,
      comments: comments.map((c) => ({ body: c.body, createdAt: c.created_at })),
    };
  });
  const feedback = listLabeledIssues("feedback", sinceDate).map((i) => ({
    number: i.number,
    title: i.title,
    state: i.state,
    createdAt: i.created_at,
    closedAt: i.closed_at,
  }));
  return { planIssues: plans, feedbackIssues: feedback };
}

/** Read a whole stdin stream synchronously — the `--explain` fixture channel, same pattern as
 *  deploy-lag.mjs (see tests/scripts/*.spec.ts for how the specs drive it). */
function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  const today = arg("today") ?? isoDate(new Date());
  if (!DATE_RE.test(today)) throw new Error("latency-scan: --today must be YYYY-MM-DD.");
  const since = arg("since") ?? defaultSince(today);
  if (!DATE_RE.test(since)) throw new Error("latency-scan: --since must be YYYY-MM-DD.");

  const { planIssues, feedbackIssues } = has("explain")
    ? (() => {
        const state = JSON.parse(readStdin() || "{}");
        return { planIssues: state.planIssues ?? [], feedbackIssues: state.feedbackIssues ?? [] };
      })()
    : gatherLatencyDeps(since);

  const planRows = planIssues.map(planLatency);
  const feedbackRows = feedbackIssues.map(feedbackLatency);
  const summary = summarizeLatency(planRows, feedbackRows);

  if (has("json")) {
    console.log(JSON.stringify({ since, today, summary, planRows, feedbackRows }, null, 2));
    return;
  }
  if (has("table")) {
    console.log(renderTable(planRows, feedbackRows));
    return;
  }
  console.log(renderReport(summary, { since, today }));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
