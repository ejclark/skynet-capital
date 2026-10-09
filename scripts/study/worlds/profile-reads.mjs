// Every read a profile-world page may make (#4943 slice 2), per viewer — the list the composer
// answers ahead of time. It was grown by running parity with nothing stubbed and adding each
// `/api` request the pages actually made (the router flags anything missing as 'unstubbed'), so
// it is the pages' own appetite, not a guess. Each viewer asks for every account's public reads:
// the gates, not this list, decide what a non-owner's answers contain.

import { INSTANT } from "./instant.mjs";

const ACCOUNTS = ["eric", "sauron", "jordan"];
const BOTS = new Set(["sauron"]);
/** Filters a member can apply on Activity: every playbook that placed an order, every symbol. */
const PLAYBOOKS = [
  "CRWV-WHEEL",
  "HC-SAURON",
  "SAURON",
  "S1-NVDA",
  "NVDA-CALL-SPREAD",
  "G1-GOOG",
  "TACO-DJT",
];
const SYMBOLS = ["NVDA", "CRWV", "AMZN", "TSLA", "META", "AAPL", "MSFT", "SPY"];
const CURVE_RANGES = ["7D", "1M", "3M", "1Y", "YTD", "ALL"];
const BOARD_METRICS = ["equity", "month", "pl", "return", "realized"];

/** The desk family for one account. */
function deskReads(id) {
  const base = `/api/desk/${id}`;
  const reads = [base, `${base}/activity`, `${base}/pulse`, `${base}/thesis`];
  for (const p of PLAYBOOKS) reads.push(`${base}/activity?playbook=${p}`);
  for (const s of SYMBOLS) reads.push(`${base}/activity?symbol=${s}`);
  if (BOTS.has(id)) {
    reads.push(`${base}/heartbeat`, `${base}/probes`, `${base}/decisions`);
    reads.push(`${base}/decisions?trades=none`);
  }
  return reads;
}

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
  // One tap from the profile (the app nav, the header's icons): Activity's feed and the Council
  // beside it, Moneypenny's feedback, Settings' owner-gated cards (a non-owner gets `{owner:false}`
  // from the real handler, as in production).
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

/** Hand-off reads: the trade page the profile's actions open, and the stores beside it. */
const TRADE = ["/api/trade/plays", "/api/council", "/api/companion", "/api/saved-positions"];

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

export function profileReads() {
  const reads = [...SHELL, ...TRADE];
  for (const symbol of SYMBOLS) reads.push(...perSymbolTrade(symbol));
  for (const id of ACCOUNTS) {
    reads.push(...deskReads(id), ...perAccountTrade(id));
    for (const r of CURVE_RANGES) reads.push(`/api/accounts/${id}/equity-curve?range=${r}`);
  }
  return reads;
}
