#!/usr/bin/env node
// Instruction-drift due scan: the item list for docs/grind/instruction-drift.instructions.md, and
// the answer to "is a run owed?".
//
// WHY (#5318): the 2026-10-04 prompt audit confirmed 237 findings in the instruction files, and 96%
// were drift rather than prompting written for older models: files that disagree, stale facts,
// rules written as history. doc-rot-scan.mjs catches the mechanical slice (dead paths, npm names);
// the rest needs a model to read. A week touches a few dozen of the ~190 files, so reading all of
// them weekly is waste. This scan keeps a stamp, the commit the last run read through, and lists
// only the instruction files changed since it. The scope is scripts/instructions/scope.mjs, less
// its do-not-edit set (generated pages, Eric's verbatim rounds): the chore rewrites what it
// reads, so those come back in `readOnly`, never as items.
//
//   node scripts/instruction-drift-scan.mjs              # report: the stamp, what changed, due?
//   node scripts/instruction-drift-scan.mjs --json       # machine shape; `items` is the grind list
//   node scripts/instruction-drift-scan.mjs --due        # exit 1 when a run is owed, 0 when not
//   node scripts/instruction-drift-scan.mjs --release    # a model release: every file is an item
//   node scripts/instruction-drift-scan.mjs --scope      # every file the chore may edit, one per line
//   node scripts/instruction-drift-scan.mjs --record --at <the scan's at>   # after a run: stamp it
//   ... --at <ref>             the commit the run reads (default origin/main); --record requires it
//   ... --today <YYYY-MM-DD>   deterministic date (specs)
//
// DUE: an instruction file changed since the stamp AND the stamp is 7 or more days old (>=, so a
// weekly trigger never skips its own week), or --release, which owes a full run regardless. The
// stamp's date is the stamped commit's own (UTC), never the day --record runs: a wave that records
// a day late would otherwise push the next weekly run back a whole week.
//
// ITEMS: one per changed file, except a skill's files (.claude/skills/<name>/), which ride together
// at most 6 to an item because a skill and its reference cards are read as one; a chunk without the
// skill's SKILL.md carries it in `context`, read alongside. An item with a file
// envelope.json protects comes back in `protectedItems` instead: grind's step 0 would block it, and
// its fix boards the platter.
//
// --record requires --at, so the stamp is the commit the run read and not whatever origin/main has
// moved to since (every file that changed in between would never be read). It refuses a commit
// that is not on origin/main: a branch commit is orphaned by the squash merge, and every later scan
// would read UNKNOWN.
//
// Exit codes: 0 report printed, or not due · 1 due (with --due) · 2 usage error · 3 UNKNOWN: the
// stamp is missing or malformed, names a commit this checkout cannot reach (a shallow fetch, a
// rewritten history) or one that is not an ancestor of --at, or envelope.json is unreadable. Never
// a quiet "nothing changed": deepen the fetch, or pass --release for a full run.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { breachOf } from "./envelope-scan.mjs";
import { doNotEditReason, instructionFiles } from "./instructions/scope.mjs";

const ROOT = process.cwd();
const STAMP_FILE = "instruction-drift-stamp.json";
const DUE_DAYS = 7;
const GROUP_MAX = 6;
const BRANCH_PREFIX = "docs/instruction-drift";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FLAGS = new Set(["--json", "--due", "--release", "--scope", "--record", "--at", "--today"]);
const STAMP_COMMENT =
  "The commit the last instruction-drift run read through (docs/grind/instruction-drift.instructions.md). Written only by `node scripts/instruction-drift-scan.mjs --record`; the next run reads the instruction files changed since `commit`.";

// ---- pure (specced directly) ----------------------------------------------------------------------

