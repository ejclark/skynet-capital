#!/usr/bin/env node
// THE ONE WRITER OF `in-progress` FOR PR-BACKED WORK — #4393 slice 1, criteria 1 and 2. When a PR
// opens that names an open issue, the issue gets `in-progress`; when that PR closes or merges and
// nothing else is still building it, the label comes off. Every build path opens a PR, so this one
// observer covers live sessions, /governor, /grind and the repair lane — the paths that applied
// nothing before (measured 2026-10-01: the in-flight cap could not see them at all).
//
//   node scripts/moneypenny/pr-in-progress.mjs <pr-number> <opened|reopened|edited|closed>
//
// IDEMPOTENT WITH THE CLAIM LANES, which still pre-apply the label at claim time (index.mjs's
// feedback/plan claims, `/work-issues` step 3 — the plan keeps them, criterion 2):
//   - opening a PR on an issue that already carries the label writes nothing;
//   - closing a PR never removes the label while ANOTHER open PR still names the issue, nor while a
//     live claim lease (`claim/feedback-<n>` / `claim/plan-<n>`) is held on it — a plan session
//     whose slice-1 PR merged is still building slice 2, and its own release path takes the label
//     off when it ends (#3960). A stale lease (past the 2h TTL) does not hold the label: the stall
//     audit's 6h sweep exists because a dead session's label otherwise sticks.
//
// A CLAIM LANE'S OWN PR IS NEVER MARKED (#5056 slice 2, the night chain). A `feedback/<n>` or
// `plan/<n>` PR is opened by a session whose claim already put `in-progress` on, and whose last
// write takes it off — "every ending removes `in-progress`", a held PR included. This sync landed
// seconds AFTER that last write and put the label back (plan/4469 on 2026-10-06: off 04:45:30Z,
// back on 04:45:54Z), so a build that had ended kept its slot until the 6h sweep ran on the next
// merge — on two nights that week the cap sat full of finished builds and the queue idled until
// morning. The spirit of #4393 holds (every build path is counted): a claim lane is counted by its
// claim, and the sweep stays off an issue its open PR names (`withoutOpenPr`, index.mjs). Closing
// such a PR still takes a leftover label off, exactly as before.
//
// Pure decision (`planPrInProgress`) + injected IO (`syncPrInProgress`), the split projects.mjs /
// projects-sync.mjs already use, so a spec drives the whole flow with no network. Every read is
// REST (the core bucket — #4183 is what spending GraphQL on a sweep costs); the label write is the
// existing `setInProgress` (labels.mjs), best-effort by design: a failed write warns, never fails.
//
// WIRED by .github/workflows/board-sync.yml (#4393 slice 2): every same-repo PR open, reopen, edit
// and close. A PR opened with the plain GITHUB_TOKEN emits no event, so it is not seen here.
import { ghRest, ghRestAll, withRetry } from "./gh.mjs";
import { isClaimed } from "./index.mjs";
import { LABELS, setInProgress } from "./labels.mjs";
import { derivePrIssues } from "./pr-issues.mjs";
import { isRetryableRestError } from "./projects.mjs";
import { readIssue } from "./projects-sync.mjs";

const APPLY_EVENTS = new Set(["opened", "reopened", "edited", "ready_for_review"]);
const RELEASE_EVENTS = new Set(["closed"]);

/** The feedback and plan lanes' build branches: `feedback/<n>`, `plan/<n>` (their prompts' own). */
const CLAIM_LANE_BRANCH = /^(?:feedback|plan)\/\d+$/;

/** Is this PR a claim lane's own build — the one kind whose `in-progress` the claim owns? */
export const isClaimLaneBuild = (headRef) => CLAIM_LANE_BRANCH.test(String(headRef ?? ""));

/** "apply" for an event that means a build is (still) open, "release" for one that ends it. */
export function intentOf(event) {
  if (APPLY_EVENTS.has(event)) return "apply";
  if (RELEASE_EVENTS.has(event)) return "release";
  return null;
}

/**
 * The pure decision for each issue a PR names. `facts` per issue: `isOpenIssue` (open, and an issue
 * rather than a PR), `hasLabel`, `namedByOtherOpenPr`, `leased`, `laneBuild` (the PR is a claim
 * lane's own — `isClaimLaneBuild`). Returns one row per issue:
 * `{number, action: "add" | "remove" | "none", reason}`.
 */
