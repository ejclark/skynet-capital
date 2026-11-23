#!/usr/bin/env node
// THE PLACEMENT CHECK (#8005 slice 2) — every build names its IA home before it lands. When a branch
// adds something a member sees, this names the IA group (docs/IA.md §5) it extends, or flags it as
// homeless, while placing it is still one line in triage.json or one cite in docs/IA.md.
//
//   npm run cohesion:placement                    # this branch against its merge base with origin/main
//   npm run cohesion:placement -- --base <ref>    # against its merge base with another ref
//   npm run cohesion:placement -- --commit <sha>  # replay one landed commit against its first parent
//   npm run cohesion:placement -- --json          # the rows as JSON
//
// WHAT COUNTS AS MEMBER-FACING is the census's own reading (`cohesion.mjs` memberFacing), never a
// list kept here: a new SCREEN (a route, a section, a Milestones chapter, a landing window, a server
// page, a shell part — coverage.mjs's screens), a new NAME (the names pass: a top tab or a door whose
// words name a place, a section, window or chapter label, a place Moneypenny can send a member to),
// a new PART (a shell or route component file the branch adds, or one it first mounts on a route —
// the census's parts pass), and a new member API route no screen or chat tool reads (its row 4c).
// A nav label is a door in the names pass; a dock entry is a landing window or one of Moneypenny's
// place names. Each is read at the base and at the head; only what the head adds is judged, so
// standing debt never re-fires on an unrelated branch.
//
// HOW EACH IS PLACED, by the same rules the census counts homeless with — so a build this check
// passes cannot be one the census then counts homeless (the plan's falsifier, 2026-12-14):
//   - a screen or a name extends the group its screen's `home` names in docs/members/triage.json;
//     no home is homeless; no triage row at all is unjudged (journey-coverage's spec blocks that).
//   - a part is placed or homeless by the census's own rule (`placeParts`: docs/IA.md cites it, or a
//     part above it). Its group is read from the code, never from where a cite happens to sit (a §5
//     line can name a file only to say what it does NOT render): the nearest routes up its importers,
//     and the homes of those routes' screens. A part the root frame mounts is the shell's.
//   - a new word that now names places in two IA groups, or a second word for one place, is a new
//     label collision (census row 1) — flagged beside the placement, never instead of it.
//   - a member route src/server serves that nothing in the app or the chat names is homeless.
//
// ADVISORY WITH A RATCHET, NEVER A RED BUILD (CLAUDE.md: a gate is a momentum breaker unless it
// protects a constraint). Exit 1 when an addition is homeless, unjudged or collides, or the census's
// homeless count is above cohesion-budget.json; 0 otherwise, and 0 when there is no base to read.
// `ship.sh open` and tests/arch/placement.spec.ts run it as advisory, the way the Coach scans run.
//
// HOW THE BASE IS READ: `git archive` unpacks the base's app/src, src/server, src/companion and the
// two IA files into a temp dir, and this script re-runs itself there with `--snapshot` (the readers
// take paths relative to the working directory). Git objects only, so any landed commit replays.

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMain } from "../is-main.mjs";
import { memberFacing } from "./cohesion.mjs";
import {
  HOMES,
  importsOf,
  labelCollisions,
  OUTSIDE_THE_MODEL,
  placeParts,
} from "./cohesion-plan.mjs";
import { parseRouteTree } from "./coverage.mjs";

const IA = "docs/IA.md";
const ROUTE_TREE = "app/src/routeTree.gen.ts";
const ROOT = "app/src/routes/__root.tsx";
/** The route a part reaches through the root frame: every page mounts it (docs/IA.md §5.8). */
export const SHELL = "shell";
const BUDGET = "cohesion-budget.json";
/** What a base tree needs for the readers: the app, the hand-listed server pages, her place list. */
const TREE = ["app/src", "src/server", "src/companion", IA, "docs/members/triage.json"];
const PART = /^app\/src\/(shell|routes)\/[^/]+\.tsx$/;
const NOT_LIVING = new Set(["retire", "redirect-only"]);

