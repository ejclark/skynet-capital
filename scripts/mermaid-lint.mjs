#!/usr/bin/env node
// Mermaid lint — every ```mermaid block parses under the SAME Mermaid version github.com renders.
//
// WHY THIS EXISTS. docs/PICTURES.md makes the picture a PR's opening frame, and until 2026-09-25 the
// only guard was a type allowlist whose own comment in scripts/ship.sh admitted the limit: "this
// checks the diagram TYPE, not full syntax — the honest limit". The fear behind the allowlist (a
// syntax error rendering as the opening frame) was real; the allowlist never addressed it, and it
// kept out every richer type — gitGraph, quadrantChart, C4, xychart — that GitHub has drawn for
// years. A 40-PR census the same day found 8 of 11 diagrams were one flowchart template whatever
// the change was. So: parse for real, with GitHub's version, and let the type menu be "whatever
// GitHub draws" (the fit per change class lives in docs/PICTURES.md).
//
// THE VERSION IS THE CONTRACT. github.com's renderer (viewscreen.githubusercontent.com) served
// Mermaid 11.17.2 on 2026-09-25, read from its production bundle; upstream is 12.0.0. `mermaid` is
// pinned to that exact version in package.json so a diagram that parses here parses there — a
// newer parser would pass 12.x-only types (usecase-beta, agentflow-beta) that GitHub shows as an
// error. When GitHub bumps, bump the pin and GITHUB_MERMAID_VERSION together; a mermaid block
// containing just the word `info` prints the deployed version in any GitHub comment.
//
// WHAT IS GATED vs NOTED (docs/COACHES.md: a blocking gate protects a constraint — here Eric's
// attention, the opening frame). Problems: a parse error; a type GitHub cannot draw; a fixed
// theme/themeVariables (freezes one of GitHub's two colour modes — docs/PICTURES.md → dark mode);
// iconify icon packs (GitHub never loads them, they render as "?"); the `journey` type (a
// UX-satisfaction chart, the wrong shape for reasoning). Notes: `%%{init}%%` (deprecated upstream,
// use frontmatter), `layout: elk` (GitHub falls back to dagre silently; a state diagram errors instead), `click` (dead on GitHub),
// a long diagram (the ≤15-node legibility budget is taste — pointed at, never gated).
//
// THE ROUND-3 RULES (docs/PICTURES.md → "Rules the design rounds found", plan #3786, 2026-09-26).
// One is gated because it protects the both-modes colour contract: a `classDef`/`style` hex that is
// not in a snippet checked in on docs/PICTURES.md (rule 11 — a look is a mode, switched whole; the
// registry is read from that page at run time, never from memory). Three are notes because they are
// taste with a ratchet, advisory until they prove they fire only on real defects (docs/COACHES.md):
// a handle in a label (rule 1: seven or more hex digits in a row), a brace fork whose text is not a
// question (rule 2), a house noun in a picture (rule 7: platter, boarding, capsule, state block).
//
//   node scripts/mermaid-lint.mjs <file.md>...   # lint the mermaid blocks in files (exit 1 on problems)
//   node scripts/mermaid-lint.mjs --stdin        # lint a body on stdin (ship.sh checkbody, issue-lint)
//   node scripts/mermaid-lint.mjs --json ...     # findings as JSON {problems, notes, diagrams}
//   node scripts/mermaid-lint.mjs                # scan the docs corpus (docs/, .github/, .claude/, root *.md)
//
// Enforced in CI via tests/arch/mermaid-lint.spec.ts (the corpus scan) and locally by
// scripts/ship.sh checkbody + scripts/issue-lint.mjs, which run this CLI on the body. The parser
// loads lazily (~1.5s, jsdom + mermaid), so a body with no diagram pays nothing. Loud-failure
// doctrine: an unreadable input is an error, never "fine".
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The repo this script lives in — the registry is read from here, not from the caller's cwd, so
 *  ship.sh and the specs see the same page wherever they run. */
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** What github.com renders — read from its production bundle on 2026-09-25. Move with the pin. */
export const GITHUB_MERMAID_VERSION = "11.17.2";
/** Non-blank lines past which a diagram gets an advisory note — the ≤15-node budget, in lines. */
export const LONG_DIAGRAM_LINES = 40;

const CORPUS_ROOTS = ["docs", ".github", ".claude"];
/** Vendored docs are not ours to gate; shots are images; handoffs are pasted from elsewhere. */
const CORPUS_SKIP = new Set(["node_modules", "vendor", "shots", "handoffs", ".git"]);

/** Types upstream 12.x added; GitHub's 11.17.2 renders them as an error. */
const NEEDS_12 = new Set(["usecase-beta", "usecase", "agentflow-beta", "agentflow"]);

