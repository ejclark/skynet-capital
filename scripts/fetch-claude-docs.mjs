#!/usr/bin/env node
// Mirror the official Claude Code documentation locally — the raw material for token-burn research.
//
//   node scripts/fetch-claude-docs.mjs              # mirror all English pages → .cache/claude-docs/
//   node scripts/fetch-claude-docs.mjs --dir <path> # mirror somewhere else
//
// WHY THIS EXISTS (2026-08-28). Eric asked for research on token-burn efficiency so the budget
// funds higher-tier models instead of overhead (docs/process/TOKEN-EFFICIENCY.md is the result).
// That research reads the docs as downloaded files — subagents each mine a slice without
// re-fetching — so the download step is codified here, re-runnable whenever the docs move again.
// The provenance gist (fetch_claude_docs.py, allisoneer) needed a Jina.ai API key and targeted
// the retired docs.anthropic.com/en/docs/claude-code/* paths; this script needs neither trick:
// code.claude.com publishes a machine-readable index (llms.txt) and serves every page as raw
// markdown at its canonical URL + `.md`. No key, no third-party relay, no HTML scraping.
//
// The mirror is COMMITTED (Eric's call, 2026-08-28): future sessions reference it without
// re-fetching, and a refresh makes upstream doc changes reviewable as an ordinary git diff —
// `node scripts/fetch-claude-docs.mjs && git diff docs/vendor/claude-code` is a "what changed
// in Claude Code?" report for free. Cite the code.claude.com URL in prose; read the local file.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const INDEX_URL = "https://code.claude.com/docs/llms.txt";
const DEFAULT_DIR = "docs/vendor/claude-code";
const CONCURRENCY = 8;

const dirFlag = process.argv.indexOf("--dir");
const outDir = dirFlag !== -1 ? process.argv[dirFlag + 1] : DEFAULT_DIR;

const index = await fetch(INDEX_URL);
if (!index.ok) {
  console.error(`fetch ${INDEX_URL} → ${index.status}`);
  process.exit(1);
}
const text = await index.text();

// English section only: from "## English" to the next "## " language heading (or EOF).
const english = text.split(/^## /m).find((s) => s.startsWith("English")) ?? text;
const urls = [
  ...new Set(english.match(/https:\/\/code\.claude\.com\/docs\/en\/[a-z0-9-]+\.md/g) ?? []),
];
if (urls.length === 0) {
  console.error("no doc URLs found in llms.txt — index format may have changed");
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "llms.txt"), text);

const failures = [];
let done = 0;
const queue = [...urls];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let url = queue.shift(); url; url = queue.shift()) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await writeFile(path.join(outDir, path.basename(new URL(url).pathname)), await res.text());
        done += 1;
      } catch (err) {
        failures.push(`${url} — ${err.message}`);
      }
    }
  }),
);

console.log(`mirrored ${done}/${urls.length} pages → ${outDir}`);
for (const f of failures) console.error(`FAILED ${f}`);
process.exit(failures.length ? 1 : 0);
