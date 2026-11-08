/**
 * THE DAY'S EDITION: the market news a member lands on after sign-in (#7077, parent #6948 slice 4).
 *
 * Eric (#7018 round 0, 2026-11-08): "I don't care for the leaderboard as the landing page." His
 * round-1 note on the lead story set the shape: "flag the key elements of this event as something
 * to pay attention too, but to apply progressive disclosure to withold the bulk of the information
 * until a user expresses interest." So a story is held in two halves: its KEY FACTS (what moved, by
 * how much, and the dated reports that bear on it) shown on the tile, and the REST (`more`), opened
 * only on a tap. One narrator line rides each story in a mission voice; the headline stays news.
 *
 * WRITTEN BY HAND, FOR NOW. Nothing produces an edition yet: #6949 slice 5 (the landscape read)
 * will, and #6948 slice 4 voices it. Until then each edition is a checked-in JSON file,
 * `src/domain/editions/<YYYY-MM-DD>.json`, named for the market close it describes, the same
 * one-file-per-record shape `campaigns.ts` uses. When the writer lands it writes this same record,
 * so the page never learns where an edition came from.
 *
 * HONESTY IS CHECKED HERE, NOT TRUSTED (#7077 criterion 7; docs/process/EVENT-RESEARCH.md →
 * Honesty rules). The loader refuses an edition that:
 *   - states a base rate ("38% of the time") without its sample size `n`;
 *   - frames a time as good to buy ("buy the dip", "buying opportunity", "chance to buy" …);
 *   - leaves a line unmarked: every line is measured, reported (shown as unconfirmed), modeled
 *     (shown as "modeled") or a house call, with its source;
 *   - borrows a franchise's catchphrase in the narrator line (criterion 4). A deny-list is a floor,
 *     not a proof: the narrator is still written to be original.
 *
 * NOTHING LOADS AT IMPORT (and why the small regexes and `isText` below are local, not imported
 * from campaigns.ts: importing that module loads every campaign file). The server's whole import graph reaches this module, and the study
 * worlds run that graph inside a corpus pinned to an older commit (scripts/study/worlds/
 * compose.mjs), where neither `editions/` nor `campaigns/` exists. So the files are read on the
 * first request (`editions()`), and the campaign's title is handed in by the caller rather than
 * imported; the spec proves every edition's campaign is a real record.
 *
 * Paper only; educational. An edition never places an order and never sizes one.
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { daysBetween } from "./market-calendar.js";
import { marketDayKey } from "./market-day.js";

/** How a line knows what it says. `reported` renders as unconfirmed, `modeled` says so. */
export const EDITION_MARKS = ["measured", "reported", "modeled", "call"] as const;
export type EditionMark = (typeof EDITION_MARKS)[number];

/** One key fact on a story's tile: what moved and by how much. */
export interface EditionFact {
  /** What it is, in plain words ("SMH, the chip fund"). */
  readonly label: string;
  /** The number, preformatted with its sign ("−11.2%", "186.64"). */
  readonly value: string;
  /** When, and against what ("Thu Nov 5 · worst day since Mar 16, 2020"). */
  readonly note?: string;
  /** Absent means measured. */
  readonly mark?: EditionMark;
  /** The sample size, required when the fact states a base rate. */
  readonly n?: number;
}

/** A dated report or event that bears on a story, or on the week (`next`). */
export interface EditionDate {
  /** YYYY-MM-DD, in New York. */
  readonly date: string;
  /** The time of day, in plain words ("after the close", "08:30 ET"). */
  readonly when?: string;
  readonly what: string;
  /** `confirmed` by its publisher, or our `estimate` from a cadence. */
  readonly status: "confirmed" | "estimate";
}

/** One line of the rest of a story, opened on a tap. */
export interface EditionLine {
  readonly text: string;
  readonly mark: EditionMark;
  /** Where it comes from: a research file, a fetch, a press citation. */
  readonly source: string;
  /** The sample size, required when the line states a base rate. */
  readonly n?: number;
}

