/**
 * The six persona shelves, each defined as a controlled experiment rather than a label.
 *
 * A probe is: a hand-built tape, the ONE input its control neutralises, and the predicate that says
 * which observed action is the behaviour the shelf claims. A persona joins the shelf when it takes
 * a matching action on the signal tape that it does NOT take on the control tape — which is what
 * keeps a signal-indifferent bot (the Prospector stakes its claims on any tape at all) from landing
 * on every shelf and misdescribing itself on all of them.
 *
 * The tapes quote three real names spanning every persona's watchlist: NVDA (a Prospector claim and
 * a Day Trader focus name), MSFT (also the Banker's book) and GLD (the Gold Bug's safe haven).
 * Prices are round numbers for legibility; the SIGNALS are what the probes actually vary.
 */
import type { Position } from "../domain/types.js";
import type { MutedChannel, Tape, TapeAction, TapeFrame, TapeQuote } from "./probe-tape.js";

export interface CollectionProbe {
  readonly id: string;
  readonly name: string;
  /** What membership means, mechanically — rendered beside the name so lore can never oversell. */
  readonly claim: string;
  readonly blurb: string;
  readonly tape: Tape;
  /**
   * The input the control run neutralises. Omitted only for a tape that carries no signal at all
   * (the flat tape IS its own control), where "acted anyway" is the whole finding.
   */
  readonly muted?: MutedChannel;
  /** True when this observed action is the behaviour the shelf claims. */
  matches(action: TapeAction): boolean;
}

const CASH = 1_000_000;

const q = (symbol: string, price: number, momentum: number, sentiment: number): TapeQuote => ({
  symbol,
  price,
  momentum,
  sentiment,
});

const frame = (asOf: string, quotes: readonly TapeQuote[]): TapeFrame => ({ asOf, quotes });

/** Flat book — the probes that ask "what would you OPEN?" start from nothing held. */
const FLAT: readonly Position[] = [];

/** A book carried into the euphoria/discipline probes, entered at these prices. */
const HELD: readonly Position[] = [
  { symbol: "NVDA", quantity: 500, avgPrice: 100 },
  { symbol: "MSFT", quantity: 100, avgPrice: 400 },
];

const AGAINST_THE_CROWD: CollectionProbe = {
  id: "against-the-crowd",
  name: "Against the Crowd",
  claim:
    "Bought a name while its own news sentiment was at or below −0.5 — and did not buy it on the same tape with sentiment flattened.",
  blurb:
    "The other side of a bad headline. These desks step in where the crowd is selling — one into the capitulation itself, one only once the fall has stopped falling.",
  tape: {
    cash: CASH,
    positions: FLAT,
    frames: [
      // Capitulation: hated and still dropping.
      frame("2026-08-26T14:00:00Z", [
        q("NVDA", 100, -0.06, -0.9),
        q("MSFT", 400, -0.05, -0.8),
        q("GLD", 200, 0.01, 0),
      ]),
      // Exhausted panic: still hated, but the tape has turned up.
      frame("2026-08-26T15:00:00Z", [
        q("NVDA", 96, 0.01, -0.9),
        q("MSFT", 400, 0.01, -0.8),
        q("GLD", 200, 0, 0),
      ]),
    ],
  },
  muted: "sentiment",
  matches: (a) => a.side === "buy" && a.sentiment <= -0.5,
};

const WITH_THE_TREND: CollectionProbe = {
  id: "with-the-trend",
  name: "With the Trend",
  claim:
    "Bought a name running at +2% or better — and did not buy it on the same tape with momentum flattened.",
  blurb:
    "Strength as the entry signal. These desks buy the same rip for different reasons — a confirmed breakout, a tape read, the crowd's roar, a whisper that hasn't broken yet.",
  tape: {
    cash: CASH,
    positions: FLAT,
    frames: [
      frame("2026-08-26T14:00:00Z", [
        q("NVDA", 100, 0.05, 0.55),
        q("MSFT", 400, 0.05, 0.55),
        q("GLD", 200, 0, 0),
      ]),
    ],
  },
  muted: "momentum",
  matches: (a) => a.side === "buy" && a.momentum >= 0.02,
};

