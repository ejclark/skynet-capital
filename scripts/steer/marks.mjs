// MARKS ON A ROUND PAGE — Eric taps any spot on a frame and says what he thinks of it, before
// Claude says anything (Eric, 2026-10-14, on round 0: "doesn't this create bias through the
// process out of the gate?").
//
// Pins (pins.mjs) are spots CLAUDE chose. A mark is a spot HE chose: a tap anywhere on a frame on a
// design round's own page, away from a pin, drops a small dot there and opens the same popover a
// pin opens (pins-client.js) — three choices, 👍 Like · 👎 Don't like · ✏︎ Would change, and
// "✎ Add a note". Glyph and word together, never colour: he is red/green colourblind. The pencil is
// U+270F with U+FE0E, so it draws as a text glyph, the same convention as the pins' ☯︎.
//
// THE OPENING STAGE (`"opening": true` on a problems question): Today's frames show clean — no
// problem pins — and he marks them first; Claude's problems stay folded away until he presses
// "Show what Claude found". The press stamps `revealAt` on the decision's record, and every mark
// records whether it came before that press, so the read-back can say which of his marks were his
// own eye and which answered Claude's list.
//
// THE RECORD, merged one key at a time exactly as `pins` is (page-client.js header, PIN
// REACTIONS): `marks: { "<option>:<phone|desk>:m<unique>": { x, y, at, beforeReveal } }`, x and y
// in % of the frame. The mark's reaction is `pins[<id>]` and its note `pinNotes[<id>]` — the id
// grammar (an `m` before the unique part) keeps them apart from a pin's numbered ids, so a pin list
// never shows a mark and a mark list never shows a pin. A mark closed with neither a reaction nor a
// note is removed (`marks[<id>]: null`). A mark on a frame the page no longer shows is ignored, as a
// pin's is (#5240).
//
// Everything here is pure: the words, the page's lines, and the read-back's. The page script is
// marks-client.js.
import { e } from "./html.mjs";
import { cleanText, PIN_REACTIONS } from "./pins.mjs";

export const PENCIL = "✏︎";
export const MARK_GLYPH = { up: "👍", down: "👎", mixed: PENCIL };
/** The popover's words on a mark: what he thinks of a spot he chose. */
export const MARK_WORDS = { up: "Like", down: "Don't like", mixed: "Would change" };
/** A mark's id: the frame it sits on, then `m` and a unique part (time base36 + random). */
export const MARK_ID = /^(.+):(phone|desk):m[a-z0-9]+$/;
/** The round page's line on marks: every frame on a design round's own page takes them. */
export const MARK_INTRO = `Tap any spot on a picture to mark it ${MARK_GLYPH.up} Like, ${MARK_GLYPH.down} Don't like or ${PENCIL} Would change.`;
/** The opening stage's line, over Today's clean frames. */
export const OPENING_LINE =
  "First, mark what you like, don't like or would change. Then show what Claude found.";
export const REVEAL_SHOW = "Show what Claude found";
export const REVEAL_HIDE = "Hide what Claude found";
/** What the page script needs: a mark's popover words, and the reveal button's two labels. */
export const MARK_CLIENT = {
  glyph: MARK_GLYPH,
  words: MARK_WORDS,
  reveal: { show: REVEAL_SHOW, hide: REVEAL_HIDE },
};

/** Does this question open on clean frames, with Claude's problems folded away? */
export const isOpening = (d) => Boolean(d?.problems && d?.opening);

const mapOf = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const pct = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;

/** The frames a decision shows, as `<option>:<frame>` — Today's as "today". */
function shownFrames(d) {
  const holders = [
    ["today", [...(d?.today?.pictures ?? []), ...(d?.today?.clean ?? [])]],
    ...(d?.options ?? []).map((o) => [o.key, o.pictures ?? []]),
  ];
  return new Set(holders.flatMap(([o, pics]) => pics.map((p) => `${o}:${p.size}`)));
}

/**
 * The marks a record holds on frames this decision shows, each with its reaction and note (null
 * for none), oldest first. Only a mark he said something on counts — the page removes the rest,
 * and one left behind by a closed tab is no answer.
 */
