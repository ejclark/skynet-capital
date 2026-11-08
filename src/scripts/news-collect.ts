/**
 * CLI: the free news collector (#6949 slice 4). Fetches SEC EDGAR 8-Ks for every house campaign's
 * cast, the Federal Reserve's press releases and GDELT's press headlines; keeps only the items a
 * campaign's title test links (src/domain/campaign-news.ts); and writes them to
 * `src/domain/news/<today>.json`, one file per run-day, so a run's diff is one reviewable file.
 *
 *   npm run news:collect                  # last 7 days, writes the file, prints the census
 *   npm run news:collect -- --days 30     # a wider first harvest
 *   npm run news:collect -- --dry-run     # fetches and prints, writes nothing
 *
 * Free sources only: no key, no account (a paid feed is the spend class). Each source fails soft —
 * one unreachable source is named and the run goes on; exit 2 only when every source failed, so a
 * run that checked nothing never reads as "no news". Files older than RETENTION_DAYS are removed:
 * the landscape is about the present, and the calendar keeps the dated history.
 *
 * Member campaigns are not read here: they live in the server's store, and slice 5's landscape
 * read links them against this same harvest at read time.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  linkNews,
  loadNews,
  NEWS_DIR,
  type NewsItem,
  newsCensus,
} from "../domain/campaign-news.js";
import { CAMPAIGNS, castSymbols, linkCensus, linkEvents } from "../domain/campaigns.js";
import { MARKET_EVENTS } from "../domain/market-events.js";
import {
  cikMap,
  edgarItems,
  fedItems,
  gdeltItems,
  gdeltQueries,
  gdeltUrl,
  keepLinked,
} from "../research/news-sources.js";
import { flag } from "./cli-flag.js";

const UA = "skynet-capital research (ejclark83@gmail.com)";
const RETENTION_DAYS = 45;
const GDELT_GAP_MS = 10_000;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
const log = (line: string): void => console.log(`[news-collect] ${line}`);

/**
 * One GET, retried with a growing wait when the source asks us to slow down (HTTP 429, or GDELT's
 * plain-text "Please limit requests" on a 200) or the connection drops. A reply that is not JSON
 * for any other reason is GDELT refusing the query; its own words go in the error.
 */
async function get(url: string, as: "json" | "text"): Promise<unknown> {
  let last = "";
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(GDELT_GAP_MS * attempt);
    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(90_000),
      });
    } catch (err) {
      last = (err as Error).message;
      continue;
    }
    if (res.status === 429) {
      last = "429";
      continue;
    }
    if (!res.ok) throw new Error(`${res.status}`);
    let text: string;
    try {
      text = await res.text();
    } catch (err) {
      last = (err as Error).message;
      continue;
    }
    if (as === "text") return text;
    if (/^\s*[[{]/.test(text)) return JSON.parse(text);
    if (/limit requests/i.test(text)) {
      last = "asked to slow down";
      continue;
    }
    throw new Error(`refused: ${text.slice(0, 120).trim()}`);
  }
  throw new Error(`gave up after 4 tries (${last})`);
}

const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

interface Harvest {
  readonly items: NewsItem[];
  readonly failed: string[];
  /** Sources that answered at least once: EDGAR, the Fed, GDELT. Zero means nothing was checked. */
  readonly reached: Set<string>;
}

