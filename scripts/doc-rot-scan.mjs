#!/usr/bin/env node
// Doc-rot fitness scan — the eye that checks whether the instruction files still describe reality.
//
// Instruction files are the intent layer every fresh session and every lane loads; when they drift
// they poison alignment SILENTLY (two live instances proved it: a stale persona-lore claim, a
// renamed-heading ghost in the structural map — PR #284). This eye catches the mechanically
// detectable classes of rot:
//   ① repo-relative file paths an instruction file cites that no longer exist
//   ② `npm run <script>` references naming scripts absent from package.json
//   ③ a stale structural map (STRUCTURE-graph.md's built-from commit > 50 commits or > 30 days
//     behind HEAD), and — degrading honestly — an UNKNOWN state when that commit is not reachable
//     from the checkout (a shallow fetch, a rewritten history) instead of a silent pass. Before
//     2026-09-26 an unreachable commit returned no finding, so a shallow clone always passed and the
//     days-only threshold called a map 1,862+ commits behind "fresh" at day 29 (#3769 slice 1, the
//     lousy-agents lesson "degrade honestly: a missing input is a named state, never a quiet pass").
//   ④ a line cite (`path:N`, `path:N-M`, `path:N,M`) into a file that exists but has fewer lines
//     than the cite names — the code moved, and the pointer now lands on nothing.
//   ⑤ a `claude-<family>-…` model ID that no code runs. The set of IDs in use is DERIVED, never
//     hand-kept: `git grep` over src/, scripts/ and .github/workflows/, the places that actually
//     call a model. A list of "current IDs" kept for this scan would be one more fact to go stale.
//     The cost, said plainly: an ID one generation behind that the code ALSO still pins passes —
//     part of the 2026-10-04 audit's 31 "model ID or effort default one generation behind"
//     findings. That half is a code fix or the model-read chore's, not this eye's.
// Semantic claims ("only Sauron carries lore", two files that disagree) are honestly OUT of scope —
// undetectable without a model; that residue goes to the model-read chore that #5318 slice 2 adds.
// Contracts: docs/plans/doc-rot-gate.md, issue #5318.
//
// Scope: every TRACKED instruction file — CLAUDE.md, README.md, .claude/**/*.md, .github prompts
// and templates, docs/**/*.md — minus LEDGERS, the one definition of "a record of its moment" (the
// fix-doc-rot chore defers to it rather than keeping a second list). That is wherever a session or lane reads
// instructions; the rot concentrates in .claude/**, the lane prompts and the docs subdirectories, not
// only at the top level. `git ls-files` rather than a directory walk, so nested worktrees
// (.claude/worktrees/) and local scratch never count; outside a git checkout the scan cannot know
// its surface and says so (exit 3), rather than passing on zero files.
//
// ①②④⑤ share one ratcheted budget and are advisory in CI (since 2026-08-29, Eric — see
// tests/arch/doc-rot.spec.ts) — pure doc-hygiene debt, the same class as arch-scan/dupe-scan/
// dead-scan. ③ is checked and reported SEPARATELY, on its own exit code, and never enters that
// ratchet (a binary "is it stale right now" fact doesn't suit a ratchet that only ever lowers).
// ③ was blocking until 2026-09-30 (#4074) on the claim that a stale map poisons blast-radius
// queries — false: `graphify affected` reads the live, git-ignored `graphify-out/`, never this
// committed snapshot. It failed on an ambient property of `main` (~50 commits/day), so it turned
// unrelated PRs red almost daily. Now advisory, like every other debt dimension (docs/COACHES.md →
// "A gate is a momentum breaker unless it protects a constraint"); exit codes 2/3 stay so the
// fixtures pin behavior.
//
// Squash-merge orphans the stamp: `graph:refresh` runs on a PR branch and stamps that branch's
// sha, which squash-merging drops. When the stamp is unreachable on a FULL clone, measure from the
// commit that landed the snapshot (`git log -1 -- docs/STRUCTURE-graph.md`). On a shallow clone
// that commit may be the graft boundary, so it stays UNKNOWN rather than undercount.
//
//   node scripts/doc-rot-scan.mjs             # every finding + enforce ①②④⑤(exit 1)/③(exit 2; exit 3 = unknown)
//   node scripts/doc-rot-scan.mjs --update    # rewrite doc-rot-budget.json for ①②④⑤ (ratchet: only lower)
//   node scripts/doc-rot-scan.mjs --candidate # highest-leverage ①②④⑤ finding as JSON (governor eye)
// The bare command lists every finding, uncapped: it is the one form .claude/settings.json
// pre-approves, so an unattended grind item can run it without a permission prompt.
//
// ①②④⑤ and ③ are all reported (advisory) in CI via tests/arch/doc-rot.spec.ts.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = process.cwd();
const BUDGET_FILE = join(ROOT, "doc-rot-budget.json");
const STALE_DAYS = 30;
/** Commits behind HEAD before the map is stale. A call, not a measurement: the only data point is
 *  the 170-commit drift ADR-0008 records and the 1,862+ found on 2026-09-26; the falsifier is a
 *  false red on `main` from this threshold within two weeks of landing (#3769). */
