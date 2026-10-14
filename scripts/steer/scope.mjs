// A ROUND'S SCOPE — the goal and the outcomes a design round is drawn to meet, on the page beside
// the shapes (Eric, 2026-10-14: design rounds should be sized by the agreed scope, "only as many as
// needed, no more no less").
//
// A manifest question may carry
//   "scope": { "goal": "…", "outcomes": [{ "id": "O1", "text": "…", "met": false }] }
// and each option `"serves": ["O1", …]`. The page shows "Goal: …" and every outcome with a glyph
// AND a word for its state — "☐ open" or "☑ met" — never a colour alone (he is red/green
// colourblind), and each option's row says which outcomes it serves. The lint (scopeProblems,
// called from scripts/redesign/lint-rules.mjs) holds the sizing honest: a design round whose every
// outcome is met is refused — the work is a build now, not another round — and a shape that names
// no outcome, or one the scope doesn't list, is refused, because a shape that serves nothing is
// the extra round the scope exists to stop. A problems question may carry a scope (the goal the
// problems are measured against) without `serves`.
//
// Pure: the shape the page holds, its HTML, and the lint's lines.
import { e } from "./html.mjs";

const text = (v) => typeof v === "string" && v.trim().length > 0;

/** A manifest scope as the page holds it, or null when the question carries none. */
export function scopeOf(raw) {
  if (!raw || typeof raw !== "object") return null;
  const outcomes = (Array.isArray(raw.outcomes) ? raw.outcomes : [])
    .filter((o) => text(o?.id) && text(o?.text))
    .map((o) => ({ id: o.id.trim(), text: o.text.trim(), met: o.met === true }));
  return { goal: text(raw.goal) ? raw.goal.trim() : "", outcomes };
}

/** An option's `serves`, as the page holds it: the ids, in the manifest's order. */
export const servesOf = (raw) =>
  Array.isArray(raw) ? raw.filter(text).map((s) => s.trim()) : null;

/** One outcome's state, glyph and word together. */
export const STATE = { open: "☐ open", met: "☑ met" };

/** The top of a decision with a scope: its goal, then each outcome and its state, then `extra`
 *  under the list — on a round's own page, the outcomes he adds (outcomes.mjs). With no scope,
 *  only `extra`, in the same box ("" when there is neither). */
export function scopeHtml(scope, extra = "") {
  if (!scope) return extra ? `<div class="scope">${extra}</div>` : "";
  const goal = scope.goal ? `<p class="goal"><b>Goal:</b> ${e(scope.goal)}</p>` : "";
  const items = scope.outcomes
    .map(
      (o) =>
        `<li data-met="${o.met ? "yes" : "no"}"><span class="ostate">${o.met ? STATE.met : STATE.open}</span> ` +
        `<b>${e(o.id)}</b> ${e(o.text)}</li>`,
    )
    .join("");
  const list = items ? `<ul class="outcomes" aria-label="Outcomes">${items}</ul>` : "";
  return `<div class="scope">${goal}${list}${extra}</div>`;
}

/** An option row's line: "serves O1, O3" ("" when it names none). */
export const servesHtml = (serves) =>
  serves?.length ? `<p class="serves">serves ${e(serves.join(", "))}</p>` : "";

/** What is wrong with a question's scope, one line each; [] when it carries none. */
export function scopeProblems(q, at) {
  if (q?.scope === undefined) return [];
  const raw = q.scope;
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return [`${at}: "scope" is { goal, outcomes: [{ id, text, met }] }`];
  const out = [];
  if (!text(raw.goal)) out.push(`${at} scope: needs "goal" — the one sentence the round serves`);
  const outcomes = Array.isArray(raw.outcomes) ? raw.outcomes : [];
  if (!outcomes.length)
    out.push(`${at} scope: needs "outcomes" — what the goal means, each with an id`);
  const ids = new Set();
  outcomes.forEach((o, i) => {
    if (!(text(o?.id) && text(o?.text)))
      out.push(`${at} scope outcome ${i + 1}: needs "id" and "text"`);
    else if (ids.has(o.id.trim())) out.push(`${at} scope: outcome id ${o.id} is used twice`);
    if (text(o?.id)) ids.add(o.id.trim());
  });
  const design = (q.kind ?? "design") === "design";
  if (design && outcomes.length && outcomes.every((o) => o?.met === true))
    out.push(`${at}: every outcome is met — file the build instead of drawing a round`);
  for (const o of Array.isArray(q.options) ? q.options : [])
    out.push(...servesProblems(o, `${at} option ${o?.key}`, ids, design));
  return out;
}

/** One option's `serves` against the scope's outcome ids. A shape must name at least one; a
 *  problem may name none, but never an id the scope doesn't list. */
function servesProblems(o, where, ids, design) {
  if (o?.serves === undefined)
    return design ? [`${where}: needs "serves" — the outcome ids this shape works toward`] : [];
  const serves = servesOf(o.serves);
  if (!serves?.length) return [`${where}: "serves" lists outcome ids, like ["O1"]`];
  return serves
    .filter((s) => !ids.has(s))
    .map((id) => `${where}: serves ${id}, which isn't one of the scope's outcomes`);
}
