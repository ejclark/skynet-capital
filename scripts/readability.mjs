#!/usr/bin/env node
// A cheap, dependency-free, ADVISORY-ONLY readability signal — Flesch-Kincaid grade level.
//
// WHY THIS IS ADVISORY, NEVER A GATE (Eric, 2026-08-30, on integrating NLP into the process):
// the research is explicit that no readability formula is universally valid — one calibrated on
// general prose scores poorly on legal or technical text (arXiv:2510.10801 and the practitioner
// literature UXmatters' "7 reasons to avoid readability formulas" both make this point). This
// repo's own `needs-eric` capsules and EARS acceptance criteria are exactly that mismatch case:
// necessarily precise vocabulary that a generic formula will flag as "hard," which would make
// this the same "a check validates the wrong artefact and reports success forever" failure class
// docs/LESSONS.md already names five times over if it were ever gated. It exists here purely as
// a fast, free pre-check before reaching for `linguist`'s heavier LLM-based comprehension review
// (docs/ISSUES.md rule 4) — never a replacement for it, and never blocking.
//
// Syllable counting is a heuristic (vowel-group counting with common English suffix adjustments),
// not a dictionary lookup — it will be wrong on some words. That imprecision is acceptable for an
// advisory signal and is exactly why this file exports the pure math for direct unit testing
// (tests/arch/readability.spec.ts) rather than asking anyone to trust it blindly.

const VOWEL_GROUPS = /[aeiouy]+/g;

/** Approximate syllable count for one English word. */
export function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length === 0) return 0;
  if (w.length <= 3) return 1;
  const stripped = w.replace(/e$/, "").replace(/^y/, "");
  const matches = stripped.match(VOWEL_GROUPS);
  return matches ? Math.max(matches.length, 1) : 1;
}

/** Strip markdown syntax that would otherwise skew word/sentence counts (code, links, table
 *  pipes, heading/bullet/blockquote markers, emphasis) — leaves plain prose behind. Call this
 *  before `fleschKincaidGrade` on any markdown input; the grade function itself assumes prose. */
export function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^>\s?\[![A-Z]+\]\s*/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\|/g, " ")
    .replace(/[*_~]{1,3}/g, "");
}

/**
 * Flesch-Kincaid Grade Level on plain prose text. Returns `null` when there's too little text to
 * measure meaningfully (avoids a nonsense score on a one-word line or a bare label).
 *
 * Call `stripMarkdown` first on markdown input — this function does no markdown handling of its
 * own, so a raw `## Heading` or `` `code` `` would corrupt the word/sentence counts.
 */
export function fleschKincaidGrade(text) {
  const words = text.match(/[A-Za-z']+/g) ?? [];
  if (words.length < 5) return null;
  const sentenceCount = (text.match(/[.!?]+/g) ?? []).length || 1;
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const grade = 0.39 * (words.length / sentenceCount) + 11.8 * (syllables / words.length) - 15.59;
  return Math.round(grade * 10) / 10;
}
