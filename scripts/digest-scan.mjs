#!/usr/bin/env node
// Digest scan — the eye behind the secretary's activity digest (.claude/skills/secretary).
//
// Answers one question deterministically: is a digest DUE — enough autonomous change has landed
// on main since the last digest (threshold), too long has passed (heartbeat), or main has gone
// quiet while work sits waiting (quiet-with-work)? The volume math lives here so the daily digest
// Routine stays a thin clock (same doctrine as event-scan.mjs: the scan is the contract, the
// Routine is just the schedule).
//
//   node scripts/digest-scan.mjs               # human report
//   node scripts/digest-scan.mjs --due         # JSON {due, reason, ...} (due:false = no-op)
//   node scripts/digest-scan.mjs --validate    # digest docs satisfy the template contract
//   node scripts/digest-scan.mjs --needs-you   # the "Needs you" list, from the assignment query
//   node scripts/digest-scan.mjs --learning    # the unlearned-incident line for "Noise absorbed"
//   node scripts/digest-scan.mjs --stuck       # the green-but-not-merging PR line (stuck-pr-scan.mjs)
//   ... --today=YYYY-MM-DD                     # deterministic date override for tests
//   ... --now=<ISO instant>                    # deterministic clock for the quiet rule (tests)
//
// QUIET WITH WORK WAITING (#6470). Every lane here is woken by a repository event, so when pushes,
// issue events and freed build slots all stop, the lanes stop with them and nothing says so: main
// sat 75.8h from 2026-10-27T13:37Z with research due, the lane workflow ran zero times of any kind
// for 75.2h of it, and the two rules above both read "nothing to report" (2 commits, 3 days). The
// daily Routine's push notification is the one armed channel that reaches his phone without a
// merge, so this is where the silence becomes visible: main quiet `QUIET_HOURS` with something the
// sweep would start (a `ready` issue the pull rule admits) or research the event scan says is due.
// Quiet with NOTHING waiting is not a reason — a quiet weekend is not a failure. The waiting read
// is made only once the quiet threshold is crossed, so an ordinary day costs no GitHub call, and a
// read that fails is said as unknown, never counted as due or as nothing.
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
import { pullable } from "./moneypenny/labels.mjs";
import { stuckLine } from "./stuck-pr-decide.mjs";

const ROOT = process.cwd();
const DIGEST_DIR = join(ROOT, "docs", "digests");

// A digest is due at either edge: enough landed change to summarize, or long enough silent that
// the heartbeat owes Eric a line. Constants, not config — tune here, on the record.
const COMMIT_THRESHOLD = 5;
const HEARTBEAT_DAYS = 7;
// The third edge: main quiet this long WITH work waiting. A day, not a night: the 14–18h overnight
// gaps on record (10-15 to 11-01, 7 of 10 gaps over 12h) are the ordinary shape of a repo whose
// lanes stop when he does, and a line on each would be the ten-thousand-cuts failure; 24h is a
// full day of lanes idle beside admissible work, which no reading of "waiting for him" explains.
// It would have fired on 2026-10-29's 12:00 tick, 46h into the 75.8h gap, instead of never.
export const QUIET_HOURS = 24;

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

/** Hours since the newest commit on origin/main — the quiet clock. Missing ref throws, loud. */
function quietHoursOn(nowMs) {
  const newest = Date.parse(git(["log", "-1", "--format=%cI", "origin/main"]));
  return Math.round(((nowMs - newest) / 3_600_000) * 10) / 10;
}

/**
 * What counts as work waiting, pure: the open `ready` issues the pull rule would admit — the same
 * `pullable` the sweep and `/work-issues` read, so a parked (`PARKING_LABELS`) or started
 * (`in-progress`) issue never counts — and how many events `event-scan --due` lists. A `ready`
 * issue an open PR already names still counts here (the sweep's open-PR screen is a second REST
 * read this does not make); the line he gets names the issues, so a false count is one glance.
 */
export function waitingWork({ readyIssues = [], researchDue = 0 }) {
  const ready = readyIssues
    .filter((i) => pullable(i))
    .map(({ number, title }) => ({ number, title }));
  return { ready, researchDue };
}

/** The third due reason, pure: `quiet-with-work` or null. An unknown read (`waiting: null`) is never due. */
export function quietReason(quietHours, waiting) {
  if (quietHours < QUIET_HOURS || !waiting) return null;
  return waiting.ready.length || waiting.researchDue ? "quiet-with-work" : null;
}

/**
 * The waiting read, made only past the quiet threshold: one `gh issue list` (the sweep's own
 * `readOpenIssues` shape) and one local event scan for `today`. Soft on failure, by design: this
 * runs inside a claude.ai Routine whose `--due` answer is the whole contract, and a GitHub blip
 * must cost one "unknown" line — printed on stderr, carried in the JSON — not a crashed clock or
 * a silent "not due". Mirrors `learningLine`'s `unlearnedRuns: null`.
 */