export function decisionMarks(d, r) {
  const frames = shownFrames(d);
  const reactions = mapOf(r?.pins);
  const out = [];
  for (const [id, m] of Object.entries(mapOf(r?.marks))) {
    const hit = MARK_ID.exec(id);
    if (!(hit && m && pct(m.x) && pct(m.y) && frames.has(`${hit[1]}:${hit[2]}`))) continue;
    const reaction = PIN_REACTIONS.includes(reactions[id]) ? reactions[id] : null;
    const note = cleanText(mapOf(r?.pinNotes)[id]);
    if (!(reaction || note)) continue;
    const at = typeof m.at === "string" ? m.at : "";
    out.push({
      id,
      option: hit[1],
      frame: hit[2],
      x: m.x,
      y: m.y,
      at,
      reaction,
      note,
      before: m.beforeReveal === true,
    });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}
export const marksSaid = (d, r) => decisionMarks(d, r).length > 0;

const frameName = (m) =>
  `${m.option === "today" ? "Today" : `Option ${m.option}`}, ${m.frame === "desk" ? "desktop" : "phone"}`;
const spot = (m) => `${Math.round(m.x)}% across, ${Math.round(m.y)}% down`;
/** His note in a list item, word for word: a later line is indented, so it stays in the item. */
const inline = (note) => `“${note.split("\n").join("\n  ")}”`;
const BEFORE = "(before Claude's problems were shown)";

/** One read-back line: `- Today, phone · 42% across, 30% down — 👎 don't like — “…” (before …)`. */
export function markLine(m) {
  const said = [
    m.reaction ? `${MARK_GLYPH[m.reaction]} ${MARK_WORDS[m.reaction].toLowerCase()}` : "",
    m.note ? inline(m.note) : "",
  ].filter(Boolean);
  return `- ${frameName(m)} · ${spot(m)} — ${said.join(" — ")}${m.before ? ` ${BEFORE}` : ""}`;
}

/** The "Your marks:" block a decision's issue comment carries ("" when he left none). */
export function marksBlock(d, r) {
  const all = decisionMarks(d, r);
  return all.length ? ["Your marks:", ...all.map(markLine)].join("\n") : "";
}

/** His marks as one next-round clause ("" for none): each spot, what he thinks, his note. */
export function markClauses(d, r) {
  const all = decisionMarks(d, r);
  if (!all.length) return "";
  const each = all.map((m) =>
    [
      `${frameName(m)} at ${spot(m)}`,
      m.reaction ? MARK_WORDS[m.reaction].toLowerCase() : "",
      m.note ? `“${m.note}”` : "",
    ]
      .filter(Boolean)
      .join(": "),
  );
  return `his marks: ${each.join("; ")}.`;
}

/**
 * Whether Claude's problems were shown, and when — an opening question's line ("" otherwise). A
 * stamp that isn't a time reads as never shown: the read-back never claims a reveal it can't date.
 */
export function revealLine(d, r, when = (iso) => iso) {
  if (!isOpening(d)) return "";
  const at =
    typeof r?.revealAt === "string" && !Number.isNaN(Date.parse(r.revealAt)) ? r.revealAt : null;
  const marks = decisionMarks(d, r);
  const before = marks.filter((m) => m.before).length;
  if (!at)
    return `- Claude's problems: never shown — ${marks.length ? "his marks are from the clean screen alone" : "he left no mark"}`;
  return `- Claude's problems: shown ${when(at)}, after ${before} of his ${marks.length} mark${marks.length === 1 ? "" : "s"}`;
}

/** The stage-1 frames of an opening question: Today's clean frames (`today.clean`, shot before
 *  pin.mjs drew its badges), else its pictures with no pin buttons — each a markable box.
 *  `img(picture)` returns its published path, or null for none. */
export function cleanShots(d, img) {
  const clean = d.today?.clean?.length ? d.today.clean : (d.today?.pictures ?? []);
  return clean
    .map((p) => {
      const src = img(p);
      if (!src) return "";
      const size = p.size === "phone" ? "phone" : "desk";
      return markableShot(size, src, p.alt, { key: d.key, option: "today" });
    })
    .join("");
}

/** A frame with no pins on a design round's own page: a box a tap marks, never a link. */
export function markableShot(size, src, alt, { key, option }) {
  return (
    `<div class="shot ${size} markable" data-key="${e(key)}" data-option="${e(option)}" data-frame="${size}">` +
    `<div class="frame"><img src="${e(src)}" alt="${e(alt)}" loading="lazy"></div></div>`
  );
}
