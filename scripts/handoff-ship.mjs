#!/usr/bin/env node
// Handoff ship — the whole zip path as ONE command (docs/HANDOFFS.md):
//   import → contract validate → (optional ready flip) → PR → auto-merge armed.
//
//   npm run handoff:ship -- ~/Downloads/bundle.zip --slug desk-v2
//   npm run handoff:ship -- ~/Downloads/bundle.zip --slug desk-v2 --ready
//   npm run handoff:ship -- bundle.zip --no-push          # test mode: stop before pushing
//
// Composes what already exists rather than reimplementing it: handoff-import.mjs owns
// unpack → branch → commit → push (and all the LESSONS.md 2026-08-14 failure modes — wrong
// clone, empty diff, zero-commit branch); the PR opens via `gh` when present, else
// scripts/ship.sh over REST.
//
// AUTHORIZATION SEMANTICS — the part that must never drift: `--ready` is Eric's one-word
// flip, typed as a flag. This script never flips on its own, and a DIRTY CONTRACT STOPS THE
// CHAIN before any flip or PR — the bundle still lands on its branch (safe: `draft` triggers
// nothing), but authoring work remains and nothing downstream fires.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const argv = process.argv.slice(2);
const die = (msg, fix) => {
  console.error(`\n✗ ${msg}`);
  if (fix) console.error(`\n  ${fix}`);
  console.error("");
  process.exit(1);
};

let slugFlag = null;
let ready = false;
let noPush = false;
let zipArg = null;
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--slug") slugFlag = argv[++i] ?? null;
  else if (a === "--ready") ready = true;
  else if (a === "--no-push") noPush = true;
  else if (a.startsWith("--"))
    die(`unknown option ${a}.`, "Options: --slug <name>, --ready, --no-push");
  else if (zipArg === null) zipArg = a;
  else die("more than one zip given.", "Pass exactly one path.");
}
if (!zipArg) {
  die(
    "no zip given.",
    "Usage: npm run handoff:ship -- <path-to-zip> [--slug <name>] [--ready] [--no-push]",
  );
}
if (ready && noPush)
  die("--ready with --no-push makes no sense — a flip that never pushes fires nothing.");

// Same repo-location rule as the importer: trust the script's position, never the cwd.
const REPO = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  cwd: new URL(".", import.meta.url).pathname,
  encoding: "utf8",
}).trim();

// Same slug derivation as handoff-import.mjs, so the flip targets exactly what was imported
// (never `ls | tail -1`, which grabs whatever sorts last).
const slug = (slugFlag || zipArg.replace(/^.*\//, "").replace(/\.zip$/i, ""))
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const run = (cmd, args) => execFileSync(cmd, args, { cwd: REPO, stdio: "inherit" });

// ── 1. import (unpack → validate → branch → commit → push) ───────────────────
// Exit 1 from the importer = the bundle landed but the CONTRACT IS DIRTY. That is a hard stop
// for the chain: no ready flip, no PR. `draft` keeps it inert on its branch meanwhile.
try {
  run("node", [
    "scripts/handoff-import.mjs",
    zipArg,
    "--slug",
    slug,
    ...(noPush ? ["--no-push"] : []),
  ]);
} catch {
  // The importer exits non-zero for BOTH hard failures (dirty repo, bad zip — nothing landed)
  // and a dirty contract (bundle landed, inert at draft). Its own output above says which.
  die(
    "the import did not complete cleanly — the importer's output above says exactly why.",
    `If it was only a dirty contract, the bundle is safely on handoff/${slug} and cannot\n` +
      `  trigger anything at draft. Fix the findings (npm run handoff:scan -- --validate),\n` +
      `  commit, and re-run — or hand the branch to Claude Code to reconcile the README.\n` +
      `  A hard failure (dirty repo, bad zip) landed nothing; fix the cause and re-run.`,
  );
}
if (noPush) {
  console.log("🧪 test mode (--no-push): import + contract verified, stopped before push.\n");
  process.exit(0);
}

// ── 2. the one-word authorization, iff Eric typed --ready ────────────────────
if (ready) {
  const readme = join(REPO, "docs", "handoffs", slug, "README.md");
  const text = readFileSync(readme, "utf8");
  if (!/^\*\*Status:\*\*\s*draft/m.test(text)) {
    die(`no "**Status:** draft" line in docs/handoffs/${slug}/README.md — nothing to flip.`);
  }
  writeFileSync(readme, text.replace(/^(\*\*Status:\*\*\s*)draft/m, "$1ready"));
  run("git", ["add", "--", `docs/handoffs/${slug}/README.md`]);
  run("git", ["commit", "-q", "-m", `docs(handoff): ${slug} → ready (eric's flip, via --ready)`]);
  run("git", ["push", "origin", `handoff/${slug}`]);
  console.log("\n✓ status flipped draft → ready — the build fires when this merges to main.");
}

// ── 3. PR + auto-merge (docs-only bundle: no carve-out, auto-merge is the default) ──
const title = `docs(handoff): ${slug} design bundle`;
const bodyFile = join(tmpdir(), `handoff-pr-${slug}.md`);
writeFileSync(
  bodyFile,
  `## Summary

- Imports the **${slug}** design bundle into \`docs/handoffs/${slug}/\` (via \`npm run handoff:ship\`).
- Contract validated clean by \`handoff-scan --validate\` before this PR opened.
- Status: **${ready ? "ready — the pickup layers fire when this merges" : "draft — inert until Eric flips it to ready"}**.

## Why

Design→code handoff per docs/HANDOFFS.md — the bundle rides a reviewable PR, and the \`ready\`
flip (not the merge) is what authorizes a build.
`,
);

const hasGh = (() => {
  try {
    execFileSync("gh", ["--version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
})();

if (hasGh) {
  run("gh", ["pr", "create", "--title", title, "--body-file", bodyFile, "--base", "main"]);
  run("gh", ["pr", "merge", "--auto", "--squash"]);
  console.log(`\n✓ PR opened and auto-merge (squash) armed. The rest is automatic:`);
} else if (process.env.GH_TOKEN || process.env.GITHUB_TOKEN) {
  // Remote/CI machines: ship.sh opens over REST and prints the PR number on its own line.
  const out = execFileSync("bash", ["scripts/ship.sh", "open", title, "--body-file", bodyFile], {
    cwd: REPO,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "inherit"],
  });
  process.stdout.write(out);
  const num = out
    .trim()
    .split("\n")
    .reverse()
    .find((l) => /^\d+$/.test(l.trim()));
  if (num) run("bash", ["scripts/ship.sh", "automerge", num.trim()]);
  console.log(`\n✓ PR opened and auto-merge armed via ship.sh. The rest is automatic:`);
} else {
  die(
    "no `gh` CLI and no GH_TOKEN/GITHUB_TOKEN — the branch is pushed but the PR needs a hand.",
    `Open it in the browser (compare view for handoff/${slug}), or install/auth gh and re-run.`,
  );
}
console.log(
  ready
    ? "  merge → handoff-detect opens the issue in seconds → a pickup layer claims it (ready→executing) → done = review + PR.\n"
    : "  merge lands the bundle at draft (inert). Flip draft → ready in the GitHub UI when it should build.\n",
);
