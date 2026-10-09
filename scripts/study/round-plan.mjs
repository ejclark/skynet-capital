// The pure half of a study round (#4943) — the command line, the area config's checks, which
// sessions run, which censuses are taken, which frames an analyst sees, how the census is batched
// for the experts, and what the lint is allowed to say back to the task author. round.mjs and its
// step files act on these decisions; every one is specced without a browser or a model
// (tests/scripts/study-round.spec.ts).
//
// Area-agnostic: members, worlds, viewers and routes arrive in the area config
// (scripts/study/tasks/<area>.json); nothing here names one. The round directory's layout is
// round-contract.mjs's, shared with the readers (grade.mjs, readout.mjs).

import { SESSIONS, sessionDir } from "./round-contract.mjs";

/** The steps, in order — each writes into <out>/<dir>/. */
export const STEPS = [
  "0-preflight",
  "1-cards",
  "2-canary",
  "3-framer",
  "4-tasks",
  SESSIONS,
  "6-analysts",
  "7-experts",
  "8-words",
  "9-member-types",
  "10-collect",
];

/** Every role a round calls blind — each passes the canary first. */
export const BLIND_ROLES = [
  "framer",
  "task-author",
  "actor",
  "analyst",
  "expert",
  "words",
  "member-type-audit",
];

const USAGE =
  "usage: round.mjs --pin <pin dir> --out <dir> --sealed <dir> [--profile <area.json>] " +
  "[--thin] [--dry-run] [--stub <dir>] [--concurrency N] [--only-world <name>] [--cap N]";

/** The command line, checked. `--stub` implies a dry run; `--dry-run` alone uses `defaultStub`. */
export function roundArgs(argv, { defaultStub, defaultProfile }) {
  const out = { thin: false, dryRun: false, profile: defaultProfile };
  const takes = {
    "--pin": "pin",
    "--out": "out",
    "--sealed": "sealed",
    "--profile": "profile",
    "--stub": "stub",
    "--concurrency": "concurrency",
    "--only-world": "onlyWorld",
    "--cap": "cap",
  };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--thin") out.thin = true;
    else if (flag === "--dry-run") out.dryRun = true;
    else if (takes[flag]) {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) throw new Error(`${flag} needs a value`);
      out[takes[flag]] = value;
    } else throw new Error(`unknown argument ${flag}\n${USAGE}`);
  }
  for (const k of ["pin", "out", "sealed"]) {
    if (!out[k]) throw new Error(`--${k} is required\n${USAGE}`);
  }
  for (const k of ["concurrency", "cap"]) {
    if (out[k] === undefined) continue;
    const n = Number(out[k]);
    if (!(Number.isInteger(n) && n > 0)) throw new Error(`--${k} must be a positive integer`);
    out[k] = n;
  }
  if (out.stub) out.dryRun = true;
  else if (out.dryRun) out.stub = defaultStub;
  return out;
}

/**
 * What a round's out dir was made under — everything that changes what a step writes. A resume
 * (a step skipped on its done.json) is only honest under the same mode; `--concurrency` is left
 * out, since it changes how fast, not what. `profileSha` is the area config's sha256.
 */
export function roundMode(opts, profileSha) {
  return {
    profile: opts.profile,
    profileSha,
    pin: opts.pin,
    sealed: opts.sealed,
    thin: Boolean(opts.thin),
    stub: opts.stub ?? null,
    onlyWorld: opts.onlyWorld ?? null,
    cap: opts.cap ?? null,
  };
}

/** The mode keys that differ between an out dir's recorded mode and this run's; [] = resumable. */
export function modeChanges(recorded, now) {
  const keys = [...new Set([...Object.keys(recorded ?? {}), ...Object.keys(now)])];
  return keys.filter(
    (k) => JSON.stringify(recorded?.[k] ?? null) !== JSON.stringify(now[k] ?? null),
  );
}

const isText = (v) => typeof v === "string" && v.trim().length > 0;
const VIEWPORTS = ["phone", "desktop"];

