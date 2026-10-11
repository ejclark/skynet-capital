// STEER PIN REACTIONS (#5143) — Eric reacts to each numbered pin on a round's picture, not only
// to the whole option. Eric, 2026-10-11: "i wish the process had thumbs up/down and 'mixed' icons
// to give granular feedback at the comment level for the iterations."
//
// Everything about a pin lives here, pure: what a manifest may say (`pins` on the phone frame,
// `pinsDesk` on the desktop one — the same JSON pin.mjs bakes into the frame, or that file's path,
// so there is no second copy to keep in sync), the button that sits on each badge, the popover's
// words, and the words the read-back posts. The page script is pins-client.js.
//
// THE RECORD: a reaction saves in its decision's own record as
// `pins: { "<option>:<phone|desk>:<n>": "up" | "down" | "mixed" }` ("today" for Today's frame),
// merged in one key at a time; a cleared reaction is written as null. A pin he never touched is
// "no signal" — listed as that, never given a default.
//
// A NOTE BESIDE THE REACTION (Eric, 2026-10-11: "i wish the thumbs up/down/mixed signal
// form/process also allowed for commentary to expand on context"): `pinNotes`, keyed the same way,
// up to MAX_PIN_NOTE characters, merged one key at a time; an emptied note is null. A note counts
// with or without a reaction, is quoted word for word under its pin, and the next round applies it
// on that spot. A reaction or a note on a pin the page no longer shows is ignored (#5240). Word for
// word means every visible character: controls and bidi marks are dropped, and a stored note past
// the limit (a hand-edited record) is cut with "…".
//
// GLYPH AND WORD TOGETHER: Eric is red/green colourblind, so every reaction is a shape and a word
// (👍 Keep · 👎 Change · ☯︎ Mixed), never a colour. The mixed glyph is U+262F with U+FE0E, so it
// draws as a text glyph, not a colour emoji (Eric, 2026-10-11, in place of ◐).
import { e, ext } from "./html.mjs";

export const MIXED = "☯︎";
/** The three reactions, in the order the popover offers them. */
export const PIN_REACTIONS = ["up", "down", "mixed"];
export const PIN_GLYPH = { up: "👍", down: "👎", mixed: MIXED };
/** The popover's words. A round-0 pin is a problem, so its words say whether it is one. */
export const PIN_WORDS = {
  design: { up: "Keep", down: "Change", mixed: "Mixed" },
  problems: { up: "Yes, a problem", down: "Not a problem", mixed: "Partly" },
};
/** What the next round does with each reaction. */
export const PIN_DO = {
  design: {
    up: "keep as drawn",
    down: "replace with a new direction",
    mixed: "draw a closer look (variants of just that element)",
  },
  problems: { up: "yes, a problem", down: "not a problem", mixed: "partly" },
};
export const NO_SIGNAL = "no signal";
/** The one label limit (#5244): pin.mjs draws to it (pin-rules.mjs), and the page and the lint
 *  check it here — a label can't pass one and fail the other. A few words, beside a badge. */
export const MAX_PIN_LABEL = 48;
/** A pin's note: a sentence or two on that spot, not a second write-up. */
export const MAX_PIN_NOTE = 280;
/** The manifest fields a holder (an option, or Today) may carry, and the frame each sits on. */
export const PIN_FIELDS = [
  ["pins", "phone"],
  ["pinsDesk", "desk"],
];

const kindOf = (d) => (d?.problems ? "problems" : "design");
export const pinId = (option, frame, n) => `${option}:${frame}:${n}`;
const pct = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 100;

/** What is wrong with one frame's pins: a number used once per frame, x/y in %, a short label. */
export function pinProblems(list, where) {
  if (!Array.isArray(list)) return [`${where}: a list of { n, x, y, label }`];
  const out = [];
  const seen = new Set();
  list.forEach((p, i) => {
    const n = p?.n;
    const label = typeof p?.label === "string" ? p.label : "";
    const at = `${where} pin ${Number.isInteger(n) ? n : i + 1}`;
    const named = label.trim() ? `${at} ("${label}")` : at;
    if (!(Number.isInteger(n) && n >= 1)) out.push(`${named}: n is a whole number from 1`);
    else if (seen.has(n)) out.push(`${named}: number ${n} is used twice`);
    seen.add(n);
    if (!(pct(p?.x) && pct(p?.y))) out.push(`${named}: x and y are % of the frame, 0–100`);
    if (!label.trim()) out.push(`${at}: needs a label — the words drawn beside its badge`);
    else if (label.length > MAX_PIN_LABEL)
      out.push(`${at}: label is ${label.length} characters — keep it to ${MAX_PIN_LABEL}`);
  });
  return out;
}

