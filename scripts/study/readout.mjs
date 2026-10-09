#!/usr/bin/env node
// THE READOUT (#4943) — grade.json + the round → the one page the owner judges at the stop.
//
//   node scripts/study/readout.mjs --grade <grade.json> --round <dir> --study <name>
//        --next-area <text> --cost <text> [--owner-shot <path>] [--battle <battle.json>]
//        [--battle-reason <text>] [--job-map <framer output .json|.md>] [--picture <session dir>]
//        [--reveal --sealed <dir>] [--root <repo root>]
//
// Writes <root>/docs/members/study/<study>/readout.md and copies every frame it shows, small
// (≤ 100KB JPEG), to <root>/docs/shots/study-<study>/. The layout and words are readout-core.mjs.
//
// THE PICTURE is the member session with the most confused turn (a failed session first on a tie;
// `--picture` names one instead): the frame before, what they did, the frame after — beside the
// owner's own screenshot (`--owner-shot`, linked, never copied). STRUCTURAL FINDINGS are the ones
// grade.json counted as new, one per checker `same_as` group, each with its evidence frames.
// The battle file is {fork, least?, shapes: [{name, success, wrongTurns, involuntaryScroll, ease,
// frame?}]} (frame paths relative to the file); without it the section says why it did not run.
// Key item wording appears only with `--reveal`, read from the sealed folder given — a readout
// that leaves the machine without it names items by id.

import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseGold } from "./grade-core.mjs";
import { renderReadout, worstMoment } from "./readout-core.mjs";
import { findSessions, readJson, readJsonl } from "./round-files.mjs";

export const FRAME_CAP = 100 * 1024;
const USAGE =
  "usage: readout.mjs --grade <grade.json> --round <dir> --study <name> --next-area <text> " +
  "--cost <text> [--owner-shot <path>] [--battle <file>] [--battle-reason <text>] " +
  "[--job-map <file>] [--picture <session dir>] [--reveal --sealed <dir>] [--root <dir>]";

/** The command line, checked; throws the usage line naming what is missing. */
export function readoutArgs(argv) {
  const get = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const opts = {
    grade: get("--grade"),
    round: get("--round"),
    study: get("--study"),
    nextArea: get("--next-area"),
    cost: get("--cost"),
    ownerShot: get("--owner-shot"),
    battle: get("--battle"),
    battleReason: get("--battle-reason"),
    jobMap: get("--job-map"),
    picture: get("--picture"),
    reveal: argv.includes("--reveal"),
    sealed: get("--sealed"),
    root: get("--root") ?? process.cwd(),
  };
  const missing = ["grade", "round", "study", "nextArea", "cost"].filter((k) => !opts[k]);
  if (missing.length) throw new Error(`missing ${missing.join(", ")}\n${USAGE}`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(opts.study))
    throw new Error("--study is lower-case words and dashes");
  if (opts.reveal && !opts.sealed) throw new Error("--reveal needs --sealed <dir>");
  return opts;
}

/** Copy a frame as a JPEG of at most FRAME_CAP bytes; macOS `sips` shrinks one that is larger. */
export function copySmall(src, dest) {
  if (statSync(src).size <= FRAME_CAP && /\.jpe?g$/i.test(extname(src))) {
    copyFileSync(src, dest);
    return dest;
  }
  for (const [side, quality] of [
    [1280, 60],
    [960, 55],
    [720, 50],
    [540, 45],
    [400, 40],
  ]) {
    try {
      execFileSync(
        "sips",
        [
          "-s",
          "format",
          "jpeg",
          "-s",
          "formatOptions",
          String(quality),
          "-Z",
          String(side),
          src,
          "--out",
          dest,
        ],
        { stdio: "ignore" },
      );
    } catch {
      throw new Error(
        `${src} is over ${FRAME_CAP / 1024}KB or not a JPEG, and sips could not shrink it`,
      );
    }
    if (statSync(dest).size <= FRAME_CAP) return dest;
  }
  throw new Error(`${src} stays over ${FRAME_CAP / 1024}KB even at 400px`);
}

