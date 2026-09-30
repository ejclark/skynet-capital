#!/usr/bin/env node
// fix-held.mjs — did each LESSONS fix hold? (#4062, slice 4 of #3955)
//
// docs/LESSONS.md banks ~90 lessons, each with a PREVENTION line, and nothing ever went back to ask
// whether the prevention worked. Recurrences were found by accident ("the deploy doom loop,
// thirteen more times"). This report keeps that score, so the "Did the fix hold?" loop in
// docs/process/LEARNING-LOOP.md has a number to check. Its prediction: gate-type preventions recur
// less than doctrine-only ones.
//
// WHAT A CLASS IS. One ledger entry is one root-cause class; its prevention type is read from the
// first clause of its PREVENTION line (gate/script → `mechanized`, else doctrine / ledger-only).
//
// WHAT COUNTS AS A RECURRENCE — two sources, both definitive, never guessed:
//   1. declared — a later entry carries `**RECURS:** <earlier entry's title>`. The /retro that
//      wrote it made the class judgment with the evidence in hand; this script only counts it.
//   2. named — a failed run on `main` (incident-scan's candidates) whose sha a lesson names on its
//      SHA/COVERS line, dated AFTER that lesson: the retro filed the new failure under the old class.
// A third list is shown and never counted: UNLEARNED runs on a workflow file that earlier lessons
// name are *possible* recurrences — leads for the /retro that will settle them, not a verdict.
//
// The live half shells out to `incident-scan.mjs --json` (REST core, one call) and degrades to the
// declared-only report with no token or no network, like the scan itself.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const PREVENTIONS = ["mechanized", "doctrine", "ledger-only", "unfixed", "unclassified"];

const DATE = /\*\*DATE:\*\*\s*(\d{4}-\d{2}-\d{2})/g;
const SHA7 = /\b[0-9a-f]{7}\b/g;
const WORKFLOW_FILE = /\b[\w-]+\.ya?ml\b/g;

/** The first clause of a PREVENTION line → its type. Mechanization wins over doctrine when a
 *  line names both ("gate + doctrine"): the gate is the stronger net, and the prediction is about
 *  whether having one helps. A clause naming neither is `unclassified` — shown, never guessed. */