const INTO_THE_EUPHORIA: CollectionProbe = {
  id: "into-the-euphoria",
  name: "Into the Euphoria",
  claim:
    "Sold a held name while its sentiment was at or above +0.7 — and did not sell it on the same tape with sentiment flattened.",
  blurb:
    "Distribution. The book is flat on P/L, so nothing here is profit-taking: these desks are exiting because the story got loud, whether the tape is still ripping or has just rolled over.",
  tape: {
    cash: CASH,
    positions: HELD,
    frames: [
      // Euphoria still ripping.
      frame("2026-08-26T14:00:00Z", [
        q("NVDA", 100, 0.05, 0.9),
        q("MSFT", 400, 0.05, 0.9),
        q("GLD", 200, 0, 0),
      ]),
      // Euphoria rolled over — the greed is peaked and momentum has turned.
      frame("2026-08-26T15:00:00Z", [
        q("NVDA", 100, -0.01, 0.9),
        q("MSFT", 400, -0.01, 0.9),
        q("GLD", 200, 0, 0),
      ]),
    ],
  },
  muted: "sentiment",
  matches: (a) => a.side === "sell" && a.sentiment >= 0.7,
};

const BY_THE_BOOK: CollectionProbe = {
  id: "by-the-book",
  name: "By the Book",
  claim:
    "Exited a position on a silent tape — no news, no momentum — and did not exit it with the same position re-priced to its own entry.",
  blurb:
    "Exits ruled by the position, not the mood. One name is 8% under water and one is 10% up; with every signal switched off, these desks still act — the loss gets cut and the gain gets banked.",
  tape: {
    cash: CASH,
    positions: HELD,
    frames: [
      frame("2026-08-26T14:00:00Z", [
        q("NVDA", 92, 0, 0),
        q("MSFT", 440, 0, 0),
        q("GLD", 200, 0, 0),
      ]),
    ],
  },
  muted: "pnl",
  matches: (a) => a.side === "sell",
};

const FLIGHT_TO_SAFETY: CollectionProbe = {
  id: "flight-to-safety",
  name: "Flight to Safety",
  claim:
    "Bought the one name the tape did NOT hate while average sentiment across the tape sat at or below −0.3 — and did not buy it with sentiment flattened.",
  blurb:
    "Risk-off. Not a bet on a bottom and not a bet on a rip: when the mood across risk assets sours, this is the desk that rotates into the haven and sits on it.",
  tape: {
    cash: CASH,
    positions: FLAT,
    frames: [
      frame("2026-08-26T14:00:00Z", [
        q("NVDA", 100, 0, -0.6),
        q("MSFT", 400, 0, -0.6),
        q("GLD", 200, 0, 0.1),
      ]),
    ],
  },
  muted: "sentiment",
  matches: (a) => a.side === "buy" && a.sentiment >= 0 && a.tapeSentiment <= -0.3,
};

const ALWAYS_WORKING: CollectionProbe = {
  id: "always-working",
  name: "Always Working",
  claim:
    "Opened risk on a tape with no news and no momentum at all. There is no control run here — the silent tape is the control.",
  blurb:
    "Signal-indifferent by design. These desks don't wait to be told — a quiet tape is itself the condition one of them underwrites in, and a planned claim gets staked whatever the tape is doing.",
  tape: {
    cash: CASH,
    positions: FLAT,
    frames: [
      frame("2026-08-26T14:00:00Z", [
        q("NVDA", 100, 0, 0),
        q("MSFT", 400, 0, 0),
        q("GLD", 200, 0, 0),
      ]),
    ],
  },
  matches: (a) => a.side === "buy",
};

/** The shelves, in the order they read on the index — openers first, exits after. */
export const COLLECTION_PROBES: readonly CollectionProbe[] = [
  AGAINST_THE_CROWD,
  WITH_THE_TREND,
  INTO_THE_EUPHORIA,
  BY_THE_BOOK,
  FLIGHT_TO_SAFETY,
  ALWAYS_WORKING,
];
