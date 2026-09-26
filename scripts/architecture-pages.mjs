#!/usr/bin/env node
// Architecture pages — the storybook under docs/architecture/, generated from a structured source.
//
// WHY THIS EXISTS. docs/adr/0008 (2026-07-27) chose Mermaid system diagrams as "Eric's spec
// surface… human-readable rendered, AI-writable as text" and named a parity check against the
// code; none of it was built, the code graph went 28 days stale, and every session re-derived the
// system by grep (the 2026-09-25 lineage pass). Eric, 2026-09-25: "a storybook version of the
// major parts of our systems in a component library fashion". A storybook that is hand-edited
// drifts the way the July spec surface did, so the pages are GENERATED from three JSON inputs in
// docs/architecture/source/ — the two C4 maps derived from the code (runtime, operating model),
// the 79 refuter verdicts (one per container and relationship: grounded or not, plus the
// correction — the evidence transcripts stay at the commit that carried them, 6a900d3), and the
// Graphify parity notes — and a spec regenerates them and fails on drift.
//
// HONESTY RULE (docs/PICTURES.md): a diagram is a claim. Every container page prints its code
// roots, its grounding evidence and the refuter's verdict; a claim the refuter could not ground
// stays on the page marked as such, with the correction, never silently dropped.
//
//   node scripts/architecture-pages.mjs           # (re)write docs/architecture/*.md from source/
//   node scripts/architecture-pages.mjs --check   # exit 1 if a page on disk differs from the render
//
// Enforced in CI via tests/arch/architecture-pages.spec.ts. Dependency-free (node built-ins).
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const OUT = join(ROOT, "docs", "architecture");
const SRC = join(OUT, "source");

const MAP_TITLES = {
  runtime: "Runtime system — what serves members and runs the bots",
  "operating-model": "Operating model — the machinery that runs the repo",
};
/** The operating-model map draws the two deployed runtime containers again; they link, never duplicate. */
const MIRRORS = { dashboard: "runtime-api.md", bots: "runtime-bots.md" };

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const fence = (src) => `\`\`\`mermaid\n${String(src).trim()}\n\`\`\``;
const cell = (s) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");

/** Read the three inputs. Loud on a missing or unreadable file — a storybook with no source is not one. */
export function readSource(dir = SRC) {
  const load = (name) => JSON.parse(readFileSync(join(dir, name), "utf8"));
  return { maps: load("maps.json"), verdicts: load("verdicts.json"), parity: load("parity.json") };
}

/**
 * Refuters were labelled refute:<map>:<index> over ONE claim list built as
 * [runtime containers, runtime relationships, ops containers, ops relationships], so an
 * operating-model claim's index is offset by the runtime map's claim count.
 */
function verdictFinder(maps, verdicts) {
  const runtime = maps.runtime;
  const offset = runtime ? runtime.containers.length + runtime.relationships.length : 0;
  return (mapKey, i) => {
    const key = mapKey === "runtime" ? "runtime" : "ops";
    const index = key === "ops" ? offset + i : i;
    return verdicts.find((v) => v.label === `refute:${key}:${index}`);
  };
}

const verdictCell = (v) =>
  v
    ? `${v.grounded ? "grounded" : "**not grounded**"}${v.correction ? ` — ${cell(v.correction).slice(0, 220)}` : ""}`
    : "";

