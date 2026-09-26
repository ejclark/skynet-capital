// The friction ledger — one row per finding, written as docs/members/friction-ledger.md. The
// row shape is the plan's: member · journey/step · what · where file:line · severity · fix size ·
// judge. The judge cell is NOT a model call inside the crawl: it reads "pending (grind)" until a
// session runs docs/grind/journey-judge.instructions.md over the frames and fills it in.
//
// Rows are deduped across viewports (the same disabled Subscribe at phone and desktop is one row
// that says "phone · desktop"), and the header counts the eight dead ends the plan lists by the
// "dead end N" tag a journey file's `known_gap` carries — run 0's own falsifier: a missing number
// means the crawl is wrong, not the app.

import { writeFileSync } from "node:fs";

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

/** Merge findings that differ only by viewport; sort by member, then severity. */
export function foldRows(rows) {
  const byKey = new Map();
  for (const r of rows) {
    // A journey row (known gap · NEW · fixed?) is one per step; a probe or axe row is one per
    // member — the same footer on three steps, or `li:nth-child(n)` four times, is ONE finding.
    const journeyRow = ["known gap", "NEW", "fixed?"].includes(r.kind);
    const key = journeyRow
      ? [r.member, r.journey, r.step, r.kind, r.what].join("|")
      : [r.member, r.kind, normalizeWhat(r.what)].join("|");
    const seen = byKey.get(key);
    if (seen) {
      if (!seen.viewports.includes(r.viewport)) seen.viewports.push(r.viewport);
      const at = `${r.journey} · ${r.step}`;
      if (!seen.also.includes(at) && at !== `${seen.journey} · ${seen.step}`) seen.also.push(at);
    } else byKey.set(key, { ...r, viewports: [r.viewport], also: [] });
  }
  return [...byKey.values()].sort(
    (a, b) =>
      a.member.localeCompare(b.member) ||
      (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
      a.journey.localeCompare(b.journey) ||
      a.step.localeCompare(b.step),
  );
}

/** Timestamps, counts and `nth-child` indexes vary per render; the finding does not. */
function normalizeWhat(what) {
  return String(what)
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, "<time>")
    .replace(/:nth-child\(\d+\)/g, "")
    .replace(/\d+/g, "#");
}

const DEAD_ENDS = [1, 2, 3, 4, 5, 6, 7, 8];
const deadEndNumbers = (what) =>
  [...String(what).matchAll(/dead end (\d)/g)].map((m) => Number(m[1]));

/**
 * Which of the plan's eight dead ends are still open. Only a `known gap` row counts as found — a
 * `fixed?` row quotes the same `known_gap` text, so counting it would read 8/8 after a lift. A
 * dead end is `fixed` when some step tagged with it now passes and no step tagged with it still
 * fails (a dead end pinned on several steps is open until every one of them passes).
 */
export function countDeadEnds(rows) {
  const open = new Set();
  const passing = new Set();
  for (const r of rows) {
    const into = r.kind === "known gap" ? open : r.kind === "fixed?" ? passing : null;
    if (into) for (const n of deadEndNumbers(r.what)) into.add(n);
  }
  return {
    found: DEAD_ENDS.filter((n) => open.has(n)),
    missing: DEAD_ENDS.filter((n) => !open.has(n)),
    fixed: DEAD_ENDS.filter((n) => passing.has(n) && !open.has(n)),
  };
}

const cell = (s) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");

/**
 * @param {string} path
 * @param {object} run  {date, rows, steps, frames, contrast: boolean, members: string[]}
 */
export function writeLedger(path, run) {
  const rows = foldRows(run.rows);
  const { found, missing, fixed } = countDeadEnds(rows);
  const bySeverity = ["high", "medium", "low"].map(
    (s) => `${s} ${rows.filter((r) => r.severity === s).length}`,
  );
  const byKind = [...new Set(rows.map((r) => r.kind))]
    .map((k) => `\`${k}\` ${rows.filter((r) => r.kind === k).length}`)
    .join(" · ");

  const lines = [
    "# Friction ledger — the persona crawl's findings",
    "",
    `_Run ${run.date} (run 0 = the baseline before any lift). Written by \`scripts/crawl/run.mjs\`; never edited by hand — re-run the crawl. Frames: \`docs/shots/crawl-${run.date}/\`. Members: ${run.members.join(" · ")}._`,
    "",
    "## Headline",
    "",
    `- **${rows.length} findings** over ${run.steps} steps and ${run.frames} frames — ${bySeverity.join(" · ")}.`,
    `- **The eight dead ends the plan lists:** found ${found.length}/8 (${found.join(", ") || "none"})${missing.length ? ` — MISSING ${missing.join(", ")}: on run 0 the crawl is wrong, not the app; after a lift, check the fixed? list` : " — every one, as run 0 must"}.`,
    `- **Dead ends with a step now passing (\`fixed?\`):** ${fixed.length ? fixed.join(", ") : "none"}.`,
    `- Contrast + name/role pass: ${run.contrast ? "axe-core ran on every frame (colour-contrast and control-name rules only)" : "NOT RUN — @axe-core/playwright unavailable; no contrast rows below, and that is a gap in this run, not a clean page"}.`,
    `- By kind: ${byKind || "—"}.`,
    "- Judge: every row reads `pending (grind)` until `docs/grind/journey-judge.instructions.md` runs over the frames.",
    "",
    "## Rows",
    "",
    "| member | journey / step | what | where | severity | fix | judge |",
    "|---|---|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${cell(r.member)} | ${cell(`${r.journey} · ${r.step}`)} (${r.viewports.join(" · ")})${r.also.length ? ` +${r.also.length} more step${r.also.length === 1 ? "" : "s"}` : ""} | ${cell(r.what)} | ${cell(r.where)} | ${r.severity} | ${r.fix} | ${cell(r.judge)} |`,
    ),
    "",
    "## Reading the columns",
    "",
    "- **what** — a `known gap` row is a journey step whose EARS line the app cannot satisfy today (the step is `test.fail()` in `e2e/journeys.spec.ts`); a `NEW` row is a step that was expected to pass and did not; a `fixed?` row is a known gap whose expects all passed — remove its `known_gap` line, the spec is the ratchet. Every other kind is a DOM probe (`scripts/crawl/probes.mjs`) or an axe rule (`scripts/crawl/contrast.mjs`).",
    "- **where** — the journey file's own `where` when it names one, else the first fixed-string hit of the finding's text in `app/src` or `src` (`scripts/crawl/locate.mjs`); `—` means the string is built at runtime and the judge locates it by hand.",
    "- **severity** — high: blocks the journey or hides a reason a member needs; medium: sends the member the wrong way or repeats itself; low: a nit the redesign absorbs. **fix** — S: copy or a link; M: a component; L: a section or a new surface.",
    "",
  ];
  writeFileSync(path, lines.join("\n"));
  return { rows, found, missing, fixed };
}
