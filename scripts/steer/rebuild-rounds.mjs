#!/usr/bin/env node
// REBUILD EVERY OPEN ROUND PAGE FROM MAIN (#6607).
//
//   npm run steer:rebuild -- [--out <dir>] [--roots a,b] [--census <file>] [--any-tooling] [--json]
//
// WHY (the issue's count): Eric carried news between sessions 8 times, once pasting one sentence
// into 7 sessions in 90 seconds, because a parked session never pulls main, so a change to the page
// tooling reaches no round page already up.
//
// WHAT IT DOES. It lists the open rounds from the screens' issues (open-rounds.mjs), finds each
// round's input on this machine, renders every page it can with the tooling in this checkout into
// <out>/<round id>/, and writes <out>/publish.json. A page it cannot rebuild is named with the
// reason, and the rest still run. It lists the tooling commits behind each page it rebuilt.
//
// WHAT IT DOES NOT. It publishes nothing: only a session holding the Artifact tool can, so the plan
// is that session's next step, each entry the arguments of one publish. A round page's store is
// keyed by its round id, so his answers survive the republish.
//
// WHERE A PAGE'S INPUT COMES FROM. Only with the exact round id the page shows (older inputs must
// never overwrite a newer round):
//   1. The page's own round-input.json, published beside every page built since #6607
//      (round-input.mjs). A session reads it with the Artifact tool into its scratchpad, and the next
//      run finds it there. Only this copy says what the page shows, so only it can say "current":
//      the round-input.json a build leaves beside its files.json may never have been published.
//   2. tp.json in a round's folder in a session scratchpad, while that folder survives. /tmp is
//      purged and a cloud session's scratchpad is not on this machine, so this is a bonus, never the
//      plan: on 2026-11-01 this machine held none for any of the 13 open pages.
// A page published before #6607 with no folder left has no input anywhere. It is named, and reaches
// main when its screen's next round is drawn.
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { commonsPaths } from "../redesign/commons.mjs";
import { openRounds } from "./open-rounds.mjs";
import { renderPage } from "./render.mjs";
import { builtStamp, decisionPictures, INPUT_FILE, inputToPublish } from "./round-input.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const PLAN_FILE = "publish.json";
/** All three on every publish: a non-empty declaration is the full set (steer skill, step 6). */
const CAPABILITIES = { db: {}, user: {}, comments: {} };
/** What renders a page: the folder, less what only gathers, reads back or writes the page's files. */
const PAGE_TOOLING = [
  "scripts/steer",
  ":(exclude,glob)scripts/steer/*.d.mts",
  ...[
    "gather",
    "readback",
    "publish-reading",
    "build",
    "rebuild-rounds",
    "open-rounds",
    "round-input",
  ].map((f) => `:(exclude)scripts/steer/${f}.mjs`),
];

const git = (args) =>
  execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

/** Every session scratchpad of this checkout, worktrees' included. */
function defaultRoots(env = {}) {
  const project = dirname(commonsPaths(env).dir);
  const base = dirname(project);
  if (!existsSync(base)) return [];
  return readdirSync(base)
    .filter((d) => d.startsWith(basename(project)))
    .map((d) => join(base, d));
}

/** Round inputs under `roots`, by round id: a copy read back from the page first, then newest. A
 *  folder holding a checkout (specs and fixtures, no rounds) or a past rebuild's output (never
 *  published, so never what a page shows) is not walked. A round-input.json beside a build's own
 *  files is not the page's copy either, and adds nothing to the tp.json beside it. */
function findInputs(roots) {
  const byId = new Map();
  const unreadable = [];
  const take = (path, kind) => {
    try {
      const tp = JSON.parse(readFileSync(path, "utf8"));
      if (!(tp?.designOnly && tp.id)) return;
      const list = byId.get(tp.id) ?? [];
      list.push({ kind, path, tp, at: statSync(path).mtimeMs });
      byId.set(tp.id, list);
    } catch {
      unreadable.push(path);
    }
  };
  const walk = (dir, depth) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    const names = new Set(entries.map((e) => e.name));
    if (names.has("package.json") || names.has(PLAN_FILE)) return;
    if (names.has(INPUT_FILE) && !names.has("tp.json") && !names.has("files.json")) {
      take(join(dir, INPUT_FILE), "page");
    }
    if (names.has("tp.json")) take(join(dir, "tp.json"), "scratchpad");
    if (depth <= 0) return;
    for (const e of entries) {
      if (e.isDirectory() && e.name !== "node_modules" && e.name !== ".git") {
        walk(join(dir, e.name), depth - 1);
      }
    }
  };
  for (const root of roots) walk(root, 8);
  for (const list of byId.values()) {
    list.sort((a, b) => Number(b.kind === "page") - Number(a.kind === "page") || b.at - a.at);
  }
  return { byId, unreadable: [...new Set(unreadable)] };
}

