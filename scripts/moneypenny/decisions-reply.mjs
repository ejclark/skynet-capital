// DECISIONS REPLY — #7939 slice 2. One reply on the decisions page answers many asks:
//
//   1A 2B 3 not now          by the number on the page
//   7669 A, 7670 B           by issue number (`#7669: A` too)
//   3 AB                     an ask with two questions takes one letter each, in order
//   4 yes                    an ask with no letters takes yes · no · not now
//
// WHY A SECOND READER, NOT readAnswer. `answer-readback.mjs`'s `readAnswer` reads ONE ask's reply;
// this reads which ask each part of a reply is for, then holds each part to that ask's card the same
// way (a letter must be on the card, one per question; yes/no only where no letter is offered).
//
// NEVER GUESS. Whatever parses unambiguously is applied; everything else comes back in `unread`
// with the reason, and the receipt echoes it. A part touched by words this cannot read ("don't do
// 1A", "2B but only if cheap", "1A?") is unread, not trimmed to its letter: a misread clears a real
// ask. A line with no number on it is not an answer to anything; it comes back in `notes`.
//
// NUMBERS ARE READ AS OF THE REPLY. Each page entry carries when it got its number (`since`) and,
// once off the page, when it left (`until`), so "3A" means the ask that was 3 when he wrote it.
// Pure: no network, no clock.

