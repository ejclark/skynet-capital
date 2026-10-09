// One round's grade, assembled from the arithmetic in grade-core.mjs (#4943). Pure: grade.mjs
// reads the files, this decides everything, grade.json is what it returns.
//
// grade.json carries key item IDS only, never their wording: the sealed key's text stays in the
// sealed folder, and the readout shows it only when asked to (`readout.mjs --reveal`).

import {
  bestScores,
  consensus,
  controlVerdict,
  cycleGate,
  easyMode,
  newProblems,
  primedSplit,
  thoroughness,
  validity,
  verdictOf,
} from "./grade-core.mjs";
import { BLIND, CLASSES, classProblems } from "./round-contract.mjs";

const LEVELS = ["structural", "surface"];
const VERDICTS = ["real", "false", "world-artifact"];

/** A touches.json entry read as touched or not: true, a positive count, or a non-empty list. */
const touchedBy = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === "number" ? v > 0 : !!v);

/** Checker verdicts by finding id; problems for an unknown finding or verdict. */
function checkIndex(checks, ids, problems) {
  const out = new Map();
  for (const c of checks) {
    if (!ids.has(c.finding)) problems.push(`checks.json names unknown ${c.finding}`);
    if (!VERDICTS.includes(c.verdict)) problems.push(`checks.json: ${c.finding} is "${c.verdict}"`);
    out.set(c.finding, c);
  }
  return out;
}

/** A control round ({expect, findings, m1, m2, tiebreak}) → its verdict. */
function control(kind, round, problems) {
  if (!round) return controlVerdict(kind, null);
  const { byId, problems: p } = consensus({
    ids: round.findings.map((f) => f.id),
    m1: round.m1,
    m2: round.m2,
    tiebreak: round.tiebreak,
  });
  problems.push(...p.map((x) => `${kind} control: ${x}`));
  return controlVerdict(kind, { expect: round.expect, findings: round.findings, byId });
}

/** Per class (and the blind classes together): thoroughness, validity, new problems by level. */
function perClass(fs, byId, checks, mainIds, renderIds) {
  const out = {};
  for (const cls of [...CLASSES, "blind"]) {
    const set = cls === "blind" ? BLIND : [cls];
    const subset = fs.filter((f) => set.includes(f.class));
    const level = (l) => newProblems({ findings: subset, byId, checks, mainIds, level: l }).count;
    out[cls] = {
      thoroughness: thoroughness(renderIds, bestScores(fs, byId, set)),
      validity: validity(subset, byId, checks),
      structural: level("structural"),
      smaller: level("surface"),
    };
  }
  return out;
}

/** Each member's own finds (the owner's member card is reported apart, per the plan). */
function perMember(fs, byId, renderIds, primes) {
  const out = {};
  const members = [...new Set(fs.filter((f) => f.class === "members").map((f) => f.member))];
  for (const m of members.filter(Boolean).sort()) {
    const own = fs.filter((f) => f.class === "members" && f.member === m);
    const t = thoroughness(renderIds, bestScores(own, byId, ["members"]));
    out[m] = { ...t, primed: t.ids.filter((id) => (primes[m] ?? []).includes(id)) };
  }
  return out;
}

/**
 * Grade one round. Input: the parsed key (`gold`), `primes` (member → key ids its card hints at),
 * `findings` (+ `classes`: id → class), the two matcher files and an optional tie-break, the
 * checker's verdicts, `struck` key ids, `touches` (key id → touched; null when not recorded), the
 * member sessions ({member, success, ease}), and the two control rounds (null when not run).
 */
export function gradeRound(input) {
  const { gold, primes = {}, classes, m1, m2, tiebreak = [], checks = [], struck = [] } = input;
  const { touches = null, sessions = [], negative = null, positive = null } = input;
  const problems = [];
  const seen = new Set();
  const fs = input.findings.map((f) => {
    if (seen.has(f.id)) problems.push(`finding ${f.id} appears twice`);
    seen.add(f.id);
    const cls = classes[f.id];
    problems.push(...classProblems(f, cls));
    if (!LEVELS.includes(f.level)) problems.push(`finding ${f.id} level is "${f.level}"`);
    return { ...f, class: cls };
  });
  const cons = consensus({ ids: fs.map((f) => f.id), m1, m2, tiebreak });
  problems.push(...cons.problems);
  const { byId } = cons;
  const checkMap = checkIndex(checks, seen, problems);
  const goldIds = new Set(gold.map((g) => g.id));
  for (const id of struck) if (!goldIds.has(id)) problems.push(`struck names unknown ${id}`);
  for (const [id, c] of byId)
    if (c.gold && !goldIds.has(c.gold)) problems.push(`${id} is matched to unknown ${c.gold}`);

  const mainIds = gold.filter((g) => g.tier === "main").map((g) => g.id);
  const renderIds = mainIds.filter((id) => !struck.includes(id));
  const classesOut = perClass(fs, byId, checkMap, mainIds, renderIds);
  const blindFs = fs.filter((f) => BLIND.includes(f.class));
  const level = (l) =>
    newProblems({ findings: blindFs, byId, checks: checkMap, mainIds, level: l });
  const structural = level("structural");
  const smaller = level("surface");
  const primed = primedSplit({ renderIds, findings: fs, byId, primes });
  const disputed = [...byId].filter(([, c]) => c.disputed);
  // A row is disputed only where some matcher claimed it — a score of 0 is no claim (labelOf).
  const disputedGold = new Set(
    disputed.flatMap(([, c]) =>
      [c.m1, c.m2, c.tiebreak].filter((m) => m?.gold && m.score > 0).map((m) => m.gold),
    ),
  );

  const rows = gold.map((g) => {
    const scores = {};
    for (const cls of [...CLASSES, "blind"])
      scores[cls] = bestScores(fs, byId, cls === "blind" ? BLIND : [cls]).get(g.id) ?? 0;
    return {
      id: g.id,
      tier: g.tier,
      struck: struck.includes(g.id),
      touched: touches === null ? null : touchedBy(touches[g.id]),
      scores,
      primed: primed.primed.includes(g.id),
      disputed: disputedGold.has(g.id),
    };
  });
  const controls = {
    negative: control("negative", negative, problems),
    positive: control("positive", positive, problems),
  };
  const blind = classesOut.blind;
  return {
    version: 1,
    headline: {
      found: blind.thoroughness.found,
      renders: renderIds.length,
      total: mainIds.length,
      struck: mainIds.length - renderIds.length,
      structural: structural.count,
      smaller: smaller.count,
    },
    gate: cycleGate({
      recall: blind.thoroughness.rate,
      validity: blind.validity.rate,
      structural: structural.count,
      ...controls,
    }),
    gold: rows,
    classes: classesOut,
    primed,
    perMember: perMember(fs, byId, renderIds, primes),
    structural,
    smaller,
    agreement: {
      ...cons.agreement,
      disputed: disputed.map(([finding, c]) => ({
        finding,
        m1: c.m1,
        m2: c.m2,
        tiebreak: c.tiebreak,
        resolvedBy: c.resolvedBy,
      })),
    },
    diagnostics: { touchesRecorded: touches !== null, easyMode: easyMode(sessions) },
    controls,
    findings: fs.map((f) => {
      const c = byId.get(f.id);
      return {
        id: f.id,
        class: f.class,
        member: f.member ?? null,
        voice: f.voice ?? null,
        expert: f.expert ?? null,
        level: f.level,
        gold: c.gold,
        score: c.score,
        disputed: c.disputed,
        verdict: verdictOf(f, byId, checkMap),
      };
    }),
    problems,
  };
}