/** The page-tooling commits since a page was built: from its commit when this checkout has it, else
 *  from when it was built. Null when neither is known. */
function commitsSince({ sha, at }) {
  const known = (s) => {
    try {
      git(["merge-base", "--is-ancestor", s, "HEAD"]);
      return true;
    } catch {
      return false;
    }
  };
  const range = sha && known(sha) ? [`${sha}..HEAD`] : at ? [`--since=${at}`] : null;
  if (!range) return null;
  try {
    return git(["log", "--format=%h %s", ...range, "--", ...PAGE_TOOLING])
      .split("\n")
      .filter(Boolean);
  } catch {
    return null;
  }
}

/** Why a round's page has no input to render from: what is here instead, if anything. */
function noInput(round, byId) {
  const here = [...byId.keys()].filter((id) => id.startsWith(`design-${round.issue}-r`)).sort();
  return here.length
    ? `this machine's inputs stop at ${here.join(", ")}, and the page shows ${round.id}`
    : `no inputs on this machine for ${round.id}`;
}

/** The tooling's render of a round's input and its pictures, or an error that says so. */
function render(tp) {
  try {
    const pics = decisionPictures(tp);
    for (const { pic, published } of pics) pic.local = published;
    return { pics, html: renderPage(tp, { img: (pic) => pic.local ?? null }) };
  } catch (err) {
    throw new Error(`main's tooling cannot render its inputs: ${err.message}`);
  }
}

/** Render one round from its input into `<out>/<id>/`: `{ page }`, or `{ current }` when main's
 *  tooling draws it no differently, so a re-run publishes nothing. */
function rebuildOne(round, found, { out, tooling, now, commits }) {
  const { tp } = found;
  const { pics, html } = render(tp);
  // A scratchpad's tp.json says nothing of what the page shows, so it can never read as current.
  const was = tp.built ?? { sha: null, at: tp.generatedAt ?? null };
  const built = builtStamp(html, { sha: tooling, at: now });
  if (was.pageSha256 === built.pageSha256) return { current: { issue: round.issue, id: round.id } };

  const dir = join(out, round.id);
  mkdirSync(dir, { recursive: true });
  const file_path = join(dir, "steer.html");
  const inputPath = join(dir, INPUT_FILE);
  writeFileSync(file_path, html);
  const files = { [INPUT_FILE]: inputPath };
  // A picture still on disk goes too. One that isn't is already on the page, at this same path, and
  // a publish keeps the files it leaves out.
  let keptOnPage = 0;
  for (const { pic, published } of pics) {
    if (found.kind === "scratchpad" && existsSync(pic.src)) {
      const dest = join(dir, published);
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(pic.src, dest);
      files[published] = dest;
    } else keptOnPage += 1;
  }
  writeFileSync(inputPath, `${JSON.stringify(inputToPublish(tp, built), null, 2)}\n`);
  return {
    page: {
      issue: round.issue,
      id: round.id,
      url: round.url,
      source: found.path,
      file_path,
      files,
      capabilities: CAPABILITIES,
      keptOnPage,
      changed: commits(was),
    },
  };
}

/**
 * Rebuild every open round: each named, none stopping the rest. Writes pages and the plan under
 * `out`; publishes nothing.
 * @param {import("./open-rounds.mjs").OpenRound[]} rounds
 * @param {{ roots: string[], out: string, tooling: string, now?: string, commits?: Function }} opts
 */
export function rebuildRounds(rounds, { roots, out, tooling, now, commits = commitsSince }) {
  const { byId, unreadable } = findInputs(roots);
  const result = {
    tooling,
    publish: [],
    current: [],
    failed: [],
    fetch: [],
    settled: [],
    unreadable,
    out,
  };
  const fail = (round, why) =>
    result.failed.push({ issue: round.issue, id: round.id, url: round.url, why });
  for (const round of rounds) {
    if (round.settled) {
      result.settled.push({ issue: round.issue, id: round.id });
    } else if (round.problem) {
      fail(round, `its comments could not be read: ${round.problem}`);
    } else if (!round.url) {
      fail(round, "its issue names no round page");
    } else if (!round.id) {
      fail(round, "its issue does not say which round the page shows");
    } else {
      result.fetch.push({ id: round.id, url: round.url, path: INPUT_FILE });
      const found = byId.get(round.id)?.[0];
      if (!found) {
        fail(round, noInput(round, byId));
        continue;
      }
      try {
        const done = rebuildOne(round, found, { out, tooling, now, commits });
        if (done.current) result.current.push(done.current);
        else result.publish.push(done.page);
      } catch (err) {
        fail(round, err.message);
      }
    }
  }
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, PLAN_FILE), `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

const list = (rows) => rows.map((r) => `#${r.issue} ${r.id ?? "(round unknown)"}`).join(" · ");

