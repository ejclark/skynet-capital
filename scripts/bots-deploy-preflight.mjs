#!/usr/bin/env node
// The bots-app deploy preflight decision — extracted out of pipeline.yml's `run:` block (#933
// follow-up). moneypenny-repair.yml's own header names exactly this failure mode: "Logic in `run:`
// blocks is what caused the failure this lane exists to catch." This was the last piece of
// meaningful go/skip decision-making still living inline and untested; the git-diff classification
// half was already extracted (scripts/bot-relevant.mjs) — this covers the token/cutover/force/
// baseline checks that used to gate it.
//
// Pure decision tree in `decide()`; the CLI entrypoint below does the two genuinely environmental
// lookups (fly.toml's cutover flag, git diff against the deployed SHA) and nothing else.
//
// CLI contract (shell-friendly, ALWAYS exit 0 — a preflight crash must never break the pipeline):
//   node scripts/bots-deploy-preflight.mjs
// reads env FLY_API_TOKEN, FORCE ('true'/'false'), DEPLOYED_SHA (may be empty), HEAD_SHA, and
// fly.toml from the cwd; prints exactly two lines (`deploy`/`skip`, then the one-line reason) —
// same shape as scripts/bot-relevant.mjs, so the workflow step's skip()/go() wiring is unchanged.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { classify } from "./bot-relevant.mjs";

// The 2026-08-26 incident's own number: 41 same-day merges restarted the bots machine ~every 15
// minutes and Sauron never accumulated enough signal history to trade. That incident was caused
// by every dashboard merge triggering this app's deploy; the split (this preflight + bot-relevant
// classification) fixed the SOURCE, but a second source of high-frequency bot-relevant merges (the
// automated research lane touching src/domain/market-events-data.ts every 2-3 minutes) reintroduced
// the same restart-cadence failure mode through a different door. This debounce is the general
// fix: no matter how many legitimately bot-relevant merges land, the bots app redeploys at most
// once per window — the next preflight past the cooldown always sees the full accumulated diff via
// `classify()`, so nothing is ever silently dropped, only batched.
export const BOTS_DEPLOY_DEBOUNCE_MS = 15 * 60 * 1000;

/**
 * Pure. The token/cutover/force/baseline/debounce gates, in priority order. Returns a verdict
 * once one gate decides the outcome, or `null` when none of them do and the caller must fall
 * through to classifying the actual diff against `deployedSha`.
 */
export function decide({ hasToken, cutoverPending, force, deployedSha, deployedAtMs, nowMs }) {
  if (!hasToken) {
    return {
      deploy: false,
      reason:
        "no bots-app Fly token (FLY_API_TOKEN_BOTS or FLY_ORG_TOKEN) — see docs/AUTONOMY-DEPLOY.md",
    };
  }
  if (cutoverPending) {
    return { deploy: false, reason: "pre-cutover: fly.toml still owns the bots process group" };
  }
  if (force) {
    return { deploy: true, reason: "force_bots_deploy dispatch" };
  }
  if (!deployedSha) {
    return {
      deploy: true,
      reason: "no GIT_SHA baseline on the bots machine (first deploy, or a manual one)",
    };
  }
  if (typeof deployedAtMs === "number" && typeof nowMs === "number") {
    const sinceMs = nowMs - deployedAtMs;
    // A negative gap (clock skew, or a bogus timestamp) fails open rather than debouncing forever.
    if (sinceMs >= 0 && sinceMs < BOTS_DEPLOY_DEBOUNCE_MS) {
      const minAgo = Math.round(sinceMs / 60_000);
      const windowMin = BOTS_DEPLOY_DEBOUNCE_MS / 60_000;
      return {
        deploy: false,
        reason: `debounced: last bots deploy ${minAgo}m ago, under the ${windowMin}m cooldown — the next preflight past it will pick up everything accumulated`,
      };
    }
  }
  return null;
}

/** Pure. True when fly.toml still declares the `bots` process group (pre-cutover). */
export function cutoverPendingFromToml(tomlText) {
  return /^\s*bots\s*=/m.test(tomlText);
}

/**
 * Pure. The `[mounts] source` volume names fly.bots.toml declares that `flyctl volumes list --json`
 * does NOT show. 2026-09-04: #1264 added the `skynet_bots_data` mount before the volume existed,
 * and every one of the next 16 merges to main went red on `flyctl deploy` ("needs volumes with
 * name 'skynet_bots_data'") — 16 incidents, 16 repair dispatches, one root cause a preflight could
 * have named in a single line. A missing volume is a `skip` with the exact `fly volume create`
 * command, never a red run; `scripts/deploy-lag.mjs` keeps the bots-lag baseline honest meanwhile.
 */
