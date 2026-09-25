import { type LeverContext, lever, why, windowText } from "./position-guidance-levers.js";
import {
  actionable,
  DECISION_SESSIONS_BEFORE_PRINT,
  usd,
  weekdaysBefore,
} from "./position-guidance-rules.js";
import type { GuidanceInputs, GuidanceReason, LeverCall } from "./position-guidance-types.js";

/**
 * THE SHARES LEVER (#3729) — what to do with the stock itself. Four rules carry it:
 *
 *   - A BUY exists only where research licenses one.
 *   - Nothing acts on the member's behalf. There is NO default goal: outside the earnings decision
 *     zone a holder simply holds; inside it every goal but `exit` gets DECIDE — the two choices
 *     stated side by side — never a bare SELL the member did not ask for (#3729 persona review: an
 *     unset goal used to read as "income" and said SELL a long-term holding into earnings).
 *   - SELL appears only when the member's own goal is `exit`, and always says it is a taxable sale.
 *   - Cost basis never drives the call — it is sunk cost, and only shapes strike selection.
 *
 * PURE: no I/O, no clock.
 */

const TAXABLE = "Selling is a taxable sale — check what it means for you before you do it.";

/** The day the hold-or-sell-before-earnings decision falls due: 5 sessions before the window. */
export function decisionDate(input: GuidanceInputs): string | undefined {
  return input.earnings
    ? weekdaysBefore(input.earnings.start, DECISION_SESSIONS_BEFORE_PRINT)
    : undefined;
}

export function ledgerReason(input: GuidanceInputs): GuidanceReason {
  return input.ledger
    ? why("LEDGER", `The research says: ${input.ledger.stance}`)
    : why("LEDGER", "No research covers this stock yet, so nothing supports buying more.");
}

/** No shares: the only question is whether research supports opening a position. */
function nonHolderCall(input: GuidanceInputs, decision: string | undefined): LeverCall {
  const { ledger } = input;
  const ledgerWhy = ledgerReason(input);
  if (ledger?.buySignal && actionable(ledger.buyConfidence)) {
    return lever({
      lever: "shares",
      call: "BUY",
      confidence: ledger.buyConfidence,
      reasons: decision
        ? [ledgerWhy, why("SHARES", `Plan to be out by ${decision}, before the earnings report.`)]
        : [ledgerWhy],
      provesWrong: "If the research withdraws its buy signal before you buy → come back here.",
      ...(decision ? { until: { date: decision, why: "be out before the earnings report" } } : {}),
    });
  }
  return lever({
    lever: "shares",
    call: "STAND ASIDE",
    confidence: ledger ? "medium" : "low",
    reasons: [ledgerWhy],
    provesWrong: `If the research starts supporting a buy${decision ? ` before ${decision}` : ""} → come back here.`,
  });
}

/** Inside the decision zone (decision date → window end): state both choices, pick neither. */
function decideCall(input: GuidanceInputs, end: string): LeverCall {
  const keep = input.stake.goal === "keep-shares";
  return lever({
    lever: "shares",
    call: "DECIDE",
    confidence: "medium",
    reasons: [
      why(
        "SHARES",
        `Earnings are due ${windowText(input)}. Hold through: the stock can jump or drop sharply overnight, and nobody can call which way.`,
      ),
      why(
        "SHARES",
        `Sell before: you trade the unknown earnings move for a price you can see. ${TAXABLE}`,
      ),
      keep
        ? why(
            "GOAL",
            "You said you want to keep the shares — holding through is consistent with that.",
          )
        : ledgerReason(input),
    ],
    provesWrong:
      "If the earnings report passes and the stock moves less than a normal day's range → the risk was smaller than feared.",
    until: {
      date: end,
      why: "the earnings window closes — refresh the guidance on the new prices",
    },
  });
}

export function sharesCall({ input, today }: LeverContext): LeverCall {
  const { stake, earnings } = input;
  const decision = decisionDate(input);
  if (!((stake.shares ?? 0) > 0)) return nonHolderCall(input, decision);
  const basisWhy =
    stake.costBasis !== undefined
      ? [
          why(
            "SHARES",
            `What you paid (${usd(stake.costBasis)}) shapes which strikes are safe to sell — it never decides whether to hold.`,
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
          "You said you want out. The covered-call row shows strikes that pay you to leave.",
        ),
        why("SHARES", TAXABLE),
        ...basisWhy,
      ],
      provesWrong: "If you change your goal → the guidance changes with it.",
    });
  }
  if (decision && earnings && today >= decision && today <= earnings.end) {
    return decideCall(input, earnings.end);
  }
  const noGoal =
    stake.goal === undefined
      ? [
          why(
            "GOAL",
            "Pick a goal — keep the shares, earn income, or exit. It changes which strikes fit.",
          ),
        ]
      : [];
  return lever({
    lever: "shares",
    call: "HOLD",
    confidence: "medium",
    reasons: [
      why(
        "SHARES",
        decision
          ? `Nothing calls for a change before ${decision}, when you decide whether to hold through earnings.`
          : "Nothing calls for a change — no earnings report or research signal is on the calendar.",
      ),
      ...noGoal,
      ledgerReason(input),
      ...basisWhy,
    ],
    provesWrong:
      earnings?.status === "estimate" && decision
        ? `If the company announces its earnings date before ${decision} → come back here; the decision comes sooner.`
        : "If the stock makes a big move on company-specific news → come back here.",
    ...(decision
      ? {
          until: {
            date: decision,
            why: `decide whether to hold through earnings (${windowText(input)})`,
          },
        }
      : {}),
  });
}
