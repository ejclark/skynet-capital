// LINT A ROUND'S MANIFEST (#5143) — before any critic, before Eric:
//
//   node scripts/redesign/lint.mjs <design.json>     # exit 1 with one line per problem
//
// Checks what a script can (lint-rules.mjs): the fields the steer page needs, a numeric question
// number, what each question asks (`kind`: "design", the default, or "problems", which round 0
// must set so a pick chooses the next round's problem and files no build), a phone and a desk
// picture for today and every option that exist and are ≤200KB, plain language (no designer
// jargon, no Title-Cased name the app's UI never says), and that every quoted “…” in `saw` is
// really there — in a file the manifest cites or in Eric's banked words. A model critic then
// judges taste only.
//
// WHERE QUOTES ARE LOOKED FOR: `today.source` when it is a file, `sources` / `notes` on the
// question or the manifest (paths relative to the manifest, else the repo root — put his pasted
// notes in a file and cite it; cite the app file a quoted label comes from), and Eric's banked
// rounds (REDESIGN_VERBATIM, `:`-separated, defaults below). Never the whole app source: its
// comments paraphrase him, and a paraphrase must not pass as his words.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { lintDesign } from "./lint-rules.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const BANKED =
  "/private/tmp/claude-501/-Users-eric-Developer-skynet-capital/18fcfe8b-decc-4208-bbed-1117271a1b72/scratchpad/shapes";
const VERBATIM = (
  process.env.REDESIGN_VERBATIM ??
  `${BANKED}/r1-feedback/eric-verbatim.md:${BANKED}/r2-feedback/eric-verbatim-r2.md`
)
  .split(":")
  .filter(Boolean);

/** Every .ts/.tsx under the app's and the server's source, specs left out: the UI's words. */
function uiText() {
  const parts = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name) && !/\.(test|spec)\./.test(e.name))
        parts.push(readFileSync(p, "utf8"));
    }
  };
  for (const d of ["app/src", "src"]) if (existsSync(join(ROOT, d))) walk(join(ROOT, d));
  const text = parts.join("\n");
  return { text, lower: text.toLowerCase() };
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: node scripts/redesign/lint.mjs <design.json>");
    process.exit(2);
  }
  const path = resolve(file);
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    console.error(`${file}: not readable JSON (${e.message})`);
    process.exit(1);
  }
  const here = dirname(path);
  const roots = [raw?.root, here, dirname(here)].filter(Boolean).map((r) => resolve(here, r));
  const pictureSize = (p) => {
    const hit = isAbsolute(p) ? p : roots.map((r) => join(r, p)).find((c) => existsSync(c));
    return hit && existsSync(hit) ? statSync(hit).size : null;
  };
  const missing = [];
  const cache = new Map();
  const read = (p, cited) => {
    const hit = [isAbsolute(p) ? p : join(here, p), join(ROOT, p)].find(
      (c) => existsSync(c) && statSync(c).isFile(),
    );
    if (!hit) {
      if (cited) missing.push(p);
      return "";
    }
    if (!cache.has(hit)) cache.set(hit, readFileSync(hit, "utf8"));
    return cache.get(hit);
  };
  const ui = uiText();
  const list = (v) => (Array.isArray(v) ? v : v ? [v] : []);
  const sourcesFor = (q, manifest) =>
    [
      ...list(q.today?.source).map((s) => read(String(s).split(" ")[0], false)),
      ...[
        ...list(q.sources),
        ...list(q.notes),
        ...list(manifest.sources),
        ...list(manifest.notes),
      ].map((s) => read(s, true)),
      ...VERBATIM.map((s) => read(s, false)),
    ].join("\n");
  if (!VERBATIM.some((f) => existsSync(f)))
    console.error(
      "lint: none of Eric's banked-words files exist here (REDESIGN_VERBATIM) — only cited sources are checked",
    );
  const problems = lintDesign(raw, { pictureSize, sourcesFor, ui });
  for (const p of new Set(missing)) problems.push(`manifest: cites ${p}, which isn't there`);
  if (problems.length > 0) {
    for (const p of problems) console.log(p);
    process.exit(1);
  }
  const options = raw.questions.reduce((n, q) => n + q.options.length, 0);
  console.log(`lint: ${file} — clean (${raw.questions.length} question(s), ${options} options)`);
}

main();
