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
// REACTIONS): `marks: { "<option>:<phone|desk>:m<unique>": { x, y, at, beforeReveal, inFocus? } }`,
// x and y in % of the frame. The mark's reaction is `pins[<id>]` and its note `pinNotes[<id>]` — the id
// grammar (an `m` before the unique part) keeps them apart from a pin's numbered ids, so a pin list
// never shows a mark and a mark list never shows a pin. A mark closed with neither a reaction nor a
// note is removed (`marks[<id>]: null`). A mark on a frame the page no longer shows is ignored, as a
// pin's is (#5240).
//
// A ROUND'S FOCUS (focus.mjs; Eric, 2026-10-14: feedback "out of scope for the task at hand …
// should be accounted for and be getting addressed in the bigger picture"): a mark on a frame with
// a focus also records `inFocus`. The read-back splits his marks by it, and the next round applies
// only the ones in focus and adds the rest to the scope, word for word — banked, never dropped. A
// record from before `inFocus` is placed by its spot against the focus box, else read as in focus.
//
// ONE PICTURE, TWO WIDTHS (widths.mjs, #5417; Eric, 2026-10-14: marking phone and desktop apart
// "doubles the work to leave feedback"): on a question with `widths`, a mark inside an area belongs
// to the area, not the width — the page draws it on both, and the read-back names the area once,
// with no width and no position (each width places the area differently). A mark outside every
// area stays on the width it was placed on, and its line says "<width> only". Nothing new is
// saved: which area a mark sits in is read from its spot, as it always was.
//
// Everything here is pure: the words, the page's lines, and the read-back's. The page script is
// marks-client.js.
import { areaAt, arealFrame } from "./areas.mjs";
import { focusedFrame, hasFocus, inFocus } from "./focus.mjs";
import { sectionAt } from "./frame-sections.mjs";
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

/** The pictures of one frame a mark's id names: Today's clean and pinned frames, or an option's. */
function framePictures(d, option, frame) {
  const pictures =
    option === "today"
      ? [...(d?.today?.clean ?? []), ...(d?.today?.pictures ?? [])]
      : ((d?.options ?? []).find((o) => o.key === option)?.pictures ?? []);
  return pictures.filter((p) => p.size === frame);
}

/** The named part of the screen a mark landed on (frame-sections.mjs), or null when the frame it
 *  sits on carries no sections or none holds the spot. */
function sectionOf(pictures, x, y) {
  const withSections = pictures.find((p) => p.sections?.length);
  return withSections ? sectionAt(withSections.sections, x, y) : null;
}

/** The area a mark landed in (areas.mjs) — its number, label and whether this round asks about it
 *  — or null when the frame it sits on draws none or none holds the spot. */
function areaOf(pictures, x, y) {
  const a = areaAt(pictures.find((p) => p.areas?.length)?.areas, x, y);
  return a ? { n: a.n, label: a.label, active: a.active } : null;
}

/** On a question with `widths` whose holder shows both widths, how a mark is read: "both" when it
 *  sits in an area the other width also draws (it belongs to the area), "only" when it doesn't (it
 *  stays with its width); null on any other question or holder. */
function widthOf(d, option, frame, area) {
  if (!d?.widths) return null;
  const other = framePictures(d, option, frame === "phone" ? "desk" : "phone");
  if (!other.length) return null;
  return area && other.some((p) => p.areas?.some((a) => a.n === area.n)) ? "both" : "only";
}

/** Whether a mark sits in the round's focus (focus.mjs). On a frame with no focus it always does —
 *  nothing narrowed what he was asked about, even if an older page recorded otherwise; on one with
 *  a focus, as the page recorded it, else (a record from before `inFocus`) by its spot. */
function focusOf(m, pictures) {
  const focus = pictures.find((p) => p.focus)?.focus;
  if (!focus) return true;
  return typeof m.inFocus === "boolean" ? m.inFocus : inFocus(focus, m.x, m.y);
}

/**
 * The marks a record holds on frames this decision shows, each with its reaction and note (null
 * for none), where it sits and whether that is in the round's focus, oldest first. Only a mark he
 * said something on counts — the page removes the rest, and one left behind by a closed tab is no
 * answer.
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
    const pictures = framePictures(d, hit[1], hit[2]);
    const area = areaOf(pictures, m.x, m.y);
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
      section: sectionOf(pictures, m.x, m.y),
      area,
      inFocus: focusOf(m, pictures),
      width: widthOf(d, hit[1], hit[2], area),
    });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}
export const marksSaid = (d, r) => decisionMarks(d, r).length > 0;

/** The frame a mark sits on: its holder alone for a mark on an area both widths draw, else the
 *  holder and the width — "only" when the holder shows the other width too. */
const frameName = (m) => {
  const holder = m.option === "today" ? "Today" : `Option ${m.option}`;
  if (m.width === "both") return holder;
  return `${holder}, ${m.frame === "desk" ? "desktop" : "phone"}${m.width === "only" ? " only" : ""}`;
};
const where = (m) => `${Math.round(m.x)}% across, ${Math.round(m.y)}% down`;
/** An area by number and label, and whether this round asks about it (areas.mjs). */
const areaName = (a) =>
  `on area ${a.n}${a.label ? `, “${a.label}”` : ""}, ${a.active ? "which this round asks about" : "outlined but not asked about this round"}`;
/** Where a mark sits: the area it landed in when the frame draws areas, else the part of the screen
 *  when the frame names its parts, with the position beside it; the position alone otherwise. */
