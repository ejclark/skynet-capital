/**
 * CLI: the landscape read for a house campaign (#6949 slice 5) — what moved, what is scheduled,
 * what is reported and what the house has tested, as the narrator would read it.
 *
 *   npm run campaign:landscape                        # every house campaign, with free daily closes
 *   npm run campaign:landscape -- ai-buildout         # one campaign
 *   npm run campaign:landscape -- --no-prices         # offline: no fetch, every symbol reads unread
 *   npm run campaign:landscape -- --today 2026-11-07  # read as of a day
 *   npm run campaign:landscape -- --json              # the read itself, for a script
 *
 * The closes come from Yahoo's free daily chart (no key, no account; the source the research
 * instruments already use, scripts/research/market-data.mjs), fetched fresh for the last month and
 * never cached: a landscape is about the present, and a stale close would say an old week moved
 * this week. Each symbol fails soft — an unreachable one is listed as unread, never as flat.
 *
 * A member's campaign is read by the same `landscapeOf`; it lives in the server's store, not here.
 * Paper only; educational.
 */

import { type Close, landscapeOf } from "../domain/campaign-landscape.js";
import { landscapeLines } from "../domain/campaign-landscape-lines.js";
import { loadNews } from "../domain/campaign-news.js";
import { CAMPAIGNS, castSymbols } from "../domain/campaigns.js";
import { everyEvent } from "../domain/market-events.js";
import { SEEDED_CONVICTIONS } from "../playbooks/conviction-seeds.js";
import { flag } from "./cli-flag.js";

const UA = "skynet-capital research (ejclark83@gmail.com)";
const CLOSES_SOURCE = "Yahoo daily closes, split-adjusted";

interface YahooChart {
  chart?: {
    result?: {
      timestamp?: number[];
      indicators?: { adjclose?: { adjclose?: (number | null)[] }[] };
    }[];
  };
}

/** The last month of split-adjusted daily closes for `symbol`, oldest first. Throws on a bad reply. */
async function closesFor(symbol: string): Promise<Close[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const r = ((await res.json()) as YahooChart).chart?.result?.[0];
  const stamps = r?.timestamp ?? [];
  const adj = r?.indicators?.adjclose?.[0]?.adjclose ?? [];
  const out: Close[] = [];
  stamps.forEach((ts, i) => {
    const close = adj[i];
    if (typeof close === "number" && close > 0)
      out.push({ date: new Date(ts * 1000).toISOString().slice(0, 10), close });
  });
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

async function readCloses(symbols: readonly string[]): Promise<Record<string, Close[]>> {
  const closes: Record<string, Close[]> = {};
  for (const symbol of symbols) {
    try {
      closes[symbol] = await closesFor(symbol);
    } catch (err) {
      console.error(`[campaign-landscape] ${symbol}: no closes (${(err as Error).message})`);
    }
  }
  return closes;
}

async function main(argv: readonly string[]): Promise<void> {
  const today = flag(argv, "today") ?? new Date().toISOString().slice(0, 10);
  const only = argv.find((a) => !a.startsWith("--") && a !== flag(argv, "today"));
  const campaigns = only ? CAMPAIGNS.filter((c) => c.id === only) : CAMPAIGNS;
  if (campaigns.length === 0) {
    console.error(`[campaign-landscape] no house campaign "${only}"`);
    process.exitCode = 1;
    return;
  }
  const symbols = [...new Set(campaigns.flatMap((c) => castSymbols(c)))];
  const closes = argv.includes("--no-prices") ? {} : await readCloses(symbols);
  const inputs = {
    today,
    events: everyEvent(),
    news: loadNews(),
    convictions: SEEDED_CONVICTIONS,
    closes,
    closesSource: CLOSES_SOURCE,
  };
  const reads = campaigns.map((c) => landscapeOf(c, inputs));
  if (argv.includes("--json")) {
    console.log(JSON.stringify(reads, null, 2));
    return;
  }
  for (const read of reads) console.log(`${landscapeLines(read).join("\n")}\n`);
}

await main(process.argv.slice(2));
