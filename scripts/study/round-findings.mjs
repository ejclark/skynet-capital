// Collecting a round's findings (#4943) — PURE, specced in tests/scripts/study-round.spec.ts.
//
// Every finding any evaluator produced lands in one shape, with a stable id, so grading can hand
// matchers the findings without saying who found them. The record and the class vocabulary
// (members · experts · words · instruments, with `voice` and `expert` kept as fields) are
// round-contract.mjs's — the same module grade.mjs and readout.mjs read them through.
// `classes.json` keeps id → class apart from the findings, because the matchers get the findings.

import { createHash } from "node:crypto";
import { membersClass } from "./round-contract.mjs";

const SCALE = ["none", "low", "moderate", "high", "critical"];

/** Any evaluator's severity on one scale: none · low · moderate · high · critical. */
export function severityOf(raw) {
  if (Number.isInteger(raw)) return SCALE[Math.max(0, Math.min(4, raw))];
  const s = String(raw ?? "").toLowerCase();
  if (s === "medium") return "moderate";
  return SCALE.includes(s) ? s : "low";
}

/** One viewport, or "both" when the evidence spans both. */
function viewportOf(list) {
  const set = new Set(list.filter(Boolean));
  if (set.size === 0) return null;
  return set.size === 1 ? [...set][0] : "both";
}

/** The surface of a finding from the frames it cites: the first route, every viewport. */
function surfaceOf(frames, fallback = {}) {
  return {
    route: frames.find((f) => f.route)?.route ?? fallback.route ?? null,
    viewport: viewportOf(frames.map((f) => f.viewport)) ?? fallback.viewport ?? null,
  };
}

/** Ids → the frames they name; unknown ids are dropped (and counted by the caller's log). */
const framesFor = (ids, map) => ids.map((id) => map[id]).filter(Boolean);

/**
 * An analyst's findings: the members class, whoever voiced it — the member, or the analyst reading
 * the trace (`voice`). `frames`: label → {path, route, viewport}.
 */
export function fromAnalyst({ member, answer, frames }) {
  return (answer.findings ?? []).map((f) => {
    const cited = framesFor(f.frames ?? [], frames);
    return {
      ...membersClass(f.voice),
      member,
      level: f.level,
      severityRaw: f.severity,
      surface: surfaceOf(cited),
      evidence: cited.map((c) => c.path),
      what: f.what,
      detail: { quote: f.quote, frequency: f.frequency, frames: f.frames },
    };
  });
}

/** One expert's consolidated findings. `batch`: batch finding id → {frames: [{path, route, viewport}]}. */
export function fromExpert({ k, answer, batch }) {
  return (answer.findings ?? []).map((f) => {
    const cited = (f.from ?? []).flatMap((id) => batch[id]?.frames ?? []);
    const surface = surfaceOf(cited);
    return {
      class: "experts",
      expert: k,
      level: f.level,
      severityRaw: f.severity,
      surface: { route: surface.route, viewport: f.viewport ?? surface.viewport },
      evidence: [...new Set(cited.map((c) => c.path))],
      what: f.what,
      detail: {
        principle: f.principle,
        why: f.why,
        fix: f.fix,
        page: f.page,
        member: f.member,
        from: f.from,
      },
    };
  });
}

/** The words pass's findings; the viewport is where the harvest saw that text on that route. */
export function fromWords({ answer, strings }) {
  return (answer.findings ?? []).map((f) => {
    const seen = strings.routes?.[f.route]?.[f.where]?.find((s) => s.text === f.text);
    return {
      class: "words",
      level: "surface",
      severityRaw: f.severity,
      surface: { route: f.route, viewport: viewportOf(seen?.viewports ?? []) },
      evidence: [],
      what: `"${f.text}" — ${f.why}`,
      detail: {
        text: f.text,
        where: f.where,
        standard: f.standard,
        member: f.member,
        rewrite: f.rewrite,
      },
    };
  });
}

/**
 * The recorder's and the census's own findings, one per kind × route × viewport × snippet, with how
 * many times it fired and up to three frames. `raw`: `{kind, what, snippet, severity, route,
 * viewport, frame}`.
 */
export function fromInstruments(raw) {
  const groups = new Map();
  for (const r of raw) {
    const key = [r.kind, r.route, r.viewport, r.snippet ?? ""].join("|");
    const g = groups.get(key) ?? { ...r, times: 0, frames: [] };
    g.times += 1;
    if (r.frame && g.frames.length < 3 && !g.frames.includes(r.frame)) g.frames.push(r.frame);
    groups.set(key, g);
  }
  return [...groups.values()].map((g) => ({
    class: "instruments",
    level: "surface",
    severityRaw: g.severity,
    surface: { route: g.route, viewport: g.viewport },
    evidence: g.frames,
    what: g.what.replace(/ — ×\d+$/, ""),
    detail: { kind: g.kind, snippet: g.snippet ?? null, times: g.times, source: g.source },
  }));
}

/**
 * A finding's stable id: its surface and words, hashed — the same inputs, the same id. Never its
 * class: a matcher could hash the handful of classes against what + surface and read the source.
 */
export function findingId(f) {
  const basis = [f.surface?.route, f.surface?.viewport, f.what].join("\n");
  return `F-${createHash("sha256").update(basis).digest("hex").slice(0, 10)}`;
}

/**
 * Every finding, normalised and given an id (repeats of an id get `-2`, `-3` …), and the
 * id → class map kept apart. `{findings, classes}`.
 */
export function collectFindings(groups) {
  const all = groups.flat();
  const bases = all.map(findingId);
  // Repeats of one id are numbered by a hash of the whole record, not by collection order — the
  // order runs analysts, experts 1…k, words, instruments, so `-2` would otherwise say "later source".
  const rank = all.map((f) => createHash("sha256").update(JSON.stringify(f)).digest("hex"));
  const byBase = new Map();
  for (const [i, base] of bases.entries()) byBase.set(base, [...(byBase.get(base) ?? []), i]);
  const ids = new Array(all.length);
  for (const [base, idx] of byBase) {
    const ordered = [...idx].sort((a, b) =>
      rank[a] < rank[b] ? -1 : rank[a] > rank[b] ? 1 : a - b,
    );
    ordered.forEach((i, n) => {
      ids[i] = n === 0 ? base : `${base}-${n + 1}`;
    });
  }
  const findings = all.map((f, i) => {
    const { severityRaw, ...rest } = f;
    return { id: ids[i], ...rest, severity: severityOf(severityRaw), severityRaw };
  });
  const classes = Object.fromEntries(findings.map((f) => [f.id, f.class]));
  return { findings, classes };
}

/**
 * Findings as a matcher receives them: what, where, how bad, how deep — and nothing that says who
 * found it. The class goes, and so do the detail and the evidence paths, which name their source
 * (an analyst's member, a census folder, an expert's principle). Sorted by id, because collection
 * order is by source (analysts, experts, words, instruments) and position would name it. The
 * checker reads the full record.
 */
export const stripClasses = (findings) =>
  findings
    .map((f) => ({
      id: f.id,
      what: f.what,
      level: f.level,
      severity: f.severity,
      surface: f.surface,
    }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
