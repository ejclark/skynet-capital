/**
 * CLI: confirm forward-looking earnings-print dates against a live calendar source, and rewrite
 * `UPCOMING_PRINTS` in earnings-calendar.ts in place. This is the automated half of the manual
 * step done by hand for NVDA — closing docs/plans/trade-playbooks.md's
 * "how does research get applied automatically" gap without crossing the irreversible-class
 * boundary: this script only ever flips `estimate` → `confirmed` in a checked-in, reviewed table.
 * It never touches credentials, never places an order, and its output ships as an ordinary
 * auto-merge-on-green PR exactly like any other plumbing change (docs/COACHES.md doctrine).
 *
 * SOURCE: Nasdaq's public earnings-calendar endpoint (api.nasdaq.com/api/calendar/earnings),
 * queried by DATE (not by symbol — there is no symbol-indexed lookup), so this fetches one
 * response per candidate date and cross-references every still-`estimate` symbol against it.
 * It is a third-party AGGREGATOR of company announcements, not the announcement itself — hence
 * the `CAL:` source prefix (distinct from a hand-verified `IR:` citation). Requires browser-like
 * headers and HTTP/1.1; a bare fetch gets an empty/blocked response (verified live, 2026-08-12).
 *
 * Usage:
 *   tsx src/scripts/confirm-print-dates.ts            # confirms + rewrites the file
 *   tsx src/scripts/confirm-print-dates.ts --dry-run   # reports what WOULD change, writes nothing
 *
 * Scope discipline: only attempts confirmation for prints within CONFIRM_LOOKAHEAD_DAYS — mega-cap
 * IR rarely announces a call date more than ~4-5 weeks out, so scanning a name 10 weeks away just
 * burns requests for a near-certain miss. Already-`confirmed` entries are left untouched.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { daysUntil, type EarningsPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";

const CALENDAR_FILE = join(process.cwd(), "src", "domain", "earnings-calendar.ts");
const CACHE = join(process.cwd(), "node_modules", ".cache", "confirm-print-dates");
const CONFIRM_LOOKAHEAD_DAYS = 35;
const SEARCH_WINDOW_DAYS = 7; // +/- around the current estimate

interface NasdaqRow {
  readonly symbol: string;
  readonly time: string; // e.g. "time-after-hours" | "time-pre-market" | "time-not-supplied"
}

/** All calendar-day date strings from `date - window` to `date + window`, inclusive. */
function datesAround(date: string, window: number): string[] {
  const center = new Date(`${date}T00:00:00Z`);
  const out: string[] = [];
  for (let offset = -window; offset <= window; offset++) {
    const d = new Date(center);
    d.setUTCDate(d.getUTCDate() + offset);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Nasdaq's calendar for one date, cached — a re-run of this script costs nothing extra.
 * Nasdaq's endpoint is flaky under back-to-back requests (verified live: a burst of ~8 rapid
 * calls drew a 503) — retried with backoff, and a persistent failure returns `[]` rather than
 * aborting the whole run: one date's outage should not block confirming every OTHER symbol.
 */
async function fetchDay(date: string): Promise<NasdaqRow[]> {
  mkdirSync(CACHE, { recursive: true });
  const cachePath = join(CACHE, `${date}.json`);
  if (existsSync(cachePath)) {
    return JSON.parse(readFileSync(cachePath, "utf8"));
  }
  fetchOutcomes.attempts++;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://api.nasdaq.com/api/calendar/earnings?date=${date}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; skynet-capital research; ejclark83@gmail.com)",
          Accept: "application/json, text/plain, */*",
          Origin: "https://www.nasdaq.com",
          Referer: "https://www.nasdaq.com/",
        },
      });
      if (!res.ok) {
        throw new Error(`${res.status} ${res.statusText}`);
      }
      const body = (await res.json()) as { data?: { rows?: NasdaqRow[] } };
      const rows = body.data?.rows ?? [];
      writeFileSync(cachePath, JSON.stringify(rows));
      await sleep(300); // be polite between successful calls too
      return rows;
    } catch (error) {
      console.warn(`[confirm-print-dates] ${date} attempt ${attempt} failed: ${error}`);
      if (attempt < 3) {
        await sleep(attempt * 1000);
      }
    }
  }
  console.warn(`[confirm-print-dates] ${date}: giving up after 3 attempts — treating as no data.`);
  fetchOutcomes.failures++;
  return [];
}

interface Confirmation {
  readonly symbol: string;
  readonly date: string;
  readonly source: string;
}

/** Mutated by fetchDay — lets main() tell "the source was unreachable" apart from "checked,
 *  nothing new". A run that silently treated a block as an empty answer would be worse than one
 *  that fails loudly: a scheduled caller could mistake "Nasdaq is blocking us" for "all clear". */
const fetchOutcomes = { attempts: 0, failures: 0 };

/** For one estimate, scan its search window and return a confirmation if Nasdaq lists it. */
async function confirm(print: EarningsPrint, today: string): Promise<Confirmation | undefined> {
  for (const date of datesAround(print.date, SEARCH_WINDOW_DAYS)) {
    const rows = await fetchDay(date);
    const hit = rows.find((r) => r.symbol === print.symbol);
    if (hit) {
      return {
        symbol: print.symbol,
        date,
        source: `CAL: Nasdaq earnings calendar (api.nasdaq.com/api/calendar/earnings), checked ${today} — ${hit.time.replace("time-", "").replace(/-/g, " ")}`,
      };
    }
  }
  return undefined;
}

