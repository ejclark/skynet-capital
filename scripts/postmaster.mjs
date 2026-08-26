#!/usr/bin/env node
// THE POSTMASTER — one router for every issue-driven automation in this repo.
//
//   node scripts/postmaster.mjs                          # read $GITHUB_EVENT_PATH, act
//   node scripts/postmaster.mjs --dry-run --event f.json # print the intents, touch nothing
//   node scripts/postmaster.mjs --claim-feedback         # claim the labelled issue + pick its model
//   node scripts/postmaster.mjs --model-tier < body.md   # just the tier decision
//
// WHY THIS EXISTS (Eric, 2026-08-17: "the handoff system has a lot of workflows which feels
// extra… it'd be nice to have a postmaster"). Four workflows had grown to 482 lines carrying **202
// lines of bash inside `run:` blocks** — the one corner of this repo that escaped its own
// pure-functions-with-specs doctrine, and precisely where the defects lived. The 2026-08-17
// double-fire (two runs, two receipts, and with a real zip two imports racing the same branch) was
// a trigger-and-bash bug no spec could have caught, because there was no spec.
//
// THE SHAPE: **decide, then do.** `route()` is pure — an event plus its dependencies in, a list of
// intents out. `execute()` is the only part that touches GitHub or git. Every routing branch is
// therefore testable by feeding a fixture payload (tests/fixtures/events/), which is the whole
// point of the exercise.
//
// GitHub hands the entire event payload to a workflow at $GITHUB_EVENT_PATH, so the router needs no
// bespoke plumbing to know what happened — it reads one JSON file.
//
// WHAT IT DOES NOT OWN: the event scanner (`event-scan.mjs`) stays exactly as it is and is
// invoked, never reimplemented — it carries its own hard-won failure modes.
//
// THE HANDOFF LANES ARE GONE (2026-08-21, Eric: "temporary documents like this should be managed
// in github issues, not baked into the sourcecode"): no docs/handoffs sweep, no inbox zip import,
// no flip button, no handoff build job. Design handoffs are now `[handoff]` issues (docs/HANDOFFS.md)
// built by comment-triggered sessions. The claim LEASE survives — the feedback lane runs on it.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

// ── labels this repo speaks ───────────────────────────────────────────────────
//
// TWO TIERS, and the flag is the whole design (#500). `managed: true` means "this lane APPLIES the
// label, so it must exist and it must look the way this file says" — those are upserted on every
// run. Everything else is *registered but not owned*: named here so a lookup, a scan, or the
// issue-lint advisory can resolve it, and deliberately never rewritten.
//
// The distinction exists because the naive version of #500 — register the missing labels, let
// `ensureVocabulary()` upsert them all — quietly makes this script the owner of GitHub's own
// defaults (`bug`, `enhancement`) and of anything Eric recolors in the UI: he changes a color,
// the next push to main silently changes it back, and nothing anywhere says why. A registry that
// exists so other code can VALIDATE against it must not also be a writer.
//
// The values below are the repo's REAL ones, read from the API, not aspirational ones. `idea` and
// `feedback` genuinely are default-grey with no description today; recording them as anything
// prettier would make this registry lie about the repo it describes, and validation built on a
// lie is worse than no validation. Upgrading those two is its own deliberate change.
export const LABELS = {
  event: {
    name: "event-research",
    color: "0e8a16",
    description: "A calendar event awaiting initial research",
    managed: true,
  },
  stall: {
    name: "stall-flagged",
    color: "d93f0b",
    description: "The stall audit pinged this once — dispatched work nothing has claimed",
    managed: true,
  },
  // The feedback lane's terminal-state vocabulary. These were applied only by a build session's
  // prompt compliance, with nothing guaranteeing they existed — `gh issue edit --add-label` on a
  // missing label fails, which would silently void the lane's "never end in silence" rule.
  //
  // Three of the four outcomes below cost Eric NOTHING. That split is the point: before it,
  // `needs-eric` was the only non-PR exit, so "too big", "unclear what the member wants" and
  // "genuinely his call" all landed in one queue and buried the third in the first two.
  curated: {
    name: "curated",
    color: "0e8a16",
    description: "Written through the AI coach — its build spec is the spec; build it unattended",
    managed: true,
  },
  needsInfo: {
    name: "needs-info",
    color: "fbca04",
    description: "Waiting on the MEMBER to clarify — never on Eric",
    managed: true,
  },
  nextSlice: {
    name: "next-slice",
    color: "1d76db",
    description: "First slice shipped; the remainder is captured on the issue",
    managed: true,
  },
  needsEric: {
    name: "needs-eric",
    color: "d93f0b",
    description: "A decision only Eric can make — the irreversible class or a genuine taste fork",
    managed: true,
  },
  plan: {
    name: "plan",
    color: "5319e7",
    description: "A plan issue awaiting Eric's ready-flip — not blocked on a decision",
    managed: true,
  },

  // ── registered, not owned ───────────────────────────────────────────────────
  // Real labels this repo runs on that no lane here applies. They are named so `feedback-scan`,
  // `ci-medic` and the issue-lint advisory can key off one registry instead of five bare string
  // literals (#500's first EARS criterion), and so a typo'd label name is a resolvable miss rather
  // than a silent no-match. None of these is ever written back to GitHub.
  handoff: {
    name: "handoff",
    color: "5319e7",
    description: "A Claude Design bundle waiting to be built",
  },
  // The `/feedback` intake form applies BOTH of these — `idea` never travels alone
  // (.github/ISSUE_TEMPLATE/idea_to_explore.yml). Grey with no description is what they actually
  // are today; see the header note on why that is recorded rather than improved in passing.
  idea: { name: "idea", color: "ededed", description: "" },
  feedback: { name: "feedback", color: "ededed", description: "" },
  // GitHub's own defaults. Registering them is exactly why `managed` had to exist: this script has
  // no business rewriting labels it did not create.
  bug: { name: "bug", color: "d73a4a", description: "Something isn't working" },
  enhancement: { name: "enhancement", color: "a2eeef", description: "New feature or request" },
  // Owned by the CI medic's own lane (scripts/ci-medic.mjs), which applies it and therefore
  // guarantees it. Registered here so there is ONE vocabulary, not two that can drift.
  ciFailure: { name: "ci-failure", color: "b60205", description: "A run failed on main" },
};

