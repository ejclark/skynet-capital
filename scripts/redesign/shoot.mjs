// SHOOT ONE SCREEN (#5143) — today's real frame for a redesign round, in one command:
//
//   node scripts/redesign/shoot.mjs --screen <id> --out <dir> [--state <json>] [--scheme dark|light] [--rebuild]
//
// → <dir>/<id>-phone.jpg (390 at 2x) and <dir>/<id>-desk.jpg (1280 at 2x), each ≤200KB; the paths
// print on stdout, one per line, and anything the frame could not show goes to stderr.
//
// WHY A SCRIPT: on 2026-10-10 nineteen redesign sessions each hand-rolled Playwright for their
// "today" shot, and one round of hand-drawn frames cost ~2.5M subagent tokens. The steps never
// varied — build the app once, compose the study world, open the route as the screen's viewer,
// shoot two widths, hold the file size — so they are this file's job, not a session's.
//
// HOW: the screen comes from screens.json (the route, the world and the viewer it is seen as).
// The app and the 3D scene its desk rail embeds are built when missing (or with --rebuild — after
// pulling, or when a frame looks stale); the world is composed fresh into
// a temp dir every run (~3s), so a frame is always this checkout's own code; frames.mjs takes the
// pictures under tsx. --state is JSON (inline, or a file path) whose keys are `/api/...` reads and
// whose values are the bodies to answer instead: a key with `?` matches that exact request, a
// bare path matches any query. Use it to show a state the world lacks; say so on the frame.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const REGISTRY = fileURLToPath(new URL("./screens.json", import.meta.url));
const TSX = join(ROOT, "node_modules", ".bin", "tsx");
const SCHEMES = ["dark", "light"];
const USAGE =
  "usage: node scripts/redesign/shoot.mjs --screen <id> --out <dir> [--state <json|file>] [--scheme dark|light] [--rebuild]";
const OPTIONS = { "--screen": "screen", "--out": "out", "--state": "state", "--scheme": "scheme" };

/** The registry: every screen a redesign session can shoot. */
export function loadScreens(file = REGISTRY) {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** argv → options. Throws a plain message on anything it cannot use. */
export function parseShootArgs(argv) {
  const args = { scheme: "dark", rebuild: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--rebuild") {
      args.rebuild = true;
      continue;
    }
    const key = OPTIONS[flag];
    if (!key) throw new Error(`shoot: unknown option ${flag}\n${USAGE}`);
    const value = argv[++i];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`shoot: ${flag} needs a value`);
    args[key] = value;
  }
  if (!(args.screen && args.out)) throw new Error(USAGE);
  if (!SCHEMES.includes(args.scheme))
    throw new Error(`shoot: --scheme is dark or light, not ${args.scheme}`);
  return args;
}

/** The registry entry for an id, or a message listing the ids there are. */
export function findScreen(screens, id) {
  const screen = screens.find((s) => s.id === id);
  if (!screen) {
    throw new Error(`shoot: no screen "${id}" — one of: ${screens.map((s) => s.id).join(", ")}`);
  }
  return screen;
}

/** --state's value → the overrides object: inline JSON when it starts with `{`, else a file. */
export function readState(value, cwd = process.cwd()) {
  if (value === undefined) return {};
  const text = value.trim().startsWith("{") ? value : readFileSync(resolve(cwd, value), "utf8");
  let state;
  try {
    state = JSON.parse(text);
  } catch (e) {
    throw new Error(`shoot: --state is not JSON (${e.message})`);
  }
  if (state === null || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("shoot: --state is an object of `/api/...` reads → bodies");
  }
  const bad = Object.keys(state).filter((k) => !k.startsWith("/api/"));
  if (bad.length > 0) throw new Error(`shoot: --state keys are /api/ reads, not ${bad.join(", ")}`);
  return state;
}

/** The spec frames.mjs runs from. Pure. */
export function framePlan(screen, { out, scheme = "dark", state = {}, run }) {
  return {
    id: screen.id,
    route: screen.route,
    world: screen.world,
    viewer: screen.viewer,
    waitFor: screen.waitFor,
    settle: screen.settle,
    clicks: screen.clicks,
    maxH: screen.maxH,
    scheme,
    overrides: state,
    out,
    run,
  };
}

/** One child process with its output on our stderr, so stdout carries only the paths. */
function step(what, cmd, args) {
  const child = spawnSync(cmd, args, { cwd: ROOT, stdio: ["ignore", 2, 2] });
  if (child.status !== 0) throw new Error(`shoot: ${what} failed (exit ${child.status})`);
}

function main() {
  const args = parseShootArgs(process.argv.slice(2));
  const screen = findScreen(loadScreens(), args.screen);
  const state = readState(args.state);
  const out = resolve(args.out);
  mkdirSync(out, { recursive: true });
  if (args.rebuild || !existsSync(join(ROOT, "app", "dist", "index.html"))) {
    console.error("shoot: building the app (once per checkout; --rebuild to refresh)…");
    step("the app build", "npm", ["run", "build", "--prefix", "app"]);
  }
  // The landmark portrait in the desk rail is the real 3D scene; unbuilt, the rail is a blank box.
  if (args.rebuild || !existsSync(join(ROOT, "public", "three", "scene.js"))) {
    step("the scene build", "npm", ["run", "build:scene"]);
  }
  const run = mkdtempSync(join(tmpdir(), "redesign-world-"));
  try {
    step(`composing the ${screen.world} world`, TSX, [
      "scripts/study/worlds/compose.mjs",
      run,
      screen.world,
    ]);
    const specFile = join(run, "frames.json");
    const scheme = args.scheme;
    writeFileSync(specFile, JSON.stringify(framePlan(screen, { out, scheme, state, run })));
    const child = spawnSync(TSX, ["scripts/redesign/frames.mjs", specFile], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", 2],
    });
    const frames = child.stdout
      .split("\n")
      .filter((l) => l.startsWith("{"))
      .map((l) => JSON.parse(l));
    for (const f of frames) {
      console.log(f.path);
      const kb = Math.round(f.size / 1024);
      const cut = f.cssH < f.docH;
      const why = f.trimmed ? "to stay under 200KB" : "at its maxH in screens.json";
      const notes = [
        `${kb}KB q${f.quality}`,
        cut ? `shows ${f.cssH}px of ${f.docH}px (cut ${why})` : "",
      ];
      console.error(`shoot: ${f.kind} ${notes.filter(Boolean).join(", ")}`);
      for (const u of f.unstubbed) console.error(`shoot: ${f.kind} unanswered read ${u}`);
      for (const e of f.errors) console.error(`shoot: ${f.kind} ${e}`);
    }
    if (child.status !== 0 || frames.length < 2)
      throw new Error(`shoot: the camera failed (exit ${child.status})`);
  } finally {
    rmSync(run, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    main();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
