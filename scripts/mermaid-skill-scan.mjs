#!/usr/bin/env node
// Mermaid skill fitness scan — the eye that checks whether the /mermaid skill still tells sessions
// what github.com can actually draw.
//
// The skill was distilled once (2026-09-25) and then learned more: config-on-github.md pinned
// GitHub's renderer at 11.17.2, but ten cards kept saying "GitHub's version is unknown" and kept
// steering sessions off features 11.17.2 draws (collapsible subgraphs, sequence stereotypes, …).
// Separately, flowchart.md's syntax table recorded edge animation, validated it, and its "Emphasis
// without hue" section — the list a session actually draws from — never mentioned it, so it never
// reached a picture (Eric, 2026-10-03: "concerning that animations did not surface"). Three
// mechanical classes of that drift, each a separate count:
//   ① stale gate — a card sentence calling GitHub's version unknown, or avoiding / deferring a
//     feature whose stated version is at or below the pin (scripts/mermaid-lint.mjs's
//     GITHUB_MERMAID_VERSION). The pin lives in one place; cards must not restate a guess.
//   ② unpromoted encoding — a syntax-table row whose name carries a visual-encoding term (the
//     ENCODING lexicon below) that the card's "Emphasis without hue" section never names, and that
//     has no decision in .claude/skills/mermaid/encodings-ledger.json. Omission needs a recorded
//     reason; silence is the finding. Lexicon-based, so a row named without any of its terms is a
//     miss — honestly out of reach; widen the lexicon when one is found.
//   ③ uncarded type — a diagram type the pinned mermaid package registers (read from its dist, so
//     it moves with the pin) with no reference card.
// An unreadable pin or registry is UNKNOWN (exit 3), never a quiet pass.
//
// Debt class, so advisory in CI like doc-rot (tests/support/advisory-scan.ts); the scanner-behavior
// specs in tests/arch/mermaid-skill.spec.ts are ordinary unit tests and stay blocking.
//
//   node scripts/mermaid-skill-scan.mjs             # report; exit 1 when any count grew past budget
//   node scripts/mermaid-skill-scan.mjs --update    # rewrite mermaid-skill-budget.json (only lowers)
//   node scripts/mermaid-skill-scan.mjs --candidate # first finding of each class as JSON
//   node scripts/mermaid-skill-scan.mjs --json      # every finding as JSON
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SKILL = join(ROOT, ".claude/skills/mermaid");
const CARDS = join(SKILL, "reference");
const LEDGER = join(SKILL, "encodings-ledger.json");
const BUDGET_FILE = join(ROOT, "mermaid-skill-budget.json");
const LINT = join(ROOT, "scripts/mermaid-lint.mjs");
const DIST = join(ROOT, "node_modules/mermaid/dist");

/** Cards that are not one diagram type. */
const NON_TYPE_CARDS = new Set(["README.md", "config-on-github.md"]);

/** Registry id (mermaid's detector `id`) → card file stem. Ids absent here use their lowercase. */
const ID_TO_CARD = {
  class: "classdiagram",
  classdiagram: "classdiagram",
  er: "entityrelationshipdiagram",
  "flowchart-elk": "flowchart",
  "flowchart-v2": "flowchart",
  gitgraph: "gitgraph",
  journey: "userjourney",
  quadrantchart: "quadrantchart",
  requirement: "requirementdiagram",
  sequence: "sequencediagram",
  state: "statediagram",
  statediagram: "statediagram",
  swimlane: "swimlanes",
  treeview: "treeview",
  railroadabnf: "railroad",
  railroadebnf: "railroad",
  railroadpeg: "railroad",
};
/** Registered ids that are not diagrams a picture would use. */
const NOT_A_PICTURE = new Set(["info"]);

/** Terms that name a visual encoding — a way a picture can carry meaning. */
const ENCODING =
  /animat|highlight|critical|\bcrit\b|priority|collaps|activat|thick|bold|stroke|marker|cross head|circle head|\bnote\b|\brect\b|handdrawn|\blook\b|dash|dotted|invisible|stereotype|milestone|\bvert\b|cherry|reverse|\btag\b|autonumber|half|curve|classdef|linkstyle|markdown|glyph|icon/gi;