/** The labels this file applies and therefore guarantees. The rest are registered for lookup. */
export const MANAGED_LABELS = Object.values(LABELS).filter((l) => l.managed);

/** Every label name the repo speaks — what `issue-lint` validates an issue's labels against. */
export const LABEL_NAMES = Object.values(LABELS).map((l) => l.name);

const FOOTER = "---\n_Generated by [Claude Code](https://claude.ai/code)_";

// The build lane runs on the Claude Code SUBSCRIPTION (CLAUDE_CODE_OAUTH_TOKEN), not the metered
// API — so the strongest model available is the right default. Route by who pays, not by taste.
const BUILD_MODEL = "claude-opus-5";

/** Kebab-case slug — release-claim inputs arrive as free text and must match lease ref names. */
export const slugify = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ── the pure half ─────────────────────────────────────────────────────────────

/**
 * Decide what should happen. Pure: no network, no disk, no clock.
 *
 * @param ctx  { eventName, action, payload, inputs, repo, actor }
 * @param deps { dueEvents[], openIssueTitles[] }
 * @returns Intent[]  — `[]` means "nothing to do", which is the common and correct outcome.
 *
 * (Issue-label events reach the workflow but carry no router lane here — the feedback claim is a
 * workflow step calling `claimHandoff` directly, and the retired handoff-inbox lane is gone.)
 */
export function route(ctx, deps = {}) {
  if (ctx.eventName === "push" || ctx.inputs?.command === "scan") return routeSweep(deps);
  if (ctx.eventName === "workflow_dispatch" && ctx.inputs?.command === "release-claim") {
    return routeRelease(ctx);
  }
  return [];
}

/** Something landed on main (or the `scan` command re-ran the sweep by hand — same path, never a
 *  second one that can drift). One issue per never-assessed event, deduped by exact open-issue
 *  title; plus the close-the-loop pass below. */
function routeSweep(deps) {
  const { dueEvents = [], openIssueTitles = [] } = deps;
  const intents = [];
  const queued = new Set(openIssueTitles);
  for (const e of dueEvents.filter((x) => x.reason === "never-assessed")) {
    const title = `[event-research] ${e.id}`;
    if (queued.has(title)) continue;
    queued.add(title);
    intents.push({ kind: "open-issue", label: LABELS.event, title, body: eventIssueBody(e) });
  }
  return [...intents, ...routeShipped(deps)];
}

/**
 * THE LAST MILE. A feedback issue whose work has MERGED but which is still open.
 *
 * GitHub is supposed to close it: PR #448 carried `Closes #447` on line 1 and merged to the default
 * branch. #447 is still open, and so is #449 (via #452). Both of those PRs were authored AND merged
 * by `github-actions[bot]`; the two that did close were merged by a human. That is the same
 * GITHUB_TOKEN-actor suppression class this file's header documents twice already, and the standing
 * doctrine from it is: never depend on an event firing.
 *
 * So this does not depend on one. Every push to main is the postmaster's tick, so the sweep can
 * simply look at which feedback issues have a merged PR and no longer being open, and close them
 * itself. Pure: the caller supplies the joined list.
 */
export function routeShipped(deps = {}) {
  const { shippedFeedback = [] } = deps;
  return shippedFeedback.map((f) => ({
    kind: "close-shipped",
    issueNumber: f.number,
    title: f.title,
    pr: f.pr,
    body: `🚀 **Shipped** — this landed in #${f.pr} and is live.\n\nClosing the loop explicitly: GitHub's own \`Closes #\` link does not fire reliably for PRs a bot both opens and merges (it silently missed #447 and #449), so the postmaster closes these itself rather than depending on an event.\n\n${FOOTER}`,
  }));
}

/**
 * WHICH REFERENCE IS THE MERGED PR — and why this needed its own function.
 *
 * `gh issue list --json closedByPullRequestsReferences` returns, per reference, exactly
 * `{ id, number, repository, url }`. **There is no state key.** The sweep filtered
 * `refs.find((p) => p.state === "MERGED")`, which evaluates `undefined === "MERGED"` for every
 * reference `gh` has ever handed back — so `close-shipped` could not fire for any issue, ever.
 * It was dead by construction from the day it was written, and silent because "no shipped
 * feedback" is also the correct answer on the overwhelming majority of pushes (2026-08-22, #475:
 * `· nothing to do` on two separate runs while the PR side plainly showed #492 MERGED).
 *
 * The merged state therefore has to be READ, not filtered — hence the injected predicate, which
 * keeps this half pure and fixture-drivable. A reference that carries its own state is still
 * honoured first, so a future `gh` that returns one costs us zero extra calls.
 *
 * @param refs      closing references as `gh` returns them
 * @param isMerged  (ref) => boolean — the impure lookup, injected
 */
export function mergedReference(refs = [], isMerged = () => false) {
  for (const r of refs ?? []) {
    if (r?.number == null) continue;
    if (r.state ? String(r.state).toUpperCase() === "MERGED" : isMerged(r)) return r.number;
  }
  return undefined;
}

/**
 * Join the list query to the per-issue re-check, and be LOUD when the two disagree.
 *
 * The re-check is a FALLBACK, never the default path: it runs only for an issue the list query
 * showed no merged reference for, so a quiet repo pays nothing and the one case that matters —
 * "the queue looks empty" — is the case that gets a second look. That ordering is the whole lesson
 * of #475: an under-reporting query and an empty queue printed the same sentence.
 *
 * Pure, given its three injected dependencies, so every branch is fixture-drivable.
 *
 * @param issues  `[{ number, title, closedByPullRequestsReferences }]` from the list query
 * @param deps    { isMerged, recheckRefs, warn }
 */
