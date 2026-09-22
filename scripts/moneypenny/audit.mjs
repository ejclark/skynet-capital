// THE LOOP'S EYES — the stall/silent-feedback audit lane. Split out of moneypenny.mjs (formerly postmaster.mjs; 2026-08-26,
// the noExcessiveLinesPerFile split). The plan-ready stall check (#897, closing #877's deferred
// slice 3) joined 2026-08-29: a plan issue whose ready-flip comment never got claimed or built is
// the same "silence looks like nothing happened" failure mode as the other two lanes here.
import { existsSync } from "node:fs";
import { sh } from "./gh.mjs";
import { FOOTER, LABELS } from "./labels.mjs";
import { hasPlanLabel, isReadySignal } from "./plan-claim.mjs";

/**
 * #1403 — how many times a conflicted PR gets re-dispatched before this lane stops trying and
 * escalates to `needs-eric` instead. Without a ceiling, a PR that can never merge cleanly (a real
 * logic conflict, not just `main` moving) would draw an Opus repair session every time it re-dirties,
 * forever. Exported so the spec can assert the ceiling without hard-coding the number twice.
 */
export const CONFLICT_REPAIR_CAP = 3;

/** The hidden memory `commentAndFlagConflict` embeds in every conflict comment it posts — the sha
 *  and attempt number a re-dispatch decision was made at (see `audit()`'s conflict loop below). */
