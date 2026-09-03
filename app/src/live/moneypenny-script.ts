/**
 * MONEYPENNY'S SCRIPT — the pure half of the rail (design handoff 2026-09-03, §6). Everything
 * she says that ISN'T the real coach's own words lives here as data and total functions: the
 * intro that plays once per account, the onboarding steer, and the keyword routing that decides
 * whether a note is feedback to file, a setup question, or something to nudge toward. Pure so the
 * specs can pin every branch without a DOM or a network; the store (`moneypenny.ts`) is the only
 * thing that acts on what this returns.
 *
 * Design principle carried whole: look for organic openings to steer the conversation toward
 * completing onboarding. The name is always capitalized — "Moneypenny ·" opens her first line.
 */

import type { FeedbackKind } from "./feedback";

/** Where the conversation is: waiting on a setup yes/no, a feedback note, or its one follow-up. */
export type Flow = "idle" | "setup" | "fb" | "fb2";

export interface IntroContext {
  readonly connected: boolean;
  readonly firstTradeDone: boolean;
  readonly marketOpen: boolean;
}

const WHO =
  "Moneypenny · hi, I'm Moneypenny — your assistant on the desk. ask me questions any time, report a bug and it gets fixed, suggest an enhancement or a new feature and it gets built.";
const ASK = "any immediate questions or support items? just ask.";
const STEER_SETUP =
  "i see your alpaca paper account isn't connected yet — that's the first step of onboarding. want a hand setting it up?";
const STEER_TRADE_OPEN =
  "your account is connected — the last step is your first trade. open the trading desk and buy a stock (rung 101): review the order, confirm, and the fill unlocks the next play. the market is open right now.";
const STEER_TRADE_CLOSED =
  "your account is connected — the last step is your first trade. open the trading desk and buy a stock (rung 101). the market is closed right now (9:30 am–4:00 pm et, weekdays), but you can schedule the trade and it fills at market open.";

export const SETUP_PATH = [
  "Moneypenny · the short path: create a free account at alpaca.markets → switch it to Paper Trading → increase the paper balance to $1,000,000 → generate api keys → paste the key and secret on the onboarding page. the step-by-step cards live there, with links.",
  "stuck on a specific step? tell me which number and i'll walk you through it.",
];
const SETUP_PATH_PLANT = [
  SETUP_PATH[0] as string,
  "stuck on a specific step? tell me which number and i'll walk you through it. and if something on our side looks broken, say “file an issue” and i'll open one for the team to fix.",
];
const SETUP_DECLINED =
  "Moneypenny · no problem — the step-by-step cards are on the onboarding page whenever you're ready. anything else on your mind?";
export const FB_OPEN =
  "Moneypenny · happy to file it. what's confusing, broken, or missing? a sentence or two is plenty.";
export const FB_QUESTION =
  "Moneypenny · got it. one question — where in the app does this bite you, and what would a good outcome look like?";
export const NUDGE =
  "Moneypenny · i can help you get set up, explain the desk, answer questions, or file your feedback. tell me what's on your mind — or tap a suggestion below.";
export const FEEDBACK_OFF =
  "Moneypenny · feedback isn't switched on in this deployment yet — ask Eric to set the feedback token. your note wasn't sent.";

/** The suggestion chips — shown only while no flow is active. */
export const CHIPS: readonly { readonly label: string; readonly msg: string }[] = [
  { label: "Help me get set up", msg: "How do I get set up?" },
  { label: "File feedback", msg: "I want to file feedback" },
];

/** The intro, three beats: who she is, the open question, and the onboarding steer that fits. */
export function introLines(ctx: IntroContext): {
  readonly lines: readonly string[];
  readonly flow: Flow;
} {
  const lines = [WHO, ASK];
  if (!ctx.connected) {
    lines.push(STEER_SETUP);
    return { lines, flow: "setup" };
  }
  if (!ctx.firstTradeDone) lines.push(ctx.marketOpen ? STEER_TRADE_OPEN : STEER_TRADE_CLOSED);
  return { lines, flow: "idle" };
}

const YES = /^(y\b|yes|sure|ok|okay|please|help|yeah|yep)/i;
const FEEDBACK =
  /feedback|bug|broken|wrong|doesn'?t work|error|crash|idea|feature|confus|missing|wish|issue|stuck|file (it|an issue|one)/i;
const BARE_FEEDBACK = /^i (want|would like|'?d like) to (file|give|leave|send)/i;
const SETUP = /key|secret|alpaca|balance|connect|paper|onboard|set ?up|sign|account/i;

export type Routed =
  | { readonly kind: "say"; readonly lines: readonly string[]; readonly flow: Flow }
  /** A note worth filing — ask the one sharp question (the coach's, or the scripted one). */
  | { readonly kind: "ask"; readonly note: string }
  /** The answer to that question — file now. */
  | { readonly kind: "file"; readonly answer: string };

/** Where a note goes, given where the conversation is. Total: every input routes somewhere. */
export function routeNote(note: string, flow: Flow): Routed {
  const text = note.trim();
  if (flow === "fb2") return { kind: "file", answer: text };
  if (flow === "setup") {
    return YES.test(text)
      ? { kind: "say", lines: SETUP_PATH_PLANT, flow: "idle" }
      : { kind: "say", lines: [SETUP_DECLINED], flow: "idle" };
  }
  if (flow === "fb" || FEEDBACK.test(text)) {
    if (flow !== "fb" && (BARE_FEEDBACK.test(text) || text.length < 25))
      return { kind: "say", lines: [FB_OPEN], flow: "fb" };
    return { kind: "ask", note: text };
  }
  if (SETUP.test(text)) return { kind: "say", lines: SETUP_PATH, flow: "idle" };
  return { kind: "say", lines: [NUDGE], flow: "idle" };
}

/** The filing's kind, read off the note — the coach and the issue labels both take one. */
export function inferKind(note: string): FeedbackKind {
  if (/bug|broken|error|crash|wrong|doesn'?t work|fails?\b/i.test(note)) return "bug";
  if (/feature|add |new |could you|would be (nice|great)|wish/i.test(note)) return "feature";
  return "idea";
}

/** The scripted filing when the coach isn't wired: title = the note's first line, ≤80 chars. */
export function scriptedDraft(note: string, answer: string): { title: string; details: string } {
  const first = (note.split("\n")[0] ?? "").trim();
  return {
    title: first.slice(0, 80),
    details: `${note}\n\n---\n\nWhere it bites / a good outcome:\n${answer}`,
  };
}

/** What she says once the issue exists. */
export function filedLine(number: number, title: string): string {
  return `Moneypenny · filed as issue #${number} — “${title}”. your context went into the filing. watch this thread for the answer.`;
}

/** The desk's own word after a filing, as a system line. The first filing lifts the feedback gate —
 *  M·02 opens — and that is the one claim made: filed and triaged, never "shipped". */
export function opsLine(firstFiling: boolean): string {
  return firstFiling
    ? "sauron·ops · filed → triaged: trading milestone M·02 is now unlocked on your desk. this is how the product gets built. keep them coming."
    : "sauron·ops · triaged · on the build queue. watch the changelog.";
}