/** Types the house declines outright — the message carries the reason and the replacement. */
const DECLINED = new Map([
  [
    "journey",
    "`journey` is a UX-satisfaction chart — the wrong shape for a reasoning journey (docs/PICTURES.md); draw a `timeline` or a flowchart",
  ],
  ["zenuml", "`zenuml` is a plugin GitHub does not load — write a `sequenceDiagram`"],
]);

/** Icon-pack references. GitHub never registers iconify packs or loads Font Awesome CSS, so every
 *  one of these renders as "?"; `architecture-beta` gets only its built-ins (cloud, database, disk,
 *  internet, server). */
const ICON_PACK =
  /\b(?:fa[bsr]?|logos|mdi|simple-icons|tabler|lucide|carbon|devicon|material-symbols|heroicons|skill-icons):[a-z0-9-]+/i;

/**
 * Every fenced mermaid block, with the 1-based line its fence opens on. Nested fences (a
 * ```mermaid inside a ````markdown starter block, as docs/PICTURES.md has) are found too — a
 * starter that does not parse is exactly the drift this gate exists to catch. An indented block
 * (inside a list or an HTML comment) is dedented by its fence's indent before parsing.
 */
/** Rule 7 — the house nouns a picture never carries; the picture says what the thing does. A
 *  literal command citation (`ship.sh platter`) is a technology label, not a noun, and is skipped. */
const HOUSE_NOUNS = /(?<!ship\.sh )(?<!ship )\b(platter|boarding|capsule|state block)\b/i;
/** Rule 1 — a handle (sha, id) is seven or more hex digits in a row, outside a colour. */
const HANDLE = /(?<![#\w])[0-9a-f]{7,40}(?![\w])/i;
/** Rule 2 — a flowchart fork: `id{"label"}` (single braces; `{{ }}` is a hexagon, not a fork). */
const FORK = /\b\w+\{(?!\{)"?([^"{}]*?)"?\}/g;
/** A six-digit hex colour on a classDef or style line. */
const HEX = /#[0-9a-f]{6}\b/gi;

/**
 * Rule 11's registry: every hex on a `classDef` or `style` line inside a mermaid block on
 * docs/PICTURES.md — the page that holds the checked-in, contrast-verified snippets
 * (tests/ui/mermaid-classdef.spec.ts holds each to the both-modes bars). Read at run time so the
 * gate moves with the page. Returns null when the page cannot be read: the check then cannot
 * answer, and a block that carries a hex is refused with that reason rather than waved through.
 */
export function snippetHexes(root = REPO_ROOT) {
  let page;
  try {
    page = readFileSync(join(root, "docs", "PICTURES.md"), "utf8");
  } catch {
    return null;
  }
  const hexes = new Set();
  for (const { source } of mermaidBlocks(page)) {
    for (const line of source.split("\n")) {
      if (!/^\s*(classDef|style)\b/.test(line)) continue;
      for (const h of line.match(HEX) ?? []) hexes.add(h.toUpperCase());
    }
  }
  return hexes;
}

export function mermaidBlocks(markdown) {
  const blocks = [];
  const re = /^([ \t]*)(`{3,})[ \t]*mermaid\b[^\n]*\n([\s\S]*?)\n[ \t]*\2[ \t]*$/gm;
  for (const m of markdown.matchAll(re)) {
    const line = markdown.slice(0, m.index).split("\n").length;
    const indent = m[1].length;
    const source = m[3]
      .split("\n")
      .map((l) => l.slice(Math.min(indent, l.length - l.trimStart().length)))
      .join("\n");
    blocks.push({ line, source });
  }
  return blocks;
}

/** The diagram's header keyword — after any YAML frontmatter and `%%` comment lines. */
function headerWord(source) {
  const body = source.replace(/^\s*---\n[\s\S]*?\n---\n/, "");
  const first = body.split("\n").find((l) => l.trim() && !l.trim().startsWith("%%"));
  return (first ?? "").trim().split(/[\s:]+/)[0];
}

let mermaidLoad;
/** mermaid wires DOMPurify to `window` at import time (mermaid-js/mermaid#5204), so a bare jsdom
 *  document stands in for the browser. It never renders here; parse only. */
function loadMermaid() {
  mermaidLoad ??= (async () => {
    const { JSDOM } = await import("jsdom");
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.DOMParser = dom.window.DOMParser;
    return (await import("mermaid")).default;
  })();
  return mermaidLoad;
}

/** The first line of a parse error plus its "Expecting …" line — enough to find the token. */
function parseErrorText(error) {
  const lines = String(error?.message ?? error)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const expecting = lines.find((l) => l.startsWith("Expecting"));
  return [lines[0], expecting].filter(Boolean).join(" — ");
}

/**
 * Lint every mermaid block in a markdown string.
 * @returns {Promise<{problems: string[], notes: string[], diagrams: {line:number,type:string,ok:boolean}[]}>}
 */
export async function lintMermaid(markdown, { where = "" } = {}) {
  const problems = [];
  const notes = [];
  const diagrams = [];
  const blocks = mermaidBlocks(markdown);
  if (!blocks.length) return { problems, notes, diagrams };
  const mermaid = await loadMermaid();
  const registry = snippetHexes();

  for (const { line, source } of blocks) {
    const at = where ? `${where}:${line}` : `line ${line}`;
    const head = headerWord(source);
    let result;
    try {
      result = await mermaid.parse(source);
    } catch (error) {
      if (NEEDS_12.has(head)) {
        problems.push(
          `${at}: \`${head}\` needs Mermaid 12 — github.com renders ${GITHUB_MERMAID_VERSION}, which shows it as an error`,
        );
      } else if (DECLINED.has(head)) {
        problems.push(`${at}: ${DECLINED.get(head)}`);
      } else {
        problems.push(
          `${at}: mermaid ${GITHUB_MERMAID_VERSION} will not parse it — ${parseErrorText(error)}`,
        );
      }
      diagrams.push({ line, type: head, ok: false });
      continue;
    }

    const type = result?.diagramType ?? head;
    diagrams.push({ line, type, ok: true });
    const policy = policyFindings(source, result?.config ?? {}, head, at, registry);
    problems.push(...policy.problems);
    notes.push(...policy.notes);
  }
  return { problems, notes, diagrams };
}

