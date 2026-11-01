#!/usr/bin/env node
// Fitness audit: is a check any good? Break it on purpose and see whether its spec notices (#6470).
//
// A spec that only exercises a pure judge missed most of the bugs the study planted in
// scripts/fitness.mjs: 16 of 40 caught, and 0 of 15 in the probes and the wiring. Worse, a spec
// graded on the bug list its author wrote scores itself: 104 added lines caught 39 of 40 of their
// own list and 7 of 28 fresh bugs. So this script runs a bug list that a separate pass writes, one
// that never saw the spec (.claude/skills/fitness/SKILL.md step 7), and refuses to drop a bug from
// the count when the file has moved on under it.
//
// What it does, per bug: copy the files into a temporary folder, apply the bug there, run the spec
// there, restore the copy. The worktree is never written. Calls no model and costs no tokens: the
// only process it starts is rstest.
//
//   node scripts/fitness-audit.mjs --bugs <file>                 # scripts/fitness.mjs and its spec
//   node scripts/fitness-audit.mjs --bugs <file> --json          # the report as JSON
//   node scripts/fitness-audit.mjs --bugs <file> --candidate     # the weakest contract as JSON
//   --script <path> --spec <path>   another check and its spec, relative to the repo root
//   --with <path>                   another file the check or spec reads at run time (repeatable)
//   --root <dir>                    read the files from another checkout (the spec uses this)
//
// Results: caught (the spec went red), survived (the spec stayed green: the gap is the finding),
// NOT APPLIED (the find text is not in the file, or matches the replace text). A bug that did not
// apply stays in the denominator and is printed on stderr, because once the fixes rewrite the lines
// a list was written against, a silently shrinking list reads as a better spec.
//
// Exit codes: 0 every bug applied, whatever survived · 1 a bug did not apply · 2 cannot audit: a
// malformed bug list, a missing file, or a baseline spec that is already red.
//
// THE BUG LIST FILE. A JSON array. Every bug is one object; every field is a string:
//
//   [
//     {
//       "id": "age-boundary-off",                      // unique, kebab-case, used in the report
//       "contract": "bots-responsive",                 // optional: the contract id this bug attacks
//       "file": "scripts/fitness.mjs",                 // relative to the repo root
//       "find": "ageMs > STAMP_FRESH_MS",              // exact text, first occurrence is replaced
//       "replace": "ageMs >= STAMP_FRESH_MS",          // what the bug looks like
//       "why": "a poll exactly at the limit should still pass"   // the behaviour that must break
//     }
//   ]
//
// Write `find` as the smallest exact text that pins one line; whitespace counts. Keep the list
// short and curated: Google found most generated mutants unproductive, so each bug should name a
// behaviour a person cares about in `why`. Without `contract`, a bug inside the CONTRACTS array is
// attributed to the nearest contract above it, and anything else counts as "shared" (judges,
// reporting, probes read by more than one contract).
//
// --candidate names the contract with the most survivors; with no survivors, the contract with the
// fewest bugs aimed at it, so an unattacked contract is named before a well-covered one.
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
// node_modules come from the checkout this script lives in, so a --root fixture needs none.
const REPO = resolve(HERE, "..");
const RSTEST = join(REPO, "node_modules", "@rstest", "core", "bin", "rstest.js");
const FIELDS = ["id", "file", "find", "replace", "why"];
const SPEC_TIMEOUT_MS = 120_000;

function parseArgs(argv) {
  const opts = {
    script: "scripts/fitness.mjs",
    spec: "tests/scripts/fitness.spec.ts",
    bugs: null,
    root: process.cwd(),
    with: [],
    json: false,
    candidate: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") opts.json = true;
    else if (arg === "--candidate") opts.candidate = true;
    else if (arg === "--with") opts.with.push(argv[++i]);
    else if (arg.startsWith("--") && arg.slice(2) in opts) opts[arg.slice(2)] = argv[++i];
    else throw new Error(`unknown argument ${arg}`);
  }
  if (!opts.bugs) throw new Error("--bugs <file> is required");
  return opts;
}