/** The report a session reads: what to publish and what changed, then what it could not do. */
export function reportText(r) {
  const open = r.publish.length + r.current.length + r.failed.length;
  const lines = [
    `Open round pages: ${open} (${r.settled.length} more settled). Page tooling at ${r.tooling}.`,
    `${r.publish.length} rebuilt into ${r.out}; nothing is published yet. Plan: ${join(r.out, PLAN_FILE)}`,
  ];
  if (r.publish.length)
    lines.push("", `To publish (${r.publish.length}), one Artifact publish each:`);
  for (const p of r.publish) {
    const kept = p.keptOnPage ? ` · ${p.keptOnPage} picture(s) stay as published` : "";
    lines.push(`  #${p.issue} ${p.id} → ${p.url}${kept}`);
    const changed = p.changed === null ? ["(tooling history unknown)"] : p.changed;
    for (const c of changed.length
      ? changed
      : ["(the page differs; no commit since it was built names why)"]) {
      lines.push(`    ${c}`);
    }
  }
  if (r.current.length) lines.push("", `Already current (${r.current.length}): ${list(r.current)}`);
  if (r.failed.length) lines.push("", `Could not rebuild (${r.failed.length}):`);
  for (const f of r.failed) lines.push(`  #${f.issue} ${f.id ?? "(round unknown)"}: ${f.why}`);
  if (r.fetch.length) {
    lines.push(
      "",
      `Before publishing, Artifact read each of the plan's ${r.fetch.length} "fetch" entries with path ${INPUT_FILE}, then run this again. It says what each page shows, so a page already current drops off the list, and a publish is refused on a page this conversation has not read. A page with no such file was built before #6607: publish it from a scratchpad's input if it is listed above, otherwise it reaches main at its next round.`,
    );
  }
  if (r.unreadable.length) lines.push("", `Unreadable, skipped: ${r.unreadable.join(" · ")}`);
  if (r.settled.length)
    lines.push("", `Settled, left alone (${r.settled.length}): ${list(r.settled)}`);
  return lines.join("\n");
}

/** The open `redesign …` issues and their comments, over REST. One issue's failure is named on it. */
async function liveCensus() {
  const { ensureGhToken, ghRestAll } = await import("../moneypenny/gh.mjs");
  ensureGhToken();
  const issues = ghRestAll("/issues?state=open").filter(
    (i) => !i.pull_request && /^redesign\b/i.test(i.title),
  );
  return issues.map(({ number, title }) => {
    try {
      return { number, title, comments: ghRestAll(`/issues/${number}/comments`) };
    } catch (err) {
      return { number, title, comments: null, error: err.message };
    }
  });
}

/** The commit a rebuild draws with, refusing a checkout whose page tooling isn't main's. */
function toolingOrRefuse(any) {
  if (any) return git(["rev-parse", "--short", "HEAD"]);
  git(["fetch", "origin", "main"]);
  // Against the working tree, not HEAD: an uncommitted edit would render into every page too.
  const differs = git(["diff", "--name-only", "origin/main", "--", ...PAGE_TOOLING]);
  if (differs) {
    throw new Error(
      `steer/rebuild-rounds: this checkout's page tooling is not origin/main's, so these pages would not be main's:\n${differs}\nCheck out origin/main, or pass --any-tooling for a look.`,
    );
  }
  return git(["rev-parse", "--short", "HEAD"]);
}

async function main(argv) {
  const flag = (name) => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? undefined : argv[i + 1];
  };
  const tooling = toolingOrRefuse(argv.includes("--any-tooling"));
  const censusFile = flag("census");
  const census = censusFile ? JSON.parse(readFileSync(censusFile, "utf8")) : await liveCensus();
  const result = rebuildRounds(openRounds(census), {
    roots: flag("roots")?.split(",") ?? defaultRoots(),
    out: resolve(flag("out") ?? mkdtempSync(join(tmpdir(), "steer-rebuild-rounds-"))),
    tooling,
    now: new Date().toISOString(),
  });
  console.log(argv.includes("--json") ? JSON.stringify(result, null, 1) : reportText(result));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err.message);
    process.exit(2);
  });
}
