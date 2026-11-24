#!/usr/bin/env node
// THE READOUT (#4943) — grade.json + the round → the one page the owner judges at the stop.
//
//   node scripts/study/readout.mjs --grade <grade.json> --round <dir> --study <name>
//        --next-area <text> --cost <text> [--owner-shot <path>] [--battle <battle.json>]
//        [--battle-reason <text>] [--job-map <framer output .json|.md>] [--picture <session dir>]
//        [--reveal --sealed <dir>] [--root <repo root>] [--ia <IA.md>] [--silence <text>]
//
// Writes <root>/docs/members/study/<study>/readout.md and copies every frame it shows, small
// (≤ 100KB JPEG), to <root>/docs/shots/study-<study>/. The layout and words are readout-core.mjs.
//
// THE PICTURE is the member session with the most confused turn (a failed session first on a tie;
// `--picture` names one instead): the frame before, what they did, the frame after — beside the
// owner's own screenshot (`--owner-shot`, linked, never copied, refused outside `--root`).
// STRUCTURAL FINDINGS are the ones grade.json counted as new, one per checker `same_as` group,
// ranked (severity · times reported · members reached): the top ten with their evidence frames, the
// rest folded, text only, with no frames copied; the groups not counted (re-found on the key, held
// on a dispute) follow. BY ROOT (#8005): when the round holds `roots.json` (root.mjs, the aware
// rooter, after grading), the same groups are gathered under their IA roots — a §10 row of
// `--ia` (default <root>/docs/IA.md) or a new root — and the top ten ROOTS are shown, each lead
// problem with its frames, the rest folded (ia-roots.mjs). Without it the page is the flat list.
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
import { isMain } from "./compat.mjs";
import { parseGold } from "./grade-core.mjs";
import { groupByRoot, ledgerRows, ROOTS_TOP, rootsProblems } from "./ia-roots.mjs";
import { planScorecard } from "./plan-scorecard.mjs";
import {
  rankStructural,
  renderReadout,
  STRUCTURAL_TOP,
  severityRank,
  worstMoment,
  worstSeverity,
} from "./readout-core.mjs";
import { FILES, findingView } from "./round-contract.mjs";
import { findSessions, readJson, readJsonl } from "./round-files.mjs";
import { CHAT_LOG } from "./world-chat.mjs";

export const FRAME_CAP = 100 * 1024;
/**
 * Frames shown per problem: its first three. An expert's finding can cite forty census frames, and
 * the cross-feature round's draft copied 196 (9.6MB) for ten problems, each a forty-column table on
 * a phone (#8005). The rest stay in the round's folder, named on the finding.
 */
export const FRAMES_SHOWN = 3;
const USAGE =
  "usage: readout.mjs --grade <grade.json> --round <dir> --study <name> --next-area <text> " +
  "--cost <text> [--owner-shot <path>] [--battle <file>] [--battle-reason <text>] " +
  "[--job-map <file>] [--picture <session dir>] [--reveal --sealed <dir>] [--root <dir>] " +
  "[--ia <IA.md>] [--silence <text>]";

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
    ia: get("--ia"),
    // What happens if the owner says nothing, in plain words (#8037: a stop is a readout with a
    // default, never an open-ended wait); printed under the one question.
    silence: get("--silence"),
  };
  const missing = ["grade", "round", "study", "nextArea", "cost"].filter((k) => !opts[k]);
  if (missing.length) throw new Error(`missing ${missing.join(", ")}\n${USAGE}`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(opts.study))
    throw new Error("--study is lower-case words and dashes");
  if (opts.reveal && !opts.sealed) throw new Error("--reveal needs --sealed <dir>");
  return opts;
}

/**
 * Shrink one frame to a JPEG whose longer side is `side` px: macOS `sips` on the laptop, else
 * ImageMagick (`magick`, or `convert` before v7: a cloud session's Linux image has it and no sips —
 * sessions run in the cloud by default, CLAUDE.md), else ffmpeg. → true when one wrote `dest`.
 * `run` is the process runner, injected so the fallback order is specced without any of them.
 */
