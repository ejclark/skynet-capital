// Every read a league-world page may make (#8005, the league: `docs/IA.md` §5.7 — the standings and
// everyone's fills), per viewer: the bot's-loop cast these worlds are layered on, over the shared
// shape of a world's reads (reads.mjs), plus the league's own — the standings by every metric with
// one account or two picked to compare, and the feed's pages. Grown the profile's way: parity run
// with nothing stubbed, and each `/api` read the pages made added here.

import { worldReads } from "./reads.mjs";

const ACCOUNTS = ["eric", "sauron", "day-trader", "jordan", "casey"];
const METRICS = ["equity", "month", "pl", "return", "realized"];

/** The standings with a compare pick (`board.ts` → fetchBoard: `by`, then `a`, then `b`). */
function compareReads() {
  const reads = [];
  for (const by of METRICS) {
    for (const a of ACCOUNTS) {
      reads.push(`/api/board?${new URLSearchParams({ by, a })}`);
      for (const b of ACCOUNTS) {
        if (b !== a) reads.push(`/api/board?${new URLSearchParams({ by, a, b })}`);
      }
    }
  }
  return reads;
}

const CAST = {
  accounts: ACCOUNTS,
  bots: ["sauron", "day-trader"],
  playbooks: ["SAURON"],
  symbols: ["NVDA", "CRWV", "AVGO", "META", "TSLA", "AMZN", "AAPL", "MSFT", "SPY"],
  chainSymbols: ["NVDA"],
  shared: [
    "/api/edition",
    "/api/quests",
    "/api/target-split",
    "/api/research/outlook?symbol=NVDA",
    // Two reads only a control reaches (#8123, bot-loop's census): Sauron's page opens AVGO's
    // outlook, and R&D Playbooks reads the research coverage.
    "/api/research/outlook?symbol=AVGO",
    "/api/research/coverage",
    "/api/authored-plays",
    "/api/playbook-chains",
    "/api/convictions/mine",
    ...compareReads(),
  ],
  extra: (id) => [`/api/book-wait?participantId=${id}`, `/api/outpost/performance?accounts=${id}`],
};

export function leagueReads() {
  return worldReads(CAST);
}