// ─── pure core (specced in tests/scripts/crawl-placement.spec.ts) ─────────────────────────────────

/** docs/IA.md §5's groups: slug → `{ num, name }`, the name being the heading up to its dash. */
export function groupsOf(iaSrc) {
  const out = new Map();
  for (const [slug, num] of Object.entries(HOMES)) {
    const line = iaSrc.split("\n").find((l) => l.startsWith(`### ${num} `));
    const name = line?.slice(`### ${num} `.length).split(" — ")[0].trim();
    out.set(slug, { num, name: name || slug });
  }
  return out;
}

/**
 * The IA groups a part extends: the homes of the living screens on the routes that reach it
 * (`routes` holds route paths, or SHELL for the root frame). Sorted; "no home" stands for a screen
 * triage places nowhere.
 */
export function homesOfRoutes(routes, screens) {
  const homes = new Set();
  for (const r of routes) {
    if (r === SHELL) homes.add("shell");
    for (const s of screens) {
      if (s.path === r && !NOT_LIVING.has(s.verdict)) homes.add(s.home ?? "no home");
    }
  }
  return [...homes].sort();
}

const nameKey = (n) => `${n.level}|${n.place}|${n.word}`;

/** How a home reads: one of §5's groups, the signed-out pages, or none. */
function statusOf(home) {
  if (home === undefined) return "homeless";
  return home === OUTSIDE_THE_MODEL ? "pre-auth" : "extends";
}

/**
 * What the head adds over the base, each placed: `[{ kind, what, home?, status, … }]`.
 * `base`/`head` are memberFacing() snapshots; `parts` is placeParts() over the files the branch
 * added, read at the head, each with the `routes` that reach it. A section's own label folds into
 * its new screen's row rather than repeating it as a name.
 */
export function placementRows(base, head, { parts = [] } = {}) {
  const screens = screenRows(base.screens, head.screens);
  const byKey = new Map(screens.map((r) => [r.what, r]));
  const served = new Set(base.api?.served ?? []);
  return [
    ...screens,
    ...nameRows(base.names, head.names, byKey),
    ...parts.map((p) => partRow(p, head.screens)),
    ...(head.api?.unread ?? [])
      .filter((p) => !served.has(p))
      .map((p) => ({ kind: "api", what: p, status: "homeless" })),
    ...newCollisions(base.names, head.names),
  ];
}

/** The living screens the head has and the base did not, each with its triage home. */
function screenRows(baseScreens, headScreens) {
  const had = new Set(baseScreens.map((s) => s.key));
  return headScreens
    .filter((s) => !(had.has(s.key) || NOT_LIVING.has(s.verdict)))
    .map((s) => ({
      kind: "screen",
      what: s.key,
      home: s.home,
      status: s.verdict === undefined ? "unjudged" : statusOf(s.home),
      words: [],
    }));
}

/** The names the head reads and the base did not; a new screen's own label joins its row. */
function nameRows(baseNames, headNames, screenRow) {
  const had = new Set(baseNames.map(nameKey));
  const rows = new Map();
  for (const n of headNames) {
    const k = nameKey(n);
    if (had.has(k) || rows.has(k)) continue;
    const own = screenRow.get(n.place);
    if (own) {
      if (!own.words.includes(n.raw)) own.words.push(n.raw);
      continue;
    }
    const row = { kind: "name", what: n.raw, place: n.place, source: n.source, home: n.home };
    rows.set(k, { ...row, status: statusOf(n.home) });
  }
  return [...rows.values()];
}

/** One added part: the census's verdict, and for a placed one the groups of its nearest routes. */
function partRow(p, screens) {
  if (p.status !== "placed") return { kind: "part", what: p.file, status: p.status };
  const routes = p.routes ?? [];
  const homes = homesOfRoutes(routes, screens).filter((h) => h !== "no home");
  const status = homes.length ? "extends" : "unreached";
  return { kind: "part", what: p.file, via: p.via, homes, routes, status };
}

/** Label collisions (census row 1) the head has and the base did not: a word whose IA groups grew,
 *  or a place under a word it was not called before. */
