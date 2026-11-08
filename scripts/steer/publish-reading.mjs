#!/usr/bin/env node
import { isMain } from "../is-main.mjs";
// A touch point publishes the week's reading (#6470).
//
//   npm run steer:reading -- --used 34 --resets-at 2026-11-03T05:00:00Z [--read-at ISO] [--dry-run]
//
// `get_usage` works only in a session, so a person's touch point is the one thing today that can tell
// the repo the number. This writes it to #4153's body under its hidden marker, and nothing else: it
// never touches a label, so it cannot move the dial. Refuses a number it cannot believe rather than
// publishing it, because the page and the title would print it as fresh.
import { ensureGhToken, sh } from "../moneypenny/gh.mjs";
import { withReading } from "../moneypenny/pace-reading.mjs";
import { loadWorkModeConfig } from "../moneypenny/work-mode.mjs";

/** Reads the body, puts the reading in, writes it back. Returns the new body. */
export function publishReading({
  used,
  resetsAt,
  readAt = Date.now(),
  source = "get_usage",
  dryRun = false,
  exec = sh,
  trackingIssue = loadWorkModeConfig().trackingIssue,
}) {
  if (!(Number.isFinite(used) && used >= 0 && used <= 100))
    throw new Error(`steer/publish-reading: --used must be a percent from 0 to 100, got ${used}`);
  if (!(Number.isFinite(resetsAt) && Number.isFinite(readAt)))
    throw new Error("steer/publish-reading: --resets-at and --read-at must be times");
  if (resetsAt <= readAt)
    throw new Error("steer/publish-reading: the reset is not after the reading; check the values");
  const path = `repos/{owner}/{repo}/issues/${trackingIssue}`;
  const body = String(exec("gh", ["api", path, "--jq", '.body // ""']));
  const next = withReading(body, { used, at: readAt, resetsAt, source });
  if (!dryRun) exec("gh", ["api", "-X", "PATCH", path, "-f", `body=${next}`]);
  return next;
}

const flagValue = (argv, flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};

function main(argv) {
  ensureGhToken();
  const readAt = flagValue(argv, "--read-at");
  const dryRun = argv.includes("--dry-run");
  const next = publishReading({
    used: Number(flagValue(argv, "--used")),
    resetsAt: Date.parse(flagValue(argv, "--resets-at") ?? ""),
    readAt: readAt ? Date.parse(readAt) : Date.now(),
    dryRun,
  });
  console.log(dryRun ? next : "steer/publish-reading: published on the dial's issue");
}

if (isMain(import.meta.url)) main(process.argv.slice(2));
