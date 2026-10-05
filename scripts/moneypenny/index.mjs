#!/usr/bin/env node
// MONEYPENNY — EVENTS. One router for every issue-driven automation in this repo. Formerly
// "the postmaster" (renamed #912, slice 3 — see docs/MONEYPENNY.md); its sibling scripts were
// renamed to `moneypenny-*.mjs` in #912's slice 4, then grouped into `scripts/moneypenny/` with the
// prefix dropped in a later slice.
//
//   node scripts/moneypenny/index.mjs                          # read $GITHUB_EVENT_PATH, act
//   node scripts/moneypenny/index.mjs --dry-run --event f.json # print the intents, touch nothing
//   node scripts/moneypenny/index.mjs --triage-feedback        # a fresh feedback issue: self-ready or Backlog
//   node scripts/moneypenny/index.mjs --claim-feedback         # claim the ready-flipped feedback issue + pick its model
//   node scripts/moneypenny/index.mjs --claim-plan              # claim a ready-flipped plan issue (#823)
//   node scripts/moneypenny/index.mjs --claim-next              # retry sweep: top-ranked admissible ready issue (#3960)
//   node scripts/moneypenny/index.mjs --peek-next               # dry run: has_next=true|false, claims nothing (push pass)
//   node scripts/moneypenny/index.mjs --model-tier < body.md   # just the tier decision
//   node scripts/moneypenny/index.mjs --guard-feedback-outcome 1234  # #1028's silent-stall guard
//   node scripts/moneypenny/index.mjs --check-claim feedback-1234  # read-only lease peek, never claims
//   node scripts/moneypenny/index.mjs --check-callout          # needs-eric just landed: is the ask actually written?
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
//
// THE FILE SPLIT (2026-08-26, noExcessiveLinesPerFile; siblings renamed off `postmaster-*` #912,
// then grouped under `scripts/moneypenny/` with the prefix dropped in a later slice).
// This router now dispatches to sibling modules named for the lane they carry —
// events.mjs (event-research), shipped.mjs (closing the last mile),
// audit.mjs (the stall/silent-feedback audit), claim-lease.mjs +
// model-tier.mjs (the feedback claim's supporting pieces), labels.mjs (the
// shared label/footer vocabulary) and gh.mjs (the `gh` shell wrapper). `claimHandoff`
// and `releaseClaim` stay HERE, not in the lease file, because
// tests/arch/lease-namespace.spec.ts pins their literal source text (the `refs/tags` ref template)
// as a static stand-in for a 2026-08-22 outage a live `gh` call can only fail on a runner — moving
// them would make that check pass on empty text instead of the real lease. Every export below keeps
// its original name and signature; anything that moved
// lives on as a re-export.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { gateAdmission, nextAdmissible, readInFlight, readOpenIssues } from "./admission.mjs";
import { executeAssignments, gather as gatherAssignmentDeps } from "./assignments.mjs";
import { answered, audit, gatherAuditDeps } from "./audit.mjs";
import { CLAIM_TTL_MS, claimAgeOf, claimFailureReason, claimStamp } from "./claim-lease.mjs";
import {
  CONTINUED_MODEL,
  continuationContext,
  executeStopContinuation,
  gatherContinuationDeps,
  openPrsByIssue,
  pickContinuation,
  postContinuationReceipt,
  routeContinuation,
} from "./continuation.mjs";
import { calloutGapComment, shouldPostCalloutGap } from "./decision-callout.mjs";
import { dueForResearch, RECEIPT_TITLE_RE, routeSweep } from "./events.mjs";
import { guardFeedbackOutcome } from "./feedback-guard.mjs";
import { ghRest, ghRestAll, sh, withRetry } from "./gh.mjs";
import {
  ensureLabel,
  ensureVocabulary,
  issueNumberFromSlug,
  LABELS,
  labelNames,
  MANAGED_LABELS,
  setInProgress,
} from "./labels.mjs";
import { draftLesson, routeLessonDraft } from "./lesson-draft.mjs";
import { modelTier } from "./model-tier.mjs";
import { feedbackReadyIntent, planReadyIntent } from "./plan-claim.mjs";
import { executeRelay, gatherRelayDeps, routeRelay } from "./relay.mjs";
import { mergedReference, prIsMerged, resolveShipped, routeShipped } from "./shipped.mjs";
import { readWorkMode } from "./work-mode.mjs";

// Named re-exports, not `export … from` — this router keeps substantial logic of its own (the
// noBarrelFile rule is right to ban a file that's pure re-exports; this one just isn't that).
export {
  answered,
  audit,
  CLAIM_TTL_MS,
  claimFailureReason,
  dueForResearch,
  ensureVocabulary,
  guardFeedbackOutcome,
  LABELS,
  MANAGED_LABELS,
  mergedReference,
  modelTier,
  resolveShipped,
  routeContinuation,
  routeRelay,
  routeShipped,
};

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
 * workflow step calling `claimHandoff` directly, and the retired handoff-inbox lane is gone. One
 * issue event does: a repair capsule closing drafts its LESSONS entry, #4212.)
 */
