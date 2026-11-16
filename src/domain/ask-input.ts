/**
 * THE SHAPE OF AN ASK'S INPUT — a ticker's shape and a member's words as one line, with no imports
 * and no file reads. `campaigns.ts` reads `src/domain/campaigns/` from the working directory the
 * moment it is imported, so anything that only needs these checks imports them from here instead.
 * The chat's research-question tool (`companion/companion-research-ask.ts`) is the reason: the
 * study composer loads the chat's tools from a frozen corpus that holds no campaign files (#7300).
 * `campaigns.ts` and `discovery-queue.ts` re-export both, so their importers are unchanged.
 */

/** An uppercase ticker: a letter, then up to nine letters, digits or dots (BRK.B). */
export const SYMBOL_RE = /^[A-Z][A-Z0-9.]{0,9}$/;

/** The longest question a member's words may run to (criterion 9: capped at 200 characters). */
export const QUESTION_MAX = 200;

/** A member's words as one tidy line of at most `QUESTION_MAX` characters, or undefined when empty. */
export function cleanQuestion(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  // Control characters (a NUL, a bell, an escape) become spaces, then runs of space collapse.
  const spaced = Array.from(raw, (ch) =>
    ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127 ? " " : ch,
  );
  const line = spaced.join("").replace(/\s+/g, " ").trim();
  return line.length > 0 ? line.slice(0, QUESTION_MAX) : undefined;
}