/** Whole days from one YYYY-MM-DD to another, in UTC. */
const daysBetween = (from, to) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/** Read the stamp file's text: `{stamp}` when it is usable, `{problem}` naming why not. */
export function parseStamp(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { problem: `${STAMP_FILE} is not valid JSON` };
  }
  const { commit, date, run = "incremental" } = raw ?? {};
  if (typeof commit !== "string" || !/^[0-9a-f]{7,40}$/.test(commit)) {
    return { problem: `${STAMP_FILE} has no commit sha` };
  }
  if (typeof date !== "string" || !DATE_RE.test(date) || Number.isNaN(Date.parse(date))) {
    return { problem: `${STAMP_FILE} has no YYYY-MM-DD date` };
  }
  if (!["full", "incremental"].includes(run)) {
    return { problem: `${STAMP_FILE} run is "${run}", not full or incremental` };
  }
  return { stamp: { commit, date, run } };
}

/** Is a run owed? `changed` counts in-scope files changed since the stamp. */
export function dueVerdict({ changed, daysSince, release = false }) {
  if (release) return { due: true, reason: "release" };
  if (changed === 0) return { due: false, reason: "unchanged" };
  if (daysSince >= DUE_DAYS) return { due: true, reason: "changed" };
  return { due: false, reason: "fresh" };
}

const slugOf = (label) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Split instruction files into the ones a rewrite may touch and the do-not-edit ones, with why. */
export function splitReadOnly(paths) {
  const editable = [];
  const readOnly = [];
  for (const path of paths) {
    const why = doNotEditReason(path);
    if (why) readOnly.push({ path, why });
    else editable.push(path);
  }
  return { editable, readOnly };
}

/**
 * Group changed instruction files into grind items, each with the branch its chain pushes to.
 * `at7` (the short sha the run reads) keeps a later run of the same file off an older branch.
 * A skill chunk that does not hold the skill's SKILL.md carries it in `context`, so its cards are
 * read against the skill they serve; it is not one of the item's files.
 */
export function groupItems(paths, at7) {
  const groups = new Map();
  for (const path of [...paths].sort()) {
    const skill = path.match(/^(\.claude\/skills\/[^/]+)\//);
    const key = skill ? skill[1] : path;
    groups.set(key, [...(groups.get(key) ?? []), path]);
  }
  const items = [];
  const slugs = new Set();
  for (const [key, files] of groups) {
    const chunks = Math.ceil(files.length / GROUP_MAX);
    for (let i = 0; i < chunks; i += 1) {
      const label = chunks > 1 ? `${key} (${i + 1}/${chunks})` : key;
      let slug = slugOf(label);
      for (let n = 2; slugs.has(slug); n += 1) slug = `${slugOf(label)}-${n}`;
      slugs.add(slug);
      const chunk = files.slice(i * GROUP_MAX, (i + 1) * GROUP_MAX);
      const item = { label, files: chunk, branch: `${BRANCH_PREFIX}-${at7}-${slug}` };
      const skillDoc = key.startsWith(".claude/skills/") ? `${key}/SKILL.md` : null;
      if (skillDoc && !chunk.includes(skillDoc)) item.context = [skillDoc];
      items.push(item);
    }
  }
  return items;
}

/** Split items into grind's and the platter's: an item with any protected file is the platter's. */
export function splitProtected(items, protectedRules) {
  const open = [];
  const held = [];
  for (const item of items) {
    const rule = item.files.map((f) => breachOf(f, protectedRules)).find(Boolean);
    if (rule) held.push({ ...item, pattern: rule.pattern });
    else open.push(item);
  }
  return { items: open, protectedItems: held };
}

// ---- git + files (the CLI) ------------------------------------------------------------------------

function git(args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}
function tryGit(args) {
  try {
    return git(args).trim();
  } catch {
    return null;
  }
}
const nulList = (out) => out.split("\0").filter(Boolean);

function usage(message) {
  console.error(`✗ instruction-drift-scan: ${message}`);
  process.exit(2);
}

function parseArgs(argv) {
  const argOf = (name) => {
    const eq = argv.find((a) => a.startsWith(`--${name}=`));
    if (eq) return eq.slice(name.length + 3);
    const i = argv.indexOf(`--${name}`);
    if (i === -1) return undefined;
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) usage(`--${name} needs a value`);
    return value;
  };
  const at = argOf("at");
  const values = new Set([at, argOf("today")].filter(Boolean));
  for (const a of argv) {
    const known = FLAGS.has(a.split("=")[0]) || values.has(a);
    if (!known) usage(`unknown argument "${a}"`);
  }
  const today = argOf("today") ?? new Date().toISOString().slice(0, 10);
  if (!DATE_RE.test(today)) usage("--today must be YYYY-MM-DD");
  const record = argv.includes("--record");
  if (record && !at) {
    usage(
      "--record needs --at <the scan's at>: stamp the commit the run read, not where origin/main is now",
    );
  }
  return {
    at: at ?? "origin/main",
    today,
    json: argv.includes("--json"),
    due: argv.includes("--due"),
    release: argv.includes("--release"),
    scope: argv.includes("--scope"),
    record,
  };
}

