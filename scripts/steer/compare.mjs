// COMPARE AN OPTION WITH TODAY — three ways on one option's phone picture (#5411; Eric, #5350
// round 3, 2026-10-15, keeping all three shapes it offered: "I like having access to all 3
// capabilities as a tooling option for this process. This is a powerful way for me to iterate from
// different angles on demand"). On a phone, Today and an option sit a scroll apart; this puts
// them in one spot.
//
// OPT-IN: a manifest question carries `"compare": true`. Without it the page renders exactly as
// before — one test screen at a time until the redesign process settles (#5380), so this adds no
// line to docs/process/REDESIGN.md's *Process changes*.
//
// THE MODES, one switch above each option's phone picture — "Compare: ⇄ Flip · ◫ Side by side ·
// ◧ Divider",
// a glyph and a word each (he is red/green colourblind), Flip pressed by default, nothing moving on
// its own (docs/READERS.md: easily distracted):
//   - FLIP: a "□ Today / ◆ Option A" toggle swaps the picture in the same spot. The option's pins
//     and marks belong to its own frame, so they go with it while Today shows.
//   - SIDE BY SIDE (#5430, GitHub image diff's "2-up"): Today and the option at half width each,
//     both whole — scaled, never cropped — each under its shape-and-word label. At desktop width it
//     takes the card's whole width, each picture up to its real phone width; with areas, the
//     outlines and numbers stay and the callout words go (a half-width picture can't spare their
//     gutter: it left each picture 0px wide, 2026-10-15). A tap on either
//     opens that picture full size in Flip, Side by side one tap back. It replaced a sideways strip
//     that showed one picture at a time (Eric: it "entirely destroy the value potential of the
//     view"); a viewer whose kept mode is that strip's `swipe` opens here. Half-width text is small
//     at phone width — that is what the tap is for, so nothing else shrinks to make up for it. The
//     tap lands on a button laid over each half, so in this mode it never places a mark: marks and
//     pins still show on the option's half, and take a tap once it is open in Flip.
//   - DIVIDER: Today left of a line, the option right of it, dragged by a round grip that rides on
//     the line and stays in view as the picture scrolls (Eric, 2026-10-15: a handle under a tall
//     picture was "often out of view of the actual change"); the "◀ Drag ▶" track under the
//     picture stays for the keyboard. Offered only when both pictures share their pixel size, since a
//     wipe across two layouts lines nothing up; otherwise the button reads "Divider: layouts
//     differ", disabled, never hidden.
// The mode is remembered per viewer (localStorage, compare-client.js) and set on every compared
// option at once, so his last angle opens next time.
//
// NOT WITH `focus`: a crop reshapes the option's frame, so Today would no longer sit in the same
// spot. design.mjs and the manifest lint refuse the pair. WITH `areas` it composes (#5163, the test
// screen: its handover asked for both on one question): Today's picture is drawn in the same
// numbered outlines and margins as the option's, so the two still line up in every mode.
//
// Pure: the words, the manifest check, and the HTML. The page script is compare-client.js.
import { arealFrame } from "./areas.mjs";
import { e } from "./html.mjs";

export const COMPARE_MODES = ["flip", "side", "divider"];
/** The page's words. Each glyph rides beside its word, never alone. */
export const COMPARE_WORDS = {
  lead: "Compare:",
  modes: { flip: "Flip", side: "Side by side", divider: "Divider" },
  glyphs: { flip: "⇄", side: "◫", divider: "◧" },
  differ: "Divider: layouts differ",
  today: "□ Today",
  option: "◆",
  drag: "◀ Drag ▶",
  grip: "◀▶",
  hint: "Tap a picture to open it full size",
  open: (name) => `Open ${name} full size`,
};
/** What the page script needs: the modes, where a viewer's last one is kept, and what a kept mode
 *  that no longer exists opens as (`swipe`, the strip Side by side replaced, #5430). */
export const COMPARE_CLIENT = {
  modes: COMPARE_MODES,
  store: "steer-compare-mode",
  was: { swipe: "side" },
};

/** What is wrong with a question's `compare`; [] when it is fine or absent. */
export function compareProblems(q, where) {
  if (q?.compare === undefined || q.compare === false) return [];
  if (q.compare !== true) return [`${where}: "compare" is true or false`];
  const out = [];
  if (!q.today?.phone) out.push(`${where}: "compare" needs Today's phone picture to compare with`);
  if (q.focus !== undefined)
    out.push(`${where}: compare with today, or narrow the round by "focus" — not both`);
  return out;
}

