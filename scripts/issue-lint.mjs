#!/usr/bin/env node
// Issue lint — the capsule contract as a pure, testable linter (docs/ISSUES.md).
//
//   node scripts/issue-lint.mjs body.md                    # lint a body file
//   node scripts/issue-lint.mjs --title "…" body.md        # lint the title too
//   node scripts/issue-lint.mjs --stdin                    # lint a body on stdin
//   node scripts/issue-lint.mjs --json body.md             # findings as JSON (specs, tooling)
//   node scripts/issue-lint.mjs --audit                    # live adoption report (needs GITHUB_TOKEN)
//
// WHY: the PR surface has a template, a guide and a gate; the issue surface had none of the three,
// and the 2026-08-21 corpus shows exactly that delta — 1/71 issues carry a fold, 0/71 a picture,
// while the last 60 PRs are 100% folded. Format compliance tracks enforcement, never willingness
// (the 2026-08-20 hat-team finding), so the grammar ships with its check.
//
// WHO IT BINDS: Claude-authored bodies, before filing. NEVER a member's raw note — taxing the
// reporter is the one move Zimmermann's bug-report research rules out (docs/ISSUES.md).
//
// Dependency-free (node built-ins). Loud-failure doctrine: an unreadable input is an error.
import { readFileSync } from "node:fs";

/** ~one phone screen at 390px. Above this, the reader scrolls before knowing whether to care. */
export const MAX_ABOVE_FOLD = 1200;
/** Same ceiling ship.sh checkbody puts on PR summary bullets — one short line each. */
export const MAX_BULLET = 120;
/** Advisory: GitHub truncates longer titles in mobile list views. */
export const TITLE_SCAN_BUDGET = 80;
/** Fatal: past this a title is a paragraph, not a summary. */
export const MAX_TITLE = 120;
/** A repeated block this long is a paste accident, never a coincidence (#455 doubled its
 *  entire note; a duplicated table or boilerplate line stays under it). */
const DUP_BLOCK_MIN = 80;

const STABLE_MERMAID = new Set([
  "flowchart",
  "graph",
  "sequenceDiagram",
  "stateDiagram-v2",
  "erDiagram",
  "classDiagram",
  "pie",
  "gantt",
  "timeline",
]);

// Google's named bad-description examples, plus the ones this repo has actually seen.
const VAGUE_TITLES = [
  "fix bug",
  "fix build",
  "add patch",
  "phase 1",
  "update",
  "updates",
  "improvement",
  "improvements",
  "cleanup",
  "misc",
  "changes",
];

/** Everything before the first fold — what a human sees without clicking. */
export function aboveFold(body) {
  const at = body.indexOf("<details");
  return at === -1 ? body : body.slice(0, at);
}

/** Mermaid diagram types declared in the body, in order. */
function mermaidTypes(body) {
  return [...body.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)]
    .map((m) =>
      m[1]
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l && !l.startsWith("%%")),
    )
    .filter(Boolean)
    .map((first) => first.split(/\s+/)[0]);
}

/** Paragraph blocks repeated verbatim — #455 filed its entire note twice (a paste accident the
 *  reader has to diff by hand to notice). */
function duplicateBlocks(body) {
  const seen = new Map();
  const dups = [];
  for (const raw of body.split(/\n\s*\n/)) {
    const block = raw.replace(/\s+/g, " ").trim();
    if (block.length < DUP_BLOCK_MIN) continue;
    if (seen.has(block)) {
      if (!dups.includes(block)) dups.push(block);
    } else seen.set(block, true);
  }
  return dups;
}

