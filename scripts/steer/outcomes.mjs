// OUTCOMES HE ADDS — on a round's own page, the scope's checklist takes his outcomes too (Eric,
// 2026-10-14: "the redesign process must offer 'integrate this outcome' capabilities too. The way
// I see that is that the current design may not have that, and redesign/rearchitecture may be
// necessary to achieve said outcomes").
//
// WHY A ROUND CARRIES THEM: the scope (scope.mjs) lists the outcomes Claude drew the round to meet.
// An outcome he wants that isn't there is the most important thing he can say about the round — it
// may be one today's design can reach, or one that needs something the app doesn't have yet (a
// missing entity, route or API: docs/IA.md §7 and §10). This page only collects it, word for word;
// the session classifies each and files the second kind as its own plan issue.
//
// THE PAGE: under the scope's list (or, on a question with no scope, on its own — headed "Outcomes
// you want:" once there is one), "＋ Add an outcome" opens a one-line field with Save and Cancel.
// Each saved one reads "＋ <his words> (added by you)" with a × to remove it. A locked page (no
// store, view only) disables all of it. The page script is outcomes-client.js.
//
// THE RECORD, merged one key at a time exactly as `marks` is (page-client.js header):
// `outcomesAdded: { "o<base36 time><random>": { text, at } }`; a removed one is written null. Up
// to MAX_OUTCOME characters, cleaned as a pin's note is (pins.mjs `cleanText`). An added outcome
// counts as an answer (model.mjs `isAnswered`).
//
// THE READ-BACK (readback.mjs): an "Outcomes he added:" block in the decision's issue comment, each
// quoted word for word, and `outcomesAdded: [{ issue, key, text, at }]` in the plan JSON.
//
// Pure: the words, the control's HTML, and the read-back's lines.
import { e } from "./html.mjs";
import { cleanText } from "./pins.mjs";

/** An outcome is one line: what the screen should let him do or see. */
export const MAX_OUTCOME = 200;
/** An added outcome's id: `o`, then the time in base36 and a random part. */
export const OUTCOME_ID = /^o[a-z0-9]+$/;
/** The page's words. */
export const OUTCOME_WORDS = {
  add: "＋ Add an outcome",
  head: "Outcomes you want:",
  by: "(added by you)",
  field: "An outcome you want",
  placeholder: "What should this screen let you do or see?",
  save: "Save",
  cancel: "Cancel",
  remove: "Remove",
};
/** What the page script needs: the words, and how long an outcome may be. */
export const OUTCOME_CLIENT = { ...OUTCOME_WORDS, max: MAX_OUTCOME };
/** The read-back's heading over his added outcomes. */
export const OUTCOMES_HEAD = "Outcomes he added:";
/** The follow-up an added outcome raises for the session (readback.mjs `followUps`): today's
 *  design reaches it, or it needs something new and becomes its own plan issue. */
export const CLASSIFY =
  "Outcomes he added: say for each whether today's design can reach it or it needs something new " +
  "(a missing entity, route or API — docs/IA.md §7, §10); file each of the second kind as a plan issue";

/** The control under a decision's scope: the list he fills, the add button, and its field. The
 *  "Outcomes you want:" heading shows only on a question with no scope, once he has added one. */
export function outcomesControl(d) {
  const k = e(d.key);
  const w = OUTCOME_WORDS;
  return (
    `<div class="addout" data-key="${k}"${d.scope ? "" : " data-noscope"}>` +
    `<p class="ohead" hidden><b>${e(w.head)}</b></p>` +
    `<ul class="added" aria-label="Outcomes you added"></ul>` +
    `<button type="button" class="oadd" aria-expanded="false" aria-controls="oform-${k}">${e(w.add)}</button>` +
    `<div class="oform" id="oform-${k}" hidden>` +
    `<input class="otext" type="text" maxlength="${MAX_OUTCOME}" aria-label="${e(w.field)}" placeholder="${e(w.placeholder)}">` +
    `<button type="button" class="osave">${e(w.save)}</button>` +
    `<button type="button" class="ocancel ghost">${e(w.cancel)}</button></div></div>`
  );
}

const mapOf = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

/** The outcomes a record holds, oldest first, each `{ id, text, at }` — his words cleaned as a
 *  note is; a removed (null), blank or malformed one is none. */
export function addedOutcomes(r) {
  const out = [];
  for (const [id, v] of Object.entries(mapOf(r?.outcomesAdded))) {
    const text = OUTCOME_ID.test(id) && v ? cleanText(v.text, MAX_OUTCOME) : null;
    if (!text) continue;
    out.push({ id, text, at: typeof v.at === "string" ? v.at : "" });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}

/** Did he add any outcome on this decision? */
export const outcomesSaid = (r) => addedOutcomes(r).length > 0;

/** The "Outcomes he added:" block of a decision's issue comment ("" for none): word for word, a
 *  later line indented so it stays in its item. */
export function outcomesBlock(r) {
  const all = addedOutcomes(r);
  if (!all.length) return "";
  return [OUTCOMES_HEAD, ...all.map((o) => `- “${o.text.split("\n").join("\n  ")}”`)].join("\n");
}

/** His added outcomes as the plan JSON carries them, for the session to classify. */
export const outcomesOf = (d, r) =>
  addedOutcomes(r).map(({ text, at }) => ({ issue: d.issue, key: d.key, text, at }));
