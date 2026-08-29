// Token-structural safe widening (2026-08-29, #716/#858) — split out of envelope-scan.mjs to stay
// under noExcessiveLinesPerFile, the same way scripts/research/*.mjs splits a large study into
// cohesive sibling modules rather than one file.
//
// classifyDiff's pure-insertion rule reads a diff as TEXT: a changed source line looks identical
// whether it safely widened a union type (`"a" | "b"` → `"a" | "b" | "c"`) or silently mutated one
// (`"a"` → `"x"`) — both are one line, old text, new text. That blocked #716's stop-limit order
// type from qualifying for the diffAware exemption even though the actual change — a TypeScript
// union gaining a member — carries the exact same safety property a pure insertion does: nothing
// that already worked can start behaving differently, because nothing that already existed changed
// meaning. Rather than add a second bespoke text-pattern (and a third, and a fourth, for the next
// shape that needs it), this generalizes classifyDiff's OWN rule — "nothing existing was removed,
// only new content was added" — from LINE granularity to TOKEN granularity: lex both file versions
// with the real TypeScript scanner and check that every token in OLD still appears in NEW, in the
// same order (a subsequence match). Whatever tokens in NEW aren't part of that match are the
// genuinely new content, held to the same bar a pure insertion already is: no new mutating broker
// call. This is one rule with no type-shape-specific case at all — a widened union, a new optional
// field, a new overload, a new interface member all fall out of it uniformly, because each is just
// "old tokens, plus new tokens spliced in," which is exactly what a token subsequence match detects
// regardless of what TypeScript construct the tokens happen to spell out.
//
// (Aside not affecting the logic above: `typescript` 7 restructured its npm package and dropped the
// classic `createSourceFile`/full-AST parse API from its public surface — only the scanner and the
// syntax-kind/flag enums remain exported, under `typescript/unstable/ast`. A token-level rule turns
// out to need only the scanner anyway, so this isn't a workaround for that change, just a fit.)
//
// Additive to classifyDiff, never a replacement: a diff is additiveSafe when EITHER rule says so.
// Fails CLOSED on anything ambiguous — an unmatched old token, an unterminated string/template, a
// mutating call anywhere in the inserted spans — reads as NOT safe, same philosophy as classifyDiff
// treating "no diff" as null rather than as "safe by default".
//
// KNOWN LIMITATION, accepted rather than solved here: a subsequence match is ORDER-preserving, so a
// formatter re-sorting existing statements (e.g. alphabetizing imports) around an unrelated addition
// can make an otherwise-safe change fail this check — reordered content reads the same as removed-
// then-different-content-added-elsewhere to a subsequence match. That fails toward "held for review"
// (the safe direction), never toward "wrongly exempted" — a real gap to close later, not a bug.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createScanner, LanguageVariant, SyntaxKind } from "typescript/unstable/ast";

const ROOT = process.cwd();

