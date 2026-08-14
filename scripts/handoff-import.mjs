#!/usr/bin/env node
// Handoff import — one command from "a zip in Downloads" to "a branch pushed" (docs/HANDOFFS.md).
//
//   node scripts/handoff-import.mjs ~/Downloads/desk-v2.zip
//   node scripts/handoff-import.mjs ~/Downloads/bundle.zip --slug desk-v2
//   node scripts/handoff-import.mjs ~/Downloads/desk-v2.zip --no-push   # stop before pushing
//
// Every step below exists because the manual version of it failed on 2026-08-14 (docs/LESSONS.md):
// the wrong clone was current, `git add` matched nothing and said so quietly, `git commit` refused an
// empty tree, and the branch pushed anyway carrying zero commits — so the bundle looked handed off
// and wasn't. The rule here is the opposite: **verify, then fail loudly.** Nothing about this script
// is allowed to succeed silently while doing nothing.
//
// Runs from anywhere — it locates the repo itself rather than trusting the current directory.
// Dependency-free: `unzip` and `git` only, both present on macOS out of the box.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const argv = process.argv.slice(2);
const die = (msg, fix) => {
  console.error(`\n✗ ${msg}`);
  if (fix) console.error(`\n  ${fix}`);
  console.error("");
  process.exit(1);
};

// Positional = the zip; everything else is a flag or a flag's value.
let slugFlag = null;
let noPush = false;
let zipArg = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--slug") slugFlag = argv[++i] ?? null;
  else if (a === "--no-push") noPush = true;
  else if (a.startsWith("--")) die(`unknown option ${a}.`, "Options: --slug <name>, --no-push");
  else if (zipArg === null) zipArg = a;
  else die("more than one zip given.", "Pass exactly one path.");
}
if (!zipArg) {
  die(
    "no zip given.",
    "Usage: node scripts/handoff-import.mjs <path-to-zip> [--slug <name>] [--no-push]\n" +
      "  Tip: type the command, then DRAG the zip from Finder onto the terminal to paste its path.",
  );
}
const zip = resolve(zipArg.replace(/^~/, process.env.HOME ?? "~"));
if (!existsSync(zip))
  die(`no such file: ${zip}`, "Check the path, or drag the zip onto the terminal.");

// Locate the repo from the SCRIPT's own position, never the cwd — cwd is what made the manual
// attempt operate on a different clone than the one holding the files.
const REPO = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: new URL(".", import.meta.url).pathname,
  encoding: "utf8",
}).trim();

// Every git call reports git's own message on failure. A raw Node stack trace here would be the
// same unreadable-failure problem this script exists to remove, one level down.
const git = (...a) => {
  try {
    return execFileSync("git", a, { cwd: REPO, encoding: "utf8", stdio: "pipe" }).trim();
  } catch (err) {
    const detail = String(err.stderr || err.stdout || err.message).trim();
    die(`git ${a.slice(0, 2).join(" ")} failed:\n\n${detail}`);
  }
};

// Pre-flight: a modified tracked file makes `checkout -B` abort mid-run, which would leave the
// import half-done. Refuse before touching anything rather than failing partway.
const dirty = git("status", "--porcelain", "--untracked-files=no");
if (dirty) {
  die(
    "the repo has uncommitted changes, so switching to the handoff branch would fail.",
    `Commit or discard them first, then re-run. Changed:\n\n${dirty
      .split("\n")
      .slice(0, 10)
      .map((l) => `    ${l}`)
      .join("\n")}`,
  );
}

const slug = (slugFlag || basename(zip).replace(/\.zip$/i, ""))
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");
if (!slug) die("could not derive a slug from the zip name.", "Pass one: --slug desk-v2");

console.log(`\n📦 ${basename(zip)}  →  docs/handoffs/${slug}/  (repo: ${REPO})\n`);

// ── unpack ────────────────────────────────────────────────────────────────────
const staging = mkdtempSync(join(tmpdir(), "handoff-"));
try {
  execFileSync("unzip", ["-q", "-o", zip, "-d", staging], { stdio: "pipe" });
} catch {
  die(`could not unzip ${basename(zip)}.`, "Is it actually a zip? Try opening it in Finder first.");
}

// macOS resource forks and Finder metadata, dropped before anything else sees them. A .DS_Store
// inside a bundle gets listed as a design file by handoff-scan and shown to a building session as
// though it were design input.
const prune = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.name === "__MACOSX" || e.name === ".DS_Store")
      rmSync(p, { recursive: true, force: true });
    else if (e.isDirectory()) prune(p);
  }
};
prune(staging);

