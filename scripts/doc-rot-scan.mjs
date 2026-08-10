#!/usr/bin/env node
// Doc-rot fitness scan — the eye that checks whether docs still describe reality.
//
// Docs are the intent layer every fresh session loads; when they drift they poison alignment
// SILENTLY (two live instances proved it: a stale persona-lore claim, a renamed-heading ghost in the
// structural map — PR #284). This eye catches the mechanically detectable classes of rot:
//   ① repo-relative file paths referenced in docs that no longer exist
//   ② `npm run <script>` references naming scripts absent from package.json
//   ③ a stale structural map (STRUCTURE-graph.md's built-from commit > 30 days behind HEAD)
// Semantic claims ("only Sauron carries lore") are honestly OUT of scope — undetectable without a
// model; that residue stays with the config-audit / self-correcting loop. Contract:
// docs/plans/doc-rot-gate.md.
//
//   node scripts/doc-rot-scan.mjs             # report + enforce (exit 1 if rot grew past budget)
//   node scripts/doc-rot-scan.mjs --update    # rewrite doc-rot-budget.json (ratchet: only lower)
//   node scripts/doc-rot-scan.mjs --candidate # highest-leverage finding as JSON (governor eye)
//
// Enforced in CI via tests/arch/doc-rot.spec.ts.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = process.cwd();
const BUDGET_FILE = join(ROOT, "doc-rot-budget.json");
const STALE_DAYS = 30;

// Scan surface (pre-settled fork in the plan): top-level docs + the root intent files. JOURNEYS/ and
// plans/ are historical records — they describe their moment, not the present, and rot honestly.
function scanSurface() {
  const files = ["CLAUDE.md", "README.md"].filter((f) => existsSync(join(ROOT, f)));
  const docsDir = join(ROOT, "docs");
  if (existsSync(docsDir)) {
    for (const e of readdirSync(docsDir, { withFileTypes: true })) {
      if (e.isFile() && e.name.endsWith(".md")) files.push(`docs/${e.name}`);
    }
  }
  return files;
}

// ---- check ①: dead file references ---------------------------------------------------------------

const TOP_DIRS = /^(src|docs|scripts|tests|data|\.claude|\.github)\//;

