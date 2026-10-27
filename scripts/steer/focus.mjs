// A ROUND'S FOCUS — the one part of the screen a round is about, shown first and alone (Eric,
// 2026-10-14: "as problem sets start to narrow and/or focus on key sections.. I liked the outline
// of the sections under the microscope to narrow focus..without that, it's easy to spend time
// giving feedback on things out of scope for the task at hand (that should be accounted for and be
// getting addressed in the bigger picture)" — and "I feel I have A.D.H.D. … [I] prefer simple and
// elegant design that is free of distraction").
//
// THE MANIFEST: a question may carry `focus`, either
//   - a section's label, `"focus": "Enter rule"`, resolved on each picture against the sections
//     its holder names (`sections` / `sectionsDesk`, frame-sections.mjs): the SMALLEST section
//     whose label matches exactly, case aside — the first of equals; or
//   - an explicit box per frame, `"focus": { "phone": [x, y, w, h], "desk": [x, y, w, h] }`, each
//     number in % of the frame — for a part no section names.
// design.mjs resolves it per picture into `focus: { x, y, w, h, label }` (the section's own label,
// or "this round's focus" for a box) and, when it can read the file, `ratio` (height ÷ width), so
// the page can size the crop before the picture loads. A picture whose frame names no matching
// section simply has no focus: sections sharpen a round, they never refuse one (the lint does).
//
// THE PAGE (render.mjs, focus-client.js): the focused view is the default — the frame cropped to
// the focus box plus a FOCUS_MARGIN on each side (clamped to the frame), shown at the same scale as
// the whole frame (a phone frame is 390 CSS px wide since #5348, so its crop keeps 14px text at
// 14px). The crop is CSS on the SAME image — a clip box, and inside it a plane the size of the
// whole frame, moved by % — so pins and marks keep their % coordinates and land where they did,
// and a tap in the crop still saves a % of the whole frame (marks-client.js reads the frame's own
// box, which is the plane's). Above it: "This round: <label>" and one button, "Show the whole
// screen" / "Show just this round's part" (aria-pressed: the whole screen is showing). The whole
// view draws the focus as a dashed outline with the label on it — a shape and a word, never a
// colour (he is red/green colourblind); the outline is the page's text colour ringed in its ground
// colour, so it holds well past 3:1 on a dark frame and a light one, in both themes.
//
// THE RECORD: a mark placed on a frame with a focus records `inFocus` (marks-client.js), and the
// read-back splits his marks by it (marks.mjs) — the ones outside go to the scope for later.
//
// Pure: resolution, the crop's geometry, the image ratio from a file's header, and the HTML.
import { e } from "./html.mjs";

/** The label of an explicit box, which no section names. */
export const FOCUS_LABEL = "this round's focus";
/** How much of the frame shows around the focus box, on each side, in % of the frame. */
export const FOCUS_MARGIN = 4;
/** The page's words: the line above a focused picture, and the button's two labels. */
export const FOCUS_WORDS = {
  line: "This round:",
  whole: "Show the whole screen",
  part: "Show just this round's part",
};
/** What the page script needs: the button's two labels. */
export const FOCUS_CLIENT = { whole: FOCUS_WORDS.whole, part: FOCUS_WORDS.part };
/** The round page's how-to line when a picture carries a focus (render.mjs, "How this page works"). */
export const FOCUS_HOW =
  "A picture opens on just the part of the screen this round is about; Show the whole screen " +
  "shows the rest. A mark outside that part is kept and added to the scope for later.";

const pct = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;
const round1 = (n) => Math.round(n * 10) / 10;

/** What is wrong with one explicit box `[x, y, w, h]` (in % of the frame); [] when it is fine. */
export function focusBoxProblems(box, where) {
  if (!(Array.isArray(box) && box.length === 4))
    return [`${where}: a box is [x, y, w, h] in % of the frame`];
  if (!box.every(pct)) return [`${where}: every number is % of the frame, 0–100`];
  const [x, y, w, h] = box;
  if (!(w > 0 && h > 0)) return [`${where}: the box needs a width and a height`];
  if (x + w > 100 || y + h > 100) return [`${where}: the box runs past the frame's edge`];
  return [];
}

/** Is this a usable section (frame-sections.mjs): a label and a box inside the frame? */
const usable = (s) =>
  typeof s?.label === "string" && [s.x, s.y, s.w, s.h].every(pct) && s.w > 0 && s.h > 0;

/** The smallest section whose label is `label` exactly, case aside (the first of equals), or null. */
export function matchSection(sections, label) {
  const want = String(label ?? "")
    .trim()
    .toLowerCase();
  if (!want) return null;
  let best = null;
  for (const s of sections ?? []) {
    if (!(usable(s) && s.label.trim().toLowerCase() === want)) continue;
    if (!best || s.w * s.h < best.w * best.h) best = s;
  }
  return best;
}

