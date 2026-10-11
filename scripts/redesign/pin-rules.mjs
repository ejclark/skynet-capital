// PIN RULES (#5143) — what pin.mjs refuses to draw, as pure functions it and its spec share.
//
// WHY GUARDS, NOT REVIEW: the critic loops of 2026-10-10 spent most of their tokens catching the
// same mechanical faults on hand-drawn frames — a label too small to read on a phone, a callout
// cut off by the frame edge, two badges touching, an annotation colour that fails contrast for a
// red/green colourblind reader (docs/BRAND.md → Accessibility). A rule a script can check is
// checked here, before Eric or a model critic sees the frame, and each failure names the pin.
//
// The palette is the app's own tokens (app/src/styles/theme.css): annotations wear the accent, as
// the round-3 frames did, so the pin look matches what Eric has already judged.

export const PALETTE = {
  dark: { bg: "#0b0f14", text: "#e6edf3", accent: "#35d0ba", onAccent: "#04302b" },
  light: { bg: "#f7f9fb", text: "#0b0f14", accent: "#0e9f8c", onAccent: "#032420" },
};
/** Each pair a pin draws: what it is, its ink, what it sits on, the AA floor (text 4.5, else 3). */
const PAIRS = [
  ["label, quote and tag text", "text", "bg", 4.5],
  ["badge number", "onAccent", "accent", 4.5],
  ["badge, box and leader", "accent", "bg", 3],
];
const SIDES = ["right", "left", "top", "bottom"];
const MIN_FONT = 12;
const MIN_GAP = 8;
const MAX_LABEL = 48;

const channel = (hex, i) => {
  const c = Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) =>
  0.2126 * channel(hex, 0) + 0.7152 * channel(hex, 1) + 0.0722 * channel(hex, 2);

/** WCAG contrast ratio of two `#rrggbb` colours. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Every pair, in both schemes, that misses its floor. */
export function paletteProblems(palette = PALETTE) {
  const out = [];
  for (const [scheme, p] of Object.entries(palette)) {
    for (const [what, ink, on, floor] of PAIRS) {
      const ratio = contrast(p[ink], p[on]);
      if (ratio < floor)
        out.push(`palette (${scheme}): ${what} is ${ratio.toFixed(2)}:1 — needs ${floor}:1`);
    }
  }
  return out;
}

const pct = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;
const text = (v) => typeof v === "string" && v.trim().length > 0;
const name = (p) => `pin ${p.n} ("${p.label}")`;

const boxOk = (b) =>
  Array.isArray(b) && b.length === 4 && b.every(pct) && b[0] + b[2] <= 100 && b[1] + b[3] <= 100;

/** What is wrong with one pin; `seen` holds the numbers used so far. */
function pinProblems(p, seen) {
  const out = [];
  if (!Number.isInteger(p.n) || p.n < 1) out.push(`${name(p)}: n is a whole number from 1`);
  if (seen.has(p.n)) out.push(`${name(p)}: number ${p.n} is used twice`);
  seen.add(p.n);
  if (!(pct(p.x) && pct(p.y))) out.push(`${name(p)}: x and y are % of the frame, 0–100`);
  if (!text(p.label)) out.push(`pin ${p.n}: needs a label — a few words on what is wrong here`);
  else if (p.label.length > MAX_LABEL)
    out.push(
      `${name(p)}: ${p.label.length} characters — a pin label is a few words (≤${MAX_LABEL}); put the sentence in the round's question`,
    );
  if (!SIDES.includes(p.side)) out.push(`${name(p)}: side is one of ${SIDES.join(", ")}`);
  if (p.box !== undefined && !boxOk(p.box))
    out.push(`${name(p)}: box is [x, y, w, h] in % and stays inside the frame`);
  return out;
}

function quoteProblems(quote) {
  if (quote === undefined) return [];
  const out = [];
  if (!(text(quote?.text) && text(quote?.who))) out.push("quote: needs text and who");
  const at = quote?.at;
  if (!(Array.isArray(at) && at.length === 2 && at.every(pct)))
    out.push("quote: at is [x, y] in % of the frame");
  return out;
}

/** The pins file → `{ pins, quote, tag, problems }`, defaults filled. Problems are plain lines. */
export function readPins(raw) {
  if (raw === null || typeof raw !== "object")
    return { pins: [], problems: ["pins: not a JSON object"] };
  const list = raw.pins ?? [];
  const problems = Array.isArray(list) ? [] : ["pins: `pins` is a list"];
  // A list entry that isn't an object (`null`, a number, a list) is a pin with nothing set: refused by
  // name below, never a TypeError.
  const pins = (Array.isArray(list) ? list : []).map((raw, i) => {
    const p = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    return { ...p, n: p.n ?? i + 1, side: p.side ?? "right", label: String(p.label ?? "") };
  });
  const seen = new Set();
  for (const p of pins) problems.push(...pinProblems(p, seen));
  problems.push(...quoteProblems(raw.quote));
  if (raw.tag !== undefined && !text(raw.tag))
    problems.push('tag: a few words, e.g. "illustrative values"');
  if (pins.length === 0 && raw.quote === undefined && raw.tag === undefined)
    problems.push("pins: nothing to draw");
  return { pins, quote: raw.quote, tag: raw.tag, problems };
}

