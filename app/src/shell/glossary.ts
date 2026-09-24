/**
 * The plain-language glossary (#3689 slice 2): one place for every options/portfolio term the
 * Accounts page spells out for beginners. The UI prints the PLAIN label ("Time decay", "Locked
 * in", "3 buys"); the Greek or trade-desk word stays one hover away in a `GlossaryTerm` popover,
 * for the member who wants to learn it (design handoff copy rules: "Loses ~$64/day to time", not
 * "Θ −$64"; "Expires in 23 days", not "DTE").
 *
 * Copy lives here and nowhere else, so a wording fix is one edit and the popovers never drift from
 * each other. Each entry answers "what does this number mean for me?", not a textbook definition.
 */

export interface GlossaryEntry {
  /** The plain label the page prints. */
  readonly label: string;
  /** One or two sentences, second person, what the number means for the member. */
  readonly plain: string;
  /** The trader's word for it, when there is one — shown so the member can learn it. */
  readonly jargon?: string;
}

export const GLOSSARY = {
  lockedIn: {
    label: "Locked in",
    plain:
      "Profit or loss from trades you've already closed. It's yours whatever the market does next.",
    jargon: "realized P/L",
  },
  onPaper: {
    label: "On paper",
    plain: "Profit or loss on what you still hold, at today's prices. It changes until you close.",
    jargon: "unrealized P/L",
  },
  timeDecay: {
    label: "Time decay",
    plain:
      "What your options lose each day if prices don't move. Every option is worth a little less as expiry nears.",
    jargon: "theta (Θ)",
  },
  marketExposure: {
    label: "Market exposure",
    plain:
      "How many shares your positions act like. If the stocks you hold rise $1, you gain about this many dollars.",
    jargon: "delta (Δ), in share terms",
  },
  breakeven: {
    label: "Breakeven",
    plain: "The stock price where this trade stops losing money at expiry.",
  },
  bestWorst: {
    label: "Best / worst case",
    plain: "The most this position can make and the most it can lose, if held to expiry.",
    jargon: "max profit / max loss",
  },
  expiresIn: {
    label: "Expires in",
    plain:
      "Days left before the option expires. After that it's either worth something or nothing.",
    jargon: "DTE (days to expiry)",
  },
  buys: {
    label: "Buys",
    plain:
      "You bought this position at different times and prices. Each buy can be closed on its own.",
    jargon: "lots",
  },
  rangeBet: {
    label: "Range bet",
    plain:
      "Profits if the stock stays between two prices until expiry, and loses if it breaks out either way.",
    jargon: "iron condor",
  },
  ivCrush: {
    label: "What is IV crush?",
    plain:
      "Options get pricier before big news like earnings. Right after, that extra price drains away, even if the stock moves your way.",
    jargon: "implied-volatility crush",
  },
} as const satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;

/** "1 buy" / "3 buys" — the lots chip's label. */
export function buysLabel(count: number): string {
  return count === 1 ? "1 buy" : `${count} buys`;
}
