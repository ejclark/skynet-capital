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
//
// THE FILE SPLIT (2026-08-26, noExcessiveLinesPerFile). This router now dispatches to sibling
// modules named for the lane they carry — postmaster-events.mjs (event-research), postmaster-
// shipped.mjs (closing the last mile), postmaster-audit.mjs (the stall/silent-feedback audit),
// postmaster-claim-lease.mjs + postmaster-model-tier.mjs (the feedback claim's supporting pieces),
// postmaster-labels.mjs (the shared label/footer vocabulary) and postmaster-gh.mjs (the `gh` shell
// wrapper). `claimHandoff` and `releaseClaim` stay HERE, not in the lease file, because
// tests/arch/lease-namespace.spec.ts pins their literal source text (the `refs/tags` ref template,
// the `["tags", "heads"]` fallback loop) as a static stand-in for a 2026-08-22 outage a live `gh`
// call can only fail on a runner — moving them would make that check pass on empty text instead of
// the real lease. Every export below keeps its original name and signature; anything that moved
// lives on as a re-export.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { answered, audit, gatherAuditDeps } from "./postmaster-audit.mjs";
import {
  CLAIM_TTL_MS,
  claimAgeOf,
  claimFailureReason,
  claimStamp,
} from "./postmaster-claim-lease.mjs";
import { dueForResearch, routeSweep } from "./postmaster-events.mjs";
import { sh } from "./postmaster-gh.mjs";
import { ensureLabel, ensureVocabulary, LABELS, MANAGED_LABELS } from "./postmaster-labels.mjs";
import { modelTier } from "./postmaster-model-tier.mjs";
import {
  mergedReference,
  prIsMerged,
  resolveShipped,
  routeShipped,
} from "./postmaster-shipped.mjs";

// Named re-exports, not `export … from` — this router keeps substantial logic of its own (the
// noBarrelFile rule is right to ban a file that's pure re-exports; this one just isn't that).
export {
  answered,
  audit,
  CLAIM_TTL_MS,
  claimFailureReason,
  dueForResearch,
  ensureVocabulary,
  LABELS,
  MANAGED_LABELS,
  mergedReference,
  modelTier,
  resolveShipped,
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
 * workflow step calling `claimHandoff` directly, and the retired handoff-inbox lane is gone.)
 */
export function route(ctx, deps = {}) {
  if (ctx.eventName === "push" || ctx.inputs?.command === "scan") return routeSweep(deps);
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
          "feedback",
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