export function preventionOf(line) {
  const head = (line ?? "")
    .replace(/[*_`]/g, "")
    .trim()
    .toLowerCase()
    .split(/ — |\. |:|\(/)[0]
    .slice(0, 80);
  if (/not yet fixed|^tracked on/.test(head)) return "unfixed";
  // Before the gate test: "ledger-only, deliberately not mechanized" names a gate it did NOT build.
  if (/^ledger/.test(head)) return "ledger-only";
  if (/\b(gates?|script|guard|mechani[sz]ed|mechanical|structural|structure|spec)\b/.test(head)) {
    return "mechanized";
  }
  if (/\bdoctrine\b|^doc-only/.test(head)) return "doctrine";
  return "unclassified";
}

/** A field's text: from `**NAME:**` to the next top-level bullet or blank line (fields wrap). */
function field(entry, name) {
  const m = entry.match(new RegExp(`\\*\\*${name}:\\*\\*([\\s\\S]*?)(?=\\n- \\*\\*|\\n\\n|$)`));
  return m ? m[1].trim() : null;
}

/** Every entry in the ledger as `{ title, date, shas, prevention, workflows, recurs }`. `date` is
 *  the LATEST date the entry carries (multi-incident entries list several), so a run is only
 *  called a recurrence when it came after everything the lesson already knew about. */
export function parseLessons(md) {
  const out = [];
  for (const chunk of md.split(/^### /m).slice(1)) {
    const title = chunk.split("\n")[0].trim();
    if (title === "<short title>") continue; // the format example in the header
    const dates = [...chunk.matchAll(DATE)].map((m) => m[1]).sort();
    const shaLines = [...chunk.matchAll(/\*\*(?:SHA|COVERS):\*\*[\s\S]*?(?=\n- \*\*|\n\n|$)/g)];
    const shas = new Set(shaLines.flatMap((m) => m[0].match(SHA7) ?? []));
    out.push({
      title,
      date: dates.at(-1) ?? null,
      shas: [...shas],
      prevention: preventionOf(field(chunk, "PREVENTION")),
      workflows: [...new Set(chunk.match(WORKFLOW_FILE) ?? [])],
      recurs: field(chunk, "RECURS"),
    });
  }
  return out;
}

const norm = (s) => s.replace(/[*_`]/g, "").replace(/\s+/g, " ").trim().toLowerCase();

/**
 * Cross-reference the ledger with itself (declared) and with incident-scan's failed runs (named /
 * possible). `runs` is `null` when the live half was unavailable. Each run is
 * `{ sha, date, name, path, learned }` — `path` is the workflow file, `.github/workflows/x.yml`.
 */
/** Declared recurrences: a later entry's `RECURS:` resolved to the earlier entry by exact title
 *  (or a unique-enough prefix). An unresolvable pointer is returned, never dropped. */
function declared(lessons) {
  const byTitle = new Map(lessons.map((l) => [norm(l.title), l]));
  const recurrences = [];
  const unresolved = [];
  for (const later of lessons.filter((l) => l.recurs)) {
    const want = norm(later.recurs);
    const earlier =
      byTitle.get(want) ?? lessons.find((l) => l !== later && norm(l.title).startsWith(want));
    if (!earlier || earlier === later) unresolved.push({ from: later.title, recurs: later.recurs });
    else recurrences.push({ lesson: earlier, via: "declared", by: later.title, date: later.date });
  }
  return { recurrences, unresolved };
}

/** Named recurrences (a run a lesson covers, dated after it) plus the unlearned runs by file. */
function matchRuns(lessons, runs) {
  const recurrences = [];
  const unlearnedByFile = new Map();
  for (const run of runs) {
    const owner = lessons.find((l) => l.shas.includes(run.sha));
    if (owner?.date && run.date > owner.date) {
      recurrences.push({
        lesson: owner,
        via: "named",
        by: `${run.sha} ${run.name}`,
        date: run.date,
      });
    }
    const file = (run.path ?? "").split("/").pop();
    if (owner || run.learned || !file) continue;
    unlearnedByFile.set(file, [...(unlearnedByFile.get(file) ?? []), run]);
  }
  return { recurrences, unlearnedByFile };
}

/** One lead list per workflow, not per run: a burst of 36 failures on one file is one question. */
function leadsByFile(lessons, unlearnedByFile) {
  const possible = [];
  for (const [file, fileRuns] of unlearnedByFile) {
    const first = fileRuns.map((r) => r.date).sort()[0];
    const leads = lessons
      .filter((l) => l.date && l.date < first && l.workflows.includes(file))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
    if (leads.length > 0) possible.push({ file, runs: fileRuns, leads });
  }
  return possible;
}

export function fixHeld({ lessons, runs }) {
  const { recurrences: claimed, unresolved } = declared(lessons);
  const { recurrences: named, unlearnedByFile } = matchRuns(lessons, runs ?? []);
  const recurrences = [...claimed, ...named];
  const possible = leadsByFile(lessons, unlearnedByFile);

  const byPrevention = Object.fromEntries(PREVENTIONS.map((p) => [p, { lessons: 0, recurred: 0 }]));
  const recurred = new Set(recurrences.map((r) => r.lesson));
  for (const l of lessons) {
    byPrevention[l.prevention].lessons++;
    if (recurred.has(l)) byPrevention[l.prevention].recurred++;
  }
  return {
    total: lessons.length,
    byPrevention,
    recurrences,
    possible,
    unresolved,
    live: runs !== null,
  };
}

const pct = (n, d) => (d === 0 ? "—" : `${Math.round((100 * n) / d)}%`);

export function renderMarkdown(report, today) {
  const lines = [
    `# Did the fix hold? — ${today}`,
    "",
    `${report.total} lessons in docs/LESSONS.md. A lesson recurred when a later entry declares`,
    "`RECURS:` it, or a failed run on main that it names came after it.",
    report.live
      ? ""
      : "\n_Live half skipped (no token or no network): declared recurrences only._\n",
    "| Prevention | Lessons | Recurred | Rate |",
    "|---|---|---|---|",
    ...PREVENTIONS.map((p) => {
      const c = report.byPrevention[p];
      return `| ${p} | ${c.lessons} | ${c.recurred} | ${pct(c.recurred, c.lessons)} |`;
    }),
    "",
    "## Recurrences",
    "",
  ];
  if (report.recurrences.length === 0) lines.push("None found.");
  for (const r of report.recurrences) {
    lines.push(
      `- **${r.lesson.title}** (${r.lesson.prevention}, ${r.lesson.date}) ← ${r.via}: ${r.by} (${r.date})`,
    );
  }
  if (report.possible.length > 0) {
    lines.push("", "## Possible recurrences — unlearned runs; confirm with /retro", "");
    for (const { file, runs, leads } of report.possible) {
      const shas = runs.map((r) => r.sha);
      const shown = shas.length > 6 ? `${shas.slice(0, 6).join(" ")} …` : shas.join(" ");
      lines.push(
        `- \`${file}\` — ${runs.length} unlearned run(s) (${shown}); earlier lessons on it:`,
      );
      for (const l of leads) lines.push(`  - ${l.title} (${l.prevention}, ${l.date})`);
    }
  }
  if (report.unresolved.length > 0) {
    lines.push("", "## RECURS lines that name no entry", "");
    for (const u of report.unresolved) lines.push(`- "${u.from}" → "${u.recurs}"`);
  }
  return `${lines.join("\n")}\n`;
}

/** incident-scan's failed runs, or `null` when its live half was skipped. */
function readRuns(days) {
  try {
    const out = execFileSync(
      process.execPath,
      [join(ROOT, "scripts/incident-scan.mjs"), "--json", "--days", String(days)],
      { encoding: "utf8", cwd: ROOT, stdio: ["ignore", "pipe", "ignore"] },
    );
    return JSON.parse(out).runs ?? null;
  } catch {
    return null;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const days = Number(args[args.indexOf("--days") + 1]) || 30;
  const lessons = parseLessons(readFileSync(join(ROOT, "docs/LESSONS.md"), "utf8"));
  const runs = args.includes("--offline") ? null : readRuns(days);
  const report = fixHeld({ lessons, runs });
  if (args.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else process.stdout.write(renderMarkdown(report, new Date().toISOString().slice(0, 10)));
  process.exit(report.unresolved.length > 0 ? 1 : 0);
}
