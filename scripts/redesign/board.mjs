// THE FEEDBACK BOARD, REBUILT IN ONE COMMAND (#5143):
//
//   node scripts/redesign/board.mjs --out <dir> [--screens a,b] [--rebuild]
//
// → <dir>/board.html, <dir>/img/<id>-phone.jpg + <id>-desk.jpg for every screen, and
// <dir>/files.json ({ published path: file on disk }). Publish it over the board's stable URL
// (docs/process/REDESIGN.md → Refresh the board): the Artifact tool, `url` BOARD_URL, file_path
// <dir>/board.html, `files` from files.json, capabilities { comments: {} }.
//
// WHY A SCRIPT: the first board (2026-10-10) was hand-assembled in a session scratchpad, so it
// could not be rebuilt once the screens changed, and nobody else could rebuild it. Every frame
// comes from shoot.mjs (the same camera a redesign round uses), every screen from screens.json,
// so a screen added to the registry is on the next board with no other edit.
//
// --screens shoots only those ids; the board still shows every other screen whose frames an
// earlier run left in <dir>/img, so a partial refresh republishes the whole board. --rebuild
// rebuilds the app before the first shot (after pulling). A screen the camera fails on keeps its
// section, says so on the page, and makes the command exit 1 after writing everything else.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { boardFiles, boardHtml, boardScreens, FRAMES } from "./board-page.mjs";
import { imageSize } from "./pin-rules.mjs";
import { findScreen, loadScreens } from "./shoot.mjs";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const BOARD_URL = "https://claude.ai/artifact/1Rrba8RtHyqLKq5FDuCccq";
const USAGE = "usage: node scripts/redesign/board.mjs --out <dir> [--screens a,b] [--rebuild]";

/** argv → `{ out, screens, rebuild }`; `screens` is null for every screen. Throws on misuse. */
export function parseBoardArgs(argv) {
  const args = { out: null, screens: null, rebuild: false };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--rebuild") {
      args.rebuild = true;
      continue;
    }
    if (flag !== "--out" && flag !== "--screens")
      throw new Error(`board: unknown option ${flag}\n${USAGE}`);
    const value = argv[++i];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`board: ${flag} needs a value`);
    if (flag === "--out") args.out = value;
    else
      args.screens = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
  }
  if (!args.out) throw new Error(USAGE);
  if (args.screens?.length === 0) throw new Error("board: --screens names at least one screen id");
  return args;
}

/** `{ width, height }` of a frame on disk, or null when it is missing or unreadable. */
function sizeOf(file) {
  if (!existsSync(file)) return null;
  try {
    return imageSize(readFileSync(file));
  } catch {
    return null;
  }
}

const git = (...args) =>
  spawnSync("git", args, { cwd: ROOT, encoding: "utf8" }).stdout?.trim() || "?";

function main() {
  const args = parseBoardArgs(process.argv.slice(2));
  const registry = loadScreens();
  const ids = args.screens ?? registry.map((s) => s.id);
  for (const id of ids) findScreen(registry, id);
  const out = resolve(args.out);
  const img = join(out, "img");
  mkdirSync(img, { recursive: true });

  const failed = [];
  ids.forEach((id, i) => {
    // An older frame must never stand in for a failed shot.
    for (const [kind] of FRAMES) rmSync(join(img, `${id}-${kind}.jpg`), { force: true });
    console.error(`board: ${i + 1}/${ids.length} ${id}`);
    const flags = ["scripts/redesign/shoot.mjs", "--screen", id, "--out", img];
    if (args.rebuild && i === 0) flags.push("--rebuild");
    const child = spawnSync(process.execPath, flags, { cwd: ROOT, stdio: ["ignore", "ignore", 2] });
    if (child.status !== 0) failed.push(id);
  });

  const hasFrames = (id) => FRAMES.every(([kind]) => existsSync(join(img, `${id}-${kind}.jpg`)));
  const screens = boardScreens(registry, ids, hasFrames);
  const sizes = Object.fromEntries(
    screens.map((s) => [
      s.id,
      Object.fromEntries(FRAMES.map(([kind]) => [kind, sizeOf(join(img, `${s.id}-${kind}.jpg`))])),
    ]),
  );
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
  }).format(new Date());
  const made = {
    ref: git("rev-parse", "--abbrev-ref", "HEAD"),
    sha: git("rev-parse", "--short", "HEAD"),
    day,
  };
  writeFileSync(join(out, "board.html"), boardHtml(screens, sizes, made));
  const files = boardFiles(screens, sizes, img);
  writeFileSync(join(out, "files.json"), `${JSON.stringify(files, null, 2)}\n`);

  console.log(join(out, "board.html"));
  console.error(
    `board: ${screens.length} screen(s), ${Object.keys(files).length} frame(s) in files.json. Publish to ${BOARD_URL} ` +
      "with file_path board.html, files from files.json, capabilities { comments: {} }.",
  );
  if (failed.length > 0) {
    console.error(
      `board: not shot — ${failed.join(", ")}; their sections say so. Re-run with --screens ${failed.join(",")}`,
    );
    process.exit(1);
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
