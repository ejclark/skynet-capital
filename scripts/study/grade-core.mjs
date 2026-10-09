// THE GRADER'S ARITHMETIC (#4943) — pure functions only; grade.mjs reads the files and writes
// grade.json. Method: Hartson, Andre & Williges (2001), as docs/members/study/README.md → Grading.
//
// WHAT IS COUNTED, AND WHY THIS WAY
//   match       — two matchers label every finding with one key item (or none) and a score:
//                 1 same place + same mechanism · 0.5 same place, vaguer mechanism · 0 no match.
//                 Where they agree the lower score stands; where they disagree the finding is
//                 DISPUTED — a tie-break label settles it if given, else it counts as no match
//                 (and the readout marks the row for the owner's eye). Never the kinder reading.
//   found       — a key item counts found by a class when any of that class's findings matches it
//                 at ≥ 0.5; a best score of 0.5 is reported separately as partial credit.
//   thoroughness— found ÷ the main-list items that could render (struck items leave the
//                 denominator, out loud), with a Wilson 95% interval: with about a dozen items the
//                 interval is wide, and the readout says so with the number.
//   primed      — a member card can hint at an item (tagged in advance, primes.json). An item found
//                 ONLY through findings from members primed on it counts as primed recall.
//   validity    — real ÷ reported. Real = matched to any key item (main list, known gaps, the
//                 readers' own defects) at ≥ 0.5, or the checker's `real`. A checker's
//                 `world-artifact` (a stub's doing, not the app's) leaves the denominator and is
//                 counted; an unchecked finding stays in the denominator as not real.
//   yield       — real findings at a level (structural | surface) not on the key, counted once
//                 per checker `same_as` group (chains and loops resolved to one group), so three
//                 classes reporting one problem is one problem. A group is not new when any finding
//                 in it — even one outside the classes being counted — matches a key item at ≥ 0.5:
//                 a main-list match is recall, a known-gap or readers-only match is reported apart
//                 as re-found. A group with an unsettled dispute naming a key item is HELD, not
//                 counted, until a tie-break settles it — the kinder reading would count it new.
// Area-agnostic: item ids are whatever the sealed key names; nothing here knows the area.

// The evaluator classes are the round contract's (round-contract.mjs), shared with the round that
// writes them; the instruments were designed after reading the key, so they are never blind.
import { BLIND } from "./round-contract.mjs";

const FOUND_MIN = 0.5;
const Z95 = 1.959964;
const SCORES = [0, 0.5, 1];

const round3 = (x) => (x === null || Number.isNaN(x) ? null : Math.round(x * 1000) / 1000);