export interface EditionStory {
  /** Slug, unique within the edition. */
  readonly id: string;
  /** The headline, in the news voice. */
  readonly headline: string;
  /** At most one line in the mission voice (criterion 4). */
  readonly narrator?: string;
  /** The tickers the story is about. */
  readonly symbols: readonly string[];
  /** Key facts first, 1 to 4 of them. */
  readonly facts: readonly EditionFact[];
  /** The dated reports that bear on this story, on its own tile. */
  readonly reports: readonly EditionDate[];
  /** The rest, opened only when the member taps for more. */
  readonly more: readonly EditionLine[];
}

export interface Edition {
  /** The market close it describes, YYYY-MM-DD; equals the file name. */
  readonly date: string;
  /** The campaign the stories belong to, when they do (`src/domain/campaigns/<id>.json`). */
  readonly campaign?: string;
  /** Who or what wrote it, said plainly ("Written by hand from the research ledgers …"). */
  readonly writtenBy: string;
  /** Lead story first. */
  readonly stories: readonly EditionStory[];
  /** What's next for the week, in date order. */
  readonly next: readonly EditionDate[];
}

// ── The honesty checks ──────────────────────────────────────────────────────────────────────────

/** A stated base rate: "38% of the time", "filled 12% …of the time". */
const BASE_RATE_RE = /\d+(?:\.\d+)?% of the time/i;

/** Copy that frames a time as good to buy. The page may pair a fall with the coming reports; it
 *  never calls it a buy (#7077, constraints: "The page never calls it a buy"). */
const BUY_FRAMING_RE =
  /\b(?:good|great|right|best|perfect|ideal) (?:time|moment|day|entry|chance) to (?:buy|get in)\b|\bbuy(?:ing)? the dip\b|\bbuying opportunity\b|\bchance to buy\b|\b(?:should|must) buy\b|\bdon'?t miss\b/i;

/** Phrases lifted from existing franchises. A floor, not a proof (criterion 4). Bare words that are
 *  also market words (Enterprise software, Vulcan Materials) are left out on purpose. */
const FRANCHISE_RE =
  /\b(?:captain'?s log|stardate|star ?fleet|uss enterprise|make it so|final frontier|boldly go|beam (?:me|us) up|warp speed|resistance is futile|live long and prosper|may the force|jedi|wookiee|klingon)\b/i;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const SYMBOL_RE = /^[A-Z][A-Z0-9.]{0,9}$/;
const MAX_NARRATOR = 160;
const MAX_FACTS = 4;

type Raw = Record<string, unknown>;
type Fail = (what: string) => never;

const isText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const isMark = (v: unknown): v is EditionMark => (EDITION_MARKS as readonly unknown[]).includes(v);
const isN = (v: unknown): boolean => typeof v === "number" && Number.isInteger(v) && v > 0;
const isObject = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);

/** Every entry of a list is an object, or the loader names the list rather than throwing a bare
 *  TypeError on its first field read. */
function objects(list: unknown, where: string, fail: Fail): Raw[] {
  if (!(Array.isArray(list) && list.every(isObject))) fail(`${where} must be a list of objects`);
  return list as Raw[];
}

/** No two entries of a list share a key: the page keys its rows by it, and a repeat is a typo. */
function distinct(list: readonly Raw[], key: (r: Raw) => string, where: string, fail: Fail): void {
  const keys = list.map(key);
  const twice = keys.find((k, i) => keys.indexOf(k) !== i);
  if (twice !== undefined) fail(`${where} lists "${twice}" twice`);
}

const dateKey = (d: Raw): string => `${String(d.date)} ${String(d.what)}`;

/** Every word a member reads in one piece of copy, checked for buy framing. */
function checkCopy(text: string, where: string, fail: Fail): void {
  if (BUY_FRAMING_RE.test(text)) fail(`${where} frames a time as good to buy: "${text}"`);
}

function checkBaseRate(text: string, n: unknown, where: string, fail: Fail): void {
  if (BASE_RATE_RE.test(text) && !isN(n)) fail(`${where} states a base rate with no sample size n`);
  if (n !== undefined && !isN(n)) fail(`${where}: n must be a positive whole number`);
}

