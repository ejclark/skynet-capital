#!/usr/bin/env node
/**
 * THE IA LEDGER, MACHINE-READABLE (#8005 slice 7) — reads the ledger table in `docs/IA.md` §10
 * ("Upstream problems found in redesigns") and writes `src/domain/ia-ledger.json`, the copy the
 * app reads. Moneypenny checks a member's change proposal against these rows before she drafts it
 * (`src/companion/known-problems-tool.ts`), and a matched filing counts as evidence on its row.
 *
 * WHY A GENERATED FILE, NOT A PARSE AT REQUEST TIME: §10 is prose a redesign session edits by
 * hand. Parsing it inside a chat turn would put a markdown parser on the request path and let a
 * half-edited table change what she says mid-deploy. Parsing it here, once, makes the rows a
 * reviewed artifact: the diff of the JSON shows exactly what the chat will read.
 *
 * WHAT IT READS FROM EACH ROW (the table's own columns, nothing invented):
 *   - `problem`: the bold root title; `detail`: the words after its dash, with § refs and code
 *     ticks stripped, so she can say what the problem is in plain words;
 *   - `screens`: the redesign screen ids the "Screens that hit it" cell names, joined to
 *     `scripts/redesign/screens.json` for each one's name and route (the "try it" link);
 *   - `screensCited`: the status cell's own "(N screens)" count when it states one, the threshold
 *     §10's overhaul rule reads; otherwise the screens found;
 *   - `plans`: the issue numbers the status cell says own the fix ("filed as #N", "owned by #N",
 *     "joins #N");
 *   - `state`: fixed · plan filed · ready for a plan · waiting, from the status cell's words.
 *     "fixed" reads a status that says fixed, done or closed (e.g. "**fixed in #N**"); `fixedBy`
 *     keeps that number.
 *
 * `npm run ia:ledger` rewrites the JSON; `--check` exits 1 when it is stale (the spec runs the
 * same comparison, so an edit to §10 without a regenerate fails with this command in the message).
 *
 * `--evidence` (needs `gh`) writes `docs/members/ia-ledger-evidence.md`: each row's screens beside
 * the members and filings matched to it from the chat, counted off GitHub's own labels — a
 * filing carries `ia-<row>` and `member-<id>`, so members are counted by that opaque label, never
 * a login. That is where §10's overhaul rule ("cited by 3 or more screens") can read members as
 * well as screens. Each row also links its live list (`label:ia-<row>`), which never goes stale.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMain } from "./is-main.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const IA_PATH = join(ROOT, "docs/IA.md");
export const SCREENS_PATH = join(ROOT, "scripts/redesign/screens.json");
export const LEDGER_JSON_PATH = join(ROOT, "src/domain/ia-ledger.json");
export const EVIDENCE_PATH = join(ROOT, "docs/members/ia-ledger-evidence.md");
const REPO = "ejclark/skynet-capital";

const SECTION_HEAD = /^## 10\. /m;
const ROW = /^\|\s*(U\d+)\s*\|/;
/** The detail is a gloss, not the row: long enough to name the problem, short enough for a chat. */
const DETAIL_CHARS = 240;

/** Screens the ledger cites that the redesign registry does not list (it holds member routes
 *  only; the landing page is the signed-out front door). */
const EXTRA_SCREENS = [{ id: "landing", name: "The landing page", route: "/" }];

/** A redesign route is drawn for one viewer's fixture account; a member trying the fix should
 *  land on their own, so the fixture's `account=` goes. */
export function memberRoute(route) {
  const [path, query = ""] = route.split("?");
  const kept = query
    .split("&")
    .filter((pair) => pair && !pair.startsWith("account="))
    .join("&");
  return kept ? `${path}?${kept}` : path;
}

/** Cells of one markdown table row. The ledger's cells hold no escaped pipes (checked by the
 *  spec: every row has six). */
