import type { PlayMilestone, PlayMilestoneKind } from "../server/play-milestone-ledger.js";

/**
 * THE WORDS OF A PLAYBOOK ROW on the Activity feed (#5457 slice 5, #809 slice 6) — what each of the
 * four milestones says, in one place so the honesty rules live where they can be tested.
 *
 *   - Say what happened, in the member's terms ("started trading “NVDA run-up, tighter” after 10
 *     shadow sessions"). No coined names.
 *   - A pass and a first promotion are celebrated (`cheer`) — the behavior the league wants. A
 *     pause is reported plainly and never dressed as a failure or a win.
 *   - NEVER imply an edge the shadow test did not show. A pass says the play followed its own rules
 *     inside the limits on the real tape; it carries no P/L minimum, so no row claims a return, and
 *     every row is labelled SIM and "unvalidated" (the house research bar is a label, not a gate).
 */

export interface PlayRowWords {
  readonly icon: string;
  /** The row's leading word — the event, one per kind, no other kind's row wears it. */
  readonly kindLabel: string;
  /** The sentence after the member's name. */
  readonly text: string;
  /** Celebrated with the accent rule — decoration, never the signal (the word says it). */
  readonly cheer: boolean;
  /** Ticker, then the standing labels. */
  readonly meta: string;
}

const LABELS = "SIM · unvalidated";

const sessionsClause = (n: number | undefined, lead: string): string =>
  n === undefined ? "" : `${lead}${n} shadow ${n === 1 ? "session" : "sessions"}`;

export function playRowWords(m: PlayMilestone): PlayRowWords {
  const name = `“${m.playName}”`;
  const meta = [m.symbol, LABELS].filter(Boolean).join(" · ");
  const words: Record<PlayMilestoneKind, Omit<PlayRowWords, "meta">> = {
    started: {
      icon: "🧪",
      kindLabel: "Testing",
      text: `started a shadow test of ${name} — it watches the market and places no orders`,
      cheer: false,
    },
    passed: {
      icon: "✅",
      kindLabel: "Passed",
      text: `got ${name} through its shadow test${sessionsClause(m.sessions, " after ")} — it followed its own rules, which is not proof of an edge`,
      cheer: true,
    },
    promoted: {
      icon: "📈",
      kindLabel: "Trading",
      text: `started trading ${name}${sessionsClause(m.sessions, " after ")}`,
      cheer: true,
    },
    paused: {
      icon: "⏸️",
      kindLabel: "Paused",
      text: `paused ${name} — no new positions; exits keep running`,
      cheer: false,
    },
  };
  return { ...words[m.kind], meta };
}
