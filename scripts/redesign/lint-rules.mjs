// LINT RULES FOR A ROUND'S MANIFEST (#5143) — the mechanical half of the critic pass, pure.
//
// WHY: a model critic pass on 2026-10-10 spent most of its tokens on faults a script can find — a
// missing frame, a 400KB picture, "chip" and "hero" in Eric's copy, a quote of his that he
// never wrote, a question numbered "q1". This module finds those, so a model critic judges taste
// only. lint.mjs reads the files and hands everything in through `env`; nothing here touches disk.
//
// Plain language follows CLAUDE.md → *No coined names* and docs/process/REDESIGN.md: designer
// jargon is banned in copy, and a Title-Cased name the app's UI never uses reads as a label
// invented this session. Text inside quotation marks is skipped by both — it is his words or the
// app's, which the quote check verifies instead.

import { QUESTION_KINDS } from "../steer/design.mjs";
import { focusBoxProblems, matchSection } from "../steer/focus.mjs";
import { holderPins } from "../steer/pins.mjs";
import { scopeProblems } from "../steer/scope.mjs";

const CEILING = 200 * 1024;
const CONF = ["low", "medium", "high"];
/** What a question asks: shapes, or round 0's problems — the steer builder's own list. */
const KINDS = QUESTION_KINDS;

/** Banned in copy: the word, a pattern, and what to say instead. */
const BANNED = [
  ["status pill", /\bstatus[- ]pills?\b/i, "say what it shows (the label reading “Open”)"],
  ["hairline", /\bhairlines?\b/i, "say “thin line” or “divider”"],
  ["slot", /\bslots?\b/i, "name the place (“the row under the total”)"],
  ["chip", /\bchips?\b/i, "say “button”, “filter” or “tag”"],
  ["CTA", /\bCTAs?\b/, "use the button's own words"],
  ["affordance", /\baffordances?\b/i, "say what tells him it can be tapped"],
  ["hero", /\bhero\b/i, "name it (“the total at the top”)"],
  [
    "modal",
    // the noun only: "a modal sheet" describes a sheet, "a modal" names a thing
    /(?:\b(?:a|an|the|this|that|its|one)\s+modals?\b|\bmodals\b|\bmodal\s*(?:[.,;:!?)]|$))(?!\s+(?:sheet|dialog|window|form|step|view|layer|confirmation))/i,
    "say “a pop-up window” or “a confirmation step”",
  ],
];

/** Capitalised words that are never coinages. */
const ALLOW = new Set(
  (
    "January February March April May June July August September October November December " +
    "Jan Feb Mar Apr Jun Jul Aug Sep Sept Oct Nov Dec Monday Tuesday Wednesday Thursday Friday " +
    "Saturday Sunday Mon Tue Wed Thu Fri Sat Sun Eric Eric's Moneypenny Skynet Claude Nielsen " +
    "Playwright Today Build More Not Done Option Round Fidelity GitHub Fix Look"
  ).split(" "),
);

const QUOTES = [
  /"([^"]+)"/g,
  /“([^”]+)”/g,
  /‘([^’]+)’/g,
  /(?<=^|[\s(:—-])'(.+?)'(?=$|[\s).,;:!?—])/g,
];

/** The quoted spans of a string, and the string with them blanked out. */
export function splitQuotes(text) {
  const quotes = [];
  let rest = String(text);
  for (const re of QUOTES) {
    rest = rest.replace(re, (whole, inner) => {
      quotes.push(inner);
      return " ".repeat(whole.length);
    });
  }
  return { quotes, rest };
}

const norm = (s) =>
  s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();

/** True when every piece of the quote (cut at `…` or `...`) is in `source`, in order. */
export function quoteFound(quote, source) {
  const hay = norm(source);
  const pieces = quote
    .split(/…|\.\.\./)
    .map(norm)
    .filter(Boolean);
  if (pieces.length === 0) return false;
  let from = 0;
  for (const piece of pieces) {
    const at = hay.indexOf(piece, from);
    if (at < 0) return false;
    from = at + piece.length;
  }
  return true;
}

