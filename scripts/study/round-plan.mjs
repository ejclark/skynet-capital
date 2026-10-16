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
  "[--thin] [--dry-run] [--stub <dir>] [--concurrency N] [--only-world <name>] [--cap N] " +
  "[--runs N] [--experts N] " +
  "[--frozen-from <main round dir> --control negative|positive --expect <expect file>]";

/** The two control rounds a study grades its main round against (grade.mjs --negative/--positive). */
export const CONTROL_KINDS = ["negative", "positive"];

/**
 * The command line, checked. `--stub` implies a dry run; `--dry-run` alone uses `defaultStub`.
 * `--frozen-from <main round>` makes a CONTROL round (round-control.mjs): it needs `--control` and
 * `--expect`, and takes its thin cut and world from the main round — so `--thin` and
 * `--only-world` are refused beside it.
 */
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
    "--runs": "runs",
    "--experts": "experts",
    "--frozen-from": "frozenFrom",
    "--control": "control",
    "--expect": "expect",
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
  for (const k of ["concurrency", "cap", "runs", "experts"]) {
    if (out[k] === undefined) continue;
    const n = Number(out[k]);
    if (!(Number.isInteger(n) && n > 0)) throw new Error(`--${k} must be a positive integer`);
    out[k] = n;
  }
  if (out.stub) out.dryRun = true;
  else if (out.dryRun) out.stub = defaultStub;
  checkControlFlags(out);
  return out;
}

/** A control round's flags: all three or none, a known kind, and no thin cut or world of its own. */
function checkControlFlags(out) {
  const given = ["frozenFrom", "control", "expect"].filter((k) => out[k] !== undefined);
  if (given.length > 0 && given.length < 3) {
    throw new Error(`a control round needs --frozen-from, --control and --expect\n${USAGE}`);
  }
  if (out.control !== undefined && !CONTROL_KINDS.includes(out.control)) {
    throw new Error(`--control must be ${CONTROL_KINDS.join(" or ")}`);
  }
  if (out.frozenFrom && (out.thin || out.onlyWorld)) {
    throw new Error("a control round takes --thin and --only-world from its --frozen-from round");
  }
}

/** True for a control round (`--frozen-from`). */
export const isControl = (opts) => Boolean(opts?.frozenFrom);

/** The runs per task a round overrides with: `--runs`, else 1 in a control round, else none. */
export const runsOverride = (opts) => opts.runs ?? (isControl(opts) ? 1 : undefined);

/** How many experts review: `--experts`, else 1 in a thin or a control round, else the config's. */
export const expertCount = (p, opts) =>
  opts.experts ?? (opts.thin || isControl(opts) ? 1 : p.experts);

/** Why the words pass and the member-type audit are skipped (`control`, else `thin`), or null. */
export const reviewSkip = (opts) => (isControl(opts) ? "control" : opts.thin ? "thin" : null);

/**
 * What a round's out dir was made under — everything that changes what a step writes. A resume
 * (a step skipped on its done.json) is only honest under the same mode; `--concurrency` is left
 * out, since it changes how fast, not what. `profileSha` is the area config's sha256.
 */
