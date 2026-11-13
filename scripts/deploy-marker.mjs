#!/usr/bin/env node
// DEPLOYMENT MARKER — records a production release in GitHub's own Deployments history.
//
//   node scripts/deploy-marker.mjs --env production --url https://skynet-capital.fly.dev \
//     --state success|failure [--description "<one line>"]
//
// WHY (Eric, 2026-11-13: "Add a deployment marker in GitHub for production when deployed"). A merge
// to main does not mean the app changed: the deploy preflight skips most pushes
// (scripts/dashboard-deploy-preflight.mjs, #4616), and a failed smoke rolls back. So "what is live,
// since when" lived only in Fly. A GitHub Deployment puts it on the repo page, on every commit and PR
// that shipped ("deployed to production"), and behind the Environments tab, with the run's log.
//
// WHY A STEP, NOT `environment:` ON THE JOB. An `environment:` key marks every run of the job, and
// the job runs on every push, deploying or not. This step runs only after a deploy passed its smoke
// test (`success`), or after a rollback (`failure`, so the history never shows a bad release as live).
//
// NEVER FAILS A DEPLOY. The marker is bookkeeping: a REST error prints a warning and exits 0. The
// deploy and the smoke test are the judges of a release, never this.
//
// Token: GITHUB_TOKEN (the job needs `deployments: write`). REST via curl, so HTTPS_PROXY holds.
import { isMain } from "./is-main.mjs";
import { sh } from "./moneypenny/gh.mjs";

// ─── pure core (specced in tests/scripts/deploy-marker.spec.ts) ───────────────────────────────────

/** The deployment to create: this commit, to this environment, with no merge or status gate. */
export function deploymentRequest({ sha, environment, description = "" }) {
  if (!/^[0-9a-f]{7,40}$/.test(String(sha ?? ""))) throw new Error(`not a commit sha: ${sha}`);
  if (!environment) throw new Error("no environment");
  return {
    ref: sha,
    environment,
    description: description.slice(0, 140),
    // The commit already passed the gates that matter (branch protection, smoke). GitHub would
    // otherwise refuse with 409 on a commit whose status contexts are not all green, or try to
    // merge the default branch into it.
    auto_merge: false,
    required_contexts: [],
    production_environment: /^production/.test(environment),
    transient_environment: false,
  };
}

/** The status that makes it a marker: success shows it live, failure records a rolled-back release. */
export function statusRequest({ state, url = "", logUrl = "", description = "" }) {
  if (!["success", "failure"].includes(state))
    throw new Error(`state must be success or failure: ${state}`);
  return {
    state,
    ...(url ? { environment_url: url } : {}),
    ...(logUrl ? { log_url: logUrl } : {}),
    description: description.slice(0, 140),
    // A new success makes the previous one in this environment inactive, so only one reads "live".
    auto_inactive: true,
  };
}

/** Parse `--flag value` pairs. */
export function parseArgs(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    environment: get("--env") ?? "production",
    url: get("--url") ?? "",
    state: get("--state") ?? "success",
    description: get("--description") ?? "",
  };
}

// ─── IO ───────────────────────────────────────────────────────────────────────────────────────────

function post(path, payload) {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";
  const repo = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";
  const out = sh(
    "curl",
    [
      "-sS",
      "--fail-with-body",
      "-X",
      "POST",
      "-H",
      `Authorization: Bearer ${token}`,
      "-H",
      "Accept: application/vnd.github+json",
      "-H",
      "User-Agent: skynet-deploy-marker",
      "-H",
      "Content-Type: application/json",
      "--data-binary",
      "@-",
      `https://api.github.com/repos/${repo}/${path}`,
    ],
    { input: JSON.stringify(payload) },
  );
  return JSON.parse(out);
}

function main(argv) {
  const args = parseArgs(argv);
  const sha = process.env.GITHUB_SHA ?? "";
  const server = process.env.GITHUB_SERVER_URL ?? "https://github.com";
  const logUrl = process.env.GITHUB_RUN_ID
    ? `${server}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : "";
  try {
    const deployment = post(
      "deployments",
      deploymentRequest({ sha, environment: args.environment, description: args.description }),
    );
    post(`deployments/${deployment.id}/statuses`, statusRequest({ ...args, logUrl }));
    console.log(`deploy-marker: ${args.environment} ← ${sha.slice(0, 7)} (${args.state})`);
  } catch (err) {
    console.log(
      `::warning::deploy marker not recorded for ${args.environment}: ${String(err?.stderr || err?.message).slice(0, 200)}`,
    );
  }
  return 0;
}

if (isMain(import.meta.url)) process.exit(main(process.argv.slice(2)));
