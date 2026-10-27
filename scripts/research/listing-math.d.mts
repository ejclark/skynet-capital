import type { ParsedProspectus } from "./lockup-math.mjs";

export const RANGE_TO_PRICING_DAYS: number;
export const FIRST_FILING_TO_PRICING_DAYS: number;

export interface Registration {
  readonly isIpo: boolean;
  readonly symbol?: string;
  readonly range?: { readonly low: number; readonly high: number };
  readonly offeringUsd?: number;
}
export function readRegistration(text: string, parsed: ParsedProspectus): Registration;
export function registeredUsd(feeXml: string): number | undefined;

export interface Pricing {
  readonly date: string;
  readonly basis: string;
}
export function expectedPricing(input: {
  form: string;
  filedOn: string;
  firstFiledOn: string;
  hasRange?: boolean;
}): Pricing;

interface CalendarEvent {
  id: string;
  kind: "ipo-listing" | "lockup-expiry";
  title: string;
  date: string;
  status: "confirmed" | "estimate";
  source: string;
  impact: "high" | "medium" | "low";
  symbols: string[];
  notes: string;
  supersededBy?: string;
}

export function listingEstimates(input: {
  symbol: string;
  company: string;
  form: string;
  url: string;
  fetchedOn: string;
  reg: Registration;
  parsed: ParsedProspectus;
  pricing: Pricing;
  size?: { usd: number; from: "range" | "fee-table" };
  impact?: "high" | "medium" | "low";
}): CalendarEvent[];

export function listingEvent(input: {
  symbol: string;
  company: string;
  url: string;
  fetchedOn: string;
  parsed: ParsedProspectus;
}): CalendarEvent | undefined;

export function registrationEstimateCik(event: { source?: string }): string | undefined;

interface Retirable {
  id: string;
  kind: string;
  date?: string;
  source: string;
  symbols?: readonly string[];
  supersededBy?: string;
}

export function supersessions(
  existing: readonly Retirable[],
  newer: readonly Retirable[],
): (
  | { id: string; supersededBy: string; blocked?: undefined }
  | { id: string; blocked: string; supersededBy?: undefined }
)[];

export function orphanedLockups<T extends Retirable & { date: string }>(
  existing: readonly T[],
  options: { today: string; priced: ReadonlySet<string>; stallDays: number },
): T[];