/** Candidate repo paths in a doc: markdown-link targets + inline-code path-shaped tokens. */
function pathRefs(body) {
  const refs = new Set();
  for (const m of body.matchAll(/\]\(([^)\s#]+)\)/g)) refs.add(m[1]);
  for (const m of body.matchAll(/`([^`\s]+)`/g)) refs.add(m[1]);
  return [...refs]
    .map((r) => r.replace(/:[0-9]+([-:][0-9]+)?$/, "")) // strip `path.ts:137` line anchors
    .filter((r) => !/^[a-z]+:\/\//i.test(r)) // URLs
    .filter((r) => !/[*{<>$]/.test(r)) // globs / placeholders / env refs
    .filter((r) => /^[\w.@/-]+\.[a-z]{1,5}$/i.test(r)) // path-shaped with an extension
    .filter(
      (r) => r.includes("/") || TOP_DIRS.test(`${r}/`) || existsSyncRoot(r) || r.endsWith(".md"),
    );
}
const existsSyncRoot = (r) => existsSync(join(ROOT, r));

/** True when the committed ignore rules cover `ref` (a declared local/runtime artifact, not rot). */
function isGitIgnored(ref) {
  try {
    execFileSync("git", ["check-ignore", "-q", ref], { cwd: ROOT, stdio: "ignore" });
    return true;
  } catch {
    return false; // not ignored, or not a git repo — either way, judge by existence
  }
}

function deadRefFindings(files) {
  const findings = [];
  for (const doc of files) {
    const body = readFileSync(join(ROOT, doc), "utf8");
    for (const ref of pathRefs(body)) {
      // A ref is live if it resolves from the repo root, relative to the doc's own directory, or —
      // for bare basenames used as prose shorthand ("log it to `IDEAS.md`") — from docs/.
      const fromRoot = join(ROOT, ref);
      const fromDoc = resolve(join(ROOT, dirname(doc)), ref);
      const fromDocs = ref.includes("/") ? null : join(ROOT, "docs", ref);
      if (existsSync(fromRoot) || existsSync(fromDoc) || (fromDocs && existsSync(fromDocs)))
        continue;
      // A ref covered by .gitignore is a DECLARED local/runtime artifact (settings.local.json, data
      // logs, build output) — absent in a fresh checkout by design, not rot. Checking the ignore
      // rules (committed) instead of the file keeps findings identical locally and in CI, where
      // ignored files don't exist. Caught the hard way: CI counted 12 to a local 11.
      if (isGitIgnored(ref)) continue;
      // Only flag refs that CLAIM to be repo files: rooted in a known top dir, or resolvable-looking
      // relative doc links (contain no scheme and end .md). Bare tool names (`biome.json` in another
      // repo's context) would false-positive without this.
      if (TOP_DIRS.test(ref) || ref.endsWith(".md")) {
        findings.push({ kind: "dead-ref", doc, detail: ref });
      }
    }
  }
  return findings;
}

// ---- check ②: npm scripts that don't exist --------------------------------------------------------

function deadScriptFindings(files) {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  const scripts = new Set(Object.keys(pkg.scripts ?? {}));
  const findings = [];
  for (const doc of files) {
    const body = readFileSync(join(ROOT, doc), "utf8");
    for (const m of body.matchAll(/npm run ([a-z0-9:._-]+)/gi)) {
      if (!scripts.has(m[1]))
        findings.push({ kind: "dead-script", doc, detail: `npm run ${m[1]}` });
    }
  }
  return findings;
}

// ---- check ③: stale structural map ----------------------------------------------------------------

function staleGraphFindings() {
  const graph = join(ROOT, "docs/STRUCTURE-graph.md");
  if (!existsSync(graph)) return [];
  const m = readFileSync(graph, "utf8").match(/Built from commit: `([0-9a-f]+)`/);
  if (!m) return [];
  const git = (...args) => {
    try {
      return execFileSync("git", args, {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return null; // not a repo / unknown sha — skip gracefully rather than false-flag
    }
  };
  const builtAt = git("show", "-s", "--format=%ct", m[1]);
  const headAt = git("show", "-s", "--format=%ct", "HEAD");
  if (!(builtAt && headAt)) return [];
  const days = (Number(headAt) - Number(builtAt)) / 86_400;
  return days > STALE_DAYS
    ? [
        {
          kind: "stale-graph",
          doc: "docs/STRUCTURE-graph.md",
          detail: `built from ${m[1]}, ${Math.floor(days)}d behind HEAD (max ${STALE_DAYS}d) — the graph-refresh workflow may be broken`,
        },
      ]
    : [];
}

// ---- report / enforce -----------------------------------------------------------------------------

const files = scanSurface();
const findings = [...deadRefFindings(files), ...deadScriptFindings(files), ...staleGraphFindings()];
const debt = findings.length;

if (process.argv.includes("--candidate")) {
  // Highest leverage = the doc with the most findings (the most-rotted intent surface).
  const byDoc = new Map();
  for (const f of findings) byDoc.set(f.doc, [...(byDoc.get(f.doc) ?? []), f]);
  const ranked = [...byDoc.entries()]
    .map(([doc, list]) => ({ file: doc, findings: list.map((f) => `${f.kind}: ${f.detail}`) }))
    .sort((a, b) => b.findings.length - a.findings.length);
  console.log(
    JSON.stringify({ candidate: ranked[0] ?? null, runnerUp: ranked[1] ?? null, debt }, null, 2),
  );
  process.exit(0);
}

const budget = existsSync(BUDGET_FILE)
  ? JSON.parse(readFileSync(BUDGET_FILE, "utf8"))
  : { findings: Number.POSITIVE_INFINITY };

if (process.argv.includes("--update")) {
  const prev = Number.isFinite(budget.findings) ? budget.findings : debt;
  const next = { findings: Math.min(prev, debt) }; // ratchet down only
  writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`doc-rot-budget.json updated — findings=${next.findings} (only lowers).`);
  process.exit(0);
}

console.log("📜 Doc-rot scan — docs that no longer describe reality");
for (const f of findings.slice(0, 15)) console.log(`  ${f.kind.padEnd(12)} ${f.doc} → ${f.detail}`);
if (debt > 15) console.log(`  … and ${debt - 15} more`);
console.log(`\n  findings: ${debt} across ${files.length} docs`);

const cap = budget.findings;
if (debt > cap) {
  console.error(`\n✗ doc rot grew: ${debt} > budget ${cap}.`);
  console.error(
    "Fix: update the doc to match reality (or the reference's target), then\n" +
      "`node scripts/doc-rot-scan.mjs --update`. Docs are the intent layer — stale intent\n" +
      "poisons every future session that loads it.",
  );
  process.exit(1);
}
console.log(`\n✓ doc rot within budget (${debt} ≤ ${cap}).`);
