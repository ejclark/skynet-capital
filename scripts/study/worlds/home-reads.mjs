// Every read a landing-page, Me or chat page may make in a world (#8005: `docs/IA.md` §5.9 the
// landing page, §5.6 Me — the dock, the Profile's Feedback section, Settings), per viewer: the
// bot's-loop cast these worlds are layered on, over the shared shape of a world's reads (reads.mjs),
// plus the landing page's own windows (the edition, quests, the party, a campaign's questions).
// Grown the profile's way: parity run with nothing stubbed, and each `/api` read added here.

import { worldReads } from "./reads.mjs";

/** The campaigns the pin's corpus holds (src/domain/campaigns at the pin). */
const CAMPAIGNS = ["ai-buildout", "energy-for-ai", "oil-supply"];

/** The leaderboard's metrics, as `cross-reads.mjs` lists them for its compare reads. */
const BOARD_METRICS = ["equity", "month", "pl", "return", "realized"];

const CAST = {
  accounts: ["eric", "sauron", "day-trader", "jordan", "casey"],
  bots: ["sauron", "day-trader"],
  playbooks: ["SAURON"],
  symbols: ["NVDA", "CRWV", "AVGO", "META", "TSLA", "AMZN", "AAPL", "MSFT", "SPY"],
  chainSymbols: ["NVDA"],
  shared: [
    "/api/edition",
    "/api/quests",
    "/api/fast-track",
    ...CAMPAIGNS.map((c) => `/api/campaigns/questions?campaign=${c}`),
    "/api/target-split",
    "/api/research/outlook?symbol=NVDA",
    // Two reads only a control reaches (#8123, bot-loop's census): Sauron's page opens AVGO's
    // outlook, and R&D Playbooks reads the research coverage.
    "/api/research/outlook?symbol=AVGO",
    "/api/research/coverage",
    "/api/authored-plays",
    "/api/playbook-chains",
    "/api/convictions/mine",
  ],
  // The leaderboard's compare with one account picked (#8123, bot-loop's census).
  extra: (id) => [
    `/api/book-wait?participantId=${id}`,
    `/api/outpost/performance?accounts=${id}`,
    ...BOARD_METRICS.map((m) => `/api/board?a=${id}&by=${m}`),
  ],
};

export function homeReads() {
  return worldReads(CAST);
}