export function newCollisions(baseNames, headNames) {
  const before = labelCollisions(baseNames);
  const after = labelCollisions(headNames);
  const homesBefore = new Map(before.oneWordManyPlaces.map((c) => [c.word, c.homes.join("|")]));
  const wordsBefore = new Map(
    before.onePlaceManyWords.map((c) => [`${c.level}|${c.place}`, c.words.join("|")]),
  );
  const out = [];
  for (const c of after.oneWordManyPlaces) {
    if (homesBefore.get(c.word) === c.homes.join("|")) continue;
    out.push({ kind: "collision", what: c.word, homes: c.homes, status: "collides" });
  }
  for (const c of after.onePlaceManyWords) {
    if (wordsBefore.get(`${c.level}|${c.place}`) === c.words.join("|")) continue;
    out.push({ kind: "collision", what: c.place, words: c.words, status: "collides" });
  }
  return out;
}

/** Rows that want placing before merge — the advisory exit's trigger. */
export const UNPLACED = new Set(["homeless", "unjudged", "unreached", "collides"]);

/** The rows as the plain lines a builder reads at ship time. `census` is `{ now, budget }` or null. */
export function render(rows, { groups, census = null, base = "" } = {}) {
  const group = (slug) => {
    const g = groups?.get(slug);
    return g ? `${g.name} (§${g.num})` : slug;
  };
  const judged = rows.filter((r) => r.status !== "not mounted");
  const flagged = rows.filter((r) => UNPLACED.has(r.status));
  const head = judged.length
    ? `${judged.length} member-facing addition(s) against ${base}: ${judged.length - flagged.length} placed · ${flagged.length} to place`
    : `no member-facing additions against ${base}`;
  const out = [`placement (#8005 slice 2): ${head}`];
  for (const r of rows) {
    const mark = UNPLACED.has(r.status) ? "▲" : r.status === "not mounted" ? "·" : "✓";
    out.push(`  ${mark} ${r.kind.padEnd(9)} ${line(r, group)}`);
  }
  if (census) {
    const rose = typeof census.budget === "number" && census.now > census.budget;
    out.push(
      `  ${rose ? "▲" : "✓"} census    homeless features ${census.now} (budget ${census.budget ?? "none"})`,
    );
  }
  if (flagged.length || census?.now > census?.budget) {
    out.push(
      "  place it: a screen's `home` in docs/members/triage.json; a part's file name cited under its group in docs/IA.md §5;",
      "  a new word or a new home no group fits is a placement fork — named shapes for Eric (/redesign), never a guess.",
    );
  }
  return out.join("\n");
}

function line(r, group) {
  const words = r.words?.length ? ` "${r.words.join('", "')}"` : "";
  switch (r.status) {
    case "extends":
      return r.kind === "part"
        ? `${r.what} → ${r.homes.map(group).join(" · ")} (on ${r.routes.join(", ")}; IA cites ${r.via})`
        : `${r.kind === "name" ? `"${r.what}" → ${r.place}` : `${r.what}${words}`} → ${group(r.home)}`;
    case "pre-auth":
      return `${r.kind === "name" ? `"${r.what}" → ${r.place}` : r.what} → before sign-in (outside the IA's model)`;
    case "unreached":
      return `${r.what} → cited (${r.via}), but the screens of ${r.routes.join(", ") || "no route"} have no IA home`;
    case "unjudged":
      return `${r.what}${words} → no triage row: add one to docs/members/triage.json with its home`;
    case "homeless":
      if (r.kind === "api") return `${r.what} → served, but no screen or chat tool reads it`;
      return r.kind === "part"
        ? `${r.what} → homeless: docs/IA.md cites neither it nor a part above it`
        : `${r.kind === "name" ? `"${r.what}" → ${r.place} (${r.source})` : `${r.what}${words}`} → homeless: its screen has no home in triage.json`;
    case "collides":
      return r.homes
        ? `"${r.what}" now names places in ${r.homes.length} IA groups: ${r.homes.join(" · ")}`
        : `${r.what} is now named ${r.words.map((w) => `"${w}"`).join(" · ")}`;
    default:
      return `${r.what} → no route reaches it yet`;
  }
}

