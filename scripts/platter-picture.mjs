#!/usr/bin/env node
// Platter picture — the two pictures a held PR for protected changes carries, generated from git so
// they cannot drift from what is boarded or what landed.
//
//   node scripts/platter-picture.mjs open --count 3            # the choice, at open time
//   node scripts/platter-picture.mjs landed <pr> [--ref R]     # the record, after landing (from the log)
//   node scripts/platter-picture.mjs landed <pr> --log <file>  # the same from a captured log (specs)
//
// WHY (plan #3786 slice 4, the Claude Design round-3 handoff; docs/PICTURES.md → the held-PR
// starters and rule 5 "draw the moment the picture is read"). The held PR's opening picture used to be
// its ledger table, and a gitGraph drawn by hand for the story once showed a merge commit that never
// landed (#3754). Two pictures replace it: at open time, the choice Eric holds and what each button
// does to the undo; after landing, the record in whichever ending is true, read from the first-parent
// log with the same parser scripts/platter-merge-scan.mjs uses to count squashed landings.
//
// The ink mode dress (docs/PICTURES.md, promoted by Eric 2026-09-26): paper for what exists, gold on
// the one decision, seal red on the defect. The snippet is copied whole from the page, never a hex
// chosen here, and the lint's registry check keeps it that way. Labels say what things do; the house
// noun stays in this file's name and the ship script.
//
// Exit codes: 0 printed · 1 bad arguments · 3 the landing for that PR is not in the log (unknown, never
// an empty picture).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { LOG_FORMAT, landings, parseLog } from "./platter-merge-scan.mjs";

/** The frontmatter every picture shares: tight packing so a phone shows bigger text (rule 13). */
const CONFIG = `config:
  flowchart:
    nodeSpacing: 24
    rankSpacing: 36
    padding: 10`;

const FONT = "classDef default font-size:20px,font-family:Verdana";
/** The ink-mode snippet, copied whole from docs/PICTURES.md (rule 11). */
const INK = `    classDef paper fill:#F4EFE6,color:#141210,stroke:#141210,stroke-width:3px
    classDef gold fill:#E0A33A,color:#1A1300,stroke:#1A1300,stroke-width:3px
    classDef defect fill:#B3261E,color:#FFF4EC,stroke:#FFF4EC,stroke-width:3px`;

/** Escape a label for a quoted Mermaid string. */
const q = (s) => String(s).replace(/"/g, "'").replace(/[<>]/g, "");

/** Break a label by hand at about `width` characters, at spaces (rule 4: never rely on auto-wrap). */
export function wrapLabel(text, width = 18) {
  const words = q(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const w of words) {
    if (line && `${line} ${w}`.length > width) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  return lines.join("<br/>");
}

/** The choice at open time: N changes, one held PR, one click, and what each button does to the undo. */
export function openPicture(count) {
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1)
    throw new Error(`open picture needs a count ≥ 1, got ${count}`);
  const changes =
    n === 1
      ? "one protected<br/>change,<br/>one commit"
      : `${n} protected<br/>changes,<br/>one commit each`;
  const merged =
    n === 1
      ? "main: one commit,<br/>it reverts alone"
      : `main: ${n} commits,<br/>any item<br/>reverts alone`;
  return `---
title: "The held PR: the button decides what reverts"
${CONFIG}
---
flowchart TD
    items@{ shape: docs, label: "${changes}" }
    pr@{ shape: stadium, label: "one held PR,<br/>one click by Eric" }
    items ==> pr ==> button{"which button<br/>lands it?"}
    button ==>|Create a merge commit| merged@{ shape: cyl, label: "${merged}" }
    button -->|Squash and merge| squashed@{ shape: cyl, label: "main: one commit,<br/>reverts only<br/>as a block, #3754" }
    class items,pr,merged paper
    class button gold
    class squashed defect
${INK}
    ${FONT}`;
}

/** The record after landing, in whichever ending is true, from one landing record of the merge scan. */
export function landedPicture(landing) {
  const items = landing.items.length
    ? landing.items
    : [{ item: "the boarded changes", why: "the boarded changes" }];
  const nodes = items
    .map(
      (it, i) =>
        `        i${i + 1}@{ shape: doc, label: "${i + 1} ${wrapLabel(it.why || it.item)}" }`,
    )
    .join("\n");
  const n = items.length;
  const pr = landing.pr ? `PR #${landing.pr}` : `commit ${landing.sha}`;
  if (landing.flattened) {
    return `---
title: "${pr}: no item reverts alone"
${CONFIG}
---
flowchart TD
    subgraph held ["the held PR"]
${nodes}
    end
    held ==>|Squash and merge| main@{ shape: cyl, label: "main: ${n === 1 ? "1" : Array.from({ length: n }, (_, i) => i + 1).join(" + ")}<br/>as one commit,<br/>reverts only<br/>as a block, #3754" }
    class ${items.map((_, i) => `i${i + 1}`).join(",")} paper
    class main defect
${INK}
    ${FONT}`;
  }
  return `---
title: "${pr}: any item reverts alone"
${CONFIG}
---
flowchart TD
    subgraph held ["the held PR"]
${nodes}
    end
    held ==>|Create a merge commit| main@{ shape: cyl, label: "main: one merge commit,<br/>any one item<br/>reverts alone" }
    class ${items.map((_, i) => `i${i + 1}`).join(",")},main paper
${INK}
    ${FONT}`;
}

/** The landing for a PR number in a first-parent log, or null. */
export function findLanding(logText, pr) {
  return landings(parseLog(logText)).find((l) => l.pr === Number(pr)) ?? null;
}

function argOf(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

function main(argv) {
  const [mode, ...rest] = argv;
  if (mode === "open") {
    const count = argOf(rest, "--count");
    if (!count) {
      console.error("platter-picture open: --count <n> is required");
      process.exit(1);
    }
    process.stdout.write(`${openPicture(count)}\n`);
    return;
  }
  if (mode === "landed") {
    const pr = rest[0];
    if (!(pr && /^\d+$/.test(pr))) {
      console.error("platter-picture landed: a PR number is required");
      process.exit(1);
    }
    const logFile = argOf(rest, "--log");
    const ref = argOf(rest, "--ref") ?? "origin/main";
    const text = logFile
      ? readFileSync(logFile, "utf8")
      : execFileSync("git", ["log", "--first-parent", `--format=${LOG_FORMAT}`, "-n", "400", ref], {
          encoding: "utf8",
          maxBuffer: 64 * 1024 * 1024, // 400 landings with their ledgers outgrow the 1 MB default
        });
    const landing = findLanding(text, pr);
    if (!landing) {
      console.error(
        `platter-picture landed: PR #${pr} is not a held-PR landing in the first-parent log of ${logFile ?? ref} (400 commits) — unknown, no picture printed`,
      );
      process.exit(3);
    }
    process.stdout.write(`${landedPicture(landing)}\n`);
    return;
  }
  console.error(
    "usage: platter-picture.mjs open --count <n> | landed <pr> [--ref <ref> | --log <file>]",
  );
  process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  main(process.argv.slice(2));
