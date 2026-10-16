#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

// UI catalog — writes app/src/ui/CATALOG.md, the short machine-readable index of the app's shared UI
// parts that an agent reads before building one (the component-library study,
// docs/research/component-library-study.md: the measured agent-side win of a component library
// comes from the index, not from the library existing).
//
// Coverage: every module under app/src/ui (the primitives home, app/src/ui/README.md) plus every
// app/src/shell module that five or more production files import. Fan-in counts files, by static
// relative imports from app/src only — tests never count, the same rule the code census used.
//
// One entry per module, the part it is mostly imported for leading: its job (the first sentence of
// its JSDoc), its props or signature (read from the source text, best-effort — no type checker),
// the importer count, the first real call site, and "when not to use" from a `@whenNot` tag.
// Output is deterministic (sorted, no dates or shas) so `--check` can compare it byte for byte.
//
//   node scripts/ui-catalog.mjs           write CATALOG.md
//   node scripts/ui-catalog.mjs --check   exit 1 if CATALOG.md is stale, 0 if current
// Wired advisory in tests/arch/ui-catalog.spec.ts: a stale catalog is navigation debt, not a defect.

const ROOT = process.cwd();
const SRC = join(ROOT, "app/src");
const UI = join(SRC, "ui");
const SHELL = join(SRC, "shell");
const OUT = join(UI, "CATALOG.md");
const MIN_FAN_IN = 5;
const CODE = /\.(tsx?|mjs)$/;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "node_modules") walk(p, out);
    } else if (CODE.test(e.name)) out.push(p);
  }
  return out.sort();
}

const rel = (p) => relative(ROOT, p).split("\\").join("/");

function resolveImport(from, spec) {
  if (!spec.startsWith(".")) return null;
  const base = resolve(dirname(from), spec);
  for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

/** Names a `{ A, B as C, type D }` clause imports (the exported side of each `as`). */
function importedNames(clause) {
  const braces = clause.match(/\{([^}]*)\}/);
  if (!braces) return [];
  return braces[1]
    .split(",")
    .map((s) =>
      s
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)[0]
        .trim(),
    )
    .filter(Boolean);
}

const IMPORT_RE = /(?:import|export)\s+((?:type\s+)?[^'";]*?)\s*from\s*["']([^"']+)["']/g;

/** Every production file's static relative imports: [{ file, target, names }]. */
function importEdges(files) {
  const edges = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const m of src.matchAll(IMPORT_RE)) {
      const target = resolveImport(file, m[2]);
      if (target && target !== file) edges.push({ file, target, names: importedNames(m[1]) });
    }
  }
  return edges;
}

const EXPORT_RE =
  /^export\s+(?:default\s+)?(?:async\s+)?(function\*?|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm;

/** The JSDoc block that ends right before `index`, if only whitespace separates them. */
function jsdocBefore(src, index) {
  const head = src.slice(0, index);
  const end = head.lastIndexOf("*/");
  if (end < 0 || head.slice(end + 2).trim() !== "") return "";
  const start = head.lastIndexOf("/**", end);
  return start < 0 ? "" : head.slice(start, end + 2);
}

function moduleExports(src) {
  return [...src.matchAll(EXPORT_RE)].map((m) => ({
    kind: m[1],
    name: m[2],
    index: m.index,
    doc: jsdocBefore(src, m.index),
  }));
}

const docText = (doc) =>
  doc
    .replace(/^\/\*\*|\*\/$/g, "")
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, ""))
    .join("\n");

function tag(doc, name) {
  const m = docText(doc).match(new RegExp(`@${name}\\s+([^@]*)`));
  return m ? m[1].replace(/\s+/g, " ").trim() : "";
}

/** One line: the doc's first sentence, issue refs and markdown ticks dropped, capped at 160. */
function firstSentence(doc) {
  const body = docText(doc)
    .split(/\n\s*@/)[0]
    .replace(/\s+/g, " ")
    .trim();
  const sentence = (body.match(/^.*?[.!?](?=\s|$)/) ?? [body])[0]
    .replace(/\s*\((?:[^()]*#\d+[^()]*)\)/g, "")
    .trim();
  return sentence.length > 160 ? `${sentence.slice(0, 159).trimEnd()}…` : sentence;
}

/** The text between the bracket at `open` and its match. */
function balanced(src, open) {
  const pairs = { "(": ")", "{": "}", "<": ">" };
  const close = pairs[src[open]];
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === src[open]) depth++;
    else if (src[i] === close && --depth === 0) return src.slice(open + 1, i);
  }
  return "";
}

const oneLine = (s) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\breadonly\s+/g, "")
    .replace(/\s+/g, " ")
    .replace(/;\s*}/g, " }")
    .replace(/,\s*\)/g, ")")
    .trim()
    .replace(/,$/, "");

/** Props for a component (its parameter's type), a signature for any other function, else the kind. */
function signature(src, exp) {
  if (!/function|const/.test(exp.kind)) return exp.kind;
  let i = exp.index + src.slice(exp.index).indexOf(exp.name) + exp.name.length;
  while (/[\s=:]/.test(src[i]) || src.startsWith("async", i))
    i += src.startsWith("async", i) ? 5 : 1;
  if (src[i] === "<") i += balanced(src, i).length + 2;
  if (src[i] !== "(") return exp.kind === "const" ? "value" : "";
  const params = oneLine(balanced(src, i));
  const typed = params.match(/^\{[\s\S]*?\}\s*:\s*([\s\S]*)$/);
  if (typed && /^[A-Z]/.test(exp.name)) return `props ${typed[1]}`;
  const cut = params.length > 200 ? `${params.slice(0, 199)}…` : params;
  return `(${cut})`;
}

