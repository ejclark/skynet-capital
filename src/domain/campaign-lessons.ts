/**
 * A CAMPAIGN'S LESSON RECORD — what discovery already found, so it is never found twice (#6952
 * slice 2, criterion 8).
 *
 * The ask (Eric, 2026-11-07): "asking about a new sector should promp discovery and retain memories
 * from lessons learned in pursuit of opportunities to profit". A campaign keeps a dated list of
 * findings, each one of three kinds:
 *   tested   — a claim the house checked against the tape and that held, with what would break it.
 *   killed   — an idea the evidence rejected. Discovery never proposes it again until its re-check
 *              date passes or new prints contradict the kill.
 *   on-watch — a name the house would watch, not enter, with the date it gets checked again.
 * Every finding carries a re-check date, a falsifier, or both: a lesson nobody can re-open or
 * re-check would be a verdict held forever, which is the stale-verdict failure this plan exists to
 * stop ("names stay honest: a stale verdict is labelled stale, never shown as current").
 *
 * It is the research lane's kill list (docs/research/multi-symbol-sweep.md → *Kill list*), scoped to
 * one campaign and held as data a program reads, not prose a session has to remember to open.
 *
 * WHERE IT LIVES. One checked-in JSON file per house campaign, `src/domain/campaign-lessons/<id>.json`,
 * beside the campaign record it belongs to and validated the same loud way (campaigns.ts → the
 * loader). A campaign with no file has no lessons yet; that is the normal start, not an error.
 *
 * HOW A KILL WITHHOLDS A NAME. Discovery proposes names, so a killed lesson withholds the symbols it
 * lists. A kill that rejects one angle on a name but not the name itself ("CEG as a midterm
 * catalyst", while CEG stays on watch for its contracts) lists no symbols and says the name in its
 * text, so the angle is remembered without blocking the name.
 *
 * WHEN DISCOVERY STARTS it calls `startDiscovery` first (the slice's done line), and proposes only
 * what `proposable` lets through. The discovery run itself is slice 2b; this module is the memory it
 * reads. Paper only; educational. A lesson never places an order and never sizes one.
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { campaignById, isText, SLUG_RE, SYMBOL_RE } from "./campaigns.js";

export const LESSON_KINDS = ["tested", "killed", "on-watch"] as const;
export type LessonKind = (typeof LESSON_KINDS)[number];

export interface Lesson {
  /** Slug, unique within the record. New prints contradicting a kill name it by this id. */
  readonly id: string;
  readonly kind: LessonKind;
  /** The idea or claim in plain words: what was proposed, and what the evidence said. */
  readonly idea: string;
  /** The names a kill withholds, or a watch follows. Empty for a lesson about the whole sector. */
  readonly symbols: readonly string[];
  /** The day the finding was recorded (YYYY-MM-DD). */
  readonly on: string;
  /** When it gets checked again (YYYY-MM-DD), the shape a conviction's `checkOn` uses (#5482). */
  readonly recheckOn?: string;
  /** What, if it printed, would prove this lesson wrong. */
  readonly falsifier?: string;
  /** The research file the finding came from. */
  readonly source: string;
}

export interface LessonRecord {
  /** The campaign id; equals the file name. */
  readonly campaign: string;
  readonly lessons: readonly Lesson[];
}

// ── Reading the record when discovery starts ──────────────────────────────────────────────────

/** What discovery knows before it researches anything (criterion 8: it reads the record first). */
export interface DiscoveryBrief {
  readonly campaign: string;
  readonly asOf: string;
  /** Killed and still closed: their symbols are never proposed. */
  readonly closed: readonly Lesson[];
  /** Killed, but the re-check date has passed or new prints contradict it: open as a new case. */
  readonly reopened: readonly Lesson[];
  /** On watch, re-check date reached: check these before looking for anything new. */
  readonly due: readonly Lesson[];
  /** On watch, not yet due. */
  readonly watching: readonly Lesson[];
  /** Claims that held, each with what would break it. */
  readonly tested: readonly Lesson[];
}

export interface StartOptions {
  /** Ids of killed lessons that new prints contradict; each reopens whatever its re-check date. */
  readonly contradicted?: Iterable<string>;
  /** The records to read; the checked-in ones by default. Specs pass a fixture. */
  readonly records?: readonly LessonRecord[];
}

/**
 * The first thing discovery does for a campaign: read its lesson record and sort it by what it
 * means for today. `asOf` is a YYYY-MM-DD date; a re-check date on or before it has passed.
 */
export function startDiscovery(
  campaign: string,
  asOf: string,
  options: StartOptions = {},
): DiscoveryBrief {
  if (!isDate(asOf)) throw new Error(`campaign-lessons: asOf "${asOf}" is not a YYYY-MM-DD date`);
  const record = (options.records ?? LESSON_RECORDS).find((r) => r.campaign === campaign);
  const contradicted = new Set(options.contradicted ?? []);
  const passed = (l: Lesson): boolean => l.recheckOn !== undefined && l.recheckOn <= asOf;
  const lessons = record?.lessons ?? [];
  const killed = lessons.filter((l) => l.kind === "killed");
  const reopens = (l: Lesson): boolean => passed(l) || contradicted.has(l.id);
  const watch = lessons.filter((l) => l.kind === "on-watch");
  return {
    campaign,
    asOf,
    closed: killed.filter((l) => !reopens(l)),
    reopened: killed.filter(reopens),
    due: watch.filter(passed),
    watching: watch.filter((l) => !passed(l)),
    tested: lessons.filter((l) => l.kind === "tested"),
  };
}

