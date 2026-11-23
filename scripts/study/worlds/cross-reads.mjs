// Every read a cross-feature page may make (#8005 slice 4), per viewer — the profile worlds' reads
// (profile-reads.mjs) plus the pages a goal crosses beyond the profile: the landing page and its
// windows, R&D's playbooks and convictions, Trade's watchlist, the league. Grown like the profile
// list: parity run with nothing stubbed, and each `/api` request the pages made added here.

import { profileReads } from "./profile-reads.mjs";

const ACCOUNTS = ["eric", "sauron", "jordan"];
/** The campaigns the corpus holds (src/domain/campaigns at the world's corpus commit). */
const CAMPAIGNS = ["ai-buildout", "energy-for-ai", "oil-supply"];
const BOARD_METRICS = ["equity", "month", "pl", "return", "realized"];

/** The landing page and its windows: the edition, quests, the party, a story's questions. */
const LANDING = [
  "/api/edition",
  "/api/quests",
  "/api/fast-track",
  ...CAMPAIGNS.map((c) => `/api/campaigns/questions?campaign=${c}`),
];

/** R&D: the board's coverage, the playbooks section's member stores, convictions. */
const RESEARCH = [
  "/api/research/coverage",
  "/api/convictions/mine",
  "/api/authored-plays",
  "/api/playbook-chains",
  "/api/trade/watchlist",
  "/api/target-split",
  "/api/admin/github-token",
];

/** Reads per account a hop lands on: the balance's performance, the book-wait line, a compare. */
function perAccount(id) {
  return [
    `/api/outpost/performance?accounts=${id}`,
    `/api/book-wait?participantId=${id}`,
    ...BOARD_METRICS.map((m) => `/api/board?a=${id}&by=${m}`),
  ];
}

export function crossReads(viewer) {
  return [...profileReads(viewer), ...LANDING, ...RESEARCH, ...ACCOUNTS.flatMap(perAccount)];
}