/** The house policy on a diagram that parses: what GitHub cannot draw or the house declines
 *  (problems), and what merely deserves a pointer (notes). Kept apart from the parse loop so each
 *  rule reads as one line with its reason. */
function policyFindings(source, config, head, at, registry) {
  const problems = [];
  const notes = [];
  if (DECLINED.has(head)) problems.push(`${at}: ${DECLINED.get(head)}`);
  if (config.theme || config.themeVariables) {
    problems.push(
      `${at}: sets a fixed theme — GitHub picks light or dark from the page, and a pinned theme freezes one of them; leave theme out (docs/PICTURES.md → dark mode)`,
    );
  }
  const icon = ICON_PACK.exec(source);
  if (icon) {
    problems.push(
      `${at}: uses an icon pack (${icon[0]}) — GitHub never loads iconify or Font Awesome, so it renders as "?"; architecture diagrams get only the built-in cloud/database/disk/internet/server`,
    );
  }
  if (/^\s*%%\{\s*init/m.test(source)) {
    notes.push(
      `${at}: %%{init}%% is deprecated upstream since Mermaid 10.5 — put config in YAML frontmatter`,
    );
  }
  if (config.layout && config.layout !== "dagre") {
    // ELK is not registered on GitHub's 11.17.2. Flowchart, class, ER and requirement fall back to
    // dagre; a state diagram has no fallback path and throws "Unknown layout algorithm" at render,
    // which parse() never sees (reproduced on 11.13, read in the 11.17.2 source — the config card).
    if (/^stateDiagram/.test(head)) {
      problems.push(
        `${at}: layout "${config.layout}" on a state diagram throws at render on GitHub (no fallback) — the opening frame would be an error box; drop the layout key`,
      );
    } else {
      notes.push(
        `${at}: layout "${config.layout}" is not registered on GitHub — it falls back to dagre silently, so the diagram re-flows`,
      );
    }
  }
  if (/^\s*click\s/m.test(source)) {
    notes.push(
      `${at}: click links are best-effort on GitHub and callbacks never run — never make one load-bearing`,
    );
  }
  const lineCount = source.split("\n").filter((l) => l.trim()).length;
  if (lineCount > LONG_DIAGRAM_LINES) {
    notes.push(
      `${at}: ${lineCount} lines — the legibility budget is ≤15 nodes on a 390px phone (docs/PICTURES.md); split or simplify`,
    );
  }
  const round3 = roundThreeFindings(source, head, at, registry);
  problems.push(...round3.problems);
  notes.push(...round3.notes);
  return { problems, notes };
}

/** Rule 11, gated: every classDef/style hex in a block is one a checked-in snippet carries. */
function hexFindings(source, at, registry) {
  const problems = [];
  // Rule 11 (gated): every classDef/style hex is one a checked-in snippet carries.
  const styled = source.split("\n").filter((l) => /^\s*(classDef|style)\b/.test(l));
  const hexes = new Set(styled.flatMap((l) => (l.match(HEX) ?? []).map((h) => h.toUpperCase())));
  if (hexes.size) {
    if (!registry) {
      problems.push(
        `${at}: carries classDef colour but docs/PICTURES.md (the snippet registry) could not be read — run from the repo root; a hex the page does not hold is refused (rule 11)`,
      );
    } else {
      const foreign = [...hexes].filter((h) => !registry.has(h));
      if (foreign.length) {
        problems.push(
          `${at}: classDef colour ${foreign.join(", ")} is not in a checked-in snippet — a look is a mode, switched whole: copy the teal or ink-mode snippet from docs/PICTURES.md, never a hex chosen in flight (rule 11)`,
        );
      }
    }
  }
  return problems;
}

/** The round-3 rules (docs/PICTURES.md → "Rules the design rounds found"): rule 11 gated, rules
 *  1, 2 and 7 advisory. Split from policyFindings so each function stays readable. */
function roundThreeFindings(source, head, at, registry) {
  const problems = [];
  const notes = [];
  problems.push(...hexFindings(source, at, registry));
  const lines = source.split("\n");
  // Rules 1, 2, 7 (notes): taste with a ratchet, advisory until they prove they fire on real defects.
  for (const l of lines) {
    if (/^\s*(classDef|style|%%)/.test(l)) continue;
    const h = HANDLE.exec(l);
    if (h) {
      notes.push(
        `${at}: "${h[0]}" reads as a handle — a handle is not a word: the ledger row keeps the sha, the label says what it means (docs/PICTURES.md rule 1)`,
      );
      break;
    }
  }
  if (/^(flowchart|graph)\b/.test(head)) {
    for (const m of source.matchAll(FORK)) {
      const label = (m[1] ?? "").trim();
      // Rule 18 puts the question in the bold headline with fact lines under it, in the backtick
      // markdown-string form: the headline or the whole label ends in ?, markup stripped.
      const lines = label
        .replace(/`/g, "")
        .split(/<br\s*\/?>/i)
        .map((l) => l.replace(/\*\*/g, "").trim());
      const asks = lines[0]?.endsWith("?") || lines.at(-1)?.endsWith("?");
      if (label && !asks) {
        notes.push(
          `${at}: fork "${label}" asks no question — a fork shape ends in ? and its exits carry the answers (docs/PICTURES.md rule 2)`,
        );
      }
    }
  }
  const noun = HOUSE_NOUNS.exec(source);
  if (noun) {
    notes.push(
      `${at}: "${noun[0]}" is a house noun — the picture says what the thing does (a held PR, one commit on it, an issue); the noun stays in scripts and docs (docs/PICTURES.md rule 7)`,
    );
  }
  return { problems, notes };
}

/** Every markdown file this repo publishes diagrams in: the docs tree, the templates and prompts,
 *  the skills and agents, and the root-level pages. */
export function corpusFiles(root = process.cwd()) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (CORPUS_SKIP.has(entry.name)) continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith(".md")) out.push(path);
    }
  };
  for (const r of CORPUS_ROOTS) walk(join(root, r));
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) out.push(join(root, entry.name));
  }
  return out.map((p) => p.slice(root.length + 1)).sort();
}

async function main() {
  const argv = process.argv.slice(2);
  const json = argv.includes("--json");
  const stdin = argv.includes("--stdin");
  const files = argv.filter((a) => !a.startsWith("--"));

  const inputs = [];
  if (stdin) inputs.push({ where: "", text: readFileSync(0, "utf8") });
  else if (files.length)
    for (const f of files) inputs.push({ where: f, text: readFileSync(f, "utf8") });
  else for (const f of corpusFiles()) inputs.push({ where: f, text: readFileSync(f, "utf8") });

  const all = { problems: [], notes: [], diagrams: [] };
  for (const { where, text } of inputs) {
    const r = await lintMermaid(text, { where });
    all.problems.push(...r.problems);
    all.notes.push(...r.notes);
    all.diagrams.push(...r.diagrams.map((d) => ({ where, ...d })));
  }

  if (json) {
    console.log(JSON.stringify(all, null, 2));
    process.exit(all.problems.length ? 1 : 0);
  }
  for (const n of all.notes) console.log(`· ${n}`);
  for (const p of all.problems) console.error(`✗ ${p}`);
  if (all.problems.length) {
    console.error(
      `\n${all.problems.length} mermaid problem(s) — a diagram that will not render is the opening frame (docs/PICTURES.md).`,
    );
    process.exit(1);
  }
  console.log(
    `mermaid-lint: ✓ ${all.diagrams.length} diagram(s) parse under Mermaid ${GITHUB_MERMAID_VERSION} (github.com's version).`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
