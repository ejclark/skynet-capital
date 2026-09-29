#!/usr/bin/env node
// Breakpoint scan — lists every `@media` width outside the three named widths (docs/BRAND.md →
// "Three named widths": phone ≤ 700 · tablet ≤ 860 · bench ≥ 1280, plus each edge's complement).
// ADVISORY by design and not wired into `npm test`: the existing off-set widths are known and are
// not being mass-rewritten, so a red would only fire on old code. It exists so a session touching
// a stylesheet can see which of its queries are off the set and fold one onto an edge while it is
// there. Container queries (`@container`) are skipped — they measure a pane, not the window.
//
//   npm run breakpoints:scan    # always exits 0
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** `${min|max}-${px}` pairs that sit on a named edge: each edge and its complement. */
const ON_SET = new Set(["max-700", "min-701", "max-860", "min-861", "max-1279", "min-1280"]);
const ROOTS = ["app/src", "src"];

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(css|ts|tsx)$/.test(e.name) && !e.name.endsWith(".d.ts")) acc.push(p);
  }
  return acc;
}

const off = [];
let total = 0;
for (const file of ROOTS.flatMap((r) => walk(r))) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (!line.includes("@media")) return;
    for (const m of line.matchAll(/(min|max)-width:\s*(\d+)px/g)) {
      total++;
      if (!ON_SET.has(`${m[1]}-${m[2]}`)) off.push(`${file}:${i + 1}  ${m[1]}-width: ${m[2]}px`);
    }
  });
}

console.log(`📐 Breakpoint scan — ${total} media-query widths, ${off.length} off the named set`);
for (const o of off) console.log(`  ${o}`);
console.log("\n  named: phone ≤ 700 · tablet ≤ 860 · bench ≥ 1280 (docs/BRAND.md). Advisory only.");
