#!/usr/bin/env node
// Digest scan — the eye behind the secretary's activity digest (.claude/skills/secretary).
//
// Answers one question deterministically: is a digest DUE — enough autonomous change has landed
// on main since the last digest (threshold), or too long has passed (heartbeat)? The volume math
// lives here so the daily digest Routine stays a thin clock (same doctrine as event-scan.mjs:
// the scan is the contract, the Routine is just the schedule).
//
//   node scripts/digest-scan.mjs               # human report
//   node scripts/digest-scan.mjs --due         # JSON {due, reason, ...} (due:false = no-op)
//   node scripts/digest-scan.mjs --validate    # digest docs satisfy the template contract
//   ... --today=YYYY-MM-DD                     # deterministic date override for tests
//
// Enforced in CI via tests/arch/digest-scan.spec.ts. Dependency-free (node built-ins + git).
// Loud-failure doctrine: an unreadable input or missing git ref is an error, never "not due".
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DIGEST_DIR = join(ROOT, "docs", "digests");

// A digest is due at either edge: enough landed change to summarize, or long enough silent that
// the heartbeat owes Eric a line. Constants, not config — tune here, on the record.
const COMMIT_THRESHOLD = 5;
const HEARTBEAT_DAYS = 7;

const REQUIRED_SECTIONS = ["## Needs you", "## Headlines", "## Noise absorbed"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const has = (name) => process.argv.includes(`--${name}`);

const daysBetween = (fromDate, toDate) =>
  Math.round(
    (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86_400_000,
  );

/** Committed digests, newest first — filename IS the date (YYYY-MM-DD.md). */
export function digestFiles() {
  if (!existsSync(DIGEST_DIR)) return [];
  return readdirSync(DIGEST_DIR)
    .filter((f) => f.endsWith(".md") && f !== "TEMPLATE.md" && f !== "README.md")
    .sort()
    .reverse();
}

/** Commits landed on origin/main since a date — the autonomous-change volume signal.
 *  Squash-merge means one commit ≈ one landed PR. Missing ref throws — loud, never "not due". */
function commitsSince(date) {
  const out = execFileSync(
    "git",
    ["rev-list", "--count", `--since=${date}T23:59:59Z`, "origin/main"],
    { cwd: ROOT, encoding: "utf8" },
  );
  return Number.parseInt(out.trim(), 10);
}

/** The newest committed digest's date, or `null` when none exists yet. Exported because it is the
 *  window boundary every other since-the-last-digest report shares (comms-scan.mjs) — a second copy
 *  of this rule is a second answer to "since when". */
export function latestDigestDate() {
  const [latest] = digestFiles();
  return latest ? latest.slice(0, 10) : null;
}

function status(today) {
  const [latest] = digestFiles();
  if (!latest) {
    return {
      due: true,
      reason: "no-digest",
      lastDigest: null,
      commitsSinceLast: null,
      daysSinceLast: null,
    };
  }
  const lastDate = latest.slice(0, 10);
  const commits = commitsSince(lastDate);
  const days = daysBetween(lastDate, today);
  const reason =
    commits >= COMMIT_THRESHOLD ? "threshold" : days >= HEARTBEAT_DAYS ? "heartbeat" : null;
  return {
    due: reason !== null,
    reason,
    lastDigest: lastDate,
    commitsSinceLast: commits,
    daysSinceLast: days,
  };
}

function validate() {
  const problems = [];
  for (const f of digestFiles()) {
    const name = f.slice(0, -3);
    if (!DATE_RE.test(name)) problems.push(`docs/digests/${f}: filename must be YYYY-MM-DD.md`);
    const text = readFileSync(join(DIGEST_DIR, f), "utf8");
    for (const section of REQUIRED_SECTIONS) {
      if (!text.includes(section)) problems.push(`docs/digests/${f}: missing "${section}"`);
    }
  }
  for (const p of problems) console.error(`✗ ${p}`);
  if (problems.length) {
    console.error(
      `\n${problems.length} digest(s) fail the template contract (docs/digests/TEMPLATE.md).`,
    );
    process.exit(1);
  }
  console.log(`✓ ${digestFiles().length} digest(s) satisfy the contract.`);
}

function main() {
  const today = arg("today") ?? new Date().toISOString().slice(0, 10);
  if (!DATE_RE.test(today)) throw new Error("digest-scan: --today must be YYYY-MM-DD.");

  if (has("validate")) {
    validate();
    return;
  }

  const s = status(today);
  if (has("due")) {
    process.stdout.write(`${JSON.stringify(s, null, 2)}\n`);
    return;
  }

  const mark = s.due ? "▶" : "·";
  console.log(
    `${mark} last digest: ${s.lastDigest ?? "never"} · ${s.commitsSinceLast ?? "?"} commit(s) since ` +
      `(threshold ${COMMIT_THRESHOLD}) · ${s.daysSinceLast ?? "?"}d elapsed (heartbeat ${HEARTBEAT_DAYS}d)` +
      `${s.due ? ` — DUE (${s.reason}); run /secretary` : ""}`,
  );
}

// CLI only — comms-scan.mjs imports `latestDigestDate` and must not trigger a report.
if (import.meta.url === `file://${process.argv[1]}`) main();
