export function htmlToText(html: string): string;
export function addDays(iso: string, days: number): string;
export interface ParsedProspectus {
  readonly isIpo: boolean;
  readonly prospectus?: { readonly date: string; readonly from: "cover" | "dealer-line" };
  readonly lockupDays?: number;
  readonly periods: readonly number[];
  readonly lockupQuote?: string;
  readonly earlyRelease?: string;
  readonly priceUsd?: number;
  readonly sharesOffered?: number;
  readonly offeringUsd?: number;
}
export function parseProspectus(text: string): ParsedProspectus;
export const HIGH_USD: number;
export const MEDIUM_USD: number;
export function lockupEvent(input: {
  symbol: string;
  company: string;
  url: string;
  fetchedOn: string;
  parsed: ParsedProspectus;
}):
  | {
      id: string;
      kind: "lockup-expiry";
      title: string;
      date: string;
      status: "confirmed" | "estimate";
      source: string;
      impact: "high" | "medium" | "low";
      symbols: string[];
      notes: string;
    }
  | undefined;
