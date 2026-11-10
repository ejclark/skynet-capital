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
//   --env NAME=VALUE                set for the spec run (repeatable). FLY_BIN=/usr/bin/false is
//                                   always set, so scripts/fitness.mjs never looks for a real fly
//   --root <dir>                    read the files from another checkout (the spec uses this)
//   --timeout <seconds>             how long the green baseline may take (default 600)
//   --bug-timeout <seconds>         how long each bug may take (default: see below)
//
// Results: caught (a named test went red for a reason of its own), survived (the spec stayed green:
// the gap is the finding), NO VERDICT (the run said nothing about the bug), NOT APPLIED (the find
// text is not in the file, or matches the replace text). A bug that did not apply stays in the
// denominator and is printed on stderr, because once the fixes rewrite the lines a list was written
// against, a silently shrinking list reads as a better spec. A caught row names the test that went
// red, so a catch by something unrelated can be seen and not just counted.
//
// NO VERDICT is every other way for a run to end red: out of time, a test past its own limit, a
// worker the OS killed, a signal, or a bug that does not compile or throws before any test runs. It
// stays in the denominator and is never caught, because a score that counts these rises with the
// load on the machine. Re-run it on a quieter machine or with a larger limit, or rewrite the bug.
//
// A bug gets three times what the baseline took, with a two-minute floor. A fixed limit read a slow
// machine as a catch: the decision-cycle spec took 150 seconds at a load average of about 25, past a
// 120-second limit with no bug in it at all.
//
// Exit codes: 0 every bug graded, whatever survived · 1 a bug did not apply or got no verdict · 2
// cannot audit: a malformed bug list, a missing file, or a baseline spec that is already red.
//
// THE BUG LIST FILE. A JSON array. Every bug is one object; every field is a string:
//
//   [
//     {
//       "id": "age-boundary-off",                      // unique, kebab-case, used in the report
//       "contract": "bots-responsive",                 // optional: the contract id this bug attacks
//       "file": "scripts/fitness.mjs",                 // relative to the repo root
//       "find": "ageMs > STAMP_FRESH_MS",              // exact text, first occurrence is replaced
//       "replace": "ageMs >= STAMP_FRESH_MS",          // what the bug looks like; "" deletes it
//       "why": "a poll exactly at the limit should still pass"   // the behaviour that must break
//     }
//   ]
//
// Write `find` as the smallest exact text that pins one line; whitespace counts. Keep the list
// short and curated: Google found most generated mutants unproductive, so each bug should name a
// behaviour a person cares about in `why`. Without `contract`, a bug inside the CONTRACTS array is
// attributed to the nearest contract above it, and anything else, above or below the array, counts
// as "shared" (judges, reporting, probes read by more than one contract).
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
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isMain } from "./is-main.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
// node_modules come from the checkout this script lives in, so a --root fixture needs none.
const REPO = resolve(HERE, "..");
const RSTEST = join(REPO, "node_modules", "@rstest", "core", "bin", "rstest.js");
const FIELDS = ["id", "file", "find", "replace", "why"];
// Text, but it may be empty: the commonest bug is a guard deleted outright.
const MAY_BE_EMPTY = new Set(["replace"]);
const BASELINE_TIMEOUT_S = 600;
const BUG_TIMEOUT_FLOOR_MS = 120_000;
// The machine talking, not the test: a test past its limit under load, a worker that died.
const MACHINE_FAILURE =
  /^(?:[\w ]* timed out in \d+ms|Worker (?:killed|exited|stopped|did not start))/;

/** How long a bug's run may take, given how long the green baseline took. */
export const bugDeadlineMs = (baselineMs) => Math.max(BUG_TIMEOUT_FLOOR_MS, 3 * baselineMs);

function seconds(value, flag) {
  const n = Number(value);
  if (!(Number.isFinite(n) && n > 0)) throw new Error(`${flag} needs a positive number of seconds`);
  return n;
}

/** Seconds as spawnSync takes them: a whole number of milliseconds, or it refuses to start. */
const toMs = (s) => Math.ceil(s * 1000);

function parseArgs(argv) {
  const opts = {
    script: "scripts/fitness.mjs",
    spec: "tests/scripts/fitness.spec.ts",
    bugs: null,
    root: process.cwd(),
    with: [],
    env: [],
    timeout: BASELINE_TIMEOUT_S,
    "bug-timeout": null,
    json: false,
    candidate: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") opts.json = true;
    else if (arg === "--candidate") opts.candidate = true;
    else if (arg.startsWith("--") && arg.slice(2) in opts) {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) throw new Error(`${arg} needs a value`);
      if (Array.isArray(opts[arg.slice(2)])) opts[arg.slice(2)].push(value);
      else opts[arg.slice(2)] = value;
    } else throw new Error(`unknown argument ${arg}`);
  }
  if (!opts.bugs) throw new Error("--bugs <file> is required");
  opts.timeout = seconds(opts.timeout, "--timeout");
  if (opts["bug-timeout"] !== null) {
    opts["bug-timeout"] = seconds(opts["bug-timeout"], "--bug-timeout");
  }
  return opts;
}

