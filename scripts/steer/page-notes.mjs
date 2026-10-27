// NOTES ABOUT THE PAGE ITSELF — feedback on the process, left at the moment of friction (Eric,
// 2026-10-14: "if i have an issue, I have the ability to organically provide feedback inline").
//
// A round page's fixed bar carries "✎ Note about this page". Pressed, the next tap anywhere on the
// page opens a small note field at that spot instead of doing what the tap would have done; Save
// writes the note to the round's own document `tp/<round>` as one key of `pageNotes`:
//   pageNotes: { <id>: { near, x, y, note, at } }
// `near` is a short plain description of what he tapped (the nearest heading, a button's words, a
// pin's name, "the Done bar"), x and y are where, in % of the whole page's width and height. The
// page writes it with a MERGE (`update`), never a replace: the session writes its read-back fields
// on the same document (page-client.js header, DONE TELLS CLAUDE).
//
// These are notes on the PROCESS, not on the screen being redesigned, so the read-back never puts
// them on the screen's issue. It hands them back as a "Notes about the page:" block and as
// `processLines` — one `{ what, where }` per note, the arguments of
// `node scripts/redesign/commons.mjs add --kind process --what … --where …`, the door every
// process line already goes through (scripts/redesign/commons.mjs header, PROCESS LINES).
//
// Pure: the bar's words, the limits, and the read-back's lines. The page script is
// page-notes-client.js.
import { cleanText, MAX_PIN_NOTE } from "./pins.mjs";

export const PAGE_NOTE_LABEL = "✎ Note about this page";
/** The bar's words while the next tap is waiting to be placed. */
export const PAGE_NOTE_ARMED = "✎ Tap the spot your note is about";
/** How long `near` may be: a handful of words, enough to find the spot again. */
export const MAX_NEAR = 60;
/** A note about the page takes the pin notes' limit: a sentence or two, not a write-up. */
export const PAGE_NOTE_MAX = MAX_PIN_NOTE;
/** What the page script needs: its words and its limits. */
export const PAGE_NOTE_CLIENT = {
  label: PAGE_NOTE_LABEL,
  armed: PAGE_NOTE_ARMED,
  noteMax: PAGE_NOTE_MAX,
  nearMax: MAX_NEAR,
};

const mapOf = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const pct = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** The notes a round's document holds, oldest first; a cleared or empty one is none. Old rounds
 *  never had the field, and read as none. */
export function pageNotesOf(meta) {
  const out = [];
  for (const [id, n] of Object.entries(mapOf(meta?.pageNotes))) {
    const note = cleanText(n?.note, PAGE_NOTE_MAX);
    if (!note) continue;
    out.push({
      id,
      note,
      near: cleanText(n.near, MAX_NEAR) ?? "somewhere on the page",
      x: pct(n.x),
      y: pct(n.y),
      at: typeof n.at === "string" ? n.at : "",
    });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}

/** His note in a list item, word for word: a later line is indented, so it stays in the item. */
const inline = (note) => `“${note.split("\n").join("\n  ")}”`;

/** "Notes about the page:" with each note quoted under where he left it; "" for none. */
export function pageNotesBlock(meta) {
  const all = pageNotesOf(meta);
  if (!all.length) return "";
  return ["Notes about the page:", ...all.map((n) => `- Near ${n.near}: ${inline(n.note)}`)].join(
    "\n",
  );
}

/** One process line per note, ready for `commons.mjs add --kind process --what … --where …`. */
export const processLines = (meta) =>
  pageNotesOf(meta).map((n) => ({ what: n.note, where: n.near }));
