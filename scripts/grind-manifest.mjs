#!/usr/bin/env node
// Grind-chore manifest — the compute tier a `*.instructions.md` chore declares for itself.
//
//   node scripts/grind-manifest.mjs                      # every docs/grind/*.instructions.md (exit 1 on a problem)
//   node scripts/grind-manifest.mjs <path...>            # just these files
//   node scripts/grind-manifest.mjs --args --items '<json array>' <path>   # emit ready-to-paste grind args
//
// WHY (#1325): `.claude/workflows/grind.js` defaults every dispatch to low effort on a cheap model,
// and the Workflow harness gives a script no filesystem access — so grind cannot read the chore it
// is about to dispatch. The tier therefore lived in each chore's prose header, and the CALLER was
// expected to transcribe it into the `steps` array. All 5 checked-in chores carry such a header;
// nothing warned when one was skipped, and a skipped `isolation` is worse than a skipped `effort`
// (concurrent items share one checkout — docs/grind/README.md, "Two hazards").
//
// This script is the declare-and-check half of the fix: the chore states its tier in YAML front
// matter, using the SAME key names as `.claude/agents/*.md` frontmatter (`model` · `effort` ·
// `isolation`), so a chore that later graduates to a real subagent carries its header unchanged.
// `--args` then emits the exact grind args, so a caller generates the call instead of transcribing
// it. Teaching `grind.js` itself to read this at dispatch is the next slice (see the issue) — until
// then a caller who skips `--args` can still under-tier a run.
//
// Enforced in CI via tests/arch/grind-manifest.spec.ts (blocking — a chore that silently runs at the
// wrong tier is a broken contract, not debt to ratchet).
import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const CHORE_DIR = "docs/grind";
const CHORE_SUFFIX = ".instructions.md";

/** Effort tiers the Agent/Workflow harness accepts. */
export const EFFORTS = ["low", "medium", "high", "xhigh", "max"];
/** Model aliases only — never a pinned model id (docs/COMPUTE.md). */
export const MODELS = ["haiku", "sonnet", "opus", "fable"];
/** `worktree` mirrors the harness value; `none` is an explicit "this chore does not need one". */
export const ISOLATIONS = ["worktree", "none"];

const KEYS = ["name", "description", "model", "effort", "isolation", "outcomeCheck"];
const REQUIRED = ["name", "description", "effort", "isolation"];

/** Strip YAML quoting from one scalar value (single-quoted, double-quoted, or bare). */
function unquote(raw) {
  const value = raw.trim();
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  return value;
}

/**
 * Front matter that opens somewhere other than line 1 — a `---` line followed immediately by a
 * known key. Fenced blocks are skipped so a doc that *documents* the format (README.md) is not
 * mistaken for one that got its own header wrong. Returns the 1-based line, or 0 for none.
 */
function findMisplacedFrontMatter(source) {
  const lines = source.split("\n");
  let fenced = false;
  for (const [i, line] of lines.entries()) {
    if (line.trimStart().startsWith("```")) fenced = !fenced;
    if (fenced || line.trim() !== "---") continue;
    const next = lines[i + 1] ?? "";
    if (new RegExp(`^(${KEYS.join("|")}):\\s`).test(next)) return i + 1;
  }
  return 0;
}

/**
 * Parse a chore file's front matter.
 * @param {string} source  the file's contents
 * @param {string} file    display path, e.g. "docs/grind/bury-dead-code.instructions.md"
 * @returns {{manifest: object|null, problems: string[]}} manifest is null when there is no front matter
 */
export function parseChoreManifest(source, file) {
  const problems = [];
  if (!source.startsWith("---\n")) {
    const misplaced = findMisplacedFrontMatter(source);
    return {
      manifest: null,
      problems: misplaced
        ? [
            `${file}:${misplaced} front matter must be the FIRST thing in the file (a \`---\` on line 1)`,
          ]
        : [],
    };
  }
  const end = source.indexOf("\n---", 4);
  if (end === -1)
    return {
      manifest: null,
      problems: [`${file}: front matter is never closed by a \`---\` line`],
    };

  const manifest = { path: file };
  for (const key of KEYS) manifest[key] = null;

  for (const [i, line] of source.slice(4, end).split("\n").entries()) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!m) {
      problems.push(
        `${file}:${i + 2} is not a \`key: value\` line — this parser reads flat scalars only`,
      );
      continue;
    }
    const [, key, raw] = m;
    if (!KEYS.includes(key)) {
      problems.push(
        `${file}:${i + 2} unknown front-matter key "${key}" (expected one of ${KEYS.join(", ")})`,
      );
      continue;
    }
    manifest[key] = unquote(raw);
  }

  problems.push(...validateValues(manifest, file));
  return { manifest, problems };
}

/** Reject a declared value the Agent/Workflow harness would not accept. */
function validateValues(manifest, file) {
  const problems = [];
  const expectedName = basename(file).replace(/\.instructions\.md$/, "");
  if (manifest.name && manifest.name !== expectedName) {
    problems.push(
      `${file}: name is "${manifest.name}" but the file is ${expectedName}${CHORE_SUFFIX} — keep them identical`,
    );
  }
  if (manifest.effort && !EFFORTS.includes(manifest.effort)) {
    problems.push(`${file}: effort "${manifest.effort}" is not one of ${EFFORTS.join(", ")}`);
  }
  if (manifest.model && !MODELS.includes(manifest.model)) {
    problems.push(
      `${file}: model "${manifest.model}" is not one of ${MODELS.join(", ")} — aliases only, never a pinned id`,
    );
  }
  if (manifest.isolation && !ISOLATIONS.includes(manifest.isolation)) {
    problems.push(
      `${file}: isolation "${manifest.isolation}" is not one of ${ISOLATIONS.join(", ")}`,
    );
  }
  return problems;
}

