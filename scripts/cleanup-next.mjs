#!/usr/bin/env node
// CLEAN-UP NEXT — which clean-up rep to do first, read from what the scans already print.
//
// THE ORDER: work a script does for 0 tokens comes first, then debt units removed per million
// tokens, highest first, and a rep whose file an open PR already touches goes last, marked.
//
// A sort on purpose, not a scored model: every weight beyond this is a constant nobody measured.
// The scan still names the target; this only orders the scans. It does not know that copies of a
// duplicate symbol may disagree (`dollars` has 4 distinct bodies) and does not read the protected
// paths: the drill does both. A scan it could not read is named, never scored as nothing to do.
//
//   node scripts/cleanup-next.mjs [--json]    # 1 REST read + 1 per open PR
//   ... --explain   # {outputs: {<script>: output}, openPrFiles: {<file>: <pr>}} on stdin (specs)
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { isMain } from "./is-main.mjs";
import { ensureGhToken, ghRestAll } from "./moneypenny/gh.mjs";

// One rep from any scan's candidate. Clone-scan's root scope reports paths relative to src/, so they
// gain it here to match the path an open PR reports; the app scope's already carry app/src/. The
// scope decides, never the first folder: src/scripts/ exists, and a first-folder guess kept
// `scripts/x.ts` as a repo path that is not there, missing the open PR on it (#6721).
// No target means the output changed shape: `rank` names that scan as unreadable, rather than it
// looking clean.
const repOf = (c, root) => {
  const at = (where) => `${root ? "src/" : ""}${where.split(":")[0]}`;
  const files = c.files ?? (c.a ? [at(c.a), at(c.b)] : [c.target ?? c.file, c.from, c.to]);
  const target = c.name ? `${c.name} ×${c.copies}` : (c.target ?? c.file ?? c.from ?? c.a);
  if (!target) throw new Error("no target");
  const moves = c.copies
    ? c.copies - 1
    : (c.findings?.length ?? (c.exports ? c.exports.length + c.types.length : 1));
  return { target, files: files.filter(Boolean), moves };
};
const picks = (o) => {
  if (!("candidate" in o)) throw new Error("no candidate key");
  const fromScope = (s, root) =>
    [s?.candidate, s?.runnerUp].filter(Boolean).map((c) => repOf(c, root));
  return [...fromScope(o, true), ...fromScope(o.app, false)];
};
const cssReps = (o) => {
  const byFile = {};
  for (const f of o.findings.equalsToken) {
    const file = f.where.split(":")[0];
    byFile[file] = (byFile[file] ?? 0) + 1;
  }
  // The six largest: every css file costs 0, so an uncapped list would hide every other scan.
  const largest = Object.entries(byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return largest.map(([file, moves]) => ({ target: file, files: [file], moves }));
};
// This scan prints a bare null when no id is duplicated, and names no file, so it never collides.
const idReps = (o) => (o === null ? [] : [{ target: o.id, files: [], moves: o.count - 1 }]);

// priceM is an estimate in million tokens per rep: a Sonnet workflow agent is about 1.6M here (0.13M
// fresh + 1.45M cache, the 2026-11 census), scaled by how much of the repo the rep reads. The css
// rep is 0 because `css-literal-scan --apply` does it with no model.
export const EYES = [
  { script: "css-literal-scan", flag: "--json", priceM: 0, reps: cssReps },
  { script: "forward-test-id-scan", priceM: 0.6, reps: idReps },
  { script: "doc-rot-scan", priceM: 0.8 },
  { script: "dead-scan", priceM: 1.6 },
  { script: "dupe-scan", priceM: 1.8 },
  { script: "spec-gap-scan", priceM: 2.2 },
  { script: "clone-scan", priceM: 2.5 },
  { script: "dep-graph-scan", priceM: 3 },
  { script: "arch-scan", priceM: 4 },
];

const perM = (r) => (r.priceM === 0 ? Infinity : r.moves / r.priceM);

/** Pure. `outputs` maps a script to what it printed; a missing key means nothing usable. */
function rank(outputs, openPrFiles) {
  const rows = [];
  const unreadable = [];
  for (const { script, priceM, reps = picks } of EYES) {
    try {
      if (!(script in outputs)) throw new Error("failed, or printed something other than JSON");
      for (const r of reps(outputs[script])) {
        const openPr = r.files.map((f) => openPrFiles?.[f]).find(Boolean) ?? null;
        rows.push({ ...r, script, priceM, openPr });
      }
    } catch (err) {
      unreadable.push({ script, why: err.message });
    }
  }
  // Two 0-token rows subtract to NaN (Infinity - Infinity), which falls through to the unit count.
  rows.sort(
    (a, b) =>
      Boolean(a.openPr) - Boolean(b.openPr) ||
      perM(b) - perM(a) ||
      b.moves - a.moves ||
      a.target.localeCompare(b.target),
  );
  return { rows, unreadable };
}

/** Run one scan. A non-zero exit or text that is not JSON leaves it out, so `rank` names it. */
function readEye({ script, flag = "--candidate" }) {
  const r = spawnSync("node", [`scripts/${script}.mjs`, flag], {
    encoding: "utf8",
    maxBuffer: 64 << 20,
  });
  try {
    return r.status === 0 ? [[script, JSON.parse(r.stdout)]] : [];
  } catch {
    return [];
  }
}

function readOpenPrFiles() {
  try {
    ensureGhToken();
    const files = {};
    for (const pr of ghRestAll("pulls?state=open")) {
      for (const f of ghRestAll(`pulls/${pr.number}/files`)) files[f.filename] = pr.number;
    }
    return { files };
  } catch (err) {
    return { why: String(err.message).split("\n")[0] };
  }
}

function render({ rows, unreadable, openPrsUnchecked }) {
  const lines = [
    "Clean-up next: script work first, then debt units per million tokens (estimates).",
  ];
  rows.slice(0, 15).forEach((r, i) => {
    const value = r.priceM === 0 ? "script" : `${perM(r).toFixed(1)}/M`;
    const blocked = r.openPr ? `  open PR #${r.openPr} touches it` : "";
    lines.push(`${i + 1}. ${value}  ${r.moves} units  ${r.script}  ${r.target}${blocked}`);
  });
  if (unreadable.length)
    lines.push(`Could not read: ${unreadable.map((u) => `${u.script} (${u.why})`).join(", ")}.`);
  if (openPrsUnchecked)
    lines.push(`Open PRs not checked (${openPrsUnchecked}), so a row may collide with one.`);
  return lines.join("\n");
}

function main() {
  const given = process.argv.includes("--explain") ? JSON.parse(readFileSync(0, "utf8")) : null;
  const outputs = given ? given.outputs : Object.fromEntries(EYES.flatMap(readEye));
  const open = given
    ? given.openPrFiles
      ? { files: given.openPrFiles }
      : { why: "none given" }
    : readOpenPrFiles();
  const report = { ...rank(outputs, open.files), openPrsUnchecked: open.why ?? null };
  console.log(process.argv.includes("--json") ? JSON.stringify(report, null, 2) : render(report));
  // An empty list would read as all clear, so reading no scan at all is a failure.
  if (report.unreadable.length === EYES.length) process.exitCode = 1;
}

if (isMain(import.meta.url)) main();
