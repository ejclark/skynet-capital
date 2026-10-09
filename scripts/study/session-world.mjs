// Which world a recorder session opens, and how (#4943). Two shapes exist, and `loadWorld` is the
// one place that tells them apart — area-agnostic: it reads names, files and a manifest, never a
// surface.
//
//  - A SCRIPTED world (scripts/study/worlds/smoke.mjs): a module whose `world` export resolves to
//    `{name, startPath, pinnedInstant, stubs, install?}` — served by scripts/shoot/shell.mjs.
//  - A COMPOSED world (profile-today, profile-bad-day, no-account): a definition the composer
//    (worlds/compose.mjs) turns into a run directory — `<run>/manifest.json` (its `instant`) and one
//    `<run>/<world>/<viewer>.json` of payloads per viewer. A session over one serves EXACTLY those
//    payloads through scripts/study/world-route.mjs (full-URL answers, a live-but-quiet event
//    stream, writes recorded and never sent, anything uncomposed flagged `unstubbed`), so a member
//    sees the bytes the manifest hashes and nothing hand-rolled beside them.
//
// WHY A RUN DIRECTORY AND NOT THE MODULE: a composed world's payloads come out of the server code
// of the commit that composed them. Re-deriving them inside the session would let the session and
// the manifest disagree; reading the run keeps one source of truth. The module is never imported on
// this path, so a session needs only the run.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { answerFrom } from "./payloads.mjs";

const NAME = /^[a-z0-9-]+$/;

/** The viewers a composed world's run holds: every `<viewer>.json` beside `compose.json`. */
function viewersIn(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "compose.json")
    .map((f) => f.slice(0, -".json".length))
    .sort();
}

/** A composed world, read from its compose run directory. */
function composedWorld(name, run, viewer) {
  const root = resolve(run);
  const manifestPath = join(root, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error(`${root} is not a compose run (no manifest.json)`);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (!manifest.worlds?.includes(name)) {
    throw new Error(`run ${root} did not compose world ${name} (it has: ${manifest.worlds})`);
  }
  const viewers = viewersIn(join(root, name));
  const who = viewer ?? viewers[0];
  if (!viewers.includes(who)) {
    throw new Error(`world ${name} has no viewer ${who} in this run (it has: ${viewers})`);
  }
  return { name, run: root, viewer: who, viewers, pinnedInstant: manifest.instant };
}

/**
 * Resolve `--world <name>` (+ `--run <compose dir>`, `--viewer <who>`) to what `open` takes.
 * A composed world asked for without a run is refused with the command that makes one.
 */
export async function loadWorld(name, { run, viewer } = {}) {
  if (!NAME.test(name)) throw new Error(`bad world name ${name}`);
  if (run) return composedWorld(name, run, viewer);
  const mod = await import(new URL(`./worlds/${name}.mjs`, import.meta.url).href);
  const w = mod.world ?? mod.default;
  const resolved = typeof w === "function" ? await w() : w;
  if (resolved?.viewers) {
    throw new Error(
      `world ${name} is composed: make a run with \`npx tsx scripts/study/worlds/compose.mjs <dir> ${name}\`, then pass --run <dir>`,
    );
  }
  return resolved;
}

/**
 * Open a composed world's page: world-route's server and router over the viewer's payloads, with
 * the page clock at the run's instant. Returns the shell-shaped handle `open` drives, plus `log` —
 * the world's own record of unstubbed reads, recorded writes and refused off-origin requests.
 */
export async function openComposed(world, frame, out) {
  const { openWorld } = await import("./world-route.mjs");
  const handle = await openWorld({
    answer: answerFrom(join(world.run, world.name), world.viewer),
    at: world.pinnedInstant,
    frame,
    out,
  });
  return { page: handle.page, origin: handle.origin, close: handle.close, log: handle.session };
}

/**
 * world-route.mjs imports the server's TypeScript, which plain `node` cannot load. A CLI that will
 * open a composed world calls this first: under plain node it re-runs itself with tsx's loader
 * (from the repo root) and returns the child's exit code; already under it, it returns null.
 */
export function rerunUnderTsx(selfUrl, argv) {
  if (process.env.STUDY_UNDER_TSX === "1") return null;
  const child = spawnSync(process.execPath, ["--import", "tsx", fileURLToPath(selfUrl), ...argv], {
    stdio: "inherit",
    env: { ...process.env, STUDY_UNDER_TSX: "1" },
  });
  return child.status ?? 1;
}