export function resolveShipped(issues = [], deps = {}) {
  const silent = () => {
    /* a caller that does not care where the warning goes */
  };
  const { isMerged = () => false, recheckRefs = () => [], warn = silent } = deps;
  const shipped = [];
  for (const issue of issues ?? []) {
    const listed = issue?.closedByPullRequestsReferences ?? [];
    let pr = mergedReference(listed, isMerged);
    if (pr === undefined) {
      const rechecked = recheckRefs(issue?.number) ?? [];
      pr = mergedReference(rechecked, isMerged);
      if (pr !== undefined) {
        warn(
          `#${issue?.number}: the list query showed no merged PR, but the per-issue re-check found #${pr} — the list query is under-reporting`,
        );
      }
    }
    if (pr !== undefined) shipped.push({ number: issue.number, title: issue.title, pr });
  }
  return shipped;
}

/**
 * Break a wedged lease by hand.
 *
 * The claim is a *lease*, not a lock, so it self-heals in two hours — but two hours is a long time
 * to stare at a handoff that is provably dead, and the only other way to clear one is deleting a
 * ref through the API, which needs a token nobody carrying a phone has. That made "the build died
 * holding the claim" a step on Eric's list, which is the one place a step must never be
 * (CLAUDE.md: action-required-from-Eric ≈ zero). So it becomes a button.
 *
 * Deliberately a **dispatch only** — never something the sweep does on its own. Auto-releasing
 * another run's claim would defeat the lease it is built on; deciding a build is dead is judgment,
 * and judgment stays with the human who dispatched.
 */
function routeRelease(ctx) {
  const slug = slugify(ctx.inputs?.slug);
  if (!slug) return [{ kind: "error", reason: "no slug given" }];
  return [{ kind: "release-claim", slug, actor: ctx.actor }];
}

/**
 * Did this issue get an ANSWER? A linked PR (open or merged) is an answer; a closed issue is an
 * answer; a terminal label is an answer. Comments are not — the lane comments before it works.
 * Pure so the fixtures can drive every branch.
 */
export function answered(issue = {}) {
  if (issue.state && String(issue.state).toUpperCase() === "CLOSED") return true;
  const linked = issue.closedByPullRequests ?? issue.linkedPullRequests ?? [];
  return Array.isArray(linked) && linked.length > 0;
}

/**
 * THE LOOP'S EYES (harness-research gap #3: "the loop has a mouth but no eyes"). The router
 * dispatches work; nothing watched whether dispatched work ever moved. `audit()` is the pure half
 * of a stall supervisor: given every open dispatch issue that nothing has claimed, emit flag-stall
 * intents past a threshold.
 *
 * Deliberately DETERMINISTIC and ceiling-capped: it comments and warns — it never reclaims a lock,
 * reassigns work, or flips a status. Deciding whether a stalled build is dead or just slow is
 * judgment, and judgment belongs to the humans and agents the comment summons.
 */
export function audit(deps = {}) {
  const {
    unclaimedIssues = [],
    silentFeedback = [],
    staleAfterDays = 2,
    silentAfterHours = 6,
  } = deps;
  // FLAG ONCE, NOT PER RUN. The audit rides every push (2026-08-19), so without memory a stall
  // would draw a fresh comment on every merge to main — comment spam, not eyes. The memory is the
  // `stall-flagged` label: executeOne applies it with the comment, and a labelled issue is never
  // re-flagged. One ping per stall, however many pushes go by.
  const flagged = new Set(deps.alreadyFlagged ?? []);
  const intents = [];
  for (const i of unclaimedIssues) {
    if (i.quietDays < staleAfterDays) continue;
    if (flagged.has(i.number)) continue;
    intents.push({
      kind: "flag-stall",
      issueNumber: i.number,
      title: i.title,
      quietDays: i.quietDays,
      body: `⏱ **Stall check** — this was dispatched **${i.quietDays} day(s)** ago and no pickup layer has claimed it (no ledger, no claimed build). The push-driven sweep may be failing, or every layer saw a non-ready state.\n\n${FOOTER}`,
    });
  }
  // SILENCE IS THE WORSE FAILURE. The feedback lane's prompt has always demanded a visible terminal
  // state, and #455 still sat 41 hours with no receipt, no triage, and no label — the member saw
  // nothing at all. An over-escalation at least tells someone something; a dropped issue teaches a
  // member that filing feedback does nothing, which costs more than any false positive. Same
  // one-ping-per-stall memory as the check above.
  for (const f of silentFeedback) {
    if (f.hoursSinceFiled < silentAfterHours) continue;
    if (flagged.has(f.number)) continue;
    intents.push({
      kind: "flag-silent-feedback",
      issueNumber: f.number,
      title: f.title,
      hoursSinceFiled: f.hoursSinceFiled,
      body: `🔇 **No answer yet** — this was filed **${f.hoursSinceFiled}h** ago and has not reached a PR or a verdict. Every session must end somewhere a member can see: a PR, \`next-slice\`, \`needs-info\`, or \`needs-eric\`.\n\nRe-apply the \`feedback\` label to retry the build — the claim lease makes a re-label a safe retry, not a second build. If it is waiting on something, say so here so it stops looking dropped.\n\n${FOOTER}`,
    });
  }
  return intents;
}

/**
 * Which due events actually get researched this run. Pure, and the reason the event lane can ride
 * EVERY push without double-working: the research session's branch name is mandated as
 * `research/<event-id>`, so an event whose research PR is still open (merged PRs leave the list)
 * is filtered out here. Concurrency serializes postmaster runs, so each run sees the last one's
 * open PRs — the pair is the dedupe.
 */
export function dueForResearch(dueEvents = [], openPrHeads = []) {
  const inFlight = new Set(openPrHeads);
  return dueEvents.filter((e) => !inFlight.has(`research/${e.id}`));
}

