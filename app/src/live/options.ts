/**
 * The options ticket's client model (#738 phase 10b) — mirrors the 10a API. Same doctrine as
 * `ticket.ts`: the client renders the server's answers verbatim, the review is a courtesy and
 * the SERVICE is the gate, so nothing here decides anything — the ladder included: locked state
 * arrives computed, and the server re-refuses a locked play regardless of what the UI shows.
 */

import { postJson } from "./post";
import type { TicketResult } from "./ticket";

export type OptionPlayCode = "201" | "202" | "301" | "302";

export interface PlayInfo {
  readonly code: "101" | "102" | OptionPlayCode;
  readonly id: string;
  readonly name: string;
  readonly tldr: string;
  readonly kind: "stock" | "option";
  readonly side: "buy" | "sell";
  readonly optionType?: "call" | "put";
  readonly gloss: string;
  readonly locked: boolean;
  readonly opensAfter?: { readonly code: string; readonly name: string };
}

export interface PlaysIndex {
  readonly linked: boolean;
  readonly wheels: boolean;
  /** The feedback gate (#1119), while it holds: every rung locked for one reason, stated. */
  readonly gate?: { readonly reason: string; readonly note: string };
  readonly nextUp?: string;
  readonly plays: readonly PlayInfo[];
}

export interface ChainRow {
  readonly strike: number;
  readonly occSymbol: string;
  readonly premium?: number;
  readonly bid?: number;
  readonly ask?: number;
  readonly openInterest?: number;
}

export interface ChainData {
  readonly symbol: string;
  readonly optionType: "call" | "put";
  readonly expirations: readonly string[];
  readonly expiration: string;
  readonly spot?: number;
  readonly rows: readonly ChainRow[];
}

/** The honest degrade: no linked client, no listed options, or a feed failure — a sentence. */
export type ChainAnswer = ChainData | { readonly chainNote: string };

export interface OptionPreview {
  readonly code: string;
  readonly underlying: string;
  readonly occSymbol?: string;
  readonly optionType?: "call" | "put";
  readonly side: "buy" | "sell";
  readonly positionIntent: string;
  readonly contracts: number;
  readonly strike?: number;
  readonly expiration?: string;
  readonly orderType: "limit" | "market";
  readonly limitPrice?: number;
  readonly ok: boolean;
  readonly estPremium?: number;
  readonly estNotional?: number;
  readonly collateral?: number;
  readonly sharesCommitted?: number;
  readonly maxProfit?: number | "uncapped";
  readonly maxLoss?: number;
  readonly breakeven?: number;
  readonly refusals: readonly string[];
  readonly warnings: readonly string[];
}

export type OptionDraft =
  | {
      readonly kind: "open";
      readonly participantId: string;
      readonly code: OptionPlayCode;
      readonly underlying: string;
      readonly contracts: number;
      readonly strike: number;
      readonly expiration: string;
      readonly orderType: "limit" | "market";
      readonly limitPrice?: number;
    }
  | {
      readonly kind: "close";
      readonly participantId: string;
      readonly occSymbol: string;
      readonly contracts?: number;
    };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return (await res.json()) as T;
}

export const fetchPlays = (): Promise<PlaysIndex> => getJson("/api/trade/plays");

export const setWheels = (wheels: boolean): Promise<{ ok: boolean; error?: string }> =>
  postJson("/api/trade/wheels", { wheels });

export const fetchChain = (
  symbol: string,
  type: "call" | "put",
  exp?: string,
): Promise<ChainAnswer> =>
  getJson(
    `/api/trade/chain?symbol=${encodeURIComponent(symbol)}&type=${type}${
      exp ? `&exp=${encodeURIComponent(exp)}` : ""
    }`,
  );

export const reviewOption = (draft: OptionDraft): Promise<{ preview: OptionPreview }> =>
  postJson("/api/trade/option/review", draft);

export const submitOption = (draft: OptionDraft): Promise<TicketResult> =>
  postJson("/api/trade/option/submit", draft);