/** The bug list as written, or the first thing wrong with it, naming the bug. */
export function validateBugs(raw) {
  if (!Array.isArray(raw)) throw new Error("the bug list must be a JSON array");
  const seen = new Set();
  raw.forEach((bug, i) => {
    const name = typeof bug?.id === "string" ? bug.id : `#${i + 1}`;
    for (const field of FIELDS) {
      if (typeof bug?.[field] !== "string" || !bug[field]) {
        throw new Error(`bug ${name}: "${field}" must be a non-empty string`);
      }
    }
    if (bug.contract !== undefined && typeof bug.contract !== "string") {
      throw new Error(`bug ${name}: "contract" must be a string when given`);
    }
    if (seen.has(bug.id)) throw new Error(`bug ${bug.id}: duplicate id`);
    seen.add(bug.id);
  });
  return raw;
}

/** Contract ids declared in a check's source, in order: `id: "..."` lines inside CONTRACTS. */
export function contractIds(source) {
  const body = contractsBody(source);
  return [...body.matchAll(/^\s*id: "([\w-]+)"/gm)].map((m) => m[1]);
}

function contractsBody(source) {
  const start = source.indexOf("CONTRACTS = [");
  if (start === -1) return "";
  const end = source.indexOf("\n];", start);
  return source.slice(start, end === -1 ? undefined : end);
}

/** Which contract a bug attacks: its own field, else the nearest contract above it in CONTRACTS. */
export function attribute(bug, source) {
  if (bug.contract) return bug.contract;
  const start = source.indexOf("CONTRACTS = [");
  const at = source.indexOf(bug.find);
  if (start === -1 || at < start) return "shared";
  const above = contractIds(source.slice(0, at));
  return above.at(-1) ?? "shared";
}

/** Apply one bug to a source text, or say why it cannot be. */
export function applyBug(bug, source) {
  if (bug.find === bug.replace) return { note: "find and replace are the same text" };
  const count = source.split(bug.find).length - 1;
  if (count === 0) return { note: `find text is not in ${bug.file}` };
  return {
    source: source.replace(bug.find, bug.replace),
    note: count > 1 ? `find text matches ${count} times; the first was replaced` : "",
  };
}

/**
 * The weakest contract: most survivors, else fewest bugs aimed at it. Contracts with no bug at all
 * count as zero coverage, which is the least.
 */
export function candidateOf(ids, bugs) {
  const rows = ids.map((contract) => ({
    contract,
    survivors: bugs.filter((b) => b.contract === contract && b.result === "survived").length,
    bugs: bugs.filter((b) => b.contract === contract).length,
  }));
  if (!rows.length) return null;
  const worst = rows.reduce((a, b) =>
    b.survivors > a.survivors || (b.survivors === a.survivors && b.bugs < a.bugs) ? b : a,
  );
  const why =
    worst.survivors > 0
      ? `${worst.survivors} of ${worst.bugs} bugs survived its spec`
      : `only ${worst.bugs} bug(s) aimed at it`;
  return { ...worst, why };
}

/** A path under root, or an error: a bug list must not reach outside the checkout. */
function inside(root, path) {
  const abs = resolve(root, path);
  if (relative(root, abs).startsWith("..") || abs.split(sep).includes("..")) {
    throw new Error(`${path} is outside the repo root`);
  }
  if (!existsSync(abs)) throw new Error(`${path} does not exist`);
  return abs;
}

