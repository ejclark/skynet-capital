/**
 * CLI: write the day's edition after a close (#8252). The weekday run calls it after the earnings
 * refresh's clock fires; a person can run it by hand the same way.
 *
 *   npm run edition:write                          # today's session in New York, if due
 *   npm run edition:write -- --date 2026-11-24     # a given session (its close must have passed)
 *   npm run edition:write -- --dry-run             # builds and checks, prints, writes nothing
 *   npm run edition:write -- --campaign oil-supply # another house campaign (default: the latest
 *                                                  # edition's campaign)
 *   npm run edition:write -- --no-news             # skip the news collector; the edition says so
 *
 * ITS FIRST ACT IS THE FREE SCAN (criterion 1): the date must be a session, its close must have
 * passed, and no edition may exist for it; otherwise it prints `nothing due` and exits 0 before
 * any network request. Then: run the news collector for the day (`npm run news:collect`, reused,
 * never re-implemented), fetch every campaign name's close and the sector funds' closes through
 * `src/research/yahoo-closes.ts`, build the edition (`src/domain/edition-writer.ts`), judge it with
 * `parseEdition`, and only then write `src/domain/editions/<date>.json`.
 *
 * WRITES NOTHING ON A GAP (criterion 5): a campaign name with no close for the session, every news
 * source unreachable, or a failed check exits 1 naming what failed, and the page keeps the last
 * edition with its age. Its last line is `outcome: <word>` (`nothing-due` · `written` · `dry-run` ·
 * `failed`), also written to `$GITHUB_OUTPUT` with the file when a job runs it.
 *
 * No model, no key, no member's data, no order: paper only; educational.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reexecWithProxy } from "../../scripts/proxy-reexec.mjs";
import { loadNews } from "../domain/campaign-news.js";
import { CAMPAIGNS, campaignById, castSymbols } from "../domain/campaigns.js";
import { UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { editions, marketToday, parseEdition } from "../domain/edition.js";
import { editionDue, type SessionClose, writeEdition } from "../domain/edition-writer.js";
import { sessionsBefore } from "../domain/market-calendar.js";
import { MARKET_EVENTS } from "../domain/market-events.js";
import { DATE_RE } from "../domain/time.js";
import { closesFor, sectorCloses } from "../research/yahoo-closes.js";
import { flag } from "./cli-flag.js";

const EDITIONS_DIR = join(process.cwd(), "src", "domain", "editions");
const log = (line: string): void => console.log(`[edition-write] ${line}`);

function finish(outcome: string, file?: string): void {
  log(`outcome: ${outcome}`);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `outcome=${outcome}\n${file ? `file=${file}\n` : ""}`,
    );
  if (outcome === "failed") process.exitCode = 1;
}

/** The campaign the edition follows: the flag, else the latest edition's, else the first house one. */
function campaignFor(id: string | undefined) {
  const chosen = id ?? [...editions()].reverse().find((e) => e.campaign)?.campaign;
  const campaign = chosen ? campaignById(chosen) : CAMPAIGNS[0];
  if (!campaign) throw new Error(`no campaign "${String(chosen)}"`);
  return campaign;
}

/** The collector's three sources, by the word its UNREACHABLE lines name them with. */
const NEWS_SOURCES = [
  ["EDGAR", "SEC EDGAR 8-Ks"],
  ["Fed", "Federal Reserve press releases"],
  ["GDELT", "GDELT press headlines"],
] as const;

/**
 * Run the news collector once and say plainly which sources answered. It fails soft per source,
 * so a run where GDELT was down must not read as "no press" (this string is shown on the campaign
 * page). Exit 2 means nothing was reachable: a gap, so the edition is not written. Under
 * `--dry-run` the collector writes nothing either.
 */
