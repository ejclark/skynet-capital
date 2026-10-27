#!/usr/bin/env node
// Should this push restart the DASHBOARD machine? — the deploy preflight for pipeline.yml's
// `deploy` job (#4616, slice 4 of #4612). Sibling of scripts/bots-deploy-preflight.mjs, same shape:
// a pure classifier plus a CLI that does the one environmental lookup (git diff) and prints two
// lines, `deploy`/`skip` then the reason.
//
// WHY. `deploy` ran on EVERY push to main — ~50 a day, each restarting the one machine (10.8–28.7 s
// of held requests measured live, ~19 min/day), and 57% of those commits changed nothing the
// running server reads. The original comment justified it ("durable state is volume-backed;
// restarts are harmless") — true for data, wrong for availability: the audit of 2026-10-04 timed
// the holds.
//
// WHAT SHIPS. The image is `COPY . .` minus `.dockerignore`: `tests/`, `.github/`, `data/`,
// `coverage/`, root-level `*.md` (a `.dockerignore` `*.md` matches the context root only — a nested
// README ships), and `docs/` except `docs/research/**` (the /research shelf is read from the image at
// request time, so a research merge IS a runtime change — a restart is the only way it goes live).
// Everything else — src/, app/, scripts/, package*.json, Dockerfile, fly*.toml, `.claude/`, config
// JSON — ships, and `.claude/` stays on the deploy side until someone proves nothing reads it.
//
// BIAS TO DEPLOY, like bot-relevant.mjs: a wrong `deploy` costs one restart; a wrong `skip` leaves
// production silently behind main. The skip list therefore mirrors `.dockerignore` exactly and
// nothing else — widen it only with proof. Every code path that redeploys the bots app also
// redeploys the dashboard first (deploy-bots reuses the dashboard's image — `needs: deploy`).
//
// BASELINE IS GROUND TRUTH. Each deploy stamps the machine's `GIT_SHA` (a line in the [env] block of
// the config it deploys with); this diffs from what the machine actually runs, so a skipped or failed
// run can never strand a runtime commit — the next diff still spans it. No stamp (first deploy, a
// rollback, an unreadable machine list) fails OPEN to deploying.
//
// CLI (ALWAYS exit 0 — a preflight crash must never break the pipeline):
//   node scripts/dashboard-deploy-preflight.mjs        reads env DEPLOYED_SHA, HEAD_SHA, FORCE
//   node scripts/dashboard-deploy-preflight.mjs --classify    newline-separated paths on stdin
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** True when this path is excluded from the image or is never read by the running dashboard. */
export function imageIrrelevant(path) {
  if (path.startsWith("docs/research/")) return false; // read from the image at request time
  return (
    path.startsWith("docs/") ||
    path.startsWith("tests/") ||
    path.startsWith(".github/") ||
    path.startsWith("data/") ||
    path.startsWith("coverage/") ||
    (!path.includes("/") && path.endsWith(".md"))
  );
}

/** Pure. Classify a changed-path set: must the dashboard machine restart? */
export function classify(paths) {
  if (paths.length === 0) return { deploy: false, reason: "no changed paths" };
  const relevant = paths.filter((p) => !imageIrrelevant(p));
  if (relevant.length === 0) {
    return {
      deploy: false,
      reason: `all ${paths.length} path(s) are tests/workflows/docs — none is in the image`,
    };
  }
  return {
    deploy: true,
    reason: `${relevant.length} runtime path(s), e.g. ${relevant.slice(0, 3).join(", ")}`,
  };
}

/** Pure. The gates before the diff: force, then the missing-baseline fail-open. `null` = classify. */
export function decide({ force, deployedSha }) {
  if (force) return { deploy: true, reason: "forced" };
  if (!deployedSha) {
    return {
      deploy: true,
      reason:
        "no GIT_SHA baseline on the dashboard machine (first deploy, a rollback, or unreadable)",
    };
  }
  return null;
}

if (process.argv[1]?.endsWith("dashboard-deploy-preflight.mjs")) {
  let verdict;
  try {
    if (process.argv[2] === "--classify") {
      verdict = classify(readFileSync(0, "utf8").split("\n").filter(Boolean));
    } else {
      const deployedSha = process.env.DEPLOYED_SHA || "";
      const headSha = process.env.HEAD_SHA || "";
      verdict = decide({ force: process.env.FORCE === "true", deployedSha });
      if (!verdict) {
        if (!headSha) throw new Error("HEAD_SHA unset");
        const out = execFileSync("git", ["diff", "--name-only", `${deployedSha}..${headSha}`], {
          encoding: "utf8",
        });
        const c = classify(out.split("\n").filter(Boolean));
        verdict = { deploy: c.deploy, reason: `${c.reason} (since ${deployedSha.slice(0, 7)})` };
      }
    }
  } catch (error) {
    // Fail OPEN: when a push cannot be proven image-irrelevant, deploy it.
    verdict = { deploy: true, reason: `fail-open: ${String(error).split("\n")[0]}` };
  }
  console.log(verdict.deploy ? "deploy" : "skip");
  console.log(verdict.reason);
}