/** The area config's problems, or [] when a round can run from it. */
export function profileProblems(p) {
  const out = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p?.cutoff ?? "")) out.push("cutoff must be YYYY-MM-DD");
  for (const k of ["tasksPer", "runs", "censusCap", "concurrency", "experts"]) {
    if (!(Number.isInteger(p?.[k]) && p[k] > 0)) out.push(`${k} must be a positive integer`);
  }
  if (!(Array.isArray(p?.matrix) && p.matrix.length > 0)) out.push("matrix must list rows");
  for (const [i, r] of (p?.matrix ?? []).entries()) {
    for (const k of ["member", "world", "viewer", "start"]) {
      if (!isText(r[k])) out.push(`matrix[${i}].${k} is required`);
    }
    if (!(Array.isArray(r.viewports) && r.viewports.length > 0)) {
      out.push(`matrix[${i}].viewports must list phone and/or desktop`);
    } else if (r.viewports.some((v) => !VIEWPORTS.includes(v))) {
      out.push(`matrix[${i}].viewports: phone and/or desktop only`);
    }
    if (isText(r.start) && !r.start.startsWith("/")) out.push(`matrix[${i}].start must be a path`);
  }
  if (!(Array.isArray(p?.pages) && p.pages.every(isText) && p.pages.length > 0)) {
    out.push("pages must list plain descriptions");
  }
  for (const [i, c] of (p?.census ?? []).entries()) {
    if (!(isText(c.world) && isText(c.viewer))) out.push(`census[${i}] needs world and viewer`);
    if (!(Array.isArray(c.for) && c.for.length > 0)) out.push(`census[${i}].for is required`);
  }
  const t = p?.thin;
  if (!(t && p.matrix?.some((r) => r.member === t.member && r.world === t.world))) {
    out.push("thin must name a member and world from the matrix");
  } else {
    if (!VIEWPORTS.includes(t.viewport)) out.push("thin.viewport: phone or desktop");
    if (!(Number.isInteger(t.task) && t.task >= 1 && t.task <= p.tasksPer)) {
      out.push(`thin.task must be 1..${p.tasksPer}`);
    }
    if (!isText(t.expertRoute)) out.push("thin.expertRoute is required");
  }
  return out;
}

/** The matrix rows this round runs: the thin cut, or every row (of one world, when asked). */
export function selectMatrix(p, { thin = false, onlyWorld } = {}) {
  if (thin) {
    const row = p.matrix.find((r) => r.member === p.thin.member && r.world === p.thin.world);
    return [{ ...row, viewports: [p.thin.viewport] }];
  }
  return p.matrix.filter((r) => !onlyWorld || r.world === onlyWorld);
}

/** Runs per task in a world: the world's override, else the default. */
export const runsFor = (p, world) => p.runsByWorld?.[world] ?? p.runs;

/** The member × world pairs a task author writes for, once each, in matrix order. */
export function taskUnits(matrix) {
  const out = [];
  for (const r of matrix) {
    if (out.some((u) => u.member === r.member && u.world === r.world)) continue;
    out.push({
      member: r.member,
      world: r.world,
      viewer: r.viewer,
      start: r.start,
      key: `${r.member}--${r.world}`,
    });
  }
  return out;
}

/**
 * Every session of the round: member × world × viewport × task × run, each with its own directory
 * under the sessions folder (round-contract.mjs → sessionDir) — nothing shared. `tasksByUnit`:
 * unit key → its frozen task ids, in order.
 */
export function planSessions({ p, matrix, tasksByUnit, thin = false }) {
  const out = [];
  for (const r of matrix) {
    const ids = tasksByUnit[`${r.member}--${r.world}`] ?? [];
    const tasks = thin ? ids.slice(p.thin.task - 1, p.thin.task) : ids;
    const runs = thin ? 1 : runsFor(p, r.world);
    for (const viewport of r.viewports) {
      for (const task of tasks) {
        for (let run = 1; run <= runs; run++) {
          const s = { member: r.member, world: r.world, viewer: r.viewer, viewport, task, run };
          out.push({ ...s, dir: sessionDir(s) });
        }
      }
    }
  }
  return out;
}

/** The config's censuses, each with its key. */
const configCensuses = (p) =>
  (p.census ?? []).map((c, i) => ({
    key: `census-${c.world}-${c.viewer}-${i + 1}`,
    world: c.world,
    viewer: c.viewer,
    routes: c.routes ?? [],
    viewports: c.viewports ?? VIEWPORTS,
    for: c.for,
  }));

