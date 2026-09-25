import { type LeverContext, lever, why, windowText } from "./position-brief-levers.js";
import {
  actionable,
  DECISION_SESSIONS_BEFORE_PRINT,
  usd,
  weekdaysBefore,
} from "./position-brief-rules.js";
import type { BriefInputs, BriefReason, LeverCall } from "./position-brief-types.js";

/**
 * THE SHARES LEVER (#3729) — BUY / HOLD / SELL / STAND ASIDE on the stock itself. Three rules carry
 * it: a BUY exists only where research licenses one; a holder's HOLD runs until the S2 fork (five
 * sessions before the print window), where the goal decides flat vs a conscious hold; and cost
 * basis never drives the call — it is sunk cost, and only shapes strike selection elsewhere.
 * PURE: no I/O, no clock.
 */

/** The day the hold-through-the-print fork falls due: 5 sessions before the window opens. */
export function decisionDate(input: BriefInputs): string | undefined {
  return input.earnings
    ? weekdaysBefore(input.earnings.start, DECISION_SESSIONS_BEFORE_PRINT)
    : undefined;
}

export function ledgerReason(input: BriefInputs): BriefReason {
  return input.ledger
    ? why("LEDGER", `Research: ${input.ledger.stance}`)
    : why("LEDGER", "No research ledger covers this name — nothing licenses a new position.");
}

/** No shares: the only question is whether research licenses opening one. */
function nonHolderCall(input: BriefInputs, decision: string | undefined): LeverCall {
  const { ledger } = input;
  const ledgerWhy = ledgerReason(input);
  if (ledger?.buySignal && actionable(ledger.buyConfidence)) {
    return lever({
      lever: "shares",
      call: "BUY",
      confidence: ledger.buyConfidence,
      reasons: decision
        ? [ledgerWhy, why("SHARES", `Be flat by ${decision}, before the print window (S2).`)]
        : [ledgerWhy],
      provesWrong: "The ledger's own kill switch fires before you enter.",
      ...(decision ? { until: { date: decision, why: "S2: flat before the print window" } } : {}),
    });
  }
  return lever({
    lever: "shares",
    call: "STAND ASIDE",
    confidence: ledger ? "medium" : "low",
    reasons: [ledgerWhy],
    provesWrong: `The research ledger registers a buy signal${decision ? ` before ${decision}` : ""}.`,
  });
}

/** Inside the S2 zone (decision date → window end): the goal decides flat vs a conscious hold. */
function decisionZoneCall(input: BriefInputs, end: string): LeverCall {
  const keep = input.stake.goal === "keep-shares";
  return lever({
    lever: "shares",
    call: keep ? "HOLD" : "SELL",
    confidence: "medium",
    reasons: [
      why("SHARES", `Inside the print decision zone — window ${windowText(input)}.`),
      why(
        "SHARES",
        keep
          ? "Holding through is your conscious call: print gaps are fat-tailed coin flips (S2)."
          : "S2: never hold through the print — gaps are fat-tailed coin flips.",
      ),
      ledgerReason(input),
    ],
    provesWrong: `The print passes inside ${windowText(input)} with a move inside one expected move.`,
    until: { date: end, why: "the print window closes; re-run the Brief on the new tape" },
  });
}

export function sharesCall({ input, today }: LeverContext): LeverCall {
  const { stake, earnings } = input;
  const decision = decisionDate(input);
  if (!((stake.shares ?? 0) > 0)) return nonHolderCall(input, decision);
  const ledgerWhy = ledgerReason(input);
  const basisWhy =
    stake.costBasis !== undefined
      ? [
          why(
            "SHARES",
            `Your ${usd(stake.costBasis)} basis shapes strikes, never hold-vs-sell — it's sunk cost.`,
          ),
        ]
      : [];
  if (stake.goal === "exit") {
    return lever({
      lever: "shares",
      call: "SELL",
      confidence: "medium",
      reasons: [
        why(
          "GOAL",
          "Your goal is exit — the covered-call row shows strikes that pay you to leave.",
        ),
        ...basisWhy,
      ],
      provesWrong: "You change the goal — the call follows the goal, not the tape.",
    });
  }
  if (decision && earnings && today >= decision && today <= earnings.end) {
    return decisionZoneCall(input, earnings.end);
  }
  return lever({
    lever: "shares",
    call: "HOLD",
    confidence: "medium",
    reasons: [
      why(
        "SHARES",
        decision
          ? `Nothing licenses a change before ${decision}, when the hold-through-the-print fork falls due.`
          : "Nothing licenses a change — no print or playbook trigger is on the calendar.",
      ),
      ledgerWhy,
      ...basisWhy,
    ],
    provesWrong:
      earnings?.status === "estimate" && decision
        ? `IR confirms a print date before ${decision} — the fork arrives sooner.`
        : "A dated, name-specific catalyst moves the stock more than one expected move.",
    ...(decision
      ? {
          until: {
            date: decision,
            why: `decide whether to hold through the print window ${windowText(input)}`,
          },
        }
      : {}),
  });
}
