import { EXIT_DTE, longCallExit, TAKE_PROFIT } from "../playbooks/long-call-rules.js";
import { type LeverContext, why } from "./position-guidance-levers.js";
import { daysBetween, dayText, pct, pulseOf, usd } from "./position-guidance-rules.js";
import type { GuidanceReason, HeldLongOption, LongCallCall } from "./position-guidance-types.js";

/**
 * CALLS YOU HOLD — what the house's own exit rules say about a long call the member bought (#5709
 * slice 2; Eric's scenario 2: "I entered with no plan to take profit and cycle out"). The rule book
 * is the house's long-call bot's (`src/playbooks/long-call-rules.ts` — one source, never a copy):
 *
 *   1. Expired → no answer, refresh.
 *   2. `EXIT_DTE` days or fewer left → TIME STOP, whatever the price: time decay speeds up from here.
 *   3. No price to sell at, or one out of date → no answer (a verdict priced off nothing is a guess).
 *   4. The bid is `TAKE_PROFIT`× what was paid → TAKE PROFIT: the win the rule waits for.
 *   5. Otherwise hold, with the day the time stop falls due.
 *
 * Calls only: the bot has no rule for a bought put, so a held put gets none. A rule is OFFERED —
 * nothing here sells, and there is no "Use this" (BRAND: never apply a rule on the member's behalf).
 * PURE: no I/O, no clock. The member's quote comes from their own account in the browser.
 */

interface Verdict {
  readonly call: LongCallCall["call"];
  readonly reasons: readonly GuidanceReason[];
  readonly provesWrong: string;
  readonly until?: { readonly date: string; readonly why: string };
}

