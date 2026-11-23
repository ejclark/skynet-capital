// Every read a cross-feature page may make (#8005 slice 4), per viewer — the profile worlds' reads
// (profile-reads.mjs) plus the pages a goal crosses beyond the profile: the landing page and its
// windows, R&D's playbooks and convictions, Trade's watchlist, the league. Grown like the profile
// list: parity run with nothing stubbed, and each `/api` request the pages made added here.

import { loadInput } from "./inputs.mjs";
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

/** The symbols R&D's board narrows to, each with its outlook, fit and mentions (the census met the
 *  first two unanswered, #8005 thin slice). */
const BOARD_SYMBOLS = ["NVDA", "CRWV", "AMZN", "TSLA", "META", "AAPL", "MSFT", "SPY"];
const boardReads = (s) => [
  `/api/research/outlook?symbol=${s}`,
  `/api/research/fit?symbol=${s}`,
  `/api/research/mentions?sym=${s}`,
];

/** The chain a held option's Trade page opens on: its underlying and type, with no expiry named, at
 *  its own expiry, and at every other expiry its chip row offers (the input's own expiration list,
 *  on or after the world's day — the full round's desktop census tapped 2027-01-29 and met it
 *  unanswered, #8005) — read from the input's OCC symbols and expirations, never typed. */
const OCC = /^([A-Z]{1,6})(\d{2})(\d{2})(\d{2})([CP])\d{8}$/;
function heldChainReads() {
  const input = loadInput("cross-feature");
  const day = String(input.instant ?? "").slice(0, 10);
  const offered = (input.market?.expirations ?? []).filter((e) => e >= day);
  const out = new Set();
  for (const p of input.participants) {
    for (const pos of p.positions ?? []) {
      const m = OCC.exec(pos.symbol);
      if (!m) continue;
      const type = m[5] === "P" ? "put" : "call";
      out.add(`/api/trade/chain?symbol=${m[1]}&type=${type}`);
      for (const exp of new Set([`20${m[2]}-${m[3]}-${m[4]}`, ...offered])) {
        out.add(`/api/trade/chain?symbol=${m[1]}&type=${type}&exp=${exp}`);
      }
    }
  }
  return [...out];
}

export function crossReads(viewer) {
  return [
    ...profileReads(viewer),
    ...LANDING,
    ...RESEARCH,
    ...ACCOUNTS.flatMap(perAccount),
    ...BOARD_SYMBOLS.flatMap(boardReads),
    ...heldChainReads(),
  ];
}
