#!/usr/bin/env node
// Pull a published Claude Design canvas back out as working files.
//
//   node scripts/design-extract.mjs <saved-page.html> --to <fresh-dir>
//   node scripts/design-extract.mjs --which        # print the seed-canvas.mjs this would use
//   node scripts/design-extract.mjs --explain      # resolve from JSON on stdin; offline, always exit 0
//
// WHY THIS EXISTS. The `/design` skill ships its own extractor, `seed-canvas.mjs`, which turns a
// saved canvas page back into `Main.dc.html`, its sibling artboards, `canvas.json` and decoded
// images. That is the whole design→code pull, and re-implementing it would be strictly worse: the
// `.dc.html` format ships with the binary and changes with it, so a vendored copy is a copy that
// goes stale silently and mis-parses a canvas without saying so.
//
// The catch is WHERE it lives. It is extracted from the Claude Code binary into a temp path scoped
// by BOTH the CLI version and a build hash:
//
//   /tmp/claude-<n>/bundled-skills/<version>/<hash>/design/seed-canvas.mjs
//
// That path moves on every upgrade. Hard-coding the one seen today is a landmine: it works until
// the next release, then fails in a lane nobody is watching. So this resolves it at run time,
// newest version wins, and fails LOUDLY when it cannot — never by falling back to a stale copy.
//
// The version compare is the part worth a spec. `2.1.240` sorts BELOW `2.1.99` as a string, which
// would silently pin an older extractor against a newer canvas format — the exact failure this
// file exists to prevent, arriving quietly.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Where the CLI extracts its bundled skills. `claude-<n>` varies per install. */
export const SKILL_ROOT_GLOB = "bundled-skills";

/** `2.1.240` → `[2, 1, 240]`. A segment that isn't a number sorts lowest, so a malformed directory
 *  can never outrank a real release. */
export function versionKey(version) {
  return String(version)
    .split(".")
    .map((part) => (/^\d+$/.test(part) ? Number(part) : -1));
}

/** Numeric segment-wise compare — NOT lexicographic. Returns >0 when `a` is newer. */
export function compareVersions(a, b) {
  const [ka, kb] = [versionKey(a), versionKey(b)];
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    const diff = (ka[i] ?? 0) - (kb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** The version segment of a `.../bundled-skills/<version>/<hash>/design/seed-canvas.mjs` path. */
export function versionOf(path) {
  const parts = String(path).split("/");
  const at = parts.lastIndexOf(SKILL_ROOT_GLOB);
  return at === -1 ? "" : (parts[at + 1] ?? "");
}

/** The decision, isolated from the filesystem so it can be specced through the real entrypoint.
 *  `env.SKYNET_SEED_CANVAS` names an extractor directly and always wins — the escape hatch for a
 *  pinned or hand-placed copy. Otherwise the newest version among `candidates` wins. */
export function pickSeedCanvas(env = {}, candidates = []) {
  if (env.SKYNET_SEED_CANVAS) {
    return { resolved: env.SKYNET_SEED_CANVAS, reason: "override", considered: candidates.length };
  }
  const ranked = [...candidates].sort((a, b) => compareVersions(versionOf(b), versionOf(a)));
  const resolved = ranked[0] ?? "";
  return {
    resolved,
    reason: resolved ? "newest" : "none",
    considered: candidates.length,
    version: resolved ? versionOf(resolved) : "",
  };
}

/** The roots to search: an explicit override, else each `claude-<n>` temp dir's bundled-skills. */
function skillRoots(env) {
  if (env.SKYNET_BUNDLED_SKILLS) return [env.SKYNET_BUNDLED_SKILLS];
  const bases = [...new Set([tmpdir(), "/tmp"])];
  const roots = [];
  for (const base of bases) {
    let entries = [];
    try {
      entries = readdirSync(base);
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.startsWith("claude-")) continue;
      const root = join(base, entry, SKILL_ROOT_GLOB);
      if (existsSync(root)) roots.push(root);
    }
  }
  return roots;
}

/** Walk `<root>/<version>/<hash>/design/seed-canvas.mjs`. Depth is fixed, so no recursive glob. */
export function findSeedCanvases(env = process.env) {
  const found = [];
  for (const root of skillRoots(env)) {
    for (const version of safeDirs(root)) {
      for (const hash of safeDirs(join(root, version))) {
        const file = join(root, version, hash, "design", "seed-canvas.mjs");
        if (existsSync(file)) found.push(file);
      }
    }
  }
  return found;
}

function safeDirs(dir) {
  try {
    return readdirSync(dir).filter((d) => statSync(join(dir, d)).isDirectory());
  } catch {
    return [];
  }
}

/** The remedy, not just the complaint — an unresolved extractor is a fixable state, not a dead end. */
export const NOT_FOUND = [
  "design-extract: no seed-canvas.mjs found.",
  "",
  "It ships inside the Claude Code binary and is extracted on first use, so the fix is to run",
  "`/design` once in this session — that populates the bundle and this resolves on the next run.",
  "To point at a copy yourself, set SKYNET_SEED_CANVAS=<path to seed-canvas.mjs>.",
  "",
  "Never vendor a copy into this repo: the .dc.html format ships with the binary, so a checked-in",
  "extractor goes stale silently and mis-parses a canvas without saying so.",
].join("\n");

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

if (process.argv[1]?.endsWith("design-extract.mjs")) {
  const argv = process.argv.slice(2);

  // `--explain` takes {env, candidates} as JSON on stdin instead of touching the filesystem, so the
  // resolution can be specced through the real entrypoint (the house pattern — tests/scripts/*).
  if (argv.includes("--explain")) {
    const state = JSON.parse(readStdin() || "{}");
    console.log(JSON.stringify(pickSeedCanvas(state.env ?? {}, state.candidates ?? []), null, 2));
    process.exit(0);
  }

  const pick = pickSeedCanvas(process.env, findSeedCanvases());
  if (!(pick.resolved && existsSync(pick.resolved))) {
    console.error(NOT_FOUND);
    process.exit(1);
  }
  if (argv.includes("--which")) {
    console.log(pick.resolved);
    process.exit(0);
  }

  const page = argv.find((a) => !a.startsWith("--"));
  const to = argv[argv.indexOf("--to") + 1];
  if (!(page && argv.includes("--to") && to) || to.startsWith("--")) {
    console.error("usage: node scripts/design-extract.mjs <saved-page.html> --to <fresh-dir>");
    process.exit(2);
  }
  // Delegate verbatim. seed-canvas.mjs refuses to overwrite an existing file, which is the guard
  // that keeps a re-extract from silently clobbering edited working files — don't re-implement it.
  execFileSync("node", [pick.resolved, "--extract", page, "--to", to], { stdio: "inherit" });
}
