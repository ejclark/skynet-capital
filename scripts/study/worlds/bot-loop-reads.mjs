// Every read a bot-loop page may make (#8005, the bot's loop), per viewer — the bot-loop cast over
// the shared shape of a world's reads (reads.mjs). Grown the way the profile's was: parity run
// with nothing stubbed, and each `/api` read the pages made added here.

import { worldReads } from "./reads.mjs";

const CAST = {
  accounts: ["eric", "sauron", "day-trader", "jordan"],
  bots: ["sauron", "day-trader"],
  /** Activity's filters: every playbook that placed an order, every symbol an order named. */
  playbooks: ["SAURON"],
  symbols: ["NVDA", "CRWV", "AVGO", "META", "TSLA", "AMZN", "AAPL", "MSFT", "SPY"],
  chainSymbols: ["NVDA"],
  // Reads the pin's pages make that the profile's list predates: the landing page's edition and
  // quests (the app nav's first tab), Settings' target split, a held name's outlook on Trade, and
  // R&D Playbooks' member plays, chains and views.
  shared: [
    "/api/edition",
    "/api/quests",
    "/api/target-split",
    "/api/research/outlook?symbol=NVDA",
    "/api/authored-plays",
    "/api/playbook-chains",
    "/api/convictions/mine",
  ],
  // The book's "Wait until a date…" reads each account's saved wait; R&D Playbooks with an account
  // picked reads that account's playbook records.
  extra: (id) => [`/api/book-wait?participantId=${id}`, `/api/outpost/performance?accounts=${id}`],
};

export function botLoopReads() {
  return worldReads(CAST);
}
