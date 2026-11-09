/**
 * CLI: the landscape read for a house campaign (#6949 slice 5) — what moved, what is scheduled,
 * what is reported and what the house has tested, as the narrator would read it.
 *
 *   npm run campaign:landscape                        # every house campaign, with free daily closes
 *   npm run campaign:landscape -- ai-buildout         # one campaign
 *   npm run campaign:landscape -- --no-prices         # offline: no fetch, every symbol reads unread
 *   npm run campaign:landscape -- --today 2026-11-07  # read as of a day
 *   npm run campaign:landscape -- --json              # the read itself, for a script
 *   npm run campaign:landscape -- energy-for-ai --encounters                  # its mode's encounters
 *   npm run campaign:landscape -- energy-for-ai --encounters --mode find-names
 *
 * `--encounters` prints what the narrator would post in the campaign's mode (#6952 slice 3,
 * campaign-encounters.ts): explore questions or find-names candidates, generated from this same
 * read and the campaign's lesson record, each question before its answer.
 *
 * The closes come from Yahoo's free daily chart (no key, no account; the source the research
 * instruments already use, scripts/research/market-data.mjs), fetched fresh for the last month and
 * never cached: a landscape is about the present, and a stale close would say an old week moved
 * this week. Each symbol fails soft — an unreachable one is listed as unread, never as flat.
 *
 * A member's campaign is read by the same `landscapeOf`; it lives in the server's store, not here.
 * Paper only; educational.
 */

import { encounterSetLines } from "../domain/campaign-encounter-lines.js";
import { encountersFor } from "../domain/campaign-encounters.js";
import { type Close, landscapeOf } from "../domain/campaign-landscape.js";
import { landscapeLines } from "../domain/campaign-landscape-lines.js";
import { startDiscovery } from "../domain/campaign-lessons.js";
import { loadNews } from "../domain/campaign-news.js";
import { CAMPAIGN_MODES, CAMPAIGNS, type CampaignMode, castSymbols } from "../domain/campaigns.js";
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
  const mode = flag(argv, "mode");
  if (mode !== undefined && !(CAMPAIGN_MODES as readonly string[]).includes(mode)) {
    console.error(`[campaign-landscape] --mode must be one of ${CAMPAIGN_MODES.join(", ")}`);
    process.exitCode = 1;
    return;
  }
  const values = new Set([flag(argv, "today"), mode]);
  const only = argv.find((a) => !(a.startsWith("--") || values.has(a)));
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
  if (argv.includes("--encounters")) {
    const sets = campaigns.map((c, i) => {
      const landscape = reads[i];
      if (!landscape) throw new Error(`[campaign-landscape] no read for ${c.id}`);
      const brief = startDiscovery(c.id, today);
      return encountersFor(c, {
        landscape,
        brief,
        ...(mode ? { mode: mode as CampaignMode } : {}),
      });
    });
    if (argv.includes("--json")) console.log(JSON.stringify(sets, null, 2));
    else for (const set of sets) console.log(`${encounterSetLines(set).join("\n")}\n`);
    return;
  }
  if (argv.includes("--json")) {
    console.log(JSON.stringify(reads, null, 2));
    return;
  }
  for (const read of reads) console.log(`${landscapeLines(read).join("\n")}\n`);
}

await main(process.argv.slice(2));
