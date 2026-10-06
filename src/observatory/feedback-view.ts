import type { FeedbackLogEntry } from "../server/feedback-log.js";

// Mirrors feedback-issue.ts's private FEEDBACK_KIND_LABEL — kept separate rather than exported
// across the module boundary, since feedback-issue.ts sits right at its architecture budget
// (127/130) and any addition there needs its own decompose-first PR first.
// Consumed by wire-json-view.ts's cross-member feedback pulse — one icon set, not a second copy
// drifting from it.
export const FEEDBACK_KIND_ICON: Record<FeedbackLogEntry["kind"], string> = {
  bug: "🐞",
  feature: "✨",
  idea: "🗺️",
};

/** The same three kinds as WORDS (#784 slice 3). On a feed that mixes trades and filings, the
 *  leftmost token of every row has to say what the row is, and an emoji alone does not: it is one
 *  glyph at 12px, it renders differently per platform, and a screen reader announces it as the
 *  icon's own name. Ride the word with the icon — the same rule hue follows (`docs/BRAND.md` →
 *  Accessibility), applied to a glyph. */
export const FEEDBACK_KIND_WORD: Record<FeedbackLogEntry["kind"], string> = {
  bug: "Bug",
  feature: "Feature",
  idea: "Idea",
};