const STALE_COMMITS = 50;

/** Run git in the checkout; trimmed stdout, or null when git refuses (not a repo, no commits). */
function git(...args) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    }).trim();
  } catch {
    return null;
  }
}

// ---- scan surface ---------------------------------------------------------------------------------

/** Every tracked file, repo-relative — or null outside a git checkout. One list feeds the surface,
 *  bare-name resolution and the known top-level directories. */
function trackedFiles() {
  try {
    const out = execFileSync("git", ["ls-files", "-z"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 64 * 1024 * 1024,
    });
    return out.split("\0").filter((f) => f && existsSync(join(ROOT, f)));
  } catch {
    return null;
  }
}

/** What a session or a lane reads as instructions, wherever in the tree it lives. */
const INSTRUCTION_FILE =
  /^(CLAUDE\.md|README\.md|\.claude\/.+\.md|\.github\/prompts\/[^/]+\.md|\.github\/[^/]+\.md|\.github\/ISSUE_TEMPLATE\/[^/]+|docs\/.+\.md)$/;

/**
 * Records of their moment — each describes the day it was written, so a path that moved since is
 * history, not rot. Every entry is a path prefix. This is the ONE definition: the fix-doc-rot chore
 * sends no agent to a record, because a record is never on the surface.
 */
const LEDGERS = [
  "docs/research/",
  "docs/digests/",
  "docs/JOURNEYS/",
  "docs/vendor/",
  "docs/plans/",
  "docs/adr/0", // the numbered decision records; docs/adr/README.md is live
  "docs/LESSONS.md",
  "docs/IDEAS.md",
  "docs/GAMEBOARD-PLAN.md", // a dated tournament verdict
  "docs/ENGINEERING-AUDIT-2026-07.md", // a dated audit
  "docs/STRUCTURE-graph.md", // generated from one commit; check ③ owns its freshness
];
/** A template is what a lane copies next (`TEMPLATE.md`, `0000-template.md`), so it is read as an
 *  instruction file even inside a ledger directory. */
const TEMPLATE_FILE = /(^|\/)[^/]*template[^/]*\.md$/i;
const isLedger = (f) => !TEMPLATE_FILE.test(f) && LEDGERS.some((l) => f.startsWith(l));

function scanSurface(tracked) {
  return tracked.filter((f) => INSTRUCTION_FILE.test(f) && !isLedger(f));
}

// ---- check ①: dead file references ---------------------------------------------------------------

/** A cite rooted in one of these claims to be a repo path, as does one rooted in any other top-level
 *  directory the repo tracks today (`app/`, `e2e/`). Kept as a floor so a directory deleted whole
 *  still has its cites reported; `data/` is runtime state, untracked by design. */
const CORE_TOP_DIRS = ["src", "docs", "scripts", "tests", "data", ".claude", ".github"];

/** Candidate citations in a doc, raw: markdown-link targets + inline-code tokens. A code span that
 *  labels a link, as in [`synthesis.md`](https://…), is the link's text; the target is the citation. */