function collectNews(dryRun: boolean): string {
  const started = `${new Date().toISOString().slice(0, 19)}Z`;
  const args = ["tsx", "src/scripts/news-collect.ts", "--days", "2"];
  const run = spawnSync("npx", dryRun ? [...args, "--dry-run"] : args, { encoding: "utf8" });
  process.stdout.write(run.stdout ?? "");
  process.stderr.write(run.stderr ?? "");
  if (run.status !== 0)
    throw new Error(
      run.status === 2
        ? 'every news source was unreachable, so nothing was checked; this is not "no news"'
        : `the news collector failed (exit ${String(run.status)})`,
    );
  const missed = (word: string): boolean =>
    new RegExp(`UNREACHABLE — ${word}[ :]`).test(run.stderr ?? "");
  const full = NEWS_SOURCES.filter(([w]) => !missed(w)).map(([, name]) => name);
  const partial = NEWS_SOURCES.filter(([w]) => missed(w)).map(([, name]) => name);
  return (
    `the news collector, run ${started}: ${full.length > 0 ? full.join(", ") : "no source answered in full"}` +
    (partial.length > 0 ? `; not fully reached on this run: ${partial.join(", ")}` : "")
  );
}

async function main(): Promise<void> {
  const argv = process.argv;
  const dryRun = argv.includes("--dry-run");
  const now = new Date();
  const date = flag(argv, "date") ?? marketToday(now);
  if (!DATE_RE.test(date)) throw new Error(`--date must be YYYY-MM-DD, not "${date}"`);
  const file = join(EDITIONS_DIR, `${date}.json`);

  const due = editionDue(date, now, existsSync(file));
  if (!due.due) {
    log(`nothing due: ${due.why}.`);
    finish("nothing-due");
    return;
  }

  // Network from here on. Node's fetch ignores HTTPS_PROXY behind an agent proxy, so re-run with
  // it honoured (a no-op in CI, which has none); the child repeats the free scan, which is free.
  reexecWithProxy();

  const campaign = campaignFor(flag(argv, "campaign"));

  const prev = sessionsBefore(date, 1);
  const symbols = castSymbols(campaign);
  const fetched = `${new Date().toISOString().slice(0, 16)}Z`;
  const read = await closesFor(symbols, [prev, date]);
  if (read.failed.length > 0)
    throw new Error(
      `no close for every campaign name, so nothing is written:\n  ${read.failed.join("\n  ")}`,
    );
  const closes: Record<string, SessionClose> = {};
  for (const [sym, byDay] of Object.entries(read.closes))
    closes[sym] = { prev: byDay[prev] as number, close: byDay[date] as number };
  const sectors = await sectorCloses(date, fetched.slice(0, 10));
  // News last: the collector writes its own file, so every gap that can stop the run is found first.
  const newsSource = argv.includes("--no-news") ? undefined : collectNews(dryRun);

  const edition = writeEdition({
    date,
    campaign,
    closes,
    closesSource: `Yahoo daily closes for ${prev} and ${date} (split-adjusted, dividends not added back), fetched ${fetched}`,
    news: loadNews(),
    newsSource,
    prints: UPCOMING_PRINTS,
    events: MARKET_EVENTS,
  });
  const full = JSON.parse(JSON.stringify({ ...edition, sectors }));
  parseEdition(full, `${date}.json`, date);

  log(
    `${date}: ${edition.stories.length} stories (${edition.stories.map((s) => s.id).join(", ")}), ${edition.next.length} dated next, campaign ${campaign.id}.`,
  );
  if (dryRun) {
    console.log(JSON.stringify(edition, null, 2));
    finish("dry-run");
    return;
  }
  writeFileSync(file, `${JSON.stringify(full, null, 2)}\n`);
  execFileSync("npx", ["biome", "format", "--write", file], { stdio: "inherit" });
  log(`wrote ${join("src", "domain", "editions", `${date}.json`)}.`);
  finish("written", join("src", "domain", "editions", `${date}.json`));
}

main().catch((err: unknown) => {
  console.error(`[edition-write] FAILED, nothing written: ${(err as Error).message}`);
  finish("failed");
});