function checkDate(d: Raw, where: string, fail: Fail): void {
  if (!(isText(d.date) && DATE_RE.test(d.date))) fail(`${where}: date must be YYYY-MM-DD`);
  if (!isText(d.what)) fail(`${where}: missing what`);
  if (d.when !== undefined && !isText(d.when)) fail(`${where}: when must be text`);
  if (d.status !== "confirmed" && d.status !== "estimate")
    fail(`${where}: status must be confirmed or estimate`);
  checkCopy(d.what as string, where, fail);
}

function checkFact(f: Raw, where: string, fail: Fail): void {
  if (!(isText(f.label) && isText(f.value))) fail(`${where}: a fact needs a label and a value`);
  if (f.note !== undefined && !isText(f.note)) fail(`${where}: note must be text`);
  if (f.mark !== undefined && !isMark(f.mark)) fail(`${where}: unknown mark "${String(f.mark)}"`);
  const copy = `${String(f.label)} ${String(f.value)} ${String(f.note ?? "")}`;
  checkBaseRate(copy, f.n, where, fail);
  checkCopy(copy, where, fail);
}

function checkLine(l: Raw, where: string, fail: Fail): void {
  if (!isText(l.text)) fail(`${where}: missing text`);
  if (!isMark(l.mark)) fail(`${where}: mark must be one of ${EDITION_MARKS.join(", ")}`);
  if (!isText(l.source)) fail(`${where}: names no source`);
  checkBaseRate(l.text as string, l.n, where, fail);
  checkCopy(l.text as string, where, fail);
}

function checkStory(s: Raw, fail: Fail): void {
  const id = String(s.id);
  if (!(isText(s.id) && SLUG_RE.test(s.id))) fail("a story id must be a slug");
  if (!isText(s.headline)) fail(`story "${id}" has no headline`);
  checkCopy(s.headline as string, `story "${id}" headline`, fail);
  if (s.narrator !== undefined) {
    if (!isText(s.narrator)) fail(`story "${id}": narrator must be one line of text`);
    const line = s.narrator as string;
    if (line.length > MAX_NARRATOR || line.includes("\n"))
      fail(`story "${id}": the narrator is one line of at most ${MAX_NARRATOR} characters`);
    if (FRANCHISE_RE.test(line)) fail(`story "${id}": the narrator borrows a franchise phrase`);
    checkCopy(line, `story "${id}" narrator`, fail);
  }
  if (!(Array.isArray(s.symbols) && s.symbols.every((x) => isText(x) && SYMBOL_RE.test(x))))
    fail(`story "${id}": symbols must be uppercase tickers`);
  const facts = objects(s.facts, `story "${id}": facts`, fail);
  if (facts.length === 0 || facts.length > MAX_FACTS)
    fail(`story "${id}": key facts must be 1 to ${MAX_FACTS}`);
  for (const [i, f] of facts.entries()) checkFact(f, `story "${id}" fact ${i + 1}`, fail);
  distinct(facts, (f) => String(f.label), `story "${id}": facts`, fail);
  const reports = objects(s.reports, `story "${id}": reports`, fail);
  for (const [i, d] of reports.entries()) checkDate(d, `story "${id}" report ${i + 1}`, fail);
  distinct(reports, dateKey, `story "${id}": reports`, fail);
  const more = objects(s.more, `story "${id}": more`, fail);
  for (const [i, l] of more.entries()) checkLine(l, `story "${id}" line ${i + 1}`, fail);
  distinct(more, (l) => String(l.text), `story "${id}": more`, fail);
}

/**
 * Parse one edition file, loud on the first problem and naming the file. The record is data a
 * writer will produce (#6949 slice 5), so every field is checked rather than trusted — the same
 * function judges a hand-written file and a generated one.
 */