/** The first line (in sorted importer order) that uses `name` outside an import statement. */
function firstUse(importers, name) {
  const word = new RegExp(`(?:<${name}\\b|\\b${name}\\b)`);
  for (const file of importers) {
    const lines = readFileSync(file, "utf8").split("\n");
    let inImport = false;
    for (let n = 0; n < lines.length; n++) {
      const line = lines[n];
      if (/^\s*(?:import|export)\b[^;]*\bfrom\b/.test(line)) continue;
      if (/^\s*import\b/.test(line) && !/from\s*["']/.test(line)) inImport = true;
      if (inImport) {
        if (/from\s*["']/.test(line)) inImport = false;
        continue;
      }
      if (word.test(line)) return { at: `${rel(file)}:${n + 1}`, code: line.trim().slice(0, 140) };
    }
  }
  return null;
}

function entry(file, edges) {
  const src = readFileSync(file, "utf8");
  const exps = moduleExports(src);
  const ins = edges.filter((e) => e.target === file);
  const importers = [...new Set(ins.map((e) => e.file))].sort();
  const uses = (name) => ins.filter((e) => e.names.includes(name)).length;
  const lead = [...exps].sort((a, b) => uses(b.name) - uses(a.name))[0];
  const header = src.match(/^\s*(?:import[^;]*;\s*)*(\/\*\*[\s\S]*?\*\/)/)?.[1] ?? "";
  const doc = lead?.doc || header;
  return {
    name: lead?.name ?? rel(file),
    file: rel(file),
    job: firstSentence(doc),
    category: tag(doc, "category") || tag(header, "category"),
    exports: exps.map((e) => e.name),
    signature: lead ? signature(src, lead) : "",
    importers: importers.length,
    use: lead ? firstUse(importers, lead.name) : null,
    whenNot: tag(doc, "whenNot") || tag(header, "whenNot"),
  };
}

function render(e) {
  const lines = [`### ${e.name}`, "", `- file: \`${e.file}\``, `- job: ${e.job}`];
  if (e.category) lines.push(`- category: ${e.category}`);
  if (e.exports.length > 1) lines.push(`- exports: ${e.exports.map((x) => `\`${x}\``).join(", ")}`);
  const [field, value] = e.signature.startsWith("props ")
    ? ["props", e.signature.slice(6)]
    : e.signature.startsWith("(")
      ? ["signature", e.signature]
      : ["kind", e.signature];
  lines.push(`- ${field}: ${value ? `\`${value}\`` : ""}`);
  lines.push(`- importers: ${e.importers}`);
  lines.push(`- usage: ${e.use ? `\`${e.use.code}\` — \`${e.use.at}\`` : ""}`);
  lines.push(`- when not to use: ${e.whenNot}`);
  return lines.map((l) => l.trimEnd()).join("\n");
}

/** An import of the barrel counts for each primitive it names, so `from "../ui"` is fan-in too. */
function throughBarrel(edges) {
  const barrel = [join(UI, "index.ts"), join(UI, "index.tsx")];
  const modules = walk(UI).filter((f) => !barrel.includes(f));
  const names = new Map(
    modules.map((f) => [f, moduleExports(readFileSync(f, "utf8")).map((e) => e.name)]),
  );
  const routed = edges
    .filter((e) => barrel.includes(e.target))
    .flatMap((e) =>
      modules
        .filter((f) => e.names.some((n) => names.get(f).includes(n)))
        .map((target) => ({ ...e, target })),
    );
  return [...edges, ...routed];
}

function buildCatalog() {
  const files = walk(SRC);
  const edges = throughBarrel(importEdges(files));
  const byFanIn = (a, b) => b.importers - a.importers || a.name.localeCompare(b.name);
  const ui = walk(UI)
    .filter((f) => !/\/index\.tsx?$/.test(f))
    .map((f) => entry(f, edges))
    .sort(byFanIn);
  const shell = walk(SHELL)
    .filter((f) => dirname(f) === SHELL)
    .map((f) => entry(f, edges))
    .filter((e) => e.importers >= MIN_FAN_IN)
    .sort(byFanIn);
  return [
    "# UI catalog",
    "",
    "> Generated by `npm run ui:catalog` (`scripts/ui-catalog.mjs`) — do not edit by hand. The index",
    "> of the app's shared UI parts: read it before building one, reuse an entry when it fits, and",
    "> extract a new primitive only by the rule in `app/src/ui/README.md`.",
    "",
    `Coverage: every module in \`app/src/ui\` (${ui.length}) and every \`app/src/shell\` module`,
    `imported by ${MIN_FAN_IN}+ production files (${shell.length}). Fields: job from the JSDoc's first`,
    "sentence, props read from the source (best-effort), first real call site, `@whenNot` tag.",
    "",
    "## Primitives (`app/src/ui`)",
    "",
    ui.length
      ? ui.map(render).join("\n\n")
      : "_None yet — the first one lands with its own entry._",
    "",
    `## Shared shell modules (${MIN_FAN_IN}+ importers)`,
    "",
    shell.map(render).join("\n\n"),
    "",
  ].join("\n");
}

const next = buildCatalog();
if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== next) {
    console.error("app/src/ui/CATALOG.md is stale — run `npm run ui:catalog` and commit it.");
    process.exit(1);
  }
  console.log("app/src/ui/CATALOG.md is current.");
} else {
  writeFileSync(OUT, next);
  console.log(`wrote ${rel(OUT)}`);
}