function containerPage(mapKey, m, c, findVerdict) {
  const ci = m.containers.indexOf(c);
  const v = findVerdict(mapKey, ci);
  const rels = m.relationships.filter((r) => r.from === c.id || r.to === c.id);
  const comps = (m.components_by_container ?? []).find(
    (x) => x.container === c.id || x.container === c.label,
  );
  const compSrc = (m.c4component_sources ?? []).find(
    (x) => x.container === c.id || x.container === c.label || x.container.includes(c.id),
  );
  const lines = [
    `# ${c.label}`,
    "",
    `**Technology:** ${c.technology}`,
    "",
    `**Responsibility:** ${c.responsibility}`,
    "",
    `**Code roots:** ${(c.code_roots ?? []).map((p) => `\`${p}\``).join(" · ")}`,
  ];
  if (c.entrypoints?.length)
    lines.push("", `**Entrypoints:** ${c.entrypoints.map((p) => `\`${p}\``).join(" · ")}`);
  lines.push("", `**Grounding:** ${c.evidence}`);
  if (v) lines.push("", `**Refuter's verdict:** ${verdictCell(v)}`);
  lines.push(
    "",
    "## Where it sits",
    "",
    "| From | To | What | How | Refuter |",
    "|---|---|---|---|---|",
  );
  for (const r of rels) {
    const rv = findVerdict(mapKey, m.containers.length + m.relationships.indexOf(r));
    lines.push(
      `| ${r.from} | ${r.to} | ${cell(r.label)} | ${cell(r.technology)} | ${verdictCell(rv)} |`,
    );
  }
  if (compSrc) {
    lines.push(
      "",
      "## Components",
      "",
      fence(compSrc.source),
      "",
      `_Caption — components of ${c.label}, from the paths on each element._`,
    );
  }
  if (comps) {
    lines.push("", "| Component | Path | Responsibility |", "|---|---|---|");
    for (const k of comps.components)
      lines.push(`| **${k.label}** | \`${k.path}\` | ${cell(k.responsibility)} |`);
  }
  // A lifecycle is a stateDiagram-v2 a container owns (docs/PICTURES.md: a gate, a mode, a rung —
  // "what state is it in and what flips it"), drawn once on the page; per-instance records are
  // generated by the scripts the caption names, never hand-kept here.
  for (const life of (m.lifecycles ?? []).filter((x) => x.container === c.id)) {
    lines.push(
      "",
      `## Lifecycle: ${life.title}`,
      "",
      fence(life.source),
      "",
      `_Caption — ${life.caption}_`,
    );
  }
  return `${lines.join("\n")}\n`;
}

function mirrorPage(c, target) {
  return `# ${c.label}\n\nThis container is the deployed runtime seen from the operating model. Its page lives in the runtime map: [${target}](${target}).\n`;
}

function indexHeader() {
  return [
    "# Architecture — the storybook",
    "",
    "One page per container, each grounded in code paths (a diagram is a claim; an ungrounded diagram is",
    "a lie with good kerning — `docs/PICTURES.md`). The C4 model: **Context** (people, the system, its",
    "neighbours) → **Container** (separately runnable units) → **Component** (the modules inside one).",
    "",
    "**Generated** by `scripts/architecture-pages.mjs` from `source/` (the two maps derived from the code",
    "on 2026-09-25, one refuter verdict per claim, the Graphify parity notes); `tests/arch/architecture-pages.spec.ts`",
    "regenerates and fails on drift, and checks every code root exists. Edit the source, not the pages;",
    "read a container's page before touching it, and update the source in the same PR. Provenance:",
    "`docs/adr/0008` chose Mermaid as the spec surface for exactly this. The research package behind",
    "the source (each refuter's evidence, the narrative synthesis, the parity sketch) is not in the",
    "tree — it stays at the commit that carried it:",
    "[`synthesis.md`](https://github.com/ejclark/skynet-capital/blob/6a900d3ea08c9fed1d6ea339d38f0a324db5535c/docs/architecture/source/synthesis.md) ·",
    "[`verdicts.json`](https://github.com/ejclark/skynet-capital/blob/6a900d3ea08c9fed1d6ea339d38f0a324db5535c/docs/architecture/source/verdicts.json).",
    "",
  ].join("\n");
}