// A key item's line: an id first — after any heading, list or table marks, optionally bolded —
// then the title. Ids: A<n> the main list, B<n> known gaps, S<n> defects only the readers found.
const ITEM_LINE =
  /^\s*(?:#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|\|\s*)?(?:\*\*|__)?\s*([ABS]\d+[a-z]?)\b(?:\*\*|__)?\s*(?:[:.·)\]—–|-]\s*)?(.*)$/;
const TIER = { A: "main", B: "known-gap", S: "readers-only" };

/** The sealed key's items, in file order: [{id, tier, title}]; throws on a duplicate or no main list. */
export function parseGold(md) {
  const items = [];
  for (const line of md.split("\n")) {
    const m = line.match(ITEM_LINE);
    if (!m) continue;
    const [, id, rest] = m;
    if (items.some((i) => i.id === id)) throw new Error(`sealed key names ${id} twice`);
    const title = rest
      .replace(/\s*\|.*$/, "")
      .replace(/\*\*|__/g, "")
      .trim();
    items.push({ id, tier: TIER[id[0]], title });
  }
  if (!items.some((i) => i.tier === "main"))
    throw new Error("sealed key has no main-list items (lines starting A1, A2, …)");
  return items;
}

/** Wilson score interval for k successes of n (95% by default); null when n is 0. */
export function wilson(k, n, z = Z95) {
  if (!n) return null;
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return { lo: round3(Math.max(0, centre - half)), hi: round3(Math.min(1, centre + half)) };
}

/** Cohen's kappa over paired category labels; kappa is null when chance agreement is total. */
export function cohenKappa(pairs) {
  const n = pairs.length;
  if (!n) return { n: 0, observed: null, expected: null, kappa: null };
  const a = new Map();
  const b = new Map();
  let agree = 0;
  for (const [x, y] of pairs) {
    if (x === y) agree++;
    a.set(x, (a.get(x) ?? 0) + 1);
    b.set(y, (b.get(y) ?? 0) + 1);
  }
  const po = agree / n;
  let pe = 0;
  for (const [label, count] of a) pe += (count / n) * ((b.get(label) ?? 0) / n);
  const kappa = pe === 1 ? null : (po - pe) / (1 - pe);
  return { n, observed: round3(po), expected: round3(pe), kappa: round3(kappa) };
}

/** One matcher file indexed by finding id; problems for duplicates and scores off the scale. */
function indexMatches(name, entries, problems) {
  const out = new Map();
  for (const e of entries ?? []) {
    if (out.has(e.finding)) problems.push(`${name} labels ${e.finding} twice`);
    if (!SCORES.includes(e.score)) problems.push(`${name} scores ${e.finding} ${e.score}`);
    out.set(e.finding, e);
  }
  return out;
}

const labelOf = (e) => (e?.gold && e.score > 0 ? e.gold : null);
const pick = (e) => (e ? { gold: e.gold ?? null, score: e.score } : null);

/** One finding's settled label from the two matchers' entries and a tie-break entry (if any). */
function settle(e1, e2, t) {
  const [l1, l2] = [labelOf(e1), labelOf(e2)];
  const row = { m1: pick(e1), m2: pick(e2), tiebreak: pick(t) };
  if (l1 === l2) {
    const score = l1 ? Math.min(e1.score, e2.score) : 0;
    return { gold: l1, score, disputed: false, resolvedBy: "agreed", ...row };
  }
  if (!t) return { gold: null, score: 0, disputed: true, resolvedBy: "unresolved", ...row };
  const l = labelOf(t);
  return { gold: l, score: l ? t.score : 0, disputed: true, resolvedBy: "tie-break", ...row };
}

/**
 * The agreed label per finding: {gold, score, disputed, resolvedBy, m1, m2, tiebreak}, plus the
 * kappa over the two matchers' labels ("none" for no match) and the problems found on the way.
 */
export function consensus({ ids, m1, m2, tiebreak = [] }) {
  const problems = [];
  const files = [
    ["matches-1", indexMatches("matches-1", m1, problems)],
    ["matches-2", indexMatches("matches-2", m2, problems)],
    ["tie-break", indexMatches("tie-break", tiebreak, problems)],
  ];
  const known = new Set(ids);
  for (const [name, idx] of files)
    for (const id of idx.keys()) if (!known.has(id)) problems.push(`${name} names unknown ${id}`);
  const [one, two, tb] = files.map(([, idx]) => idx);
  const byId = new Map();
  const pairs = [];
  for (const id of ids) {
    const [e1, e2] = [one.get(id), two.get(id)];
    if (!e1) problems.push(`matches-1 leaves ${id} unlabelled`);
    if (!e2) problems.push(`matches-2 leaves ${id} unlabelled`);
    pairs.push([labelOf(e1) ?? "none", labelOf(e2) ?? "none"]);
    byId.set(id, settle(e1, e2, tb.get(id)));
  }
  return { byId, agreement: cohenKappa(pairs), problems };
}

/** Best consensus score per key item among `findings` whose class is in `classes` (null: all). */
export function bestScores(findings, byId, classes) {
  const best = new Map();
  for (const f of findings) {
    if (classes && !classes.includes(f.class)) continue;
    const c = byId.get(f.id);
    if (!c?.gold) continue;
    best.set(c.gold, Math.max(best.get(c.gold) ?? 0, c.score));
  }
  return best;
}

/** Found ÷ renders for a set of main-list ids, with partial credit split out and a Wilson interval. */
export function thoroughness(renderIds, best) {
  const found = renderIds.filter((id) => (best.get(id) ?? 0) >= FOUND_MIN);
  const partial = found.filter((id) => best.get(id) < 1);
  const n = renderIds.length;
  return {
    found: found.length,
    full: found.length - partial.length,
    partial: partial.length,
    renders: n,
    rate: n ? round3(found.length / n) : null,
    wilson: wilson(found.length, n),
    ids: found,
  };
}

/**
 * Primed vs unprimed recall among blind finds: an item is primed when every blind finding that
 * found it came from a member whose card was tagged as hinting at it.
 */
export function primedSplit({ renderIds, findings, byId, primes }) {
  const primed = [];
  const unprimed = [];
  for (const id of renderIds) {
    const hits = findings.filter(
      (f) =>
        BLIND.includes(f.class) && byId.get(f.id)?.gold === id && byId.get(f.id).score >= FOUND_MIN,
    );
    if (!hits.length) continue;
    const onlyPrimed = hits.every((f) => f.member && (primes[f.member] ?? []).includes(id));
    (onlyPrimed ? primed : unprimed).push(id);
  }
  const n = renderIds.length;
  return {
    primed,
    unprimed,
    unprimedRate: n ? round3(unprimed.length / n) : null,
    unprimedWilson: wilson(unprimed.length, n),
  };
}

/** Is this finding real: matched to any key item at ≥ 0.5, else the checker's word. */
export function verdictOf(f, byId, checks) {
  const c = byId.get(f.id);
  if (c?.gold && c.score >= FOUND_MIN) return "matched";
  return checks.get(f.id)?.verdict ?? "unchecked";
}

/** Real ÷ reported for a set of findings; world artifacts leave the denominator, counted. */
export function validity(findings, byId, checks) {
  const tally = { matched: 0, real: 0, false: 0, "world-artifact": 0, unchecked: 0 };
  for (const f of findings) tally[verdictOf(f, byId, checks)]++;
  const reported = findings.length - tally["world-artifact"];
  const real = tally.matched + tally.real;
  return {
    reported,
    real,
    worldArtifacts: tally["world-artifact"],
    false: tally.false,
    unchecked: tally.unchecked,
    rate: reported ? round3(real / reported) : null,
  };
}

/**
 * One representative per checker `same_as` group. Each finding names at most one `same_as`, so a
 * group has either one finding naming none (its representative) or a loop (its earliest id in
 * `order`). Returns finding id → representative id, for every id in `order` and every id named.
 */
function sameAsRoots(order, checks) {
  const next = (id) => checks.get(id)?.same_as ?? null;
  const rank = new Map(order.map((id, i) => [id, i]));
  const byRank = (a, b) =>
    (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity) || (a < b ? -1 : 1);
  const root = new Map();
  for (const start of order) {
    const path = [];
    let id = start;
    while (id && !root.has(id) && !path.includes(id)) {
      path.push(id);
      id = next(id);
    }
    const rep = !id
      ? path.at(-1)
      : root.has(id)
        ? root.get(id)
        : path.slice(path.indexOf(id)).sort(byRank)[0];
    for (const p of path) root.set(p, rep);
  }
  return root;
}

/** Key items an unsettled dispute names (either matcher, score > 0); empty when settled. */
const heldOn = (c) =>
  c?.resolvedBy === "unresolved" ? [c.m1, c.m2].filter((m) => labelOf(m)).map((m) => m.gold) : [];

/** One `same_as` group: recall (null), re-found on the key, held on a dispute, or new. */
function classifyGroup(all, ids, byId, mainIds) {
  const keyed = all
    .map((id) => byId.get(id))
    .filter((c) => c?.gold && c.score >= FOUND_MIN)
    .map((c) => c.gold);
  if (keyed.some((g) => mainIds.includes(g))) return [null];
  if (keyed.length) return ["refound", { ids, gold: [...new Set(keyed)] }];
  const candidates = [...new Set(all.flatMap((id) => heldOn(byId.get(id))))];
  return candidates.length ? ["held", { ids, candidates }] : ["groups", ids];
}

/**
 * Real findings at `level` not on the key, one per checker `same_as` group. `findings` are the ones
 * being counted; `byId` and `checks` cover the whole round, so a group whose other half sits in
 * another class or level still answers for it. Returns the new groups (counted), the groups that
 * re-found a known gap or readers-only item ({ids, gold}), and the groups held on a dispute
 * ({ids, candidates}).
 */
export function newProblems({ findings, byId, checks, mainIds, level }) {
  const roots = sameAsRoots([...byId.keys()], checks);
  const members = new Map();
  for (const [id, rep] of roots) members.set(rep, [...(members.get(rep) ?? []), id]);
  const counted = new Map();
  for (const f of findings) {
    if (f.level !== level) continue;
    const v = verdictOf(f, byId, checks);
    if (!(v === "matched" || v === "real")) continue;
    const rep = roots.get(f.id) ?? f.id;
    counted.set(rep, [...(counted.get(rep) ?? []), f.id]);
  }
  const out = { groups: {}, refound: {}, held: {} };
  for (const [rep, ids] of counted) {
    const [kind, entry] = classifyGroup(members.get(rep) ?? ids, ids, byId, mainIds);
    if (kind) out[kind][rep] = entry;
  }
  return { count: Object.keys(out.groups).length, ...out };
}

/** Success ≥ 90% with median ease ≥ 6 means the members found it too easy: calibration fails. */
export function easyMode(sessions) {
  const n = sessions.length;
  const ok = sessions.filter((s) => s.success).length;
  const eases = sessions
    .map((s) => s.ease)
    .filter((e) => typeof e === "number")
    .sort((x, y) => x - y);
  const mid = eases.length >> 1;
  const median = eases.length
    ? eases.length % 2
      ? eases[mid]
      : (eases[mid - 1] + eases[mid]) / 2
    : null;
  return {
    sessions: n,
    successRate: n ? round3(ok / n) : null,
    medianEase: median,
    // The raw rate, never the rounded one: 89.96% is not 90%.
    flagged: n > 0 && ok / n >= 0.9 && median !== null && median >= 6,
  };
}

/**
 * A control round's verdict. Negative (the fixed build): none of `expect` may be found. Positive
 * (planted defects): every one must be. Findings of any class count. Not given → not run, failed.
 * `sessions` ([{success}], when recorded): a negative control none of whose sessions succeeded
 * never showed the fixed build was reached, so its silence proves nothing — it fails.
 */
export function controlVerdict(kind, control) {
  if (!control) return { kind, ran: false, pass: false, why: "not run" };
  const { expect, findings, byId, sessions } = control;
  if (!expect?.length) throw new Error(`the ${kind} control names nothing to expect`);
  const found = [...bestScores(findings, byId, null)]
    .filter(([, s]) => s >= FOUND_MIN)
    .map(([id]) => id);
  const hit = expect.filter((id) => found.includes(id));
  const ran = Array.isArray(sessions)
    ? { sessions: sessions.length, succeeded: sessions.filter((s) => s.success).length }
    : null;
  const unreached = kind === "negative" && ran !== null && ran.succeeded === 0;
  const pass = kind === "negative" ? hit.length === 0 && !unreached : hit.length === expect.length;
  const why =
    kind === "negative"
      ? hit.length > 0
        ? `still reported: ${hit.join(", ")}`
        : unreached
          ? `no session succeeded (0 of ${ran.sessions}) — the fixed build was never shown reached`
          : "none of the fixed items was reported"
      : pass
        ? "every planted defect was found"
        : `missed: ${expect.filter((id) => !hit.includes(id)).join(", ")}`;
  return { kind, ran: true, pass, expect, found: hit, why, ...(ran ? { sessions: ran } : {}) };
}

/** The cycle gate (recall ≥ 0.6 at validity ≥ 0.5, ≥ 3 structural, both controls) and the kill rule. */
export function cycleGate({ recall, validity: v, structural, negative, positive }) {
  const checks = [
    { name: "recall", need: "≥ 0.6", value: recall, pass: recall !== null && recall >= 0.6 },
    { name: "validity", need: "≥ 0.5", value: v, pass: v !== null && v >= 0.5 },
    { name: "structural", need: "≥ 3", value: structural, pass: structural >= 3 },
    { name: "negative control", need: "pass", value: negative.why, pass: negative.pass },
    { name: "positive control", need: "pass", value: positive.why, pass: positive.pass },
  ];
  const kill = [];
  if (recall !== null && recall < 0.35) kill.push("recall under 0.35");
  if (structural === 0) kill.push("no structural findings");
  return { pass: checks.every((c) => c.pass), checks, kill: { met: kill.length > 0, why: kill } };
}