/**
 * One manifest field → `{ pins, problems }`. It takes the list itself, the whole pins file pin.mjs
 * read (`{ pins, quote?, tag? }`), or that file's path — `readJson(path)` returns its JSON, or
 * null when it isn't there. A pin with no `n` takes its place in the list, as pin.mjs numbers it,
 * so the badge and the button agree.
 */
export function readManifestPins(value, { holder, field, readJson }) {
  let raw = value;
  if (typeof raw === "string") {
    let got = null;
    try {
      got = readJson ? readJson(raw) : null;
    } catch {
      got = null;
    }
    if (got == null)
      return { pins: [], problems: [`${holder}: pins file ${raw} isn't there or isn't JSON`] };
    raw = got;
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) raw = raw.pins;
  const list = Array.isArray(raw) ? raw.map((p, i) => ({ ...p, n: p?.n ?? i + 1 })) : raw;
  const problems = pinProblems(list, `${holder} ${field}`);
  const pins = problems.length ? [] : list.map(({ n, x, y, label }) => ({ n, x, y, label }));
  return { pins, problems };
}

/** A holder's pins by frame (`{ phone?, desk? }`), and what is wrong with them. */
export function holderPins(holder, where, readJson) {
  const byFrame = {};
  const problems = [];
  for (const [field, frame] of PIN_FIELDS) {
    if (holder?.[field] == null) continue;
    const got = readManifestPins(holder[field], { holder: where, field, readJson });
    problems.push(...got.problems);
    if (!holder[frame])
      problems.push(`${where}: ${field} names pins on a ${frame} picture it doesn't have`);
    byFrame[frame] = got.pins;
  }
  return { byFrame, problems };
}

/** Every pin a decision shows, Today first, then each option; phone before desk; by number. */
export function decisionPins(d) {
  const holders = [
    ["today", d?.today?.pictures ?? []],
    ...(d?.options ?? []).map((o) => [o.key, o.pictures ?? []]),
  ];
  const out = [];
  for (const [option, pictures] of holders) {
    for (const frame of ["phone", "desk"]) {
      const pins = pictures.find((p) => p.size === frame)?.pins ?? [];
      for (const p of [...pins].sort((a, b) => a.n - b.n))
        out.push({ id: pinId(option, frame, p.n), option, frame, n: p.n, label: p.label });
    }
  }
  return out;
}

export const hasPins = (d) => decisionPins(d).length > 0;

const mapOf = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
/** A character no note needs, and none a page writes on purpose: a control other than tab and
 *  newline (a NUL can fail the whole comment's post), or a bidi mark, embedding, override or
 *  isolate (it would reorder the read-back's own words around the quote). */
const invisible = (c) => {
  const n = c.codePointAt(0) ?? 0;
  return (
    (n < 0x20 && c !== "\t" && c !== "\n") ||
    (n >= 0x7f && n <= 0x9f) ||
    n === 0x200e ||
    n === 0x200f ||
    (n >= 0x202a && n <= 0x202e) ||
    (n >= 0x2066 && n <= 0x2069)
  );
};
/** A pin's saved note as the read-back quotes it: every visible character as he wrote it, the
 *  invisible ones dropped, trimmed, and — a hand-edited record past what the page allows — cut at
 *  MAX_PIN_NOTE with "…" so the cut shows. A cleared (null), blank or invisible-only one is none. */
const noteOf = (r, id) => {
  const v = mapOf(r?.pinNotes)[id];
  if (typeof v !== "string") return null;
  const chars = [...v.replace(/\r\n?/g, "\n")].filter((c) => !invisible(c));
  const text = chars.join("").trim();
  if (!text) return null;
  const all = [...text];
  return all.length > MAX_PIN_NOTE ? `${all.slice(0, MAX_PIN_NOTE - 1).join("")}…` : text;
};

/** Each pin with its saved reaction and note, each null for none. A value the page never offers
 *  is none. */
export function pinReactions(d, r) {
  const saved = mapOf(r?.pins);
  return decisionPins(d).map((p) => ({
    ...p,
    reaction: PIN_REACTIONS.includes(saved[p.id]) ? saved[p.id] : null,
    note: noteOf(r, p.id),
  }));
}
/** Did he leave anything on this pin — a reaction, a note, or both? */
export const pinSaid = (p) => Boolean(p.reaction || p.note);

