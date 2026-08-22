#!/usr/bin/env node
// Is `main` actually deployed? — the eye for the gap nothing else can see.
//
//   node scripts/deploy-lag.mjs            # human-readable; exit 1 when main is undeployed
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
//   2. `postmaster.yml`'s shipped-scan — never ran. The issue keeps no receipt and stays open.
//   3. The stall audit — never ran. The eye that watches for stalls is blinded by the same cause.
//
// CLAUDE.md's ship loop already warned that "a GITHUB_TOKEN merge wouldn't trigger the push→main
// deploy" and prescribed native auto-merge as the cure. That was half right: what matters is not
// REST-vs-native, it is WHOSE TOKEN arms the merge. Native auto-merge armed by GITHUB_TOKEN lands
// in exactly the same hole.
//
// WHY THIS IS NOT WIRED INTO THE PUSH-DRIVEN SCAN. The obvious home for this check is the
// postmaster's sweep — but that sweep only runs on `push` → `main`, and the whole condition here
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
  if (!lag.lagging) return `deploy is current — main (${short(head)}) is the released commit`;
  const why =
    lag.cause === "silent-merge"
      ? "every one merged by a token that emits no `push`, so the deploy never fired"
      : "cause unclear — check whether the deploy job failed rather than never starting";
  return `main is ${lag.behind} commit(s) ahead of the last release (${short(released)} → ${short(head)}) — ${why}`;
}

const short = (sha) => String(sha ?? "").slice(0, 7) || "unknown";

const gh = (args) => execFileSync("gh", args, { encoding: "utf8" });

/** Impure boundary: read the real state, hand it to the pure half. */
function readState() {
  const head = JSON.parse(gh(["api", "repos/{owner}/{repo}/commits/main"])).sha;
  const release = JSON.parse(gh(["api", "repos/{owner}/{repo}/releases/latest"]));
  // A release tag may be annotated, so resolve it to the commit it actually points at rather than
  // trusting the tag object's own sha — the same trap the claim lease hit on 2026-08-22.
  const released = JSON.parse(gh(["api", `repos/{owner}/{repo}/commits/${release.tag_name}`])).sha;
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
  return { head, released, tag: release.tag_name, stranded };
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
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ ...lag, released: state.released, tag: state.tag }, null, 2));
    process.exit(0);
  }
  console.log(describeLag(lag, state));
  for (const c of lag.stranded)
    console.log(`  ${short(c.sha)} ${c.subject} — merged by ${c.mergedBy || "?"}`);
  if (lag.lagging) {
    console.log(
      "\nto clear it: any merge to `main` by a non-GITHUB_TOKEN identity deploys everything above.",
    );
    process.exit(1);
  }
}
