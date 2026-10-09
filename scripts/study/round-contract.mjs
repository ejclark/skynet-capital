// THE ROUND CONTRACT (#4943) — the one owner of a member-study round directory's layout and of the
// evaluator classes. round.mjs (and its step files) WRITES a round through these names; grade.mjs
// and readout.mjs READ it through them (round-files.mjs). Pure: names, paths and shapes only.
// Specced end to end in tests/scripts/study-round-e2e.spec.ts, which runs a stub round into a temp
// dir and grades and reads it out — a drift between writer and readers fails there.
//
// A ROUND DIRECTORY (round.mjs --out):
//   round.json  log.jsonl  frozen.json  <step>/done.json …   the round's own bookkeeping
//   5-sessions/<member>/<world>/<viewport>/<task>/run-<n>/   one member session each (drive.mjs):
//                      summary.json · turns.jsonl · trace.jsonl · frames/NNN.jpg
//   findings.jsonl     every finding, one per line — the record below
//   classes.json       {<finding id>: <class>} — kept apart, because the matchers get the findings
//   findings-unlabelled.jsonl   what a matcher gets: id · what · level · severity · surface, by id
// Written after the round by the aware roles (never by round.mjs):
//   matches-1.json, matches-2.json, tiebreak.json?   [{finding, gold: <key id>|null, score: 1|0.5|0}]
//   checks.json?   [{finding, verdict: real|false|world-artifact, same_as?: <finding id>}]
//   touches.json?  {<key id>: true | <count> | [<session dir>…]} — which key surfaces a trace touched
//   struck.json?   [<key id>…] — key items parity proved cannot render
// A CONTROL ROUND holds findings.jsonl, the matcher files and control.json {expect: [<key id>…]}.
//
// A FINDING (findings.jsonl):
//   {id, class, level: structural|surface, severity, severityRaw, what,
//    surface: {route, viewport}, evidence: [<frame path relative to the round>…],
//    member?, voice?   — members class: whose sessions it came from, and whether the member said it
//    expert?           — experts class: which expert (1…N)
//    detail: {quote?, principle?, why?, fix?, where?, … what that evaluator also said}}
//
// THE CLASSES — who found it, as the plan grades them (Hartson, Andre & Williges 2001):
//   members      an analyst over one member's sessions; `voice` keeps member-voiced (the member
//                said it) apart from instrument-only (the analyst read it from the trace) — both
//                are blind, so both are the members class
//   experts      expert reviews over the census; `expert` keeps which one
//   words        the pass over the harvested words
//   instruments  the recorder's and the census's own measurements — designed by someone who saw
//                the key, so reported in their own column and NEVER counted as blind discovery

export const CLASSES = ["members", "experts", "words", "instruments"];
/** The classes that never saw the key. */
export const BLIND = ["members", "experts", "words"];
/** How a members-class finding reached the analyst. */
export const VOICES = ["member-voiced", "instrument-only"];

/** The round's file names, one place. */
export const FILES = {
  findings: "findings.jsonl",
  unlabelled: "findings-unlabelled.jsonl",
  classes: "classes.json",
  m1: "matches-1.json",
  m2: "matches-2.json",
  tiebreak: "tiebreak.json",
  checks: "checks.json",
  touches: "touches.json",
  struck: "struck.json",
  control: "control.json",
  grade: "grade.json",
};

/** The sessions step's folder — also the round step that writes it. */
export const SESSIONS = "5-sessions";

const SEGMENT = /^[^/\\]+$/;

/** One session's folder under SESSIONS: <member>/<world>/<viewport>/<task>/run-<n>. */
export function sessionDir({ member, world, viewport, task, run }) {
  const parts = [member, world, viewport, task];
  if (!(parts.every((p) => SEGMENT.test(String(p ?? ""))) && Number.isInteger(run) && run > 0)) {
    throw new Error(`not a session: ${JSON.stringify({ member, world, viewport, task, run })}`);
  }
  return `${parts.join("/")}/run-${run}`;
}

/** A session folder relative to the round (`5-sessions/…/run-n`) → its parts, or null. */
export function parseSessionDir(rel) {
  const parts = String(rel).split(/[/\\]/).filter(Boolean);
  if (parts.length !== 6 || parts[0] !== SESSIONS) return null;
  const run = /^run-(\d+)$/.exec(parts[5]);
  if (!run) return null;
  const [, member, world, viewport, task] = parts;
  return { member, world, viewport, task, run: Number(run[1]) };
}

/** An analyst's finding: the members class, its voice kept beside it. */
export function membersClass(voice) {
  // Passed through unchanged: a drifted voice must reach classProblems and be refused, not coerced.
  return { class: "members", voice };
}

/** Problems with one finding's class fields; [] when it keeps the contract. */
export function classProblems(f, cls = f.class) {
  if (!CLASSES.includes(cls)) return [`finding ${f.id} has no class (${cls ?? "missing"})`];
  if (cls === "members" && !f.member) return [`members finding ${f.id} names no member`];
  if (cls === "members" && !VOICES.includes(f.voice))
    return [`members finding ${f.id} has no voice (${VOICES.join(" | ")})`];
  return [];
}

/** What a reader shows of a finding: its words, who found it, and its frames. */
export function findingView(f) {
  const d = f.detail ?? {};
  return {
    id: f.id,
    what: f.what,
    level: f.level,
    severity: f.severity ?? null,
    member: f.member ?? null,
    voice: f.voice ?? null,
    expert: f.expert ?? null,
    quote: d.quote || null,
    principle: d.principle ?? null,
    why: d.why ?? null,
    fix: d.fix ?? null,
    where: d.where ?? null,
    frames: Array.isArray(f.evidence) ? f.evidence : [],
  };
}