/** Words before the first number that only introduce the reply ("Answers: 1A 2B"). */
const LEAD_IN = new Set(["answers", "answer", "reply", "re", "here", "ok", "okay", "decisions"]);
/** Words that join parts and change nothing ("1A and 2B, thanks"). */
const FILLER = new Set(["and", "&", "+", "thanks", "thx", "ty", "please", "pls"]);
/** Plain answers, after two-word phrases are joined. */
const WORDS = new Map([
  ["yes", "yes"],
  ["yep", "yes"],
  ["yeah", "yes"],
  ["approved", "yes"],
  ["approve", "yes"],
  ["ok", "yes"],
  ["okay", "yes"],
  ["do it", "yes"],
  ["go ahead", "yes"],
  ["no", "no"],
  ["nope", "no"],
  ["not now", "deferred"],
  ["later", "deferred"],
  ["park", "deferred"],
  ["park it", "deferred"],
  ["defer", "deferred"],
]);
const PAIRS = new Set(["not now", "park it", "do it", "go ahead"]);
/** `1A`, `#7669:A`, `3AB`, `7669` — a reference with any letters stuck to it. */
const REF = /^(#?)(\d+)[.:)]?((?:[A-F]\d?)*|[a-f]\d?)$/;
/** Standalone letters: `A`, `AB`, or one lowercase `a` (two lowercase letters are a word: "be"). */
const KEYS = /^(?:(?:[A-F]\d?)+|[a-f]\d?)$/;

const keysOf = (s) => (s.toUpperCase().match(/[A-F]\d?/g) ?? []).filter(Boolean);

/** One line's tokens: arrows and `=` are separators; markdown and closing punctuation are not
 *  meaning, but a `?` is — a token keeping it reads as a question, and so as prose. */
function tokens(line) {
  const raw = line
    .replace(/->|→|=>|=/g, " ")
    .split(/[\s,;]+/)
    .map((t) => t.replace(/^[("'“*_`]+/, "").replace(/[.!)"'”*_`:]+$/, ""))
    .filter((t) => t && !/^[-–—:]+$/.test(t));
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const pair = `${raw[i]} ${raw[i + 1] ?? ""}`.toLowerCase();
    if (PAIRS.has(pair)) {
      out.push(pair);
      i++;
    } else out.push(raw[i]);
  }
  return out;
}

/**
 * The parts of a reply, before any page is consulted: `{ ref, hash, keys, words, prose, raw }` per
 * number, and `notes` for lines that carry no number. Pure.
 */
export function segmentReply(text = "") {
  const segments = [];
  const notes = [];
  for (const line of String(text ?? "").split("\n")) {
    if (/^\s*>/.test(line) || !line.trim()) continue; // a quote of the page is not his answer
    let cur = null;
    let taintNext = false;
    let leading = true;
    const lineSegs = [];
    for (const t of tokens(line)) {
      const lower = t.toLowerCase();
      const ref = REF.exec(t);
      if (ref) {
        cur = { ref: Number(ref[2]), hash: ref[1] === "#", keys: keysOf(ref[3]), words: [] };
        cur.prose = taintNext;
        cur.raw = [t];
        taintNext = false;
        leading = false;
        lineSegs.push(cur);
        continue;
      }
      if (cur && WORDS.has(lower) && !(lower === "ok" && cur.keys.length)) {
        cur.words.push(WORDS.get(lower));
        cur.raw.push(t);
        continue;
      }
      if (cur && KEYS.test(t)) {
        cur.keys.push(...keysOf(t));
        cur.raw.push(t);
        continue;
      }
      if (FILLER.has(lower) || (leading && LEAD_IN.has(lower))) continue;
      // Prose: the part before it and the part after it, on this line, are both unread.
      if (cur) {
        cur.prose = true;
        cur.raw.push(t);
      }
      taintNext = true;
    }
    if (!lineSegs.length) notes.push(line.trim());
    segments.push(...lineSegs.map((s) => ({ ...s, raw: s.raw.join(" ") })));
  }
  return { segments, notes };
}

const live = (e, at) => (e.since ?? 0) <= at && (e.until == null || at < e.until);

/** Which page entry a part means, or why it means none. */
function resolve(seg, entries, at) {
  const byIssue = entries.find((e) => e.issue === seg.ref && e.until == null);
  const byIssueGone = entries.find((e) => e.issue === seg.ref && e.until != null);
  if (seg.hash) {
    if (byIssue) return { entry: byIssue };
    if (byIssueGone) return { why: `#${seg.ref} is already off the page` };
    return { why: `#${seg.ref} is not on the page` };
  }
  const byList = entries.find((e) => e.n === seg.ref && live(e, at));
  const issueHit = byIssue ?? byIssueGone;
  if (issueHit && byList && issueHit !== byList)
    return { why: `${seg.ref} is both an issue and a number on the page` };
  const entry = byList ?? issueHit;
  if (!entry) return { why: `nothing on the page is numbered ${seg.ref}` };
  if (entry.until != null && entry.until <= at)
    return { why: `#${entry.issue} was already off the page` };
  if (entry.until != null) return { why: `#${entry.issue} was cleared before this was read` };
  return { entry };
}

/** The answer a part gives its ask's card, or why it gives none. Mirrors `readAnswer`'s rules. */
function answerFor(seg, card) {
  if (seg.prose) return { why: "it has words I don't read as an answer" };
  const words = [...new Set(seg.words)];
  if (seg.keys.length && words.length) return { why: "it mixes a letter and a word" };
  if (words.length > 1) return { why: "it gives more than one answer" };
  const items = card?.items ?? [];
  const offered = items.some((it) => (it.keys ?? []).length);
  if (words.length === 1) {
    if (words[0] === "deferred") return { answer: { kind: "deferred" } };
    if (offered) return { why: `its card asks for a letter, not "${words[0]}"` };
    return { answer: { kind: words[0] } };
  }
  if (!seg.keys.length) return { why: "no answer follows the number" };
  if (!offered) return { why: 'its card offers no letters; reply yes, no or "not now"' };
  if (seg.keys.length !== items.length) {
    const n = items.length;
    return { why: `it asks ${n} question${n === 1 ? "" : "s"}; give one letter for each` };
  }
  const picks = [];
  for (const [item, key] of seg.keys.entries()) {
    if (!(items[item]?.keys ?? []).includes(key)) {
      return {
        why: `option ${key} is not on its card${items.length > 1 ? " for that question" : ""}`,
      };
    }
    picks.push({ item, key });
  }
  return { answer: { kind: "option", picks } };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Read one reply against the page as it stood when he wrote it.
 *
 * @param {string} text the reply
 * @param {{ entries: {n: number, issue: number, since?: number, until?: number|null,
 *   card?: {items: {keys: string[]}[]}|null}[], replyAt: number }} page
 * @returns {{ applied: {issue: number, n: number, answer: object, raw: string}[],
 *   unread: {raw: string, why: string}[], notes: string[], referenced: boolean }}
 */
export function readDecisionsReply(
  text,
  { entries = [], replyAt = Number.POSITIVE_INFINITY } = {},
) {
  const { segments, notes } = segmentReply(text);
  const unread = [];
  const found = [];
  for (const seg of segments) {
    const { entry, why } = resolve(seg, entries, replyAt);
    if (!entry) {
      unread.push({ raw: seg.raw, why });
      continue;
    }
    const got = answerFor(seg, entry.card);
    if (got.answer)
      found.push({ issue: entry.issue, n: entry.n, answer: got.answer, raw: seg.raw });
    else unread.push({ raw: seg.raw, why: `#${entry.issue}: ${got.why}` });
  }
  // One ask answered twice: the same answer is applied once; two different answers, neither.
  const applied = [];
  for (const f of found) {
    const all = found.filter((g) => g.issue === f.issue);
    if (all.some((g) => !same(g.answer, f.answer))) {
      if (all[0] === f)
        unread.push({
          raw: all.map((g) => g.raw).join(" / "),
          why: `#${f.issue} is answered twice, differently`,
        });
      continue;
    }
    if (all[0] === f) applied.push(f);
  }
  return { applied, unread, notes, referenced: segments.length > 0 };
}

/** How an answer reads in a receipt: `A`, `A, B` for two questions, `yes`, `not now`. Pure. */
export function saidOf(answer) {
  if (answer?.kind === "option") return answer.picks.map((p) => p.key).join(", ");
  return answer?.kind === "deferred" ? "not now" : String(answer?.kind ?? "");
}