/** A candidate discovery would have proposed, held back by the kill that still closes it. */
export interface Withheld {
  readonly symbol: string;
  readonly lesson: Lesson;
}

/** Split candidate symbols into the ones discovery may propose and the ones a live kill withholds. */
export function proposable(
  brief: DiscoveryBrief,
  symbols: readonly string[],
): { readonly propose: readonly string[]; readonly withheld: readonly Withheld[] } {
  const propose: string[] = [];
  const withheld: Withheld[] = [];
  for (const raw of symbols) {
    const symbol = raw.trim().toUpperCase();
    const lesson = brief.closed.find((l) => l.symbols.includes(symbol));
    if (lesson) withheld.push({ symbol, lesson });
    else propose.push(symbol);
  }
  return { propose, withheld };
}

// ── The loader ────────────────────────────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar day in YYYY-MM-DD, so "2027-02-30" is refused rather than compared as text. */
function isDate(v: unknown): v is string {
  if (typeof v !== "string" || !DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

type Raw = Record<string, unknown>;
type Fail = (what: string) => never;

function checkLesson(l: Raw, fail: Fail): void {
  const id = String(l.id);
  if (!(isText(l.id) && SLUG_RE.test(l.id))) fail("a lesson id must be a lowercase slug");
  if (!(LESSON_KINDS as readonly unknown[]).includes(l.kind))
    fail(`lesson "${id}": kind must be one of ${LESSON_KINDS.join(", ")}`);
  if (!isText(l.idea)) fail(`lesson "${id}" says no idea`);
  if (
    !(
      Array.isArray(l.symbols) && l.symbols.every((s) => typeof s === "string" && SYMBOL_RE.test(s))
    )
  )
    fail(`lesson "${id}": symbols must be a list of uppercase tickers`);
  if (!isDate(l.on)) fail(`lesson "${id}": on must be a YYYY-MM-DD date`);
  if (l.recheckOn !== undefined && !isDate(l.recheckOn))
    fail(`lesson "${id}": recheckOn must be a YYYY-MM-DD date`);
  if (l.recheckOn !== undefined && (l.recheckOn as string) < (l.on as string))
    fail(`lesson "${id}": recheckOn is before the day it was recorded`);
  if (l.falsifier !== undefined && !isText(l.falsifier)) fail(`lesson "${id}": empty falsifier`);
  if (l.recheckOn === undefined && l.falsifier === undefined)
    fail(`lesson "${id}" needs a re-check date or a falsifier`);
  if (l.kind === "on-watch" && l.recheckOn === undefined)
    fail(`lesson "${id}": a name on watch needs the date it gets checked again`);
  if (!isText(l.source)) fail(`lesson "${id}" names no source`);
}

/** Parse one lesson record, loud on the first problem and naming the file (campaigns.ts's shape). */
export function parseLessonRecord(
  raw: unknown,
  file: string,
  expectedCampaign: string,
): LessonRecord {
  const fail: Fail = (what) => {
    throw new Error(`campaign-lessons: ${file}: ${what}`);
  };
  if (typeof raw !== "object" || raw === null) fail("not an object");
  const r = raw as Raw;
  if (r.campaign !== expectedCampaign)
    fail(`campaign "${String(r.campaign)}" must equal the file name "${expectedCampaign}"`);
  if (!Array.isArray(r.lessons)) fail("lessons must be a list");
  for (const l of r.lessons as Raw[]) checkLesson(l, fail);
  const ids = (r.lessons as Raw[]).map((l) => l.id);
  const twice = ids.find((id, i) => ids.indexOf(id) !== i);
  if (twice !== undefined) fail(`lesson "${String(twice)}" is listed twice`);
  return raw as LessonRecord;
}

const LESSONS_DIR = join("src", "domain", "campaign-lessons");

/**
 * Read every `<campaign>.json` under `dir`, sorted by campaign id. A house record must belong to a
 * house campaign; `known` is that check, swapped out by specs that point at a fixture.
 */
export function loadLessonRecords(
  dir: string = join(process.cwd(), LESSONS_DIR),
  known: (id: string) => boolean = (id) => campaignById(id) !== undefined,
): LessonRecord[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const id = basename(f, ".json");
      if (!known(id)) throw new Error(`campaign-lessons: ${f}: no campaign "${id}"`);
      return parseLessonRecord(JSON.parse(readFileSync(join(dir, f), "utf8")), f, id);
    });
}

export const LESSON_RECORDS: readonly LessonRecord[] = loadLessonRecords();

/** A campaign's lessons, or an empty list when it has none yet. */
export function lessonsFor(campaign: string): readonly Lesson[] {
  return LESSON_RECORDS.find((r) => r.campaign === campaign)?.lessons ?? [];
}