/** Serialize one EarningsPrint back to the file's object-literal style; biome reformats after. */
function serialize(p: EarningsPrint): string {
  return `{ symbol: "${p.symbol}", date: "${p.date}", status: "${p.status}", source: "${p.source.replace(/"/g, '\\"')}" }`;
}

/**
 * Replace ONLY the changed entries inside the checked-in UPCOMING_PRINTS array literal,
 * leaving every other line of the file (comments, unrelated entries) byte-for-byte untouched.
 * A bracket-depth walk over the array body — safe here because entries are flat object literals
 * with no nested braces besides the entry's own `{...}`.
 */
function rewriteFile(source: string, updates: ReadonlyMap<string, EarningsPrint>): string {
  const marker = "export const UPCOMING_PRINTS: readonly EarningsPrint[] = [";
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`could not find "${marker}" in ${CALENDAR_FILE}`);
  }
  const bodyStart = start + marker.length;
  let depth = 1;
  let i = bodyStart;
  let entryStart = -1;
  const entries: string[] = [];
  while (depth > 0) {
    const ch = source[i];
    if (ch === "{") {
      if (depth === 1) entryStart = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 1) entries.push(source.slice(entryStart, i + 1));
    } else if (ch === "[" && depth === 1) {
      // the outer array's own opening bracket already counted; nested [] shouldn't occur, but
      // guard depth math anyway by treating it like a brace for safety.
      depth++;
    } else if (ch === "]" && depth === 2) {
      depth--;
    }
    i++;
  }
  const bodyEnd = i - 1; // position of the closing ']' of the array

  const rewritten = entries
    .map((entryText) => {
      const symbolMatch = entryText.match(/symbol:\s*"([^"]+)"/);
      const symbol = symbolMatch?.[1];
      const replacement = symbol ? updates.get(symbol) : undefined;
      return replacement ? serialize(replacement) : entryText;
    })
    .join(",\n  ");

  return `${source.slice(0, bodyStart)}\n  ${rewritten},\n${source.slice(bodyEnd)}`;
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const today = new Date().toISOString().slice(0, 10);

  const candidates = UPCOMING_PRINTS.filter(
    (p) =>
      p.status === "estimate" && daysUntil(`${today}T00:00:00Z`, p.date) <= CONFIRM_LOOKAHEAD_DAYS,
  );
  if (candidates.length === 0) {
    console.log(`[confirm-print-dates] nothing within ${CONFIRM_LOOKAHEAD_DAYS}d to check.`);
    return;
  }

  console.log(`[confirm-print-dates] checking ${candidates.map((c) => c.symbol).join(", ")}...`);
  const updates = new Map<string, EarningsPrint>();
  for (const print of candidates) {
    const hit = await confirm(print, today);
    if (!hit) {
      console.log(`[confirm-print-dates] ${print.symbol}: no calendar hit near ${print.date} yet.`);
      continue;
    }
    const drift = hit.date === print.date ? "unchanged" : `WAS ${print.date}, now ${hit.date}`;
    console.log(`[confirm-print-dates] ${print.symbol}: CONFIRMED ${hit.date} (${drift})`);
    updates.set(print.symbol, {
      symbol: print.symbol,
      date: hit.date,
      status: "confirmed",
      source: hit.source,
    });
  }

  // The reliability finding this build surfaced (2026-08-12): Nasdaq's calendar endpoint can
  // block the outbound proxy wholesale — every date fetch fails, not just some. That looks
  // identical to "checked every candidate, confirmed nothing" unless distinguished explicitly.
  if (fetchOutcomes.attempts > 0 && fetchOutcomes.failures === fetchOutcomes.attempts) {
    console.error(
      `[confirm-print-dates] SOURCE UNREACHABLE — all ${fetchOutcomes.attempts} calendar fetches failed. ` +
        "This is NOT the same as 'nothing to confirm yet' — nothing was actually checked. " +
        "Do not treat this run as a clean pass.",
    );
    process.exitCode = 2;
    return;
  }

  if (updates.size === 0) {
    console.log(
      `[confirm-print-dates] no confirmations found this run (${fetchOutcomes.attempts - fetchOutcomes.failures}/${fetchOutcomes.attempts} date fetches succeeded).`,
    );
    return;
  }
  if (dryRun) {
    console.log(
      `[confirm-print-dates] --dry-run: would update ${updates.size} entr${updates.size === 1 ? "y" : "ies"}; nothing written.`,
    );
    return;
  }

  const original = readFileSync(CALENDAR_FILE, "utf8");
  writeFileSync(CALENDAR_FILE, rewriteFile(original, updates));
  console.log(`[confirm-print-dates] wrote ${updates.size} confirmation(s) to ${CALENDAR_FILE}.`);
}

main().catch((error) => {
  console.error("[confirm-print-dates] failed:", error);
  process.exit(1);
});
