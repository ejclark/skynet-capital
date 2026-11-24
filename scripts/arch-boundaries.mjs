#!/usr/bin/env node
// Architecture boundary scan — the drawn C4 container diagram, compiled into an import gate.
//
// WHY (plan #3748 slice 8, #4340). docs/architecture/ draws which container talks to which, and
// every container page names the code roots it lives in. Until now nothing held the code to the
// drawing: an import from the bot runtime into the observatory server, or from a spec into the
// browser app, crossed a boundary no diagram admits and nobody saw it. This reads the `Rel` lines
// the way Mermaid parsed them (mermaid-lint --ast, the slice-7a harness), reads the code roots from
// docs/architecture/source/maps.json, walks the real import graph (dependency-cruiser) and names
// every import that crosses from one container into another with no `Rel` drawn that way.
//
// THE RULE, in one line: an import from container A's code into container B's is declared iff the
// diagram draws `Rel(A, B)` (a `BiRel` draws both ways). A `Rel` means "A talks to B"; reading it as
// "A may depend on B" is the deliberate simplification — the drawing is the contract, so a missing
// arrow is either a boundary breach or an arrow the diagram forgot, and both want a human look.
//
// TWO READINGS THE DRAWING NEEDS (found by running the first scan, 2026-11-24):
//   - A volume (`ContainerDb`) is storage code that runs inside the process drawn writing to it:
//     `src/observatory/activity-store.ts` is the observatory volume's file AND the observatory
//     server's own. So a volume's files import as their writers do (`Rel(api, appvol)` lets
//     appvol-owned files import what api may), and are imported as themselves — the server reaching
//     the bots' decision journal is still its own, undrawn edge.
//   - Specs are not part of what ships. A spec importing the module it tests is how a test works,
//     not a breach, so imports FROM the `tests` container are exempt (EXEMPT_FROM). `Rel(tests, …)`
//     stays on the page as a claim about what the specs exercise; this gate holds production code.
//
// OWNERSHIP: a file belongs to the container whose code root matches it most specifically (the
// longest root). `src/server/bot-controls-store.ts` is the observatory volume's, not the server's,
// because the volume names that exact file. Two containers naming the same root (src/alpaca is
// both the server's and the bots') share it: an import to or from a shared file is never a crossing
// for the pair that shares it. A file no container names (src/ui, src/math, the shared kernel) is
// neutral — importing it crosses nothing.
//
// SCOPE: the runtime map only. Its roots are directories of TypeScript, which is what the import
// graph walks. The operating model's roots are globs, workflows and prose (scripts/*-scan.mjs,
// .github/workflows), a different kind of claim; it joins when its roots can be walked.
//
// ADVISORY FIRST (the plan's settled fork, advisory first then ratchet): the scan always exits 0
// and prints what it found. `--check` exits 1 when the count exceeds arch-boundaries-budget.json
// (the ratchet, lowered with `--update`, never raised), so promoting it to blocking is one line
// in the spec, not a rewrite. Falsifier (plan #3748): the advisory finds nothing for three weeks,
// then delete it.
//
//   node scripts/arch-boundaries.mjs             # report, exit 0
//   node scripts/arch-boundaries.mjs --check     # exit 1 when findings exceed the committed budget
//   node scripts/arch-boundaries.mjs --update    # lower arch-boundaries-budget.json (only lowers)
//   node scripts/arch-boundaries.mjs --json      # machine-readable findings
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isMain } from "./is-main.mjs";

const ROOT = process.cwd();
const INDEX = join("docs", "architecture", "README.md");
const MAPS = join("docs", "architecture", "source", "maps.json");
const PARITY = join("docs", "architecture", "source", "parity.json");
const BUDGET_FILE = join(ROOT, "arch-boundaries-budget.json");

/** Maps whose code roots are walkable TypeScript. See SCOPE above. */
export const GATED_MAPS = ["runtime"];

/** What the import graph is walked over: the production code of the runtime containers. */
const CRUISE_GLOBS = ["src/**/*.ts", "app/src/**/*.{ts,tsx}"];

/** Containers whose imports are not held to the drawing (see the header: specs prove the runtime). */
export const EXEMPT_FROM = ["tests"];

/** How many example imports a finding names. */
const EXAMPLES = 3;

// --- the drawing ------------------------------------------------------------------------------