function eventIssueBody(e) {
  return [
    `@claude — a calendar event is awaiting initial research: **${e.title}** (${e.date}, ${e.status}, impact: ${e.impact})`,
    "",
    "Run the `never-assessed` mode of [`docs/process/EVENT-RESEARCH.md`](../blob/main/docs/process/EVENT-RESEARCH.md):",
    `produce \`${e.ledger}\` from its TEMPLATE (initial research + stance + kill switches + first`,
    "ledger row), and ship it via `/ship`. The postmaster's push-driven sweep takes the pulse",
    "checks from there.",
    "",
    FOOTER,
  ].join("\n");
}

// ── the claim lease ───────────────────────────────────────────────────────────

/**
 * ATOMIC CLAIM (Eric, 2026-08-17: "waiting for commits to a doc file — seems flimsy af"). He was
 * right, and the canary proved it: a session ran 11 minutes, spent 43k tokens, and left the repo
 * with no trace at all, because the only claim signal was a commit that had not happened yet.
 *
 * The lease fixes that with git's own atomicity: `POST /git/refs` **fails with 422 if the ref
 * already exists**, so creating `claim/<slug>` is a genuine compare-and-set — first writer wins, no
 * read-then-write race, no prose parsing. And it happens BEFORE any work, so a claim is visible in
 * seconds rather than at first commit.
 *
 * It is a LEASE, not a lock: a claim older than `staleAfterMs` is reclaimable, because a session
 * that died holding a permanent lock would wedge the work forever — which is the failure mode
 * this whole exercise exists to remove.
 *
 * (Named for its handoff-lane origin; since 2026-08-21 its only production caller is the feedback
 * lane — `claim/feedback-<n>` in postmaster.yml. The name stays to keep the yml call sites stable.)
 */
export const CLAIM_TTL_MS = 2 * 60 * 60 * 1000; // 2h — well past any honest build

/**
 * Why a lease create failed, in words that distinguish the two cases.
 *
 * A 422 IS the lock working — another runner won the race between our check and our create. Every
 * OTHER failure (a token without `contents: write`, a malformed sha, a ruleset refusing the ref)
 * used to be reported with that same sentence, so a lane that could never claim looked exactly
 * like a lane that was merely busy. On 2026-08-22 that cost three rounds of diagnosis on issue
 * #475 while no lease existed at all.
 */
export function claimFailureReason(err) {
  const detail = String(err?.stderr || err?.message || "")
    .trim()
    .split("\n")
    .slice(-2)
    .join(" ")
    .trim();
  // MESSAGE, not status. GitHub answers 422 for several unrelated problems — "Reference already
  // exists" (the genuine race), "Object does not exist" (a bad sha), "Reference update failed"
  // (a ruleset) — so matching the CODE re-hid everything this function exists to reveal. Caught by
  // using it: three more retriggers of #475 read as a race with no lease anywhere (2026-08-22).
  if (/already exists/i.test(detail)) return "lost the race to a concurrent claim";
  return `could not create the lease — ${detail || "no error text"}`;
}

/**
 * THE LEASE LIVES UNDER `refs/tags/`, NOT `refs/heads/`.
 *
 * A branch ref must point at a COMMIT. The 2026-08-22 timestamped-lease change pointed it at an
 * annotated tag object instead — the right idea, since only a tag carries its own date — and
 * GitHub answered every create with `Reference update failed (HTTP 422)`. The feedback lane could
 * not claim anything from that merge onward: four retriggers of #475, no lease ever written.
 * A tag ref accepts a tag object, so the timestamp survives and the create is legal.
 *
 * Leases written under `heads/` before the move are still read and still expire, so nothing that
 * was holding an issue silently loses its lock.
 *
 * @returns {{ claimed: boolean, reason: string }}
 */
export function claimHandoff(slug, sha, nowMs, staleAfterMs = CLAIM_TTL_MS) {
  const ref = `claim/${slug}`;
  const readRef = (ns) => {
    try {
      return { ns, ...JSON.parse(sh("gh", ["api", `repos/{owner}/{repo}/git/ref/${ns}/${ref}`])) };
    } catch {
      return null; // 404 — unclaimed in this namespace
    }
  };
  const existing = readRef("tags") ?? readRef("heads");

  if (existing) {
    const age = nowMs - Date.parse(claimAgeOf(existing.object.sha));
    if (age < staleAfterMs) {
      return { claimed: false, reason: `held by a live claim (${Math.round(age / 60000)}m old)` };
    }
    // Stale: the holder died. Reclaim rather than wedge the work forever.
    try {
      sh("gh", ["api", "-X", "DELETE", `repos/{owner}/{repo}/git/refs/${existing.ns}/${ref}`]);
    } catch {
      /* someone else just cleaned it up — the create below will arbitrate */
    }
  }

  try {
    // Point the ref at a timestamped tag object, so the lease carries its OWN age (see claimAgeOf).
    // If stamping fails for any reason, fall back to the raw sha — a lease with a slightly wrong
    // clock still beats no lease at all, and the TTL bounds the damage either way.
    let target = sha;
    try {
      target = claimStamp(slug, sha, nowMs);
    } catch {
      console.log(`::warning::claim ${ref}: could not stamp the lease; ageing off the head commit`);
    }
    sh("gh", [
      "api",
      "-X",
      "POST",
      "repos/{owner}/{repo}/git/refs",
      "-f",
      `ref=refs/tags/${ref}`,
      "-f",
      `sha=${target}`,
    ]);
    return { claimed: true, reason: existing ? "reclaimed a stale lease" : "claimed" };
  } catch (err) {
    return { claimed: false, reason: claimFailureReason(err) };
  }
}