/** The bug list as written, or the first thing wrong with it, naming the bug. */
export function validateBugs(raw) {
  if (!Array.isArray(raw)) throw new Error("the bug list must be a JSON array");
  const seen = new Set();
  raw.forEach((bug, i) => {
    const name = typeof bug?.id === "string" ? bug.id : `#${i + 1}`;
    for (const field of FIELDS) {
      if (typeof bug?.[field] !== "string") {
        throw new Error(`bug ${name}: "${field}" must be a string`);
      }
      if (!(bug[field] || MAY_BE_EMPTY.has(field))) {
        throw new Error(`bug ${name}: "${field}" must not be empty`);
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

/** Which contract a bug attacks: its own field, else the contract around it in CONTRACTS. */
export function attribute(bug, source) {
  if (bug.contract) return bug.contract;
  const at = source.indexOf(bug.find);
  const body = contractsBody(source);
  const start = source.indexOf("CONTRACTS = [");
  // Past the array is the reporting and the entrypoint, which attack no one contract. Reading those
  // as the last contract's made --candidate name a contract nobody had aimed at.
  if (start === -1 || at < start || at >= start + body.length) return "shared";
  const above = contractIds(source.slice(0, at));
  return above.at(-1) ?? "shared";
}

/** Apply one bug to a source text, or say why it cannot be. */
export function applyBug(bug, source) {
  if (bug.find === bug.replace) return { note: "find and replace are the same text" };
  const count = source.split(bug.find).length - 1;
  if (count === 0) return { note: `find text is not in ${bug.file}` };
  return {
    // A function replacer: a string one would read `$&`, `$'` and `$1` in the bug as patterns.
    source: source.replace(bug.find, () => bug.replace),
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
  if (relative(root, abs).startsWith("..")) throw new Error(`${path} is outside the repo root`);
  if (!existsSync(abs)) throw new Error(`${path} does not exist`);
  return abs;
}

/**
 * A temporary tree holding only the files named, the repo's node_modules beside them, and a test
 * config of its own: the spec runs whatever its name, and nothing else in the tree does.
 */
function stage(root, files, spec) {
  const dir = mkdtempSync(join(tmpdir(), "fitness-audit-"));
  for (const rel of files) {
    const dest = join(dir, rel);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(inside(root, rel), dest);
  }
  symlinkSync(join(REPO, "node_modules"), join(dir, "node_modules"), "dir");
  writeFileSync(join(dir, "package.json"), '{ "type": "module", "private": true }\n');
  writeFileSync(
    join(dir, "rstest.config.mjs"),
    `export default { globals: true, testEnvironment: "node", include: [${JSON.stringify(spec)}] };\n`,
  );
  return dir;
}

/** `NAME=VALUE` pairs as an object; the default keeps scripts/fitness.mjs from looking for fly. */
function specEnv(pairs) {
  const env = { ...process.env, FLY_BIN: "/usr/bin/false" };
  for (const pair of pairs) {
    const eq = pair.indexOf("=");
    if (eq < 1) throw new Error(`--env needs NAME=VALUE, got ${pair}`);
    env[pair.slice(0, eq)] = pair.slice(eq + 1);
  }
  return env;
}

/**
 * Run the spec in the staged tree, stopping at its first red test when `bail` says so: a caught bug
 * has answered, and the rest of a slow spec tells nothing more. Green is 0; a red, crashed or hung
 * spec is non-zero. The md reporter is named so the report has one shape in CI and on a laptop, and
 * verdictOf reads it.
 */
function runSpec(dir, spec, env, timeoutMs, bail = false) {
  const res = spawnSync(
    process.execPath,
    [RSTEST, "run", spec, "--reporter", "md", ...(bail ? ["--bail", "1"] : [])],
    {
      cwd: dir,
      encoding: "utf8",
      timeout: timeoutMs,
      env,
    },
  );
  if (res.error?.code === "ETIMEDOUT") return { status: 1, hung: true, timeoutMs };
  // Anything else is the runner failing, never the spec: rstest missing, a dead node_modules link.
  if (res.error) throw new Error(`cannot run rstest: ${res.error.message}`);
  return {
    status: res.status ?? 1,
    signal: res.signal,
    report: res.stdout,
    out: `${res.stdout}\n${res.stderr}`,
  };
}

/** The failures in the md reporter's report, in order. Each is a JSON block under its heading. */
function failuresIn(report) {
  // On a line of its own: a message quoting a report is JSON here, so its newlines are escaped.
  const at = (report ?? "").lastIndexOf("\n## Failures\n");
  if (at === -1) return [];
  return [...report.slice(at).matchAll(/^```json\n([\s\S]*?)\n```$/gm)].flatMap((block) => {
    try {
      return [JSON.parse(block[1])];
    } catch {
      return [];
    }
  });
}

/**
 * What a finished run says about a bug. Green is survived, and red is caught only when a named test
 * failed for a reason of its own, because everything else also happens with no bug in the file.
 */
export function verdictOf(run) {
  if (run.hung) {
    const note = `ran out of time after ${Math.round(run.timeoutMs / 1000)} s; slow or stuck, the run cannot say which`;
    return { result: "no-verdict", note };
  }
  if (run.signal) return { result: "no-verdict", note: `killed by ${run.signal}` };
  if (run.status === 0) return { result: "survived" };
  const failures = failuresIn(run.report);
  const judged = failures.find(
    (f) => f.fullName && f.errors?.some((e) => !MACHINE_FAILURE.test(e.message ?? "")),
  );
  if (judged) return { result: "caught", caughtBy: judged.fullName };
  const said = failures[0]?.errors?.[0]?.message?.trim().split("\n")[0];
  return {
    result: "no-verdict",
    note: said ? `no test judged it: ${said}` : `exited ${run.status} with no test red`,
  };
}

export function audit(opts) {
  const root = resolve(opts.root);
  const bugs = validateBugs(JSON.parse(readFileSync(resolve(root, opts.bugs), "utf8")));
  const files = [...new Set([opts.script, opts.spec, ...opts.with, ...bugs.map((b) => b.file)])];
  const env = specEnv(opts.env ?? []);
  const dir = stage(root, files, opts.spec);
  try {
    const startedAt = Date.now();
    const limitS = opts.timeout ?? BASELINE_TIMEOUT_S;
    const baseline = runSpec(dir, opts.spec, env, toMs(limitS));
    if (baseline.hung) {
      throw new Error(
        `baseline ran out of time: ${opts.spec} did not finish in ${limitS} s with no bug applied, so nothing can be graded; try a larger --timeout`,
      );
    }
    if (baseline.status !== 0) {
      throw new Error(
        `baseline is red: ${opts.spec} fails before any bug is applied\n${baseline.out}`,
      );
    }
    const deadlineMs = opts["bug-timeout"]
      ? toMs(opts["bug-timeout"])
      : bugDeadlineMs(Date.now() - startedAt);
    const script = readFileSync(join(dir, opts.script), "utf8");
    const rows = bugs.map((bug) => {
      const target = join(dir, bug.file);
      const original = readFileSync(target, "utf8");
      const applied = applyBug(bug, original);
      const row = {
        id: bug.id,
        contract: attribute(bug, original),
        why: bug.why,
        note: applied.note,
      };
      // Not a truthiness test: a bug may empty the whole file, which is still a bug applied.
      if (applied.source === undefined) return { ...row, result: "not-applied" };
      writeFileSync(target, applied.source);
      const run = runSpec(dir, opts.spec, env, deadlineMs, true);
      writeFileSync(target, original);
      const verdict = verdictOf(run);
      return { ...row, ...verdict, note: [row.note, verdict.note].filter(Boolean).join(", ") };
    });
    const count = (result) => rows.filter((r) => r.result === result).length;
    return {
      script: opts.script,
      spec: opts.spec,
      total: rows.length,
      caught: count("caught"),
      survived: count("survived"),
      noVerdict: count("no-verdict"),
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
  const label = {
    caught: "CAUGHT",
    survived: "SURVIVED",
    "no-verdict": "NO VERDICT",
    "not-applied": "NOT APPLIED",
  };
  for (const b of report.bugs) {
    const said = [b.note, b.caughtBy && `by: ${b.caughtBy}`].filter(Boolean).join(", ");
    const note = said ? ` (${said})` : "";
    console.log(
      `${label[b.result].padEnd(12)}${b.id.padEnd(28)}${b.contract.padEnd(20)}${b.why}${note}`,
    );
  }
  console.log(
    `caught ${report.caught} · survived ${report.survived} · no verdict ${report.noVerdict} · not applied ${report.notApplied} · of ${report.total}`,
  );
  if (report.candidate) {
    console.log(`candidate: ${report.candidate.contract} (${report.candidate.why})`);
  }
}

if (isMain(import.meta.url)) {
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
  const idsOf = (result) =>
    report.bugs
      .filter((b) => b.result === result)
      .map((b) => b.id)
      .join(", ");
  const missing = idsOf("not-applied");
  const ungraded = idsOf("no-verdict");
  if (missing) {
    console.error(
      `fitness-audit: NOT APPLIED ${missing}: rewrite these bugs against the current file; they still count against the spec`,
    );
  }
  if (ungraded) {
    console.error(
      `fitness-audit: NO VERDICT ${ungraded}: these were not graded and do not count as caught; re-run on a quieter machine or with a larger --bug-timeout, or rewrite a bug that does not compile`,
    );
  }
  if (missing || ungraded) process.exit(1);
}