const where = (p) =>
  `${p.option === "today" ? "Today" : `Option ${p.option}`}${p.frame === "desk" ? ", desktop" : ""} · pin ${p.n}`;

/** His note in a list item, word for word: a later line is indented, so it stays in the item. */
const inline = (note) => `“${note.split("\n").join("\n  ")}”`;

/** One read-back line: `Option B · pin 2 (range strip) — 👍 keep — “<his note>”`, the note alone
 *  when he only wrote, or `— no signal`. */
export function pinLine(d, p) {
  const said = [
    p.reaction ? `${PIN_GLYPH[p.reaction]} ${PIN_WORDS[kindOf(d)][p.reaction].toLowerCase()}` : "",
    p.note ? inline(p.note) : "",
  ].filter(Boolean);
  return `- ${where(p)} (${p.label}) — ${said.length ? said.join(" — ") : NO_SIGNAL}`;
}

/** The "Per pin" list a decision's issue comment carries ("" when it shows no pins). `option`
 *  narrows it to one option's pins — the build a pick files carries its own. */
export function perPinBlock(d, r, { option } = {}) {
  const all = pinReactions(d, r).filter((p) => option === undefined || p.option === option);
  return all.length ? ["Per pin:", ...all.map((p) => pinLine(d, p))].join("\n") : "";
}

/** What the next round does on one pin: its reaction's instruction, then his note on that spot. */
function pinTodo(d, p) {
  return [
    p.reaction ? PIN_DO[kindOf(d)][p.reaction] : "",
    p.note ? `apply his note on that spot: “${p.note}”` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

/** The pins he reacted to or wrote on, as next-round clauses, the rest named as no signal; ""
 *  for none. */
export function pinClauses(d, r) {
  const all = pinReactions(d, r);
  const said = all.filter(pinSaid);
  if (!said.length) return "";
  const none = all.filter((p) => !pinSaid(p));
  return [
    ...said.map((p) => `${where(p)} (${p.label}): ${pinTodo(d, p)}.`),
    none.length
      ? `No signal, so no default: ${none.map((p) => `${where(p)} (${p.label})`).join(", ")}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// ── the page ────────────────────────────────────────────────────────────────────────────────

/** The round page's line on pins, when it shows any. */
export const PIN_INTRO = {
  design: `Tap a numbered pin to mark that spot ${PIN_GLYPH.up} Keep, ${PIN_GLYPH.down} Change or ${MIXED} Mixed.`,
  problems: `Tap a numbered pin to say ${PIN_GLYPH.up} Yes, a problem, ${PIN_GLYPH.down} Not a problem or ${MIXED} Partly.`,
};
export const pinIntro = (d) => PIN_INTRO[kindOf(d)];

/** What the page script needs to draw the popover: the glyphs, the words for each kind, and how
 *  long a note may be. */
export const PIN_CLIENT = { glyph: PIN_GLYPH, words: PIN_WORDS, noteMax: MAX_PIN_NOTE };

/** A picture with pins: the frame, then a button on each badge, placed by % so it tracks the
 *  scaled image; its ✎ shows once the pin has a note. The popover is the page script's, one at a
 *  time, set after the pin tapped. */
export function pinnedShot(pic, src, { key, option }) {
  const pins = [...pic.pins]
    .sort((a, b) => a.n - b.n)
    .map(
      (p) =>
        `<button type="button" class="pin" data-pin="${e(pinId(option, pic.size, p.n))}" ` +
        `data-name="${e(`Pin ${p.n}: ${p.label}`)}" style="left:${p.x}%;top:${p.y}%" ` +
        `aria-label="${e(`Pin ${p.n}: ${p.label}`)}" aria-haspopup="true" aria-expanded="false">` +
        `<span class="pg" aria-hidden="true"></span><span class="pn" aria-hidden="true">${p.n}</span>` +
        `<span class="pk" aria-hidden="true">✎</span></button>`,
    )
    .join("");
  const size = pic.size === "phone" ? "phone" : "desk";
  return (
    `<div class="shot ${size} pinned" data-key="${e(key)}">` +
    `<a class="frame" href="${e(src)}" ${ext}><img src="${e(src)}" alt="${e(pic.alt)}" loading="lazy"></a>` +
    `${pins}</div>`
  );
}
