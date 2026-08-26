/**
 * Market-data fetch layer for the earnings-cycle study — split/dividend-adjusted daily bars
 * (Yahoo) and authoritative earnings-release dates (SEC EDGAR 8-K Item 2.02 filings).
 *
 * Cached to disk: this study gets re-run many times while the questions change, and neither
 * source needs to be re-fetched more than once a session.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CACHE = join(process.cwd(), "node_modules", ".cache", "earnings-cycle");
// EDGAR asks for a contactable UA; a generic one gets rate-limited or blocked.
const UA = "skynet-capital research (ejclark83@gmail.com)";

async function cached(name, url) {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, name);
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  const body = await res.json();
  writeFileSync(path, JSON.stringify(body));
  return body;
}

/** Daily bars, split/dividend adjusted so returns are comparable across NVDA's four splits. */
export async function bars(symbol) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}` +
    `?period1=631152000&period2=${Math.floor(Date.now() / 1000)}&interval=1d&events=div%7Csplit`;
  const raw = await cached(`${symbol}.json`, url);
  const r = raw.chart?.result?.[0];
  if (!r) throw new Error(`no chart data for ${symbol}`);
  const q = r.indicators.quote[0];
  const adj = r.indicators.adjclose[0].adjclose;
  const out = [];
  for (let i = 0; i < r.timestamp.length; i++) {
    const close = q.close[i];
    const a = adj[i];
    if (close == null || a == null || q.open[i] == null) continue;
    // Map raw prices onto the adjusted series so open/close are on one scale.
    const ratio = a / close;
    out.push({
      date: new Date(r.timestamp[i] * 1000).toISOString().slice(0, 10),
      open: q.open[i] * ratio,
      close: a,
      rawClose: close,
    });
  }
  out.sort((x, y) => (x.date < y.date ? -1 : 1));
  return out;
}

/** Earnings-release dates from SEC 8-K Item 2.02 filings. */
export async function earningsDates(symbol) {
  const tickers = await cached(
    "company_tickers.json",
    "https://www.sec.gov/files/company_tickers.json",
  );
  const hit = Object.values(tickers).find((t) => t.ticker === symbol.toUpperCase());
  if (!hit) throw new Error(`no SEC CIK for ${symbol}`);
  const cik = String(hit.cik_str).padStart(10, "0");

  const pages = [
    await cached(`edgar-${cik}.json`, `https://data.sec.gov/submissions/CIK${cik}.json`),
  ];
  for (const f of pages[0].filings?.files ?? []) {
    pages.push(await cached(`edgar-${f.name}`, `https://data.sec.gov/submissions/${f.name}`));
  }

  const hits = [];
  for (const page of pages) {
    const r = page.filings?.recent ?? page;
    for (let i = 0; i < r.form.length; i++) {
      if (r.form[i] !== "8-K") continue;
      const items = String(r.items?.[i] ?? "");
      if (items.split(",").some((s) => s.trim().startsWith("2.02"))) hits.push(r.filingDate[i]);
    }
  }
  // One event per reporting window: a quarter can carry several 8-Ks (guidance updates,
  // re-issues); the first Item-2.02 filing of the window is the print.
  const seen = new Map();
  for (const date of hits.sort()) {
    const [y, m] = date.split("-").map(Number);
    // A report lands in its expected month or spills into the next (NVDA has printed Feb 26 and Mar 2).
    const q = Math.floor(((m - 1) % 12) / 3);
    const key = `${y}-${q}`;
    if (!seen.has(key)) seen.set(key, date);
  }
  return [...seen.values()].sort();
}
