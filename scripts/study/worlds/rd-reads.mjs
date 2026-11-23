// Every read an R&D-world page may make (#8005, R&D: `docs/IA.md` §5.4), per viewer — the bot's-loop
// cast (the league these worlds are layered on) over the shared shape of a world's reads
// (reads.mjs), plus R&D's own: Coverage, the board's per-symbol reads, the member's own stores and
// the watchlist that names R&D's research symbols. Grown the profile's way: parity run with nothing
// stubbed, and each `/api` read the pages made added here.

import { worldReads } from "./reads.mjs";

/** The names R&D's board narrows to (its symbols list, the watchlist, the league's holdings): each
 *  with its outlook, fit and mentions. */
const BOARD_SYMBOLS = ["NVDA", "CRWV", "AVGO", "GOOG", "AAPL", "MSFT", "AMZN", "SPY"];
const boardReads = (s) => [
  `/api/research/outlook?symbol=${s}`,
  `/api/research/fit?symbol=${s}`,
  `/api/research/mentions?sym=${s}`,
];

const CAST = {
  accounts: ["eric", "sauron", "day-trader", "jordan", "casey"],
  bots: ["sauron", "day-trader"],
  playbooks: ["SAURON"],
  symbols: ["NVDA", "CRWV", "AVGO", "META", "TSLA", "AMZN", "AAPL", "MSFT", "SPY", "GOOG"],
  chainSymbols: ["NVDA"],
  shared: [
    "/api/edition",
    "/api/quests",
    "/api/target-split",
    "/api/research/coverage",
    "/api/trade/watchlist",
    "/api/authored-plays",
    "/api/playbook-chains",
    "/api/convictions/mine",
    ...BOARD_SYMBOLS.flatMap(boardReads),
  ],
  extra: (id) => [`/api/book-wait?participantId=${id}`, `/api/outpost/performance?accounts=${id}`],
};

export function rdReads() {
  return worldReads(CAST);
}
