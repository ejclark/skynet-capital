import type { OptionType } from "../trading/option-symbols.js";

/**
 * THE TRADE-TYPE CATALOG — the six transactions the desk ticket offers, exactly the set the
 * `/learn` academy teaches (docs/handoffs/desk-v2, Chassis Contract ruling 16). Risk-ordered by
 * course code: the number IS the difficulty, and the 300-level rows stay locked until the
 * learner completes The Wheel (course 100 in `curriculum.ts` — the same client-side progress
 * the academy tracks). Course codes here are the DESK's codes from the contract; `plays.ts`
 * numbers its login-animation tiers differently and the two must not be mixed.
 *
 * Every entry keeps its real broker term with a plain gloss (ruling 6), and the ticket built
 * on this catalog never fires an order without the review screen (ruling 10).
 */

type TradeSide = "buy" | "sell";

export interface TradeType {
  /** Course code — mono label in the picker, risk-ordered ("101" is the safest). */
  readonly code: "101" | "102" | "201" | "202" | "301" | "302";
  readonly id: string;
  /** Real broker term, e.g. "Sell a cash-secured put". */
  readonly name: string;
  /** The plain-language gloss that rides under the name. */
  readonly tldr: string;
  readonly kind: "stock" | "option";
  readonly side: TradeSide;
  /** For option types: which contract this trade writes or buys. */
  readonly optionType?: OptionType;
  /** The guided-mode explainer — what you get, what you promise, in dollars-first words. */
  readonly gloss: string;
  /** Curriculum course (by id, from curriculum.ts) that unlocks this row; absent = always open. */
  readonly unlockCourse?: string;
}

export const TRADE_TYPES: readonly TradeType[] = [
  {
    code: "101",
    id: "buy-stock",
    name: "Buy stock",
    tldr: "own the shares",
    kind: "stock",
    side: "buy",
    gloss:
      "You buy shares at the market price and own them outright. The first rung of The Wheel — covered calls later need 100 shares per contract.",
  },
  {
    code: "102",
    id: "sell-stock",
    name: "Sell stock",
    tldr: "take profit or cut a loss",
    kind: "stock",
    side: "sell",
    gloss:
      "You sell shares you hold and book the gain or loss for real. This desk never opens a short — you can only sell what you own.",
  },
  {
    code: "201",
    id: "sell-secured-put",
    name: "Sell a cash-secured put",
    tldr: "get paid to buy stock at a discount",
    kind: "option",
    side: "sell",
    optionType: "put",
    gloss:
      "You collect a premium now and promise to buy 100 shares per contract at your strike if the stock falls there. The cash to honor that promise is set aside — that's the “secured.”",
  },
  {
    code: "202",
    id: "sell-covered-call",
    name: "Sell a covered call",
    tldr: "get paid to cap your upside",
    kind: "option",
    side: "sell",
    optionType: "call",
    gloss:
      "You hold 100 shares per contract and collect a premium for promising to sell them at your strike. Above the strike your shares get called away — that's the cap you were paid for.",
  },
  {
    code: "301",
    id: "buy-long-put",
    name: "Buy a long put",
    tldr: "profit when a stock falls",
    kind: "option",
    side: "buy",
    optionType: "put",
    unlockCourse: "wheel-basics",
    gloss:
      "You pay a premium for the right to sell 100 shares per contract at your strike. The stock falling makes it worth more; the most you can lose is the premium you paid.",
  },
  {
    code: "302",
    id: "buy-long-call",
    name: "Buy a long call",
    tldr: "profit when a stock rises",
    kind: "option",
    side: "buy",
    optionType: "call",
    unlockCourse: "wheel-basics",
    gloss:
      "You pay a premium for the right to buy 100 shares per contract at your strike. The stock rising makes it worth more; the most you can lose is the premium you paid.",
  },
];

/** Look up a trade type by its course code; undefined for anything unrecognized. */
export function tradeTypeByCode(code: string | null | undefined): TradeType | undefined {
  return TRADE_TYPES.find((t) => t.code === code);
}

/** The default selection — the safest rung, matching the academy's teaching order. */
export function defaultTradeType(): TradeType {
  return TRADE_TYPES[0] as TradeType;
}
