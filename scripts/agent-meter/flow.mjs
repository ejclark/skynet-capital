// How much of what Eric types is him managing a session rather than asking for work (#6470).
//
// Eric, 2026-11-01: "this is a essential to optimize your configuration to enable me to retain a flow
// state". A hand read that day found 141 of his 184 typed messages managing the session; a replay of
// the page written from it barely moved a session's reading of him. So the page is not what binds: what
// surrounds a message is, and the number to watch is this share falling. A person cannot re-read every
// message each week, so these rules repeat the read, pinned by tests/scripts/agent-meter-flow.spec.ts.
//
// THEY UNDERCOUNT, ON PURPOSE. A rule catches a short, plain message. It misses a settled call he had
// to restate, a stalled session he nudged, and a page he could not read, because those read like work.
// So this compares with its own earlier readings, never with the hand read, and prints both.
//
// Transcript text is his own and never leaves this machine: only counts are printed.
import { createReadStream, statSync } from "node:fs";
import { createInterface } from "node:readline";
import { digestLines, recent } from "../dream-digest.mjs";

/** The first (and only) hand read, and what these rules made of the same messages. */
export const HAND_READ = Object.freeze({
  date: "2026-11-01",
  managing: 141,
  typed: 184,
  rulesCaught: 72,
});

const KINDS = [
  "status",
  "try-again",
  "spotted-fault",
  "quote-back",
  "done-report",
  "word-confusion",
  "other",
];

// A message's length is most of the signal: past these, a failure word or "status" is the subject of
// real work or of thinking out loud, not him stopping to manage the session.
const STATUS_WORDS = 12;
const FAULT_WORDS = 15;
const SHORT_QUESTION_WORDS = 8;
const DONE_WORDS = 8;
const TRY_AGAIN_WORDS = 5;
const CONFUSION_WORDS = 12;
const WHAT_IS_WORDS = 7;

const STATUS =
  /\b(?:progress|status|updates?|eta|how'?s|how is|waiting|what'?s next|what remains|anything else|still (?:running|working)|where are we|where do we stand|(?:any|anything)(?: \w+){0,2} (?:left|remaining))\b/i;
