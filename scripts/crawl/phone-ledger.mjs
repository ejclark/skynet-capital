// The phone ledger — docs/members/phone-ledger.md, written only by `npm run crawl --
// --phone-audit` and kept in its own file so a plain crawl's friction ledger (ledger.mjs) never
// changes and stays comparable with run 0 (#3807). One row per page · finding, with every
// member/step that hit it: the same control on the same page is one fix however many journeys
// pass it. The findings themselves come from phone.mjs.

import { writeFileSync } from "node:fs";

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

const cell = (s) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");

/** Fold crawl rows ({page, member, journey, step, kind, what, where, severity, fix}) per page·finding. */
export function foldPhoneRows(rows) {
  const byKey = new Map();
  for (const r of rows) {
    const key = [r.page, r.kind, r.what].join("|");
    const hit = `${r.journey.split(" ")[0]}·${r.step}`;
    const seen = byKey.get(key) ?? { ...r, hits: new Map() };
    const steps = seen.hits.get(r.member) ?? [];
    if (!steps.includes(hit)) steps.push(hit);
    seen.hits.set(r.member, steps);
    byKey.set(key, seen);
  }
  return [...byKey.values()].sort(
    (a, b) =>
      (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
      a.page.localeCompare(b.page) ||
      a.kind.localeCompare(b.kind) ||
      a.what.localeCompare(b.what),
  );
}

const hitsCell = (hits) =>
  [...hits]
    .map(([member, steps]) => {
      const shown = steps.slice(0, 3).join(", ");
      return `${member} (${shown}${steps.length > 3 ? ` +${steps.length - 3}` : ""})`;
    })
    .join(" · ");

/** @param {string} path  @param {{date: string, rows: object[], steps: number, pages: number}} run */
export function writePhoneLedger(path, run) {
  const rows = foldPhoneRows(run.rows);
  const count = (pred) => rows.filter(pred).length;
  const bySeverity = ["high", "medium", "low"].map((s) => `${s} ${count((r) => r.severity === s)}`);
  const byKind = [...new Set(rows.map((r) => r.kind))]
    .map((k) => `\`${k}\` ${count((r) => r.kind === k)}`)
    .join(" · ");
  const lines = [
    "# Phone ledger — the crawl's phone checks",
    "",
    `_Run ${run.date}, \`npm run crawl -- --phone-audit\` at 390×844. Written by \`scripts/crawl/run.mjs\` (checks in \`scripts/crawl/phone.mjs\`); never edited by hand — re-run the crawl, or \`npm run phone -- <path>\` for one page._`,
    "",
    "## Headline",
    "",
    `- **${rows.length} findings** over ${run.pages} phone pages (${run.steps} steps) — ${bySeverity.join(" · ")}.`,
    `- By kind: ${byKind || "—"}.`,
    "- `tap-target` is WCAG 2.2 SC 2.5.8 (AA) after its inline, spacing and user-agent exceptions; `tap-target-aaa` is SC 2.5.5's 44×44 (AAA), advisory only.",
    "",
    "## Rows",
    "",
    "| page | what | where | severity | fix | members / steps that hit it |",
    "|---|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${cell(r.page)} | \`${r.kind}\` ${cell(r.what)} | ${cell(r.where)} | ${r.severity} | ${r.fix} | ${cell(hitsCell(r.hits))} |`,
    ),
    "",
    "## Reading the columns",
    "",
    "- **page** — the path the step landed on (after any redirect), so one control on one page is one row however many journeys pass it.",
    "- **what** — `page-sideways-scroll`: the document is wider than the window · `overflow`: the outermost element whose content spills past its box with `overflow-x: visible` · `tap-target` / `tap-target-aaa`: a control under 24×24 / 44×44 CSS px · `input-zoom`: a text field under 16px, which iPhone Safari zooms into on focus.",
    "- **where** — the first fixed-string hit of the element's visible text in `app/src` or `src` (`scripts/crawl/locate.mjs`); `—` when the text is built at runtime or the element has none.",
    "- **severity** — high: the whole page drags sideways; medium: a control or field a thumb fights with; low: advisory (AAA). **fix** — S: a CSS rule or padding; M: a layout change.",
    "",
  ];
  writeFileSync(path, lines.join("\n"));
  return rows;
}
