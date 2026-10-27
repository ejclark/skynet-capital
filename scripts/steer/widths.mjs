// ONE PICTURE, TWO WIDTHS — an option's phone and desktop pictures share one slot with a
// Phone · Desktop switch, so each part of the screen is answered once (#5417). Eric picked A on
// #5350 round 4 (2026-10-15), "One picture, switch width in place", with More of this on B, "Phone
// only, desktop when it differs"; the note behind it (2026-10-14): between mobile and desktop
// "often times template/structures didn't fundamentally change thus doubles the work to leave
// feedback".
//
// OPT-IN: a manifest question carries `"widths": true`. Without it the page renders exactly as
// before — one test screen at a time until the redesign process settles (#5380), so this adds no
// line to docs/process/REDESIGN.md's *Process changes*.
//
// THE SWITCH, above a holder's picture (Today's or an option's) when it has both widths:
// "▯ Phone · ▭ Desktop", a shape and a word each (he is red/green colourblind), Phone pressed
// first, in the compare switch's own button style (compare.mjs, `.cmp-b`: the pressed one a heavy
// border and a ✓). B's idea rides as a hint, never a gate: when the holder carries
// `"deskSame": true` — the session's critic found the desktop layout only widens the phone one —
// the Desktop button reads "Desktop · same layout", still one tap away, never hidden.
//
// MARKS (marks.mjs): a mark inside an area (areas.mjs) belongs to the area, so the page draws it on
// both widths (marks-client.js) and the read-back names it once; a mark outside every area stays
// with its width. The record is unchanged — a mark is still a spot on the frame it was placed on.
//
// Pure: the words, the manifest check, and the HTML. The page script is widths-client.js.
import { e } from "./html.mjs";

export const WIDTHS = ["phone", "desk"];
/** The switch's words. Each glyph rides beside its word, never alone. */
export const WIDTH_WORDS = {
  phone: "Phone",
  desk: "Desktop",
  same: "Desktop · same layout",
  glyphs: { phone: "▯", desk: "▭" },
};

const flag = (v) => v === undefined || typeof v === "boolean";

/** What is wrong with a question's `widths` and its holders' `deskSame`; [] when fine or absent. */
export function widthsProblems(q, where) {
  const out = [];
  if (!flag(q?.widths)) out.push(`${where}: "widths" is true or false`);
  const holders = [["today", q?.today], ...(q?.options ?? []).map((o) => [`option ${o?.key}`, o])];
  for (const [name, h] of holders) {
    if (h?.deskSame === undefined) continue;
    if (!flag(h.deskSame)) out.push(`${where} ${name}: "deskSame" is true or false`);
    else if (q.widths !== true)
      out.push(`${where} ${name}: "deskSame" labels the width switch — set "widths": true`);
  }
  return out;
}

/** Does a holder show both widths, so its pictures can share one slot? */
export const bothWidths = (pictures) =>
  WIDTHS.every((w) => (pictures ?? []).some((p) => p.size === w));

/**
 * One holder's pictures in one slot: `phone` and `desk` are each width's frames as render.mjs
 * draws them (pins, marks, a compared phone frame and all), `name` the holder ("Option A",
 * "Today"), `same` whether the desktop layout only widens the phone one.
 */
export function widthsHtml({ name, phone, desk, same = false }) {
  const W = WIDTH_WORDS;
  const button = (w, word) =>
    `<button type="button" class="cmp-b" data-width="${w}" aria-pressed="${w === "phone"}">` +
    `<span aria-hidden="true">${W.glyphs[w]}</span> ${e(word)}</button>`;
  return (
    `<div class="wsw" data-width="phone"${same ? " data-same" : ""}>` +
    `<div class="wsw-b" role="group" aria-label="${e(`${name}: which width shows`)}">` +
    button("phone", W.phone) +
    button("desk", same ? W.same : W.desk) +
    `</div><div class="wsw-pic" data-w="phone">${phone}</div>` +
    `<div class="wsw-pic" data-w="desk">${desk}</div></div>`
  );
}