export function roundMode(opts, profileSha) {
  // A control round's source and its freeze, and the key ids it expects (read from --expect).
  const control = isControl(opts)
    ? {
        kind: opts.control,
        from: opts.frozenFrom,
        frozen: opts.sourceFrozen ?? null,
        expect: opts.expectIds ?? null,
      }
    : null;
  return {
    profile: opts.profile,
    profileSha,
    pin: opts.pin,
    sealed: opts.sealed,
    thin: Boolean(opts.thin),
    stub: opts.stub ?? null,
    onlyWorld: opts.onlyWorld ?? null,
    cap: opts.cap ?? null,
    // Added with control rounds: null on a main round without them, so a round.json written
    // before they existed still resumes (modeChanges reads an absent key as null).
    runs: opts.runs ?? null,
    experts: opts.experts ?? null,
    control,
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
  // What the experts and the words pass read in place of the member cards (#5099).
  const unroled = [...new Set((p?.matrix ?? []).map((r) => r.member))].filter(
    (m) => isText(m) && !isText(p?.roles?.[m]),
  );
  if (unroled.length > 0) out.push(`roles must describe every member: ${unroled.join(", ")}`);
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
 * unit key → its frozen task ids, in order. `runs` overrides the runs per task (runsOverride).
 */
export function planSessions({ p, matrix, tasksByUnit, thin = false, runs: override }) {
  const out = [];
  for (const r of matrix) {
    const ids = tasksByUnit[`${r.member}--${r.world}`] ?? [];
    const tasks = thin ? ids.slice(p.thin.task - 1, p.thin.task) : ids;
    const runs = override ?? (thin ? 1 : runsFor(p, r.world));
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

// Only an interface-label line may name words (a screen label, never the key): lint.mjs → rewriteLine.
const LINT_LINE = /^rewrite \S+ item \d+ \((?:[a-z-]+|interface-label: "[^"]+"(?:, "[^"]+")*)\)$/;

/** From lint.mjs's stdout, ONLY its "rewrite <file> item N (<kind>[: "label", …])" lines. */
export function lintFeedback(stdout) {
  return String(stdout ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => LINT_LINE.test(l));
}

/**
 * After the last rewrite, keep the tasks the lint no longer names and drop the rest. A task that
 * still trips the lint is never used; one stubborn task no longer voids the whole round (first full
 * round, 2026-10-09: one bad-day task kept reaching for a sealed word for unused cash, which the
 * lint rightly never names). → {kept, dropped: [{item, kinds}]} — kinds only, never a word.
 */
export function keepClean(tasks, feedback) {
  const failing = new Map();
  for (const line of feedback) {
    const m = /^rewrite \S+ item (\d+) \(([a-z-]+)/.exec(line);
    if (!m) continue;
    const item = Number(m[1]);
    failing.set(item, [...new Set([...(failing.get(item) ?? []), m[2]])]);
  }
  const itemOf = (t) => Number(/--t(\d+)$/.exec(t.id)?.[1]);
  return {
    kept: tasks.filter((t) => !failing.has(itemOf(t))),
    dropped: [...failing].map(([item, kinds]) => ({ item, kinds })).sort((a, b) => a.item - b.item),
  };
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

/**
 * A canary answer passes only when it knows nothing and every context block it was handed is one
 * the CLI always adds even under --safe-mode: the signed-in account's email (`account-identity`),
 * its environment block (`environment`), or its own general tool-use instructions (`harness` —
 * first seen 2026-10-09: "If you intend to call multiple tools…"). Anything of kind `other` fails
 * (roles/canary.md); `knowledge` is the second net for anything mislabelled.
 */
const CLI_CONTEXT = new Set(["account-identity", "environment", "harness"]);
export function canaryVerdict(answer) {
  const knows = String(answer?.knowledge ?? "").trim();
  if (knows) return { ok: false, why: "it named knowledge about the app" };
  const context = Array.isArray(answer?.context) ? answer.context : [];
  const other = context.filter((c) => !CLI_CONTEXT.has(c?.kind));
  if (other.length > 0) return { ok: false, why: "it was handed context beyond its role prompt" };
  const kinds = [...new Set(context.map((c) => c.kind))];
  return {
    ok: true,
    why: kinds.length ? `empty (CLI context only: ${kinds.join(", ")})` : "empty",
  };
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

/**
 * The facts a task author may build on: only those whose answer region a census screen showed
 * (harvest.mjs → regions.json `seen`, keyed by harvest-plan.mjs → factKey). A fact no screen shows
 * cannot be graded — its member can be right and still fail — so it never becomes a task (#5009:
 * 304 of the first full round's 435 facts had a region no screen printed). An older regions.json
 * with no `seen` list withholds only the facts it names `missing`. → {facts, withheld}.
 */
export function gradableFacts(facts, regions) {
  if (!regions) return { facts, withheld: [] };
  const key = (f) => `${f.world ? `${f.world}/` : ""}${f.viewer}:${f.id}`;
  const keep = Array.isArray(regions.seen)
    ? (f) => regions.seen.includes(key(f))
    : (f) => !(regions.missing ?? []).includes(key(f));
  return { facts: facts.filter(keep), withheld: facts.filter((f) => !keep(f)).map(key) };
}

/** Several facts sheets as one (harvest takes one): facts concatenated, data names unioned. */
export function mergeFacts(sheets) {
  return {
    worlds: sheets.map((s) => s.world),
    facts: sheets.flatMap((s) => s.facts.map((f) => ({ ...f, world: s.world }))),
    dataNames: [...new Set(sheets.flatMap((s) => s.dataNames ?? []))],
  };
}