/**
 * The container ids a map's C4Container diagram draws, and the ordered pairs its `Rel` lines declare.
 * `models` are mermaid-lint --ast models; the diagram is the one that draws most of the map's
 * containers (the index also carries a Context diagram and the operating model's own).
 */
export function declaredEdges(models, containerIds) {
  const ids = new Set(containerIds);
  let best = null;
  for (const model of models) {
    if (model?.level !== "Container" && !model?.nodes) continue;
    const drawn = new Set(
      model.nodes.filter((n) => ids.has(n.id) && /^container/.test(n.kind ?? "")).map((n) => n.id),
    );
    if (drawn.size > (best?.drawn.size ?? 0)) best = { model, drawn };
  }
  if (!best) throw new Error(`no C4Container diagram draws any of: ${[...ids].join(", ")}`);
  const declared = new Set();
  const dbs = new Set(
    best.model.nodes
      .filter((n) => best.drawn.has(n.id) && /db/i.test(n.kind ?? ""))
      .map((n) => n.id),
  );
  for (const e of best.model.edges ?? []) {
    if (!(best.drawn.has(e.from) && best.drawn.has(e.to))) continue; // a person or an external system
    declared.add(`${e.from}>${e.to}`);
    if (/^birel/i.test(e.kind ?? "")) declared.add(`${e.to}>${e.from}`);
  }
  // A volume's code is its writers' code: who draws a Rel into it.
  const writers = new Map([...dbs].map((db) => [db, new Set()]));
  for (const key of declared) {
    const [from, to] = key.split(">");
    if (dbs.has(to) && !dbs.has(from)) writers.get(to).add(from);
  }
  return { drawn: best.drawn, declared, writers };
}

// --- ownership --------------------------------------------------------------------------------

/** A code root as a matcher plus its specificity (its length). A root may end a path, be a directory, or hold one `*`. */
function rootMatcher(root) {
  const bare = root.replace(/\/$/, "");
  if (!bare.includes("*")) {
    return { length: bare.length, test: (f) => f === bare || f.startsWith(`${bare}/`) };
  }
  const re = new RegExp(`^${bare.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")}$`);
  return { length: bare.length, test: (f) => re.test(f) };
}

/** `ownerOf(file)` → the container ids whose most specific root names the file (empty when none). */
export function ownership(containers, drawn) {
  const matchers = containers
    .filter((c) => drawn.has(c.id))
    .flatMap((c) => (c.code_roots ?? []).map((r) => ({ id: c.id, ...rootMatcher(r) })));
  return (file) => {
    const hits = matchers.filter((m) => m.test(file));
    const longest = Math.max(0, ...hits.map((m) => m.length));
    return [...new Set(hits.filter((m) => m.length === longest).map((m) => m.id))];
  };
}

// --- the findings -----------------------------------------------------------------------------

/**
 * Every import that crosses containers with no Rel drawn that way, grouped by (from → to).
 * `edges` are `{ from, to }` repo-relative file pairs.
 */
export function findUndeclared(
  edges,
  ownerOf,
  declared,
  writers = new Map(),
  exempt = EXEMPT_FROM,
) {
  const groups = new Map();
  for (const { from, to } of edges) {
    const own = ownerOf(from);
    const b = ownerOf(to);
    if (!(own.length && b.length)) continue; // neutral ground
    if (own.every((x) => exempt.includes(x))) continue;
    const a = [...new Set([...own, ...own.flatMap((x) => [...(writers.get(x) ?? [])])])];
    if (a.some((x) => b.includes(x))) continue; // shares a container: not a crossing
    if (a.some((x) => b.some((y) => declared.has(`${x}>${y}`)))) continue;
    const key = `${a.join("+")} → ${b.join("+")}`;
    const g = groups.get(key) ?? { from: a.join("+"), to: b.join("+"), count: 0, examples: [] };
    g.count += 1;
    if (g.examples.length < EXAMPLES) g.examples.push(`${from} → ${to}`);
    groups.set(key, g);
  }
  return [...groups.values()].sort((x, y) => y.count - x.count || x.from.localeCompare(y.from));
}

/** The first-party imports in a dependency-cruiser JSON report (npm, core and unresolved dropped). */
export function importEdges(report) {
  return (report.modules ?? []).flatMap((m) =>
    (m.dependencies ?? [])
      .filter((d) => d.resolved && !d.couldNotResolve && !d.coreModule)
      .filter((d) => !/node_modules/.test(d.resolved))
      .map((d) => ({ from: m.source, to: d.resolved })),
  );
}

