// A NOTE UNDER EACH OPTION — a round page's question gives every option its own note box, right
// under its Build / More / Not buttons (#5429). Eric, 2026-10-15, after the R&D Playbooks redesign
// (#5163): "I dislike how we have to scroll down so far to leave comments on each option, recall
// which option we were on and then scroll back up to find our position. It's a significant
// cognitive load and context breaker" — the same ask as #5163 round 0 (2026-10-11): "more
// granular/targeted - per comment level". Inline beside the option, never a drawer floating over
// the frames (O2 on #5350).
//
// OPT-IN: a manifest question carries `"notesPer": "option"`. Without it the page renders exactly
// as before — one test screen at a time until the redesign process settles (#5380), so this adds no
// line to docs/process/REDESIGN.md's *Process changes*.
//
// CALM BY DEFAULT: each box is folded to one line, "✎ Note on this option", until he taps it; one
// that holds a note opens on load, so a word he left is never hidden. The question's own note stays
// at the end, relabelled as a note on the whole question.
//
// THE RECORD: `optionNotes: { <option key>: "<text>" }` on the decision's record, merged one key at
// a time (page-client.js, the pins' path), so a phone and a laptop each writing on a different
// option keep both. An emptied note is null. A note counts as an answer (model.mjs `isAnswered`),
// and the read-back quotes each one word for word on its option's line under "Per option:", in the
// shape scripts/redesign/retro.mjs already reads a pin's note in.
//
// Pure: the words, the manifest check, the HTML and the read-back lines. The page script's half
// is in page-client.js (it saves like a pin note).
import { e } from "./html.mjs";

/** The one value `notesPer` takes. */
export const NOTES_PER = "option";
/** The folded box's one line; the glyph rides beside the words, never alone. */
export const OPTION_NOTE_LABEL = "✎ Note on this option";
/** The question's own note, on a question whose options each carry one. */
export const QUESTION_NOTE_LABEL = "A note on the whole question (optional)";

/** What is wrong with a question's `notesPer`; [] when fine or absent. */
export function notesPerProblems(q, where) {
  const v = q?.notesPer;
  return v === undefined || v === NOTES_PER
    ? []
    : [`${where}: "notesPer" is "${NOTES_PER}" (a note box under each option) or left out`];
}

/** Does this question give each option its own note? */
export const perOption = (d) => d?.notesPer === NOTES_PER;

/** One option's note box: folded under its buttons until tapped. */
export function optionNoteHtml(d, o) {
  const id = `on-${e(d.key)}-${e(o.key)}`;
  return (
    `<details class="onote"><summary>${e(OPTION_NOTE_LABEL)}</summary>` +
    `<textarea class="onote-t" id="${id}" aria-label="Your note on option ${e(o.key)}, in your words — quoted on the issue word for word" data-onote data-key="${e(d.key)}" data-opt="${e(o.key)}" rows="3" placeholder="I like … · I wish … · What if …"></textarea></details>`
  );
}

/** His notes on the options this decision shows, in the options' order: `[key, text]`. A note on
 *  an option the page no longer shows is not an answer. */
export function optionNotesSaid(d, r) {
  const notes = r?.optionNotes;
  if (!(notes && typeof notes === "object")) return [];
  return (d?.options ?? [])
    .map((o) => [o.key, notes[o.key]])
    .filter(([, t]) => typeof t === "string" && t.trim());
}

/** The tap he left on an option, in the page's own words ("more of this"), or "". */
function tapOn(d, r, k) {
  const words = d.problems
    ? { build: "fix this first", more: "look closer", not: "not a problem" }
    : { build: "build this", more: "more of this", not: "not this" };
  if (r.pick === k) return words.build;
  return words[r.react?.[k]] ?? "";
}

/** His note in a list item, word for word: a later line is indented, so it stays in the item. */
const inline = (note) => `“${note.split("\n").join("\n  ")}”`;

/** The "Per option" list a decision's issue comment carries ("" when he wrote on none):
 *  `- Option B (The order sentence first) — more of this — “<his note>”`. */
export function perOptionBlock(d, r) {
  const said = optionNotesSaid(d, r);
  if (!said.length) return "";
  const name = (k) => d.options.find((o) => o.key === k)?.name ?? k;
  const line = ([k, t]) =>
    `- Option ${k} (${name(k)}) — ${[tapOn(d, r, k), inline(t)].filter(Boolean).join(" — ")}`;
  return ["Per option:", ...said.map(line)].join("\n");
}

/** The next round's clause for his option notes, or "" for none. */
export function optionClauses(d, r) {
  const said = optionNotesSaid(d, r);
  return said.length
    ? `Per option: ${said.map(([k, t]) => `option ${k}: apply his note “${t}”.`).join(" ")}`
    : "";
}
