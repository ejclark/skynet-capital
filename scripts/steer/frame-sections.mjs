// FRAME SECTIONS — where each named part of a screen sits on its frame, so the read-back can say
// "a 👎 on the order sentence" rather than "at 42% across, 30% down".
//
// WHY: a mark (marks.mjs) is a spot Eric chose on a frame, saved as x/y in %. A position is what the
// page can store, but not what a session — or he, reading the issue — can act on without opening the
// frame and measuring. The shoot script (scripts/redesign/frames.mjs) already has the live page in
// hand when it takes the frame, so it records the boxes of the screen's named parts beside the
// picture (`<id>-<phone|desk>.sections.json`), and a manifest names that file on the holder
// (`sections` for the phone frame, `sectionsDesk` for the desktop one), the way it names pins.
//
// A SECTION is `{ label, x, y, w, h }`, all four numbers in % of the frame. Containers (a section, a
// card, a list row, a form, anything with an aria-label) and small controls (a button, a tab, a
// table heading) both count; a mark resolves to the SMALLEST box that holds it, so a tap on a button
// names the button and a tap on a card's empty corner names the card.
//
// Pure: the shoot script gathers raw boxes in the browser and hands them here.

const pct = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;
/** A label is a few words: what the part says it is, not its whole text. */
export const MAX_SECTION_LABEL = 48;

/**
 * Raw boxes from the page (CSS px, page coordinates) → sections in % of a frame `width` × `height`
 * px from the page's top-left. Drops what has no label, no size, or sits wholly off the frame, clips
 * the rest to it, and keeps one copy of a label drawn over the same box.
 * @param {{ text?: string, x: number, y: number, w: number, h: number }[]} raw
 * @param {{ width: number, height: number }} frame
 */
export function sectionsFromBoxes(raw, { width, height }) {
  const out = [];
  const seen = new Set();
  for (const b of raw ?? []) {
    const label = String(b?.text ?? "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_SECTION_LABEL)
      .trim();
    const x0 = Math.max(0, b?.x ?? 0);
    const y0 = Math.max(0, b?.y ?? 0);
    const x1 = Math.min(width, (b?.x ?? 0) + (b?.w ?? 0));
    const y1 = Math.min(height, (b?.y ?? 0) + (b?.h ?? 0));
    if (!label || x1 <= x0 || y1 <= y0) continue;
    const s = {
      label,
      x: round((x0 / width) * 100),
      y: round((y0 / height) * 100),
      w: round(((x1 - x0) / width) * 100),
      h: round(((y1 - y0) / height) * 100),
    };
    const key = `${s.label}|${s.x}|${s.y}|${s.w}|${s.h}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

const round = (n) => Math.round(n * 10) / 10;

/** Is this a section the read-back can use: a label and a box inside the frame? */
const usable = (s) =>
  typeof s?.label === "string" && s.label.trim() && [s.x, s.y, s.w, s.h].every(pct) && s.w > 0;

/**
 * The label of the smallest section holding the spot (x, y in % of the frame), or null when none
 * does — the read-back then gives the position alone, never a guess.
 * @param {{ label: string, x: number, y: number, w: number, h: number }[] | undefined} sections
 */
export function sectionAt(sections, x, y) {
  let best = null;
  for (const s of sections ?? []) {
    if (!usable(s)) continue;
    const inside = x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h;
    if (inside && (!best || s.w * s.h < best.w * best.h)) best = s;
  }
  return best ? best.label : null;
}
