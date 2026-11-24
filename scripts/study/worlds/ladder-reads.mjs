// Every read a ladder-world page may make (#8005, the ladder: `docs/IA.md` §5.5 — the rungs, the
// courses and checks, onboarding, the human playbook chapter), per viewer: the bot's-loop cast these
// worlds are layered on, over the shared shape of a world's reads (reads.mjs). The ladder's own
// reads — the journey (`/api/learn`), onboarding, the plays index — are every page's already
// (reads.mjs → SHELL, TRADE). Grown the profile's way: parity run with nothing stubbed, and each
// `/api` read the pages made added here.

import { worldReads } from "./reads.mjs";

const CAST = {
  accounts: ["eric", "sauron", "day-trader", "jordan", "casey"],
  bots: ["sauron", "day-trader"],
  playbooks: ["SAURON"],
  symbols: ["NVDA", "CRWV", "AVGO", "META", "TSLA", "AMZN", "AAPL", "MSFT", "SPY"],
  chainSymbols: ["NVDA", "AAPL"],
  shared: [
    "/api/edition",
    "/api/quests",
    "/api/target-split",
    "/api/research/outlook?symbol=NVDA",
    "/api/research/outlook?symbol=AAPL",
    "/api/authored-plays",
    "/api/playbook-chains",
    "/api/convictions/mine",
  ],
  extra: (id) => [`/api/book-wait?participantId=${id}`, `/api/outpost/performance?accounts=${id}`],
};

export function ladderReads() {
  return worldReads(CAST);
}