export const CONFLICT_MARKER = /<!-- moneypenny:conflict sha=(\S+) attempt=(\d+) -->/;

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
    readyPlans = [],
    conflictedPRs = [],
    staleAfterDays = 2,
    silentAfterHours = 6,
    planStallAfterHours = 48,
  } = deps;
  // FLAG ONCE, NOT PER RUN. The audit rides every push (2026-08-19), so without memory a stall
  // would draw a fresh comment on every merge to main — comment spam, not eyes. The memory is the
  // `stall-flagged` label: executeOne applies it with the comment, and a labelled issue is never
  // re-flagged. One ping per stall, however many pushes go by.
  const flagged = new Set(deps.alreadyFlagged ?? []);
  // `conflict-flagged` is its own label on a different object (PRs, not issues) — a separate
  // memory map rather than overloading `flagged`, which `gatherAuditDeps` only ever populates from
  // issue labels. Keyed by PR number; each entry carries the sha/attempt the last flag comment was
  // made at (#1403) so a re-conflict at a NEW head can be told apart from the same unchanged one.
  // A bare number (the pre-#1403 shape, and still what a hand-written fixture may pass) means
  // "flagged, sha unknown" — never re-fires, same as before this change.
  const flaggedPRs = new Map(
    (deps.alreadyFlaggedPRs ?? []).map((f) =>
      typeof f === "number" ? [f, { sha: null, attempt: 1 }] : [f.number, f],
    ),
  );
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
  // #897 (closing #877's deferred slice 3): a `ready` comment on a plan issue that never got
  // claimed or built looks IDENTICAL to "nothing needed" from Eric's side — the trigger may have
  // missed, hit a label mismatch, or lost a claim race, and none of those leave a trace anywhere he
  // looks. `readyPlans` arrives pre-filtered by `gatherAuditDeps` (via the pure `readyPlanCandidate`
  // below) to issues that are plan-labeled, carry a ready-signal comment, have no live claim lease,
  // and have no linked PR — this loop only applies the time threshold and the one-ping memory.
  for (const p of readyPlans) {
    if (p.hoursSinceReady < planStallAfterHours) continue;
    if (flagged.has(p.number)) continue;
    intents.push({
      kind: "flag-plan-stall",
      issueNumber: p.number,
      title: p.title,
      hoursSinceReady: p.hoursSinceReady,
      body: `⏳ **Plan never claimed** — a ready-flip comment landed **${p.hoursSinceReady}h** ago but nothing has claimed or built this plan issue since (no \`claim/plan-${p.number}\` lease, no linked PR). The trigger may have missed, hit a label mismatch, or lost a claim race.\n\nRe-post a ready comment (e.g. \`ready\`) to retry — the claim lease makes a re-trigger a safe retry, not a second build. If it is intentionally on hold, say so here so it stops looking dropped.\n\n${FOOTER}`,
    });
  }
  // #909 / #1403 — the one class nothing else was watching: a PR that went `CONFLICTING` against
  // `main` on some push has no CI signal, no failed run, nothing red. `main`'s own tick is exactly
  // what makes this detectable — `conflictedPRs` arrives pre-filtered to open, actually-conflicting
  // PRs by `gatherAuditDeps`, each carrying the PR's CURRENT head sha (`headRefOid`).
  //
  // The dedupe key is per (PR, head sha), not per PR for life (#1403): `main` here takes a merge
  // every few minutes, so a PR repaired once can easily go `CONFLICTING` again before it lands —
  // `conflict-flagged` used to be a lifetime memory and that second conflict then sat forever with
  // no further dispatch. `flaggedPRs` carries the sha/attempt the LAST flag comment was made at
  // (read back from the PR's own comments by `gatherAuditDeps`'s `lastConflictMarker` — no storage
  // beyond GitHub itself):
  //   - same sha as last time → skip. Either nothing has pushed since (still mid-repair), or the
  //     repair session failed without pushing (e.g. a missing `contents: write` grant, #1286) —
  //     re-flagging an unchanged head is a comment storm for zero new information.
  //   - a different sha → the head moved (a repair pushed, or a fresh commit landed) and it is
  //     conflicting again: re-dispatch, up to `CONFLICT_REPAIR_CAP` attempts.
  //   - the cap is spent → stop dispatching repairs and escalate to `needs-eric` instead, so a
  //     genuinely un-mergeable PR lands on his desk rather than looping Opus sessions forever.
  // `executeOne`'s `commentAndFlagConflict` dispatches moneypenny-repair.yml's conflict-repair
  // session right after a `flag-conflict` intent runs — that session judges disjoint-vs-same-logic
  // and either pushes a resolved merge commit or escalates to `needs-eric` itself; this comment is
  // the receipt that a repair was dispatched, not an ask.
  for (const c of conflictedPRs) {
    const prior = flaggedPRs.get(c.number);
    if (!prior) {
      intents.push({
        kind: "flag-conflict",
        prNumber: c.number,
        title: c.title,
        attempt: 1,
        body: `⚠️ **Merge conflict** — this PR is now conflicted with \`main\` (no push to this branch caused it; \`main\` moved out from under it). Nothing else here watches for this — CI stays silent because no check ever ran against the conflict.\n\nA repair session has been dispatched — it merges \`main\` in and resolves it if the conflict is safely disjoint, or applies \`needs-eric\` with an explanation if it isn't.\n\n<!-- moneypenny:conflict sha=${c.headRefOid ?? "unknown"} attempt=1 -->\n\n${FOOTER}`,
      });
      continue;
    }
    // Same head as the last flag, or no readable head at all: unknown or unchanged, never re-fire.
    if (!c.headRefOid || prior.sha == null || prior.sha === c.headRefOid) continue;
    if (prior.attempt >= CONFLICT_REPAIR_CAP) {
      intents.push({
        kind: "flag-conflict-cap",
        prNumber: c.number,
        title: c.title,
        attempt: prior.attempt,
        body: `🛑 **Merge conflict — repair cap reached** — this PR has been repaired ${prior.attempt} time(s) and has gone \`CONFLICTING\` against \`main\` again. Something about it is not resolving safely on its own, so this stops dispatching repair sessions and hands it to \`needs-eric\` instead of looping.\n\n${FOOTER}`,
      });
      continue;
    }
    const attempt = prior.attempt + 1;
    intents.push({
      kind: "flag-conflict",
      prNumber: c.number,
      title: c.title,
      attempt,
      body: `⚠️ **Merge conflict, again** — this PR was repaired once already and has gone \`CONFLICTING\` against \`main\` again since (attempt ${attempt}/${CONFLICT_REPAIR_CAP}). \`main\` moves every few minutes here, so one repair is not guaranteed to still apply by the time it lands.\n\nA repair session has been re-dispatched — it merges \`main\` in and resolves it if the conflict is safely disjoint, or applies \`needs-eric\` with an explanation if it isn't.\n\n<!-- moneypenny:conflict sha=${c.headRefOid} attempt=${attempt} -->\n\n${FOOTER}`,
    });
  }
  return intents;
}