export function route(ctx, deps = {}) {
  if (ctx.eventName === "push" || ctx.inputs?.command === "scan") return routeSweep(deps);
  if (ctx.eventName === "issues") return routeLessonDraft(ctx);
  if (ctx.eventName === "workflow_dispatch" && ctx.inputs?.command === "release-claim") {
    return routeRelease(ctx);
  }
  return [];
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

// ── the claim lease ───────────────────────────────────────────────────────────
// See the header comment: `claimHandoff`/`releaseClaim` stay here on purpose.

/**
 * THE LEASE LIVES UNDER `refs/tags/`, NOT `refs/heads/`.
 *
 * A branch ref must point at a COMMIT. The 2026-08-22 timestamped-lease change pointed it at an
 * annotated tag object instead — the right idea, since only a tag carries its own date — and
 * GitHub answered every create with `Reference update failed (HTTP 422)`. The feedback lane could
 * not claim anything from that merge onward: four retriggers of #475, no lease ever written.
 * A tag ref accepts a tag object, so the timestamp survives and the create is legal.
 *
 * @returns {{ claimed: boolean, reason: string }}
 */
export function claimHandoff(slug, sha, nowMs, staleAfterMs = CLAIM_TTL_MS) {
  const ref = `claim/${slug}`;
  const readRef = (ns) => {
    try {
      return { ns, ...JSON.parse(sh("gh", ["api", `repos/{owner}/{repo}/git/ref/${ns}/${ref}`])) };
    } catch {
      return null; // 404 — unclaimed
    }
  };
  const existing = readRef("tags");

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

/** Release a lease once its work is no longer being built. */
export function releaseClaim(slug) {
  // Releasing a lease that was never taken is a 404 and a no-op, which is the desired shape.
  try {
    sh("gh", ["api", "-X", "DELETE", `repos/{owner}/{repo}/git/refs/tags/claim/${slug}`]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Release a lease AND take the issue's `in-progress` label back off (#3960) — what both release
 * paths (`--release`, the `release-claim` dispatch) mean by "this is no longer being built". A
 * wrapper, not an edit to `releaseClaim`: tests/arch/lease-namespace.spec.ts pins that function's
 * source text. The label comes off even when no lease was held — a build that died still ended.
 */
export function releaseBuild(slug) {
  const freed = releaseClaim(slug);
  setInProgress(issueNumberFromSlug(slug), false);
  return freed;
}

/**
 * READ-ONLY peek at a lease — never claims, never reclaims a stale one, never writes anything.
 * Exists so a caller that only wants to SKIP work Moneypenny already holds (e.g. `/work-issues`,
 * which checks for an open PR but had no visibility into a claim taken before any PR exists) can
 * ask "is this held right now?" without joining the claim protocol itself.
 *
 * Mirrors `claimHandoff`'s own read + staleness math exactly (same `readRef`/`claimAgeOf` shape) so
 * the two never disagree about what counts as "currently claimed" — a stale lease is reclaimable, so
 * it reads as unclaimed here too.
 *
 * @returns {{ claimed: boolean, reason: string }}
 */
export function isClaimed(slug, nowMs = Date.now(), staleAfterMs = CLAIM_TTL_MS) {
  const ref = `claim/${slug}`;
  let existing;
  try {
    existing = JSON.parse(sh("gh", ["api", `repos/{owner}/{repo}/git/ref/tags/${ref}`]));
  } catch {
    return { claimed: false, reason: "no lease found" }; // 404 — unclaimed
  }
  const age = nowMs - Date.parse(claimAgeOf(existing.object.sha));
  if (age < staleAfterMs) {
    return { claimed: true, reason: `held by a live claim (${Math.round(age / 60000)}m old)` };
  }
  return {
    claimed: false,
    reason: `lease is stale (${Math.round(age / 60000)}m old) — reclaimable`,
  };
}

/**
 * The feedback lane's one step: claim the labelled issue's lease, and decide its model tier from
 * the body already in the event payload (no `gh issue view`, no second network hop). Appends
 * `number=` / `model=` to $GITHUB_OUTPUT when the claim wins, and narrates on stdout either way —
 * notices on stdout, outputs to the file, so neither can contaminate the other.
 *
 * Triggered on the `ready` label now, not `feedback` (#3818 consolidation, 2026-09-28) — see
 * `triageFeedbackDecision`'s header for why. `ready` is a general board-status label (plan issues
 * carry it too, flipped by an Eric comment, not a label event), so this guards on `feedback` also
 * being present rather than trusting the workflow's cheap `if:` alone.
 *
 * #3960: also runs on an `unlabeled` event that clears the last parking label from a still-`ready`
 * issue (`feedbackReadyIntent`), and asks the admission gate (admission.mjs) before the lease — a
 * refusal leaves the issue `ready`, lease-free and label-free, with one queue note on it.
 * `admission` injects the gate's reads, for specs.
 */
export function claimFeedback(
  ctx,
  nowMs = Date.now(),
  sha = process.env.GITHUB_SHA ?? "",
  admission = {},
) {
  // The pure half (plan-claim.mjs): feedback label, parking guard (#3818 criterion 5), and the
  // unpark path (#3960 criterion 2) — an `unlabeled` event clearing the last parking label.
  const intent = feedbackReadyIntent(ctx);
  if (!intent.ready) {
    if (ctx.payload?.issue) {
      console.log(
        `::notice::not building feedback #${ctx.payload.issue.number} — ${intent.reason}`,
      );
    }
    return { claimed: false, reason: intent.reason };
  }
  const issue = intent.issue;
  // #3960 — the work spigot, the in-flight cap and the surface fence, BEFORE any lease is taken.
  const gate = gateAdmission(issue, admission);
  if (!gate.admit) return { claimed: false, reason: gate.reason };
  const result = claimHandoff(`feedback-${issue.number}`, sha, nowMs);
  if (!result.claimed) {
    console.log(`::notice::not building feedback #${issue.number} — ${result.reason}`);
    return result;
  }
  const tier = modelTier(issue.body ?? "");
  const out = process.env.GITHUB_OUTPUT;
  if (out) appendFileSync(out, `number=${issue.number}\nmodel=${tier.model}\n`);
  console.log(`::notice::claimed feedback issue #${issue.number} — building in this run`);
  // #3960: the board's In Progress column reads this label; the release path takes it back off.
  setInProgress(issue.number, true);
  console.log(`::notice::feedback #${issue.number} — model tier: ${tier.model} — ${tier.reason}`);
  return { ...result, number: issue.number, model: tier.model };
}

/**
 * THE BACKLOG GATE (#3818 consolidation, 2026-09-28 — Eric: "instead of a PR we'd want an issue
 * created that gets prioritized into the backlog"). Filing a `feedback` issue no longer builds
 * immediately — it only ever reaches `claimFeedback` once something applies `ready`, same status
 * the Orchestration board already recognizes (`scripts/moneypenny/projects.mjs`'s
 * `statusForIssue`). This is the one exception: a coach-shaped filing (the guided rail path
 * already attaches `curated` + a `skynet-spec` block, per docs/FEEDBACK.md's "the coach is what
 * makes the wide envelope safe") is judged safe enough to self-ready, preserving the old
 * near-zero-friction default for the common case. Everything else — freeform filings, and
 * anything already flagged `needs-eric`/`needs-info` — sits in Backlog for an explicit `ready`
 * (Eric's, or a later triage pass), visible on the board rather than building unseen.
 *
 * Pure so the rule is provable without a network call; `curated`/`needs-eric`/`needs-info` are
 * plain label names, not `LABELS` entries, because none of them is owned/applied by this lane.
 */
export function triageFeedbackDecision({ labels = [] } = {}) {
  const has = (name) => labels.includes(name);
  if (has("needs-eric") || has("needs-info")) {
    return { ready: false, reason: "flagged needs-eric/needs-info — stays in Backlog" };
  }
  if (has("curated")) {
    return { ready: true, reason: "coach-shaped filing (curated) — self-readying" };
  }
  return { ready: false, reason: "freeform filing — stays in Backlog for an explicit ready" };
}

/**
 * The impure half: read the labelled issue straight from the event payload (no `gh issue view`,
 * same discipline `claimFeedback` already follows), apply `triageFeedbackDecision`'s rule, and
 * add the `ready` label when it says so. Never claims a lease — that still only happens once
 * `ready` actually lands, via `claimFeedback` below.
 */
export function triageFeedback(ctx) {
  const issue = ctx.payload?.issue;
  if (!issue) return { ready: false, reason: "no issue in the payload" };
  const labels = (issue.labels ?? []).map((l) => l.name);
  const decision = triageFeedbackDecision({ labels });
  console.log(`::notice::feedback #${issue.number} triage — ${decision.reason}`);
  if (decision.ready) {
    sh("gh", ["issue", "edit", String(issue.number), "--add-label", "ready"]);
  }
  return decision;
}

/**
 * #3913 SLICE 2b — THE DECISION-QUEUE CHECK, AFTER FILING. `needs-eric` means exactly one thing:
 * a decision only Eric can make. `issue-lint` already demands the `Needs from you` callout that
 * states WHAT the decision is, but only at filing time — and the 2026-09-28 audit found the label
 * almost always lands later, from another lane (7 of 8 open `needs-eric` issues carried no callout;
 * #4056's capture study traced 6 of those 7 to a post-filing relabel). `issues.mjs` refuses to add
 * the label without one (slice 2a), and the board keeps a callout-less issue out of Blocked — this
 * is the third consumer: the loud, reversible comment on the paths neither of those covers (a
 * human or a lane labelling through `gh` or the GitHub UI).
 *
 * The rule itself is `decision-callout.mjs` and is pure; this function is only its I/O — the
 * labelled issue straight from the event payload (no `gh issue view`, same discipline as
 * `triageFeedback`), its comment bodies over REST, and one comment when the gap is real. `deps`
 * injects both so the wiring is specced without a network.
 *
 * NEVER strips the label (a settled fork on #3913): silently removing a decision label would hide
 * a real ask. A comment is loud, reversible, and leaves the ask where Eric can still see it.
 */
export function checkCallout(ctx, deps = {}) {
  const issue = ctx.payload?.issue;
  if (!issue) return { posted: false, reason: "no issue in the payload" };
  const readComments =
    deps.readComments ?? ((n) => ghRestAll(`issues/${n}/comments`).map((c) => c?.body ?? ""));
  const post =
    deps.post ?? ((n, body) => sh("gh", ["issue", "comment", String(n), "--body", body]));

  const labels = (issue.labels ?? []).map((l) => l.name);
  const gap = shouldPostCalloutGap({
    labels,
    body: issue.body ?? "",
    author: issue.user?.login ?? "",
    comments: readComments(issue.number),
  });
  if (!gap) {
    console.log(`::notice::#${issue.number} — needs-eric callout check: nothing to say`);
    return { posted: false, reason: "no gap, or already commented" };
  }
  const actor = ctx.payload?.sender?.login ?? ctx.actor;
  post(issue.number, calloutGapComment({ actor }));
  console.log(
    `::notice::#${issue.number} — needs-eric with no decision callout (labelled by ${actor}); commented once`,
  );
  return { posted: true, actor };
}

/**
 * The plan lane's one step (#823) — mirrors `claimFeedback` exactly, one line down: decide whether
 * this `issue_comment` is a ready-flip on a plan issue (the pure `planReadyIntent`), and if so claim
 * the SAME lease mechanism (`claim/plan-<n>`) so a duplicate or retried ready-comment is a safe
 * no-op, never a second build. WHO may say ready is the workflow's job (`moneypenny-events.yml`'s `if:`,
 * mirroring `claude.yml`'s `author_association` gate) — this function only ever sees comments that
 * already cleared it, same division of labor as the feedback lane's label-is-the-authorization rule.
 */
export function claimPlan(
  ctx,
  nowMs = Date.now(),
  sha = process.env.GITHUB_SHA ?? "",
  admission = {},
) {
  const intent = planReadyIntent(ctx);
  if (!intent.ready) {
    console.log(`::notice::not building a plan issue — ${intent.reason}`);
    return { claimed: false, reason: intent.reason };
  }
  const issue = intent.issue;
  const gate = gateAdmission(issue, admission); // #3960 — same gate as the feedback claim
  if (!gate.admit) return { claimed: false, reason: gate.reason };
  const result = claimHandoff(`plan-${issue.number}`, sha, nowMs);
  if (!result.claimed) {
    console.log(`::notice::not building plan #${issue.number} — ${result.reason}`);
    return result;
  }
  // #3818 criterion 9: a CONTINUED slice builds below the top tier. `modelTier` hands every plan
  // Opus (no plan carries a `skynet-spec` block), which is right for a first slice off a brief and
  // wrong for one whose scope is already written in the state block. `ctx.continuation` is set only
  // by `claimNext`'s continuation branch — never by a label or comment event.
  const tier = ctx.continuation
    ? { model: CONTINUED_MODEL, reason: "continued slice — below the top tier (criterion 9)" }
    : modelTier(issue.body ?? "");
  const out = process.env.GITHUB_OUTPUT;
  if (out) appendFileSync(out, `number=${issue.number}\nmodel=${tier.model}\n`);
  console.log(`::notice::claimed plan issue #${issue.number} — building in this run`);
  setInProgress(issue.number, true); // #3960 — same in-flight signal as the feedback claim
  console.log(`::notice::plan #${issue.number} — model tier: ${tier.model} — ${tier.reason}`);
  return { ...result, number: issue.number, model: tier.model };
}

/**
 * THE RETRY SWEEP'S ONE STEP (#3960). A refused claim leaves its issue `ready`, lease-free and
 * label-free; this is what picks it back up on a later tick. Reads the dial, the in-flight list and
 * the open `ready` issues ONCE, asks `nextAdmissible` for the one to try (fast-track, then rank order),
 * and hands it to its own lane's claim as a synthetic `labeled: ready` event — so the sweep runs
 * exactly the checks a live label event would, lease included. One claim per call: admitting it
 * changes what the next pick may see. Writes `lane=` beside the claim's own `number=`/`model=`.
 * An unreadable list throws (a red tick), never "nothing to do".
 */
/**
 * THE SWEEP'S DRY RUN (#3818 slice 3 follow-up). `claude-code-action` rejects a `push` event, so a
 * claim made on a push tick can never build (the sweep's first live ticks, 2026-09-30: "Unsupported
 * event type: push", claim taken and released every merge). The push pass only asks whether there
 * is anything to claim, writes `has_next=`, and the workflow re-fires itself as a `workflow_dispatch`
 * — the same re-dispatch event research uses — where `--claim-next` claims and the build can run.
 * Same reads and same pick as `claimNext`; never takes a lease or writes a label.
 */
export function peekNext(deps = {}) {
  const {
    readMode = () => readWorkMode(),
    readReady = () => readOpenIssues(LABELS.ready.name),
    readInFlight: inFlightOf = () => readInFlight(),
    readPrIssues = () => readOpenPrIssues(),
    continuation = () => continuationContext(),
  } = deps;
  const mode = readMode();
  const lanes = [LABELS.plan.name, LABELS.feedback.name];
  const ready = withoutOpenPr(
    readReady().filter((i) => labelNames(i.labels).some((l) => lanes.includes(l))),
    readPrIssues(),
  );
  // #3818 slice 8: a plan to continue counts as "something to claim" even when the rank-order pick
  // finds nothing — its own lease is what the sweep would otherwise step past for 2h.
  const pick = continuationPick(continuation) ?? nextAdmissible(ready, inFlightOf(), mode);
  const out = process.env.GITHUB_OUTPUT;
  if (out) appendFileSync(out, `has_next=${pick ? "true" : "false"}\n`);
  console.log(
    `::notice::retry sweep peek — ${pick ? `#${pick.number} is admissible` : "nothing admissible"}`,
  );
  return pick;
}

export function claimNext(nowMs = Date.now(), sha = process.env.GITHUB_SHA ?? "", deps = {}) {
  const {
    readMode = () => readWorkMode(),
    readReady = () => readOpenIssues(LABELS.ready.name),
    readInFlight: inFlightOf = () => readInFlight(),
    readPrIssues = () => readOpenPrIssues(),
    claims = { plan: claimPlan, feedback: claimFeedback },
    continuation = () => continuationContext({ now: nowMs }),
    ...admission
  } = deps;
  const mode = readMode();
  const inFlight = inFlightOf();
  const lanes = [LABELS.plan.name, LABELS.feedback.name];
  let pool = withoutOpenPr(
    readReady().filter((i) => labelNames(i.labels).some((l) => lanes.includes(l))),
    readPrIssues(),
  );
  const gateDeps = { readMode: () => mode, readInFlight: () => inFlight, ...admission };
  // #3818 slice 8, criterion 9 — a plan whose slice just landed goes FIRST, ahead of rank order.
  // Rank order cannot express it: the plan's lease is still held by the build that just finished,
  // so the loop below would step past it for the lease's full TTL and claim something else.
  const continued = continueNext(continuationPick(continuation), {
    claims,
    nowMs,
    sha,
    gateDeps,
  });
  if (continued) return continued;
  // A lease outlives a successful build (only a failed one releases it), so the top-ranked issue
  // can sit "held" for the whole TTL after its slice ships. Stopping there idled the sweep for up
  // to 2h behind #3960 on 2026-10-01; step past a held pick instead, a bounded number of times.
  for (let tries = 0; tries < SWEEP_HELD_SKIPS; tries++) {
    const pick = nextAdmissible(pool, inFlight, mode);
    if (!pick) {
      const why = `nothing admissible (${pool.length} ready, ${inFlight.length} in flight, work-mode=${mode.position})`;
      console.log(`::notice::retry sweep — ${why}`);
      return { claimed: false, reason: why };
    }
    const lane = labelNames(pick.labels).includes(LABELS.plan.name) ? "plan" : "feedback";
    const ctx = { payload: { action: "labeled", label: { name: LABELS.ready.name }, issue: pick } };
    const result = claims[lane](ctx, nowMs, sha, gateDeps);
    if (!result.claimed && /^held by a live claim/.test(result.reason ?? "")) {
      pool = pool.filter((i) => i.number !== pick.number);
      continue;
    }
    const out = process.env.GITHUB_OUTPUT;
    if (result.claimed && out) appendFileSync(out, `lane=${lane}\n`);
    return { ...result, lane };
  }
  const why = `the top ${SWEEP_HELD_SKIPS} admissible picks are all held by live claims`;
  console.log(`::notice::retry sweep — ${why}`);
  return { claimed: false, reason: why };
}

/** How many lease-held picks one sweep steps past before giving up for this tick. */
export const SWEEP_HELD_SKIPS = 5;

/**
 * AN ISSUE AN OPEN PR ALREADY NAMES IS NOT THE SWEEP'S TO START (2026-10-05). `pr-in-progress.mjs`
 * labels such an issue `in-progress`, and that label is what kept the rank-order pick off it, but
 * the label can come off while the PR is still open: the plan lane's prompt ends every session with
 * `--remove-label in-progress`, a held slice PR included. #3959 then read as `ready` and idle, and
 * the sweep dispatched it twice in one day against #4605 (held for a merge click). Each session
 * found nothing to build. The continuation branch already refuses a plan with an open PR
 * (`continuationDecision`), and this applies the same check, on the same evidence, to rank order.
 * So the PR stays the source of truth even when the label has been removed.
 *
 * @param named `openPrsByIssue`'s map: issue number → the open PR naming it
 */
export function withoutOpenPr(pool = [], named = new Map()) {
  return pool.filter((i) => {
    const pr = named.get(i.number);
    if (pr) console.log(`::notice::retry sweep — skipping #${i.number}, open PR #${pr} names it`);
    return !pr;
  });
}

/**
 * The open PRs' named issues, FAIL-OPEN to an empty map. The cost of a failed read is one wasted
 * session on a held plan. That is smaller than a red `route` tick, which also takes the
 * event-research legs down (`continuationPick`'s header gives the same reasoning).
 */
function readOpenPrIssues() {
  try {
    return openPrsByIssue(ghRestAll("pulls?state=open"));
  } catch (err) {
    console.log(
      `::warning::retry sweep — open-PR read failed, not screening: ${String(err).slice(0, 200)}`,
    );
    return new Map();
  }
}

/**
 * `pickContinuation` over a freshly gathered context, FAIL-OPEN — the same call `gatherDeps` wraps
 * for the sweep, for the same reason. This gather is the chattiest read on a tick (a comments page
 * and a run lookup per candidate plan) and `ghRest` throws on a 5xx; letting that throw would fail
 * the `peek` step, and with it the whole `route` job — taking down the re-dispatch that carries the
 * retry sweep AND the event-research legs for that merge. A continuation missed on one tick is
 * picked up on the next push; a red `route` job costs everything the tick was for.
 */
function continuationPick(read) {
  try {
    return pickContinuation(read());
  } catch (err) {
    console.log(
      `::warning::continuation — skipping this tick, the read failed: ${String(err).slice(0, 200)}`,
    );
    return null;
  }
}

/**
 * The lease's own timestamp in ms, or null when nothing holds it. Same read and same stamp
 * `isClaimed` uses; this one hands back the number a comparison needs rather than prose.
 */
function leaseStampMs(slug) {
  try {
    const ref = JSON.parse(sh("gh", ["api", `repos/{owner}/{repo}/git/ref/tags/claim/${slug}`]));
    const ms = Date.parse(claimAgeOf(ref.object.sha));
    return Number.isNaN(ms) ? null : ms;
  } catch {
    return null; // 404 — nothing held, nothing to release
  }
}

/**
 * Claim a continuation pick, or return null so the caller falls through to rank order (#3818
 * criterion 9).
 *
 * THE LEASE IS RELEASED FIRST, AND ONLY IF IT PREDATES THE MERGE — the one write here that needs
 * its reasoning on the record. A lease outlives a SUCCESSFUL build, so a plan whose slice just
 * merged is still held by the run that finished, which is exactly the state `claimNext`'s loop
 * steps past; releasing that is safe, because `continuationDecision` has already proved the prior
 * slice is done (pullable, no open PR naming it, the last run concluded, the state block moved).
 *
 * A lease stamped AFTER that merge is a different animal: it belongs to a claim taken since the
 * gather's snapshot — a `ready` label event, a live session, another lane — and deleting it would
 * defeat the compare-and-set the whole lease exists to be, putting two sessions on one plan and one
 * state block. Those two runs sit in different concurrency groups, so nothing else serialises them.
 * Unconditional release was the first draft of this function and it is the bug a `/code-review`
 * pass caught before this slice shipped. So: compare, and leave a newer lease alone.
 */
function continueNext(pick, { claims, nowMs, sha, gateDeps }) {
  if (!pick) return null;
  const slug = `plan-${pick.number}`;
  const stamp = leaseStampMs(slug);
  if (stamp !== null && pick.mergedMs && stamp > pick.mergedMs) {
    console.log(
      `::notice::continuation — #${pick.number} took a new lease after its slice merged; leaving it alone`,
    );
    return null;
  }
  releaseClaim(slug);
  const ctx = {
    continuation: true,
    payload: { action: "labeled", label: { name: LABELS.ready.name }, issue: pick.issue },
  };
  const result = claims.plan(ctx, nowMs, sha, gateDeps);
  if (!result.claimed) {
    console.log(`::notice::continuation — not claiming #${pick.number}: ${result.reason}`);
    return null;
  }
  const out = process.env.GITHUB_OUTPUT;
  if (out) appendFileSync(out, "lane=plan\n");
  console.log(`::notice::continuing #${pick.number} — ${pick.reason} → ${pick.pickup}`);
  try {
    postContinuationReceipt(pick);
  } catch (err) {
    // The receipt is this lane's memory (the daily cap and criterion 10 both read it), but the
    // build is already claimed and running — so a failed comment is a warning, never a reason to
    // abandon the slice. The cost is one unjudged run, and the next tick sees no receipt to judge.
    console.log(
      `::warning::continuation — the receipt on #${pick.number} did not post: ${String(err?.message).slice(0, 200)}`,
    );
  }
  return { ...result, lane: "plan", continued: true };
}

// ── the impure half ───────────────────────────────────────────────────────────

/**
 * Read the real dependencies: scanners, open issues, open PR heads, on-disk statuses.
 *
 * FAIL CLOSED, LOUDLY. An earlier draft swallowed errors and returned `[]` — which made a failed
 * `gh issue list` indistinguishable from "no open issues", so the title-dedupe silently disarmed
 * and the duplicate class this router exists to kill was re-armed by its own plumbing (the
 * harness-engineering research called this the top gap). A dependency that cannot be read is a
 * hard stop, not an empty list.
 */
/**
 * Is this failure the GraphQL budget running out, rather than a wrong answer?
 *
 * `RATE_LIMIT_EXHAUSTED` in the extensions, or the message GitHub prints for it. Matched on the
 * message too because `gh` surfaces the latter and swallows the former.
 */
export function isRateLimited(err) {
  return /rate limit|RATE_LIMITED|RATE_LIMIT_EXCEEDED/i.test(String(err?.message ?? ""));
}

/**
 * The shipped sweep, degrading on an exhausted budget ONLY.
 *
 * `gatherDeps` is fail-closed on purpose: an unreadable dependency must never look like an empty
 * one, which is the class of bug #475 was. But a rate limit is not a wrong answer — it is a
 * TRANSIENT one, and treating it as fatal is disproportionate in a way that showed up on
 * 2026-08-26: `route` threw here, and because the research and feedback jobs both need its
 * outputs, the entire lane went dark for the rest of the hour over one optional sweep. The sweep
 * is a convenience (it closes feedback issues GitHub's own `Closes #` link missed); the tick is
 * not.
 *
 * So: a budget error skips the sweep and says so loudly, and the tick keeps running. EVERY other
 * failure still throws, because those are the ones that could be silently under-reporting. The
 * next push re-reads state from scratch — the whole design is level-based — so a skipped sweep
 * costs nothing beyond a delay.
 */
export function sweepShipped(readIssues, deps) {
  try {
    // LAZY on purpose: the list query is the call most likely to hit the budget, and evaluating
    // it as an argument would throw before this `try` was ever entered.
    return resolveShipped(readIssues(), deps);
  } catch (err) {
    if (!isRateLimited(err)) throw err;
    console.log(
      `::warning::shipped sweep skipped — the GraphQL budget is exhausted (${String(err.message).slice(0, 160)}). The tick continues; the sweep retries on the next push.`,
    );
    return [];
  }
}

/** THE DEDUPE'S EYES, PAGED (2026-09-18, found by the stall-repair lane on #2967) — and, since
 *  #2968's reconcile, the receipt reconcile's eyes too. One read, both consumers.
 *
 *  `routeSweep` dedupes its receipt issues against `openIssueTitles` — an exact-title match is the
 *  ONLY thing standing between "one receipt per never-assessed event" and a fresh duplicate every
 *  push. That list was a single un-paged `per_page=100` read, and this repo carries 403 open issues
 *  (343 of them `event-research` receipts). So the dedupe could only see the newest 100: every
 *  never-assessed event whose receipt had aged past that window got a SECOND receipt filed, then a
 *  third. Measured on the day this landed: 50 duplicated receipt titles, `jobs-2027-04-02` among
 *  them (#2859 on 09-09, #2967 on 09-15 — both stall-flagged, same event, same body).
 *
 *  Silent by construction, and self-feeding: each duplicate is one more open issue pushing the
 *  window further past the receipts it was supposed to be checking.
 *
 *  Paged on the CORE bucket, per gh.mjs's own header. The loop itself now lives in `ghRestAll`
 *  rather than here (#2968, merged into #3269's fix): the receipt reconcile needs the same list
 *  with `number` attached, and paging it twice would double the router's cheapest-but-not-free
 *  read for no gain. One house pattern for "page a REST list", still — just hoisted to where the
 *  other `gh` plumbing lives, beside `ghRest` itself.
 *
 *  ONE AMENDMENT TO #3269's CALL: the 20-page ceiling is now a hard error, not a silent partial.
 *  Degrading protected against an unbounded read, which is right — but a partial dedupe is the
 *  exact failure this function exists to end, and at 2,000 open issues we want a red run, not a
 *  quieter version of the same bug. The reconcile below drains the queue to a handful, so the
 *  ceiling should never be approached again; if it ever is, that is news.
 *
 *  NOT ALSO FIXED HERE, captured instead: `shippedSweep`'s `gh issue list --limit 100` is capped
 *  the same way. #2968's reconcile makes that moot for `event-research` — receipts now close
 *  against the LEDGER on disk, which is both free and the correct oracle — so the sweep is no
 *  longer run for that label at all. `feedback` keeps it, and keeps the cap: that one is GraphQL,
 *  and its own comment records the day it exhausted the bucket outright (2026-08-26). */
const openIssues = () => ghRestAll("issues?state=open").filter((i) => !i.pull_request);

function gatherDeps(ctx) {
  const json = (label, cmd, args) => {
    let out;
    try {
      // A GitHub 5xx mid-gather used to kill the whole route run (2026-09-05, docs/LESSONS.md);
      // three tries with backoff turn that into a pause, and a 4xx still throws on the first.
      out = withRetry(() => sh(cmd, args));
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
  // Issues whose work has merged but which are still open — the last mile GitHub's own `Closes #`
  // link keeps missing on bot-opened, bot-merged PRs. Joined here (impure) so `routeShipped` stays
  // pure and fixture-drivable. Run per label: `feedback` (2026-08-22) and `event-research`
  // (2026-08-28 — four research-labelled issues, #510/#706/#707/#720, stayed open after their
  // research docs merged because nothing ever swept this label; only `feedback` was wired).
  const shippedSweep = (label) => {
    // Is there any open issue with this label at all? A REST question, on the plentiful core
    // bucket, asked BEFORE the expensive one (2026-08-26). The sweep below rides every push and its
    // list query is GraphQL — 100 issues each with their nested closing-PR references, which the
    // API scores by COST, not by call count. On a busy day that is the single largest draw on a
    // 10,000/hr ceiling, and on 2026-08-26 it exhausted it outright: `route` started dying on "API
    // rate limit already exceeded" before it could dispatch the research or feedback jobs, so the
    // tick driving the whole lane stopped. Most pushes have nothing to sweep, and those now pay
    // nothing.
    const open = needsScan
      ? ghRest(`issues?state=open&labels=${label}&per_page=100`).filter((i) => !i.pull_request)
      : [];
    if (!open.length) return [];
    return sweepShipped(
      () =>
        json(`gh issue list (shipped, ${label})`, "gh", [
          "issue",
          "list",
          "--state",
          "open",
          "--label",
          label,
          "--limit",
          "100",
          "--json",
          // `closedByPullRequestsReferences`, NOT `closedByPullRequests` — the latter is not a
          // field `gh issue list` knows, and asking for it exits 1 with the allow-list, which took
          // every push run of this router down on 2026-08-22 (docs/LESSONS.md).
          // `labels` so `resolveShipped` can leave a `next-slice` issue open (#3818 slice 2).
          "number,title,labels,closedByPullRequestsReferences",
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
        warn: (msg) => console.log(`::warning::shipped sweep (${label}) — ${msg}`),
      },
    );
  };
  // REST, not `gh issue list --json title` (2026-08-26): a second GraphQL query, on every push, to
  // read scalars REST hands over on the core bucket. Paged — see `openTitles` above for what the
  // single-page version cost. Read ONCE here and shared, rather than paged a second time for the
  // reconcile's sake.
  const open = needsScan ? openIssues() : [];
  return {
    shippedFeedback: needsScan ? shippedSweep("feedback") : [],
    // `event-research` deliberately does NOT get the reference sweep any more (#2968). Its receipts
    // are now closed by `routeReceipts` against the LEDGER on disk, which is both the correct oracle
    // for this label and free — where this call spent the scarce GraphQL bucket to ask a question
    // that had silently answered "nothing shipped" for 144 finished receipts.
    dueEvents: needsScan
      ? json("event-scan --due", "node", ["scripts/event-scan.mjs", "--due"])
      : [],
    openIssueTitles: open.map((i) => i.title),
    openEventReceipts: needsScan ? readReceipts(open) : [],
    // The dropped-remainder relay (#3818 slice 4). REST and paged, like the open-issue read above,
    // and only on a sweep — nothing on a label or comment event can close an issue, so no other
    // path has anything to relay.
    closedWithRemainder: needsScan ? gatherRelayDeps() : [],
    // The assignment lane (#3818 slice 5). Sweep-only for the same reason as the relay above: only
    // a push can have changed what Eric holds since the last tick, and `null` (not `{}`) is what
    // makes `routeAssignments` a no-op on every other event and in every pre-slice-5 fixture.
    //
    // FAIL OPEN HERE, unlike every other read in this function — the one deliberate exception. This
    // read is the chattiest on the tick (a comments page per candidate) and so the likeliest to meet
    // a transient 5xx, and a throw out of `gatherDeps` happens BEFORE `runIntents`' per-intent
    // isolation: it would take the receipt closes, the relay and `has_next` down with it. Nothing is
    // lost by skipping a tick, because the next push re-reads the same queue from GitHub — this lane
    // keeps no state of its own. (Contrast `readReceipts`, which refuses outright: there a false
    // empty would CLOSE the whole queue.)
    assignments: needsScan ? gatherAssignmentsSafely() : null,
    // Continuation's stop half (#3818 slice 8, criterion 10). Sweep-only and FAIL-OPEN, for both
    // of the reasons the assignment read above records: only a push can have merged the slice that
    // makes a plan continuable, and this read is chatty enough (a comments page and a run lookup
    // per candidate plan) to meet a transient 5xx. A skipped tick costs nothing — the next push
    // re-reads the same state, and the only thing waiting is a stop that was already late.
    continuations: needsScan ? gatherSafely("continuations", gatherContinuationDeps) : null,
  };
}

/** `gatherAssignmentDeps` with the fail-open wrapper `gatherDeps` explains above. */
function gatherAssignmentsSafely() {
  return gatherSafely("assignments", gatherAssignmentDeps);
}

/** The fail-open gather `gatherDeps` explains: a read that throws warns and reads as "not this
 *  tick" (`null`), never as an empty queue — the one shape that could make a lane act wrongly. */
function gatherSafely(lane, read) {
  try {
    return read();
  } catch (err) {
    console.log(
      `::warning::${lane} — skipping this tick, the read failed: ${String(err).slice(0, 200)}`,
    );
    return null;
  }
}

/**
 * Join each open `[event-research]` receipt to the one fact that decides its fate: does its ledger
 * exist on disk? Impure (it reads the checkout), so `routeReceipts` stays pure over plain data.
 *
 * FAIL CLOSED ON A MISSING LEDGER DIRECTORY. `existsSync` on a file under a directory that is not
 * there returns false for every id, which would read as "none of these were ever researched" and
 * close nothing — harmless — but the inverse assumption is one edit away from closing the entire
 * queue on a checkout that never had `docs/`. Refusing outright is the same doctrine as
 * `event-scan.mjs`'s "an unreadable input is an error, never an empty result".
 */
function readReceipts(openIssues) {
  const dir = "docs/research/events";
  if (!existsSync(dir))
    throw new Error(
      `moneypenny: ${dir} is missing from this checkout — refusing to judge receipts against a ` +
        "ledger directory that is not there.",
    );
  const receipts = [];
  for (const i of openIssues) {
    const id = String(i.title ?? "").match(RECEIPT_TITLE_RE)?.[1];
    if (!id) continue;
    receipts.push({
      number: i.number,
      title: i.title,
      hasLedger: existsSync(`${dir}/${id}.md`),
    });
  }
  return receipts;
}

function execute(intents) {
  // The vocabulary first: a session that cannot apply `needs-info` has no way to say "I asked the
  // member", which is the outcome this lane most needs to be able to reach.
  try {
    ensureVocabulary();
  } catch (err) {
    console.log(`::warning::could not upsert labels: ${String(err.message).slice(0, 200)}`);
  }
  // One dispatch for every stall this run flagged, fired after the per-issue comments and labels
  // have landed (#3280) — the sessions are the expensive part, and same-run siblings share a cause.
  const stallRepairs = [];
  const { receipt, failed } = runIntents(intents, (i) => executeOne(i, stallRepairs));
  const dispatched = dispatchEventStallRepair(stallRepairs);
  if (dispatched) receipt.push(dispatched);
  // A write we could not make IS a real fault — isolating the blast radius must not turn a failed
  // run green. The receipt now says which intent failed and why, instead of the run just stopping.
  if (failed) process.exitCode = 1;
  // The durable per-run receipt (research gap #2: the scan path left no trace beyond the run log).
  // $GITHUB_STEP_SUMMARY renders on the run's summary page; locally it just skips.
  if (process.env.GITHUB_STEP_SUMMARY && receipt.length) {
    writeFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Moneypenny receipt\n\n${receipt.map((r) => `- ${r}`).join("\n")}\n`,
      { flag: "a" },
    );
  }
  if (receipt.length === 0) console.log("· nothing to do");
}

/** How the receipt names an intent that failed: its kind plus whatever identifies the target. */
export function intentLabel(i) {
  const target = i.issueNumber
    ? ` #${i.issueNumber}`
    : i.prNumber
      ? ` #${i.prNumber}`
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

/**
 * The shared body of every `flag-*` audit intent: comment, then apply the `stall-flagged` label
 * as the memory that stops the next push re-flagging the same issue. Split out so the three flag
 * kinds in `executeOne` (stall, silent-feedback, plan-stall) stay one line each rather than three
 * copies of this, which is what pushed the function's cognitive complexity over budget (#897).
 */
function commentAndFlagStall(i) {
  if (!i.issueNumber) return;
  sh("gh", ["issue", "comment", String(i.issueNumber), "--body", i.body]);
  ensureLabel(LABELS.stall);
  sh("gh", ["issue", "edit", String(i.issueNumber), "--add-label", LABELS.stall.name]);
}

/**
 * The PR-side twin of `commentAndFlagStall` (#909) — a PR is a different object than an issue as
 * far as `gh` is concerned (`gh issue comment`/`gh issue edit` 404 on a PR number), so this uses
 * `gh pr comment`/`gh pr edit` rather than sharing the helper above. Also dispatches the
 * moneypenny-repair.yml lane's `workflow_dispatch` conflict-repair entry point (its own
 * `conflict-repair.md` envelope judges whether the conflict is actually safe to auto-resolve).
 *
 * `conflict-flagged` is applied here regardless of whether the dispatch call itself succeeds, so a
 * transient `gh workflow run` failure never turns into a comment storm — but (#1403) it is no
 * longer a lifetime memory: `audit()`'s dedupe key is (PR, head sha), read back from the
 * `<!-- moneypenny:conflict … -->` marker `i.body` already carries, so a PR repaired once and then
 * re-dirtied by `main` moving under it gets re-dispatched instead of sitting stuck forever.
 */
function commentAndFlagConflict(i) {
  if (!i.prNumber) return;
  sh("gh", ["pr", "comment", String(i.prNumber), "--body", i.body]);
  ensureLabel(LABELS.conflictFlagged);
  sh("gh", ["pr", "edit", String(i.prNumber), "--add-label", LABELS.conflictFlagged.name]);
  try {
    sh("gh", [
      "workflow",
      "run",
      "moneypenny-repair.yml",
      "--ref",
      "main",
      "-f",
      `pr_number=${i.prNumber}`,
    ]);
  } catch (err) {
    console.log(
      `::warning::could not dispatch conflict repair for #${i.prNumber}: ${String(err.message).slice(0, 200)}`,
    );
  }
}

/**
 * #1403's ceiling: once a conflicted PR has been re-dispatched `CONFLICT_REPAIR_CAP` times and is
 * STILL conflicting, this stops dispatching repair sessions and hands it to Eric instead — the
 * carve-out that keeps the sha-based re-dispatch above from looping Opus sessions forever on a PR
 * that genuinely cannot merge cleanly. No repair dispatch here, deliberately.
 */
function commentAndFlagConflictCap(i) {
  if (!i.prNumber) return;
  sh("gh", ["pr", "comment", String(i.prNumber), "--body", i.body]);
  ensureLabel(LABELS.needsEric);
  sh("gh", ["pr", "edit", String(i.prNumber), "--add-label", LABELS.needsEric.name]);
}

/**
 * #3960 — take a stale `in-progress` label off, then say so once. Label FIRST and strict (unlike the
 * claim paths' best-effort `setInProgress`): the label's absence is the audit's only memory, so a
 * removal that failed must fail the intent and leave no comment behind — otherwise every push would
 * post the same comment again. A comment lost after a good removal costs one line, never a storm.
 */
function clearStaleInProgress(i) {
  if (!i.issueNumber) return;
  sh("gh", ["issue", "edit", String(i.issueNumber), "--remove-label", LABELS.inProgress.name]);
  sh("gh", ["issue", "comment", String(i.issueNumber), "--body", i.body]);
}

/**
 * The decision half of the event-research repair dispatch: every `flag-stall` in ONE audit run
 * becomes ONE `gh workflow run` carrying the whole list, not one run per issue.
 *
 * WHY BATCHED (#3280). It used to fire per issue, and the measurement says that is exactly the
 * wrong key: all 62 stall dispatches in the lane's history arrived in three bursts, each burst from
 * a single push-driven audit run (35 on 2026-09-11, 23 on 2026-09-13, 4 on 2026-09-18) with zero
 * cross-run duplicates. Receipts filed together cross `staleAfterDays` together, so same-run
 * siblings share a root cause with a very high prior — on 09-18 three Opus sessions diagnosed the
 * identical bug in parallel and produced two near-identical PRs plus one wasted session (#3269,
 * #3270, #3275), which then conflicted and drew two more repair runs. The bigger the bug, the more
 * duplicate sessions: backwards. The audit run is the cheapest class proxy that exists *before* a
 * session has diagnosed anything (`repair.mjs`'s `signature()` cannot help — a CI failure arrives
 * with its class, a stalled receipt arrives with nothing but an event id).
 *
 * It degrades to the old behaviour by construction: one intent ⇒ one number ⇒ one dispatch.
 * `issue_number` is already `type: string` on moneypenny-repair.yml, so the list is a value change,
 * not a schema change.
 *
 * Pure — the `gh` call lives in `dispatchEventStallRepair`, so a spec drives this with no network.
 *
 * @returns {{ args: string[], label: string } | null} the `gh` argv plus how a human reads the
 *   batch, or null when there is nothing to dispatch.
 */
export function stallRepairDispatch(issueNumbers) {
  const numbers = [...new Set((issueNumbers ?? []).filter(Boolean).map(Number))];
  if (numbers.length === 0) return null;
  return {
    args: [
      "workflow",
      "run",
      "moneypenny-repair.yml",
      "--ref",
      "main",
      "-f",
      `issue_number=${numbers.join(",")}`,
    ],
    label: numbers.map((n) => `#${n}`).join(", "),
  };
}

/**
 * The doing half. `flag-stall` (unlike `flag-silent-feedback`/`flag-plan-stall`, which need a
 * human's or Eric's judgment, not a code fix) is exclusively about `[event-research]` receipt
 * issues (gatherAuditDeps only builds `unclaimedIssues` from that title pattern) — a stalled one
 * usually means the same matrix-leg session has been failing silently, push after push, since only
 * a merged PR ever touches the issue.
 *
 * Dispatched once, after every comment/label in the run has landed, same "never turn a transient
 * `gh` failure into a comment storm" doctrine as the conflict twin — and the warning names the
 * whole list, because a batched failure loses N pings instead of one.
 *
 * @returns {string | null} a receipt line naming the batch, so the run summary stays honest about
 *   there being one session rather than one per issue.
 */
function dispatchEventStallRepair(issueNumbers) {
  const plan = stallRepairDispatch(issueNumbers);
  if (!plan) return null;
  try {
    sh("gh", plan.args);
    return `🔧 stall repair dispatched once for ${plan.label} — one session, one diagnosis`;
  } catch (err) {
    console.log(
      `::warning::could not dispatch stall repair for ${plan.label}: ${String(err.message).slice(0, 200)}`,
    );
    return `❌ stall repair dispatch failed for ${plan.label} — ${String(err.message).slice(0, 200)}`;
  }
}

/**
 * The push sweep's own three intents — the two closes and the dropped-remainder relay. Split out of
 * `executeOne` when the relay landed (#3818 slice 4): that function was already one point under the
 * cognitive-complexity ceiling, and a lane adding a branch to the shared dispatcher should pay for
 * its own room rather than ratchet the budget up. Groups cleanly because all three are the *level*
 * sweep's writes (a merged PR, a ledger on disk, a remainder with nowhere to live), where everything
 * left in `executeOne` reacts to a single event.
 *
 * @returns the receipt line, or `undefined` when this is not one of the sweep's intents.
 */
function executeSweepIntent(i) {
  if (i.kind === "close-shipped") {
    sh("gh", ["issue", "comment", String(i.issueNumber), "--body", i.body]);
    sh("gh", ["issue", "close", String(i.issueNumber), "--reason", "completed"]);
    console.log(`::notice::closed #${i.issueNumber} — shipped in #${i.pr}`);
    return `🚀 closed #${i.issueNumber} — \`${i.title}\` shipped in #${i.pr}`;
  }
  if (i.kind === "close-receipt") {
    // ONE call, not comment-then-close: this drains a backlog, and halving the mutating calls per
    // issue is what keeps a 20-per-tick batch clear of GitHub's secondary rate limits.
    sh("gh", [
      "issue",
      "close",
      String(i.issueNumber),
      "--reason",
      i.closeReason,
      "--comment",
      i.body,
    ]);
    console.log(`::notice::closed #${i.issueNumber} — ${i.why}`);
    return `${i.why === "researched" ? "📄" : "🌙"} closed #${i.issueNumber} — \`${i.title}\` ${i.why}`;
  }
  if (i.kind === "assign-eric" || i.kind === "unassign-eric") {
    // The two writes live in assignments.mjs so its own `--apply` CLI reuses them without importing
    // this router — the same cycle-avoidance as the relay below.
    const line = executeAssignments(i);
    console.log(`::notice::${line}`);
    return line;
  }
  if (i.kind === "stop-continuation") {
    // The label write and the assignment live in continuation.mjs so its own CLI can reuse them
    // without importing this router — the same cycle-avoidance as the relay and the assignments.
    const line = executeStopContinuation(i);
    console.log(`::warning::${line}`);
    return line;
  }
  if (i.kind === "relay-remainder") {
    // The three writes (file the relay, receipt the source, clear the remainder label) live in
    // relay.mjs so its own CLI can reuse them without importing this router.
    const line = executeRelay(i);
    console.log(`::notice::relayed #${i.source}'s remainder — ${i.title}`);
    return line;
  }
  return undefined;
}

/**
 * @param i the intent to carry out.
 * @param stallRepairs collector for `flag-stall` issue numbers — the dispatch is fired once per
 *   run by `execute()`, not once per intent (#3280). Pushed only after the comment/label landed,
 *   so an issue whose memory could not be written is not dispatched either, exactly as before.
 */
function executeOne(i, stallRepairs = []) {
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
  if (i.kind === "draft-lesson") return draftLesson(i);
  if (i.kind === "release-claim") {
    const freed = releaseBuild(i.slug);
    console.log(
      `::notice::claim/${i.slug} ${freed ? "released" : "was not held"} (by @${i.actor})`,
    );
    return freed
      ? `🔓 released \`claim/${i.slug}\` — the next scan can pick it up (@${i.actor})`
      : `· no \`claim/${i.slug}\` to release — nothing was holding it`;
  }
  if (i.kind === "flag-stall") {
    commentAndFlagStall(i);
    if (i.issueNumber) stallRepairs.push(i.issueNumber);
    console.log(`::warning::stall — ${i.title} quiet ${i.quietDays}d`);
    return `⏱ stall flagged — \`${i.title}\` quiet ${i.quietDays}d${i.issueNumber ? ` (commented on #${i.issueNumber}, repair batched)` : ""}`;
  }
  const swept = executeSweepIntent(i);
  if (swept !== undefined) return swept;
  if (i.kind === "flag-silent-feedback") {
    commentAndFlagStall(i);
    console.log(
      `::warning::silent feedback — #${i.issueNumber} no receipt after ${i.hoursSinceFiled}h`,
    );
    return `🔇 silent feedback — \`${i.title}\` no receipt after ${i.hoursSinceFiled}h (commented on #${i.issueNumber})`;
  }
  if (i.kind === "flag-plan-stall") {
    commentAndFlagStall(i);
    console.log(
      `::warning::plan stall — #${i.issueNumber} ready ${i.hoursSinceReady}h ago, never claimed`,
    );
    return `⏳ plan stall — \`${i.title}\` ready ${i.hoursSinceReady}h ago, never claimed (commented on #${i.issueNumber})`;
  }
  if (i.kind === "flag-conflict") {
    commentAndFlagConflict(i);
    console.log(`::warning::merge conflict — #${i.prNumber} \`${i.title}\` (attempt ${i.attempt})`);
    return `⚠️ conflict flagged — \`${i.title}\` (commented on #${i.prNumber}, attempt ${i.attempt})`;
  }
  if (i.kind === "clear-in-progress") {
    clearStaleInProgress(i);
    console.log(`::notice::cleared in-progress on #${i.issueNumber} — quiet ${i.hoursQuiet}h`);
    return `🧹 cleared \`in-progress\` — \`${i.title}\` quiet ${i.hoursQuiet}h (#${i.issueNumber})`;
  }
  if (i.kind === "retitle-work-mode") {
    // #3960 criterion 4 — the dashboard catches up with the dial. One write, no comment: the title
    // IS the display, and a comment per expiry would be noise on the one issue a human watches.
    sh("gh", ["issue", "edit", String(i.issueNumber), "--title", i.newTitle]);
    console.log(`::notice::work-mode title → ${i.newTitle} (${i.reason})`);
    return `🪧 retitled #${i.issueNumber} — \`${i.title}\` → \`${i.newTitle}\``;
  }
  if (i.kind === "flag-conflict-cap") {
    commentAndFlagConflictCap(i);
    console.log(`::warning::conflict repair cap reached — #${i.prNumber} \`${i.title}\``);
    return `🛑 conflict repair cap reached — \`${i.title}\` escalated to needs-eric (#${i.prNumber})`;
  }
  return `❓ unknown intent kind ${i.kind}`;
}

// The narrow, single-purpose CLI flags — each one does its own thing and exits, never reaching
// `route()`. Split out of `main` (2026-08-29, #823's `--claim-plan` pushed it over the cognitive
// complexity budget) purely to keep that dispatch table's branches out of `main`'s own count; no
// behavior change. @returns true if a flag was handled (the caller should return without routing).
function runCliFlag(argv, ctx) {
  // The tier heuristic, runnable on its own: `… --model-tier < body.md`. Exists so the decision
  // that once broke the lane has a spec that runs it exactly as production does.
  if (argv.includes("--model-tier")) {
    const { model, reason } = modelTier(readFileSync(0, "utf8"));
    console.log(`model=${model}`);
    console.log(`reason=${reason}`);
    return true;
  }

  // `--release <slug>`: hand the lease back. Exists so a job that failed can free the issue in its
  // own `if: failure()` step, rather than leaving it claimed-and-silent for the full TTL — the
  // shape that made the 2026-08-22 feedback failures look like builds in progress (docs/LESSONS.md).
  const relIdx = argv.indexOf("--release");
  if (relIdx >= 0 && argv[relIdx + 1]) {
    const slug = slugify(argv[relIdx + 1]);
    console.log(
      releaseBuild(slug)
        ? `::notice::released the lease for ${slug}`
        : `::notice::no lease held for ${slug} — nothing to release`,
    );
    return true;
  }

  // `--check-claim <slug>` (e.g. `feedback-1234`, `plan-1234`): read-only, never claims or writes.
  // For a caller (e.g. `/work-issues`) that wants to skip an issue Moneypenny already holds, before
  // any PR exists to signal it — see `isClaimed`'s own doc comment for why this exists.
  const checkIdx = argv.indexOf("--check-claim");
  if (checkIdx >= 0 && argv[checkIdx + 1]) {
    const slug = slugify(argv[checkIdx + 1]);
    console.log(JSON.stringify(isClaimed(slug)));
    return true;
  }

  // `--triage-feedback`: a freshly-`feedback`-labelled issue, not yet claimed — decide self-ready
  // or Backlog. Never touches the claim lease; that only starts once `ready` actually lands.
  if (argv.includes("--triage-feedback")) {
    triageFeedback(ctx);
    return true;
  }

  // `--check-callout` (#3913 slice 2b): `needs-eric` just landed on an issue — say so once if the
  // body never states what the decision is. Read-only but for that one comment; never relabels.
  if (argv.includes("--check-callout")) {
    checkCallout(ctx);
    return true;
  }

  // The two claim-lease lanes: `feedback` (now the `ready` label event, post-triage) and `plan`
  // (#823's ready-comment event). Both delegate to their own specced claim function; this table
  // is just dispatch.
  // `--claim-next` is the #3960 retry sweep: the top-ranked admissible `ready` issue, either lane;
  // `--peek-next` is its dry run for the push pass (claims nothing — see `peekNext`).
  const claimers = {
    "--claim-feedback": claimFeedback,
    "--claim-plan": claimPlan,
    "--claim-next": () => claimNext(),
    "--peek-next": () => peekNext(),
  };
  for (const [flag, claim] of Object.entries(claimers)) {
    if (argv.includes(flag)) {
      claim(ctx);
      return true;
    }
  }

  // `--guard-feedback-outcome <issue-number>` (#1028): the mechanical fallback the workflow calls
  // right after `claude-code-action` completes on the feedback lane. A session's own contract
  // (feedback-build.md) is a prompt's promise, not a guarantee — this is the check that catches it
  // when the promise is broken and the run left nothing visible behind.
  const guardIdx = argv.indexOf("--guard-feedback-outcome");
  if (guardIdx >= 0 && argv[guardIdx + 1]) {
    const runUrl =
      process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : undefined;
    guardFeedbackOutcome(argv[guardIdx + 1], runUrl);
    return true;
  }

  return false;
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

  if (runCliFlag(argv, ctx)) return;

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