/** envelope.json's protected rules, or `{problem}`: without them no item can be called open. */
function readProtectedRules() {
  try {
    const rules = JSON.parse(readFileSync(join(ROOT, "envelope.json"), "utf8")).protected;
    if (!Array.isArray(rules)) return { problem: "envelope.json has no `protected` list" };
    return { rules };
  } catch {
    return {
      problem: "envelope.json is missing or unreadable — no item can be called unprotected",
    };
  }
}

function readStamp() {
  const file = join(ROOT, STAMP_FILE);
  if (!existsSync(file)) return { problem: `${STAMP_FILE} is missing — no run has been recorded` };
  return parseStamp(readFileSync(file, "utf8"));
}

/** Every in-scope instruction file in the tree at `sha`. */
const scopeAt = (sha) =>
  instructionFiles(nulList(git(["ls-tree", "-r", "-z", "--name-only", sha])));

/** A commit's own date, YYYY-MM-DD in UTC (the clock the due check counts days on). */
const commitDate = (sha) =>
  new Date(Number(git(["show", "-s", "--format=%ct", sha]).trim()) * 1000)
    .toISOString()
    .slice(0, 10);

/** The full scan state, or `{unknown}` naming the input it could not read. */
function scan({ at, release, today }) {
  const envelope = readProtectedRules();
  if (envelope.problem) return { unknown: envelope.problem };
  const sha = tryGit(["rev-parse", "--verify", "--quiet", `${at}^{commit}`]);
  if (!sha) return { unknown: `cannot resolve ${at} — not a git checkout, or no such commit here` };

  const stampRead = readStamp();
  const stamp = stampRead.stamp ?? null;
  let files;
  let commitsSince = null;
  let daysSince = null;
  if (release) {
    files = scopeAt(sha);
  } else {
    if (stampRead.problem) return { unknown: stampRead.problem };
    if (tryGit(["cat-file", "-e", `${stamp.commit}^{commit}`]) === null) {
      return {
        unknown: `the stamp ${stamp.commit.slice(0, 7)} is not reachable from this checkout (a shallow fetch, or a rewritten history)`,
      };
    }
    if (tryGit(["merge-base", "--is-ancestor", stamp.commit, sha]) === null) {
      return { unknown: `the stamp ${stamp.commit.slice(0, 7)} is not an ancestor of ${at}` };
    }
    const diff = git(["diff", "--name-only", "-z", "--diff-filter=d", "-M", stamp.commit, sha]);
    files = instructionFiles(nulList(diff));
    commitsSince = Number(git(["rev-list", "--count", `${stamp.commit}..${sha}`]).trim());
    daysSince = daysBetween(stamp.date, today);
  }
  const { editable, readOnly } = splitReadOnly(files);
  const verdict = dueVerdict({ changed: editable.length, daysSince, release });
  const split = splitProtected(groupItems(editable, sha.slice(0, 7)), envelope.rules);
  return {
    ...verdict,
    stamp,
    at: sha,
    commitsSince,
    daysSince,
    files: editable,
    readOnly,
    ...split,
  };
}