function hasPicture(body) {
  return /!\[|<img |```mermaid|^\|.+\|$/m.test(body);
}

/** The wall: a long body with no fold, or a fold that comes after the scroll. */
function checkFold(text, problems) {
  const top = aboveFold(text);
  if (text.length > MAX_ABOVE_FOLD && !text.includes("<details")) {
    problems.push(
      `body is ${text.length} chars with no fold — put the brief in <details> and keep ≤${MAX_ABOVE_FOLD} above it (docs/ISSUES.md)`,
    );
  } else if (top.length > MAX_ABOVE_FOLD) {
    problems.push(
      `${top.length} chars above the fold (max ${MAX_ABOVE_FOLD}) — the one-line ask, a table, and 2–4 talking points fit; the rest belongs below`,
    );
  }
}

/** Talking points are one short line each — the same ceiling ship.sh puts on PR summary bullets. */
function checkBullets(text, problems) {
  for (const line of aboveFold(text).split("\n")) {
    const bullet = /^\s*[-*] (.+)$/.exec(line);
    if (bullet && line.trim().length > MAX_BULLET) {
      problems.push(
        `talking point over ${MAX_BULLET} chars — one short line each: "${bullet[1].slice(0, 60)}…"`,
      );
    }
  }
}

/** Pictures that will not render, and URLs that will not survive the branch's deletion. */
function checkMedia(text, problems) {
  for (const type of mermaidTypes(text)) {
    if (!STABLE_MERMAID.has(type)) {
      problems.push(
        `mermaid type "${type}" is not in the stable allowlist — a syntax error renders as the issue's opening frame (docs/PICTURES.md)`,
      );
    }
  }
  const rawUrls =
    text.match(/raw\.githubusercontent\.com\/[^/\s)]+\/[^/\s)]+\/([^/\s)]+)\//g) ?? [];
  for (const url of rawUrls) {
    if (!/\/[0-9a-f]{40}\/$/.test(url)) {
      problems.push(`raw URL is not SHA-pinned — branch URLs 404 at squash-merge: ${url}`);
    }
  }
}

/** Titles: empty calories fail; length past the scan budget is only a note. */
function checkTitle(title, problems, notes) {
  const t = title.trim();
  if (!t) return;
  if (t.length > MAX_TITLE) {
    problems.push(
      `title is ${t.length} chars (max ${MAX_TITLE}) — that is a paragraph; the summary is line one of the body`,
    );
  } else if (t.length > TITLE_SCAN_BUDGET) {
    notes.push(
      `title is ${t.length} chars — GitHub truncates past ~${TITLE_SCAN_BUDGET} in mobile list views`,
    );
  }
  // Word count is NOT checked: a machine-slug title ("[event-research] opex-2026-12-18") is terse
  // and perfectly informative. Only the empty-calorie titles fail.
  const bare = t
    .replace(/^\[[^\]]+\]\s*/, "")
    .toLowerCase()
    .replace(/[.!]+$/, "")
    .trim();
  if (VAGUE_TITLES.includes(bare)) {
    problems.push(
      `title "${t}" says nothing — a short imperative summary of the ask (Google's CL rule; "Fix bug" and "Phase 1" are their named anti-patterns)`,
    );
  }
}

/** Advisory only — taste is never gated, it is pointed at. */
function collectNotes(text, notes) {
  const top = aboveFold(text);
  if (!(hasPicture(text) || /^Picture: waived — .+/m.test(text))) {
    notes.push(
      "no picture — a table, a flowchart, or an explicit `Picture: waived — <reason>` line",
    );
  }
  const bullets = (top.match(/^\s*[-*] /gm) ?? []).length;
  if (bullets > 4) notes.push(`${bullets} talking points above the fold — 2–4 is the scan budget`);
  if (
    text.includes("<details") &&
    /needs-eric|blocked on|waiting on eric/i.test(text.slice(top.length))
  ) {
    notes.push("a blocker is mentioned only below the fold — blockers go above it, always");
  }
}

/**
 * Lint one issue. Returns `{ problems, notes }` — problems fail the gate (existence and honesty),
 * notes are advisory (taste is never gated).
 */
export function lintIssue({ title = "", body = "" } = {}) {
  const problems = [];
  const notes = [];
  const text = body.replace(/\r\n/g, "\n");

  if (!text.trim()) problems.push("empty body — an issue is a capsule, not a title");
  checkFold(text, problems);
  checkBullets(text, problems);
  for (const block of duplicateBlocks(text)) {
    problems.push(`paragraph appears twice verbatim — "${block.slice(0, 60)}…"`);
  }
  checkMedia(text, problems);
  checkTitle(title, problems, notes);
  collectNotes(text, notes);

  return { problems, notes };
}