export function shrink(src, dest, side, quality, run = execFileSync) {
  const q = String(quality);
  const tries = [
    [
      "sips",
      ["-s", "format", "jpeg", "-s", "formatOptions", q, "-Z", String(side), src, "--out", dest],
    ],
    ["magick", [src, "-resize", `${side}x${side}>`, "-quality", q, `jpeg:${dest}`]],
    ["convert", [src, "-resize", `${side}x${side}>`, "-quality", q, `jpeg:${dest}`]],
    // ffmpeg's JPEG scale is 2 (best) to 31; map the 40–60 quality ladder onto 6–10.
    [
      "ffmpeg",
      [
        "-y",
        "-loglevel",
        "error",
        "-i",
        src,
        "-vf",
        `scale='min(${side},iw)':-2`,
        "-q:v",
        String(Math.round(16 - quality / 10)),
        dest,
      ],
    ],
  ];
  for (const [cmd, args] of tries) {
    try {
      run(cmd, args, { stdio: "ignore" });
      return true;
    } catch {
      // not installed here, or it could not read the frame: try the next
    }
  }
  return false;
}

/** Copy a frame as a JPEG of at most FRAME_CAP bytes; `shrink` makes a larger one smaller. */
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
    if (!shrink(src, dest, side, quality)) {
      throw new Error(
        `${src} is over ${FRAME_CAP / 1024}KB or not a JPEG, and neither sips nor ImageMagick could shrink it`,
      );
    }
    if (statSync(dest).size <= FRAME_CAP) return dest;
  }
  throw new Error(`${src} stays over ${FRAME_CAP / 1024}KB even at 400px`);
}

/**
 * The owner's screenshot, which is linked, never copied: it may show more than the page needs, so
 * whether it goes in the repo is the owner's call. A path outside the repo would be a link that
 * climbs out of it and shows as a broken image once committed, so it is refused.
 */