/** Today's phone picture to compare with: its clean frame (before pin.mjs drew on it) when it has
 *  one, so no badge of Claude's sits in the comparison; else its pinned frame. */
export function todayPhone(d) {
  const at = (list) => (list ?? []).find((p) => p.size === "phone");
  return at(d?.today?.clean) ?? at(d?.today?.pictures) ?? null;
}

/** Do two pictures share their pixel size (`px`, design.mjs)? Unknown reads as no: the divider
 *  is only offered when it can be shown to line up. */
export const sameSize = (a, b) => Boolean(a?.px && b?.px && a.px.w === b.px.w && a.px.h === b.px.h);

const button = (attrs, label, pressed, disabled = false) =>
  `<button type="button" class="cmp-b" ${attrs} aria-pressed="${pressed}"${disabled ? " disabled" : ""}>${label}</button>`;

function modesHtml(name, divider) {
  const W = COMPARE_WORDS;
  const b = COMPARE_MODES.map((m) => {
    const word = m === "divider" && !divider ? W.differ : W.modes[m];
    const label = `<span aria-hidden="true">${W.glyphs[m]}</span> ${e(word)}`;
    return button(`data-mode="${m}"`, label, m === "flip", m === "divider" && !divider);
  }).join("");
  return `<div class="cmp-modes" role="group" aria-label="${e(`Compare ${name} with Today`)}"><span class="cmp-lead">${W.lead}</span>${b}</div>`;
}

/** Today's side of the comparison: the bare picture, or — when the option's frame carries areas —
 *  the picture inside the same outlines and margins (Today's own areas, resolved on its frame by
 *  design.mjs), so both sides keep one geometry and the divider still lines up. */
function todayCell(d, pic, img) {
  if (!pic.areas?.length) return `<div class="cmp-pic">${img}</div>`;
  const areas = (d.today?.pictures ?? []).find((p) => p.size === "phone")?.areas ?? [];
  if (!areas.length) return `<div class="cmp-pic">${img}</div>`;
  const f = arealFrame(`<div class="frame">${img}</div>`, areas);
  return `<div class="shot phone${f.cls}"${f.attrs}>${f.inner}</div>`;
}

/**
 * One option's phone picture, compared with Today's. `shot` is the option's frame as render.mjs
 * draws it (pins, marks and all); `img(picture)` returns a picture's published path. With no
 * Today picture to show, the frame is returned as it was.
 */
export function compareHtml({ d, o, pic, shot, img }) {
  const today = todayPhone(d);
  const src = today && img(today);
  if (!src) return shot;
  const W = COMPARE_WORDS;
  const name = `Option ${o.key}`;
  const mine = `${W.option} ${name}`;
  const divider = sameSize(today, pic);
  const todayImg = `<img src="${e(src)}" alt="Today at phone width" loading="lazy">`;
  const cell = (which, tag, label, inner) =>
    `<figure class="cmp-cell" data-cell="${which}"><figcaption class="cmp-tag">${e(tag)}</figcaption>${inner}` +
    `<button type="button" class="cmp-open" data-open="${which}" aria-label="${e(W.open(label))}" hidden></button></figure>`;
  return (
    `<div class="cmp" data-mode="flip" data-side="option"${divider ? "" : " data-nodivider"} style="--split:50">` +
    modesHtml(name, divider) +
    `<div class="cmp-flip" role="group" aria-label="Which picture shows">` +
    button('data-side="today"', e(W.today), false) +
    button('data-side="option"', e(mine), true) +
    `</div><div class="cmp-stage">` +
    cell("today", W.today, "Today", todayCell(d, pic, todayImg)) +
    cell("option", mine, name, shot) +
    `<div class="cmp-line" aria-hidden="true"><span class="cmp-grip">${W.grip}</span></div></div>` +
    `<p class="cmp-hint" hidden>${e(W.hint)}</p>` +
    `<label class="cmp-track" hidden><span class="cmp-end">${e(W.today)}</span>` +
    `<span class="cmp-knob" aria-hidden="true">${W.drag}</span><span class="cmp-end">${e(mine)}</span>` +
    `<input type="range" class="cmp-split" min="0" max="100" value="50" data-name="${e(name)}" ` +
    `aria-label="${e(`Divider: Today on the left, ${name} on the right`)}"></label>` +
    `</div>`
  );
}
