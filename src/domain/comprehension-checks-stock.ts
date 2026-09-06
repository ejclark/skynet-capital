import { type ComprehensionCheck, question as q } from "./comprehension.js";

/**
 * COURSE 100 — the stock checks. Ownership and booking a result: the two ideas everything the
 * Wheel does rests on, so they are the two the desk refuses to celebrate on autopilot.
 *
 * Content as DATA, never as markup (`comprehension-checks.ts` composes the bank). Every question
 * is about the MECHANIC, not the market — a check that rewarded a price guess would teach exactly
 * what this desk refuses to teach.
 */
export const STOCK_CHECKS: readonly ComprehensionCheck[] = [
  {
    milestoneId: "first-buy",
    title: "Owning shares",
    concept: "what owning shares actually is",
    questions: [
      q(
        "own",
        "A buy order for 100 shares just filled. What do you hold?",
        [
          "A 100-share stake in the company",
          "A contract to buy 100 shares later",
          "A loan to the company that pays interest",
        ],
        0,
        "Shares are outright ownership. Nothing expires, there is nothing to exercise, and no clock runs against you.",
      ),
      q(
        "lot",
        "How many shares does one option contract cover?",
        ["10", "100", "However many you choose"],
        1,
        "Options are quoted per share but trade in 100-share lots — which is exactly why the Wheel starts by owning 100 shares.",
      ),
      q(
        "unrealized",
        "You bought at $50 and it's $40 now. What has happened to your money?",
        [
          "You're down $10 a share on paper; nothing is booked until you sell",
          "You have lost $1,000 permanently",
          "Nothing — losses only count at year end",
        ],
        0,
        "An unrealized loss is real information but not a result. The number becomes a result when you close the position.",
      ),
      q(
        "worst",
        "What is the worst case on 100 shares bought at $50?",
        ["Unlimited", "$5,000, if the shares go to zero", "You could owe more than you paid"],
        1,
        "Long stock is unleveraged: your downside is bounded by what you paid, and a share price cannot go below zero.",
      ),
    ],
  },
  {
    milestoneId: "first-sell",
    title: "Booking a result",
    concept: "why closing a position is what turns a mark into a result",
    questions: [
      q(
        "realize",
        "What does selling shares you hold actually do?",
        [
          "Realizes the result — the gain or loss is booked",
          "Locks in the price for later",
          "Pauses the position until you buy back",
        ],
        0,
        "Until you sell, the number on the screen is a mark. Selling is the moment it becomes a result you own.",
      ),
      q(
        "what-sell-is",
        "On this desk, selling 100 shares you own is best described as…",
        [
          "Closing a position you already hold",
          "Betting against the company",
          "Borrowing shares to sell short",
        ],
        0,
        "This desk never shorts — a sell only ever reduces shares you already hold.",
      ),
      q(
        "red",
        "You sold at a loss. What is the honest read?",
        [
          "You booked a loss — a normal, necessary part of trading",
          "You did something wrong and should avoid selling",
          "The loss doesn't count because it was paper money",
        ],
        0,
        "Taking a result — green or red — is the habit that separates trading from hoping. Refusing to book losses is how small ones grow.",
      ),
      q(
        "after",
        "You're flat after selling everything. What happens if the stock doubles tomorrow?",
        [
          "Nothing happens to you — your result is fixed",
          "You still collect half the move",
          "Your booked loss is reversed",
        ],
        0,
        "Once you're flat, that position's P/L is settled. The tape moves on without you, in both directions.",
      ),
    ],
  },
];
