import { type ComprehensionCheck, question as q } from "./comprehension.js";

/**
 * COURSES 200 & 300 — the option checks. The Wheel's two legs (cash-secured put, covered call),
 * then the directional longs, where leverage and the expiry clock enter the picture.
 *
 * Content as DATA, never as markup (`comprehension-checks.ts` composes the bank). Answers are
 * honest about real options mechanics — `docs/BRAND.md`: a flourish must never imply something
 * false about markets or P/L, and neither may a quiz.
 */
export const OPTION_CHECKS: readonly ComprehensionCheck[] = [
  {
    milestoneId: "first-cash-secured-put",
    title: "The cash-secured put",
    concept: "why the cash is what makes a short put safe",
    questions: [
      q(
        "secured",
        "What does the 'cash-secured' part mean?",
        [
          "Cash is set aside to buy 100 shares at the strike if you're assigned",
          "The broker guarantees you won't lose money",
          "The premium is paid to you in cash rather than shares",
        ],
        0,
        "The set-aside cash IS the security. Without it the obligation is naked, and an obligation you cannot fund is the whole danger.",
      ),
      q(
        "obligation",
        "Selling a put obligates you to do what?",
        [
          "Buy 100 shares at the strike if the holder exercises",
          "Sell 100 shares at the strike",
          "Nothing — you can walk away",
        ],
        0,
        "You sold someone the right to sell you shares at that strike. The premium is what you're paid to stand ready.",
      ),
      q(
        "strike",
        "Which strike belongs in this play?",
        [
          "One you'd genuinely be happy to own the stock at",
          "The furthest strike that still pays a premium",
          "Whichever strike is closest to expiring",
        ],
        0,
        "Assignment is the plan working, not the plan failing. If you'd hate owning it there, you picked the wrong strike.",
      ),
      q(
        "max-profit",
        "What is the most a cash-secured put can make?",
        [
          "The premium collected — no more",
          "The rise in the stock, if it rallies",
          "Unlimited, if the stock goes up enough",
        ],
        0,
        "Short options cap the reward at the credit. The open-ended side of this trade is the risk, never the profit.",
      ),
    ],
  },
  {
    milestoneId: "first-covered-call",
    title: "The covered call",
    concept: "what you're paid for and what you give up",
    questions: [
      q(
        "covered",
        "What makes a call 'covered'?",
        [
          "You already own 100 shares per contract sold",
          "You have cash equal to the premium",
          "The broker covers assignment for you",
        ],
        0,
        "The shares are the cover. Sell that call without them and it's naked — the loss above the strike has no ceiling.",
      ),
      q(
        "give-up",
        "What are you selling when you sell a covered call?",
        [
          "Your upside above the strike",
          "Your downside protection",
          "Your right to vote the shares",
        ],
        0,
        "You are paid a premium to cap your gains. That trade-off isn't a side effect of the strategy — it IS the strategy.",
      ),
      q(
        "expire",
        "The stock closes below your strike at expiry. What happens?",
        [
          "The call expires worthless; you keep the shares and the premium",
          "You are assigned and lose the shares",
          "The contract rolls to the next month automatically",
        ],
        0,
        "That's the Wheel turning: collect, keep, repeat. Nothing rolls by itself — every new contract is a decision you make.",
      ),
      q(
        "basis",
        "What does the premium do to your break-even on the shares?",
        ["Lowers it by the credit received", "Raises it by the credit", "Leaves it unchanged"],
        0,
        "Premium reduces your effective cost basis — the reason the Wheel is described as getting paid to hold a stock you wanted anyway.",
      ),
    ],
  },
  {
    milestoneId: "first-long-put",
    title: "The long put",
    concept: "defined risk, and the clock you're paying for",
    questions: [
      q(
        "direction",
        "Buying a put is a bet that the stock will…",
        ["Fall", "Rise", "Stay exactly where it is"],
        0,
        "A put gains value as the underlying drops. It's the defined-risk way to be bearish without shorting anything.",
      ),
      q(
        "max-loss",
        "What is the most you can lose on a long put?",
        [
          "The premium you paid",
          "The full strike price times 100",
          "Unlimited, if the stock rallies",
        ],
        0,
        "Defined risk: the debit is the entire exposure. That is also why a long option never produces a margin call.",
      ),
      q(
        "theta",
        "All else equal, what does time do to a long put's value?",
        ["It decays", "It grows", "It has no effect until expiry day"],
        0,
        "Time value bleeds out every single day. Being right late is priced the same as being wrong.",
      ),
      q(
        "protective",
        "You own 100 shares and buy a put on them. What have you built?",
        ["Downside insurance on the shares", "A second bet that the stock rises", "A covered call"],
        0,
        "A protective put pays off precisely when the shares hurt. The premium is that insurance's cost, and like any policy it expires.",
      ),
    ],
  },
  {
    milestoneId: "first-long-call",
    title: "The long call",
    concept: "leverage, and why the expiry date is part of the bet",
    questions: [
      q(
        "direction",
        "Buying a call is a bet that the stock will…",
        [
          "Rise, and rise before expiry",
          "Rise, with no deadline attached",
          "Stay below the strike",
        ],
        0,
        "Direction and timing both have to be right. The expiry date isn't fine print — it's half the bet.",
      ),
      q(
        "max-loss",
        "What is the most a long call can lose?",
        ["The premium paid", "The strike price times 100", "More than you paid, if it gaps down"],
        0,
        "Defined risk again: a call buyer can never lose more than the debit, no matter how far the stock falls.",
      ),
      q(
        "leverage",
        "Why does a call cost so much less than 100 shares?",
        [
          "Leverage — you control 100 shares for a fraction of the cost, for a limited time",
          "Because it's a discount on the shares",
          "Because the broker lends you the difference",
        ],
        0,
        "Leverage magnifies the percentage gain AND the odds of losing everything you put in. Small ticket, real risk.",
      ),
      q(
        "otm",
        "The stock is below your strike at expiry. Your call…",
        [
          "Expires worthless — the whole premium is gone",
          "Converts to shares at the strike",
          "Pays out the difference in cash",
        ],
        0,
        "Out of the money at expiry is zero. That total loss is the risk you accepted when you paid the debit.",
      ),
    ],
  },
];