export function missingVolumes(botsTomlText, volumesJson) {
  const declared = [...botsTomlText.matchAll(/^\s*source\s*=\s*"([^"]+)"/gm)].map((m) => m[1]);
  let present = [];
  try {
    present = (JSON.parse(volumesJson || "[]") ?? []).map((v) => v.name ?? v.Name).filter(Boolean);
  } catch {
    return []; // unreadable listing — fail open, the deploy step reports its own error
  }
  return declared.filter((name) => !present.includes(name));
}

/** The app name fly.bots.toml deploys to — `app = "..."` — or null when the file has none. */
export function botsAppFromToml(botsTomlText) {
  return botsTomlText.match(/^\s*app\s*=\s*"([^"]+)"/m)?.[1] ?? null;
}

if (process.argv[1]?.endsWith("bots-deploy-preflight.mjs")) {
  const hasToken = Boolean(process.env.FLY_API_TOKEN);
  const force = process.env.FORCE === "true";
  const deployedSha = process.env.DEPLOYED_SHA || "";
  const headSha = process.env.HEAD_SHA || "";
  // Empty/unparseable DEPLOYED_AT (older machine, or the field ever renames) fails open — no
  // debounce rather than a crash. NOW_MS override exists for the spec, same reasoning as
  // FLY_TOML_PATH below; the real caller never sets it and gets the actual clock.
  const deployedAtMs = process.env.DEPLOYED_AT ? Date.parse(process.env.DEPLOYED_AT) : Number.NaN;
  const nowMs = process.env.NOW_MS ? Number(process.env.NOW_MS) : Date.now();
  // FLY_TOML_PATH override exists for the spec (a temp fixture, never the real fly.toml) — the
  // real caller never sets it and gets the actual file.
  const tomlPath = process.env.FLY_TOML_PATH || "fly.toml";
  const tomlText = existsSync(tomlPath) ? readFileSync(tomlPath, "utf8") : "";
  const cutoverPending = cutoverPendingFromToml(tomlText);

  let verdict = decide({
    hasToken,
    cutoverPending,
    force,
    deployedSha,
    deployedAtMs: Number.isFinite(deployedAtMs) ? deployedAtMs : undefined,
    nowMs,
  });
  if (!verdict) {
    const since = `since ${deployedSha}`;
    try {
      const out = execFileSync("git", ["diff", "--name-only", `${deployedSha}..${headSha}`], {
        encoding: "utf8",
      });
      const c = classify(out.split("\n").filter(Boolean));
      verdict = { deploy: c.deploy, reason: `${c.reason} (${since})` };
    } catch (err) {
      verdict = {
        deploy: true,
        reason: `classify failed, failing open: ${err.message} (${since})`,
      };
    }
  }

  // The volume gate runs last and only on a would-deploy verdict: a deploy that Fly will refuse for
  // a missing volume is a skip with the fix spelled out, not a red run. BOTS_TOML_PATH and
  // VOLUMES_JSON are spec overrides; the real caller reads fly.bots.toml and asks flyctl.
  if (verdict.deploy && hasToken) {
    const botsToml = process.env.BOTS_TOML_PATH || "fly.bots.toml";
    const botsTomlText = existsSync(botsToml) ? readFileSync(botsToml, "utf8") : "";
    const app = botsAppFromToml(botsTomlText);
    let volumesJson = process.env.VOLUMES_JSON;
    if (volumesJson === undefined && app) {
      try {
        volumesJson = execFileSync("flyctl", ["volumes", "list", "-a", app, "--json"], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        });
      } catch {
        volumesJson = undefined; // flyctl unavailable — fail open, never block on the check itself
      }
    }
    const missing = volumesJson === undefined ? [] : missingVolumes(botsTomlText, volumesJson);
    if (missing.length > 0) {
      verdict = {
        deploy: false,
        reason:
          `volume(s) ${missing.join(", ")} declared in ${botsToml} do not exist on ${app} — ` +
          `run \`fly volume create ${missing[0]} -a ${app} -r ord -n 1\` (Eric's step); ` +
          "deploying now would fail on Fly's own mount check",
      };
    }
  }
  console.log(verdict.deploy ? "deploy" : "skip");
  console.log(verdict.reason);
}
