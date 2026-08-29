#!/usr/bin/env node
// Autonomous-lane envelope gate — the MECHANICAL half of what used to be a paragraph. A rule a
// model can talk itself past has to be enforced, not requested; this is the trade: enforce the
// genuinely irreversible list with a red check no prompt can argue with, and the prompt's default
// becomes BUILD. Scope is narrow — enforces ONLY on an autonomous lane branch (envelope.json
// `lanes`); off-lane it prints one line and exits 0. Enforced via tests/arch/envelope.spec.ts, so
// it rides the existing `verify` job — no workflow file touched, so this lands as an ordinary PR.
//
//   node scripts/envelope-scan.mjs             # enforce for the current branch (exit 1 on breach)
//   node scripts/envelope-scan.mjs --list      # print the protected list (no git, always exit 0)
//   node scripts/envelope-scan.mjs --check <paths...>   # is this path protected? JSON, exit 0
//   node scripts/envelope-scan.mjs --check <paths...> --base origin/main   # + real diff-aware
//       `blocking` is what to act on — false on a diffAware rule whose diff is safe (envelope.json's
//       $diffAwareComment); a cleared entry also carries WHICH proof cleared it as `reason`.
//   node scripts/envelope-scan.mjs --lane feedback/9 --base origin/main   # explicit, for specs
// suiteRunnerArgv, behaviorVerifiedFacts, and exemptionReason (#852) live in envelope-behavior.mjs;
// classifyStructuralWidening (#716/#858, a safe token-level widening) lives in envelope-widening.mjs.
// Both split out to stay under the line budget, re-exported here so importers keep working.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { behaviorVerifiedFacts, exemptionReason, suiteRunnerArgv } from "./envelope-behavior.mjs";
import { classifyStructuralWidening, MUTATING_CALL_PATTERNS } from "./envelope-widening.mjs";

export { behaviorVerifiedFacts, classifyStructuralWidening, suiteRunnerArgv };

const ROOT = process.cwd();
const MANIFEST = join(ROOT, "envelope.json");

const argOf = (flag) => {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
};
const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();

// Manifest load is lazy (readManifest(), called from main()), so this file can be `import`ed for
// its pure functions (classifyDiff, breachOf, ...) by specs without running CLI side effects.
function readManifest() {
  // Fail CLOSED and loudly on a missing manifest: an unreadable envelope must never degrade to "no
  // protected paths", which is exactly how a gate silently disarms itself (docs/LESSONS.md).
  if (!existsSync(MANIFEST)) {
    console.error(
      "✗ envelope.json is missing — the envelope cannot be verified. Refusing to pass.",
    );
    process.exit(1);
  }
  return JSON.parse(readFileSync(MANIFEST, "utf8"));
}

// Module-level so breachOf's default param and --list/--check keep working without threading the
// manifest through every call; populated by main() before use. A spec importing this module for its
// pure functions (classifyDiff, breachOf with an explicit protectedRules arg) never touches these.
let manifest = {};
let rules = [];

const REGEX_META = [".", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "]", "\\", "/"];

/** Glob → RegExp. Supports `dir/**`, `**‍/name*`, `*` within one segment, and exact paths. */
export function globToRegExp(pattern) {
  let out = "";
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === "*") {
      if (pattern[i + 1] === "*") {
        // `**/` matches zero or more leading segments; a trailing `**` matches the rest.
        if (pattern[i + 2] === "/") {
          out += "(?:.*/)?";
          i += 2;
        } else {
          out += ".*";
          i += 1;
        }
      } else {
        out += "[^/]*";
      }
      // Regex metacharacters, escaped one by one. Listed as chars rather than a class so the
      // intent stays readable; `$` and `{` are here as literals, never as a placeholder.
    } else if (REGEX_META.includes(c)) {
      out += `\\${c}`;
    } else {
      out += c;
    }
  }
  return new RegExp(`^${out}$`);
}

/** The rule a path breaches, or null. Pure — the specs drive this directly. */
export function breachOf(path, protectedRules = rules) {
  return protectedRules.find((r) => globToRegExp(r.pattern).test(path)) ?? null;
}

/** Runtime dependencies added relative to the base's package.json. Pure, for the specs. */
export function addedRuntimeDeps(basePkgJson, headPkgJson) {
  const base = Object.keys(JSON.parse(basePkgJson || "{}").dependencies ?? {});
  const head = Object.keys(JSON.parse(headPkgJson || "{}").dependencies ?? {});
  return head.filter((d) => !base.includes(d));
}

