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
//   node scripts/digest-scan.mjs --needs-you   # the "Needs you" list, from the assignment query
//   node scripts/digest-scan.mjs --learning    # the unlearned-incident line for "Noise absorbed"
//   ... --today=YYYY-MM-DD                     # deterministic date override for tests
//
// NEEDS YOU (#3818 criterion 12, #4293): the list is `plan().needsYou` from
// scripts/moneypenny/assignments.mjs — the same call the assignment dry run makes, never a second
// selector here. Imported lazily, so the importers of `digestFiles`/`latestDigestDate` (comms,
// rank, thrash) stay git-only; tests/scripts/moneypenny/needs-you.spec.ts fails on any divergence.
//
// LEARNING (#4212, #4056 slice 7): unlearned incidents are a count line under "Noise absorbed",
// never a Needs-you item — a repair capsule's close drafts its own ledger entry
// (scripts/moneypenny/lesson-draft.mjs), so draining them is the system's job, not Eric's. The
// 2026-10-05 digest listed "run /retro" as Needs-you item 7; this line is where that goes instead.
//
// Enforced in CI via tests/arch/digest-scan.spec.ts. Node built-ins + git (+ gh for --needs-you).
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
  // Optional: no directory means no digest yet — status() answers `due: true, reason: "no-digest"`,
  // which is loud, not a pass. main() names the absent directory when run as a CLI.
  if (!existsSync(DIGEST_DIR)) return [];
  return readdirSync(DIGEST_DIR)
    .filter((f) => f.endsWith(".md") && f !== "TEMPLATE.md" && f !== "README.md")
    .sort()
    .reverse();
}

const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

/** Commits landed on origin/main since a date — the autonomous-change volume signal.
 *  Squash-merge means one commit ≈ one landed PR. Missing ref throws — loud, never "not due".
 *  A shallow clone (sessions fetch 50) stops the walk at its graft: when every reachable commit
 *  is inside the window the true count is unknown above it, so it comes back `truncated` — a
 *  floor, printed `≥N` — never a silent 50 (#3818 slice 7). */
function commitsSince(date) {
  const count = Number.parseInt(
    git(["rev-list", "--count", `--since=${date}T23:59:59Z`, "origin/main"]),
    10,
  );
  const shallow = git(["rev-parse", "--is-shallow-repository"]) === "true";
  const truncated =
    shallow && count === Number.parseInt(git(["rev-list", "--count", "origin/main"]), 10);
  return { count, truncated };
}

/** The digest's "Needs you" list from `plan()` output: one line per item Eric holds. Pure. */
export function needsYouLines({ needsYou }) {
  if (!needsYou.length) return ["_Nothing is assigned to you._"];
  return needsYou.map(
    (n) =>
      `- #${n.number}${n.title ? ` ${n.title}` : ""} — ${n.criterion === 4 ? n.why : (n.decision ?? n.why)}`,
  );
}

/**
 * The "Noise absorbed" line for unlearned incidents, from `incident-scan.mjs --count`. Pure.
 * `unlearnedRuns: null` means the scan could not reach GitHub — said as unknown, never as zero.
 */
export function learningLine({ days = 14, openEntries = [], unlearnedRuns = null }) {
  const runs =
    unlearnedRuns === null
      ? `failed runs on main unknown (no GitHub read)`
      : `${unlearnedRuns} failed run(s) on main in ${days}d not yet in LESSONS`;
  const open = openEntries.length
    ? ` · ${openEntries.length} entry(ies) still STATUS: open (${openEntries.map((t) => `"${t.length > 60 ? `${t.slice(0, 59)}…` : t}"`).join(", ")})`
    : "";
  if (unlearnedRuns === 0 && !openEntries.length) {
    return `- Learning: every failed run on main in ${days}d has a lesson; no open entries.`;
  }
  return `- Learning: ${runs}${open} — capsule closes draft their own entries (#4212).`;
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
      commitsTruncated: false,
      daysSinceLast: null,
    };
  }
  const lastDate = latest.slice(0, 10);
  const { count: commits, truncated } = commitsSince(lastDate);
  const days = daysBetween(lastDate, today);
  const reason =
    commits >= COMMIT_THRESHOLD ? "threshold" : days >= HEARTBEAT_DAYS ? "heartbeat" : null;
  return {
    due: reason !== null,
    reason,
    lastDigest: lastDate,
    commitsSinceLast: commits,
    commitsTruncated: truncated,
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

async function main() {
  const today = arg("today") ?? new Date().toISOString().slice(0, 10);
  if (!DATE_RE.test(today)) throw new Error("digest-scan: --today must be YYYY-MM-DD.");
  if (!existsSync(DIGEST_DIR)) {
    // stderr under --due, whose stdout is the JSON the Routine parses.
    (has("due") ? console.error : console.log)(
      "· docs/digests/ absent — no digest yet; nothing to validate, next one is due (no-digest).",
    );
  }

  if (has("validate")) {
    validate();
    return;
  }
  if (has("learning")) {
    const out = execFileSync("node", [join(ROOT, "scripts/incident-scan.mjs"), "--count"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    console.log(learningLine(JSON.parse(out)));
    return;
  }
  if (has("needs-you")) {
    const { gather, plan } = await import("./moneypenny/assignments.mjs");
    console.log(needsYouLines(plan(gather())).join("\n"));
    return;
  }

  const s = status(today);
  if (has("due")) {
    process.stdout.write(`${JSON.stringify(s, null, 2)}\n`);
    return;
  }

  const mark = s.due ? "▶" : "·";
  console.log(
    `${mark} last digest: ${s.lastDigest ?? "never"} · ${s.commitsTruncated ? "≥" : ""}` +
      `${s.commitsSinceLast ?? "?"} commit(s) since ` +
      `(threshold ${COMMIT_THRESHOLD}) · ${s.daysSinceLast ?? "?"}d elapsed (heartbeat ${HEARTBEAT_DAYS}d)` +
      `${s.due ? ` — DUE (${s.reason}); run /secretary` : ""}`,
  );
}

// CLI only — comms-scan.mjs imports `latestDigestDate` and must not trigger a report.
if (import.meta.url === `file://${process.argv[1]}`) await main();
