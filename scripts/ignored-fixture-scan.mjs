#!/usr/bin/env node
// IGNORED-FIXTURE SCAN — fails when a spec names a fixture that git will not commit (#6470).
//
// WHY. On 2026-11-01 tests/arch/research-circuit-breaker.spec.ts read
// tests/fixtures/circuit-breaker/run-38985010210-opex-leg.log. `*.log` is in .gitignore, so the file
// sat on the laptop, the spec passed there, `git add` left the fixture behind without a word, and CI
// went red on a missing file. The fix renamed it to .txt. This makes that class fail locally first.
//
// HOW. Every path-shaped string literal in the spec trees' code is resolved the ways a spec uses
// one: from the repo root (`resolve("tests/fixtures/x")`, the app's root for app specs), and from
// the file's own folder (`new URL("./fixtures/x", import.meta.url)`, `join(__dirname, "x.log")`).
// Only a resolution that lands inside a spec tree counts: that is where a fixture lives, and where
// nobody expects an ignore rule to reach. Then `git check-ignore`, which answers from the index, so
// a fixture that is tracked (force-added, say) is never reported. It reads every ignore source this
// checkout has, global excludes included, because the question is "would git leave this out of a
// commit made here" — the reverse of doc-rot-scan's, which counts only the committed rules.
//
// WHAT IT MISSES, on purpose. A path built at runtime (`${name}.log`) has no literal to read, and a
// fixture outside the spec trees (a root `data/` file) is out of scope: string literals naming
// `data/…` are mostly expected values, not reads, and a scan that flagged them would be noise.
//
//   node scripts/ignored-fixture-scan.mjs          # report; exit 1 on any finding
//   node scripts/ignored-fixture-scan.mjs --json
//
// Enforced in CI and in local verify via tests/arch/ignored-fixture.spec.ts.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

/** Where specs and their fixtures live. A path resolved outside these is not a fixture here. */
export const SPEC_ROOTS = ["tests/", "e2e/", "app/tests/", "app/playwright/"];
const CODE = /\.(ts|tsx|mts|cts|js|mjs|cjs)$/;

// A quoted literal with no interpolation, no whitespace and no scheme: "a/b.log", './x.json'.
const LITERAL = /(["'`])([^"'`\s$\\]+)\1/g;
const PATH_SHAPED = (text) =>
  !/^[a-z][a-z0-9+.-]*:/i.test(text) && // no URL, no node: specifier
  !text.startsWith("/") &&
  !text.startsWith("~") &&
  !text.startsWith("@") &&
  (text.includes("/") || /\.[A-Za-z0-9]{1,8}$/.test(text));

/** Every path-shaped literal in one file's source, with its 1-based line. */
export function pathLiterals(source) {
  const out = [];
  const lines = source.split("\n");
  lines.forEach((text, i) => {
    for (const match of text.matchAll(LITERAL)) {
      if (PATH_SHAPED(match[2])) out.push({ literal: match[2], line: i + 1 });
    }
  });
  return out;
}

const inSpecRoot = (path) => SPEC_ROOTS.some((root) => path.startsWith(root));

/**
 * The repo-relative path a literal in `file` names, when it has a fixture's shape: a leading ./ or
 * ../ is relative to the file; a leading spec root (`tests/…`) is from the repo root, or the app's
 * for an app spec; a leading `fixtures/` is beside the file, as in `join(here, "fixtures/x.log")`.
 * A bare name is left alone: in specs it is nearly always a file the spec writes into its own temp
 * folder (`curl.log`) or an expected value (`data/allowlist.json`), and the first run of this scan
 * flagged 70 of those and no fixture.
 */
export function resolutions(file, literal) {
  const toPosix = (p) => normalize(p).split("\\").join("/");
  let path = null;
  if (
    literal.startsWith("./") ||
    literal.startsWith("../") ||
    /^(__)?fixtures(__)?\//.test(literal)
  ) {
    path = toPosix(join(dirname(file), literal));
  } else if (inSpecRoot(literal) || (file.startsWith("app/") && inSpecRoot(`app/${literal}`))) {
    path = toPosix(
      file.startsWith("app/") && !literal.startsWith("app/") ? join("app", literal) : literal,
    );
  }
  return path && !path.startsWith("..") && inSpecRoot(path) ? [path] : [];
}

/** Of these repo-relative paths, the ones git would leave out of a commit, each with its rule. */
export function ignoredOf(paths, { cwd = process.cwd(), run = execFileSync } = {}) {
  if (!paths.length) return new Map();
  let out = "";
  try {
    // --verbose --non-matching prints one line per path: "<source>:<line>:<pattern>\t<path>", or
    // "::\t<path>" when nothing matches. Exit 1 only means "none ignored".
    out = run("git", ["check-ignore", "--stdin", "--verbose", "--non-matching"], {
      cwd,
      input: `${paths.join("\n")}\n`,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (error) {
    if (error.status !== 1) throw error;
    out = error.stdout ?? "";
  }
  const ignored = new Map();
  for (const row of out.split("\n")) {
    const tab = row.indexOf("\t");
    if (tab < 0) continue;
    const rule = row.slice(0, tab);
    if (rule !== "::") ignored.set(row.slice(tab + 1), rule);
  }
  return ignored;
}

/** Every spec-tree literal that names an ignored, untracked path. */
export function scan({ cwd = process.cwd(), run = execFileSync } = {}) {
  const files = run("git", ["ls-files", "-z", "--", ...SPEC_ROOTS], { cwd, encoding: "utf8" })
    .split("\0")
    .filter((f) => CODE.test(f));
  const sites = [];
  for (const file of files) {
    for (const { literal, line } of pathLiterals(readFileSync(join(cwd, file), "utf8"))) {
      for (const path of resolutions(file, literal)) sites.push({ file, line, literal, path });
    }
  }
  const ignored = ignoredOf([...new Set(sites.map((s) => s.path))], { cwd, run });
  return sites.filter((s) => ignored.has(s.path)).map((s) => ({ ...s, rule: ignored.get(s.path) }));
}

function main() {
  const findings = scan();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(findings, null, 2));
  } else if (!findings.length) {
    console.log("ignored-fixture-scan: no spec names a fixture git would leave out of a commit.");
  } else {
    console.error("✗ ignored-fixture-scan — a spec names a fixture git will not commit:");
    for (const f of findings) {
      console.error(`  ${f.file}:${f.line}  "${f.literal}" → ${f.path}  (ignored by ${f.rule})`);
    }
    console.error(
      "\nThe spec passes here and fails on a clean checkout. Rename the fixture out of the rule (the\n" +
        "2026-11-01 one became .txt), or un-ignore its folder in .gitignore, then commit it.",
    );
  }
  process.exitCode = findings.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main();