/** Title-Cased runs that are not a sentence's first word, outside quotes. */
export function titleRuns(text) {
  const { rest } = splitQuotes(text);
  const runs = [];
  for (const sentence of rest.split(/[.!?:;·•|—()[\]]+|\s-\s/)) {
    const words = [...sentence.replace(/’/g, "'").matchAll(/[A-Za-z][A-Za-z'&-]*/g)];
    let run = [];
    const close = () => {
      if (run.length && !run.every((w) => ALLOW.has(w))) runs.push(run.join(" "));
      run = [];
    };
    words.forEach((m, i) => {
      const titled = /^[A-Z][a-z]/.test(m[0]) && i > 0;
      const gap = i > 0 ? sentence.slice(words[i - 1].index + words[i - 1][0].length, m.index) : "";
      if (!titled || (run.length && gap.trim() !== "")) close();
      if (titled) run.push(m[0]);
    });
    close();
  }
  return runs;
}

/** Whether the app's UI says this phrase: several words anywhere, one word as written. */
function inUi(phrase, ui) {
  if (phrase.includes(" ")) return ui.lower.includes(phrase.toLowerCase());
  return new RegExp(`\\b${phrase.replace(/[^A-Za-z]/g, ".")}\\b`).test(ui.text);
}

/** Every plain-language problem in one piece of copy. */
export function copyProblems(where, text, ui) {
  const out = [];
  const { rest } = splitQuotes(text);
  for (const [word, re, instead] of BANNED) {
    if (re.test(rest)) out.push(`${where}: “${word}” is jargon — ${instead}`);
  }
  for (const run of titleRuns(text)) {
    if (!inUi(run, ui)) out.push(`${where}: “${run}” isn't a name the app uses — say what it does`);
  }
  return out;
}

const text = (v) => typeof v === "string" && v.trim().length > 0;

/**
 * At least one frame, each one present and under the cap. A missing desk frame is the rule, not a
 * gap (REDESIGN.md → *Answer once*, Eric 2026-10-14: a desktop frame that only widens the phone
 * layout "doubles the work to leave feedback"); a desk frame alone is a desktop-only finding.
 */
function pictureProblems(where, holder, env) {
  const out = [];
  if (!(text(holder?.phone) || text(holder?.desk)))
    out.push(
      `${where}: no picture — a phone frame, plus a desk frame only where the layout changes`,
    );
  for (const size of ["phone", "desk"]) {
    const p = holder?.[size];
    if (!text(p)) continue;
    const bytes = env.pictureSize(p);
    if (bytes === null) out.push(`${where}: ${size} picture ${p} doesn't exist`);
    else if (bytes > CEILING)
      out.push(
        `${where}: ${size} picture ${p} is ${Math.round(bytes / 1024)}KB — 200KB is the cap`,
      );
  }
  return out;
}

/**
 * The pins an option (or Today) names — inline, or the file pin.mjs drew from (`env.pinsAt`) — held
 * to the steer builder's own rules (scripts/steer/pins.mjs), and their labels to plain words.
 */
function pinsLint(where, holder, env) {
  const { byFrame, problems } = holderPins(holder, where, env.pinsAt);
  const out = [...problems];
  for (const [frame, pins] of Object.entries(byFrame)) {
    const field = frame === "phone" ? "pins" : "pinsDesk";
    for (const p of pins)
      out.push(...copyProblems(`${where} ${field} pin ${p.n}`, p.label, env.ui));
  }
  return out;
}

/**
 * What the question asks. Round 0 picks which problem to fix first, so its questions set
 * `kind: "problems"` — without it the page says "Build this" and the read-back files a build from
 * the pick (the redesign commons, 2026-10-11: eight sessions hit it).
 */
function kindProblems(q, at, raw) {
  if (q.kind !== undefined && !KINDS.includes(q.kind))
    return [`${at}: "kind" is "design" (the default) or "problems", not ${JSON.stringify(q.kind)}`];
  if (String(raw.round) === "0" && q.kind !== "problems")
    return [`${at}: round 0 picks a problem — set "kind": "problems" so a pick files no build`];
  // The opening stage hides Claude's problems behind his own marks; a shape round has none to hide.
  if (q.opening !== undefined && !(q.opening === true && q.kind === "problems"))
    return [
      `${at}: "opening": true is for a problems question — it hides the problems until asked`,
    ];
  return [];
}

/** The question's own fields: the words, the call and its falsifier. */
function fieldProblems(q, at) {
  const out = [];
  for (const f of ["title", "ask", "topic", "wrong", "rec"])
    if (!text(q[f])) out.push(`${at}: needs "${f}"`);
  if (!CONF.includes(q.conf)) out.push(`${at}: "conf" is low, medium or high`);
  if (text(q.wrong) && !/\d{4}-\d{2}-\d{2}/.test(q.wrong))
    out.push(`${at}: "wrong" needs its date (YYYY-MM-DD) — the day the tape would prove it`);
  if (!(Array.isArray(q.saw) && q.saw.length > 0))
    out.push(`${at}: "saw" lists what the round is built on`);
  return out;
}

function todayProblems(q, at, env) {
  if (!q.today) return [`${at}: needs "today" — the real screenshot`];
  const out = [];
  if (!text(q.today.source)) out.push(`${at} today: needs "source" (the script that shot it)`);
  if (!text(q.today.caption)) out.push(`${at} today: needs "caption"`);
  return [
    ...out,
    ...pictureProblems(`${at} today`, q.today, env),
    ...pinsLint(`${at} today`, q.today, env),
    ...cleanProblems(q, at, env),
  ];
}

/**
 * An opening round shows Today before Claude's problems (marks.mjs). pin.mjs bakes the badges into
 * the frame, so a pinned Today needs `clean` — the same frames before the badges — or his first,
 * unbiased look would carry every one of them.
 */
function cleanProblems(q, at, env) {
  const clean = q.today?.clean;
  if (clean) return pictureProblems(`${at} today clean`, clean, env);
  const pinned = q.today?.pins !== undefined || q.today?.pinsDesk !== undefined;
  return q.opening === true && pinned
    ? [`${at} today: "opening" needs "clean" — Today's frames before pin.mjs drew on them`]
    : [];
}

/**
 * An option that names its pin on Today's frame instead of carrying pictures (Eric, 2026-10-14:
 * "I'm redundantly navigating the same screenshots"): a problems question only, and the pin must be
 * on Today's phone frame — or its desk frame when Today has no phone one — so the row and the spot
 * it points at can't drift apart.
 */
function pinOptionProblems(q, o, where, env) {
  if (q.kind !== "problems")
    return [`${where}: "pin" is for a problems question — a shape needs its own picture`];
  if (!(Number.isInteger(o.pin) && o.pin >= 1))
    return [`${where}: "pin" is the number of a pin on Today's frame (1, 2, …)`];
  const frame = text(q.today?.phone) ? "phone" : "desk";
  const pins = holderPins(q.today, `${where} today`, env.pinsAt).byFrame[frame] ?? [];
  return pins.some((p) => p.n === o.pin)
    ? []
    : [`${where}: "pin" ${o.pin} isn't a pin on Today's ${frame} frame`];
}

function optionProblems(q, at, env) {
  const options = Array.isArray(q.options) ? q.options : [];
  const out = [];
  // 1 to confirm, 2–3 for a fork, up to 5 to explore (REDESIGN.md → step d, *As many as needed*).
  if (options.length < 1 || options.length > 5)
    out.push(`${at}: ${options.length} options — a round shows 1–5`);
  const keys = options.map((o) => String(o.key));
  if (new Set(keys).size !== keys.length) out.push(`${at}: two options share a key`);
  if (text(q.rec) && !keys.includes(String(q.rec)))
    out.push(`${at}: "rec" ${q.rec} is not an option's key`);
  for (const o of options) {
    const where = `${at} option ${o.key}`;
    if (!text(o.name)) out.push(`${where}: needs "name"`);
    if (!text(o.delta))
      out.push(
        `${where}: needs "delta" — ${q.kind === "problems" ? "the problem, in a few words" : "the one thing it changes"}`,
      );
    // One frame for every problem: an option naming its pin on Today needs no picture of its own.
    if (o.pin !== undefined) out.push(...pinOptionProblems(q, o, where, env));
    else out.push(...pictureProblems(where, o, env));
    out.push(...pinsLint(where, o, env));
    out.push(...copyProblems(`${where} name`, o.name ?? "", env.ui));
    out.push(...copyProblems(`${where} delta`, o.delta ?? "", env.ui));
  }
  return out;
}

/** The question's copy, then each `saw` line: plain words, and every quote really there. */
function wordingProblems(q, at, raw, env) {
  const out = [];
  for (const f of ["title", "ask", "wrong", "changes"])
    if (text(q[f])) out.push(...copyProblems(`${at} ${f}`, q[f], env.ui));
  if (text(q.today?.caption))
    out.push(...copyProblems(`${at} today caption`, q.today.caption, env.ui));
  if (text(q.scope?.goal)) out.push(...copyProblems(`${at} scope goal`, q.scope.goal, env.ui));
  for (const o of Array.isArray(q.scope?.outcomes) ? q.scope.outcomes : [])
    if (text(o?.text)) out.push(...copyProblems(`${at} scope ${o.id}`, o.text, env.ui));
  const saw = Array.isArray(q.saw) ? q.saw : [];
  const sources = env.sourcesFor(q, raw);
  saw.forEach((line, n) => {
    out.push(...copyProblems(`${at} saw[${n}]`, line, env.ui));
    for (const quote of splitQuotes(line).quotes.filter((x) => !quoteFound(x, sources)))
      out.push(
        `${at} saw[${n}]: “${quote}” isn't in the cited sources or his banked words — quote exactly, mark cuts with …`,
      );
  });
  return out;
}

/**
 * A question's `focus` (scripts/steer/focus.mjs): a section's label that some frame in the question
 * really names — else the page would open every frame whole and the round would quietly lose the
 * part it was narrowed to — or an explicit box per frame, inside 0–100.
 */
function focusProblems(q, at, env) {
  const spec = q.focus;
  if (spec === undefined) return [];
  if (typeof spec === "string" && spec.trim()) return focusLabelProblems(q, at, spec.trim(), env);
  if (!(spec && typeof spec === "object" && !Array.isArray(spec) && Object.keys(spec).length))
    return [`${at}: "focus" is a section's label, or { "phone": [x, y, w, h], "desk": [...] }`];
  return Object.entries(spec).flatMap(([frame, box]) =>
    ["phone", "desk"].includes(frame)
      ? focusBoxProblems(box, `${at} focus ${frame}`)
      : [`${at} focus: "${frame}" isn't a frame — "phone" or "desk"`],
  );
}

/** A focus label against every frame's sections — Today's, its clean frames' and each option's. */
function focusLabelProblems(q, at, label, env) {
  const read = env.sectionsAt ?? env.pinsAt;
  const holders = [
    ["today", q.today],
    ["today clean", q.today?.clean],
    ...(Array.isArray(q.options) ? q.options : []).map((o) => [`option ${o?.key}`, o]),
  ];
  const checked = [];
  for (const [name, holder] of holders) {
    for (const [field, frame] of [
      ["sections", "phone"],
      ["sectionsDesk", "desk"],
    ]) {
      let list = holder?.[field];
      if (typeof list === "string") list = read ? read(list) : null;
      if (!Array.isArray(list)) continue;
      checked.push(`${name} ${frame}`);
      if (matchSection(list, label)) return [];
    }
  }
  return [
    checked.length
      ? `${at}: "focus" “${label}” isn't a section on any frame — checked ${checked.join(", ")}`
      : `${at}: "focus" “${label}” names a section, but no frame names its sections — add "sections" (or use a box)`,
  ];
}

function questionProblems(q, i, raw, env) {
  const numbered = Number.isInteger(q.q) && q.q >= 1;
  const at = numbered ? `q${q.q}` : `question ${i + 1}`;
  return [
    ...(numbered
      ? []
      : [`question ${i + 1}: "q" is a number (1, 2, …), not ${JSON.stringify(q.q)}`]),
    ...kindProblems(q, at, raw),
    ...fieldProblems(q, at),
    ...todayProblems(q, at, env),
    ...optionProblems(q, at, env),
    ...scopeProblems(q, at),
    ...focusProblems(q, at, env),
    ...wordingProblems(q, at, raw, env),
  ];
}

/**
 * Every problem in a round's manifest, one line each.
 * @param raw the parsed manifest
 * @param env `{ pictureSize(path) → bytes | null, sourcesFor(question, raw) → text,
 *              ui: { text, lower }, pinsAt?(path), sectionsAt?(path) }` — the app's UI text, for
 *              the coined-name check; the readers parse a pins or sections file a manifest names
 */
export function lintDesign(raw, env) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    return ["manifest: wrap the questions as { issue, round, questions: [...] }"];
  const out = [];
  if (!Number.isInteger(raw.issue) || raw.issue <= 0)
    out.push(`manifest: "issue" is the screen's issue number`);
  if (raw.round === undefined || raw.round === null || raw.round === "")
    out.push(`manifest: needs "round"`);
  const questions = Array.isArray(raw.questions) ? raw.questions : [];
  if (questions.length === 0) out.push("manifest: no questions");
  questions.forEach((q, i) => {
    out.push(...questionProblems(q, i, raw, env));
  });
  return out;
}