// A zip made from a folder usually unpacks to ONE wrapper directory — descend through those so the
// bundle never lands at docs/handoffs/<slug>/<slug>/. Guessing wrong here is precisely how a bundle
// ends up somewhere `git add docs/handoffs/<slug>` cannot see it.
let root = staging;
for (;;) {
  const entries = readdirSync(root, { withFileTypes: true });
  if (entries.length === 1 && entries[0].isDirectory()) root = join(root, entries[0].name);
  else break;
}

const files = [];
const walk = (dir, base = "") => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(join(dir, e.name), `${base}${e.name}/`);
    else files.push(`${base}${e.name}`);
  }
};
walk(root);
if (files.length === 0) {
  die(
    "the zip unpacked to nothing.",
    "Nothing was imported and no branch was made — the repo is untouched.",
  );
}
console.log(`  unpacked ${files.length} file(s):`);
for (const f of files.slice(0, 12)) console.log(`    ${f}`);
if (files.length > 12) console.log(`    … and ${files.length - 12} more`);

// ── branch first, then place ──────────────────────────────────────────────────
// Branch BEFORE writing anything, per the repo's ship loop. Doing it the other way round means
// relying on untracked files surviving a checkout — true today, but a silent assumption, and this
// script exists precisely to stop silent assumptions.
const branch = `handoff/${slug}`;
git("fetch", "origin", "main");
git("checkout", "-B", branch, "origin/main");

const dest = join(REPO, "docs", "handoffs", slug);
rmSync(dest, { recursive: true, force: true }); // re-import replaces, never merges into stale files
cpSync(root, dest, { recursive: true });
rmSync(staging, { recursive: true, force: true });

// The contract is what an unattended session builds from. A bundle without one is not a handoff.
const readme = join(dest, "README.md");
if (!existsSync(readme)) {
  cpSync(join(REPO, "docs", "handoffs", "TEMPLATE.md"), readme);
  console.log(
    "\n  ⚠ no README.md in the bundle — seeded one from TEMPLATE.md. It needs authoring.",
  );
} else if (!/^\*\*Status:\*\*/m.test(readFileSync(readme, "utf8"))) {
  // A design session's README predates this repo's contract and won't carry a status line. Add it
  // at `draft` — never `ready`, which is Eric's flip and the build trigger.
  const text = readFileSync(readme, "utf8");
  const lines = text.split("\n");
  const at = lines.findIndex((l) => /^#\s+\S/.test(l));
  lines.splice(at + 1, 0, "", "**Status:** draft <!-- only Eric flips draft→ready -->");
  writeFileSync(readme, lines.join("\n"));
  console.log("\n  + added a `**Status:** draft` line to the bundle's README.");
}

// ── contract ──────────────────────────────────────────────────────────────────
console.log("\n📋 contract scan\n");
let clean = true;
try {
  execFileSync("node", ["scripts/handoff-scan.mjs", "--validate"], { cwd: REPO, stdio: "inherit" });
} catch {
  clean = false;
}

// ── commit ────────────────────────────────────────────────────────────────────
git("add", "--", `docs/handoffs/${slug}`);

// The check the manual attempt never made: did anything actually stage? An empty diff here means
// the import silently did nothing, and pushing would publish a branch with zero commits.
const staged = git("diff", "--cached", "--name-only");
if (!staged) {
  die(
    `nothing staged from docs/handoffs/${slug} — the import did not take.`,
    "No commit and no push happened. Re-run with --slug, or report this output.",
  );
}
console.log(`\n✓ staged ${staged.split("\n").length} file(s)`);

git("commit", "-q", "-m", `docs(handoff): ${slug} design bundle`);
console.log(`✓ committed on ${branch}`);

if (noPush) {
  console.log(`\nStopped before pushing (--no-push). Push with:\n  git push -u origin ${branch}\n`);
  process.exit(clean ? 0 : 1);
}

git("push", "-u", "origin", branch);
const remote = git("remote", "get-url", "origin").replace(/\.git$/, "");
const slugPath = remote.replace(/^git@github\.com:/, "https://github.com/");

console.log(`\n✓ pushed ${branch}`);
console.log(`\n  Open the PR:  ${slugPath}/compare/${branch}?expand=1\n`);
if (!clean) {
  console.log("  The contract scan above found problems. The bundle is safely on a branch — it");
  console.log(
    "  cannot trigger a build while its status is `draft`. Fix the findings, or hand the",
  );
  console.log("  branch to Claude Code and ask it to reconcile the README against the template.\n");
} else {
  console.log(
    "  Contract is clean. It stays inert until its status flips to `ready` — Eric's call.\n",
  );
}
process.exit(0);
