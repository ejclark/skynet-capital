#!/usr/bin/env node
// Issue lint — the capsule contract as a pure, testable linter (docs/ISSUES.md).
//
//   node scripts/issue-lint.mjs body.md                    # lint a body file
//   node scripts/issue-lint.mjs --title "…" body.md        # lint the title too
//   node scripts/issue-lint.mjs --labels bug,idea body.md  # …and check the labels are registered
//   node scripts/issue-lint.mjs --stdin                    # lint a body on stdin
//   node scripts/issue-lint.mjs --json body.md             # findings as JSON (specs, tooling)
//   node scripts/issue-lint.mjs --audit                    # live adoption report (needs GITHUB_TOKEN)
//   node scripts/issue-lint.mjs --audit --all              # …naming every failing issue, not the top 8
//   node scripts/issue-lint.mjs --audit --fixture f.json   # audit a saved issue list, no network
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
import { AUDIT_LIST_LIMIT, audit, auditReport } from "./issue-lint-audit.mjs";
import { LABEL_NAMES } from "./postmaster-labels.mjs";

// Re-exported so callers of issue-lint.mjs keep the same public surface — the live-corpus audit
// itself (AUTOMATION_TAG, `audit`, `auditReport`) now lives in issue-lint-audit.mjs.
export { AUDIT_LIST_LIMIT, auditReport };

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

/** The vocabulary an issue's labels are checked against — one registry, shared with the lanes that
 *  apply them (scripts/postmaster-labels.mjs `LABELS`). */
const KNOWN_LABELS = new Set(LABEL_NAMES);

/**
 * Labels, and WARN is deliberate (#500's one open question, resolved advisory).
 *
 * A label nobody registered is usually a real defect — #461 and #462 carried `idea` where they
 * meant `handoff`, so two waiting handoffs appeared in no queue, no scan and no digest, and
 * nothing anywhere noticed. But members apply arbitrary labels through the GitHub UI, and failing
 * a lint because a human invented a useful new label would tax exactly the reporter this linter's
 * header says it must never tax. So it points, it does not gate — same as every other note here.
 */
function checkLabels(labels, notes) {
  const unknown = labels
    .map((l) => (typeof l === "string" ? l : (l?.name ?? "")))
    .filter((n) => n && !KNOWN_LABELS.has(n));
  if (!unknown.length) return;
  notes.push(
    `unregistered label${unknown.length === 1 ? "" : "s"} ${unknown.map((n) => `\`${n}\``).join(", ")} — ` +
      "no lane reads a label it does not know; register it in scripts/postmaster-labels.mjs LABELS or fix the name",
  );
}

/**
 * Lint one issue. Returns `{ problems, notes }` — problems fail the gate (existence and honesty),
 * notes are advisory (taste is never gated).
 *
 * `labels` is optional: a body linted before filing has none yet, and absent labels must read as
 * "not checked", never as "checked and clean".
 */
export function lintIssue({ title = "", body = "", labels } = {}) {
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
  if (Array.isArray(labels)) checkLabels(labels, notes);

  return { problems, notes };
}

// The live-corpus audit (`audit`, `auditReport`, `AUDIT_LIST_LIMIT`) lives in issue-lint-audit.mjs
// and is re-exported above; `lintIssue` is what it runs per issue.

/** The lint path's flags, parsed apart from the control flow that acts on them.
 *
 *  `labels` is `undefined` when `--labels` was not passed, never `[]`: a body linted before filing
 *  carries no labels yet, and "not checked" must never render as "checked and clean". */
function parseLintArgs(argv) {
  const flagValue = (flag) => {
    const at = argv.indexOf(flag);
    return at === -1 ? { at, value: undefined } : { at, value: argv[at + 1] };
  };
  const { at: titleAt, value: titleValue } = flagValue("--title");
  const { at: labelsAt, value: labelsValue } = flagValue("--labels");
  const valueArgs = new Set([titleAt + 1, labelsAt + 1].filter((i) => i > 0));

  return {
    json: argv.includes("--json"),
    stdin: argv.includes("--stdin"),
    title: titleValue ?? "",
    labels:
      labelsAt === -1
        ? undefined
        : (labelsValue ?? "")
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean),
    file: argv.find((a, i) => !(a.startsWith("--") || valueArgs.has(i))),
  };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--audit")) {
    const at = argv.indexOf("--repo");
    const repo = at === -1 ? "ejclark/skynet-capital" : argv[at + 1];
    const limit = argv.includes("--all") ? Number.POSITIVE_INFINITY : AUDIT_LIST_LIMIT;
    // --fixture scores a saved list with no network, the same seam feedback-scan.mjs uses so its
    // spec can drive the real CLI instead of a reimplementation of it.
    const fixture = argv[argv.indexOf("--fixture") + 1];
    if (argv.includes("--fixture") && fixture) {
      console.log(
        auditReport(JSON.parse(readFileSync(fixture, "utf8")), { repo, limit }).join("\n"),
      );
      return;
    }
    await audit(repo, { limit });
    return;
  }
  const { json, stdin, title, labels, file } = parseLintArgs(argv);

  let body;
  if (stdin) body = readFileSync(0, "utf8");
  else if (file) body = readFileSync(file, "utf8");
  else {
    console.error("issue-lint: pass a body file, or --stdin. See docs/ISSUES.md.");
    process.exit(1);
  }

  const { problems, notes } = lintIssue({ title, body, labels });
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
