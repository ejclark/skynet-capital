export interface EarningsFilingHit {
  filingDate: string;
  reportDate?: string;
}

export interface CollapsedFiscalPrints {
  dates: string[];
  discarded: EarningsFilingHit[];
}

export function collapseToFiscalPrints(hits: EarningsFilingHit[]): CollapsedFiscalPrints;

export function earningsDates(symbol: string): Promise<string[]>;

export function bars(
  symbol: string,
): Promise<{ date: string; open: number; close: number; rawClose: number }[]>;
