// The reads a composed world answers ahead of time, per viewer (#4943 slice 2; shared since #8005)
// — every `/api` read a page of the app may make, given the world's accounts, bots, playbooks and
// symbols. It was grown by running parity with nothing stubbed and adding each `/api` request the
// pages actually made (the router flags anything missing as 'unstubbed'), so it is the pages' own
// appetite, not a guess. Each viewer asks for every account's public reads: the gates, not this
// list, decide what a non-owner's answers contain. A world's own list (profile-reads.mjs,
// bot-loop-reads.mjs) names only its cast; the shape of the reads lives here once.

import { INSTANT } from "./instant.mjs";

const CURVE_RANGES = ["7D", "1M", "3M", "1Y", "YTD", "ALL"];
const BOARD_METRICS = ["equity", "month", "pl", "return", "realized"];

/** Reads every viewer's shell makes regardless of page. */
const SHELL = [
  "/api/settings",
  "/api/ops-status",
  "/api/accounts/networth",
  "/api/research",
  "/api/research/calendar",
  "/api/learn",
  "/api/onboarding",
  "/api/playbooks",
  "/api/playbook-store",
  "/api/join",
  // One tap from any page (the app nav, the header's icons): Activity's feed, Moneypenny's
  // feedback, Settings' owner-gated cards (a non-owner gets `{owner:false}` from the real handler,
  // as in production).
  "/api/wire",
  "/api/feedback",
  "/api/feedback/comments",
  "/api/admin/invite",
  "/api/admin/claim",
  "/api/controls",
  ...BOARD_METRICS.map((m) => `/api/board?by=${m}`),
];

/** Lookbacks the charts ask bars for: the hero's ranges (`daysFor`) and the trade chart's 180. */
const YEAR_START = Date.parse(`${INSTANT.slice(0, 4)}-01-01T00:00:00Z`);
const YTD_DAYS = Math.ceil((Date.parse(INSTANT) - YEAR_START) / 86_400_000) + 1;
const BAR_DAYS = [7, 31, 93, 180, 366, YTD_DAYS, 1825];

/** Hand-off reads: the trade page a profile's actions open, and the stores beside it. */
const TRADE = ["/api/trade/plays", "/api/companion", "/api/saved-positions"];

/** Reads the redesign kit's screens make beyond a profile (scripts/redesign/screens.json): R&D's
 *  playbook records, and the playbook store's first fetch, which the page sends before any
 *  playbook is chosen (an empty `id`, answered as production does). */
const BEYOND = ["/api/outpost/performance", "/api/playbook-store?id="];

/** The options chain the trade page opens on: each side, the default expiry (none named) and the
 *  front one — the first Friday on or after the instant, which a world's market input lists. */
const INSTANT_DAY = new Date(`${INSTANT.slice(0, 10)}T00:00:00Z`);
const FRONT_EXPIRY = new Date(
  INSTANT_DAY.getTime() + ((5 - INSTANT_DAY.getUTCDay() + 7) % 7) * 86_400_000,
)
  .toISOString()
  .slice(0, 10);
const chainReads = (symbol) =>
  ["call", "put"].flatMap((type) => [
    `/api/trade/chain?symbol=${symbol}&type=${type}`,
    `/api/trade/chain?symbol=${symbol}&type=${type}&exp=${FRONT_EXPIRY}`,
  ]);

/** The trade page's per-account reads (each route answers only the account's owner). */
const perAccountTrade = (id) =>
  ["option-positions", "orders", "alerts", "alerts/delivery", "option-lifecycle"].map(
    (r) => `/api/trade/${r}?participantId=${id}`,
  );

/** The trade page's per-symbol reads. */
function perSymbolTrade(symbol) {
  const reads = [`/api/trade/quote?symbol=${symbol}`, `/api/trade/guidance?symbol=${symbol}`];
  // The options ticket's "who else traded this" row reads the feed scoped to one underlying.
  reads.push(`/api/wire?symbol=${symbol}`);
  for (const d of BAR_DAYS) reads.push(`/api/trade/bars?symbol=${symbol}&days=${d}`);
  return reads;
}

/**
 * Every read for one world's cast.
 * @param {{accounts: string[], bots: string[], playbooks: string[], symbols: string[],
 *   chainSymbols: string[], extra?: (id: string) => string[], shared?: string[]}} cast
 *   `playbooks` and `symbols` are the Activity filters a member can apply (every playbook that
 *   placed an order, every symbol); `extra` adds an account's reads a world's pages make beyond
 *   these, `shared` the reads they make once.
 */
export function worldReads(cast) {
  const bots = new Set(cast.bots);
  /** The desk family for one account. */
  const deskReads = (id) => {
    const base = `/api/desk/${id}`;
    const reads = [base, `${base}/activity`, `${base}/pulse`, `${base}/thesis`];
    for (const p of cast.playbooks) reads.push(`${base}/activity?playbook=${p}`);
    for (const s of cast.symbols) reads.push(`${base}/activity?symbol=${s}`);
    if (bots.has(id)) {
      reads.push(`${base}/heartbeat`, `${base}/probes`, `${base}/decisions`);
      reads.push(`${base}/decisions?trades=none`);
    }
    return reads;
  };
  const reads = [...SHELL, ...TRADE, ...BEYOND, ...(cast.shared ?? [])];
  for (const symbol of cast.symbols) reads.push(...perSymbolTrade(symbol));
  for (const symbol of cast.chainSymbols) reads.push(...chainReads(symbol));
  for (const id of cast.accounts) {
    reads.push(...deskReads(id), ...perAccountTrade(id));
    // R&D Playbooks with this account picked under "Subscribe as".
    reads.push(`/api/playbook-store?id=${id}`);
    for (const r of CURVE_RANGES) reads.push(`/api/accounts/${id}/equity-curve?range=${r}`);
    reads.push(...(cast.extra?.(id) ?? []));
  }
  return reads;
}