// ─── IO ───────────────────────────────────────────────────────────────────────────────────────────

const git = (args, opts = {}) =>
  execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts }).trim();

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(p) && !/\.(spec|test)\.tsx?$/.test(p) && !p.endsWith(".d.ts"))
      out.push(p);
  }
  return out;
}

/** The route paths nearest `file` up its importers (SHELL for the root frame). */
function routesReaching(file, graph) {
  const pathOf = new Map(
    parseRouteTree(readFileSync(ROUTE_TREE, "utf8")).flatMap((r) =>
      r.modules.map((m) => [`app/src/${m}.tsx`, r.path]),
    ),
  );
  pathOf.set(ROOT, SHELL);
  const importers = new Map();
  for (const [f, deps] of graph)
    for (const d of deps) importers.set(d, [...(importers.get(d) ?? []), f]);
  // Level by level, stopping at the first level that holds a route: the NEAREST routes. Importing
  // is not rendering — `trade-bench.tsx` is imported by a door helper on four pages for its section
  // list, so the whole upward closure named six groups for one Trade section's card.
  const seen = new Set([file]);
  let level = [file];
  while (level.length > 0) {
    const routes = level.filter((f) => pathOf.has(f)).map((f) => pathOf.get(f));
    if (routes.length > 0) return [...new Set(routes)].sort();
    const next = [];
    for (const cur of level) {
      if (cur.includes("/routes/")) continue;
      for (const up of importers.get(cur) ?? []) {
        if (!seen.has(up)) {
          seen.add(up);
          next.push(up);
        }
      }
    }
    level = next;
  }
  return [];
}

/** The parts (shell and route files) some route's imports reach: what a member can see. */
function mountedParts(graph) {
  const seen = new Set([...graph.keys()].filter((f) => f.includes("/routes/")));
  const queue = [...seen];
  while (queue.length > 0) {
    for (const d of graph.get(queue.shift()) ?? []) {
      if (!seen.has(d)) {
        seen.add(d);
        queue.push(d);
      }
    }
  }
  return [...seen].filter((f) => PART.test(f)).sort();
}

/**
 * `--snapshot`: the member-facing set of the tree in the working directory, the parts a route
 * mounts, and the parts to judge placed against it with the routes nearest each. The parts to judge
 * are the given ones plus, when `baseMounted` is known, every part mounted here and not there: a
 * part one branch adds unmounted and a later branch mounts is judged by the later one.
 */
function snapshot(partFiles, { needles, baseMounted }) {
  const facing = memberFacing({ needles });
  const files = walk("app/src");
  const graph = new Map(files.map((f) => [f, importsOf(f, readFileSync(f, "utf8"), existsSync)]));
  const mounted = mountedParts(graph);
  const had = new Set(baseMounted ?? mounted);
  const judge = [...new Set([...partFiles, ...mounted.filter((f) => !had.has(f))])]
    .filter((f) => existsSync(f))
    .sort();
  const parts = placeParts(
    judge.map((file) => ({ file, scope: "" })),
    graph,
    readFileSync(IA, "utf8"),
  ).map((p) => ({ ...p, routes: routesReaching(p.file, graph) }));
  return { ...facing, mounted, parts };
}

/** Unpack `ref`'s copy of the readers' inputs into a fresh temp dir. */
function unpack(ref) {
  const dir = mkdtempSync(join(tmpdir(), "placement-"));
  const tar = join(dir, ".tree.tar");
  git(["archive", "--format=tar", "-o", tar, ref, "--", ...TREE]);
  execFileSync("tar", ["-xf", tar, "-C", dir]);
  return dir;
}

/** Run this script's `--snapshot` inside `dir` and read its JSON. `baseMounted` travels as a file
 *  in that dir (a few hundred paths is too long for an argument list on some shells). */