// A diffAware protected file is exempt ONLY when both hold (see $diffAwareComment in envelope.json):
// (1) pure insertion — no existing line removed/changed; (2) no newly added line adds a new
// mutating broker call (MUTATING_CALL_PATTERNS, above) — a new order-mutating capability stays gated.

/** Pure — the specs drive this directly. `diffText` is `git diff`'s unified-diff output for one
 *  file (any base..head form); returns null (not "false") when there is no diff at all, since "no
 *  change" and "an unsafe change" must never look the same to a caller deciding whether to hold. */
export function classifyDiff(diffText) {
  if (diffText === null || diffText === undefined) return null;
  const lines = diffText.split("\n");
  const removed = lines.filter((l) => l.startsWith("-") && !l.startsWith("---"));
  const added = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++"));
  if (removed.length === 0 && added.length === 0) return null; // no actual change to this path
  const pureInsertion = removed.length === 0;
  const addsNewMutatingCall = added.some((l) => MUTATING_CALL_PATTERNS.some((p) => p.test(l)));
  return {
    pureInsertion,
    addsNewMutatingCall,
    additiveSafe: pureInsertion && !addsNewMutatingCall,
  };
}

/** `git diff <base>..HEAD -- <path>` — null (not "") on any git failure, so a broken diff reads as
 *  "unknown", never as "no change" (classifyDiff already treats "" specially; a git error is worse
 *  than that and must fail toward "still gated", not toward "additive"). */
function diffFor(path, base) {
  try {
    return git("diff", `${base}..HEAD`, "--", path);
  } catch {
    return null;
  }
}

// exemptionReason (imported above, #852) adds a third additiveSafe:true path — a passing invariant
// suite untouched by the diff — alongside pure insertion and safe structural widening below.