// ── audit: what the live corpus actually looks like ───────────────────────────
/** Issues this contract does not judge: machine-filed, machine-read (the event-research lane). */
const AUTOMATION_TAG = /^\[(event-research)\]/i;

async function audit(repo) {
  // Node does not honour HTTPS_PROXY for global fetch; re-exec once with the env flag rather than
  // failing with a bare 401 behind a corporate/agent proxy.
  if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY) {
    const { spawnSync } = await import("node:child_process");
    const r = spawnSync(process.execPath, process.argv.slice(1), {
      env: { ...process.env, NODE_USE_ENV_PROXY: "1", NODE_NO_WARNINGS: "1" },
      stdio: "inherit",
    });
    process.exit(r.status ?? 1);
  }
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error(
      "issue-lint --audit: set GITHUB_TOKEN (read-only issues scope) to measure the corpus.",
    );
    process.exit(1);
  }
  const rows = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/issues?state=all&per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } },
    );
    if (!res.ok) {
      console.error(`issue-lint --audit: GitHub responded ${res.status}`);
      process.exit(1);
    }
    const batch = await res.json();
    if (!batch.length) break;
    rows.push(...batch);
  }
  const issues = rows.filter((r) => !r.pull_request);
  if (!issues.length) {
    console.log("issue-lint --audit: no issues found.");
    return;
  }
  const pct = (n) => `${Math.round((100 * n) / issues.length)}%`;
  const count = (f) => issues.filter((i) => f(i.body ?? "")).length;
  const human = issues.filter((i) => !AUTOMATION_TAG.test(i.title));
  const failing = human.filter(
    (i) => lintIssue({ title: i.title, body: i.body ?? "" }).problems.length,
  );
  console.log(`issue corpus: ${issues.length} issues on ${repo} (${human.length} human-facing)\n`);
  console.log(`  fold      ${pct(count((b) => b.includes("<details")))}`);
  console.log(`  picture   ${pct(count((b) => /!\[|<img |```mermaid/.test(b)))}`);
  console.log(`  table     ${pct(count((b) => /^\|.+\|$/m.test(b)))}`);
  console.log(`  headings  ${pct(count((b) => /^#{2,3} /m.test(b)))}`);
  console.log(
    `\n  ${failing.length}/${human.length} human-facing issues fail the capsule contract (docs/ISSUES.md).`,
  );
  for (const i of failing.slice(0, 8)) {
    console.log(
      `    #${i.number} — ${lintIssue({ title: i.title, body: i.body ?? "" }).problems[0]}`,
    );
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--audit")) {
    const at = argv.indexOf("--repo");
    await audit(at === -1 ? "ejclark/skynet-capital" : argv[at + 1]);
    return;
  }
  const json = argv.includes("--json");
  const titleAt = argv.indexOf("--title");
  const title = titleAt === -1 ? "" : (argv[titleAt + 1] ?? "");
  const file = argv.find((a, i) => !a.startsWith("--") && i !== titleAt + 1);

  let body;
  if (argv.includes("--stdin")) body = readFileSync(0, "utf8");
  else if (file) body = readFileSync(file, "utf8");
  else {
    console.error("issue-lint: pass a body file, or --stdin. See docs/ISSUES.md.");
    process.exit(1);
  }

  const { problems, notes } = lintIssue({ title, body });
  if (json) {
    console.log(JSON.stringify({ problems, notes }, null, 2));
    process.exit(problems.length ? 1 : 0);
  }
  for (const n of notes) console.log(`· ${n}`);
  for (const p of problems) console.error(`✗ ${p}`);
  if (problems.length) {
    console.error(
      `\n${problems.length} problem(s) — the issue is the capsule a human reads first (docs/ISSUES.md).`,
    );
    process.exit(1);
  }
  console.log("issue-lint: ✓ body satisfies the capsule contract.");
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