function readWaitingWork(today) {
  try {
    const ready = JSON.parse(
      execFileSync(
        "gh",
        [
          "issue",
          "list",
          "--label",
          "ready",
          "--state",
          "open",
          "--limit",
          "200",
          "--json",
          "number,title,state,labels",
        ],
        { cwd: ROOT, encoding: "utf8" },
      ) || "[]",
    );
    const due = JSON.parse(
      execFileSync("node", [join(ROOT, "scripts/event-scan.mjs"), "--due", `--today=${today}`], {
        cwd: ROOT,
        encoding: "utf8",
      }) || "[]",
    );
    return { waiting: waitingWork({ readyIssues: ready, researchDue: due.length }), unknown: null };
  } catch (err) {
    const why = String(err?.stderr || err?.message || err)
      .trim()
      .slice(0, 200);
    console.error(`· work waiting unknown — ${why}`);
    return { waiting: null, unknown: why };
  }
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
export function learningLine({
  days = 14,
  openEntries = [],
  unlearnedRuns = null,
  agedOutRuns = null,
}) {
  const runs =
    unlearnedRuns === null
      ? `failed runs on main unknown (no GitHub read)`
      : `${unlearnedRuns} failed run(s) on main in ${days}d not yet in LESSONS`;
  // #5728: what left the window unlearned is named, so a falling count can't pass expiry as learning.
  const aged = agedOutRuns ? ` · ${agedOutRuns} aged out of the window unlearned` : "";
  const open = openEntries.length
    ? ` · ${openEntries.length} entry(ies) still STATUS: open (${openEntries.map((t) => `"${t.length > 60 ? `${t.slice(0, 59)}…` : t}"`).join(", ")})`
    : "";
  if (unlearnedRuns === 0 && !agedOutRuns && !openEntries.length) {
    return `- Learning: every failed run on main in ${days}d has a lesson; no open entries.`;
  }
  return `- Learning: ${runs}${aged}${open} — capsule closes draft their own entries (#4212).`;
}

/** The newest committed digest's date, or `null` when none exists yet. Exported because it is the
 *  window boundary every other since-the-last-digest report shares (comms-scan.mjs) — a second copy
 *  of this rule is a second answer to "since when". */
export function latestDigestDate() {
  const [latest] = digestFiles();
  return latest ? latest.slice(0, 10) : null;
}

function status(today, nowMs) {
  const [latest] = digestFiles();
  if (!latest) {
    return {
      due: true,
      reason: "no-digest",
      lastDigest: null,
      commitsSinceLast: null,
      commitsTruncated: false,
      daysSinceLast: null,
      quietHours: null,
      waiting: null,
      waitingUnknown: null,
    };
  }
  const lastDate = latest.slice(0, 10);
  const { count: commits, truncated } = commitsSince(lastDate);
  const days = daysBetween(lastDate, today);
  // The quiet clock is read always (git, free); the waiting read only past the threshold, and even
  // when another reason already fires — the digest then carries the quiet line as well.
  const quietHours = quietHoursOn(nowMs);
  const { waiting, unknown } =
    quietHours >= QUIET_HOURS ? readWaitingWork(today) : { waiting: null, unknown: null };
  const reason =
    commits >= COMMIT_THRESHOLD
      ? "threshold"
      : days >= HEARTBEAT_DAYS
        ? "heartbeat"
        : quietReason(quietHours, waiting);
  return {
    due: reason !== null,
    reason,
    lastDigest: lastDate,
    commitsSinceLast: commits,
    commitsTruncated: truncated,
    daysSinceLast: days,
    quietHours,
    waiting,
    waitingUnknown: unknown,
  };
}

/** The quiet clause of the human report: what the rule saw, in the words the digest line uses. */
function quietLine(s) {
  if (s.quietHours === null) return "";
  const base = ` · main quiet ${s.quietHours}h (quiet rule ${QUIET_HOURS}h with work waiting)`;
  if (s.quietHours < QUIET_HOURS) return base;
  if (!s.waiting) return `${base} — work waiting unknown: ${s.waitingUnknown}`;
  const ready = s.waiting.ready.map((i) => `#${i.number}`).join(" ") || "none";
  return `${base}: ready to start ${ready}, research due ${s.waiting.researchDue}`;
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
  const nowMs = arg("now") ? Date.parse(arg("now")) : Date.now();
  if (!Number.isFinite(nowMs)) throw new Error("digest-scan: --now must be an ISO instant.");
  const today = arg("today") ?? new Date(nowMs).toISOString().slice(0, 10);
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
  if (has("stuck")) {
    const out = execFileSync("node", [join(ROOT, "scripts/stuck-pr-scan.mjs"), "--count"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    console.log(stuckLine(JSON.parse(out).stuck));
    return;
  }
  if (has("needs-you")) {
    const { gather, plan } = await import("./moneypenny/assignments.mjs");
    console.log(needsYouLines(plan(gather())).join("\n"));
    return;
  }

  const s = status(today, nowMs);
  if (has("due")) {
    process.stdout.write(`${JSON.stringify(s, null, 2)}\n`);
    return;
  }

  const mark = s.due ? "▶" : "·";
  console.log(
    `${mark} last digest: ${s.lastDigest ?? "never"} · ${s.commitsTruncated ? "≥" : ""}` +
      `${s.commitsSinceLast ?? "?"} commit(s) since ` +
      `(threshold ${COMMIT_THRESHOLD}) · ${s.daysSinceLast ?? "?"}d elapsed (heartbeat ${HEARTBEAT_DAYS}d)` +
      `${quietLine(s)}${s.due ? ` — DUE (${s.reason}); run /secretary` : ""}`,
  );
}

// CLI only — comms-scan.mjs imports `latestDigestDate` and must not trigger a report.
if (import.meta.url === `file://${process.argv[1]}`) await main();