/**
 * THE PLAN-STALL DECISION — pure, mirroring `isReadySignal`'s own fixture-drivable shape: given
 * one issue, its comments, and whether a claim lease is currently held, decide whether it belongs
 * in the stalled-plan candidate list, and if so how old its ready-flip is. No network, no clock
 * beyond the injected `nowMs` — the actual `gh` calls (comments, claim-ref lookup) stay in
 * `gatherAuditDeps`, same division of labor as `planReadyIntent` vs. `claimPlan`.
 *
 * Returns `null` for anything that is not a live candidate: not plan-labeled, already answered
 * (closed or has a linked PR), currently claimed, or carrying no ready-signal comment at all. The
 * TIME threshold is NOT applied here — that is `audit()`'s job, same split as `unclaimedIssues`
 * (quietDays) and `silentFeedback` (hoursSinceFiled).
 *
 * @returns {{ title: string, number: number, hoursSinceReady: number } | null}
 */
export function readyPlanCandidate(issue, comments = [], hasClaim = false, nowMs = Date.now()) {
  if (!hasPlanLabel(issue)) return null;
  if (answered(issue)) return null;
  if (hasClaim) return null;
  // `gh issue view --json comments` lists comments oldest-first, so the first match here is the
  // EARLIEST ready-flip — the age that matters, since that is how long the trigger has had to fire.
  const readyComment = (comments ?? []).find((c) => isReadySignal(c?.body));
  if (!readyComment) return null;
  const hoursSinceReady = Math.floor((nowMs - Date.parse(readyComment.createdAt)) / 3_600_000);
  return { title: issue.title, number: issue.number, hoursSinceReady };
}

/** Audit-mode dependencies: unclaimed dispatch issues. Loud on failure, same doctrine as
 *  gatherDeps. `now` injected for the day math (never Date.now() in a testable path — the caller
 *  passes it). */