export function cellsOf(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

/** Markdown to plain words: code ticks, bold and § references go; whitespace collapses. */
export function plainWords(text) {
  return text
    .replace(/\s*\((?:§[^()]*|the shell)\)/g, "")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\s*\((?:#\d+|[^()]*\b(?:src|app|docs)\/)[^()]*\)/g, "")
    .replace(/\*\*([^*]*)\*\*/g, "$1")
    .replace(/\*([^*\s][^*]*)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** The text with every parenthesised aside removed, nesting included — a screen id is never
 *  inside one, but a quote that names a screen is. */
function withoutAsides(text) {
  let out = "";
  let depth = 0;
  for (const ch of text) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (depth === 0) out += ch;
  }
  return out;
}

export function screensIn(cell, registry) {
  const known = new Map(registry.map((s) => [s.id, s]));
  const seen = [];
  // Only a token's leading word: a quote with an unbalanced ")" (U14's "when 1) …") leaks its
  // tail into the token after it, and that tail must never read as a screen.
  for (const token of withoutAsides(cell).split(/[,;]/)) {
    const id = token.match(/^\s*(?:the\s+)?([a-z][a-z0-9-]*)/)?.[1] ?? "";
    const screen = known.get(id);
    if (screen && !seen.some((s) => s.id === id)) seen.push(screen);
  }
  return seen.map((s) => ({ id: s.id, name: s.name, route: memberRoute(s.route) }));
}

export function stateOf(status) {
  const words = status.toLowerCase();
  if (/\b(fixed|done|closed)\b/.test(words)) return "fixed";
  if (/filed as #\d+/.test(words)) return "plan filed";
  if (/ready for an overhaul plan/.test(words)) return "ready for a plan";
  return "waiting";
}

export function plansIn(status) {
  const plans = [];
  for (const m of status.matchAll(/(?:filed as|owned by|joins)\s+((?:#\d+(?:,\s*)?)+)/gi)) {
    for (const n of m[1].matchAll(/#(\d+)/g)) plans.push(Number(n[1]));
  }
  return [...new Set(plans)];
}

function fixedByIn(status) {
  const m = status.match(/\b(?:fixed|done|closed)\b[^#]{0,12}#(\d+)/i);
  return m ? Number(m[1]) : undefined;
}

function citedIn(status) {
  const m = status.match(/\((\d+) screens?\b/);
  return m ? Number(m[1]) : undefined;
}

/** One ledger row → its JSON entry. */
export function rowOf(cells, registry) {
  const [id, root, screensCell, , , status] = cells;
  const bold = root.match(/\*\*([^*]+)\*\*/);
  const title = bold?.[1] ?? root;
  // The gloss after the title: most rows set it off with " — ", U14 with "**:".
  const rest = bold ? root.slice((bold.index ?? 0) + bold[0].length) : "";
  const gloss = plainWords(rest).replace(/^(?:—|:)\s*/, "");
  const detail = clip(gloss, DETAIL_CHARS);
  const screens = screensIn(screensCell, registry);
  const fixedBy = fixedByIn(status);
  return {
    id,
    problem: plainWords(title).replace(/:$/, ""),
    detail,
    screens,
    screensCited: citedIn(status) ?? screens.length,
    plans: plansIn(status),
    state: stateOf(status),
    ...(fixedBy ? { fixedBy } : {}),
  };
}

/** The §10 table's rows, in order. Throws when the section or a row's shape is gone, so a
 *  restructure of §10 fails loudly here instead of emptying what the chat reads. */
export function buildLedger(iaText, registry = []) {
  const start = iaText.search(SECTION_HEAD);
  if (start < 0) throw new Error("docs/IA.md has no '## 10.' section — the ledger moved");
  const after = iaText.slice(start);
  const next = after.slice(3).search(/^## /m);
  const section = next < 0 ? after : after.slice(0, next + 3);
  const screens = [...registry, ...EXTRA_SCREENS];
  const rows = [];
  for (const line of section.split("\n")) {
    if (!ROW.test(line)) continue;
    const cells = cellsOf(line);
    if (cells.length !== 6) {
      throw new Error(`IA §10 row ${cells[0]} has ${cells.length} cells, expected 6`);
    }
    rows.push(rowOf(cells, screens));
  }
  if (rows.length === 0) throw new Error("IA §10 has no U-rows — the table's shape changed");
  return { source: "docs/IA.md §10", rows };
}

export function readLedgerInputs() {
  return {
    ia: readFileSync(IA_PATH, "utf8"),
    registry: JSON.parse(readFileSync(SCREENS_PATH, "utf8")),
  };
}

/** Each row's evidence from the issues carrying its label: distinct `member-<id>` labels, and
 *  filings. Pull requests and issues with no member label (a session's own) count as filings
 *  only. */
export function evidenceOf(issues) {
  const members = new Set();
  let filings = 0;
  for (const issue of issues) {
    if (issue.pull_request) continue;
    filings++;
    for (const label of issue.labels ?? []) {
      const name = typeof label === "string" ? label : label?.name;
      if (typeof name === "string" && name.startsWith("member-")) members.add(name);
    }
  }
  return { members: members.size, filings };
}

const STATE_SHOWN = {
  fixed: "fixed",
  "plan filed": "plan filed",
  "ready for a plan": "**ready for a plan**",
  waiting: "waiting",
};

/** The evidence page: one line per row, the screen count and the member count side by side. */
export function evidenceTable(ledger, evidenceByRow, asOf) {
  const lines = [
    "# Known problems: who asked, beside where they show up",
    "",
    "_Generated by `node scripts/ia-ledger.mjs --evidence` from `docs/IA.md` §10 and the",
    `\`ia-<row>\` labels Moneypenny's matched filings carry. As of ${asOf}; each row's live list`,
    "never goes stale._",
    "",
    "§10's overhaul rule reads screens: a row cited by 3 or more becomes a plan. Members who asked",
    "sit beside that count so the rule can read them too. A member counts once per row, by their",
    "opaque `member-<id>` label.",
    "",
    "| Row | Problem | Screens | Members who asked | Filings | Status | Live list |",
    "|---|---|---|---|---|---|---|",
  ];
  for (const row of ledger.rows) {
    const e = evidenceByRow.get(row.id) ?? { members: 0, filings: 0 };
    const plans = row.plans.length ? ` (${row.plans.map((n) => `#${n}`).join(", ")})` : "";
    const live = `[label:ia-${row.id}](https://github.com/${REPO}/issues?q=label%3Aia-${row.id})`;
    lines.push(
      `| ${row.id} | ${row.problem} | ${row.screensCited} | ${e.members} | ${e.filings} | ${STATE_SHOWN[row.state]}${plans} | ${live} |`,
    );
  }
  return `${lines.join("\n")}\n`;
}

/** Every issue carrying one row's label, open and closed, through `gh`. */
function issuesLabelled(row) {
  const out = execFileSync(
    "gh",
    ["api", "--paginate", `repos/${REPO}/issues?labels=ia-${row}&state=all&per_page=100`],
    { encoding: "utf8" },
  );
  return out.trim() ? JSON.parse(out.replace(/\]\s*\[/g, ",")) : [];
}

function writeEvidence(ledger) {
  const byRow = new Map(ledger.rows.map((row) => [row.id, evidenceOf(issuesLabelled(row.id))]));
  writeFileSync(EVIDENCE_PATH, evidenceTable(ledger, byRow, new Date().toISOString().slice(0, 10)));
  console.log(`wrote ${ledger.rows.length} rows to docs/members/ia-ledger-evidence.md`);
}

function main(argv) {
  const { ia, registry } = readLedgerInputs();
  const fresh = `${JSON.stringify(buildLedger(ia, registry), null, 2)}\n`;
  if (argv.includes("--check")) {
    const committed = readFileSync(LEDGER_JSON_PATH, "utf8");
    if (JSON.stringify(JSON.parse(committed)) !== JSON.stringify(JSON.parse(fresh))) {
      console.error(
        "src/domain/ia-ledger.json is stale against docs/IA.md §10: run npm run ia:ledger",
      );
      return 1;
    }
    console.log("ia-ledger.json matches docs/IA.md §10");
    return 0;
  }
  writeFileSync(LEDGER_JSON_PATH, fresh);
  console.log(`wrote ${JSON.parse(fresh).rows.length} rows to src/domain/ia-ledger.json`);
  if (argv.includes("--evidence")) writeEvidence(JSON.parse(fresh));
  return 0;
}

if (isMain(import.meta.url)) process.exit(main(process.argv.slice(2)));
