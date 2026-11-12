import { create } from "zustand";
import { dayLabel } from "./book-events";
import type { EditionDate } from "./edition";
import { normalizeSymbol } from "./symbol";
import { defaultTimeInForce, type TicketOrderType } from "./ticket";

/**
 * CAMPAIGN'S TRADE WINDOW, THE DRAFT TICKET (#7487 slice 6; spec § 2 "Trade (workbench)" and
 * § Interactions "Trade"). Campaign drafts a paper order and places nothing: "Review order" opens
 * `/trade` with the draft in its address (`tradeSearch`), and the share ticket there
 * (`shell/trade-gate.tsx`) reviews it, as it reviews any order. One order path, one gate.
 *
 * WHAT THE DRAFT HOLDS is the prototype's three fields, on the real ticket's own words: a symbol, a
 * share count and Market or Limit. The side is Buy (rung 101); a sell starts from a held position on
 * `/trade`. A limit's price is not drafted here: the gate seeds it at the mid once a live quote
 * arrives (`trade-gate.tsx`, "LIMIT AT MID"), so nothing on Campaign ever names a price it was not
 * given. The time in force is the server's own default for the type (`defaultTimeInForce`), which is
 * what the summary line says and what the gate will send.
 *
 * WHERE THE SYMBOLS COME FROM (the box rule: the dock's box is the only free-text input on the
 * page). The window offers names from real lists, never a typed box: the member's held shares,
 * their watchlist, and the companies whose results are dated on this edition's calendar
 * (`reportsDue`). The prototype's AAPL/MSFT/NVDA were placeholders and are gone.
 *
 * WHERE THE DRAFT LIVES: session memory, like the trail (`mission.ts`). It survives moving between
 * windows and is never touched by Moneypenny: asking her a question changes only the dock.
 */

/** The two order types the window drafts; Stop-Market stays on `/trade`, where its note lives. */
export type CampaignOrderType = Extract<TicketOrderType, "market" | "limit">;

export interface CampaignTicket {
  /** Undefined until the member picks a name (or a Calendar pill picks one for them). */
  readonly symbol?: string;
  readonly shares: number;
  readonly orderType: CampaignOrderType;
}

export const FRESH_TICKET: CampaignTicket = { shares: 1, orderType: "market" };

/** The stepper's ceiling: a guard on taps, not a rule — the gate checks buying power at review. */
export const MAX_SHARES = 9999;

/** A share count clamped to the stepper's range; anything not a whole number falls back to 1. */
export function clampShares(n: number): number {
  return Number.isInteger(n) ? Math.min(MAX_SHARES, Math.max(1, n)) : 1;
}

/**
 * `?shares=` on `/trade`, cleaned: a whole number from 1 to `MAX_SHARES`, else undefined. The
 * router JSON-parses search values, so `?shares=2` arrives as the NUMBER 2; a string is accepted too.
 */
export function parseShares(raw: unknown): number | undefined {
  const n =
    typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw.trim()) : Number.NaN;
  return Number.isInteger(n) && n >= 1 && n <= MAX_SHARES ? n : undefined;
}

/** `?type=` on `/trade`: the two types Campaign drafts, else undefined. */
export function parseOrderType(raw: unknown): CampaignOrderType | undefined {
  return raw === "market" || raw === "limit" ? raw : undefined;
}

/** The mono summary line: "Buy 1 NVDA · market · day", with the time in force the server will use. */
export function ticketLine(t: CampaignTicket): string {
  const tif = defaultTimeInForce(t.orderType) === "day" ? "day" : "GTC";
  return `Buy ${String(t.shares)} ${t.symbol ?? "—"} · ${t.orderType} · ${tif}`;
}

/** The `/trade` address that opens the share ticket with this draft in it (rung 101, buy). */
export function tradeSearch(t: CampaignTicket & { readonly symbol: string }): {
  readonly play: "101";
  readonly symbol: string;
  readonly shares: number;
  readonly type: CampaignOrderType;
} {
  return { play: "101", symbol: t.symbol, shares: t.shares, type: t.orderType };
}

