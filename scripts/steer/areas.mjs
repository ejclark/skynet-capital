// A ROUND'S AREAS — the parts of the screen a redesign tracks, drawn as numbered outlines, the ones
// this round asks about solid with words beside the picture (#5391; Eric picked option E on #5350
// round 2: "Build option e").
//
// WHY: a dot dropped on a frame left him "guessing the proximity of scope", and reading text over
// the picture "requires too much brain power" (#5350 round 1). His words set the shape: "outline the
// piece of scope in question then use an arrow/line to expand on context where there is no/minimal
// collision with the content under review" — and "faint outlines, one (or more if necessary) active
// outlines to call out the specific area under 'interrogation'". An area keeps its number across
// rounds while its problem is open (#5350 O4); carrying them is the session's job (its state block
// writes the manifest), so this module only draws what it is given.
//
// THE MANIFEST: a question may carry
//   - `areas: [{ n, label?, box?, problem, words? }]` — `n` a whole number kept across rounds;
//     `label` a section's label, resolved on each picture the way `focus` is (focus.mjs
//     `matchSection`); `box` `{ phone?: [x, y, w, h], desk?: [...] }` in % of the frame, which wins
//     over the label on the frame it names; `problem` the open problem the area belongs to; `words`
//     what the callout says (≤ AREA_MAX_WORDS), else its label;
//   - `active: [n…]` — the areas this round asks about.
// Opt-in: a question without `areas` renders exactly as before. One question narrows by `focus` or
// by `areas`, never both — whether focus becomes "the active areas" waits on the test screen (#5350).
//
// THE PAGE (render.mjs, page.css → A ROUND'S AREAS): every area a dashed outline with a hollow
// number in the margin left of the picture, level with the outline's top; an active one a solid
// outline and a filled number — dashed vs solid and hollow vs filled, never colour alone (he is
// red/green colourblind). An active area's words sit outside the picture: beside it at desktop
// width, joined by a straight line to the outline's right edge; at phone width in a band above the
// picture (the area's middle in the top half) or below it, the line running from the words out to
// the right margin, along it, and in to the outline's right edge. Nothing — a number, words or a
// line — is drawn over an area's box: the line's height is chosen so it crosses none
// (`lineY`), and the lint refuses a layout where no height can.
//
// THE RECORD: nothing new is saved. A mark is a spot in % of the frame as before, so the read-back
// names the area it landed in (marks.mjs) from the same resolved boxes.
//
// Pure: resolution, the line's height, and the HTML.
import { focusBoxProblems, matchSection } from "./focus.mjs";
import { e } from "./html.mjs";

/** An active area's callout is a few words, not a sentence. */
export const AREA_MAX_WORDS = 6;
/** How far apart two phone-width lines run along the right margin, in px. */
export const LANE = 8;
/** The round page's how-to line when a picture carries areas (round-header.mjs). */
export const AREAS_HOW =
  "Numbered outlines mark the parts of the screen this redesign tracks; a solid one, its words " +
  "beside the picture, is what this round asks about. A mark inside one is read back by its number.";