const spot = (m) =>
  m.width === "both"
    ? areaName(m.area)
    : m.area
      ? `${areaName(m.area)} (${where(m)})`
      : m.section
        ? `on “${m.section}” (${where(m)})`
        : where(m);
/** His note in a list item, word for word: a later line is indented, so it stays in the item. */
const inline = (note) => `“${note.split("\n").join("\n  ")}”`;
const BEFORE = "(before Claude's problems were shown)";

/** What one mark says, for a read-back line: `👎 don't like — “…” (before …)`. */
const saidOf = (m) =>
  [
    m.reaction ? `${MARK_GLYPH[m.reaction]} ${MARK_WORDS[m.reaction].toLowerCase()}` : "",
    m.note ? inline(m.note) : "",
  ]
    .filter(Boolean)
    .join(" — ") + (m.before ? ` ${BEFORE}` : "");

/** One read-back line: `- Today, phone · 42% across, 30% down — 👎 don't like — “…” (before …)`. */
export const markLine = (m) => answerLine([m]);

/** Marks as answers, in order: each on its own, except that marks on one area both widths draw
 *  (`width: "both"`) are one answer — the area named once, whichever width each was placed on. */
function answers(list) {
  const out = new Map();
  for (const m of list) {
    const k = m.width === "both" ? `${m.option}:area${m.area.n}` : m.id;
    out.set(k, [...(out.get(k) ?? []), m]);
  }
  return [...out.values()];
}

/** One answer's read-back line: where, then what each of its marks says. */
const answerLine = ([m, ...more]) =>
  `- ${frameName(m)} · ${spot(m)} — ${[m, ...more].map(saidOf).join("; ")}`;
const answerLines = (list) => answers(list).map(answerLine);

/** The read-back's headings for a decision with a focus (focus.mjs): the marks the round answers,
 *  and the ones it banks — out of scope for this round, never dropped. */
export const IN_FOCUS = "In this round's focus:";
export const OUT_OF_FOCUS = "Outside this round's focus — added to the scope for later:";
/** The next round's lead-in to the marks it banks rather than applies. */
export const ADD_TO_SCOPE = "Outside this round's focus — add to the scope:";

/** The "Your marks:" block a decision's issue comment carries ("" when he left none). A decision
 *  with a focus splits it: the marks in it, then the ones outside it, each heading only when it
 *  has a line. */
export function marksBlock(d, r) {
  const all = decisionMarks(d, r);
  if (!all.length) return "";
  if (!hasFocus(d)) return ["Your marks:", ...answerLines(all)].join("\n");
  const group = (head, list) => (list.length ? [head, ...answerLines(list)].join("\n") : "");
  return [
    group(
      IN_FOCUS,
      all.filter((m) => m.inFocus),
    ),
    group(
      OUT_OF_FOCUS,
      all.filter((m) => !m.inFocus),
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** What one mark says, for a next-round clause: what he thinks, his note. */
const wordsOf = (m) =>
  [m.reaction ? MARK_WORDS[m.reaction].toLowerCase() : "", m.note ? `“${m.note}”` : ""]
    .filter(Boolean)
    .join(": ");
/** One answer as a next-round clause: the spot, then what each of its marks says. */
const clause = ([m, ...more]) =>
  [
    `${frameName(m)} ${m.area || m.section ? spot(m) : `at ${spot(m)}`}`,
    ...[m, ...more].map(wordsOf),
  ]
    .filter(Boolean)
    .join(": ");

/** His marks in the round's focus as one next-round clause ("" for none) — every mark, on a
 *  decision with no focus. */
export function markClauses(d, r) {
  const mine = decisionMarks(d, r).filter((m) => m.inFocus);
  return mine.length ? `his marks: ${answers(mine).map(clause).join("; ")}.` : "";
}

/** His marks outside the round's focus as one sentence ("" for none): banked, not applied. */
export function scopeClauses(d, r) {
  const out = decisionMarks(d, r).filter((m) => !m.inFocus);
  return out.length ? `${ADD_TO_SCOPE} ${answers(out).map(clause).join("; ")}.` : "";
}

/** What the next round does with his marks: apply the ones in focus, bank the rest ("" for none). */
export function markInstruction(d, r) {
  const apply = markClauses(d, r);
  return [apply ? `Apply ${apply}` : "", scopeClauses(d, r)].filter(Boolean).join(" ");
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
      return markableShot(size, src, p.alt, {
        key: d.key,
        option: "today",
        focus: p.focus,
        ratio: p.ratio,
        areas: p.areas,
      });
    })
    .join("");
}

/** A frame with no pins on a design round's own page: a box a tap marks, never a link. With a
 *  round's focus (`focus`, and the picture's `ratio`), it opens cropped to it (focus.mjs); with
 *  areas, it draws their outlines and callouts (areas.mjs). */
export function markableShot(size, src, alt, { key, option, focus, ratio, areas }) {
  const frame = `<div class="frame"><img src="${e(src)}" alt="${e(alt)}" loading="lazy"></div>`;
  const f = areas?.length ? arealFrame(frame, areas) : focusedFrame(frame, focus, ratio);
  return (
    `<div class="shot ${size} markable${f.cls ?? ""}" data-key="${e(key)}" data-option="${e(option)}" data-frame="${size}"${f.attrs}>` +
    `${f.inner}</div>`
  );
}