function record({ at, release }) {
  const sha = tryGit(["rev-parse", "--verify", "--quiet", `${at}^{commit}`]);
  if (!sha) usage(`cannot resolve --at ${at}`);
  const main = tryGit(["rev-parse", "--verify", "--quiet", "origin/main^{commit}"]);
  if (!main) usage("origin/main is not here — fetch it, so the stamp can be checked against it");
  if (tryGit(["merge-base", "--is-ancestor", sha, main]) === null) {
    usage(
      `${sha.slice(0, 7)} is not on origin/main — stamp the origin/main commit the run read (the scan's \`at\`); a branch commit is orphaned by the squash merge`,
    );
  }
  const run = release ? "full" : "incremental";
  const date = commitDate(sha);
  const body = { $comment: STAMP_COMMENT, commit: sha, date, run };
  writeFileSync(join(ROOT, STAMP_FILE), `${JSON.stringify(body, null, 2)}\n`);
  console.log(`✓ ${STAMP_FILE} → ${sha.slice(0, 7)} · ${date}, the commit's own date (${run} run)`);
}

function report(s, opts) {
  if (s.unknown) {
    console.error(`? instruction drift UNKNOWN — ${s.unknown}.`);
    console.error(
      "  Deepen the fetch, or pass --release for a full run over every instruction file.",
    );
    return;
  }
  const where = s.stamp
    ? `stamp ${s.stamp.commit.slice(0, 7)} · ${s.stamp.date} (${s.stamp.run} run)`
    : "no stamp";
  const behind = s.commitsSince === null ? "" : ` · ${s.commitsSince} commit(s), ${s.daysSince}d`;
  console.log("📜 Instruction-drift scan — instruction files changed since the last run");
  console.log(`  ${where}${behind} → ${opts.at} ${s.at.slice(0, 7)}`);
  const changed = `${s.files.length} ${opts.release ? "in scope (release: every one)" : "changed"}`;
  const held = s.readOnly.length ? ` · ${s.readOnly.length} do-not-edit, left out` : "";
  console.log(
    `  ${changed} → ${s.items.length} item(s) for grind · ${s.protectedItems.length} for the platter${held}`,
  );
  for (const item of [...s.items, ...s.protectedItems].slice(0, 20)) {
    const tail = item.pattern ? `  (protected: ${item.pattern})` : "";
    console.log(
      `    ${item.label}${item.files.length > 1 ? ` [${item.files.length}]` : ""}${tail}`,
    );
  }
  const total = s.items.length + s.protectedItems.length;
  if (total > 20) console.log(`    … and ${total - 20} more`);
  const why = {
    release: "a model release owes a full run",
    changed: `files changed and the stamp is ${s.daysSince}d old (owed at ${DUE_DAYS})`,
    fresh: `files changed, but the stamp is ${s.daysSince}d old (owed at ${DUE_DAYS})`,
    unchanged: "no instruction file changed since the stamp",
  }[s.reason];
  console.log(
    s.due
      ? `▶ DUE — ${why}. Chore: docs/grind/instruction-drift.instructions.md`
      : `· not due — ${why}.`,
  );
}

function main(argv) {
  const opts = parseArgs(argv);
  if (opts.record) return record(opts);
  if (opts.scope) {
    const sha = tryGit(["rev-parse", "--verify", "--quiet", `${opts.at}^{commit}`]);
    if (!sha) usage(`cannot resolve --at ${opts.at}`);
    console.log(splitReadOnly(scopeAt(sha)).editable.join("\n"));
    return;
  }
  const s = scan(opts);
  if (opts.json) {
    const shape = s.unknown ? { state: "unknown", unknown: s.unknown } : { state: "known", ...s };
    process.stdout.write(`${JSON.stringify(shape, null, 2)}\n`);
  } else {
    report(s, opts);
  }
  if (s.unknown) process.exit(3);
  if (opts.due && s.due) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