/** The day the time stop falls due: `EXIT_DTE` days before expiry. */
function timeStopDay(expiration: string): string {
  return new Date(Date.parse(`${expiration}T00:00:00Z`) - EXIT_DTE * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

const days = (n: number): string => `${n} day${n === 1 ? "" : "s"}`;

/** "bid $6.00 against the $12.00 you paid — half of it" / "— 2.3× it": the price against cost. */
function againstCost(bid: number, paid: number): string {
  const x = bid / paid;
  const how = x >= 1 ? `${x.toFixed(1)}× it` : `${pct(x)} of it`;
  return `The bid is ${usd(bid)} against the ${usd(paid)} you paid — ${how}`;
}

function timeStop(c: HeldLongOption, dte: number): Verdict {
  const priced =
    c.bid === undefined || c.costPerContract <= 0
      ? []
      : [why("MANAGE", `${againstCost(c.bid, c.costPerContract)}.`)];
  return {
    call: "TIME STOP",
    reasons: [
      why(
        "EXIT-TIME",
        `${days(dte)} left — inside the ${EXIT_DTE} days where the house's long-call bot sells its own calls, before time decay speeds up.`,
      ),
      ...priced,
      why(
        "MANAGE",
        "Selling is your call — nothing sells from here. Holding on is a bet that the stock moves faster than time decay takes.",
      ),
    ],
    provesWrong: `If the stock jumps before ${dayText(c.expiration)} → holding would have paid; the cost of waiting is time decay on what's left.`,
    until: { date: c.expiration, why: "it expires — sell before time decay eats what's left" },
  };
}

function takeProfit(c: HeldLongOption, bid: number, dte: number): Verdict {
  return {
    call: "TAKE PROFIT",
    reasons: [
      why(
        "EXIT-PROFIT",
        `${againstCost(bid, c.costPerContract)} — the ${TAKE_PROFIT}× the house's long-call bot sells at.`,
      ),
      why(
        "MANAGE",
        "This is the win the rule waits for: a run-up can pull back while time keeps costing the call, so selling banks it and frees the cash for your next trade.",
      ),
    ],
    provesWrong: `If the stock keeps climbing, holding would make more — the cost is the pullback risk, with ${days(dte)} of time decay still running.`,
    until: {
      date: timeStopDay(c.expiration),
      why: `the time stop falls due — the house sells with ${EXIT_DTE} days left`,
    },
  };
}

function hold(c: HeldLongOption, bid: number | undefined): Verdict {
  const target = TAKE_PROFIT * c.costPerContract;
  return {
    call: "HOLD",
    reasons: [
      ...(bid === undefined ? [] : [why("EXIT-PROFIT", `${againstCost(bid, c.costPerContract)}.`)]),
      why(
        "EXIT-PROFIT",
        `The take-profit rule fires at ${usd(target)} a share (${TAKE_PROFIT}× what you paid).`,
      ),
      why(
        "EXIT-TIME",
        `The time stop falls due ${dayText(timeStopDay(c.expiration))}, with ${EXIT_DTE} days left.`,
      ),
    ],
    provesWrong: `If the bid reaches ${usd(target)} → the take-profit rule fires; if the stock fades first, the time stop still falls due on ${dayText(timeStopDay(c.expiration))}.`,
    until: {
      date: timeStopDay(c.expiration),
      why: `the time stop falls due — or come back once the bid reaches ${usd(target)}`,
    },
  };
}

function noAnswer(c: HeldLongOption, dte: number, text: string): LongCallCall {
  return {
    strike: c.strike,
    expiration: c.expiration,
    contracts: c.contracts,
    dte,
    call: "NO ANSWER",
    confidence: "none",
    reasons: [why("PULSE", text)],
    provesWrong: "",
    atOpen: false,
  };
}

/** Every long call this read judges: the account's, plus the typed-in one when it is a different
 *  contract (the account's wins a tie — it carries the live quote). */
function heldCallsOf(ctx: LeverContext): HeldLongOption[] {
  const { heldCalls = [], longOption } = ctx.input.stake;
  const typed = longOption?.type === "call" ? [longOption] : [];
  const seen = new Set(heldCalls.map((c) => `${c.strike}|${c.expiration}`));
  return [...heldCalls, ...typed.filter((c) => !seen.has(`${c.strike}|${c.expiration}`))].sort(
    (a, b) => a.expiration.localeCompare(b.expiration) || a.strike - b.strike,
  );
}

function longCallCall(ctx: LeverContext, c: HeldLongOption): LongCallCall {
  const { input, today } = ctx;
  const dte = daysBetween(today, c.expiration);
  if (dte < 0) return noAnswer(c, dte, "This call has expired — refresh your positions.");
  const chain = pulseOf(input.pulse, "chain");
  const blocker = input.pulse.find((p) => p.blocksPricing);
  // The time stop is a calendar fact; only the take-profit test needs a price worth trusting.
  const exit = longCallExit({
    dte,
    paid: c.costPerContract,
    ...(c.bid !== undefined ? { bid: c.bid } : {}),
  });
  let v: Verdict;
  if (exit === "time") {
    v = timeStop(c, dte);
  } else if (c.bid === undefined) {
    return noAnswer(
      c,
      dte,
      "No live price to sell it at — refresh, or check it on your positions.",
    );
  } else if (blocker) {
    return noAnswer(c, dte, `Prices can't be trusted until the market opens — ${blocker.note}.`);
  } else if (chain?.status === "stale") {
    return noAnswer(
      c,
      dte,
      `Option prices are out of date — ${chain.note}. Refresh before acting.`,
    );
  } else {
    v = exit === "profit" ? takeProfit(c, c.bid, dte) : hold(c, c.bid);
  }
  const spot = pulseOf(input.pulse, "spot");
  const aging =
    spot?.status === "aging"
      ? [
          why(
            "PULSE",
            `The stock price is only partly verified — ${spot.note}. Confidence capped at medium.`,
          ),
        ]
      : [];
  const acting = v.call === "TAKE PROFIT" || v.call === "TIME STOP";
  return {
    strike: c.strike,
    expiration: c.expiration,
    contracts: c.contracts,
    dte,
    call: v.call,
    confidence: "medium",
    reasons: [...aging, ...v.reasons].slice(0, 3),
    provesWrong: v.provesWrong,
    ...(v.until ? { until: v.until } : {}),
    atOpen: !input.sessionOpen && acting,
    ...(c.bid !== undefined && c.costPerContract > 0
      ? { multiple: c.bid / c.costPerContract }
      : {}),
  };
}

export function longCallCalls(ctx: LeverContext): LongCallCall[] {
  return heldCallsOf(ctx).map((c) => longCallCall(ctx, c));
}