/** Committer date of the claim's commit, for lease age. */
/**
 * When was this lease TAKEN? Not "when was the commit it points at authored" — that was the bug.
 *
 * Until 2026-08-22 the ref pointed at `GITHUB_SHA` (main's head at claim time) and the age was read
 * from that COMMIT's committer date. Two ways wrong, in opposite directions: on a quiet repo the
 * head can be hours old, so a brand-new lease is **born stale** and dedupes nothing exactly when it
 * is cheapest to have; on a busy repo a lease from a build that died five minutes ago looks fresh
 * for the full 2h, wedging the issue.
 *
 * The fix is an annotated tag object, whose `tagger.date` we set to the claim moment — the one
 * primitive git gives us for "a ref that carries its own timestamp". Legacy commit-backed refs
 * still resolve through the fallback, so existing leases age out normally rather than wedging.
 */
function claimAgeOf(sha) {
  try {
    const tag = JSON.parse(sh("gh", ["api", `repos/{owner}/{repo}/git/tags/${sha}`]));
    if (tag?.tagger?.date) return tag.tagger.date;
  } catch {
    /* not a tag object — fall through to the legacy commit read */
  }
  try {
    return JSON.parse(sh("gh", ["api", `repos/{owner}/{repo}/commits/${sha}`])).commit.committer
      .date;
  } catch {
    return new Date(0).toISOString(); // unreadable → treat as ancient, i.e. reclaimable
  }
}

/** A tag object stamped with the claim moment; the ref points at this, not at the head commit. */
function claimStamp(slug, sha, nowMs) {
  const tag = JSON.parse(
    sh("gh", [
      "api",
      "-X",
      "POST",
      "repos/{owner}/{repo}/git/tags",
      "-f",
      `tag=claim-${slug}-${nowMs}`,
      "-f",
      `message=lease taken ${new Date(nowMs).toISOString()}`,
      "-f",
      `object=${sha}`,
      "-f",
      "type=commit",
      "-f",
      `tagger[name]=postmaster`,
      "-f",
      `tagger[email]=noreply@anthropic.com`,
      "-f",
      `tagger[date]=${new Date(nowMs).toISOString()}`,
    ]),
  );
  return tag.sha;
}

/**
 * Which model tier builds a feedback issue (Eric, 2026-08-20: "adjust the model between haiku 4.5
 * and sonnet 5 based on the user's prompt/articulated needs… rewarding their engagement is worth
 * the token burn"). A member who writes real detail is describing something worth Sonnet's
 * judgment; a one-liner gets Haiku's cheaper, faster pass.
 *
 * THIS LIVED IN THE WORKFLOW AS BASH UNTIL 2026-08-22, AND IT BROKE THE LANE. Under
 * `set -euo pipefail`, a `$(… && echo …)` inside the reason string exits 1 whenever the `&&` short-
 * circuits — so every feedback issue over 600 chars WITHOUT a code fence killed its own build step
 * before Claude was ever invoked (run 32545818804, issue #475, 1,410 chars). Silent: the job failed
 * after the claim lease was taken, so the issue looked claimed and nothing built it. The fix is not
 * a better `&&`; it is this function, which is pure, specced, and cannot short-circuit.
 *
 * THE TIER IS GONE, AND THAT IS THE POINT (2026-08-22, Eric: "the plan gets handed off to a gha job
 * connected to my personal account which has headroom to leverage me powerful llms to research and
 * build out solutions"). It used to send short asks to Haiku and long ones to Sonnet — economizing
 * on a lane billed to a FLAT-RATE subscription, where economizing saves nothing and costs build
 * quality on exactly the detailed asks that deserve the most. The metered side (the /feedback
 * coach, ANTHROPIC_API_KEY) is where cheap belongs; see src/server/feedback-coach-limits.ts.
 *
 * The function survives the heuristic deliberately: it is the specced seam that replaced the bash,
 * and the "never throws" guarantee below is the regression test for the incident above.
 *
 * @returns {{ model: string, reason: string }}
 */
export function modelTier(body = "") {
  const text = String(body ?? "");
  const fenced = text.includes("```");
  const detail = fenced ? ", includes a code block" : "";
  return { model: BUILD_MODEL, reason: `member ask (${text.length} chars${detail})` };
}

/** Release a lease once its work is no longer being built. */
export function releaseClaim(slug) {
  // Both namespaces: `tags/` is where leases live now, `heads/` is where the pre-2026-08-22 ones
  // still sit. Releasing one that was never taken is a 404 and a no-op, which is the desired shape.
  let released = false;
  for (const ns of ["tags", "heads"]) {
    try {
      sh("gh", ["api", "-X", "DELETE", `repos/{owner}/{repo}/git/refs/${ns}/claim/${slug}`]);
      released = true;
    } catch {
      /* not held in this namespace */
    }
  }
  return released;
}

// ── the impure half ───────────────────────────────────────────────────────────

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: "pipe", ...opts }).trim();

/**
 * Is this closing reference a MERGED PR? The read `gh issue list` cannot do for us (see
 * `mergedReference`). Addressed by URL when there is one, so a PR in another repo is asked about
 * in its own repo rather than mistaken for a local number.
 *
 * Memoised per run: one issue can reference the same PR twice, and the sweep rides every push.
 *
 * NOT fail-closed, unlike everything else in `gatherDeps`, and deliberately: a reference we cannot
 * read (a deleted PR, an inaccessible fork) would otherwise wedge EVERY push sweep — the event lane
 * and the stall audit included — over one dangling link. It degrades to "not merged" instead, but
 * loudly: a `::warning::` annotation on the run, which is the opposite of the silence #475 died of.
 */
const prMergedCache = new Map();
function prIsMerged(ref) {
  const target = ref?.url ?? String(ref?.number ?? "");
  if (!target) return false;
  if (!prMergedCache.has(target)) {
    let state = "";
    try {
      state = JSON.parse(sh("gh", ["pr", "view", target, "--json", "state"])).state;
    } catch (err) {
      const detail = String(err.stderr || err.message)
        .trim()
        .slice(0, 200);
      console.log(`::warning::shipped sweep — could not read the state of ${target}: ${detail}`);
    }
    prMergedCache.set(target, String(state).toUpperCase() === "MERGED");
  }
  return prMergedCache.get(target);
}

