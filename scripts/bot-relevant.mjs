#!/usr/bin/env node
// Which merges must redeploy the BOTS app? — the single source of truth for the deploy split.
//
// The bots process (skynet-capital-bots) carries in-memory trading state — momentum/sentiment
// windows, cooldown clocks, the SafetyController's daily-loss baseline — that every restart wipes.
// The split exists so frontend/docs merges stop restarting it (2026-08-26: 41 merges in one day
// restarted the bots machine ~every 15 minutes, and Sauron never accumulated enough signal history
// to place a single trade). This module decides which pushes still must.
//
// BIAS TO OVER-DEPLOY. The skip list names only paths that are PROVABLY outside the bots runtime:
// `tests/` and `.github/` never ship in the image (.dockerignore), and `docs/` + markdown are read
// only by the dashboard's /research route, never by the bots process. Everything else — all of
// src/ (shared modules like src/domain and src/alpaca included), package.json/package-lock.json,
// Dockerfile, scripts/, fly*.toml, .nvmrc — deploys bots. A false positive costs one redundant
// deploy; a false negative leaves the bots app running silently stale code against newer shared
// contracts, indefinitely. Widen this list only with proof, never for tidiness.
//
// Consumed by BOTH .github/workflows/pipeline.yml (the deploy-bots preflight) and
// scripts/deploy-lag.mjs (the bots-lag baseline) — one module, so the two can never drift the way
// the envelope prose once did.
//
// CLI contract (shell-friendly, ALWAYS exit 0 — a classifier crash must fail OPEN to deploying):
//   node scripts/bot-relevant.mjs <deployed-sha> <head-sha>   # diffs the two commits
//   node scripts/bot-relevant.mjs --classify                  # newline-separated paths on stdin
// prints exactly two lines: `deploy` or `skip`, then the one-line reason. Any error — unresolvable
// shas, git failure, empty args — prints `deploy` with the error as the reason. `--classify` is
// the spec channel (tests/scripts/bot-relevant.spec.ts drives the real entrypoint, the house
// pattern — no `.d.ts` invented for an `.mjs` module).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** True when this path can NEVER affect the bots runtime. Order: cheapest checks first. */
export function botsIrrelevant(path) {
  return (
    path.startsWith("docs/") ||
    path.startsWith("tests/") ||
    path.startsWith(".github/") ||
    path.endsWith(".md")
  );
}

/**
 * Pure. Classify a changed-path set: must the bots app redeploy?
 * An EMPTY set is a skip (nothing changed); an unknown/unreadable set is the CALLER's fail-open.
 */
export function classify(paths) {
  const relevant = paths.filter((p) => !botsIrrelevant(p));
  if (paths.length === 0) return { deploy: false, reason: "no changed paths" };
  if (relevant.length === 0) {
    return { deploy: false, reason: `all ${paths.length} path(s) are docs/tests/workflows` };
  }
  return {
    deploy: true,
    reason: `${relevant.length} bot-relevant path(s), e.g. ${relevant.slice(0, 3).join(", ")}`,
  };
}

if (process.argv[1]?.endsWith("bot-relevant.mjs")) {
  const [base, head] = process.argv.slice(2);
  let verdict;
  try {
    if (base === "--classify") {
      verdict = classify(readFileSync(0, "utf8").split("\n").filter(Boolean));
    } else {
      if (!(base && head)) throw new Error("usage: bot-relevant.mjs <deployed-sha> <head-sha>");
      const out = execFileSync("git", ["diff", "--name-only", `${base}..${head}`], {
        encoding: "utf8",
      });
      verdict = classify(out.split("\n").filter(Boolean));
    }
  } catch (error) {
    // Fail OPEN: when we can't prove a push is bots-irrelevant, deploy. A wrongly-skipped deploy
    // strands the bots app on stale code with no signal; a wrongly-run one costs minutes.
    verdict = { deploy: true, reason: `fail-open: ${String(error).split("\n")[0]}` };
  }
  console.log(verdict.deploy ? "deploy" : "skip");
  console.log(verdict.reason);
}
