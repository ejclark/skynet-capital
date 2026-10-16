// THE ORACLE (#4943) — whether a simulated member actually got the task done. PURE: it reads the
// task file, the session's opening frame and its trace, and never a browser. Specced in
// tests/scripts/study-oracle.spec.ts.
//
// WHY AN ORACLE AND NOT THE MEMBER'S WORD: a member that says "done" may have guessed, read the
// wrong row, or answered from what it expected to find. So success needs BOTH halves:
//  1. the answer it gave with `done` matches the task's answer — a number within the task's
//     absolute or relative tolerance; a calendar day written any common way ("6 November 2026",
//     "Nov 6", "11/6", the ISO form) when the answer is an ISO date; else text whose every token
//     is in the answer (case-blind); and
//  2. the place that answer lives (`answerRegion`: one or more text snippets) was at least half
//     inside the viewport, uncovered, in at least one frame the member saw BEFORE it said done.
// Neither half looks at the route, the path taken or where on the page the answer sat: two members
// who find it two different ways both succeed. How they got there is measured (metrics.mjs), never
// graded.
//
// Area-agnostic: tasks bring every value; nothing here names a surface.

/** A snippet counts as seen when at least this share of its text is inside the viewport. */
export const SEEN_MIN = 0.5;
/**
 * An answer that sets more than this many BARE amounts of the same size as the one asked for (within
 * a factor of two) beside it is a list of candidates — a guess ("$380, $412, $455"). Bare means its
 * clause names nothing: an amount whose clause carries a word saying what it is — "$20,111 cash",
 * "the bot account at $996,966", "my other holding, a separate +$414" — is labelled context, and a rounded
 * restatement of the answer ("about $25,200 — $25,212 to be exact") is the answer said twice. The
 * first full round's audit (2026-10-09, #5009) found three right answers failed for their labelled
 * breakdowns, after #5003 had already stopped counting every number.
 */
export const MAX_RIVALS = 1;
/** How close in size another amount must be to count as a rival candidate. */
const RIVAL_FACTOR = 2;

const MINUS = /[-−–]/;
// A minus counts only when it TOUCHES the number ("-$412", "$-3", "−8.3%"): a spaced dash is
// punctuation ("Total – $412"), and a number glued to a word or digit before it is not a fresh
// number ("400-412" is a range, not 400 and −412; "Q3" is no 3).
const NUMBER =
  /(?<![\w.])([-−–])?(?:\$\s*([-−–])?)?(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?\s*([km](?![a-z]))?(\s*%)?/gi;
// Dates and clock times are never the amount a task asks for, and split into numbers they would
// push a right answer ("bought 10/01, down $412") toward looking like a list.
const DATE_OR_TIME =
  /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,4}\/\d{1,2}(?:\/\d{2,4})?\b|\b\d{1,2}:\d{2}(?::\d{2})?\b/g;

/** `text` with every date, clock time and written calendar day blanked to spaces, in place. */
function blankDates(text) {
  let clean = String(text ?? "").replace(DATE_OR_TIME, (d) => " ".repeat(d.length));
  for (const d of datesIn(clean)) {
    clean = clean.slice(0, d.start) + " ".repeat(d.end - d.start) + clean.slice(d.end);
  }
  return clean;
}

/** One NUMBER match as an amount: its value, unit ("$", "%" or "") and the step it is written to
 *  — "$25,200" to the hundred, "$1.1k" to the hundred, "$412.50" to the cent — so a rounded
 *  restatement can be told from a different figure. */
function amountOf(m) {
  const negative = MINUS.test(m[1] ?? "") || MINUS.test(m[2] ?? "");
  const scale = { k: 1_000, m: 1_000_000 }[(m[5] ?? "").toLowerCase()] ?? 1;
  const n = Number(`${m[3].replace(/,/g, "")}${m[4] ?? ""}`) * scale;
  const zeros = m[4] ? 0 : (m[3].replace(/,/g, "").match(/0+$/)?.[0].length ?? 0);
  const decimals = m[4] ? m[4].length - 1 : 0;
  return {
    n: negative ? -n : n,
    unit: m[0].includes("$") ? "$" : m[6] ? "%" : "",
    step: 10 ** (zeros - decimals) * scale,
    start: m.index,
    end: m.index + m[0].length,
  };
}