const FAULT =
  /\b(?:fail(?:s|ed|ing|ure)?|broken?|(?:does|is|wo)n'?t (?:load|work|render|accessible)|not (?:loading|working|accessible)|crash(?:es|ed|ing)?|50[0-9]|404|error)\b/i;
const DONE = /^(?:all )?(?:done|merged|marked done|submitted|answered|approved)\b|\bdone[.!]?$/i;
const OWN_DONE =
  /^(?:i|i've|i have|just)\s+(?:merged|approved|answered|submitted|finished|filled|responded|said done)\b/i;
const CONFUSED =
  /\bno idea what\b|\bdon'?t (?:understand|follow)\b|\bwhat do you mean\b|\bwhat does .+ mean\b|\bunclear\b|\bconfus(?:ed|ing)\b/i;
const WHAT_IS = /^what(?:'s| is| are)\b.*\?$/i;

const wordsIn = (text) =>
  text
    .replace(/https?:\/\/\S+/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

/** One message's kind, from its words alone. The first rule that matches wins. */
export function classify(raw) {
  // A phone types a curly apostrophe, and a reply from a page arrives under a marker comment.
  const text = raw
    .replace(/’/g, "'")
    .replace(/^\s*<!--.*?-->/, "")
    .trim();
  const words = wordsIn(text);
  if (text.startsWith(">")) return "quote-back";
  if (words <= TRY_AGAIN_WORDS && /\b(?:try again|retry)\b/i.test(text)) return "try-again";
  if (words <= DONE_WORDS && (DONE.test(text) || OWN_DONE.test(text))) return "done-report";
  if (words <= STATUS_WORDS && STATUS.test(text)) return "status";
  if (words <= CONFUSION_WORDS && CONFUSED.test(text)) return "word-confusion";
  if (words <= WHAT_IS_WORDS && WHAT_IS.test(text)) return "word-confusion";
  if (words <= FAULT_WORDS && FAULT.test(text)) return "spotted-fault";
  return "other";
}

/** Two wordings of one question reduce to one form: "any updates?", "update?" and "Update." alike. */
const stem = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !["any", "the", "a", "so", "please", "pls"].includes(word))
    .map((word) => word.replace(/s$/, ""))
    .join(" ");

/** A session's kinds in order: a short question he asks again is status, whatever its words. */
function kindsOf(typed) {
  const asked = new Set();
  return typed.map(({ text }) => {
    const form = stem(text);
    const isShortQuestion = wordsIn(text) <= SHORT_QUESTION_WORDS && text.trim().endsWith("?");
    const ruled = classify(text);
    const repeat = asked.has(form) && (ruled === "status" || isShortQuestion);
    if (ruled === "status" || isShortQuestion) asked.add(form);
    return { kind: repeat ? "status" : ruled, repeat };
  });
}

/** A count of each kind, the share that manage the session, and the status questions asked again. */
export function flowOf(sessions, window) {
  const counted = new Set();
  const byKind = Object.fromEntries(KINDS.map((kind) => [kind, 0]));
  let typed = 0;
  let repeatedStatus = 0;
  for (const session of sessions) {
    // Repeats are read on the whole session, so one asked before the window still makes a repeat in it.
    const kinds = kindsOf(session.typed);
    session.typed.forEach((message, i) => {
      const at = Date.parse(message.at);
      if (at < window.sinceMs || at > window.untilMs) return;
      // A resumed session copies its rows into a new file, so the same message can be read twice.
      const key = `${message.at}|${message.text.slice(0, 40)}`;
      if (counted.has(key)) return;
      counted.add(key);
      typed += 1;
      byKind[kinds[i].kind] += 1;
      if (kinds[i].repeat) repeatedStatus += 1;
    });
  }
  const managing = typed - byKind.other;
  return {
    verdict: "read",
    sessions: sessions.length,
    typed,
    managing,
    share: typed ? Math.round((managing / typed) * 100) : null,
    byKind,
    repeatedStatus,
    handRead: HAND_READ,
  };
}

// Text a session or a stage wrote, which reaches a transcript looking like a person typed it. The
// harness's own rows are dream-digest's filter; these are what a person's chat adds on top of it.
const NOT_TYPED = [
  /^Done with steering round\b/,
  /^\[Artifact comment\b/,
  /^\[Workflow harness\b/,
  /^Run exactly\b/,
  /^You are /,
  /^Your task is\b/,
  /^Review (?:target|merged PR)\b/,
  /^(?:An independent|An earlier builder|A reviewer claims|Blind grader)\b/,
  /^# Orient\b/,
  /^\/[a-z-]+\s*$/,
];
const BRIEF_CHARS = 1200; // dream-digest's cap: an opening this long reached it, so a session wrote it

/** A transcript's lines reduced to what he typed: the digest's filter, then a session's own briefs. */
export function typedBy(lines) {
  return digestLines(lines).typed.filter(
    (message, i) =>
      !(
        (i === 0 && message.text.length >= BRIEF_CHARS) ||
        NOT_TYPED.some((shape) => shape.test(message.text.trim()))
      ),
  );
}

/** Only user rows reach the digest here: a transcript can run to hundreds of megabytes of tool output. */
async function userLines(path) {
  const lines = [];
  const reader = createInterface({
    input: createReadStream(path),
    crlfDelay: Number.POSITIVE_INFINITY,
  });
  for await (const line of reader) if (line.includes('"type":"user"')) lines.push(line);
  return lines;
}

const NO_TRANSCRIPTS = "no transcripts on this machine; read it where the sessions ran";

/** The reading, or unknown when this machine holds no transcripts: never zero. */
export async function readFlow(window) {
  let all;
  try {
    all = recent(Number.MAX_SAFE_INTEGER);
  } catch {
    all = [];
  }
  if (!all.length) return { verdict: "unknown", window, line: NO_TRANSCRIPTS, handRead: HAND_READ };
  // A file last written before the window began holds nothing in it.
  const inWindow = all.filter((path) => statSync(path).mtimeMs >= window.sinceMs);
  const sessions = [];
  for (const path of inWindow) sessions.push({ path, typed: typedBy(await userLines(path)) });
  return { window, ...flowOf(sessions, window) };
}