export function planPrInProgress({ event, facts = [] } = {}) {
  const intent = intentOf(event);
  return facts.map((f) => {
    const row = (action, reason) => ({ number: f.number, action, reason });
    if (!intent) return row("none", `event "${event}" neither opens nor ends a build`);
    if (!f.isOpenIssue) return row("none", "not an open issue");
    if (intent === "apply") {
      if (f.hasLabel) return row("none", "already in-progress");
      if (f.laneBuild) return row("none", "a claim lane build's own PR — its claim owns the label");
      return row("add", "an open PR names it");
    }
    if (!f.hasLabel) return row("none", "carries no in-progress");
    if (f.namedByOtherOpenPr) return row("none", "another open PR still names it");
    if (f.leased) return row("none", "a live claim lease still holds it");
    return row("remove", "its last open PR closed");
  });
}

const readPrFromRest = (number) =>
  withRetry(() => ghRest(`pulls/${number}`), { isTransient: isRetryableRestError });

const listOpenPrsFromRest = () => ghRestAll("pulls?state=open");

const leasedFromRefs = (number) =>
  isClaimed(`feedback-${number}`).claimed || isClaimed(`plan-${number}`).claimed;

const prEvidence = (pr) => ({
  title: pr?.title ?? "",
  body: pr?.body ?? "",
  headRef: pr?.head?.ref ?? "",
});

/**
 * Gather the facts over REST, decide, write. Every dependency is injectable; the defaults are the
 * real reads and `setInProgress`. Lazy where it matters: the open-PR list and the lease refs are
 * read only on a release that might remove a label, never on an open.
 */
export function syncPrInProgress(
  prNumber,
  event,
  {
    readPr = readPrFromRest,
    readIssueFn = (n) => readIssue(String(n)),
    listOpenPrs = listOpenPrsFromRest,
    isLeased = leasedFromRefs,
    setLabel = setInProgress,
  } = {},
) {
  const pr = readPr(prNumber);
  const named = derivePrIssues(prEvidence(pr));
  const intent = intentOf(event);
  const laneBuild = isClaimLaneBuild(pr?.head?.ref);

  const facts = named.map((number) => {
    if (!intent) return { number };
    const issue = readIssueFn(number);
    const isOpenIssue = issue?.state === "open" && !issue?.pull_request;
    const hasLabel = (issue?.labels ?? []).some((l) => l?.name === LABELS.inProgress.name);
    return { number, isOpenIssue, hasLabel, laneBuild };
  });

  if (intent === "release" && facts.some((f) => f.isOpenIssue && f.hasLabel)) {
    const stillNamed = new Set(
      listOpenPrs()
        .filter((p) => p?.number !== Number(prNumber))
        .flatMap((p) => derivePrIssues(prEvidence(p))),
    );
    for (const f of facts) {
      if (!(f.isOpenIssue && f.hasLabel)) continue;
      f.namedByOtherOpenPr = stillNamed.has(f.number);
      if (!f.namedByOtherOpenPr) f.leased = isLeased(f.number);
    }
  }

  const plan = planPrInProgress({ event, facts });
  for (const row of plan) {
    if (row.action === "add") row.written = setLabel(row.number, true);
    if (row.action === "remove") row.written = setLabel(row.number, false);
  }
  return { pr: Number(prNumber), event, named, plan };
}

function main() {
  const [prNumber, event] = process.argv.slice(2);
  if (!(/^\d+$/.test(prNumber ?? "") && event)) {
    console.error("usage: pr-in-progress.mjs <pr-number> <opened|reopened|edited|closed>");
    process.exit(1);
  }
  const { named, plan } = syncPrInProgress(prNumber, event);
  if (named.length === 0) {
    console.log(`PR #${prNumber} (${event}): names no issue — nothing to mark`);
    return;
  }
  for (const row of plan) {
    const wrote = row.written === false ? " (write FAILED — see warning above)" : "";
    console.log(
      `PR #${prNumber} (${event}) → #${row.number}: ${row.action} — ${row.reason}${wrote}`,
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