function indexMapSection(mapKey, m, findVerdict) {
  const lines = [
    `## ${MAP_TITLES[mapKey] ?? mapKey}`,
    "",
    fence(m.c4context_source),
    "",
    `_Caption — system context of the ${mapKey.replace("-", " ")}, from the code paths named on each element._`,
    "",
  ];
  lines.push(
    "| Container | Technology | Responsibility | Code roots | Page |",
    "|---|---|---|---|---|",
  );
  for (const c of m.containers) {
    const page = `${mapKey}-${slug(c.id)}.md`;
    lines.push(
      `| **${c.label}** | ${cell(c.technology.split(";")[0]).slice(0, 80)} | ${cell(c.responsibility).slice(0, 140)} | ${(
        c.code_roots ?? []
      )
        .slice(0, 3)
        .map((p) => `\`${p}\``)
        .join(", ")} | [${page}](${page}) |`,
    );
  }
  lines.push(
    "",
    fence(m.c4container_source),
    "",
    `_Caption — containers of the ${mapKey.replace("-", " ")} and how they talk._`,
    "",
  );
  const ungrounded = m.containers.filter(
    (_, i) => findVerdict(mapKey, i)?.grounded === false,
  ).length;
  lines.push(
    `Refuted: ${m.containers.length} containers and ${m.relationships.length} relationships; ${ungrounded} container claim(s) not grounded as drawn (corrections on the pages).`,
    "",
  );
  if (m.undocumented?.length) {
    lines.push(
      `<details><summary><strong>Undocumented before this page</strong> — ${m.undocumented.length} subsystems no doc named</summary>`,
      "",
    );
    for (const u of m.undocumented) lines.push(`- ${u}`);
    lines.push("", "</details>", "");
  }
  for (const d of (m.c4component_sources ?? []).filter((x) => x.container.startsWith("dynamic:"))) {
    lines.push(`### Flow — ${d.container.replace("dynamic:", "")}`, "", fence(d.source), "");
  }
  return lines.join("\n");
}

function indexParity(parity) {
  if (!parity) return "";
  const lines = ["## Graphify parity", "", "| Community | Hubs | Mapped to |", "|---|---|---|"];
  for (const g of parity.graphify_communities ?? [])
    lines.push(
      `| ${cell(g.community)} | ${cell((g.hubs ?? []).slice(0, 3).join(", "))} | ${cell(g.mapped_to_container)} |`,
    );
  if (parity.containers_with_no_code?.length)
    lines.push(
      "",
      `**Containers with no code presence:** ${cell(parity.containers_with_no_code.join("; "))}`,
    );
  if (parity.communities_with_no_container?.length)
    lines.push(
      "",
      `**Communities with no container:** ${cell(parity.communities_with_no_container.join("; "))}`,
    );
  return `${lines.join("\n")}\n`;
}

/** Every page the storybook consists of, as { "<file>.md": content }. Pure — no I/O. */
export function renderPages({ maps, verdicts, parity }) {
  const findVerdict = verdictFinder(maps, verdicts);
  const pages = {};
  let index = indexHeader();
  for (const [mapKey, m] of Object.entries(maps).filter(([k]) => !k.startsWith("_"))) {
    index += `${indexMapSection(mapKey, m, findVerdict)}\n`;
    for (const c of m.containers) {
      const file = `${mapKey}-${slug(c.id)}.md`;
      pages[file] =
        mapKey === "operating-model" && MIRRORS[c.id]
          ? mirrorPage(c, MIRRORS[c.id])
          : containerPage(mapKey, m, c, findVerdict);
    }
  }
  index += indexParity(parity);
  pages["README.md"] = index;
  return pages;
}

function main() {
  const check = process.argv.includes("--check");
  const pages = renderPages(readSource());
  mkdirSync(OUT, { recursive: true });
  const drift = [];
  for (const [file, content] of Object.entries(pages)) {
    const path = join(OUT, file);
    if (check) {
      if (!existsSync(path) || readFileSync(path, "utf8") !== content) drift.push(file);
    } else writeFileSync(path, content);
  }
  const stale = readdirSync(OUT).filter((f) => f.endsWith(".md") && !(f in pages));
  if (check) {
    if (drift.length || stale.length) {
      console.error(
        `architecture-pages: drift — ${drift.length} page(s) differ from the render${stale.length ? `, ${stale.length} stale page(s): ${stale.join(", ")}` : ""}: ${drift.join(", ")}\nRegenerate with: node scripts/architecture-pages.mjs`,
      );
      process.exit(1);
    }
    console.log(`architecture-pages: ✓ ${Object.keys(pages).length} pages match source/.`);
    return;
  }
  console.log(
    `architecture-pages: wrote ${Object.keys(pages).length} pages to docs/architecture/.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
