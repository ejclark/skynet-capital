// THE COMPOSER (#4943 slice 2) — every server-derived payload a study world serves, produced by
// the checked-out tree's own code, once per commit, into a run directory with a sha256 each.
//
//   npx tsx scripts/study/worlds/compose.mjs <run-dir> [world …]   # default: every world
//
// HOW: each world's book (book.mjs, from inputs/*.json) becomes the server's own config
// (server-config.mjs, with market.mjs's options client), and every read a viewer's page makes is
// answered by the REAL route handler, called with that viewer's session (../server-reads.mjs —
// the server's own dispatch order). So the payloads come out of the real pure builders —
// `deskView` (which runs `considerationsFor` and `decisionsFor`), `botHeartbeatView`,
// `deskActivityView`, `accountsNetWorthView`, `deskPulseView`, `thesisView`, the guidance and
// option-position views — AND through the real gates: a non-owner's copy of a bot loses its
// playbooks because `desk-owner-gate.ts` strips them, never because a fixture left them out. Built
// from the same worktree as the `app/dist` under test, a fixed build's server-side fixes show up
// in its world.
//
// THE CLOCK AND THE NETWORK, BEFORE ANY SERVER CODE LOADS: the process `Date` is pinned to INSTANT
// and `fetch` is replaced by the world's own answers (../no-network.mjs) first, and only then is
// `src/` imported (dynamically, below). Order matters: a module that captures `Date.now` when it
// loads — the guidance route's EDGAR client does — would otherwise keep the wall clock. TZ is UTC
// as on the deployed server. Two composes of one commit hash identically.
//
// ONE PROCESS PER WORLD: the server's modules keep process-wide state — the guidance route's
// market-read cache (pruned by elapsed time, which a pinned clock never advances) and its EDGAR
// client's ticker cache. Composed in one process, a second world would be served the first
// world's chain. So this entry only plans: each world is composed by a fresh child
// (`--one <world>`), which writes `<run-dir>/<world>/compose.json`, and the parent stitches the
// manifest. A world composed alone and composed after another hash identically.
//
// THE TREE'S OWN FACTS, AS THEY STOOD AT THE INSTANT: some payloads are built from files rather
// than inputs — the research shelf (docs/research), the market-events calendar
// (src/domain/market-events), the guidance route's print ledgers. Read from the checked-out tree,
// a world would serve research written after its instant and would change with every later
// research commit, confounding the before/after comparison it exists for. So each world names a
// `corpus` commit (dated at or before INSTANT, refused otherwise); its child runs with those paths
// extracted from that commit as its working directory, and reads nothing of them from the tree.
//
// ENDPOINTS WITH NO PURE BUILDER: none today — every read the profile pages make is claimed by a
// real handler. A world's `fixtures` hook (fixtures.mjs) is where one would go, recorded in the
// manifest as `fixture: <why>`. A read neither answers is MISSING and the composer exits non-zero:
// a world never ships a hole it did not declare.

process.env.TZ = "UTC";

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { guardNetwork } from "../no-network.mjs";
import { canonicalUrl, writeViewer } from "../payloads.mjs";
import { edgarAnswer, loadInput } from "./inputs.mjs";
import { INSTANT, pinProcessClock } from "./instant.mjs";

/** Compose one world into `<runDir>/<world>/`; returns its manifest rows and any missing reads. */
async function composeWorld(world, runDir, server) {
  const book = server.buildBook(world.input);
  const config = server.serverConfig(book);
  // A pinned boot id: the payloads are hashed, and a random one would make every compose differ.
  const channel = server.createBoardChannel("study");
  const fixtures = world.fixtures(book);
  const manifest = [];
  const missing = [];
  for (const [viewer, email] of Object.entries(world.viewers)) {
    const session = server.sessionFor(email);
    const answers = [];
    for (const url of world.reads(viewer)) {
      const fixture = fixtures(url, viewer);
      if (fixture !== undefined) {
        answers.push({ url, status: 200, body: fixture.body, source: `fixture: ${fixture.why}` });
        continue;
      }
      const real = await server.serverRead(url, config, channel, session);
      if (real) answers.push({ url, ...real, source: "builder" });
      else missing.push(`${world.name}/${viewer} ${canonicalUrl(url)}`);
    }
    manifest.push(...writeViewer(join(runDir, world.name), viewer, answers));
  }
  return { manifest, missing };
}

/** The tree-sourced paths a world reads from its pinned corpus commit, never from the tree. */
const CORPUS_PATHS = ["docs/research", "src/domain/market-events"];

function run(cmd, args) {
  const out = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (out.status !== 0) throw new Error(`compose: ${cmd} ${args[0]} failed: ${out.stderr}`);
  return out.stdout.trim();
}

/** `<run-dir>/.corpus/<sha>/` — CORPUS_PATHS as they stood at `commit`, plus the tree's
 *  package.json (the app version is the code's, not the corpus's). */
