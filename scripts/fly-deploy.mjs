#!/usr/bin/env node
// The one place that runs `flyctl deploy` — so the "is this failure Fly's network, or ours?"
// decision is a specced function instead of a bare `run:` line with no second chance.
//
// Provenance (run 37094550247, issue #4523). Six seconds into the release, on flyctl's FIRST
// Machines-API call, Fly closed the connection:
//
//     Error: Get "https://api.machines.dev/v1/apps/skynet-capital": EOF
//
// No build started, no release was created, nothing was mutated — a read-only app lookup lost its
// socket. `run: flyctl deploy --remote-only` has no retry, so that one closed socket failed the
// release and left `main` merged-but-undeployed until the next push happened to carry it.
//
// The house already holds this exact rule one lane over: `scripts/moneypenny/gh.mjs` retries
// GitHub's 5xx through `isTransientGhError`/`withRetry` because a gateway timeout is the service's
// problem, not a reason to abandon the work. Fly's deploy path had no equivalent. This is it.
//
// WHY RETRYING A DEPLOY IS SAFE. `flyctl deploy` is declarative: it builds (remote cache intact)
// and releases the same source or the same `--image`, so a second attempt converges on the state
// the first one wanted. The classifier is what keeps that true — it matches CONNECTION-level
// failures only (a closed socket, a reset, a 502/503/504, a handshake or i/o timeout). A build
// error, an auth refusal, a bad image reference or a failed health check carries none of those
// tokens, so it fails on the first attempt exactly as before. Notably there is no bare /timeout/
// pattern: a release whose health checks time out must NOT be re-flung at the cluster.
//
// CLI contract:
//   node scripts/fly-deploy.mjs [--remote-only | --config X | --image Y | ...]
// Arguments pass through to `flyctl deploy` verbatim. Child stdout/stderr stream to this process's
// own, so the Actions log reads the same as before. Exits with the child's own exit code once the
// attempts are spent — this is a gate, and a deploy that never happened must be red.
//
// Seams (env, so a spec can drive the real entrypoint):
//   FLY_DEPLOY_ATTEMPTS   total attempts, default 3
//   FLY_DEPLOY_BACKOFF_MS first sleep, doubling per retry, default 15000
//   FLYCTL_BIN            the binary, default "flyctl"
import { spawn } from "node:child_process";

/** Connection-level failures between flyctl and Fly's API — the class a second attempt fixes. */
const TRANSIENT = [
  /: EOF\b/, // the 2026-10-03 failure: server closed the socket before answering
  /unexpected EOF/i,
  /ECONNRESET|connection reset by peer/i,
  /connection refused/i,
  /i\/o timeout/i,
  /TLS handshake timeout/i,
  /context deadline exceeded/i,
  /EAI_AGAIN|temporary failure in name resolution/i,
  /\b(?:502|503|504)\b/,
  /Bad Gateway|Service Unavailable|Gateway Time-?out/i,
  /server closed idle connection|http2: (?:server sent GOAWAY|client connection lost)/i,
];

/**
 * Registry propagation lag (run 37476037256, #4796). The bots release reuses the image the
 * dashboard pushed ~60s earlier; flyctl's own API lookup answered `image found: img_…`, then the
 * machine's host got `MANIFEST_UNKNOWN` (404) pulling that same digest — eight times in 16s — while
 * the dashboard's machines already ran it and the identical pull had worked 17 minutes before.
 * A 404 on its own is also what a genuinely bad reference returns, so it only counts as transient
 * when Fly's API vouched for the image in the same attempt: a bad digest never prints `image found`
 * (flyctl stops at the lookup), so it still fails on the first attempt.
 */
function isRegistryLag(text) {
  return /MANIFEST_UNKNOWN/.test(text) && /\bimage found: img_/.test(text);
}

/** Pure. Is this flyctl output a transport failure (retry) rather than a real rejection (fail)? */
export function isTransientFlyError(text) {
  const haystack = String(text ?? "");
  return TRANSIENT.some((pattern) => pattern.test(haystack)) || isRegistryLag(haystack);
}

/** Pure. A positive integer from an env string, or `fallback` for anything else. */
export function positiveInt(raw, fallback) {
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One `flyctl deploy` attempt. Resolves `{ code, output }` — never rejects on a non-zero exit,
 * because a failed deploy is data this module decides about, not an exception to escape through.
 * Output is teed to our own streams and kept (last 64 KB) for the classifier.
 */
function attempt(bin, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, ["deploy", ...args], { stdio: ["inherit", "pipe", "pipe"] });
    let output = "";
    const tee = (chunk, sink) => {
      sink.write(chunk);
      output = (output + chunk).slice(-65536);
    };
    child.stdout.on("data", (chunk) => tee(chunk, process.stdout));
    child.stderr.on("data", (chunk) => tee(chunk, process.stderr));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });
}

/**
 * Run the deploy until it succeeds, a failure proves non-transient, or the attempts are spent.
 * Returns the exit code to leave with.
 */
export async function deployWithRetry({ bin, args, attempts, backoffMs, wait = sleep, log }) {
  for (let n = 1; ; n++) {
    const { code, output } = await attempt(bin, args);
    if (code === 0) return 0;
    if (n >= attempts || !isTransientFlyError(output)) {
      if (n > 1) log(`· fly deploy failed after ${n} attempts — exiting ${code}`);
      return code;
    }
    const delay = backoffMs * 2 ** (n - 1);
    log(
      `· fly deploy attempt ${n}/${attempts} hit a transient Fly API error — retrying in ${delay}ms`,
    );
    await wait(delay);
  }
}

if (process.argv[1]?.endsWith("fly-deploy.mjs")) {
  const code = await deployWithRetry({
    bin: process.env.FLYCTL_BIN || "flyctl",
    args: process.argv.slice(2),
    attempts: positiveInt(process.env.FLY_DEPLOY_ATTEMPTS, 3),
    backoffMs: positiveInt(process.env.FLY_DEPLOY_BACKOFF_MS, 15000),
    log: (line) => console.error(line),
  });
  process.exit(code);
}