async function collect(days: number, maxRecords: number): Promise<Harvest> {
  const since = isoDaysAgo(days);
  const items: NewsItem[] = [];
  const failed: string[] = [];
  const reached = new Set<string>();

  try {
    const ciks = cikMap(await get("https://www.sec.gov/files/company_tickers.json", "json"));
    const symbols = [...new Set(CAMPAIGNS.flatMap((c) => castSymbols(c)))];
    for (const sym of symbols) {
      const cik = ciks.get(sym);
      if (!cik) continue; // an ETF, or a symbol EDGAR does not list
      try {
        const body = await get(`https://data.sec.gov/submissions/CIK${cik}.json`, "json");
        items.push(...edgarItems(sym, cik, body, since));
        reached.add("EDGAR");
      } catch (err) {
        failed.push(`EDGAR ${sym}: ${(err as Error).message}`);
      }
      await sleep(150); // EDGAR's ≤10 requests/second
    }
  } catch (err) {
    failed.push(`EDGAR: ${(err as Error).message}`);
  }

  try {
    const xml = await get("https://www.federalreserve.gov/feeds/press_all.xml", "text");
    items.push(...fedItems(String(xml), since));
    reached.add("Fed");
    log("Fed press releases read.");
  } catch (err) {
    failed.push(`Fed RSS: ${(err as Error).message}`);
  }

  const timespan = `${Math.min(days, 90)}d`;
  for (const campaign of CAMPAIGNS) {
    for (const query of gdeltQueries(campaign)) {
      try {
        const found = gdeltItems(await get(gdeltUrl(query, maxRecords, timespan), "json"));
        items.push(...found);
        reached.add("GDELT");
        log(`GDELT ${campaign.id}: ${found.length} for ${query.slice(0, 60)}…`);
      } catch (err) {
        failed.push(`GDELT ${campaign.id} ${query}: ${(err as Error).message}`);
        log(`GDELT ${campaign.id}: unreachable for ${query.slice(0, 60)}…`);
      }
      await sleep(GDELT_GAP_MS); // GDELT's one request every 5 seconds
    }
  }
  return { items, failed, reached };
}

function prune(dir: string, today: string): string[] {
  const cutoff = new Date(Date.parse(today) - RETENTION_DAYS * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const gone = readdirSync(dir).filter(
    (f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) < cutoff,
  );
  for (const f of gone) rmSync(join(dir, f));
  return gone;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const days = Number(flag(process.argv, "days") ?? 7);
  const maxRecords = Number(flag(process.argv, "max") ?? 100);
  const dir = join(process.cwd(), NEWS_DIR);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const { items, failed, reached } = await collect(days, maxRecords);
  if (reached.size === 0) {
    for (const f of failed) console.error(`[news-collect] UNREACHABLE — ${f}`);
    console.error(
      '[news-collect] every source unreachable — nothing was checked; this is not "no news".',
    );
    process.exitCode = 2;
    return;
  }
  for (const f of failed) console.warn(`[news-collect] UNREACHABLE — ${f}`);
  const known = loadNews(dir);
  const kept = keepLinked(CAMPAIGNS, items, known);
  log(`fetched ${items.length}, kept ${kept.length} that a campaign's title test links.`);

  if (!dryRun && kept.length > 0) {
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${today}.json`);
    const prior = existsSync(file)
      ? (JSON.parse(readFileSync(file, "utf8")).items as NewsItem[])
      : [];
    const all = [...prior, ...kept].sort(
      (a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id),
    );
    const collectedAt = `${now.toISOString().slice(0, 19)}Z`;
    writeFileSync(file, `${JSON.stringify({ collectedAt, items: all }, null, 2)}\n`);
    log(`wrote ${kept.length} to ${join(NEWS_DIR, `${today}.json`)}.`);
  }
  if (!dryRun && existsSync(dir))
    for (const f of prune(dir, today)) log(`removed ${f} (past ${RETENTION_DAYS} days).`);

  const harvest = dryRun ? [...known, ...kept] : loadNews(dir);
  for (const campaign of CAMPAIGNS) {
    const events = linkCensus(linkEvents(campaign, MARKET_EVENTS));
    const news = newsCensus(linkNews(campaign, harvest));
    log(`${campaign.id}: ${events.linked} events ${JSON.stringify(events.byKind)}`);
    log(
      `${campaign.id}: ${news.linked} news ${JSON.stringify(news.bySource)} ${JSON.stringify(news.byEvidence)} forces ${JSON.stringify(news.byForce)} cast ${news.byCast}`,
    );
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