/**
 * A question's `focus` on one picture → `{ x, y, w, h, label }`, or null when it has none there.
 * A label resolves against the picture's own sections; a box is taken for its frame size.
 * @param {string | { phone?: number[], desk?: number[] } | undefined} spec
 * @param {{ size: "phone" | "desk", sections?: { label: string, x: number, y: number, w: number, h: number }[] }} pic
 */
export function focusFor(spec, pic) {
  if (typeof spec === "string") {
    const s = matchSection(pic?.sections, spec);
    return s ? { x: s.x, y: s.y, w: s.w, h: s.h, label: s.label.trim() } : null;
  }
  const box = spec && typeof spec === "object" ? spec[pic?.size] : undefined;
  if (box === undefined || focusBoxProblems(box, "focus").length) return null;
  const [x, y, w, h] = box;
  return { x, y, w, h, label: FOCUS_LABEL };
}

/** The crop the focused view shows: the focus box and FOCUS_MARGIN round it, clamped to the frame. */
export function cropOf(focus, margin = FOCUS_MARGIN) {
  const x = Math.max(0, focus.x - margin);
  const y = Math.max(0, focus.y - margin);
  const w = Math.min(100, focus.x + focus.w + margin) - x;
  const h = Math.min(100, focus.y + focus.h + margin) - y;
  return { x: round1(x), y: round1(y), w: round1(w), h: round1(h) };
}

/** Does the spot (x, y in % of the frame) sit inside the focus box, edges included? */
export const inFocus = (focus, x, y) =>
  x >= focus.x && x <= focus.x + focus.w && y >= focus.y && y <= focus.y + focus.h;

/** A picture's height ÷ width from its file's first bytes (PNG or JPEG), or null for neither. */
export function imageRatio(buf) {
  const px = imageSize(buf);
  return px ? px.h / px.w : null;
}

/** A picture's pixel size `{ w, h }` from its file's first bytes (PNG or JPEG), or null for
 *  neither — compare.mjs offers the divider only on two pictures that share it. */
export function imageSize(buf) {
  if (!buf || buf.length < 24) return null;
  if (buf.readUInt32BE(0) === 0x89504e47) {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    return w > 0 && h > 0 ? { w, h } : null;
  }
  if (!(buf[0] === 0xff && buf[1] === 0xd8)) return null;
  // Walk the JPEG's segments to its frame header (SOF0–SOF15, never DHT, JPG or DAC).
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      const h = buf.readUInt16BE(i + 5);
      const w = buf.readUInt16BE(i + 7);
      return w > 0 && h > 0 ? { w, h } : null;
    }
    i += 2 + len;
  }
  return null;
}

/** Does any picture this decision shows carry a focus? */
export function hasFocus(d) {
  const pictures = [
    ...(d?.today?.pictures ?? []),
    ...(d?.today?.clean ?? []),
    ...(d?.options ?? []).flatMap((o) => o.pictures ?? []),
  ];
  return pictures.some((p) => p?.focus);
}

const list = (b) => [b.x, b.y, b.w, b.h].join(",");

/**
 * A focused frame's pieces for a markable `.shot` (pins.mjs `pinnedShot`, marks.mjs
 * `markableShot`): the attributes the shot takes, and its inside — the line and the button, then
 * the clip, the plane and the outline around what the frame already holds (`inner`: its picture,
 * and its pins). With no focus, nothing changes: `{ attrs: "", inner }`.
 */
export function focusedFrame(inner, focus, ratio) {
  if (!focus) return { attrs: "", inner };
  const c = cropOf(focus);
  // The clip's shape: the crop's width over its height, in the frame's own proportions. Without a
  // ratio (a file it couldn't read), focus-client.js sets it once the picture loads.
  const aspect =
    typeof ratio === "number" && ratio > 0 ? `;--fa:${round3(c.w / (c.h * ratio))}` : "";
  const style = `--cx:${c.x};--cy:${c.y};--cw:${c.w};--ch:${c.h}${aspect}`;
  const label = `${FOCUS_WORDS.line} ${focus.label}`;
  const box = `left:${focus.x}%;top:${focus.y}%;width:${focus.w}%;height:${focus.h}%`;
  return {
    attrs: ` data-view="focus" data-fbox="${list(focus)}" data-crop="${list(c)}" style="${style}"`,
    inner:
      `<p class="fhead"><span class="flabel">${e(label)}</span>` +
      `<button type="button" class="ftoggle" aria-pressed="false">${e(FOCUS_WORDS.whole)}</button></p>` +
      `<div class="fclip"><div class="fplane">${inner}` +
      // The label rides just above the outline, off what it outlines — inside it when the box
      // starts at the frame's top edge, where there is no room above.
      `<div class="fbox"${focus.y < TAG_ROOM ? " data-edge" : ""} style="${box}" aria-hidden="true">` +
      `<span class="ftag">${e(label)}</span></div>` +
      `</div></div>`,
  };
}

const round3 = (n) => Math.round(n * 1000) / 1000;
/** How far down the frame (in %) a focus box must start for its label to fit above it. */
const TAG_ROOM = 4;
