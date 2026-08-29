#!/usr/bin/env node
// Is `main` actually deployed? — the eye for the gap nothing else can see.
//
//   node scripts/deploy-lag.mjs            # human-readable; exit 1 when main is undeployed
//                                          # baseline = the last SUCCESSFUL DEPLOY, not the last tag
//   node scripts/deploy-lag.mjs --json     # machine-readable, always exit 0
//
// WHAT HAPPENED (2026-08-22). The feedback lane built #475 correctly, opened PR #492, CI passed,
// and native auto-merge merged it. Then nothing. No semantic-release, no Fly deploy, no postmaster
// tick — the member's fix sat on `main`, unreleased, and the issue stayed open with no receipt.
//
// The cause is one GitHub rule with three victims. Native auto-merge performs the merge as the
// identity that ARMED it, and the lane armed it with GITHUB_TOKEN. A push attributed to
// GITHUB_TOKEN starts no further workflow runs (GitHub's infinite-loop guard), so the single
// `push` → `main` event that this repo hangs everything on was never emitted:
//
//   1. `pipeline.yml`'s deploy job — never ran. `main` is ahead of the live site.
//   2. `moneypenny-events.yml`'s shipped-scan — never ran. The issue keeps no receipt and stays open.
//   3. The stall audit — never ran. The eye that watches for stalls is blinded by the same cause.
//
// CLAUDE.md's ship loop already warned that "a GITHUB_TOKEN merge wouldn't trigger the push→main
// deploy" and prescribed native auto-merge as the cure. That was half right: what matters is not
// REST-vs-native, it is WHOSE TOKEN arms the merge. Native auto-merge armed by GITHUB_TOKEN lands
// in exactly the same hole.
//
// WHY THIS IS NOT WIRED INTO THE PUSH-DRIVEN SCAN. The obvious home for this check is
// Moneypenny's sweep — but that sweep only runs on `push` → `main`, and the whole condition here
// is "no push happened". By the time a push arrives to run the check, that same push has already
// deployed everything and cleared the lag: the detector would only ever report a state it had just
// missed. So it lives on the on-demand paths that are not themselves the cure — a human or agent
// asking, the audit dispatch, and the secretary's digest.
//
// The root fix is a credential, not code: give the lane an identity that is not GITHUB_TOKEN
// (`vars.APP_CLIENT_ID` + `secrets.APP_PRIVATE_KEY`, or `secrets.HANDOFF_PR_TOKEN`) and the merge
// emits a real push again. Until then this answers the question out loud instead of by accident.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { classify } from "./bot-relevant.mjs";

/** Merges attributed to these identities emit no `push` event, so they strand the deploy. */
export const SILENT_MERGERS = new Set(["github-actions[bot]", "claude[bot]", "github-actions"]);

/**
 * Pure. Given main's head, the last released commit, and the commits between them, decide whether
 * the deploy is stranded and say why.
 *
 * @param {{head?: string, released?: string, stranded?: {sha: string, subject: string,
 *          mergedBy?: string}[]}} state
 */
export function deployLag(state = {}) {
  const { head, released, stranded = [] } = state;
  if (!(head && released) || head === released) {
    return { lagging: false, behind: 0, stranded: [], cause: null };
  }
  const silent = stranded.filter((c) => SILENT_MERGERS.has(c.mergedBy ?? ""));
  return {
    lagging: true,
    behind: stranded.length,
    stranded,
    // Every stranded commit merged by a token that emits no push → this is the known cause, and
    // the fix is the credential. A mixed or human-merged set means something else is wrong, and
    // saying "unknown" is more useful than guessing the familiar answer.
    cause: stranded.length > 0 && silent.length === stranded.length ? "silent-merge" : "unknown",
  };
}

/** One-line summary for a run log, a digest, or a terminal. */
export function describeLag(lag, { released, head } = {}) {
  if (!lag.lagging) return `deploy is current — main (${short(head)}) is the deployed commit`;
  const why =
    lag.cause === "silent-merge"
      ? "every one merged by a token that emits no `push`, so the deploy never fired"
      : "cause unclear — check whether the deploy job failed rather than never starting";
  return `main is ${lag.behind} commit(s) ahead of the last deploy (${short(released)} → ${short(head)}) — ${why}`;
}

/**
 * Pure. The BOTS app's half of the question, post deploy-split: skynet-capital-bots deploys only
 * when scripts/bot-relevant.mjs says a push touched the bots runtime, so "main is ahead of the
 * last bots deploy" is HEALTHY whenever everything since is docs/tests/frontend. Stale means:
 * bot-relevant commits exist past the last real bots deploy — the residual risk the split design
 * names (a failed deploy-bots job followed by docs-only merges), and force_bots_deploy is the
 * recovery lever.
 *
 * @param {{head?: string, botsReleased?: string, botsChanged?: string[]}} state — botsReleased
 *   empty-string = scanned clean, genuinely no bots deploy yet; absent = the scan itself failed.
 */
export function botsDeployLag(state = {}) {
  const { head, botsReleased, botsChanged } = state;
  if (botsReleased === undefined || botsChanged === undefined) return { known: false };
  if (!botsReleased) return { known: true, baseline: false, lagging: false };
  if (botsReleased === head || botsChanged.length === 0) {
    return { known: true, baseline: true, lagging: false };
  }
  const verdict = classify(botsChanged);
  return { known: true, baseline: true, lagging: verdict.deploy, reason: verdict.reason };
}

/** One-line bots-app summary, sibling of describeLag. */
export function describeBotsLag(lag, { botsReleased } = {}) {
  if (!lag.known) return "bots app: state unknown (jobs API unreadable) — not judging";
  if (!lag.baseline) return "bots app: no deploy baseline yet (pre-cutover, or never deployed)";
  if (!lag.lagging) {
    return `bots app is current — nothing bot-relevant since its last deploy (${short(botsReleased)})`;
  }
  return `bots app is STALE — ${lag.reason} since its last deploy (${short(botsReleased)}); recover via Pipeline → Run workflow → force_bots_deploy`;
}

