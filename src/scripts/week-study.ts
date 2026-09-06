/**
 * CLI: compose `docs/research/weeks/<ISO-week>.md` — the weekly study genre (#1716).
 *
 * The mechanical half of the market week: it joins the event calendar to the ledgers on the shelf,
 * quotes each ledger's own `This week` row, and writes one document. It reads the corpus and writes
 * one file; it never fetches a tape, never forms an opinion, and never registers a forward test.
 * The reasoning for a script rather than a session is in src/research/week-study.ts's header.
 *
 * Usage:
 *   npm run research:week                     # the market week of today (a Sunday resolves forward)
 *   npm run research:week -- --week 2026-W37  # a named ISO week
 *   npm run research:week -- --stdout         # print it, write nothing
 *   npm run research:week -- --min 0          # compose even a thin week (default minimum is 3)
 *   npm run research:week -- --force          # rewrite a CLOSED week's file (append-only by default)
 *
 * Exit status is 0 for a skipped week — a quiet week is a real answer, not a failure. It is 1 only
 * when the corpus cannot be read or a closed week would be silently rewritten (loud failure).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { everyEvent } from "../domain/market-events.js";
import { trackedUnderlyings } from "../research/tracked-underlyings.js";
import {
  composeWeekStudy,
  marketWeekOf,
  rangeOfIsoWeek,
  type WeekEntry,
  type WeekRange,
  weekHasClosed,
} from "../research/week-study.js";
import { adjacentIdsOf, horizonRowsOf } from "../server/research-event-calls.js";

/** A week thinner than this is not a week worth a document — the brief's own floor. */
const DEFAULT_MIN_EVENTS = 3;

const ROOT = process.cwd();
const EVENTS_DIR = join(ROOT, "docs", "research", "events");
const WEEKS_DIR = join(ROOT, "docs", "research", "weeks");

const flag = (argv: readonly string[], name: string): string | undefined => {
  const at = argv.indexOf(`--${name}`);
  return at === -1 ? undefined : argv[at + 1];
};

/** Every researched event dated inside the range, in date order, joined to its ledger's week row. */
export function collectEntries(range: WeekRange, eventsDir = EVENTS_DIR): WeekEntry[] {
  return everyEvent()
    .filter((event) => event.date >= range.start && event.date <= range.end)
    .flatMap((event) => {
      const file = join(eventsDir, `${event.id}.md`);
      if (!existsSync(file)) return [];
      const md = readFileSync(file, "utf8");
      return [
        {
          id: event.id,
          title: event.title,
          date: event.date,
          impact: event.impact,
          symbols: event.symbols,
          row: horizonRowsOf(md).week ?? null,
          adjacent: adjacentIdsOf(md),
        },
      ];
    });
}

/** Event ids with a ledger on the shelf — so a hub row links only where a page actually exists. */
const shelfLedgerIds = (eventsDir = EVENTS_DIR): ReadonlySet<string> =>
  new Set(
    readdirSync(eventsDir)
      .filter((f) => f.endsWith(".md") && f !== "TEMPLATE.md" && f !== "README.md")
      .map((f) => f.replace(/\.md$/, "")),
  );

function main(argv: readonly string[]): number {
  const asOf = flag(argv, "as-of") ?? new Date().toISOString().slice(0, 10);
  const weekArg = flag(argv, "week");
  const range = weekArg ? rangeOfIsoWeek(weekArg) : marketWeekOf(asOf);
  const min = Number(flag(argv, "min") ?? DEFAULT_MIN_EVENTS);
  const entries = collectEntries(range);

  if (entries.length < min) {
    console.log(
      `skipped ${range.isoWeek} (${range.start}…${range.end}) — ${entries.length} researched ` +
        `event(s) in range, minimum ${min}. Nothing written.`,
    );
    return 0;
  }

  const md = composeWeekStudy({
    range,
    entries,
    trackedNames: trackedUnderlyings(),
    ledgerIds: shelfLedgerIds(),
    composedOn: asOf,
  });

  if (argv.includes("--stdout")) {
    console.log(md);
    return 0;
  }

  const out = join(WEEKS_DIR, `${range.isoWeek}.md`);
  if (existsSync(out) && weekHasClosed(range, asOf) && !argv.includes("--force")) {
    console.error(
      `✗ ${range.isoWeek} closed on ${range.end} and its study already exists — a closed week is ` +
        "append-only. Re-read it, or pass --force if the ledgers themselves were corrected.",
    );
    return 1;
  }
  mkdirSync(WEEKS_DIR, { recursive: true });
  writeFileSync(out, md);
  console.log(
    `✓ ${range.isoWeek} (${range.start}…${range.end}) — ${entries.length} researched events → ` +
      `docs/research/weeks/${range.isoWeek}.md`,
  );
  return 0;
}

process.exit(main(process.argv.slice(2)));