/** The picture: the most confused turn across member sessions, or the session `--picture` names. */
function choosePicture(round, sessions, only) {
  let best = null;
  for (const s of sessions) {
    if (only && s.rel !== only.replace(/\/$/, "")) continue;
    const turnsPath = join(s.dir, "turns.jsonl");
    const tracePath = join(s.dir, "trace.jsonl");
    if (!existsSync(turnsPath)) continue;
    const m = worstMoment(readJsonl(turnsPath), existsSync(tracePath) ? readJsonl(tracePath) : []);
    if (!m) continue;
    const failed = !s.summary.oracle?.success;
    if (
      !best ||
      m.confusion > best.m.confusion ||
      (m.confusion === best.m.confusion && failed && !best.failed)
    )
      best = { s, m, failed };
  }
  if (only && !best)
    throw new Error(`--picture ${only} is not a session with turns under ${round}`);
  return best;
}

/** Everything the page shows, gathered, with frames copied into the shots folder. */
export function buildReadout(opts) {
  const root = resolve(opts.root);
  const round = resolve(opts.round);
  const grade = readJson(opts.grade);
  const page = join(root, "docs/members/study", opts.study, "readout.md");
  const shots = join(root, "docs/shots", `study-${opts.study}`);
  mkdirSync(dirname(page), { recursive: true });
  mkdirSync(shots, { recursive: true });
  const link = (abs) => relative(dirname(page), abs);
  const slug = (rel) =>
    rel
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
  const shot = (sessionDir, frameName) => {
    const src = join(sessionDir, "frames", frameName);
    if (!existsSync(src)) return null;
    const name = `${slug(relative(round, sessionDir))}-${basename(frameName, extname(frameName))}.jpg`;
    return link(copySmall(src, join(shots, name)));
  };

  const sessions = findSessions(round);
  const pick = choosePicture(round, sessions, opts.picture);
  const picture = pick && {
    ...pick.m,
    member: pick.s.member,
    viewport: pick.s.summary.viewport ?? "phone",
    before: shot(pick.s.dir, pick.m.before),
    after: pick.m.after && shot(pick.s.dir, pick.m.after),
  };

  const text = new Map(readJsonl(join(round, "findings.jsonl")).map((f) => [f.id, f]));
  const graded = new Map(grade.findings.map((f) => [f.id, f]));
  const structural = Object.values(grade.structural.groups).map((ids) => {
    const f = text.get(ids[0]);
    const ev = f.evidence ?? {};
    const frames = ev.session
      ? (ev.frames ?? [])
          .map((n) => shot(join(round, ev.session), `${String(n).padStart(3, "0")}.jpg`))
          .filter(Boolean)
      : [];
    return { finding: f, class: graded.get(f.id)?.class, also: ids.length - 1, frames };
  });

  let battle = null;
  if (opts.battle) {
    const b = readJson(opts.battle);
    const at = (p) => (isAbsolute(p) ? p : join(dirname(resolve(opts.battle)), p));
    const shapes = b.shapes.map((s, i) => ({
      ...s,
      frame:
        s.frame && existsSync(at(s.frame))
          ? link(copySmall(at(s.frame), join(shots, `battle-${i + 1}.jpg`)))
          : null,
    }));
    const order = [...shapes].sort(
      (x, y) =>
        y.success - x.success ||
        x.wrongTurns - y.wrongTurns ||
        x.involuntaryScroll - y.involuntaryScroll ||
        y.ease - x.ease,
    );
    battle = { fork: b.fork, shapes, least: b.least ?? order[0]?.name };
  }
  const battleReason =
    opts.battleReason ??
    (grade.gate.pass
      ? "no battle-test results were given"
      : "the round did not pass the bar, so no design was battle-tested");

  let jobMap = null;
  if (opts.jobMap) {
    const raw = readFileSync(opts.jobMap, "utf8");
    jobMap = opts.jobMap.endsWith(".json")
      ? { kind: "json", ...JSON.parse(raw) }
      : { kind: "md", text: raw };
  }
  const titles = opts.reveal
    ? Object.fromEntries(
        parseGold(readFileSync(join(opts.sealed, "gold.md"), "utf8")).map((g) => [g.id, g.title]),
      )
    : null;
  const ownerShot = opts.ownerShot ? link(resolve(opts.ownerShot)) : null;

  const markdown = renderReadout({
    study: opts.study,
    grade,
    picture,
    ownerShot,
    structural,
    titles,
    battle,
    battleReason,
    jobMap,
    nextArea: opts.nextArea,
    cost: opts.cost,
  });
  writeFileSync(page, markdown);
  return { page, shots, markdown };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const { page, shots } = buildReadout(readoutArgs(process.argv.slice(2)));
    console.log(`readout: ${page} (frames in ${shots})`);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