const UNKNOWN_VERSION =
  /version is unknown|unknown (?:mermaid )?(?:version|vers\b|renderer)|is not known|unless github'?s version is confirmed|(?:possibly|plausibly|perhaps) github'?s|github may predate/i;
const DEFERS =
  /\bavoid\b|unavailable|once the renderer|may not render (?:there|on github)|until github|(?:do not|don't|never) rely on/i;
/** A deferral that needs no "github" in its own sentence — the subject is always the renderer. */
const DEFERRED_UNTIL_KNOWN = /until (?:that|it) is known/i;
const VERSION = /\bv?(1[0-2])\.(\d+)(?:\.(\d+))?\+?/g;

// ---- inputs ----------------------------------------------------------------------------------

function readPin() {
  if (!existsSync(LINT)) return null;
  const m = readFileSync(LINT, "utf8").match(/GITHUB_MERMAID_VERSION\s*=\s*"(\d+)\.(\d+)\.(\d+)"/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Detector ids the installed mermaid registers — `var id = "flowchart"` in its dist chunks. */
function readRegistry() {
  if (!existsSync(DIST)) return null;
  const ids = new Set();
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".mjs")) {
        for (const m of readFileSync(p, "utf8").matchAll(/\bvar id\d* = "([A-Za-z0-9_-]+)"/g)) {
          ids.add(m[1]);
        }
      }
    }
  };
  walk(DIST);
  return ids.size ? ids : null;
}

function cardFiles() {
  if (!existsSync(CARDS)) return [];
  return readdirSync(CARDS)
    .filter((f) => f.endsWith(".md") && !NON_TYPE_CARDS.has(f))
    .sort();
}

function readLedger() {
  if (!existsSync(LEDGER)) return [];
  const parsed = JSON.parse(readFileSync(LEDGER, "utf8"));
  return Array.isArray(parsed.decisions) ? parsed.decisions : [];
}

const cmp = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

// ---- check ①: stale gates --------------------------------------------------------------------

function staleGates(pin) {
  const out = [];
  const files = ["SKILL.md", ...cardFiles().map((f) => `reference/${f}`)];
  for (const rel of files) {
    const path = join(SKILL, rel);
    if (!existsSync(path)) continue;
    readFileSync(path, "utf8")
      .split("\n")
      .forEach((line, i) => {
        for (const s of line.split(/(?<=[.;])\s+/)) {
          const versions = [...s.matchAll(VERSION)].map((m) => [+m[1], +m[2], +(m[3] ?? 0)]);
          const unknown =
            (UNKNOWN_VERSION.test(s) && /github/i.test(s)) || DEFERRED_UNTIL_KNOWN.test(s);
          const deferred =
            DEFERS.test(s) && versions.length > 0 && versions.every((v) => cmp(v, pin) <= 0);
          if (unknown || deferred) {
            out.push({
              where: `.claude/skills/mermaid/${rel}:${i + 1}`,
              text: s.trim().slice(0, 160),
            });
          }
        }
      });
  }
  return out;
}

// ---- check ②: unpromoted encodings -----------------------------------------------------------

