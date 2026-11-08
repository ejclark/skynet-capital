/**
 * CAMPAIGN NEWS — dated news items, linked to a campaign only when they name it (#6949 slice 4).
 *
 * The calendar (market-events) holds what is SCHEDULED. This holds what HAPPENED and was said: a
 * company's 8-K, a Federal Reserve press release, a press headline. The free news collector
 * (src/scripts/news-collect.ts) fetches them from sources that need no key and no account, and
 * checks the ones that name a campaign into `src/domain/news/<collected-date>.json` — the same
 * checked-in, reviewable-in-a-diff shape as the calendar, so nothing on a request path ever fetches.
 *
 * THE TITLE IS THE WHOLE TEST. An item links to a campaign when its own title names a cast symbol
 * (the company's name, its ticker) or says one of a force's `names`. The query that found the item
 * is a recall net and is never trusted: a search for "Nvidia" can return an article whose body
 * mentions Nvidia once and whose title is about something else, and linking that would be the
 * slice's falsifier — a news item linked to a campaign it does not name. Re-checking the stored
 * title means anyone can verify every link from the record alone.
 *
 * MEASURED OR REPORTED, never guessed (criterion 3; docs/process/EVENT-RESEARCH.md → Honesty rules).
 * The source prefix marks it, through campaigns.ts → `evidenceOf`:
 *   SEC:  the company's own filing on sec.gov       → measured
 *   FED:  the Federal Reserve's own press release  → measured
 *   NEWS: anything else, press or aggregator       → reported
 * The parser refuses a primary prefix on a URL that is not that publisher's, so a press item can
 * never be marked measured. A news item is never `estimated`: it has already been published.
 *
 * Paper only; educational. News scopes the story; it never places or sizes an order.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type Campaign,
  type CampaignForce,
  castSymbols,
  type Evidence,
  evidenceOf,
  type ForceName,
  type LinkReason,
} from "./campaigns.js";
import { TICKER_DIRECTORY } from "./ticker-directory/index.js";

export interface NewsItem {
  /** Stable slug: `sec-<sym>-<accession>`, `fed-<page>`, `gdelt-<hash of url>`. */
  readonly id: string;
  /** The headline as the source wrote it. The only text a link is judged on. */
  readonly title: string;
  readonly url: string;
  /** When the source published or filed it: ISO-8601 UTC, to the second. */
  readonly at: string;
  /** The source with its prefix (SEC: / FED: / NEWS:). */
  readonly source: string;
}

/** One news item linked to a campaign, carrying its source and timestamp (criterion 3). */
export interface NewsLink {
  readonly item: NewsItem;
  readonly reasons: readonly LinkReason[];
  readonly source: string;
  readonly at: string;
  /** Never `estimated`: a published item is measured or reported. */
  readonly evidence: Exclude<Evidence, "estimated">;
}

// ── How a title names a symbol or a force ──────────────────────────────────────────────────────

/**
 * How a headline names a company, beyond the ticker directory's own name. Each list replaces the
 * directory name for that symbol. `unless` cancels a match when the title also says one of those
 * words — "Amazon" in a rainforest story is not the company.
 */
const ALIASES: Readonly<Record<string, { names: readonly string[]; unless?: readonly string[] }>> =
  {
    NVDA: { names: ["Nvidia", "NVIDIA"] },
    AMD: { names: ["AMD", "Advanced Micro Devices"] },
    AVGO: { names: ["Broadcom"] },
    MU: { names: ["Micron"] },
    MRVL: { names: ["Marvell"] },
    TSM: { names: ["TSMC", "Taiwan Semiconductor"] },
    CRWV: { names: ["CoreWeave"] },
    NBIS: { names: ["Nebius"] },
    MSFT: { names: ["Microsoft"] },
    GOOG: { names: ["Alphabet", "Google"] },
    AMZN: {
      names: ["Amazon", "AWS"],
      unless: ["rainforest", "deforestation", "Amazon River", "Amazon basin", "Amazon Basin"],
    },
    META: { names: ["Meta Platforms", "Meta"] },
    XOM: { names: ["Exxon", "ExxonMobil"] },
    CVX: { names: ["Chevron"] },
    COP: { names: ["ConocoPhillips"] },
    OXY: { names: ["Occidental"] },
    EOG: { names: ["EOG"] },
    SLB: { names: ["SLB", "Schlumberger"] },
  };