export function insideRoot(root, path) {
  const abs = resolve(path);
  const rel = relative(root, abs);
  if (!rel || rel.startsWith("..") || isAbsolute(rel))
    throw new Error(
      `--owner-shot ${path} is outside ${root}; put it in the repo (e.g. docs/shots/) so the link renders`,
    );
  if (!existsSync(abs)) throw new Error(`--owner-shot ${path} does not exist`);
  return abs;
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

/**
 * A job map as the readout lays it out ({jobs?, stages, measure: [text]}): the framer's own answer
 * (round.mjs → 3-framer/job-map.json: job_map, measure [{outcome, category}], jobs), or a file
 * already in that shape.
 */
export function jobMapOf(j) {
  const measure = (j.measure ?? []).map((m) =>
    typeof m === "string" ? m : `${m.outcome}${m.category ? ` (${m.category})` : ""}`,
  );
  const jobs = (j.jobs ?? []).map((x) => `${x.member}: ${x.main_job}`);
  return { stages: j.stages ?? j.job_map ?? [], measure, jobs };
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
    viewport: pick.s.viewport,
    before: shot(pick.s.dir, pick.m.before),
    after: pick.m.after && shot(pick.s.dir, pick.m.after),
  };

  const text = new Map(readJsonl(join(round, FILES.findings)).map((f) => [f.id, f]));
  const graded = new Map(grade.findings.map((f) => [f.id, f]));
  // A finding's evidence is frame paths relative to the round (round-contract.mjs).
  const evidenceShot = (rel) => {
    const src = join(round, rel);
    if (!existsSync(src)) return null;
    return link(copySmall(src, join(shots, `${slug(rel.replace(/\.[a-z]+$/i, ""))}.jpg`)));
  };
  // Ranked here as the page ranks them, so only the ten shown get their frames copied; the
  // folded rest are text only and copy nothing (#5845: 66 uncapped findings made 48MB).
  const ranked = rankStructural(
    Object.values(grade.structural.groups).map((ids) => {
      const f = findingView(text.get(ids[0]));
      const members = new Set(ids.map((id) => text.get(id)?.member).filter(Boolean)).size;
      // The group's worst report sets its rank and byline, so a Critical behind a Low lead still
      // lands in the top ten instead of the fold.
      const severity = worstSeverity(ids.map((id) => text.get(id)?.severity));
      return {
        ids,
        finding: f,
        class: graded.get(f.id)?.class,
        also: ids.length - 1,
        members,
        severity,
      };
    }),
  );
  const rootGroups = byRoot(ranked, { round, root, ia: opts.ia, text });
  // Frames for what the page shows in full: each shown root's lead problem, or the top ten.
  const framed = new Set(
    rootGroups
      ? rootGroups.slice(0, ROOTS_TOP).map((g) => g.items[0])
      : ranked.slice(0, STRUCTURAL_TOP),
  );
  const withFrames = (s) => ({
    ...s,
    frames: framed.has(s)
      ? s.finding.frames.slice(0, FRAMES_SHOWN).map(evidenceShot).filter(Boolean)
      : [],
  });
  const structural = ranked.map(withFrames);
  const grouped = rootGroups?.map((g) => ({ ...g, items: g.items.map(withFrames) })) ?? null;

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
      ? { kind: "json", ...jobMapOf(JSON.parse(raw)) }
      : { kind: "md", text: raw };
  }
  const titles = opts.reveal
    ? Object.fromEntries(
        parseGold(readFileSync(join(opts.sealed, "gold.md"), "utf8")).map((g) => [g.id, g.title]),
      )
    : null;
  const ownerShot = opts.ownerShot ? link(insideRoot(root, opts.ownerShot)) : null;

  // The plan's rows (#8005): every session's verdict and path, its chat log, and the aware labels
  // on what members told Moneypenny (chat-labels.json), when that read has been written.
  const labelsFile = join(round, FILES.chatLabels);
  const plan = planScorecard({
    sessions: sessions.map((s) => ({
      rel: s.rel,
      viewport: s.summary.viewport,
      success: Boolean(s.summary.oracle?.success),
      answered: Boolean(s.summary.oracle?.answer?.matched),
      lostness: s.summary.metrics?.lostness ?? null,
      task: s.summary.task,
      uniqueViews: s.summary.metrics?.uniqueViews,
      totalViews: s.summary.metrics?.totalViews,
      backtracks: s.summary.metrics?.backtracks ?? null,
      chat: existsSync(join(s.dir, CHAT_LOG)) ? readJsonl(join(s.dir, CHAT_LOG)) : [],
    })),
    labels: existsSync(labelsFile) ? readJson(labelsFile) : null,
  });

  const markdown = renderReadout({
    study: opts.study,
    grade,
    picture,
    ownerShot,
    structural,
    rootGroups: grouped,
    titles,
    battle,
    battleReason,
    jobMap,
    nextArea: opts.nextArea,
    cost: opts.cost,
    silence: opts.silence,
    plan,
  });
  writeFileSync(page, markdown);
  return { page, shots, markdown };
}

/**
 * The round's structural groups under their IA roots, or null when no rooter has placed them
 * (`roots.json` absent). A roots.json that places an unknown finding or names a row §10 lacks is
 * refused — a readout never groups on a placing it cannot read.
 */
function byRoot(ranked, { round, root, ia, text }) {
  const file = join(round, FILES.roots);
  if (!existsSync(file)) return null;
  const roots = readJson(file);
  const rows = ledgerRows(readFileSync(ia ?? join(root, "docs/IA.md"), "utf8"));
  const problems = rootsProblems(roots, { rows, ids: new Set(text.keys()) });
  if (problems.length > 0) throw new Error(`readout: ${problems.join("; ")}`);
  return groupByRoot(ranked, { roots, rows, rank: severityRank });
}

if (isMain(import.meta.url)) {
  try {
    const { page, shots } = buildReadout(readoutArgs(process.argv.slice(2)));
    console.log(`readout: ${page} (frames in ${shots})`);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
