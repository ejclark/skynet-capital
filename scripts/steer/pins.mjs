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
export const MAX_PIN_LABEL = 60;
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

/** Each pin with its saved reaction, or null for none. A value the page never offers is none. */
export function pinReactions(d, r) {
  const saved = r?.pins ?? {};
  return decisionPins(d).map((p) => ({
    ...p,
    reaction: PIN_REACTIONS.includes(saved[p.id]) ? saved[p.id] : null,
  }));
}

const where = (p) =>
  `${p.option === "today" ? "Today" : `Option ${p.option}`}${p.frame === "desk" ? ", desktop" : ""} · pin ${p.n}`;

/** One read-back line: `Option B · pin 2 (range strip) — 👍 keep`, or `— no signal`. */
export function pinLine(d, p) {
  const said = p.reaction
    ? `${PIN_GLYPH[p.reaction]} ${PIN_WORDS[kindOf(d)][p.reaction].toLowerCase()}`
    : NO_SIGNAL;
  return `- ${where(p)} (${p.label}) — ${said}`;
}

/** The "Per pin" list a decision's issue comment carries ("" when it shows no pins). `option`
 *  narrows it to one option's pins — the build a pick files carries its own. */
export function perPinBlock(d, r, { option } = {}) {
  const all = pinReactions(d, r).filter((p) => option === undefined || p.option === option);
  return all.length ? ["Per pin:", ...all.map((p) => pinLine(d, p))].join("\n") : "";
}

/** The pins he reacted to, as next-round clauses, the rest named as no signal; "" for none. */
export function pinClauses(d, r) {
  const all = pinReactions(d, r);
  const said = all.filter((p) => p.reaction);
  if (!said.length) return "";
  const todo = PIN_DO[kindOf(d)];
  const none = all.filter((p) => !p.reaction);
  return [
    ...said.map((p) => `${where(p)} (${p.label}): ${todo[p.reaction]}.`),
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

/** What the page script needs to draw the popover: the glyphs, and the words for each kind. */
export const PIN_CLIENT = { glyph: PIN_GLYPH, words: PIN_WORDS };

/** A picture with pins: the frame, then a button on each badge, placed by % so it tracks the
 *  scaled image. The popover is the page script's, one at a time, set after the pin tapped. */
export function pinnedShot(pic, src, { key, option }) {
  const pins = [...pic.pins]
    .sort((a, b) => a.n - b.n)
    .map(
      (p) =>
        `<button type="button" class="pin" data-pin="${e(pinId(option, pic.size, p.n))}" ` +
        `data-name="${e(`Pin ${p.n}: ${p.label}`)}" style="left:${p.x}%;top:${p.y}%" ` +
        `aria-label="${e(`Pin ${p.n}: ${p.label}`)}" aria-haspopup="true" aria-expanded="false">` +
        `<span class="pg" aria-hidden="true"></span><span class="pn" aria-hidden="true">${p.n}</span></button>`,
    )
    .join("");
  const size = pic.size === "phone" ? "phone" : "desk";
  return (
    `<div class="shot ${size} pinned" data-key="${e(key)}">` +
    `<a class="frame" href="${e(src)}" ${ext}><img src="${e(src)}" alt="${e(pic.alt)}" loading="lazy"></a>` +
    `${pins}</div>`
  );
}
