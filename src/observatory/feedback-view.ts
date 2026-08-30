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
