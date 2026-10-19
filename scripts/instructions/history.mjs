// History in a rule file: the cheap eye for docs/ENGINEERING.md → *Instruction files*, rule 2
// ("rules are in the present tense"). It notes a PR or issue number told as a story, and "used to" /
// "no longer" / "is now" measured against a version the reader never saw. Surfaced as advisory
// notes by scripts/agent-surface-scan.mjs; the model's read of the same class is
// docs/grind/instruction-drift.instructions.md → check C.
//
// WHY so narrow: a bare reference is usually a pointer to where a mechanism lives ("the plan is
// #5143"), which the rule keeps. Measured over the 50 rule files on 2026-10-18: any reference at
// all would note 87 lines; a reference whose sentence carries a past-tense verb notes 15, and the
// migration phrases 2 more, all but 3 or 4 of the 17 real stories. A note that fires on pointers is
// noise a session learns to skip. Eric's dated words are the rule's why (rule 3), so a sentence
// carrying them is never noted.
//
// Pure: a caller hands in the text; the file walk lives with the caller.
import { isInstructionFile } from "./scope.mjs";

/** The files that are orders, line by line: skills, agents, lane prompts, grind chores. Reference
 *  cards, docs pages and ledgers are explanation or record, and stay out. */
const RULE_FILE = [
  /^\.claude\/skills\/.+\/SKILL\.md$/,
  /^\.claude\/agents\/[^/]+\.md$/,
  /^\.github\/prompts\/[^/]+\.md$/,
  /^docs\/grind\/[^/]+\.instructions\.md$/,
];

/** True when a repo-relative POSIX path is a rule file this note reads. */
export function isRuleFile(path) {
  return isInstructionFile(path) && RULE_FILE.some((re) => re.test(path));
}

/** `#1234` as a PR or issue number — not a hex colour, an anchor (`X.md#12`) or a URL fragment. */
const REF = /(?<![\w&/#-])#\d{2,6}\b/g;
/** The verbs that turn a reference into a story about what happened. */
const PAST =
  /\b(was|were|did|had|found|missed|let|produced|collided|broke|merged|shipped|returned|caught|happened|created|turned|ran|failed|lost|dropped|stopped|replaced|retired|removed|introduced|resolved|discovered|surfaced|earned|showed|leaked|landed|left|filed|precedent)\b/gi;
const MIGRATION = /\b(used to|no longer|is now)\b/gi;
/** Eric's dated words — `(Eric, 2026-09-04: "…")` — the reason a rule keeps. */
const PROVENANCE = /\bEric,? \d{4}-\d{2}-\d{2}/;

/** Quoted and inline-code spans are examples or someone's words, never the rule's own claim. */
const unquote = (line) =>
  line
    .replace(/`[^`]*`/g, "``")
    .replace(/"[^"]*"/g, '""')
    .replace(/“[^”]*”/g, "“”");

const wordBefore = (s, at) =>
  s
    .slice(0, at)
    .match(/(\w+)\s+$/)?.[1]
    ?.toLowerCase() ?? "";
const wordAfter = (s, at) =>
  s
    .slice(at)
    .match(/^\s+(\w+)/)?.[1]
    ?.toLowerCase() ?? "";
const RELATIVE = new Set(["that", "which", "who"]);
/** Words before an imperative "let" ("read #5143 and let the lane build it"); a sentence-initial
 *  "let" is one too. After a subject ("arming by hand let three PRs merge") it is the past tense. */
const IMPERATIVE_BEFORE = new Set(["", "and", "or", "then", "to", "please", "just"]);

/** A past verb that tells a story: not one describing a referent ("a build that stopped"), an
 *  ongoing state ("no session was listening") or an order ("let the lane build it"). */
function storyVerb(sentence) {
  for (const m of sentence.matchAll(PAST)) {
    const before = wordBefore(sentence, m.index);
    if (RELATIVE.has(before)) continue;
    const verb = m[0].toLowerCase();
    if (verb === "let" && IMPERATIVE_BEFORE.has(before)) continue;
    if (
      (verb === "was" || verb === "were") &&
      wordAfter(sentence, m.index + verb.length).endsWith("ing")
    )
      continue;
    return m[0];
  }
  return null;
}

/** A migration phrase that compares the rule with its past: not a passive "was used to", a
 *  relative "that no longer exists", or a purpose "so the scanner no longer reads it". */
function migrationPhrase(sentence) {
  for (const m of sentence.matchAll(MIGRATION)) {
    const phrase = m[0].toLowerCase();
    const before = sentence.slice(0, m.index);
    if (phrase === "used to" && /\b(was|were|be|been|being|is|are|gets?)\s+$/i.test(before))
      continue;
    if (
      phrase === "no longer" &&
      (RELATIVE.has(wordBefore(sentence, m.index)) || /\bso\b[^,]*$/i.test(before))
    )
      continue;
    return phrase;
  }
  return null;
}

/** The prose lines of a markdown file, 1-indexed: frontmatter, fences and blockquotes are left
 *  out, because there the text is metadata or an example, not the rule's own claim. */
function* proseLines(text) {
  const lines = text.split(/\r?\n/);
  let inFrontmatter = lines[0]?.trim() === "---";
  let inFence = false;
  for (const [i, raw] of lines.entries()) {
    if (inFrontmatter) {
      if (i > 0 && raw.trim() === "---") inFrontmatter = false;
    } else if (/^\s*(```|~~~)/.test(raw)) {
      inFence = !inFence;
    } else if (!(inFence || /^\s*>/.test(raw))) {
      yield { line: i + 1, text: unquote(raw) };
    }
  }
}

/** The notes one sentence earns. Eric's dated words are the rule's why, so they earn none. */
function sentenceNotes(sentence, line) {
  if (PROVENANCE.test(sentence)) return [];
  const notes = [];
  const refs = sentence.match(REF);
  const verb = refs && storyVerb(sentence);
  if (verb)
    notes.push({
      line,
      kind: "pr-narrative",
      detail: `${refs.join(", ")} told as a story ("${verb}") — state the rule; keep the number only as a pointer`,
    });
  const phrase = migrationPhrase(sentence);
  if (phrase)
    notes.push({
      line,
      kind: "migration",
      detail: `"${phrase}" measures the rule against a version the reader never saw — say what is true`,
    });
  return notes;
}

/** Notes for one rule file's text: `{line, kind: "pr-narrative" | "migration", detail}`. */
export function historyNotes(text) {
  const notes = [];
  for (const { line, text: prose } of proseLines(text))
    for (const sentence of prose.split(/(?<=[.;!?])\s+/))
      notes.push(...sentenceNotes(sentence, line));
  return notes;
}
