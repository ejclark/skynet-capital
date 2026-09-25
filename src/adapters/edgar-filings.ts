/**
 * SEC EDGAR 8-K filings for one symbol — the Position Brief's "has anything material been filed
 * since the research was last worked?" check (#3729). The primary source, the same one
 * `scripts/research/market-data.mjs` reads for print dates: `company_tickers.json` for the CIK,
 * then `data.sec.gov/submissions/CIK##########.json` for the recent filings.
 *
 * Read-only and fail-soft: `undefined` on any network or shape failure — the pulse then reports
 * "EDGAR unreachable — new filings unchecked" rather than a confident "no filings". EDGAR asks for a
 * contactable User-Agent and ≤10 requests/second; the ticker map is cached for a day (it changes
 * when a company lists, not intraday) and each symbol's filings for five minutes.
 */

const UA = "skynet-capital research (ejclark83@gmail.com)";
const TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";
const TICKER_TTL_MS = 24 * 60 * 60 * 1000;
export const FILINGS_TTL_MS = 5 * 60 * 1000;

export type FetchJson = (url: string) => Promise<unknown>;

export interface EightK {
  /** Filing date, YYYY-MM-DD. */
  readonly date: string;
  /** The 8-K item numbers, comma-separated as EDGAR lists them ("2.02,9.01"). */
  readonly items: string;
}

const defaultFetch: FetchJson = async (url) => {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
};

interface Cached<T> {
  readonly at: number;
  readonly value: T;
}

export class EdgarFilings {
  private tickers?: Cached<ReadonlyMap<string, string>>;
  private readonly filings = new Map<string, Cached<readonly EightK[]>>();

  constructor(
    private readonly fetchJson: FetchJson = defaultFetch,
    private readonly clock: () => number = Date.now,
  ) {}

  private async cikOf(symbol: string): Promise<string | undefined> {
    const now = this.clock();
    if (!this.tickers || now - this.tickers.at > TICKER_TTL_MS) {
      const body = (await this.fetchJson(TICKERS_URL)) as Record<
        string,
        { ticker?: unknown; cik_str?: unknown }
      >;
      const map = new Map<string, string>();
      for (const row of Object.values(body ?? {})) {
        if (
          typeof row?.ticker === "string" &&
          (typeof row.cik_str === "number" || typeof row.cik_str === "string")
        ) {
          map.set(row.ticker.toUpperCase(), String(row.cik_str).padStart(10, "0"));
        }
      }
      this.tickers = { at: now, value: map };
    }
    return this.tickers.value.get(symbol.toUpperCase());
  }

  /**
   * Every 8-K in EDGAR's recent-filings page, newest first, with WHEN it was fetched — the pulse
   * reports that time, not the request's. `fresh` (a member's refresh) skips the five-minute cache.
   */
  async eightKs(
    symbol: string,
    options: { readonly fresh?: boolean } = {},
  ): Promise<{ readonly fetchedAt: string; readonly filings: readonly EightK[] } | undefined> {
    const now = this.clock();
    const hit = this.filings.get(symbol);
    if (hit && !options.fresh && now - hit.at <= FILINGS_TTL_MS) {
      return { fetchedAt: new Date(hit.at).toISOString(), filings: hit.value };
    }
    try {
      const cik = await this.cikOf(symbol);
      if (!cik) return undefined;
      const body = (await this.fetchJson(`https://data.sec.gov/submissions/CIK${cik}.json`)) as {
        filings?: { recent?: { form?: unknown[]; filingDate?: unknown[]; items?: unknown[] } };
      };
      const recent = body?.filings?.recent;
      if (!(recent && Array.isArray(recent.form) && Array.isArray(recent.filingDate)))
        return undefined;
      const out: EightK[] = [];
      recent.form.forEach((form, i) => {
        const date = recent.filingDate?.[i];
        if (form === "8-K" && typeof date === "string") {
          out.push({ date, items: String(recent.items?.[i] ?? "") });
        }
      });
      this.filings.set(symbol, { at: now, value: out });
      return { fetchedAt: new Date(now).toISOString(), filings: out };
    } catch {
      return undefined;
    }
  }
}