const round1 = (n) => Math.round(n * 10) / 10;
const text = (v) => typeof v === "string" && v.trim().length > 0;
export const wordCount = (s) =>
  String(s ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

/** What is wrong with a question's `areas` / `active` as data — numbers, a label or a box, each
 *  box inside the frame, every active number an area. [] when it is fine (or there are none). */
export function areaSpecProblems(q, at) {
  if (q?.areas === undefined)
    return q?.active === undefined ? [] : [`${at}: "active" names areas, but there are no "areas"`];
  if (!(Array.isArray(q.areas) && q.areas.length))
    return [`${at}: "areas" is a list of { n, label?, box?, problem }`];
  const out = [];
  const seen = new Set();
  q.areas.forEach((a, i) => {
    const n = a?.n;
    const where = `${at} area ${Number.isInteger(n) ? n : `#${i + 1}`}`;
    if (!(Number.isInteger(n) && n >= 1)) out.push(`${where}: "n" is a whole number from 1`);
    else if (seen.has(n)) out.push(`${where}: number ${n} is used twice`);
    seen.add(n);
    const box = a?.box;
    if (!(text(a?.label) || box !== undefined))
      out.push(`${where}: needs a "label" (a section's) or a "box"`);
    if (box === undefined) return;
    if (!(box && typeof box === "object" && !Array.isArray(box) && Object.keys(box).length)) {
      out.push(`${where}: "box" is { "phone": [x, y, w, h], "desk": [...] }`);
      return;
    }
    for (const [frame, b] of Object.entries(box))
      out.push(
        ...(["phone", "desk"].includes(frame)
          ? focusBoxProblems(b, `${where} box ${frame}`)
          : [`${where} box: "${frame}" isn't a frame — "phone" or "desk"`]),
      );
  });
  if (q.active === undefined) return out;
  if (!Array.isArray(q.active)) return [...out, `${at}: "active" is a list of area numbers`];
  for (const n of q.active)
    if (!seen.has(n)) out.push(`${at}: "active" ${JSON.stringify(n)} isn't an area's number`);
  return out;
}

/** One area's box on one picture: its own box for the frame, else its label's section there. */
function boxOn(a, pic) {
  const own = a.box?.[pic.size];
  if (own !== undefined) return focusBoxProblems(own, "box").length ? null : own;
  const s = text(a.label) ? matchSection(pic.sections, a.label) : null;
  return s ? [s.x, s.y, s.w, s.h] : null;
}

/** Does a straight line at height `y`, from `a`'s right edge to the frame's, cross box `b`? A box
 *  holding all of `a` never blocks: a nested area's line can only leave through its container. */
function crosses(a, b, y) {
  const holds = b.x <= a.x && b.y <= a.y && b.x + b.w >= a.x + a.w && b.y + b.h >= a.y + a.h;
  return !holds && b.x + b.w > a.x + a.w && y >= b.y && y <= b.y + b.h;
}

/** The height (in % of the frame) of an active area's line: as near its middle as can be, crossing
 *  no other area's box on the way to the frame's right edge; null when no height can. */
export function lineY(a, all) {
  const others = all.filter((b) => b !== a);
  for (let k = 0; k <= 9; k++) {
    for (const t of k ? [0.5 - k * 0.05, 0.5 + k * 0.05] : [0.5]) {
      const y = round1(a.y + a.h * t);
      if (!others.some((b) => crosses(a, b, y))) return y;
    }
  }
  return null;
}

/**
 * A question's areas on one picture → `[{ n, label, x, y, w, h, active, words, problem, ly }]`, by
 * number; an area whose box this frame doesn't hold is left off it. `ly` (an active area's line
 * height) is null for an inactive one, or when no height crosses clear.
 * @param {{ areas?: unknown[], active?: number[] }} spec
 * @param {{ size: "phone" | "desk", sections?: { label: string, x: number, y: number, w: number, h: number }[] }} pic
 */
export function areasFor(spec, pic) {
  const on = new Set(Array.isArray(spec?.active) ? spec.active : []);
  const placed = (Array.isArray(spec?.areas) ? spec.areas : [])
    .map((a) => {
      const box = boxOn(a, pic);
      if (!box) return null;
      const [x, y, w, h] = box;
      const label = text(a.label) ? a.label.trim() : null;
      return {
        n: a.n,
        label,
        x,
        y,
        w,
        h,
        active: on.has(a.n),
        words: text(a.words) ? a.words.trim() : (label ?? `Area ${a.n}`),
        problem: text(a.problem) ? a.problem.trim() : null,
        ly: null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.n - b.n);
  for (const a of placed) if (a.active) a.ly = lineY(a, placed);
  return placed;
}

/** The smallest area holding the spot (x, y in % of the frame), edges included, or null. */
export function areaAt(areas, x, y) {
  let best = null;
  for (const a of areas ?? []) {
    const inside = x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
    if (inside && (!best || a.w * a.h < best.w * best.h)) best = a;
  }
  return best;
}

/** Does any picture this decision shows carry areas? */
export function hasAreas(d) {
  const pictures = [
    ...(d?.today?.pictures ?? []),
    ...(d?.options ?? []).flatMap((o) => o.pictures ?? []),
  ];
  return pictures.some((p) => p?.areas?.length);
}

const boxStyle = (a) => `left:${a.x}%;top:${a.y}%;width:${a.w}%;height:${a.h}%`;
const on = (a) => (a.active ? " data-on" : "");
const num = (a) => `<span class="anum"${on(a)} aria-hidden="true">${a.n}</span>`;

/** Which margin lane each phone-width line runs in, so no two lines cross: lines above the
 *  picture run down from the band, lines below run up, and in each band the area lower on the
 *  frame takes the outer lane above it and the inner one below it. */
function lanes(active) {
  const byLow = (list) => [...list].sort((a, b) => b.ly - a.ly);
  const above = byLow(active.filter((a) => a.y + a.h / 2 < 50));
  const below = byLow(active.filter((a) => a.y + a.h / 2 >= 50));
  const lane = new Map([
    ...above.map((a, i) => [a, above.length - 1 - i]),
    ...below.map((a, i) => [a, i]),
  ]);
  return { above, below, lane, count: Math.max(above.length, below.length) };
}

/**
 * A framed picture with areas, for a markable `.shot` (pins.mjs `pinnedShot`, marks.mjs
 * `markableShot`): the class and attributes the shot takes, and its inside — the phone band above,
 * the plane (what the frame already holds, `inner`: its picture and pins, then the outlines,
 * numbers, lines and the desktop words, all placed in % of the frame), the phone band below.
 * Marks and pin popovers go on the plane (`.aplane`), so every % still lands on the picture.
 */
export function arealFrame(inner, areas) {
  const lit = areas.filter((a) => a.active && a.ly != null);
  const { above, below, lane, count } = lanes(lit);
  const d = (a) => `--d:${LANE * (lane.get(a) + 1)}px`;
  const call = (a) =>
    `<p class="acall" style="${d(a)}">${num(a)}<span class="aw">${e(a.words)}</span>` +
    `<span class="ajoin" aria-hidden="true"></span></p>`;
  const band = (list, side) =>
    list.length ? `<div class="aband ${side}">${list.map(call).join("")}</div>` : "";
  const half = (a) => (above.includes(a) ? `top:0;height:${a.ly}%` : `top:${a.ly}%;bottom:0`);
  const plane =
    areas
      .map(
        (a) =>
          `<div class="abox"${on(a)} data-n="${a.n}" style="${boxStyle(a)}" aria-hidden="true"></div>` +
          `<span class="anum"${on(a)} style="top:${a.y}%" aria-hidden="true">${a.n}</span>`,
      )
      .join("") +
    lit
      .map(
        (a) =>
          `<span class="aline" style="top:${a.ly}%;left:${round1(a.x + a.w)}%;${d(a)}" aria-hidden="true"></span>` +
          `<span class="arail" style="${half(a)};${d(a)}" aria-hidden="true"></span>` +
          `<p class="agut" style="top:${a.ly}%">${e(a.words)}</p>`,
      )
      .join("");
  return {
    cls: " areas",
    attrs: ` data-areas="${areas.length}" style="--rail:${LANE * (count + 1)}px"`,
    inner:
      band(above, "above") +
      `<div class="arow"><div class="aplane">${inner}${plane}</div></div>` +
      band(below, "below"),
  };
}