function citationTokens(body) {
  const refs = new Set();
  for (const m of body.matchAll(/\]\(([^)\s#]+)\)/g)) refs.add(m[1]);
  const prose = body.replace(/\[`[^`\n]*`\]\(/g, "](");
  for (const m of prose.matchAll(/`([^`\s]+)`/g)) refs.add(m[1]);
  return [...refs];
}

/** The line-number tail a cite may carry: `:137`, `:39-41`, `:313,430`, `:12:5` (line:column). */
const LINE_TAIL = /:([0-9]+(?:[-–,:][0-9]+)*)$/;

/**
 * Path-shaped with an extension, and not a glob, a placeholder or an env ref. A `$` is an env ref
 * only where it opens a path part (`$HOME/x.md`) or a `${…}`; mid-name it is a TanStack route
 * param (`app/src/routes/u.$id.thesis.tsx`), a real file.
 */
const NOT_A_PATH = /^[a-z]+:\/\/|[*{<>]|(^|\/)\$/i; // a URL · a glob or placeholder · an env ref
const isPathShaped = (r) => !NOT_A_PATH.test(r) && /^[\w.@/$-]+\.[a-z]{1,5}$/i.test(r);

/** Candidate repo paths in a doc, line anchors stripped. */
function pathRefs(body) {
  return [...new Set(citationTokens(body).map((r) => r.replace(LINE_TAIL, "")))].filter(
    isPathShaped,
  );
}

/**
 * A stand-in, never a citation: a path part that IS a metasyntactic word (`scripts/foo.mjs`,
 * `example.md`) or that opens with a digit template (`NNNN-short-title.md`, `XXXX`, `YYYY-MM-DD`).
 * A rule, not a list of today's false positives — an example written the conventional way is
 * ignored on day one. Whole parts only, so a real `progress-bar.tsx` that died is still reported.
 */
const STAND_IN_WORD = /^(foo|bar|baz|qux|example|sample|placeholder)$/i;
const TEMPLATE_RUN = /^(N{3,}|X{3,}|YYYY)(?=[-_.]|$)/;
const isPlaceholder = (ref) =>
  ref.split("/").some((part) => {
    const stem = part.replace(/\..*$/, "");
    return STAND_IN_WORD.test(stem) || TEMPLATE_RUN.test(part);
  });

/**
 * Every repo file a cite could mean: from the repo root, then from the citing file's own
 * directory, then — for a bare basename used as shorthand (`EYE.md`, `decomposer.md`) — any tracked
 * file of that name. Empty means dead. Liveness needs one match; a line check needs exactly one.
 */
function makeResolver(tracked) {
  const byName = new Map();
  for (const f of tracked) {
    const name = f.slice(f.lastIndexOf("/") + 1);
    byName.set(name, [...(byName.get(name) ?? []), f]);
  }
  return (ref, doc) => {
    if (existsSync(join(ROOT, ref))) return [ref];
    const fromDoc = relative(ROOT, resolve(ROOT, dirname(doc), ref));
    if (existsSync(join(ROOT, fromDoc))) return [fromDoc];
    return ref.includes("/") ? [] : (byName.get(ref) ?? []);
  };
}

/**
 * True when the COMMITTED ignore rules cover `ref` (a declared local/runtime artifact, not rot).
 * core.excludesFile is forced empty so a machine's global ignore file can't make the verdict differ
 * between environments — caught the hard way: a global rule made local say "ignored" while CI said
 * "rot". Only rules in the repo (committed .gitignore) count.
 */
function isGitIgnored(ref) {
  try {
    execFileSync("git", ["-c", "core.excludesFile=/dev/null", "check-ignore", "-q", ref], {
      cwd: ROOT,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false; // not ignored, or not a git repo — either way, judge by existence
  }
}

/**
 * Basenames of every file this history deleted (renames count: the old name is gone too) — or null
 * on a shallow clone, where the history is cut and the answer would undercount. CI's verify job
 * checks out with fetch-depth 0, so the set is the same there as on a dev machine.
 */
function deletedNames() {
  if (git("rev-parse", "--is-shallow-repository") === "true") return null;
  const out = git("log", "--no-renames", "--diff-filter=D", "--name-only", "--format=") ?? "";
  return new Set(
    out
      .split("\n")
      .filter(Boolean)
      .map((f) => f.slice(f.lastIndexOf("/") + 1)),
  );
}

function deadRefFindings(files, resolveRef, topDirs, deleted) {
  const findings = [];
  for (const doc of files) {
    const body = readFileSync(join(ROOT, doc), "utf8");
    for (const ref of pathRefs(body)) {
      if (resolveRef(ref, doc).length > 0) continue;
      // A ref covered by .gitignore is a DECLARED local/runtime artifact (settings.local.json, data
      // logs, build output) — absent in a fresh checkout by design, not rot. Checking the ignore
      // rules (committed) instead of the file keeps findings identical locally and in CI, where
      // ignored files don't exist. Caught the hard way: CI counted 12 to a local 11.
      if (isGitIgnored(ref) || isPlaceholder(ref)) continue;
      // Only flag refs that CLAIM to be repo files: rooted in a top-level directory the repo has, a
      // doc link (ends .md), or a bare name a file in this repo once carried (`decision-pager.tsx`,
      // deleted). Bare tool names (`biome.json` in another repo's context) would false-positive
      // without this.
      const once = !ref.includes("/") && deleted?.has(ref);
      if (topDirs.has(ref.split("/")[0]) || ref.endsWith(".md") || once) {
        findings.push({ kind: "dead-ref", doc, detail: ref });
      }
    }
  }
  return findings;
}

// ---- check ②: npm scripts that don't exist --------------------------------------------------------

/** `npm run x`, checked against the package the command targets: the root, or the one named by
 *  `cd <dir> && … && npm run x`, `npm --prefix <dir> run x` or `npm run x --prefix <dir>`. */
const NPM_RUN =
  /(?:cd ([\w./-]+) &&(?: [^&\n`]*? &&)* )?npm (?:--prefix ([\w./-]+) )?run ([a-z0-9:._-]+)(?: --prefix ([\w./-]+))?/gi;

function scriptsOf(dir) {
  const pkg = join(ROOT, dir, "package.json");
  if (!existsSync(pkg)) return new Set();
  return new Set(Object.keys(JSON.parse(readFileSync(pkg, "utf8")).scripts ?? {}));
}

function deadScriptFindings(files) {
  const byDir = new Map();
  const findings = [];
  for (const doc of files) {
    const body = readFileSync(join(ROOT, doc), "utf8");
    for (const m of body.matchAll(NPM_RUN)) {
      const dir = m[1] ?? m[2] ?? m[4] ?? ".";
      if (!byDir.has(dir)) byDir.set(dir, scriptsOf(dir));
      if (!byDir.get(dir).has(m[3])) {
        const where = dir === "." ? "" : ` (in ${dir}/)`;
        findings.push({ kind: "dead-script", doc, detail: `npm run ${m[3]}${where}` });
      }
    }
  }
  return findings;
}

// ---- check ④: line cites past the end of the file -------------------------------------------------

/** The last line a cite's tail names: `39-41` → 41, `313,430` → 430, `12:5` (line:column) → 12. */
function lastCitedLine(tail) {
  const [line, column] = tail.split(":");
  if (column !== undefined && !/[-–,]/.test(line)) return Number(line);
  return Math.max(...line.split(/[-–,]/).map(Number));
}

function lineCount(path) {
  const text = readFileSync(join(ROOT, path), "utf8");
  const lines = text.split("\n").length;
  return text.endsWith("\n") ? lines - 1 : lines;
}

function deadLineFindings(files, resolveRef) {
  const findings = [];
  for (const doc of files) {
    const body = readFileSync(join(ROOT, doc), "utf8");
    for (const token of citationTokens(body)) {
      const tail = token.match(LINE_TAIL);
      if (!tail) continue;
      const path = token.slice(0, tail.index);
      if (!isPathShaped(path)) continue;
      // A dead path is check ①'s finding; an ambiguous bare name (two `desk.ts`) can't be judged.
      const [target, ...others] = resolveRef(path, doc);
      if (!target || others.length > 0 || !statSync(join(ROOT, target)).isFile()) continue;
      const cited = lastCitedLine(tail[1]);
      const has = lineCount(target);
      if (cited > has) {
        findings.push({ kind: "dead-line", doc, detail: `${token} (${target} has ${has} lines)` });
      }
    }
  }
  return findings;
}

// ---- check ⑤: model IDs nothing runs ----------------------------------------------------------------

/**
 * One pattern, valid as both a JS RegExp and a POSIX ERE (for `git grep -E`). Version-shaped tails
 * only — numeric parts, a dated snapshot's date being one more — so a word after the ID
 * (`claude-opus-5-5-class`, `claude-fable-5-and-claude-mythos-5`) is never read as part of it.
 */
const MODEL_ID = "claude-(opus|sonnet|haiku|fable|mythos)-[0-9]+(-[0-9]+)*";
/** The JS side's guard: no match that starts mid-word or stops mid-version (`-5-5x`, `-5` of `-5-5`).
 *  POSIX leftmost-longest already gives git grep the whole version. */
const MODEL_ID_IN_PROSE = new RegExp(`\\b${MODEL_ID}(?!\\w|-[0-9])`, "g");
/** Where a model is actually called: the app, the scripts, the CI lanes. */
const MODEL_CODE_ROOTS = ["src", "scripts", ".github/workflows"];

/** The IDs some code path runs — or null when git cannot answer (the check then sits out). */
function modelIdsInUse() {
  try {
    const out = execFileSync("git", ["grep", "-ohE", MODEL_ID, "--", ...MODEL_CODE_ROOTS], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return new Set(out.split("\n").filter(Boolean));
  } catch (err) {
    return err.status === 1 ? new Set() : null; // 1 = no match: nothing runs any model
  }
}

function staleModelFindings(files, inUse) {
  if (!inUse) return [];
  const findings = [];
  for (const doc of files) {
    const body = readFileSync(join(ROOT, doc), "utf8");
    const named = new Set([...body.matchAll(MODEL_ID_IN_PROSE)].map((m) => m[0]));
    for (const id of named) {
      if (!inUse.has(id)) {
        findings.push({
          kind: "stale-model",
          doc,
          detail: `${id} — nothing in ${MODEL_CODE_ROOTS.join("/, ")}/ runs it`,
        });
      }
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
  // A squash-merged refresh leaves an orphaned stamp (see header): fall back to the commit that
  // landed the snapshot, but only on a full clone.
  let from = m[1];
  const reachable = git("cat-file", "-e", `${from}^{commit}`) !== null;
  if (!reachable && git("rev-parse", "--is-shallow-repository") === "false") {
    from = git("log", "-1", "--format=%h", "--", "docs/STRUCTURE-graph.md") || from;
  }
  const builtAt = git("show", "-s", "--format=%ct", from);
  const headAt = git("show", "-s", "--format=%ct", "HEAD");
  const commits = git("rev-list", "--count", `${from}..HEAD`);
  if (!(builtAt && headAt && commits !== null)) {
    // Degrade honestly: not a repo, or a commit this checkout cannot see (shallow fetch, rewritten
    // history). That is not "fresh" — it is unknown, and it gets its own exit code so a shallow CI
    // job cannot pass this check by accident.
    return [
      {
        kind: "unknown-graph",
        doc: "docs/STRUCTURE-graph.md",
        detail: `built from ${m[1]}, which this checkout cannot reach — freshness UNKNOWN, not fresh (a shallow fetch or a rewritten history); deepen the fetch or run \`npm run graph:refresh\``,
      },
    ];
  }
  const days = (Number(headAt) - Number(builtAt)) / 86_400;
  const behind = Number(commits);
  if (behind <= STALE_COMMITS && days <= STALE_DAYS) return [];
  return [
    {
      kind: "stale-graph",
      doc: "docs/STRUCTURE-graph.md",
      detail: `built from ${m[1]}${from === m[1] ? "" : ` (landed in ${from})`}, ${behind} commits and ${Math.floor(days)}d behind HEAD (max ${STALE_COMMITS} commits / ${STALE_DAYS}d) — refresh is manual`,
    },
  ];
}

// ---- report / enforce -----------------------------------------------------------------------------

const tracked = trackedFiles();
if (!tracked) {
  // Degrade honestly: with no index there is no surface, and zero files scanned is not "no rot".
  console.error("? not a git checkout — the scan reads tracked files (git ls-files); rot UNKNOWN");
  process.exit(3);
}
const files = scanSurface(tracked);
const resolveRef = makeResolver(tracked);
const topDirs = new Set([
  ...CORE_TOP_DIRS,
  ...tracked.filter((f) => f.includes("/")).map((f) => f.split("/")[0]),
]);
const deleted = deletedNames();
const findings = [
  ...deadRefFindings(files, resolveRef, topDirs, deleted),
  ...deadScriptFindings(files),
  ...deadLineFindings(files, resolveRef),
  ...staleModelFindings(files, modelIdsInUse()),
];
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
  if (!deleted) {
    // A shallow clone cannot see deleted names, so its count is low; ratcheting to it would turn a
    // full clone (CI) red on rot that never changed.
    console.error(
      "? shallow clone — the count misses bare names of deleted files; deepen the fetch to --update",
    );
    process.exit(3);
  }
  const prev = Number.isFinite(budget.findings) ? budget.findings : debt;
  const next = { findings: Math.min(prev, debt) }; // ratchet down only
  writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`doc-rot-budget.json updated — findings=${next.findings} (only lowers).`);
  process.exit(0);
}

console.log("📜 Doc-rot scan — instruction files that no longer describe reality");
for (const f of findings) console.log(`  ${f.kind.padEnd(12)} ${f.doc} → ${f.detail}`);
console.log(`\n  findings: ${debt} across ${files.length} instruction files`);
if (!deleted) {
  console.log(
    "  ? shallow clone — bare names of deleted files went unchecked (history cut); the count is low",
  );
}

// Check ③, separately — see the header comment for why this doesn't join the ratchet. Distinct
// exit codes (2 stale, 3 unknown) so callers can tell it apart from "doc-hygiene debt grew".
const staleGraph = staleGraphFindings();
if (staleGraph.length > 0) {
  const [f] = staleGraph;
  console.error(`\n${f.kind === "unknown-graph" ? "?" : "✗"} ${f.detail}`);
  console.error(
    "Fix: `npm run graph:refresh` (graphify: `uv tool install graphifyy`), then commit the\n" +
      "regenerated docs/STRUCTURE-graph.md. Refresh is manual — no workflow does it (GH006).",
  );
  process.exit(f.kind === "unknown-graph" ? 3 : 2);
}
console.log("✓ structural graph is fresh.");

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