// Shared with classifyDiff in envelope-scan.mjs (see $diffAwareComment in envelope.json for the
// calibration): a brand-new capability to place/cancel/mutate a real order stays gated even as a
// pure addition (see cancelOrder, #680) — that bar applies at token granularity exactly as it does
// at line granularity.
export const MUTATING_CALL_PATTERNS = [
  /\.post\(/,
  /\.put\(/,
  /\.delete\(/,
  /\bfetch\(/,
  /execFileSync\(/,
  /execSync\(/,
];

/** Lex `source` with the real TypeScript scanner. Returns `ok: false` (never throws) when scanning
 *  hits an unterminated string/template/comment — a genuine lexical break, not just "a shape this
 *  rule doesn't recognize" — so the caller can fail closed on it rather than risk matching tokens
 *  either side of a construct the scanner itself couldn't fully make sense of. */
function tokenize(source) {
  const scanner = createScanner(/* skipTrivia */ true, LanguageVariant.Standard, source);
  const tokens = [];
  let ok = true;
  // A bare scan() can't tell a template literal's closing `}...` from an ordinary object-literal
  // close brace — that distinction is normally the PARSER's job, driving the scanner's
  // reScanTemplateToken() at the right moment. This tracks just enough of that (a stack of "does
  // this open brace belong to a pending template substitution, or something else") to re-lex
  // correctly without a full parser: a `TemplateHead`/`TemplateMiddle` opens a substitution; the `}`
  // that closes it must be re-scanned as template text, not taken as a plain CloseBraceToken.
  const braceStack = [];
  const record = (kind) => {
    if (scanner.isUnterminated()) ok = false;
    tokens.push({
      kind,
      text: scanner.getTokenText(),
      start: scanner.getTokenStart(),
      end: scanner.getTokenEnd(),
    });
  };
  let kind = scanner.scan();
  while (kind !== SyntaxKind.EndOfFile) {
    if (kind === SyntaxKind.CloseBraceToken && braceStack.at(-1) === "template") {
      braceStack.pop();
      kind = scanner.reScanTemplateToken(/* isTaggedTemplate */ false);
      record(kind);
      if (kind === SyntaxKind.TemplateMiddle) braceStack.push("template");
      kind = scanner.scan();
      continue;
    }
    if (kind === SyntaxKind.TemplateHead || kind === SyntaxKind.TemplateMiddle)
      braceStack.push("template");
    else if (kind === SyntaxKind.OpenBraceToken) braceStack.push("other");
    else if (kind === SyntaxKind.CloseBraceToken) braceStack.pop();
    record(kind);
    kind = scanner.scan();
  }
  return { tokens, ok };
}

/** Greedy leftmost subsequence match: for each old token in order, find the next new token (at or
 *  after the current cursor) with the same kind AND text. Greedy-earliest is always a safe choice
 *  for a subsequence test — matching any later occurrence can never help a token still to come, only
 *  cost it room — so this is a complete test, not a heuristic. Returns the matched NEW-token indices
 *  (strictly increasing, same length as `oldTokens`) or null the first old token that has nothing
 *  left to match: removed, renamed, or reordered ahead of where a match could still be found. */
function matchSubsequence(oldTokens, newTokens) {
  const matched = [];
  let cursor = 0;
  for (const oldTok of oldTokens) {
    let i = cursor;
    while (
      i < newTokens.length &&
      !(newTokens[i].kind === oldTok.kind && newTokens[i].text === oldTok.text)
    ) {
      i += 1;
    }
    if (i === newTokens.length) return null;
    matched.push(i);
    cursor = i + 1;
  }
  return matched;
}

/** Token-structural safe widening: is every token that existed in OLD still present in NEW, in the
 *  same order, with the tokens spliced in between introducing no new mutating broker call? Pure —
 *  the specs drive this directly. Fails closed (returns false) on an unterminated lexical construct
 *  or any token this rule can't match forward, rather than guessing "safe" on ambiguity. */
export function classifyStructuralWidening(oldSource, newSource) {
  const oldLexed = tokenize(oldSource);
  const newLexed = tokenize(newSource);
  if (!(oldLexed.ok && newLexed.ok)) return false;

  const matched = matchSubsequence(oldLexed.tokens, newLexed.tokens);
  if (!matched) return false; // something old is gone, renamed, or reordered — never safe

  const matchedSet = new Set(matched);
  const insertedRanges = [];
  let rangeStart = null;
  newLexed.tokens.forEach((tok, i) => {
    if (matchedSet.has(i)) {
      if (rangeStart !== null) insertedRanges.push([rangeStart, tok.start]);
      rangeStart = null;
    } else if (rangeStart === null) {
      rangeStart = tok.start;
    }
  });
  if (rangeStart !== null) insertedRanges.push([rangeStart, newSource.length]);

  const insertedText = insertedRanges.map(([from, to]) => newSource.slice(from, to)).join("\n");
  return !MUTATING_CALL_PATTERNS.some((p) => p.test(insertedText));
}

/** Full file content at a git ref, or null if the file does not exist there — a create or delete
 *  is what classifyDiff's pure-insertion rule already handles correctly on its own, so this rule
 *  only ever runs when both versions genuinely exist. Byte-exact (no .trim(), unlike the shared
 *  `git` helper) — an old/new equality check further down depends on trailing-newline fidelity,
 *  which `readFileSync` on the working-tree file also never strips. */
function contentAt(ref, path) {
  try {
    return execFileSync("git", ["show", `${ref}:${path}`], { cwd: ROOT, encoding: "utf8" });
  } catch {
    return null;
  }
}

/** Second opinion for a diffAware path the line-based rule did not already clear: does the token
 *  scan say this is a safe structural widening? Only tried for TypeScript source (the only language
 *  this scanner reads) and only when both versions exist. */
export function structurallySafe(path, base) {
  if (!/\.tsx?$/.test(path)) return false;
  const oldContent = contentAt(base, path);
  if (oldContent === null) return false;
  let newContent;
  try {
    newContent = readFileSync(join(ROOT, path), "utf8");
  } catch {
    return false; // deleted in the working tree — not this rule's case either
  }
  // Identical content is "no change", not "safe" — classifyDiff already treats those as distinct
  // (null, never additiveSafe:true) so a caller never reads "nothing to compare" as "cleared";
  // this rule fails the same way rather than trivially matching an empty edit as a safe widening.
  if (oldContent === newContent) return false;
  return classifyStructuralWidening(oldContent, newContent);
}