const DIRECTORY_NAMES: ReadonlyMap<string, string> = new Map(
  TICKER_DIRECTORY.map((e) => [e.symbol.toUpperCase(), e.name.replace(/\s*\(.*\)\s*$/, "").trim()]),
);

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Whether `title` says `word` as a whole word (a trailing "s" allowed: ratepayer/ratepayers). A
 * word with any capital letter is a proper noun or an acronym and matches case-sensitively ("Fed",
 * "AI", "Meta"); an all-lowercase word matches in any case ("capacity auction").
 */
export function titleSays(title: string, word: string): boolean {
  const flags = word === word.toLowerCase() ? "i" : "";
  return new RegExp(`(?<![A-Za-z0-9])${escapeRe(word)}s?(?![A-Za-z0-9])`, flags).test(title);
}

/** Whether the title says the name: a word, or every word of a list. */
export function titleNames(title: string, name: ForceName): boolean {
  return typeof name === "string" ? titleSays(title, name) : name.every((w) => titleSays(title, w));
}

/** The words a headline uses for `symbol`: its aliases, or the directory's name for it. */
export function namesOf(symbol: string): readonly string[] {
  const sym = symbol.toUpperCase();
  const alias = ALIASES[sym];
  if (alias) return alias.names;
  const name = DIRECTORY_NAMES.get(sym);
  return name ? [name] : [];
}

/** Whether the title names the company or fund behind `symbol`. */
export function titleNamesSymbol(title: string, symbol: string): boolean {
  const sym = symbol.toUpperCase();
  if (ALIASES[sym]?.unless?.some((w) => titleSays(title, w))) return false;
  // A ticker names its symbol only when the headline marks it as one: a cashtag ("$QQQ"), in
  // parentheses ("(MU)", "( AMD )") or after an exchange ("NASDAQ: QQQ"). A bare word does not —
  // "MU" is a football club, "COP 30" a climate summit, and "ProShares Ultra QQQ $QLD" is QLD.
  const marked = new RegExp(
    `(?:\\$|\\(\\s*|\\b(?:NASDAQ|Nasdaq|NYSE(?: Arca)?)\\s*:\\s*)${escapeRe(sym)}(?![A-Za-z0-9])`,
  );
  if (marked.test(title)) return true;
  return namesOf(sym).some((n) => titleSays(title, n));
}

/** Why `item` belongs to `campaign`, judged on its title alone; empty when it does not. */
export function newsReasons(campaign: Campaign, item: NewsItem): readonly LinkReason[] {
  const reasons: LinkReason[] = castSymbols(campaign)
    .filter((symbol) => titleNamesSymbol(item.title, symbol))
    .map((symbol) => ({ via: "cast", symbol }));
  for (const force of campaign.forces)
    if (forceNamedIn(force, item.title)) reasons.push({ via: "force", force: force.id });
  return reasons;
}

function forceNamedIn(force: CampaignForce, title: string): boolean {
  return (force.names ?? []).some((n) => titleNames(title, n));
}

/** The items a campaign links, in the order given. */
export function linkNews(campaign: Campaign, items: readonly NewsItem[]): readonly NewsLink[] {
  const links: NewsLink[] = [];
  for (const item of items) {
    const reasons = newsReasons(campaign, item);
    if (reasons.length === 0) continue;
    const evidence = evidenceOf(item.source);
    links.push({
      item,
      reasons,
      source: item.source,
      at: item.at,
      evidence: evidence === "estimated" ? "reported" : evidence,
    });
  }
  return links;
}

/** Counts of linked news, by where it came from, by mark and by force — the slice-4 report. */
export interface NewsCensus {
  readonly linked: number;
  /** "sec" · "fed" · "press" — the source prefix, by family. */
  readonly bySource: Readonly<Record<string, number>>;
  readonly byEvidence: Readonly<Record<string, number>>;
  readonly byForce: Readonly<Record<string, number>>;
  /** Items whose title names a cast symbol. */
  readonly byCast: number;
}