export function parseEdition(raw: unknown, file: string, expectedDate: string): Edition {
  const fail: Fail = (what) => {
    throw new Error(`editions: ${file}: ${what}`);
  };
  if (typeof raw !== "object" || raw === null) fail("not an object");
  const e = raw as Raw;
  if (!(isText(e.date) && DATE_RE.test(e.date))) fail("date must be YYYY-MM-DD");
  if (e.date !== expectedDate) fail(`date "${String(e.date)}" must equal the file name`);
  if (e.campaign !== undefined && !(isText(e.campaign) && SLUG_RE.test(e.campaign)))
    fail(`campaign "${String(e.campaign)}" must be a campaign id`);
  if (!isText(e.writtenBy)) fail("say who or what wrote it (writtenBy)");
  const stories = objects(e.stories, "stories", fail);
  if (stories.length === 0) fail("stories must be a non-empty list");
  for (const s of stories) checkStory(s, fail);
  const ids = stories.map((s) => s.id);
  const twice = ids.find((id, i) => ids.indexOf(id) !== i);
  if (twice !== undefined) fail(`story "${String(twice)}" is listed twice`);
  const next = objects(e.next, "next", fail);
  for (const [i, d] of next.entries()) checkDate(d, `next ${i + 1}`, fail);
  distinct(next, dateKey, "next", fail);
  return raw as Edition;
}

// ── The loader ────────────────────────────────────────────────────────────────────────────────

/** Where edition files live, relative to the repo root (market-events-data.ts → PATH RESOLUTION). */
const EDITIONS_DIR = join("src", "domain", "editions");

/** Read every `<date>.json` under `dir`, oldest first. Exported so specs can point it at a fixture. */
export function loadEditions(dir: string = join(process.cwd(), EDITIONS_DIR)): Edition[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) =>
      parseEdition(JSON.parse(readFileSync(join(dir, f), "utf8")), f, basename(f, ".json")),
    );
}

let loaded: readonly Edition[] | undefined;

/** Every checked-in edition, read once on first use (see NOTHING LOADS AT IMPORT above). */
export function editions(): readonly Edition[] {
  loaded ??= loadEditions();
  return loaded;
}

// ── The read the page gets ───────────────────────────────────────────────────────────────────────

/** A story's dated report, as the page reads it: `passed` once its day is behind today. */
export type EditionReportView = EditionDate & { readonly passed?: true };

/** One story as the page reads it: its reports kept, a passed one marked. */
export type EditionStoryView = Omit<EditionStory, "reports"> & {
  readonly reports: readonly EditionReportView[];
};

/** What `/api/edition` answers: the latest edition on or before today, what's next cut to the items
 *  still ahead, each story's reports marked once passed, the campaign's title, and the edition's
 *  age. `edition: null` is the honest empty state. */
export interface EditionView {
  readonly edition:
    | (Omit<Edition, "stories"> & {
        readonly campaignTitle?: string;
        /** Calendar days from the close it describes to today. */
        readonly ageDays: number;
        readonly stories: readonly EditionStoryView[];
      })
    | null;
  /** Today in New York (YYYY-MM-DD), the day the dates were read against. */
  readonly today: string;
}

/** Today's date in New York, through market-day.ts, the one place an instant becomes a market day. */
export function marketToday(now: Date): string {
  return marketDayKey(now.toISOString());
}

/**
 * The page's read. What's next looks forward, so an item whose day has passed leaves it. A story
 * is written as of its close, so its reports stay and a passed one is marked: the story's own words
 * ("three reports are inbound") keep matching the list beside them. The edition's age rides along,
 * so the page can say plainly when the news is not today's.
 */
export function editionView(
  editions: readonly Edition[],
  now: Date,
  campaignTitle: (id: string) => string | undefined,
): EditionView {
  const today = marketToday(now);
  const latest = [...editions].reverse().find((e) => e.date <= today);
  if (!latest) return { edition: null, today };
  const ahead = (d: EditionDate) => d.date >= today;
  const title = latest.campaign ? campaignTitle(latest.campaign) : undefined;
  return {
    today,
    edition: {
      ...latest,
      ...(title ? { campaignTitle: title } : {}),
      ageDays: daysBetween(latest.date, today),
      stories: latest.stories.map((s) => ({
        ...s,
        reports: s.reports.map((r) => (ahead(r) ? r : { ...r, passed: true as const })),
      })),
      next: latest.next.filter(ahead),
    },
  };
}