const short = (sha) => String(sha ?? "").slice(0, 7) || "unknown";

const gh = (args) => execFileSync("gh", args, { encoding: "utf8" });

/**
 * Impure boundary: read the real state, hand it to the pure half.
 *
 * THE BASELINE IS THE LAST SUCCESSFUL DEPLOY, NOT THE LAST RELEASE TAG. The first cut of this
 * script compared against `releases/latest` and was wrong within the hour: semantic-release makes
 * no release for a `docs:`/`chore:`/`test:` commit, so `main` sits legitimately ahead of the newest
 * tag every time one merges. It flagged `ac3cafa` — a docs commit that had deployed successfully —
 * as stranded. A detector that cries wolf on a healthy repo is worse than none, and this file's own
 * header is about layers that misreport themselves.
 *
 * The deploy job's own run is the honest baseline: it is exactly the thing whose absence this
 * script exists to notice.
 */
/**
 * ONE bounded scan resolves both baselines from JOB conclusions, not run conclusions: after the
 * deploy split, a red `deploy-bots` job fails the whole run, and the old status=success run
 * filter would have declared the dashboard undeployed when its own deploy job was green. The
 * bots baseline is stricter still — the job's "Deploy bots" STEP must have succeeded, because a
 * preflight skip concludes the job green without deploying anything. Throws on any API failure;
 * the caller decides what fails soft.
 */
function scanRunBaselines() {
  let released = "";
  let botsReleased;
  const runs =
    JSON.parse(
      gh([
        "api",
        "repos/{owner}/{repo}/actions/workflows/pipeline.yml/runs?event=push&branch=main&per_page=20",
      ]),
    ).workflow_runs ?? [];
  for (const run of runs) {
    if (released && botsReleased !== undefined) break;
    const jobs =
      JSON.parse(gh(["api", `repos/{owner}/{repo}/actions/runs/${run.id}/jobs?per_page=30`]))
        .jobs ?? [];
    if (!released && jobs.find((j) => j.name === "release · deploy")?.conclusion === "success") {
      released = run.head_sha;
    }
    if (botsReleased === undefined) {
      const step = jobs
        .find((j) => j.name === "release · deploy bots")
        ?.steps?.find((s) => s.name === "Deploy bots");
      if (step?.conclusion === "success") botsReleased = run.head_sha;
    }
  }
  // Scanned clean with no real bots deploy in the window: report "no baseline", not "unknown".
  return { released, botsReleased: botsReleased ?? "" };
}

function readState() {
  const head = JSON.parse(gh(["api", "repos/{owner}/{repo}/commits/main"])).sha;
  let released = "";
  let botsReleased;
  let botsChanged;
  try {
    ({ released, botsReleased } = scanRunBaselines());
    botsChanged =
      botsReleased && botsReleased !== head
        ? (JSON.parse(
            gh(["api", `repos/{owner}/{repo}/compare/${botsReleased}...${head}`]),
          ).files?.map((f) => f.filename) ?? [])
        : [];
  } catch {
    // Fail SOFT on the scan: the dashboard baseline falls back to the pre-split query below, and
    // the bots half stays absent = "unknown" — a detector that cries wolf is worse than none.
    botsReleased = undefined;
    botsChanged = undefined;
  }
  if (!released) {
    released =
      JSON.parse(
        gh([
          "api",
          "repos/{owner}/{repo}/actions/workflows/pipeline.yml/runs?event=push&branch=main&status=success&per_page=1",
        ]),
      ).workflow_runs?.[0]?.head_sha ?? "";
  }
  const stranded =
    head === released
      ? []
      : JSON.parse(gh(["api", `repos/{owner}/{repo}/compare/${released}...${head}`])).commits.map(
          (c) => ({
            sha: c.sha,
            subject: String(c.commit?.message ?? "").split("\n")[0],
            mergedBy: c.author?.login ?? c.committer?.login ?? "",
          }),
        );
  return { head, released, stranded, botsReleased, botsChanged };
}

/** Read a whole stdin stream synchronously — the `--explain` fixture channel. */
function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

if (process.argv[1]?.endsWith("deploy-lag.mjs")) {
  // `--explain` takes the state as JSON on stdin instead of reading GitHub, so the decision can be
  // specced through the real entrypoint (the house pattern — see tests/scripts/*.spec.ts) without
  // a token. Everything below the read is identical on both paths.
  const state = process.argv.includes("--explain") ? JSON.parse(readStdin() || "{}") : readState();
  const lag = deployLag(state);
  // The bots half only speaks when the state carries bots fields, so pre-split --explain fixtures
  // keep byte-identical output and the two answers can never be conflated.
  const hasBots = "botsReleased" in state || "botsChanged" in state;
  const bots = hasBots ? botsDeployLag(state) : undefined;
  if (process.argv.includes("--json")) {
    console.log(
      JSON.stringify({ ...lag, released: state.released, ...(bots ? { bots } : {}) }, null, 2),
    );
    process.exit(0);
  }
  console.log(describeLag(lag, state));
  for (const c of lag.stranded)
    console.log(`  ${short(c.sha)} ${c.subject} — merged by ${c.mergedBy || "?"}`);
  if (bots) console.log(describeBotsLag(bots, state));
  if (lag.lagging) {
    console.log(
      "\nto clear it: any merge to `main` by a non-GITHUB_TOKEN identity deploys everything above.",
    );
    process.exit(1);
  }
  if (bots?.lagging) process.exit(1);
}