/**
 * The pins a round manifest names on an option (`pins` / `pinsDesk`, #5143), from `readPins`'s
 * list: the badge number, the spot and the label the page puts a reaction button on, defaults
 * filled exactly as this kit draws them — so the frame and the page can't disagree.
 */
export const manifestPins = (pins) =>
  pins.map(({ n, x, y, label, side }) => ({ n, x, y, label, side }));

const EDGES = [
  ["left", (r) => -r.x],
  ["top", (r) => -r.y],
  ["right", (r, f) => r.x + r.w - f.width],
  ["bottom", (r, f) => r.y + r.h - f.height],
];
const OPPOSITE = { right: "left", left: "right", top: "bottom", bottom: "top" };
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const who = (it) => (it.n === undefined ? it.kind : `pin ${it.n}'s ${it.kind}`);

function outsideHint(it) {
  if (it.kind === "label")
    return `set "side": "${OPPOSITE[it.side] ?? "left"}" or shorten the label`;
  if (it.kind === "quote") return 'move its "at" away from that edge or shorten the quote';
  return "move it inside the frame";
}

/** Anything past the frame edge, and text under the floor. */
function frameProblems(items, frame) {
  const out = [];
  for (const it of items) {
    for (const [edge, past] of EDGES) {
      const px = Math.ceil(past(it.rect, frame));
      if (px > 0) out.push(`${who(it)} runs ${px}px past the ${edge} edge — ${outsideHint(it)}`);
    }
    if (it.font !== undefined && it.font < MIN_FONT)
      out.push(`${who(it)} text is ${it.font}px at 1x — ${MIN_FONT}px is the floor`);
  }
  return out;
}

/** Every unordered pair of a list. */
const pairs = (list) => list.flatMap((a, i) => list.slice(i + 1).map((b) => [a, b]));

function gapProblems(badges) {
  const out = [];
  for (const [a, b] of pairs(badges)) {
    const [r, s] = [a.rect, b.rect];
    const gap =
      Math.hypot(r.x + r.w / 2 - (s.x + s.w / 2), r.y + r.h / 2 - (s.y + s.h / 2)) -
      (r.w + s.w) / 2;
    if (gap < MIN_GAP)
      out.push(
        `pins ${a.n} and ${b.n}: badges ${Math.max(0, Math.round(gap))}px apart — keep ${MIN_GAP}px between them`,
      );
  }
  return out;
}

/** One callout over another (a pin's own badge and label never count; badge pairs are gaps). */
function coverProblems(solid) {
  return pairs(solid)
    .filter(([a, b]) => !(a.kind === "badge" && b.kind === "badge"))
    .filter(([a, b]) => a.n === undefined || a.n !== b.n)
    .filter(([a, b]) => overlaps(a.rect, b.rect))
    .map(([a, b]) => `${who(a)} covers ${who(b)} — move one, or flip a "side"`);
}

/** The quote's leader must land on the spot it names, not on another callout drawn over it. */
function leaderProblems(solid) {
  const out = [];
  for (const q of solid.filter((it) => it.at)) {
    for (const it of solid.filter(
      (s) => s !== q && overlaps({ ...q.at, w: 0.01, h: 0.01 }, s.rect),
    ))
      out.push(`the quote's leader ends on ${who(it)} — point "at" at the spot itself`);
  }
  return out;
}

/**
 * What the drawn frame breaks. `items` are the drawn parts as measured in the page, in CSS px at
 * 1x: `{ kind: "badge"|"label"|"box"|"quote"|"tag", n?, side?, rect: {x, y, w, h}, font?, at? }`.
 */
export function layoutProblems(items, frame) {
  const solid = items.filter((it) => it.kind !== "box");
  return [
    ...frameProblems(items, frame),
    ...gapProblems(items.filter((it) => it.kind === "badge")),
    ...coverProblems(solid),
    ...leaderProblems(solid),
  ];
}

/** `{ width, height }` in pixels of a JPEG or PNG, from its bytes. */
export function imageSize(buf) {
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error("pin: the frame is not a JPEG or PNG");
  let at = 2;
  while (at + 9 <= buf.length) {
    const marker = buf[at + 1];
    const length = buf.readUInt16BE(at + 2);
    // SOF0–SOF15 carry the size, except DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(at + 5), width: buf.readUInt16BE(at + 7) };
    }
    at += 2 + length;
  }
  throw new Error("pin: no size in the JPEG");
}