const SOURCE_FAMILY: Readonly<Record<string, string>> = { SEC: "sec", FED: "fed", NEWS: "press" };

export function newsCensus(links: readonly NewsLink[]): NewsCensus {
  const bySource: Record<string, number> = {};
  const byEvidence: Record<string, number> = {};
  const byForce: Record<string, number> = {};
  const bump = (t: Record<string, number>, k: string): void => {
    t[k] = (t[k] ?? 0) + 1;
  };
  let byCast = 0;
  for (const link of links) {
    bump(bySource, SOURCE_FAMILY[link.source.split(":")[0] ?? ""] ?? "press");
    bump(byEvidence, link.evidence);
    for (const r of link.reasons) if (r.via === "force") bump(byForce, r.force);
    if (link.reasons.some((r) => r.via === "cast")) byCast += 1;
  }
  return { linked: links.length, bySource, byEvidence, byForce, byCast };
}

// ── The record and its loader ──────────────────────────────────────────────────────────────────

/** A primary prefix is honest only on its publisher's own host. */
const PRIMARY_HOSTS: Readonly<Record<string, string>> = {
  SEC: "sec.gov",
  FED: "federalreserve.gov",
};

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const AT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const isText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

const hostOf = (url: string): string | undefined => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
};

/** Parse one news item, loud on the first problem; `where` names the file for the message. */
export function parseNewsItem(raw: unknown, where: string): NewsItem {
  const fail = (what: string): never => {
    throw new Error(`news: ${where}: ${what}`);
  };
  if (typeof raw !== "object" || raw === null) return fail("an item is not an object");
  const r = raw as Record<string, unknown>;
  if (!(isText(r.id) && ID_RE.test(r.id))) fail(`id "${String(r.id)}" must be a lowercase slug`);
  const id = r.id as string;
  if (!isText(r.title)) fail(`${id}: missing title`);
  if (!(isText(r.at) && AT_RE.test(r.at))) fail(`${id}: at must be ISO-8601 UTC to the second`);
  const host = isText(r.url) ? hostOf(r.url) : undefined;
  if (!(host && /^https?:/.test(r.url as string))) fail(`${id}: url must be an http(s) URL`);
  if (!isText(r.source)) fail(`${id}: missing source`);
  const prefix = (r.source as string).split(":")[0] ?? "";
  const primary = PRIMARY_HOSTS[prefix];
  if (primary === undefined && prefix !== "NEWS")
    fail(`${id}: source must start SEC:, FED: or NEWS: (a news item is never estimated)`);
  if (primary !== undefined && !(host === primary || host?.endsWith(`.${primary}`)))
    fail(`${id}: a ${prefix}: source must link to ${primary}, not ${String(host)}; press is NEWS:`);
  return {
    id,
    title: r.title as string,
    url: r.url as string,
    at: r.at as string,
    source: r.source as string,
  };
}

/** One collector run's file: what it kept, and when it ran. */
export interface NewsFile {
  readonly collectedAt: string;
  readonly items: readonly NewsItem[];
}

export function parseNewsFile(raw: unknown, where: string): NewsFile {
  const r = (raw ?? {}) as Record<string, unknown>;
  if (!(isText(r.collectedAt) && AT_RE.test(r.collectedAt)))
    throw new Error(`news: ${where}: collectedAt must be ISO-8601 UTC to the second`);
  if (!Array.isArray(r.items)) throw new Error(`news: ${where}: items must be a list`);
  return { collectedAt: r.collectedAt, items: r.items.map((i) => parseNewsItem(i, where)) };
}

/** Where the collector writes, relative to the repo root. */
export const NEWS_DIR = join("src", "domain", "news");

/**
 * Every checked-in item, each id once (the first file wins), newest first. Read on call, never at
 * import: nothing on the server's boot path should pay for the harvest until slice 5 reads it.
 */
export function loadNews(dir: string = join(process.cwd(), NEWS_DIR)): NewsItem[] {
  if (!existsSync(dir)) return [];
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const f of readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .sort()) {
    for (const item of parseNewsFile(JSON.parse(readFileSync(join(dir, f), "utf8")), f).items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  return items.sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
}