/** A company's dated results on the calendar: the ticker, the day and the calendar's own words. */
export interface DueReport {
  readonly symbol: string;
  readonly date: string;
  readonly what: string;
}

/** "(NVDA)" inside the calendar's line, the way the edition names a listed company. */
const TICKER_IN_LINE = /\(([A-Z][A-Z.]{0,5})\)/;
/** A company's own print: "Q3 results", "earnings". A lockup or a launch is not a report. */
const REPORT_WORDS = /\b(results|earnings)\b/i;

/**
 * The companies whose results are dated on or after `today`, soonest first, one per ticker. Read
 * from the edition's calendar lines (`edition.next`), which name a listed company as "NVIDIA (NVDA)
 * Q3 results"; a line that names no ticker, or is not a report, is left out rather than guessed at.
 */
export function reportsDue(next: readonly EditionDate[], today: string): readonly DueReport[] {
  const seen = new Set<string>();
  const out: DueReport[] = [];
  for (const e of [...next].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))) {
    if (e.date < today || !REPORT_WORDS.test(e.what)) continue;
    const symbol = normalizeSymbol(TICKER_IN_LINE.exec(e.what)?.[1]);
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);
    out.push({ symbol, date: e.date, what: e.what });
  }
  return out;
}

/** "NVDA reports Tue, Nov 17" — the words a Linked pill carries. */
export const reportLabel = (r: DueReport): string => `${r.symbol} reports ${dayLabel(r.date)}`;

/** The report a pill should name: the ticket's own symbol's when it has one, else the soonest. */
export function reportFor(
  reports: readonly DueReport[],
  symbol: string | undefined,
): DueReport | undefined {
  return (symbol ? reports.find((r) => r.symbol === symbol) : undefined) ?? reports[0];
}

export interface SymbolGroup {
  /** Why these names are offered, in words: "Held", "Watching", "Reports soon". */
  readonly label: string;
  readonly symbols: readonly string[];
}

/** How many names one group offers; the rest are a tap away on `/trade`'s watchlist. */
export const GROUP_CAP = 6;

/**
 * The names the window offers, in groups that say where each came from. A name shows once, in the
 * first group that has it (held, then watching, then reporting). The ticket's own symbol is always
 * offered: if no list has it (a pill picked it past a group's cap), it leads in "On this ticket".
 */
export function symbolGroups(lists: {
  readonly held: readonly string[];
  readonly watching: readonly string[];
  readonly reporting: readonly string[];
  readonly current?: string;
}): readonly SymbolGroup[] {
  const seen = new Set<string>();
  const take = (label: string, raw: readonly string[]): SymbolGroup => {
    const symbols: string[] = [];
    for (const r of raw) {
      const s = normalizeSymbol(r);
      if (!s || seen.has(s) || symbols.length >= GROUP_CAP) continue;
      seen.add(s);
      symbols.push(s);
    }
    return { label, symbols };
  };
  const groups = [
    take("Held", lists.held),
    take("Watching", lists.watching),
    take("Reports soon", lists.reporting),
  ].filter((g) => g.symbols.length > 0);
  const current = normalizeSymbol(lists.current);
  return current && !seen.has(current)
    ? [{ label: "On this ticket", symbols: [current] }, ...groups]
    : groups;
}

interface TicketStore {
  readonly ticket: CampaignTicket;
  readonly patch: (next: Partial<CampaignTicket>) => void;
}

/** This session's draft. In memory only: a reload starts a fresh ticket, as it starts a fresh trail. */
export const useCampaignTicket = create<TicketStore>((set, get) => ({
  ticket: FRESH_TICKET,
  patch: (next) => {
    const merged = { ...get().ticket, ...next };
    set({ ticket: { ...merged, shares: clampShares(merged.shares) } });
  },
}));
