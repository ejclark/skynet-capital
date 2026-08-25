import { FEEDBACK_MILESTONE_ID } from "./curriculum.js";

/**
 * COMMUNITY DERIVATION — the pure function that turns one append-only ledger (the feedback log)
 * into earned community milestones. Same doctrine as `progression.ts`, applied to the one action
 * this desk can prove without a fill: there is no accumulated progress state to drift, because the
 * answer is re-derived from the ledger on every read.
 *
 * Proof is a FILED ISSUE, never a submission and never a checkbox. The distinction matters and is
 * not a loophole in the fill-only ruling (2026-08-25): a member cannot mint a GitHub issue number
 * from the browser. `feedback-service.ts` files the issue server-side and GitHub returns the
 * number; `feedback-log.ts` records it, keyed by the opaque member id, on the pinned volume. So
 * the issue number plays exactly the role the order id plays for a trade — external, server-side,
 * durable evidence — and a POST that never reached GitHub earns nothing.
 *
 * The trade ladder is untouched by this file. Nothing here is a `TradeTypeCode`, nothing here
 * unlocks a rung, and `progression.ts` does not import it.
 */

/** One durable filing — structurally satisfied by `FeedbackLogEntry`. */
export interface Filing {
  readonly issueNumber: number;
  readonly filedAt: string;
}

/** A community milestone earned by a real filing — the issue number IS the evidence. */
export interface EarnedContribution {
  readonly milestoneId: string;
  readonly issueNumber: number;
  readonly at: string;
}

/** A filing counts only when GitHub actually handed back an issue number. */
function real(filing: Filing): boolean {
  return (
    Number.isInteger(filing.issueNumber) && filing.issueNumber > 0 && filing.filedAt.length > 0
  );
}

/** How many pieces of feedback a member has actually landed — the count `/feedback` surfaces. */
export function filingCount(filings: readonly Filing[]): number {
  return filings.filter(real).length;
}

/**
 * Fold a member's filings into earned community milestones — idempotent (same ledger, same
 * result), with the EARLIEST qualifying filing as the evidence, exactly as `deriveEarned()` keeps
 * the earliest qualifying fill. One milestone today; higher tiers are a data addition here, not a
 * new mechanism.
 */
export function deriveContributions(filings: readonly Filing[]): EarnedContribution[] {
  let first: Filing | undefined;
  for (const filing of filings) {
    if (real(filing) && (!first || filing.filedAt < first.filedAt)) first = filing;
  }
  return first
    ? [{ milestoneId: FEEDBACK_MILESTONE_ID, issueNumber: first.issueNumber, at: first.filedAt }]
    : [];
}
