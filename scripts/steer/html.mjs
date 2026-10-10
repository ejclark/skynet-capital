// STEER HTML — the small pieces every section of the page shares (#5056): escaping, plurals,
// Central-time labels, and the two controls: a reaction row and a note. Pure.
import { TZ } from "./time.mjs";

/** The reaction sets, by where they sit. Every value here has a glyph cue in page.css. */
export const VERBS = {
  design: [
    ["build", "Build this"],
    ["more", "More of this"],
    ["not", "Not this"],
  ],
  fork: [
    ["build", "Pick this"],
    ["more", "More on this"],
    ["not", "Not this"],
  ],
  // No options to pick from: the note carries the answer, and this tap says it does.
  forkWhole: [
    ["build", "My note settles it"],
    ["more", "More first"],
    ["not", "Not now"],
  ],
  forkRec: [
    ["build", "Take the recommendation"],
    ["more", "More first"],
    ["not", "Not now"],
  ],
  approve: [
    ["approve", "Approve"],
    ["hold", "Hold"],
  ],
  queue: [
    ["bump", "Bump up"],
    ["veto", "Veto"],
  ],
  reel: [["revisit", "Revisit"]],
};

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const e = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const WHEN = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});
export const DAY = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  weekday: "short",
  month: "short",
  day: "numeric",
});
export const when = (iso) => WHEN.format(new Date(iso));
export const ext = 'target="_blank" rel="noopener"';

export function buttons(pairs, { sec, key, opt }) {
  const b = pairs
    .map(
      ([v, label]) =>
        `<button type="button" class="rb" data-v="${v}" aria-pressed="false">${e(label)}</button>`,
    )
    .join("");
  const o = opt ? ` data-opt="${e(opt)}"` : "";
  return `<div class="react" data-sec="${sec}" data-key="${e(key)}"${o}><span class="btns">${b}</span></div>`;
}

/** A note field: a textarea under a decision, or a one-line input a pressed Veto/Revisit reveals. */
export const note = ({ sec, key, label, rows = 3, reveal = false }) =>
  reveal
    ? `<label class="note reveal" hidden>${e(label)}<input type="text" id="n-${sec}-${e(key)}" data-note data-sec="${sec}" data-key="${e(key)}"></label>`
    : `<label class="note" for="n-${sec}-${e(key)}">${e(label)}<textarea id="n-${sec}-${e(key)}" data-note data-sec="${sec}" data-key="${e(key)}" rows="${rows}" placeholder="I like … · I wish … · What if …"></textarea></label>`;