// --- the Graphify parity check ----------------------------------------------------------------

/**
 * The committed parity notes (Graphify's communities, mapped by hand to the drawn containers) must
 * only name containers the diagram still draws: a container renamed or dropped in the drawing
 * leaves its community mapped to nothing. Returns the container ids a note names that are not drawn.
 */
export function parityStale(parity, mapKey, drawn) {
  const named = new Set();
  const re = new RegExp(`${mapKey}:([a-z_]+)`, "g");
  const notes = [
    ...(parity.graphify_communities ?? []).map((c) => c.mapped_to_container ?? ""),
    ...(parity.containers_with_no_code ?? []),
    ...(parity.communities_with_no_container ?? []),
  ];
  for (const note of notes) for (const [, id] of String(note).matchAll(re)) named.add(id);
  return [...named].filter((id) => !drawn.has(id)).sort();
}

// --- the CLI ----------------------------------------------------------------------------------

function modelsOf(markdown) {
  const out = execFileSync("node", ["scripts/mermaid-lint.mjs", "--stdin", "--json", "--ast"], {
    input: markdown,
    encoding: "utf8",
    maxBuffer: 64 << 20,
  });
  return JSON.parse(out).diagrams.map((d) => d.model);
}

function cruise() {
  let out = "";
  try {
    out = execFileSync(
      join(ROOT, "node_modules", ".bin", "depcruise"),
      [...CRUISE_GLOBS, "--config", ".dependency-cruiser.cjs", "--output-type", "json"],
      { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256 << 20 },
    );
  } catch (e) {
    out = e.stdout ?? ""; // depcruise exits non-zero on the repo's own rule findings; we own the verdict
  }
  return JSON.parse(out);
}

/** The whole scan: `{ findings, total, stale, drawn, declared }` per gated map. */
export function scan() {
  const maps = JSON.parse(readFileSync(MAPS, "utf8"));
  const models = modelsOf(readFileSync(INDEX, "utf8"));
  const edges = importEdges(cruise());
  const parity = existsSync(PARITY) ? JSON.parse(readFileSync(PARITY, "utf8")) : {};
  return GATED_MAPS.map((key) => {
    const containers = maps[key].containers;
    const { drawn, declared, writers } = declaredEdges(
      models,
      containers.map((c) => c.id),
    );
    const findings = findUndeclared(edges, ownership(containers, drawn), declared, writers);
    return {
      map: key,
      containers: drawn.size,
      declared: declared.size,
      findings,
      total: findings.reduce((n, f) => n + f.count, 0),
      stale: parityStale(parity, key, drawn),
    };
  });
}

function main() {
  const results = scan();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  const total = results.reduce((n, r) => n + r.total, 0);
  const kinds = results.reduce((n, r) => n + r.findings.length, 0);
  console.log("⬡ Architecture boundary scan (advisory) — the drawn Rel lines held to the imports");
  for (const r of results) {
    console.log(
      `\n  ${r.map}: ${r.containers} containers, ${r.declared} drawn directions, ` +
        `${r.findings.length} undeclared edges (${r.total} imports)`,
    );
    for (const f of r.findings) {
      console.log(`  ✗ undeclared edge ${f.from} → ${f.to}: ${f.count} imports, e.g.`);
      for (const ex of f.examples) console.log(`      ${ex}`);
    }
    if (r.stale.length) {
      console.log(
        `  ✗ parity.json names containers the diagram no longer draws: ${r.stale.join(", ")}`,
      );
    }
  }
  const budget = existsSync(BUDGET_FILE)
    ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")).undeclaredImports
    : Number.POSITIVE_INFINITY;
  if (process.argv.includes("--update")) {
    const next = { undeclaredImports: Math.min(Number.isFinite(budget) ? budget : total, total) };
    writeFileSync(BUDGET_FILE, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`\narch-boundaries-budget.json — undeclaredImports=${next.undeclaredImports}`);
    return;
  }
  console.log(`\n  ${kinds} undeclared edges · ${total} imports · budget ${budget}`);
  if (process.argv.includes("--check") && total > budget) {
    console.error(
      `\n✗ undeclared boundary imports grew: ${total} > budget ${budget}. Draw the Rel in ` +
        "docs/architecture/source/maps.json if the dependency is real, or remove the import.",
    );
    process.exit(1);
  }
}

if (isMain(import.meta.url)) main();