function emphasisSection(body) {
  const m = body.match(/\n## Emphasis without hue[^\n]*\n([\s\S]*?)(?=\n## |$)/);
  return m ? m[1].toLowerCase() : null;
}

/** Rows of one card whose encoding terms the emphasis section never names and no decision covers. */
function cardGaps(f, decided) {
  const body = readFileSync(join(CARDS, f), "utf8");
  const emphasis = emphasisSection(body);
  if (emphasis === null) {
    return [{ where: `reference/${f}`, row: "(card)", text: 'no "Emphasis without hue" section' }];
  }
  const out = [];
  for (const line of body.split("\n")) {
    if (!line.startsWith("| ") || /^\|\s*-/.test(line)) continue;
    const row = line.split("|")[1]?.trim() ?? "";
    if (decided.has(`${f}::${row}`)) continue;
    const terms = new Set([...row.matchAll(ENCODING)].map((m) => m[0].toLowerCase()));
    const missing = [...terms].filter((t) => !emphasis.includes(t));
    if (missing.length) {
      out.push({
        where: `reference/${f}`,
        row,
        text: `emphasis section never names: ${missing.join(", ")}`,
      });
    }
  }
  return out;
}

const DECISIONS = new Set(["declined", "structural", "promoted"]);

function unpromoted(ledger) {
  const decided = new Set(ledger.map((d) => `${d.card}::${d.row}`));
  const gaps = cardFiles().flatMap((f) => cardGaps(f, decided));
  const undecided = ledger
    .filter((d) => !(d.reason && DECISIONS.has(d.status)))
    .map((d) => ({
      where: "encodings-ledger.json",
      row: `${d.card}::${d.row}`,
      text: "decision needs status + reason",
    }));
  return [...gaps, ...undecided];
}

// ---- check ③: uncarded types -----------------------------------------------------------------

function uncarded(registry) {
  const cards = new Set(cardFiles().map((f) => f.replace(/\.md$/, "")));
  const wanted = new Map();
  for (const id of registry) {
    if (NOT_A_PICTURE.has(id)) continue;
    const key = id.toLowerCase();
    const card = ID_TO_CARD[key] ?? key;
    if (!wanted.has(card)) wanted.set(card, id);
  }
  return [...wanted]
    .filter(([card]) => !cards.has(card))
    .map(([card, id]) => ({
      where: `reference/${card}.md`,
      row: id,
      text: `registered type \`${id}\` has no card`,
    }))
    .sort((a, b) => a.where.localeCompare(b.where));
}

// ---- report ----------------------------------------------------------------------------------

const pin = readPin();
const registry = readRegistry();
if (!(pin && registry)) {
  console.error(
    `✗ mermaid-skill scan UNKNOWN: ${!pin ? "GITHUB_MERMAID_VERSION not readable in scripts/mermaid-lint.mjs" : "no diagram registry in node_modules/mermaid/dist (run npm ci)"}.`,
  );
  process.exit(3);
}

const findings = {
  stale: staleGates(pin),
  unpromoted: unpromoted(readLedger()),
  uncarded: uncarded(registry),
};
const counts = Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, v.length]));

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ pin: pin.join("."), counts, findings }, null, 2));
  process.exit(0);
}
if (process.argv.includes("--candidate")) {
  const candidate = Object.fromEntries(Object.entries(findings).map(([k, v]) => [k, v[0] ?? null]));
  console.log(JSON.stringify({ candidate, counts }, null, 2));
  process.exit(0);
}

const budget = existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")) : {};
if (process.argv.includes("--update")) {
  const next = Object.fromEntries(
    Object.entries(counts).map(([k, n]) => [
      k,
      Number.isFinite(budget[k]) ? Math.min(budget[k], n) : n,
    ]),
  );
  writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`mermaid-skill-budget.json updated — ${JSON.stringify(next)} (only lowers).`);
  process.exit(0);
}

const LABEL = {
  stale: `① stale version gates (pin is ${pin.join(".")})`,
  unpromoted: "② encodings with no emphasis entry and no ledger decision",
  uncarded: "③ registered types with no card",
};
let grew = false;
for (const [k, list] of Object.entries(findings)) {
  const cap = Number.isFinite(budget[k]) ? budget[k] : 0;
  console.log(`${LABEL[k]}: ${list.length} (budget ${cap})`);
  for (const f of list) console.log(`  ${f.where}${f.row ? ` [${f.row}]` : ""} — ${f.text}`);
  if (list.length > cap) grew = true;
}
if (grew) {
  console.error(
    "\n✗ mermaid skill drift grew past budget.\n" +
      "Fix: ① reword the card to the pin (or move the claim into config-on-github.md); ② name the\n" +
      'encoding in the card\'s "Emphasis without hue" section, or record a decision with a reason in\n' +
      "encodings-ledger.json; ③ write the card. Then `node scripts/mermaid-skill-scan.mjs --update`.",
  );
  process.exit(1);
}
console.log("\n✓ mermaid skill drift within budget.");