function snapshotIn(dir, partFiles, baseMounted) {
  const self = fileURLToPath(import.meta.url);
  const args = [self, "--snapshot", "--no-needles"];
  if (partFiles.length) args.push("--parts", partFiles.join(","));
  if (baseMounted) {
    writeFileSync(join(dir, ".base-mounted.json"), JSON.stringify(baseMounted));
    args.push("--base-mounted", ".base-mounted.json");
  }
  const out = execFileSync("node", args, {
    cwd: dir,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(out);
}

/** The census's homeless count against its budget — the ratchet this check reports into. */
async function censusLine() {
  const { measure } = await import("./cohesion.mjs");
  const budget = existsSync(BUDGET) ? JSON.parse(readFileSync(BUDGET, "utf8")) : {};
  return { now: measure().counts.homeless, budget: budget.homeless ?? null };
}

const flag = (argv, name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);

/**
 * The commit to judge against, or undefined when there is none to read. A branch is judged against
 * where it left its base, so main's own later additions never read as this branch's: `--base
 * origin/main` means the merge base with it. A replay (`--commit`) reads its first parent.
 */
function resolveBase(argv, commit) {
  try {
    const asked = flag(argv, "--base");
    const base = commit
      ? (asked ?? `${commit}^1`)
      : git(["merge-base", asked ?? "origin/main", "HEAD"]);
    return git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`]);
  } catch {
    return undefined;
  }
}

async function main(argv) {
  if (argv.includes("--snapshot")) {
    const parts = flag(argv, "--parts")?.split(",").filter(Boolean) ?? [];
    const needles = !argv.includes("--no-needles");
    const file = flag(argv, "--base-mounted");
    const baseMounted = file ? JSON.parse(readFileSync(file, "utf8")) : undefined;
    process.stdout.write(JSON.stringify(snapshot(parts, { needles, baseMounted })));
    return 0;
  }
  const commit = flag(argv, "--commit");
  const base = resolveBase(argv, commit);
  if (!base) {
    console.log("placement: no base to compare against (origin/main not fetched?) — skipped");
    return 0;
  }
  const short = git(["rev-parse", "--short", base]);
  if (!(commit || git(["diff", "--name-only", base]))) {
    console.log(`placement (#8005 slice 2): nothing changed against ${short}`);
    return 0;
  }
  // Run by hand before a commit, a new file is untracked: `git diff` alone would miss it.
  const untracked = commit ? "" : git(["ls-files", "--others", "--exclude-standard", "app/src"]);
  const added = [
    ...git(["diff", "--diff-filter=A", "--name-only", base, ...(commit ? [commit] : [])]).split(
      "\n",
    ),
    ...untracked.split("\n"),
  ].filter((f) => PART.test(f));

  const dirs = [];
  try {
    const baseDir = unpack(base);
    dirs.push(baseDir);
    const before = snapshotIn(baseDir, []);
    let after;
    if (commit) {
      const headDir = unpack(commit);
      dirs.push(headDir);
      after = snapshotIn(headDir, added, before.mounted);
    } else {
      after = snapshot(added, { needles: true, baseMounted: before.mounted });
    }
    const iaSrc = commit ? git(["show", `${commit}:${IA}`]) : readFileSync(IA, "utf8");
    const rows = placementRows(before, after, { parts: after.parts });
    const census = commit ? null : await censusLine();
    if (argv.includes("--json")) {
      console.log(JSON.stringify({ base: short, rows, census }, null, 2));
    } else {
      console.log(render(rows, { groups: groupsOf(iaSrc), census, base: short }));
    }
    const rose = census && typeof census.budget === "number" && census.now > census.budget;
    return rows.some((r) => UNPLACED.has(r.status)) || rose ? 1 : 0;
  } finally {
    for (const d of dirs) rmSync(d, { recursive: true, force: true });
  }
}

if (isMain(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err) => {
      // The child half fails loudly so its parent can say why; the parent says it and exits 0 — a
      // reader that cannot parse a tree is news for a person, never a red build.
      if (process.argv.includes("--snapshot")) {
        process.stderr.write(`${err?.message ?? err}\n`);
        process.exit(2);
      }
      const why = String(err?.stderr || err?.message || err)
        .trim()
        .split("\n")
        .pop();
      console.log(`placement: could not read the trees — ${why}`);
      process.exit(0);
    },
  );
}