export function gatherAuditDeps(nowMs) {
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
  /**
   * #1403 — the per-(PR, head sha) memory `audit()` needs to tell "still stuck on the same
   * conflict" from "repaired, then went dirty again": read back the sha/attempt the LAST
   * `flag-conflict` comment on this PR was posted at, from the `<!-- moneypenny:conflict … -->`
   * marker `commentAndFlagConflict` embeds in every one of those comments. Comments list
   * oldest-first, so the last match is the most recent flag. No storage beyond GitHub itself.
   * `{ sha: null, attempt: 1 }` — never re-fires, same as the pre-#1403 lifetime-memory behaviour —
   * covers both "nothing parsed" (a pre-rollout comment predates the marker) and is the safe
   * default rather than risking a comment storm on a state this cannot verify.
   */
  function lastConflictMarker(prNumber) {
    const view = json(`gh pr view (comments, #${prNumber})`, [
      "pr",
      "view",
      String(prNumber),
      "--json",
      "comments",
    ]);
    const comments = view.comments ?? [];
    for (let idx = comments.length - 1; idx >= 0; idx -= 1) {
      const match = CONFLICT_MARKER.exec(comments[idx]?.body ?? "");
      if (match) return { sha: match[1], attempt: Number(match[2]) };
    }
    return { sha: null, attempt: 1 };
  }
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

  // A STALL IS ONLY A STALL IF THE WORK IS STILL WANTED (#2968). A receipt with no ledger whose
  // event has left `--due` — beyond the research horizon, dropped from the calendar, or passed and
  // aged out — is not a failing matrix leg; it is a receipt for work nobody will ever do, and
  // `routeReceipts` closes it on the next push. Flagging it dispatches a repair session that can
  // only report "nothing to repair", which is exactly what happened to #2968: a real Opus session
  // spent discovering there was no failure. Deferral is NOT this case — the dispatch ceiling is
  // applied downstream of `--due`, so a merely-deferred event is still listed here and still
  // flaggable.
  const dueIds = dueEventIds();
  const unclaimedIssues = [];
  for (const i of issues) {
    const id = i.title.match(/^\[event-research\] (.+)$/)?.[1];
    if (id && dueIds.has(id) && !existsSync(`docs/research/events/${id}.md`)) {
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
        (i.labels ?? []).some((l) => l.name === "feedback") &&
        !answered(i) &&
        !(i.labels ?? []).some((l) => spoke.has(l.name)),
    )
    .map((i) => ({
      title: i.title,
      number: i.number,
      hoursSinceFiled: hoursSince(i.createdAt ?? i.updatedAt),
    }));

  // #897: plan issues whose ready-flip may never have been claimed. Skip the (expensive-ish,
  // per-issue) comment fetch entirely for anything the cheap in-memory checks already rule out —
  // answered or already flagged — same "don't pay for what you don't need" discipline as the
  // shipped sweep's REST-before-GraphQL check above.
  const readyPlans = [];
  for (const i of issues) {
    if (!hasPlanLabel(i)) continue;
    if (answered(i)) continue;
    if (alreadyFlagged.includes(i.number)) continue;
    if (hasPlanClaim(i.number)) continue;
    const view = json(`gh issue view (comments, #${i.number})`, [
      "issue",
      "view",
      String(i.number),
      "--json",
      "comments",
    ]);
    const candidate = readyPlanCandidate(i, view.comments, false, nowMs);
    if (candidate) readyPlans.push(candidate);
  }

  // #909 — one call for every open PR's mergeability, same REST/GraphQL-cost discipline as the
  // rest of this file (one list call, not one lookup per PR). `mergeable` is GitHub's own
  // async-computed field: `CONFLICTING` is the only value this cares about — `UNKNOWN` means
  // GitHub hasn't finished computing it yet and is deliberately left alone rather than treated as
  // a false positive; the next push re-checks it, same level-based design as everything else here.
  // `headRefOid` (added #1403) is the PR's current head sha — `audit()`'s dedupe key alongside the
  // PR number, so a repaired-then-re-dirtied PR is told apart from one still stuck at the same head.
  const prs = json("gh pr list", [
    "pr",
    "list",
    "--state",
    "open",
    "--limit",
    "100",
    "--json",
    "number,title,mergeable,labels,headRefOid",
  ]);
  const stillConflicting = new Set(
    prs.filter((p) => p.mergeable === "CONFLICTING").map((p) => p.number),
  );
  // #1403 — the marker lookup only matters for a PR that is BOTH already flagged and conflicting
  // again right now; a flagged PR that is currently clean needs no lookup (nothing to decide), and
  // a never-flagged one has no prior marker to read. Keeps this to the small set the bottleneck
  // was actually measured on (4 PRs, 2026-09-05), not one extra `gh pr view` per open PR.
  const alreadyFlaggedPRs = prs
    .filter((p) => (p.labels ?? []).some((l) => l.name === LABELS.conflictFlagged.name))
    .filter((p) => stillConflicting.has(p.number))
    .map((p) => ({ number: p.number, ...lastConflictMarker(p.number) }));
  const conflictedPRs = prs
    .filter((p) => p.mergeable === "CONFLICTING")
    .map((p) => ({ title: p.title, number: p.number, headRefOid: p.headRefOid }));

  return {
    unclaimedIssues,
    silentFeedback,
    readyPlans,
    conflictedPRs,
    alreadyFlagged,
    alreadyFlaggedPRs,
  };
}

/**
 * Which event ids `scripts/event-scan.mjs --due` currently lists. Local node, no network, no
 * `npm ci` — the same call `gatherDeps` makes on the sweep side, made here so the stall check can
 * tell "the matrix leg keeps dying" from "nothing is asking for this any more" (#2968).
 *
 * LOUD, never an empty set: a scan that cannot run must not quietly turn every receipt into a
 * non-stall and switch this lane's eyes off. Same doctrine as `gatherAuditDeps`'s own `json`.
 */
function dueEventIds() {
  let out;
  try {
    out = sh("node", ["scripts/event-scan.mjs", "--due"]);
  } catch (err) {
    throw new Error(`event-scan --due failed: ${String(err.stderr || err.message).trim()}`);
  }
  try {
    return new Set(JSON.parse(out || "[]").map((e) => e.id));
  } catch {
    throw new Error(`event-scan --due returned unparseable JSON:\n${String(out).slice(0, 400)}`);
  }
}

/**
 * Is `claim/plan-<n>` currently held? Read-only mirror of `claimHandoff`'s own `readRef` shape
 * (scripts/moneypenny/index.mjs) — a 404 means unclaimed, which is the common and expected case.
 */
function hasPlanClaim(number) {
  try {
    sh("gh", ["api", `repos/{owner}/{repo}/git/ref/tags/claim/plan-${number}`]);
    return true;
  } catch {
    return false;
  }
}