/** True for a path this repo checks in as a reusable chore — those must declare a full tier. */
export function isCheckedInChore(file) {
  return file.startsWith(`${CHORE_DIR}/`) && file.endsWith(CHORE_SUFFIX);
}

/**
 * Read and validate one chore file.
 * @returns {{manifest: object|null, problems: string[]}}
 */
export function scanChoreFile(file) {
  let source;
  try {
    source = readFileSync(join(ROOT, file), "utf8");
  } catch {
    return { manifest: null, problems: [`${file}: cannot be read`] };
  }
  const { manifest, problems } = parseChoreManifest(source, file);
  if (!isCheckedInChore(file)) return { manifest, problems };

  if (!manifest) {
    return {
      manifest,
      problems: [
        ...problems,
        `${file}: no front matter — a checked-in chore must declare its own tier (${REQUIRED.join(", ")}) so grind never dispatches it at the cheap default`,
      ],
    };
  }
  const missing = REQUIRED.filter((key) => !manifest[key]);
  if (missing.length) problems.push(`${file}: front matter is missing ${missing.join(", ")}`);
  return { manifest, problems };
}

/** Every checked-in chore file, repo-relative and sorted. */
export function choreFiles() {
  return readdirSync(join(ROOT, CHORE_DIR))
    .filter((f) => f.endsWith(CHORE_SUFFIX))
    .sort()
    .map((f) => `${CHORE_DIR}/${f}`);
}

/**
 * Build the grind `args` object for one chore + item list — candidate A, the preflight, so a caller
 * pastes the tier instead of remembering it. `itemSource` is passed through, never derived: the
 * manifest only knows the chore's own tier, not where the caller's `items` list came from.
 */
export function argsFor(manifest, items, itemSource) {
  const step = {
    kind: "instructions",
    path: manifest.path,
    effort: manifest.effort,
    isolation: manifest.isolation === "worktree",
  };
  if (manifest.model) step.model = manifest.model;
  const steps = [step];
  if (manifest.outcomeCheck) steps.push({ kind: "script", command: manifest.outcomeCheck });
  return { items, itemSource, steps };
}

/** Normalise a CLI path argument to repo-relative POSIX form. */
function toRepoRelative(arg) {
  return relative(ROOT, resolve(ROOT, arg)).split("\\").join("/");
}

function main(argv) {
  const wantsArgs = argv.includes("--args");
  const itemsAt = argv.indexOf("--items");
  const sourceAt = argv.indexOf("--item-source");
  const paths = argv
    .filter((a, i) => !a.startsWith("--") && i !== itemsAt + 1 && i !== sourceAt + 1)
    .map(toRepoRelative);
  const files = paths.length ? paths : choreFiles();

  const results = files.map((f) => scanChoreFile(f));
  const problems = results.flatMap((r) => r.problems);
  if (problems.length) {
    console.error("✗ grind-manifest — a chore that would dispatch at the wrong tier:");
    for (const p of problems) console.error(`  ${p}`);
    console.error(
      "\nFix: give the file YAML front matter declaring name, description, effort and isolation (model only when the chore needs a specific one). See docs/grind/README.md → Calling convention.",
    );
    process.exit(1);
  }

  if (!wantsArgs) {
    console.log(
      JSON.stringify(
        results.map((r) => r.manifest),
        null,
        2,
      ),
    );
    return;
  }

  if (files.length !== 1) {
    console.error(
      "✗ grind-manifest --args takes exactly one chore path (the args are for one chore's run).",
    );
    process.exit(1);
  }
  if (itemsAt === -1 || !argv[itemsAt + 1]) {
    console.error(
      '✗ grind-manifest --args needs --items \'["a.ts", "b.ts"]\' — a JSON array of grind items.',
    );
    process.exit(1);
  }
  if (sourceAt === -1 || !argv[sourceAt + 1]) {
    console.error(
      "✗ grind-manifest --args needs --item-source '<string>' — where the --items list came from (a scan/query command, or why none applies). grind.js refuses to run without it.",
    );
    process.exit(1);
  }
  const itemSource = argv[sourceAt + 1];
  let items;
  try {
    items = JSON.parse(argv[itemsAt + 1]);
  } catch (err) {
    console.error(`✗ grind-manifest --items is not valid JSON — ${err.message}`);
    process.exit(1);
  }
  if (!Array.isArray(items) || items.length === 0) {
    console.error("✗ grind-manifest --items must be a non-empty JSON array.");
    process.exit(1);
  }
  const manifest = results[0].manifest;
  if (!manifest.outcomeCheck) {
    console.error(
      `note: ${manifest.path} declares no outcomeCheck, so no verify-the-world step was appended — add one to the front matter if the chore pushes a branch.`,
    );
  }
  console.log(JSON.stringify(argsFor(manifest, items, itemSource), null, 2));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main(process.argv.slice(2));