/** Every number in an answer with its unit and where it sits; `clean` is the text it read. */
function numberHits(text) {
  const clean = blankDates(text);
  return { hits: [...clean.matchAll(NUMBER)].map(amountOf), clean };
}

// Clauses: what an amount's own words are read inside. Punctuation, a dash, and the joining words
// that start a new part of a sentence end one.
const CLAUSE_END =
  /[,;:()[\]{}—–/|·]|\.(?=\s|$)|\s-\s|\b(?:and|or|plus|with|but|while|which|whereas)\b/gi;
// Words that say nothing about WHAT an amount is — hedges, filler and pointers. Anything else in an
// amount's clause labels it.
const GLUE = new Set(
  (
    "i i'd id i'm im i've say said maybe perhaps possibly probably likely about around roughly " +
    "approximately approx nearly almost like either it it's its is was be are were the a an at " +
    "of to by up down just only exactly guess think would could might somewhere between from " +
    "than so then there that this my his her their our your me um uh well ok okay hmm"
  ).split(" "),
);

/** Does the clause around `hit` carry a word saying what the amount is? */
function labelled(clean, hits, hit) {
  let masked = clean;
  for (const h of hits)
    masked = masked.slice(0, h.start) + "#".repeat(h.end - h.start) + masked.slice(h.end);
  let from = 0;
  let to = masked.length;
  for (const b of masked.matchAll(CLAUSE_END)) {
    if (b.index + b[0].length <= hit.start) from = b.index + b[0].length;
    else if (b.index >= hit.end) {
      to = b.index;
      break;
    }
  }
  const words =
    masked
      .slice(from, to)
      .toLowerCase()
      .match(/[a-z][a-z'’]*/g) ?? [];
  return words.some((w) => !GLUE.has(w.replace(/’/g, "'")));
}

/** Is `rival` the answer rounded to the step it is written at ("about $400" for $412)? */
const restates = (rival, hit) => Math.abs(rival.n - hit.n) <= rival.step / 2 + 1e-9;

/** Every number written in a free-text answer: "$1,056", "-$412", "−8.32%", "1.2k", "$-3". */
export function numbersIn(text) {
  return numberHits(text).hits.map((h) => h.n);
}

/**
 * Two numbers of the same unit joined only by "or" — "$412 or $500" — are a guess between them,
 * not an answer. Different units are one fact said two ways ("down $412, or 8.3%").
 */
export function hedged(text) {
  const { hits, clean } = numberHits(text);
  return hits.some((h, i) => {
    const next = hits[i + 1];
    return (
      next !== undefined &&
      next.unit === h.unit &&
      next.n !== h.n &&
      /^[\s,;(]*or[\s(]*$/i.test(clean.slice(h.end, next.start))
    );
  });
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH =
  "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";
const ORD = "(?:st|nd|rd|th)?";
// Every common way a member writes a calendar day; a weekday beside it is read past, not needed.
const DATE_FORMS = [
  // 2026-11-06
  { re: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, parts: (m) => [m[1], m[2], m[3]] },
  // 11/6, 11/06/2026, 11/6/26 — month first, as the app's en-US pages write it
  {
    re: /(?<![\d$.,/])(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?(?![\d/%]|\.\d)/g,
    parts: (m) => [m[3], m[1], m[2]],
  },
  // Nov 6, November 6th, Nov. 6, 2026
  {
    re: new RegExp(`\\b${MONTH}\\s+(\\d{1,2})${ORD}(?![\\d:])(?:,?\\s+(\\d{4}))?\\b`, "gi"),
    parts: (m) => [m[3], m[1], m[2]],
  },
  // 6 November 2026, the 6th of November, 6 NOV 26 (an option's own name)
  {
    re: new RegExp(
      `(?<![\\d$.,])\\b(\\d{1,2})${ORD}\\s+(?:of\\s+)?${MONTH}(?:,?\\s+(\\d{4}|\\d{2}))?\\b`,
      "gi",
    ),
    parts: (m) => [m[3], m[2], m[1]],
  },
];

/** One reading of a date form — `[year, month, day]` as written — or null when it is no day. */
function dayOf([y, mo, d], m) {
  const month = /^\d+$/.test(mo) ? Number(mo) : MONTHS.indexOf(mo.slice(0, 3).toLowerCase()) + 1;
  const day = Number(d);
  if (!(month >= 1 && month <= 12 && day >= 1 && day <= 31)) return null;
  const year = y ? (y.length === 2 ? 2000 + Number(y) : Number(y)) : null;
  return { month, day, year, start: m.index, end: m.index + m[0].length };
}

/**
 * Every calendar day an answer writes, in order: `{month, day, year|null, start, end}` (1-based
 * month; `year` null when the answer leaves it out). Overlapping readings keep the earliest, longest.
 */
export function datesIn(text) {
  const s = String(text ?? "");
  const found = DATE_FORMS.flatMap((form) =>
    [...s.matchAll(form.re)].map((m) => dayOf(form.parts(m), m)).filter(Boolean),
  );
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept = [];
  for (const f of found) if (!kept.some((k) => f.start < k.end && k.start < f.end)) kept.push(f);
  return kept;
}

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const sameDay = (d, [y, m, day]) => d.month === m && d.day === day && (d.year ?? y) === y;

/** A date answer: the asked-for day among the days the answer writes, and no "or" between days. */
function gradeDate(given, options) {
  const dates = datesIn(given);
  const guess = dates.some((d, i) => {
    const next = dates[i + 1];
    return (
      next !== undefined &&
      !(next.month === d.month && next.day === d.day) &&
      /^[\s,;(]*or[\s(]*$/i.test(given.slice(d.end, next.start))
    );
  });
  if (guess) return { matched: false, why: "it offers a choice of dates — a guess" };
  for (const o of options) {
    const want = ISO_DAY.exec(o)?.slice(1).map(Number);
    const hit = want && dates.find((d) => sameDay(d, want));
    if (hit) return { matched: true, why: `"${given.slice(hit.start, hit.end)}" is ${o}` };
  }
  return {
    matched: false,
    why:
      dates.length === 0
        ? `no date in the answer (wanted ${options.join(" or ")})`
        : `${dates.map((d) => given.slice(d.start, d.end)).join(", ")} is not ${options.join(" or ")}`,
  };
}

/** Lower-cased word tokens (letters and digits), accents folded. */
export function tokens(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Is `n` within the expected number's tolerance? `abs` and `rel` are alternatives: either holds. */
export function withinTolerance(n, { value, abs = 0, rel = 0, ignoreSign = false }) {
  const [a, b] = ignoreSign ? [Math.abs(n), Math.abs(value)] : [n, value];
  const gap = Math.abs(a - b);
  return gap <= abs + 1e-9 || gap <= Math.abs(b) * rel + 1e-9;
}

/** A number answer: one amount within tolerance, not offered as a choice, not among bare rivals. */
function gradeNumber(given, expected) {
  const { hits, clean } = numberHits(given);
  const found = [...new Set(hits.map((h) => h.n))];
  if (found.length === 0) return { matched: false, why: "no number in the answer" };
  if (hedged(given)) return { matched: false, why: "it offers a choice of numbers — a guess" };
  const want = Math.abs(expected.value);
  const hit = hits.find((h) => withinTolerance(h.n, expected));
  const sized = (h) =>
    want > 0 && Math.abs(h.n) >= want / RIVAL_FACTOR && Math.abs(h.n) <= want * RIVAL_FACTOR;
  // "$412, or 8.3%" is one fact said two ways: an amount in another unit is no rival.
  const sameUnit = (h) => !(hit?.unit && h.unit && hit.unit !== h.unit);
  const rival = (h) =>
    !withinTolerance(h.n, expected) &&
    sized(h) &&
    sameUnit(h) &&
    !(hit && restates(h, hit)) &&
    !labelled(clean, hits, h);
  const rivals = [...new Set(hits.filter(rival).map((h) => h.n))];
  if (rivals.length > MAX_RIVALS) {
    return {
      matched: false,
      why: `${rivals.length} other bare amounts the size of the answer — it lists candidates, it does not answer`,
    };
  }
  return hit === undefined
    ? { matched: false, why: `${found.join(", ")} not within tolerance of ${expected.value}` }
    : { matched: true, why: `${hit.n} ≈ ${expected.value}` };
}

/** A text answer: a calendar day as a day, however it is written (#5009: "6 November 2026" for
 *  2026-11-06 failed on tokens); anything else by every token of the value or one alternative. */
function gradeText(given, expected) {
  const options = [expected.value, ...(expected.alternatives ?? [])];
  const days = options.filter((o) => ISO_DAY.test(o));
  if (days.length > 0) {
    const dated = gradeDate(given, days);
    if (dated.matched || days.length === options.length) return dated;
  }
  const have = new Set(tokens(given));
  const hit = options.find((o) => {
    const want = tokens(o);
    return !ISO_DAY.test(o) && want.length > 0 && want.every((t) => have.has(t));
  });
  return hit === undefined
    ? { matched: false, why: `none of ${JSON.stringify(options)} in the answer` }
    : { matched: true, why: `"${hit}" in the answer` };
}

/**
 * Grade one answer against a task's `answer`:
 *   {kind: "number", value, abs?, rel?, ignoreSign?}   a number in the answer within tolerance
 *   {kind: "text", value, alternatives?}               the day, if an ISO date; else every token
 *                                                      of value (or one alternative)
 * → `{matched, why}`.
 */
export function gradeAnswer(given, expected) {
  if (typeof given !== "string" || given.trim() === "") return { matched: false, why: "no answer" };
  if (expected?.kind === "number") return gradeNumber(given, expected);
  if (expected?.kind === "text") return gradeText(given, expected);
  return { matched: false, why: `task answer kind ${expected?.kind} is not number or text` };
}

/**
 * Was any of the region's snippets seen — ≥ SEEN_MIN inside the viewport and not covered — in any
 * of `frames` (each a `seen` list as session.mjs records it)? Returns the first frame that showed it.
 */
export function regionSeen(frames, region) {
  const want = new Set((Array.isArray(region) ? region : [region]).filter(Boolean));
  let best = 0;
  for (const [i, seen] of frames.entries()) {
    for (const s of seen ?? []) {
      if (!want.has(s.text)) continue;
      const ratio = s.covered ? 0 : s.ratio;
      best = Math.max(best, ratio);
      if (ratio >= SEEN_MIN) return { seen: true, frame: i, ratio };
    }
  }
  return { seen: false, frame: null, ratio: best };
}

/**
 * The verdict on one session. `opening` is the session's first frame (`{seen}`); `trace` its
 * records. Frames before the member's terminal action count; a run with no `done` (it gave up, or
 * ran out of steps) fails whatever it saw.
 */
export function grade({ task, opening, trace }) {
  const recs = trace.filter((r) => !r.refused);
  const endAt = recs.findIndex((r) => r.action.kind === "done" || r.action.kind === "give_up");
  const end = endAt >= 0 ? recs[endAt] : null;
  const before = endAt >= 0 ? recs.slice(0, endAt) : recs;
  const frames = [opening?.seen ?? [], ...before.map((r) => r.seen ?? [])];
  const region = regionSeen(frames, task.answerRegion);
  const endedBy = end ? end.action.kind : "cap";
  const answer =
    endedBy === "done"
      ? { given: end.action.answer ?? "", ...gradeAnswer(end.action.answer, task.answer) }
      : {
          given: null,
          matched: false,
          why: endedBy === "give_up" ? "gave up" : "ran out of steps",
        };
  const success = endedBy === "done" && answer.matched && region.seen;
  const reason = success
    ? "answer matches and its place was on screen"
    : !answer.matched
      ? answer.why
      : `answer region never ≥ ${SEEN_MIN * 100}% on screen (best ${Math.round(region.ratio * 100)}%)`;
  return { success, endedBy, answer, region, reason };
}