/** A temporary tree holding only the files named, with the repo's node_modules beside them. */
function stage(root, files) {
  const dir = mkdtempSync(join(tmpdir(), "fitness-audit-"));
  for (const rel of files) {
    const dest = join(dir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(inside(root, rel), dest);
  }
  symlinkSync(join(REPO, "node_modules"), join(dir, "node_modules"), "dir");
  writeFileSync(join(dir, "package.json"), '{ "type": "module", "private": true }\n');
  return dir;
}

/** Run the spec in the staged tree. Green is 0; a red or crashed or hung spec is non-zero. */
function runSpec(dir, spec) {
  // Its own config, so the spec runs whatever its name, and nothing else in the tree does.
  writeFileSync(
    join(dir, "rstest.config.mjs"),
    `export default { globals: true, testEnvironment: "node", include: [${JSON.stringify(spec)}] };\n`,
  );
  const res = spawnSync(process.execPath, [RSTEST, "run", spec], {
    cwd: dir,
    encoding: "utf8",
    timeout: SPEC_TIMEOUT_MS,
    env: { ...process.env, FLY_BIN: "/usr/bin/false" },
  });
  if (res.error?.code === "ETIMEDOUT") return { status: 1, note: "the spec hung" };
  return { status: res.status ?? 1, out: `${res.stdout}\n${res.stderr}` };
}

export function audit(opts) {
  const root = resolve(opts.root);
  const bugs = validateBugs(JSON.parse(readFileSync(resolve(root, opts.bugs), "utf8")));
  const files = [...new Set([opts.script, opts.spec, ...opts.with, ...bugs.map((b) => b.file)])];
  const dir = stage(root, files);
  try {
    const baseline = runSpec(dir, opts.spec);
    if (baseline.status !== 0) {
      throw new Error(
        `baseline is red: ${opts.spec} fails before any bug is applied\n${baseline.out}`,
      );
    }
    const script = readFileSync(join(dir, opts.script), "utf8");
    const rows = bugs.map((bug) => {
      const target = join(dir, bug.file);
      const original = readFileSync(target, "utf8");
      const applied = applyBug(bug, original);
      const row = {
        id: bug.id,
        contract: attribute(bug, bug.file === opts.script ? script : original),
        why: bug.why,
        note: applied.note,
      };
      if (!applied.source) return { ...row, result: "not-applied" };
      writeFileSync(target, applied.source);
      const run = runSpec(dir, opts.spec);
      writeFileSync(target, original);
      return {
        ...row,
        result: run.status === 0 ? "survived" : "caught",
        note: run.note ?? row.note,
      };
    });
    const count = (result) => rows.filter((r) => r.result === result).length;
    return {
      script: opts.script,
      spec: opts.spec,
      total: rows.length,
      caught: count("caught"),
      survived: count("survived"),
      notApplied: count("not-applied"),
      candidate: candidateOf(contractIds(script), rows),
      bugs: rows,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function print(report) {
  console.log(`fitness-audit: ${report.script} against ${report.spec}, ${report.total} bugs`);
  const label = { caught: "CAUGHT", survived: "SURVIVED", "not-applied": "NOT APPLIED" };
  for (const b of report.bugs) {
    const note = b.note ? ` (${b.note})` : "";
    console.log(
      `${label[b.result].padEnd(12)}${b.id.padEnd(28)}${b.contract.padEnd(20)}${b.why}${note}`,
    );
  }
  console.log(
    `caught ${report.caught} · survived ${report.survived} · not applied ${report.notApplied} · of ${report.total}`,
  );
  if (report.candidate) {
    console.log(`candidate: ${report.candidate.contract} (${report.candidate.why})`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let report;
  try {
    const opts = parseArgs(process.argv.slice(2));
    report = audit(opts);
    if (opts.candidate) console.log(JSON.stringify(report.candidate));
    else if (opts.json) console.log(JSON.stringify(report, null, 2));
    else print(report);
  } catch (err) {
    console.error(`fitness-audit: ${err.message}`);
    process.exit(2);
  }
  const missing = report.bugs.filter((b) => b.result === "not-applied");
  if (missing.length) {
    console.error(
      `fitness-audit: NOT APPLIED ${missing.map((b) => b.id).join(", ")}: rewrite these bugs against the current file; they still count against the spec`,
    );
    process.exit(1);
  }
}