/**
 * Read the real dependencies: scanners, open issues, open PR heads, on-disk statuses.
 *
 * FAIL CLOSED, LOUDLY. An earlier draft swallowed errors and returned `[]` — which made a failed
 * `gh issue list` indistinguishable from "no open issues", so the title-dedupe silently disarmed
 * and the duplicate class this router exists to kill was re-armed by its own plumbing (the
 * harness-engineering research called this the top gap). A dependency that cannot be read is a
 * hard stop, not an empty list.
 */
function gatherDeps(ctx) {
  const json = (label, cmd, args) => {
    let out;
    try {
      out = sh(cmd, args);
    } catch (err) {
      throw new Error(`${label} failed: ${String(err.stderr || err.message).trim()}`);
    }
    try {
      return JSON.parse(out || "[]");
    } catch {
      throw new Error(`${label} returned unparseable JSON:\n${out.slice(0, 400)}`);
    }
  };
  const needsScan = ctx.eventName === "push" || ctx.inputs?.command === "scan";
  // Feedback issues whose work has merged but which are still open — the last mile GitHub's own
  // `Closes #` link keeps missing on bot-opened, bot-merged PRs. Joined here (impure) so
  // `routeShipped` stays pure and fixture-drivable.
  const shippedFeedback = needsScan
    ? resolveShipped(
        json("gh issue list (shipped)", "gh", [
          "issue",
          "list",
          "--state",
          "open",
          "--label",
          LABELS.feedback.name,
          "--limit",
          "100",
          "--json",
          // `closedByPullRequestsReferences`, NOT `closedByPullRequests` — the latter is not a
          // field `gh issue list` knows, and asking for it exits 1 with the allow-list, which took
          // every push run of this router down on 2026-08-22 (docs/LESSONS.md).
          "number,title,closedByPullRequestsReferences",
        ]),
        {
          isMerged: prIsMerged,
          // The fallback second look, for an issue the list showed nothing merged for.
          recheckRefs: (n) =>
            json("gh issue view (re-check)", "gh", [
              "issue",
              "view",
              String(n),
              "--json",
              "closedByPullRequestsReferences",
            ]).closedByPullRequestsReferences ?? [],
          warn: (msg) => console.log(`::warning::shipped sweep — ${msg}`),
        },
      )
    : [];
  return {
    shippedFeedback,
    dueEvents: needsScan
      ? json("event-scan --due", "node", ["scripts/event-scan.mjs", "--due"])
      : [],
    openIssueTitles: needsScan
      ? json("gh issue list", "gh", [
          "issue",
          "list",
          "--state",
          "open",
          "--limit",
          "100",
          "--json",
          "title",
        ]).map((i) => i.title)
      : [],
  };
}

/** Audit-mode dependencies: unclaimed dispatch issues. Loud on failure, same doctrine as
 *  gatherDeps. `now` injected for the day math (never Date.now() in a testable path — the caller
 *  passes it). */
function gatherAuditDeps(nowMs) {
  const json = (label, args) => {
    let out;
    try {
      out = sh("gh", args);
    } catch (err) {
      throw new Error(`${label} failed: ${String(err.stderr || err.message).trim()}`);
    }
    try {
      return JSON.parse(out || "[]");
    } catch {
      throw new Error(`${label} returned unparseable JSON:\n${out.slice(0, 400)}`);
    }
  };
  const daysSince = (iso) => Math.floor((nowMs - Date.parse(iso)) / 86_400_000);
  const hoursSince = (iso) => Math.floor((nowMs - Date.parse(iso)) / 3_600_000);
  const issues = json("gh issue list", [
    "issue",
    "list",
    "--state",
    "open",
    "--limit",
    "100",
    "--json",
    "title,number,state,updatedAt,createdAt,labels,closedByPullRequestsReferences",
  ]).map((i) => ({ ...i, closedByPullRequests: i.closedByPullRequestsReferences ?? [] }));
  const alreadyFlagged = issues
    .filter((i) => (i.labels ?? []).some((l) => l.name === LABELS.stall.name))
    .map((i) => i.number);

  const unclaimedIssues = [];
  for (const i of issues) {
    const id = i.title.match(/^\[event-research\] (.+)$/)?.[1];
    if (id && !existsSync(`docs/research/events/${id}.md`)) {
      unclaimedIssues.push({ title: i.title, number: i.number, quietDays: daysSince(i.updatedAt) });
    }
  }
  // A feedback issue that reached no OUTCOME. The signal was "zero comments" until 2026-08-22, and
  // that was blind to the likeliest failure there is: the build prompt's step 0 posts a receipt
  // BEFORE the branch and the build, so a session that dies at typecheck or PR-open leaves exactly
  // one comment and was invisible to this audit forever. Comments measure chatter; what a member
  // actually needs is an answer. So the signal is now the absence of one — no PR linked, and none
  // of the terminal labels — however much the lane said along the way.
  const spoke = new Set([LABELS.needsEric.name, LABELS.needsInfo.name, LABELS.nextSlice.name]);
  const silentFeedback = issues
    .filter(
      (i) =>
        (i.labels ?? []).some((l) => l.name === LABELS.feedback.name) &&
        !answered(i) &&
        !(i.labels ?? []).some((l) => spoke.has(l.name)),
    )
    .map((i) => ({
      title: i.title,
      number: i.number,
      hoursSinceFiled: hoursSince(i.createdAt ?? i.updatedAt),
    }));

  return { unclaimedIssues, silentFeedback, alreadyFlagged };
}

