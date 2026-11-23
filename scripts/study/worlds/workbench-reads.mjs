// Every read a workbench-world page may make (#8005, the workbench area: Trade, `docs/IA.md` §5.3),
// per viewer — the list the composer answers ahead of time. The profile's reads come first (the
// shell, the book, the hand-offs one tap away, and Trade as the profile reaches it), then what the
// bench itself asks for once a member works on it: every pane's reads for every symbol the world
// quotes, the chain at every listed expiry (the expiry picker), the outlook and its structures,
// the watchlist and the stores the ticket reads beside it. Grown the profile's way: parity run with
// nothing stubbed, each `/api` request the pages made added (the router flags anything missing).

import { INSTANT } from "./instant.mjs";
import { profileReads } from "./profile-reads.mjs";

const ACCOUNTS = ["eric", "sauron", "jordan"];
/** The symbols the world quotes (inputs/profile-today.json → market): what a ticket, a chart, a
 *  chain or a guidance read can answer. A ticker outside it is a world artifact (shell-artifacts). */
const QUOTED = ["NVDA", "CRWV", "AAPL", "MSFT", "SPY", "GOOG"];
/** Expirations the chain's picker lists (the market input's), each side. */
const EXPIRATIONS = [
  "2026-10-09",
  "2026-10-16",
  "2026-10-23",
  "2026-10-30",
  "2026-11-06",
  "2026-11-13",
  "2026-11-20",
  "2026-12-18",
];
/** The views Outlook offers to hold (its "Over" choices, `OUTLOOK_HORIZON_DAYS`). */
const HORIZONS = [7, 14, 30, 45];
/** The charts' lookbacks: the profile's list (its `BAR_DAYS`), the trade chart's ranges among them. */
const YEAR_START = Date.parse(`${INSTANT.slice(0, 4)}-01-01T00:00:00Z`);
const YTD_DAYS = Math.ceil((Date.parse(INSTANT) - YEAR_START) / 86_400_000) + 1;
const BAR_DAYS = [7, 31, 93, 180, 366, YTD_DAYS, 1825];

/** One symbol's bench: quote, guidance, the feed scoped to it, its bars, its chain both sides at
 *  the default and every listed expiry, and R&D's read of it beside the ticket. */
function benchFor(symbol) {
  const reads = [
    `/api/trade/quote?symbol=${symbol}`,
    `/api/trade/guidance?symbol=${symbol}`,
    `/api/wire?symbol=${symbol}`,
    `/api/research/outlook?symbol=${symbol}`,
    `/api/research/fit?symbol=${symbol}`,
  ];
  for (const d of BAR_DAYS) reads.push(`/api/trade/bars?symbol=${symbol}&days=${d}`);
  // Outlook's "Show me the structures": read only when asked, once per stated view.
  for (const direction of ["bullish", "bearish", "neutral"]) {
    for (const magnitude of ["slight", "moderate", "strong"]) {
      for (const horizon of HORIZONS) {
        const q = new URLSearchParams({ symbol, direction, magnitude, horizon: String(horizon) });
        reads.push(`/api/trade/structures?${q}`);
      }
    }
  }
  for (const type of ["call", "put"]) {
    reads.push(`/api/trade/chain?symbol=${symbol}&type=${type}`);
    for (const exp of EXPIRATIONS)
      reads.push(`/api/trade/chain?symbol=${symbol}&type=${type}&exp=${exp}`);
  }
  return reads;
}

/** The stores the ticket and the book read per account, wired in production behind sign-in. */
const perAccount = (id) => [`/api/book-wait?participantId=${id}`];

/** The bench's own reads, beyond the profile's; and the Campaign tab's two, one tap from it. */
const BENCH = [
  "/api/trade/watchlist",
  "/api/target-split",
  "/api/book-wait",
  "/api/edition",
  "/api/quests",
];

export function workbenchReads(viewer) {
  const reads = [...profileReads(viewer), ...BENCH];
  for (const symbol of QUOTED) reads.push(...benchFor(symbol));
  for (const id of ACCOUNTS) reads.push(...perAccount(id));
  return [...new Set(reads)];
}