function corpusAt(runDir, commit) {
  if (!commit) throw new Error("compose: a world must pin its `corpus` commit (inputs/*.json)");
  const committed = run("git", ["show", "-s", "--format=%cI", commit]);
  if (Date.parse(committed) > Date.parse(INSTANT)) {
    throw new Error(`compose: corpus ${commit} was committed ${committed}, after ${INSTANT}`);
  }
  const dir = join(runDir, ".corpus", commit.slice(0, 12));
  if (existsSync(join(dir, "package.json"))) return dir;
  mkdirSync(dir, { recursive: true });
  const tar = join(dir, "corpus.tar");
  run("git", ["archive", "--format=tar", "-o", tar, commit, ...CORPUS_PATHS]);
  run("tar", ["-xf", tar, "-C", dir]);
  rmSync(tar);
  copyFileSync("package.json", join(dir, "package.json"));
  return dir;
}

/** Child: compose exactly one world in this (fresh) process, in its corpus directory. */
async function composeOne(runDir, name) {
  pinProcessClock();
  const corpus = process.env.STUDY_CORPUS;
  if (!corpus) throw new Error("compose: --one runs only as a child of compose.mjs");
  process.chdir(corpus);
  let edgar = () => undefined;
  const network = guardNetwork((url) => edgar(url));
  const { WORLDS } = await import("./index.mjs");
  const world = WORLDS.find((w) => w.name === name);
  if (!world) throw new Error(`compose: no world named ${name}`);
  const server = {
    ...(await import("./book.mjs")),
    ...(await import("./server-config.mjs")),
    ...(await import("../server-reads.mjs")),
    ...(await import("../../../src/server/board-patch-routes.ts")),
  };
  edgar = edgarAnswer(loadInput(world.input));
  const result = await composeWorld(world, runDir, server);
  mkdirSync(join(runDir, name), { recursive: true });
  const part = {
    payloads: result.manifest.map((row) => ({ world: name, ...row })),
    missing: result.missing,
    network: { answered: [...new Set(network.answered)], refused: [...new Set(network.refused)] },
  };
  writeFileSync(join(runDir, name, "compose.json"), `${JSON.stringify(part, null, 1)}\n`);
}

/** Parent: one child per world, then the run's manifest. Imports no server code itself. */
async function composeAll(runDir, names) {
  const { WORLDS } = await import("./index.mjs");
  const chosen = names.length > 0 ? WORLDS.filter((w) => names.includes(w.name)) : WORLDS;
  const unknown = names.filter((n) => !WORLDS.some((w) => w.name === n));
  if (unknown.length > 0) throw new Error(`compose: no world named ${unknown.join(", ")}`);
  const self = fileURLToPath(import.meta.url);
  const payloads = [];
  const missing = [];
  const network = {};
  for (const world of chosen) {
    const corpus = corpusAt(runDir, loadInput(world.input).corpus?.commit);
    const env = {
      ...process.env,
      TZ: "UTC",
      STUDY_CORPUS: corpus,
      SKYNET_RESEARCH_DIR: join(corpus, "docs", "research"),
    };
    const child = spawnSync(
      process.execPath,
      [...process.execArgv, self, runDir, "--one", world.name],
      { stdio: "inherit", env },
    );
    if (child.status !== 0) throw new Error(`compose: ${world.name} exited ${child.status}`);
    const part = JSON.parse(readFileSync(join(runDir, world.name, "compose.json"), "utf8"));
    payloads.push(...part.payloads);
    missing.push(...part.missing);
    network[world.name] = part.network;
  }
  // The checkout whose code composed the run, and its commit: what reads the run later (the
  // facts sheet's formatters) takes the app's code from here, never from wherever it runs.
  const checkout = fileURLToPath(new URL("../../../", import.meta.url)).replace(/\/$/, "");
  const commit = run("git", ["-C", checkout, "rev-parse", "HEAD"]);
  const manifest = {
    instant: INSTANT,
    checkout,
    commit,
    worlds: chosen.map((w) => w.name),
    network,
    payloads,
  };
  writeFileSync(join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);
  const fixtures = payloads.filter((r) => r.source.startsWith("fixture")).length;
  const refused = Object.values(network).reduce((n, w) => n + w.refused.length, 0);
  console.log(
    `compose: ${payloads.length} payloads (${payloads.length - fixtures} builder, ${fixtures} fixture)` +
      ` · network refused ${refused} → ${runDir}`,
  );
  if (missing.length > 0) {
    console.error(`compose: ${missing.length} read(s) nothing answers:\n  ${missing.join("\n  ")}`);
    process.exitCode = 1;
  }
}

async function main() {
  const [runDirArg, ...rest] = process.argv.slice(2);
  if (!runDirArg) {
    console.error("usage: compose.mjs <run-dir> [world …]");
    process.exit(2);
  }
  const runDir = resolve(runDirArg);
  mkdirSync(runDir, { recursive: true });
  if (rest[0] === "--one") await composeOne(runDir, rest[1]);
  else await composeAll(runDir, rest);
}

await main();
