/**
 * The free news collector's sources (#6949 slice 4): three readers that turn a source's own reply
 * into `NewsItem`s, and the run that keeps only the items a campaign's title test links. The CLI
 * (src/scripts/news-collect.ts) does the fetching and writing; everything here takes the fetched
 * body, so the specs run on fixtures with no network.
 *
 * FREE, NO KEY, NO ACCOUNT (the slice's done line; a paid feed is the spend class):
 *   - SEC EDGAR submissions (data.sec.gov) — a cast company's own 8-K (6-K for a foreign issuer).
 *     Primary: `SEC:`, measured. EDGAR asks for a contactable User-Agent and ≤10 requests/second,
 *     the same terms src/adapters/edgar-filings.ts and scripts/research/market-data.mjs keep.
 *   - The Federal Reserve Board's press-release RSS. Primary: `FED:`, measured.
 *   - GDELT's DOC 2.0 article search (api.gdeltproject.org) — press headlines worldwide. `NEWS:`,
 *     reported. It asks for no more than one request every 5 seconds; the CLI waits between calls.
 *
 * A query here is only a recall net. What gets kept is decided by campaign-news.ts → `linkNews` on
 * the stored title, the same test anyone can re-run on the checked-in file.
 */
import { createHash } from "node:crypto";
import { linkNews, type NewsItem, namesOf } from "../domain/campaign-news.js";
import { type Campaign, castSymbols, type ForceName } from "../domain/campaigns.js";

// ── SEC EDGAR ──────────────────────────────────────────────────────────────────────────────────

/** The 8-K items a headline should say in words; the rest show as "Item x.xx". */
const EIGHT_K_ITEMS: Readonly<Record<string, string>> = {
  "1.01": "Material Definitive Agreement",
  "1.02": "Termination of a Material Definitive Agreement",
  "2.01": "Completion of Acquisition or Disposition",
  "2.02": "Results of Operations and Financial Condition",
  "2.03": "Creation of a Direct Financial Obligation",
  "2.05": "Costs Associated with Exit or Disposal Activities",
  "2.06": "Material Impairments",
  "3.02": "Unregistered Sales of Equity Securities",
  "3.03": "Material Modification to Rights of Security Holders",
  "5.02": "Departure or Appointment of Directors or Officers",
  "5.03": "Amendments to Articles of Incorporation or Bylaws",
  "5.07": "Submission of Matters to a Vote of Security Holders",
  "7.01": "Regulation FD Disclosure",
  "8.01": "Other Events",
};

/** Words for an 8-K's items; 9.01 (exhibits) is left out because every 8-K carries it. */
export function eightKWords(items: string): string {
  const words = items
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s !== "9.01")
    .map((s) => EIGHT_K_ITEMS[s] ?? `Item ${s}`);
  return words.length > 0 ? words.join("; ") : "Financial Statements and Exhibits";
}

/** CIKs from sec.gov/files/company_tickers.json, keyed by uppercase ticker. */
export function cikMap(body: unknown): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const row of Object.values(
    (body ?? {}) as Record<string, { ticker?: unknown; cik_str?: unknown }>,
  )) {
    if (
      typeof row?.ticker === "string" &&
      (typeof row.cik_str === "number" || typeof row.cik_str === "string")
    )
      map.set(row.ticker.toUpperCase(), String(row.cik_str).padStart(10, "0"));
  }
  return map;
}

interface RecentFilings {
  form?: unknown[];
  accessionNumber?: unknown[];
  acceptanceDateTime?: unknown[];
  items?: unknown[];
  primaryDocument?: unknown[];
}

/**
 * A company's 8-Ks and 6-Ks accepted on or after `sinceIso` (YYYY-MM-DD), from its
 * data.sec.gov/submissions reply. The title opens with the company's name and its ticker in
 * parentheses, so the title test links it to the symbol it was fetched for and to nothing else.
 */
export function edgarItems(
  symbol: string,
  cik: string,
  body: unknown,
  sinceIso: string,
): NewsItem[] {
  const recent = (body as { filings?: { recent?: RecentFilings } })?.filings?.recent;
  if (!(recent && Array.isArray(recent.form))) return [];
  const sym = symbol.toUpperCase();
  const name = namesOf(sym)[0] ?? sym;
  const out: NewsItem[] = [];
  recent.form.forEach((form, i) => {
    if (form !== "8-K" && form !== "6-K") return;
    const accession = recent.accessionNumber?.[i];
    const accepted = recent.acceptanceDateTime?.[i];
    if (typeof accession !== "string" || typeof accepted !== "string") return;
    const at = `${accepted.slice(0, 19)}Z`;
    if (at.slice(0, 10) < sinceIso || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(at)) return;
    const doc = recent.primaryDocument?.[i];
    const folder = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replace(/-/g, "")}`;
    const what =
      form === "8-K" ? eightKWords(String(recent.items?.[i] ?? "")) : "report of a foreign issuer";
    out.push({
      id: `sec-${sym.toLowerCase().replace(/[^a-z0-9]/g, "")}-${accession}`,
      title: `${name} (${sym}) ${form}: ${what}`,
      url: typeof doc === "string" && doc.length > 0 ? `${folder}/${doc}` : `${folder}/`,
      // EDGAR writes the acceptance time with a trailing Z; kept to the second, as written.
      at,
      source: `SEC: EDGAR ${form} ${accession}`,
    });
  });
  return out;
}

// ── The Federal Reserve's press releases (RSS) ──────────────────────────────────────────────────

const cdata = (s: string): string =>
  s
    .replace(/^\s*<!\[CDATA\[/, "")
    .replace(/\]\]>\s*$/, "")
    .trim();

const tag = (xml: string, name: string): string | undefined => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m?.[1] === undefined ? undefined : cdata(m[1]);
};

const decodeEntities = (s: string): string =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

/** Press releases from federalreserve.gov/feeds/press_all.xml published on or after `sinceIso`. */
export function fedItems(xml: string, sinceIso: string): NewsItem[] {
  const out: NewsItem[] = [];
  for (const block of xml.match(/<item>[\s\S]*?<\/item>/g) ?? []) {
    const title = tag(block, "title");
    const link = tag(block, "link");
    const pub = tag(block, "pubDate");
    if (!(title && link && pub)) continue;
    const when = new Date(pub);
    if (Number.isNaN(when.getTime())) continue;
    const at = `${when.toISOString().slice(0, 19)}Z`;
    if (at.slice(0, 10) < sinceIso) continue;
    const page =
      link
        .split("/")
        .pop()
        ?.replace(/\.htm.*$/, "") ?? "";
    out.push({
      id: `fed-${page.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: decodeEntities(title),
      url: link,
      at,
      source: "FED: federalreserve.gov press release",
    });
  }
  return out;
}

