#!/usr/bin/env node
// Plain names over member copy — every rejected name in a string app/src renders (#8290).
//
//   node scripts/plain-names-app.mjs                 # scan app/src, exit 1 on any hit
//   node scripts/plain-names-app.mjs --json a.tsx …  # hits in the named files, as JSON
//
// Member copy is what renders: JSX text and string literals. Comments, identifiers, types and
// import paths are code and keep their names (`DeskTiles`, `live/desk.ts`), and the matcher in
// plain-names.mjs already skips anything glued to code (`desk-rail`, `desk.ts`). esbuild strips
// types and comments first, so a comment that mentions the old name never fires.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "acorn";
import { transformSync } from "esbuild";
import { isMain } from "./is-main.mjs";
import { plainNameHits, plainNameMessage } from "./plain-names.mjs";

const sourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(e.name) && !/\.(gen|d)\.ts$/.test(e.name) ? [p] : [];
  });

/** An import or re-export: its path is code, its own declaration (if any) is still walked. */
const isModulePath = (node) =>
  /^(Import|Export(All|Named))Declaration$/.test(node.type) && Boolean(node.source);

/** The text of a string literal or template piece, else null. */
function literalText(node) {
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateElement") return node.value.cooked ?? node.value.raw;
  return null;
}

/**
 * Every string one source file can show a member. esbuild drops the types and the comments and
 * turns JSX text into string literals; acorn then hands back each literal. Import and export paths
 * are skipped. (The root `typescript` is the native 7.x port, which has no JS parser API.)
 */
export function memberStrings(path, source) {
  const { code } = transformSync(source, {
    loader: /\.tsx(\.txt)?$/.test(path) ? "tsx" : "ts",
    jsx: "transform",
    legalComments: "none",
    sourcefile: path,
  });
  const out = [];
  const visit = (node) => {
    if (!node || typeof node.type !== "string") return;
    if (isModulePath(node)) return visit(node.declaration);
    const text = literalText(node);
    if (text !== null) out.push({ text });
    for (const [key, value] of Object.entries(node)) {
      if (key !== "loc") [value].flat().forEach(visit);
    }
  };
  visit(parse(code, { ecmaVersion: "latest", sourceType: "module" }));
  return out;
}

/** Every hit across `files`: `{ file, found, plain, message }`. */
export function scanFiles(files) {
  const hits = [];
  for (const file of files) {
    for (const s of memberStrings(file, readFileSync(file, "utf8"))) {
      for (const hit of plainNameHits(s.text)) {
        const where = `${file} (“${s.text.trim().slice(0, 60)}”)`;
        hits.push({
          file,
          found: hit.found,
          plain: hit.plain,
          message: plainNameMessage(hit, where),
        });
      }
    }
  }
  return hits;
}

if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const named = args.filter((a) => !a.startsWith("--"));
  const hits = scanFiles(named.length ? named : sourceFiles("app/src"));
  if (args.includes("--json")) console.log(JSON.stringify(hits));
  else for (const h of hits) console.error(h.message);
  process.exit(hits.length ? 1 : 0);
}