// --check: is this path (or these paths) protected? JSON out, always exit 0 — the build session
// asks this BEFORE editing, learning the answer from the gate rather than guessing at a prose list.
// --check --base <ref>: additionally answers whether a real diff against that ref EXEMPTS a
// diffAware rule — `blocking` is what a caller should act on; `protected` stays the raw membership
// answer (protected == blocking when a rule has no diffAware, so old callers keep today's behavior).
function runCheck() {
  const checkBase = argOf("--base");
  const paths = process.argv
    .slice(process.argv.indexOf("--check") + 1)
    .filter((a, i, arr) => !a.startsWith("--") && arr[i - 1] !== "--base");
  const out = paths.map((path) => {
    const rule = breachOf(path);
    if (!rule) return { path, protected: false, blocking: false };
    let entry = { path, protected: true, pattern: rule.pattern, why: rule.why, blocking: true };
    if (checkBase && rule.diffAware) {
      const diff = classifyDiff(diffFor(path, checkBase));
      // diff === null: no actual change to this path (or an unreadable diff) — never exempt on
      // "couldn't tell", only on a diff we positively classified as safe. Cheapest check first;
      // exemptionReason only reaches behaviorVerified (a process spawn) when the first two miss.
      const reason = exemptionReason(path, checkBase, rule, diff);
      entry = { ...entry, additiveSafe: reason !== undefined, ...(reason ? { reason } : {}) };
      entry.blocking = !entry.additiveSafe;
    }
    return entry;
  });
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

function runList() {
  console.log("🛡 Autonomous-lane envelope — protected paths (envelope.json)\n");
  for (const r of rules) {
    const mark = r.diffAware ? " [diffAware]" : "";
    const suite = r.invariantSuite ? ` [suite: ${r.invariantSuite}]` : "";
    console.log(`  ${r.pattern.padEnd(42)} ${r.why}${mark}${suite}`);
  }
  console.log(
    `\n  new runtime dependencies: ${manifest.allowNewRuntimeDeps ? "allowed" : "PROTECTED (devDependencies stay open)"}`,
  );
  console.log(`\n${manifest.$openOnPurpose ?? ""}`);
  process.exit(0);
}

// Which branch are we on? GITHUB_HEAD_REF FIRST and deliberately: on a PR, actions/checkout
// leaves a detached HEAD at the merge ref, so `rev-parse --abbrev-ref HEAD` answers "HEAD" and
// would skip every lane in CI. The local branch is only the fallback, for a developer running
// this by hand. `--lane` overrides both — pass it whenever cwd is not the branch you mean (a
// spec's temp repo inherits the outer PR's GITHUB_HEAD_REF otherwise, and silently skips).
function resolveBranch() {
  const explicit = argOf("--lane") ?? process.env.GITHUB_HEAD_REF ?? "";
  if (explicit) return explicit;
  try {
    return git("rev-parse", "--abbrev-ref", "HEAD");
  } catch {
    return "";
  }
}

/** New RUNTIME deps in package.json since mergeBase, as breach entries — [] when none or unknown. */
function runtimeDepBreaches(changed, mergeBase) {
  if (manifest.allowNewRuntimeDeps || !changed.includes("package.json")) return [];
  let added = [];
  try {
    added = addedRuntimeDeps(
      git("show", `${mergeBase}:package.json`),
      readFileSync(join(ROOT, "package.json"), "utf8"),
    );
  } catch {
    /* a package.json absent from the base is a new file — the path rules already cover the rest */
  }
  return added.map((dep) => ({
    path: `package.json → dependencies.${dep}`,
    pattern: "dependencies",
    why: "a new RUNTIME dependency ships to production and to members (supply chain); devDependencies stay open",
  }));
}

function reportAndExit(lane, branch, changed, breaches, exempted) {
  console.log(
    `🛡 Envelope scan — lane '${lane}' branch '${branch}', ${changed.length} changed file(s)`,
  );
  if (exempted.length) {
    console.log(
      `\nℹ diffAware exemption (pure insertion, a safe structural widening — e.g. a union\n` +
        `  gaining a member — or a passing invariant suite untouched by the diff) on:\n` +
        exempted.map((e) => `  ${e.path} — ${e.reason}`).join("\n"),
    );
  }
  if (!breaches.length) {
    console.log("\n✓ nothing in the protected envelope was touched.");
    process.exit(0);
  }
  console.error(`\n✗ ${breaches.length} change(s) breach the autonomous-lane envelope:`);
  for (const b of breaches) console.error(`  ${b.path}\n      ↳ ${b.why}  (rule: ${b.pattern})`);
  console.error(
    "\nThis is not a bug to work around — it is the one class that stays Eric's.\n" +
      "Drop these files from the branch and ship the rest, then say this on the issue:\n\n" +
      `  "Built everything outside the protected envelope. The remainder touches ${breaches[0].why} —\n` +
      "   that stays Eric's call, so it waits.\" — then apply `needs-eric` and stop.\n\n" +
      "Never edit envelope.json to make this pass; a lane widening its own envelope is the failure.",
  );
  process.exit(1);
}

function runLaneScan(branch, lane) {
  // On a lane, an unresolvable base is a HARD failure, not a skip: "couldn't diff" must never read
  // as "nothing protected changed".
  const base = argOf("--base") ?? `origin/${process.env.GITHUB_BASE_REF || "main"}`;
  let changed;
  let mergeBase;
  try {
    mergeBase = git("merge-base", base, "HEAD");
    changed = git("diff", "--name-only", `${mergeBase}..HEAD`).split("\n").filter(Boolean);
  } catch (error) {
    console.error(
      `✗ envelope scan: cannot diff '${branch}' against '${base}' — ${error.message}\n` +
        "  On a lane branch this is a hard stop: an unverifiable envelope is not a passing one.\n" +
        "  Fetch the base (git fetch origin main) and re-run.",
    );
    process.exit(1);
  }

  const breaches = [];
  const exempted = [];
  for (const path of changed) {
    const rule = breachOf(path);
    if (!rule) continue;
    if (rule.diffAware) {
      const diff = classifyDiff(diffFor(path, mergeBase));
      const reason = exemptionReason(path, mergeBase, rule, diff);
      if (reason) {
        exempted.push({ path, reason });
        continue;
      }
    }
    breaches.push({ path, why: rule.why, pattern: rule.pattern });
  }
  breaches.push(...runtimeDepBreaches(changed, mergeBase));

  reportAndExit(lane, branch, changed, breaches, exempted);
}

function main() {
  manifest = readManifest();
  rules = manifest.protected ?? [];

  if (process.argv.includes("--check")) return runCheck();
  if (process.argv.includes("--list")) return runList();

  const branch = resolveBranch();
  const lanes = manifest.lanes ?? [];
  const lane = lanes.find((l) => branch.startsWith(l));
  if (!lane) {
    console.log(
      `· envelope scan: '${branch || "(unknown branch)"}' is not an autonomous lane — skipped.`,
    );
    process.exit(0);
  }
  runLaneScan(branch, lane);
}

// Only run the CLI when this file is executed directly (node scripts/envelope-scan.mjs ...), never
// when imported as an ES module (tests/arch/envelope.spec.ts imports classifyDiff directly) —
// matches the established pattern in digest-scan.mjs, ci-medic.mjs, comms-scan.mjs, etc.
if (import.meta.url === `file://${process.argv[1]}`) main();