// ── GDELT's article search ─────────────────────────────────────────────────────────────────────

/**
 * The word a force name is searched by. GDELT refuses a search word under three letters ("AI"), and
 * a search is a recall net only, so a list name is searched by its FIRST word of three letters or
 * more — the campaign file puts the distinctive word first (`["layoff", "AI"]`) — and the title
 * test checks every word after.
 */
export const queryWord = (name: ForceName): string | undefined =>
  typeof name === "string" ? name : name.find((w) => w.length >= 3);

const quote = (w: string): string => (/[^A-Za-z0-9]/.test(w) ? `"${w}"` : w);
const anyOf = (words: readonly (string | undefined)[]): string | undefined => {
  const list = [...new Set(words.filter((w): w is string => w !== undefined && w.length >= 3))];
  return list.length === 0 ? undefined : `(${list.map(quote).join(" OR ")}) sourcelang:english`;
};

/** GDELT refuses a search that is too long; the cast's names go in groups of this many. */
const CAST_TERMS_PER_QUERY = 8;

/**
 * The searches for one campaign: the cast companies' names in small groups, then one per force,
 * so a busy force (rates) cannot use up a quiet one's results. A fund's long name rarely makes a
 * headline, but its cashtag does, and EDGAR and the Fed reach the rest.
 */
export function gdeltQueries(campaign: Campaign): readonly string[] {
  const names = [...new Set(castSymbols(campaign).flatMap((s) => namesOf(s)))];
  const groups: string[][] = [];
  for (let i = 0; i < names.length; i += CAST_TERMS_PER_QUERY)
    groups.push(names.slice(i, i + CAST_TERMS_PER_QUERY));
  const cast = groups.map(anyOf);
  const forces = campaign.forces.map((f) => anyOf((f.names ?? []).map(queryWord)));
  return [...cast, ...forces].filter((q): q is string => q !== undefined);
}

export function gdeltUrl(query: string, maxRecords: number, timespan: string): string {
  const q = encodeURIComponent(query);
  return `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&format=json&maxrecords=${maxRecords}&timespan=${timespan}&sort=datedesc`;
}

/**
 * GDELT tokenises headlines and writes them back spaced ("$2 . 5 trillion", "$3, 800", "( AMD )");
 * put the punctuation back where the outlet had it. Words are never changed.
 */
export function tidyTitle(title: string): string {
  return title
    .replace(/(?<!\d)(\d{1,3}) ?, (\d{3})(?!\d)/g, "$1,$2")
    .replace(/(\d) ?\. (\d)/g, "$1.$2")
    .replace(/\(\s+/g, "(")
    .replace(/\s+([.,:;!?%)])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** Articles from a GDELT `artlist` reply. `seendate` (20261107T070000Z) is when GDELT saw it. */
export function gdeltItems(body: unknown): NewsItem[] {
  const articles = (body as { articles?: unknown[] })?.articles;
  if (!Array.isArray(articles)) return [];
  const out: NewsItem[] = [];
  for (const a of articles as Record<string, unknown>[]) {
    const { url, title, seendate, domain } = a;
    if (typeof url !== "string" || typeof title !== "string" || typeof seendate !== "string")
      continue;
    const m = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (!m) continue;
    const hash = createHash("sha1").update(url).digest("hex").slice(0, 12);
    const outlet = typeof domain === "string" && domain.length > 0 ? domain : new URL(url).hostname;
    out.push({
      id: `gdelt-${hash}`,
      title: tidyTitle(title),
      url,
      at: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`,
      source: `NEWS: ${outlet} via GDELT`,
    });
  }
  return out;
}

// ── What a run keeps ───────────────────────────────────────────────────────────────────────────

/** A headline as a dedupe key: one story syndicated under many URLs is one item. */
const titleKey = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * The items worth checking in: new ones that at least one campaign's title test links, each story
 * once. Earliest first, so a syndicated story keeps its first publication. An item no campaign
 * names is dropped here, so the harvest holds nothing the linker would not.
 */
export function keepLinked(
  campaigns: readonly Campaign[],
  fetched: readonly NewsItem[],
  known: readonly NewsItem[],
): NewsItem[] {
  const ids = new Set(known.map((i) => i.id));
  const titles = new Set(known.map((i) => titleKey(i.title)));
  const fresh: NewsItem[] = [];
  const byTime = [...fetched].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  for (const item of byTime) {
    const key = titleKey(item.title);
    if (ids.has(item.id) || titles.has(key)) continue;
    ids.add(item.id);
    titles.add(key);
    fresh.push(item);
  }
  const linked = new Set(campaigns.flatMap((c) => linkNews(c, fresh).map((l) => l.item.id)));
  return fresh.filter((i) => linked.has(i.id));
}