function execute(intents) {
  // The vocabulary first: a session that cannot apply `needs-info` has no way to say "I asked the
  // member", which is the outcome this lane most needs to be able to reach.
  try {
    ensureVocabulary();
  } catch (err) {
    console.log(`::warning::could not upsert labels: ${String(err.message).slice(0, 200)}`);
  }
  const { receipt, failed } = runIntents(intents, executeOne);
  // A write we could not make IS a real fault — isolating the blast radius must not turn a failed
  // run green. The receipt now says which intent failed and why, instead of the run just stopping.
  if (failed) process.exitCode = 1;
  // The durable per-run receipt (research gap #2: the scan path left no trace beyond the run log).
  // $GITHUB_STEP_SUMMARY renders on the run's summary page; locally it just skips.
  if (process.env.GITHUB_STEP_SUMMARY && receipt.length) {
    writeFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Postmaster receipt\n\n${receipt.map((r) => `- ${r}`).join("\n")}\n`,
      { flag: "a" },
    );
  }
  if (receipt.length === 0) console.log("· nothing to do");
}

/** How the receipt names an intent that failed: its kind plus whatever identifies the target. */
export function intentLabel(i) {
  const target = i.issueNumber
    ? ` #${i.issueNumber}`
    : i.title
      ? ` \`${i.title}\``
      : i.slug
        ? ` \`claim/${i.slug}\``
        : "";
  return `${i.kind ?? "unknown"}${target}`;
}

/**
 * Run every intent, each in its own blast radius.
 *
 * WHY THIS IS NOT A BARE `for` LOOP ANY MORE (2026-08-26). It was one, and on 2026-08-24 a single
 * un-permitted `gh issue comment` threw out of `executeOne` and unwound the whole process: every
 * later intent skipped, and — worse — the `$GITHUB_STEP_SUMMARY` receipt never written, so the run
 * that failed left no record of WHICH intent failed or what it had already done. One 403 took the
 * router's own accounting offline across seven consecutive pushes, and the log was the only
 * evidence anything had happened at all.
 *
 * So: one intent's failure costs exactly that intent. It lands in the receipt by name, emits an
 * `::error::` annotation, and the run still fails — a write we could not make is a fault, and a
 * green run would be a lie about work that did not happen. Isolation shrinks the blast radius; it
 * never launders the result.
 *
 * Pure given the injected `run`, so a spec drives it with a throwing fake and no network.
 *
 * @returns {{ receipt: string[], failed: number }}
 */
export function runIntents(intents, run, onError = (msg) => console.error(`::error::${msg}`)) {
  const receipt = [];
  let failed = 0;
  for (const i of intents) {
    try {
      receipt.push(run(i));
    } catch (err) {
      failed += 1;
      // execFileSync puts the useful half on stderr; first line only, so the receipt stays scannable.
      const reason =
        String(err?.stderr || err?.message || err)
          .trim()
          .split("\n")[0]
          .slice(0, 300) || "no reason given";
      onError(`${intentLabel(i)} failed — ${reason}`);
      receipt.push(`❌ ${intentLabel(i)} failed — ${reason}`);
    }
  }
  return { receipt, failed };
}

function executeOne(i) {
  if (i.kind === "noop") {
    console.log(`· nothing to do (${i.reason})`);
    return `noop — ${i.reason}`;
  }
  if (i.kind === "error") {
    console.error(`::error::${i.reason}`);
    process.exitCode = 1;
    return `❌ refused — ${i.reason}`;
  }
  if (i.kind === "open-issue") {
    ensureLabel(i.label);
    const url = sh("gh", [
      "issue",
      "create",
      "--title",
      i.title,
      "--body",
      i.body,
      "--label",
      i.label.name,
    ]);
    console.log(`▶ queued ${url}`);
    return `opened issue \`${i.title}\` → ${url}`;
  }
  if (i.kind === "comment") {
    sh("gh", ["issue", "comment", String(i.issueNumber), "--body", i.body]);
    console.log(`· commented on #${i.issueNumber}`);
    return `commented on #${i.issueNumber}`;
  }
  if (i.kind === "release-claim") {
    const freed = releaseClaim(i.slug);
    console.log(
      `::notice::claim/${i.slug} ${freed ? "released" : "was not held"} (by @${i.actor})`,
    );
    return freed
      ? `🔓 released \`claim/${i.slug}\` — the next scan can pick it up (@${i.actor})`
      : `· no \`claim/${i.slug}\` to release — nothing was holding it`;
  }
  if (i.kind === "flag-stall") {
    if (i.issueNumber) {
      sh("gh", ["issue", "comment", String(i.issueNumber), "--body", i.body]);
      // The label is the audit's memory — it stops the next run re-flagging the same stall.
      ensureLabel(LABELS.stall);
      sh("gh", ["issue", "edit", String(i.issueNumber), "--add-label", LABELS.stall.name]);
    }
    console.log(`::warning::stall — ${i.title} quiet ${i.quietDays}d`);
    return `⏱ stall flagged — \`${i.title}\` quiet ${i.quietDays}d${i.issueNumber ? ` (commented on #${i.issueNumber})` : ""}`;
  }
  if (i.kind === "close-shipped") {
    sh("gh", ["issue", "comment", String(i.issueNumber), "--body", i.body]);
    sh("gh", ["issue", "close", String(i.issueNumber), "--reason", "completed"]);
    console.log(`::notice::closed #${i.issueNumber} — shipped in #${i.pr}`);
    return `🚀 closed #${i.issueNumber} — \`${i.title}\` shipped in #${i.pr}`;
  }
  if (i.kind === "flag-silent-feedback") {
    if (i.issueNumber) {
      sh("gh", ["issue", "comment", String(i.issueNumber), "--body", i.body]);
      // Same memory as the stall check: the label is what stops the next push re-flagging it.
      ensureLabel(LABELS.stall);
      sh("gh", ["issue", "edit", String(i.issueNumber), "--add-label", LABELS.stall.name]);
    }
    console.log(
      `::warning::silent feedback — #${i.issueNumber} no receipt after ${i.hoursSinceFiled}h`,
    );
    return `🔇 silent feedback — \`${i.title}\` no receipt after ${i.hoursSinceFiled}h (commented on #${i.issueNumber})`;
  }
  return `❓ unknown intent kind ${i.kind}`;
}

/**
 * Upsert every label this repo's prompts name. Until 2026-08-22 only `event-research` and
 * `stall-flagged` were ever passed to `ensureLabel`, so `curated`, `needs-info` and `next-slice`
 * were declared in LABELS and **never created** — they 404'd on the repo. A build session told to
 * end in `needs-info` therefore hit a failing `gh issue edit --add-label` and fell back to the two
 * exits that did exist: a PR, or `needs-eric`. The four-state design was two-thirds fictional.
 *
 * Cheap and idempotent, so it runs on every postmaster invocation rather than per-intent.
 *
 * Walks `MANAGED_LABELS`, NOT the whole registry — #500 added six labels this lane reads but never
 * applies, and upserting those would have made this function the silent owner of `bug`,
 * `enhancement` and every color Eric picks in the UI. See the LABELS header.
 */
export function ensureVocabulary() {
  for (const label of MANAGED_LABELS) ensureLabel(label);
}

function ensureLabel(label) {
  // GitHub auto-creates a label the first time it is applied, but as default grey with no
  // description. Upsert so the repo self-provisions and nobody has to know it needed doing.
  // Only the three fields the API takes — `managed` is this file's bookkeeping, not GitHub's.
  const body = JSON.stringify({
    name: label.name,
    color: label.color,
    description: label.description,
  });
  const base = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/labels`;
  const auth = [
    "-H",
    `Authorization: Bearer ${process.env.GH_TOKEN ?? ""}`,
    "-H",
    "Accept: application/vnd.github+json",
  ];
  try {
    // --fail is load-bearing: without it curl exits 0 on a 404 body (the label doesn't exist
    // yet), the PATCH "succeeds," and the POST-create fallback below never runs — the label is
    // silently never created (docs/LESSONS.md 2026-08-19, the missing `stall-flagged` label).
    sh("curl", ["-sS", "--fail", "-X", "PATCH", ...auth, `${base}/${label.name}`, "-d", body]);
  } catch {
    try {
      sh("curl", ["-sS", "--fail", "-X", "POST", ...auth, base, "-d", body]);
    } catch {
      /* a label that already exists is a harmless 422 */
    }
  }
}

/**
 * The feedback lane's one step: claim the labelled issue's lease, and decide its model tier from
 * the body already in the event payload (no `gh issue view`, no second network hop). Appends
 * `number=` / `model=` to $GITHUB_OUTPUT when the claim wins, and narrates on stdout either way —
 * notices on stdout, outputs to the file, so neither can contaminate the other.
 */
export function claimFeedback(ctx, nowMs = Date.now(), sha = process.env.GITHUB_SHA ?? "") {
  const issue = ctx.payload?.issue;
  if (!issue) return { claimed: false, reason: "no issue in the payload" };
  const result = claimHandoff(`feedback-${issue.number}`, sha, nowMs);
  if (!result.claimed) {
    console.log(`::notice::not building feedback #${issue.number} — ${result.reason}`);
    return result;
  }
  const tier = modelTier(issue.body ?? "");
  const out = process.env.GITHUB_OUTPUT;
  if (out) appendFileSync(out, `number=${issue.number}\nmodel=${tier.model}\n`);
  console.log(`::notice::claimed feedback issue #${issue.number} — building in this run`);
  console.log(`::notice::feedback #${issue.number} — model tier: ${tier.model} — ${tier.reason}`);
  return { ...result, number: issue.number, model: tier.model };
}

// ── entry point ───────────────────────────────────────────────────────────────
function main(argv) {
  const dry = argv.includes("--dry-run");
  const evIdx = argv.indexOf("--event");
  const eventFile = evIdx >= 0 ? argv[evIdx + 1] : process.env.GITHUB_EVENT_PATH;

  const raw = eventFile && existsSync(eventFile) ? JSON.parse(readFileSync(eventFile, "utf8")) : {};
  // A fixture may carry its own `deps`, so every routing branch is testable without a network.
  const fixtureDeps = raw.deps;
  const payload = raw.event ?? raw;

  const ctx = {
    eventName: raw.eventName ?? process.env.GITHUB_EVENT_NAME ?? "push",
    action: payload.action,
    payload,
    inputs: payload.inputs ?? raw.inputs ?? {},
    repo: process.env.GITHUB_REPOSITORY ?? "",
    actor: raw.actor ?? process.env.GITHUB_ACTOR ?? "unknown",
  };

  // The tier heuristic, runnable on its own: `… --model-tier < body.md`. Exists so the decision
  // that once broke the lane has a spec that runs it exactly as production does.
  if (argv.includes("--model-tier")) {
    const { model, reason } = modelTier(readFileSync(0, "utf8"));
    console.log(`model=${model}`);
    console.log(`reason=${reason}`);
    return;
  }

  // `--release <slug>`: hand the lease back. Exists so a job that failed can free the issue in its
  // own `if: failure()` step, rather than leaving it claimed-and-silent for the full TTL — the
  // shape that made the 2026-08-22 feedback failures look like builds in progress (docs/LESSONS.md).
  const relIdx = argv.indexOf("--release");
  if (relIdx >= 0 && argv[relIdx + 1]) {
    const slug = slugify(argv[relIdx + 1]);
    console.log(
      releaseClaim(slug)
        ? `::notice::released the lease for ${slug}`
        : `::notice::no lease held for ${slug} — nothing to release`,
    );
    return;
  }

  if (argv.includes("--claim-feedback")) {
    claimFeedback(ctx);
    return;
  }

  const deps = fixtureDeps ?? (dry ? {} : gatherDeps(ctx));
  const auditMode = argv.includes("--audit") || ctx.inputs?.command === "audit";
  const intents = auditMode ? audit(fixtureDeps ?? gatherAuditDeps(Date.now())) : route(ctx, deps);

  if (dry) {
    console.log(JSON.stringify(intents, null, 2));
    return;
  }
  execute(intents);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
