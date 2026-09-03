import type { OnboardingView } from "../server/onboarding-api-routes.js";

/**
 * THE MEMBER'S LIVE CONTEXT — the volatile half of Moneypenny's system prompt, rebuilt on every
 * turn from the same ledgers the pages read (onboarding, the feedback log, the market clock).
 * Pure: the route gathers the facts, this turns them into a few short lines the model treats as
 * ground truth about THIS member. Volatile by design, so it always sits AFTER the cache
 * breakpoint (`companion-chat.ts`'s `systemBlocks`) — nothing here may leak into the cached half.
 *
 * Why inline rather than a tool: these facts are small, change between turns, and are the ones
 * she needs on every reply to steer toward finishing onboarding — a tool round trip per turn
 * would cost latency and tokens for data the route already has in hand.
 */

export interface FilingSummary {
  readonly issueNumber: number;
  readonly title: string;
  readonly filedAt: string;
}

export interface MemberContextInput {
  readonly onboarding: OnboardingView;
  /** The member's own filings, newest first — the feedback log's entries. */
  readonly filings: readonly FilingSummary[];
  readonly marketOpen: boolean;
}

const MAX_FILINGS_NAMED = 3;

export function memberContext(input: MemberContextInput): string {
  const { onboarding, filings, marketOpen } = input;
  const name = onboarding.account?.displayName ?? onboarding.viewerName;
  const steps = onboarding.steps
    .map((s) => `${s.title}: ${s.done ? "done" : "not yet"}`)
    .join("; ");
  const account = onboarding.account
    ? `Alpaca paper account "${onboarding.account.displayName}" is connected${
        onboarding.account.stale
          ? " (the last account read failed — figures may be stale)"
          : `, equity $${onboarding.account.equity.toFixed(2)}, buying power $${onboarding.account.cash.toFixed(2)}`
      }; ladder rungs earned ${onboarding.account.rungsEarned} of ${onboarding.account.rungsTotal}${
        onboarding.account.nextUp
          ? `, next up ${onboarding.account.nextUp.code} ${onboarding.account.nextUp.title}`
          : ""
      }.`
    : "No Alpaca paper account is connected yet — that is onboarding step 1.";
  const named = filings
    .slice(0, MAX_FILINGS_NAMED)
    .map((f) => `#${f.issueNumber} "${f.title}"`)
    .join(", ");
  const feedback =
    filings.length === 0
      ? "They have filed no feedback yet — the first filing is what opens the trading ladder (M·02)."
      : `They have filed feedback ${filings.length} time${filings.length === 1 ? "" : "s"}: ${named}${
          filings.length > MAX_FILINGS_NAMED ? ", …" : ""
        }.`;
  return [
    `MEMBER CONTEXT (this turn): ${name ? `talking to ${name}.` : "the member has no display name yet."}`,
    `Onboarding (M·01, ${onboarding.done} of ${onboarding.total} done) — ${steps}.`,
    account,
    feedback,
    `Market: the regular session is ${marketOpen ? "OPEN right now" : "CLOSED right now (9:30 AM–4:00 PM ET, weekdays); an order placed now is queued and fills at the open"}.`,
  ].join("\n");
}