/**
 * The censuses this round takes: the config's list (one world's, when asked), or the thin cut —
 * one expert census of one route at one width, PLUS the config's label censuses for the thin
 * member's world and viewer at that width. The task lint checks against the labels these harvest,
 * and the thin member can walk to every page its viewer reaches, not only the expert's route.
 */
export function censusPlan(p, { thin = false, onlyWorld } = {}) {
  if (thin) {
    const row = selectMatrix(p, { thin: true })[0];
    const labels = configCensuses(p)
      .filter((c) => c.world === row.world && c.viewer === row.viewer && c.for.includes("labels"))
      .map((c) => ({ ...c, key: `${c.key}-thin`, viewports: [p.thin.viewport], for: ["labels"] }));
    return [
      {
        key: `census-${row.world}-${row.viewer}-thin`,
        world: row.world,
        viewer: row.viewer,
        routes: [p.thin.expertRoute],
        viewports: [p.thin.viewport],
        for: ["experts", "labels"],
      },
      ...labels,
    ];
  }
  return configCensuses(p).filter((c) => !onlyWorld || c.world === onlyWorld);
}

const LINT_LINE = /^rewrite \S+ item \d+ \([a-z-]+\)$/;

/** From lint.mjs's stdout, ONLY its "rewrite <file> item N (<kind>)" lines — nothing else. */
export function lintFeedback(stdout) {
  return String(stdout ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => LINT_LINE.test(l));
}

/** From lint.mjs --kind card's stdout: priming hits per card file. */
export function primingCounts(stdout) {
  const out = {};
  for (const line of String(stdout ?? "").split("\n")) {
    const m = /^(\S+): (\d+) priming hit\(s\) logged$/.exec(line.trim());
    if (m) out[m[1]] = Number(m[2]);
  }
  return out;
}

/** The canary's question: the blockquote of roles/canary.md, joined. */
export function canaryQuestion(markdown) {
  const lines = markdown
    .split("\n")
    .filter((l) => l.startsWith(">"))
    .map((l) => l.replace(/^>\s?/, "").trim());
  if (lines.length === 0) throw new Error("canary.md holds no quoted question");
  return lines.join(" ");
}

/** A canary answer passes only when it knows nothing and was told nothing else. */
export function canaryVerdict(answer) {
  const knows = String(answer?.knowledge ?? "").trim();
  const told = String(answer?.other_instructions ?? "").trim();
  if (knows) return { ok: false, why: "it named knowledge about the app" };
  if (told) return { ok: false, why: "it quoted instructions beyond its role prompt" };
  return { ok: true, why: "empty" };
}

/**
 * The facts a task author may use for one viewer, and a resolver from a fact id to the oracle's
 * task fields. Unknown ids come back as lint-shaped lines, so the loop feeds them back the same way.
 */
export function resolveTasks({ drafts, facts, unit, file }) {
  const own = new Map(facts.filter((f) => f.viewer === unit.viewer).map((f) => [f.id, f]));
  const tasks = [];
  const problems = [];
  drafts.forEach((d, i) => {
    const fact = own.get(String(d.answerRegion ?? "").trim());
    if (!fact) {
      problems.push(`rewrite ${file} item ${i + 1} (unknown-fact)`);
      return;
    }
    tasks.push({
      id: `${unit.key}--t${i + 1}`,
      member: unit.member,
      world: unit.world,
      scenario: d.scenario,
      start: unit.start,
      answer: fact.answer,
      answerRegion: fact.answerRegion,
      fact: fact.id,
      outcome: d.outcome,
      said: d.answer,
    });
  });
  return { tasks, problems };
}

/** Several facts sheets as one (harvest takes one): facts concatenated, data names unioned. */
export function mergeFacts(sheets) {
  return {
    worlds: sheets.map((s) => s.world),
    facts: sheets.flatMap((s) => s.facts.map((f) => ({ ...f, world: s.world }))),
    dataNames: [...new Set(sheets.flatMap((s) => s.dataNames ?? []))],
  };
}
