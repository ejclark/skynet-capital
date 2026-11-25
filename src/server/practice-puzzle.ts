import type { ServerResponse } from "node:http";
import type { Bar } from "../alpaca/alpaca-options-client.js";
import { campaignById, castSymbols } from "../domain/campaigns.js";
import { type EarningsPrint, UPCOMING_PRINTS } from "../domain/earnings-calendar.js";
import { DAY_MS } from "../domain/time.js";
import { sendJson } from "./page-shell.js";

/**
 * THE 60-SECOND PUZZLE (#8250) — the newcomer's first minute, before any account: "Which of these
 * moved most after its last earnings report?", answered the instant they tap. Every digit comes
 * from code and the feed, never from copy or a model: the report dates are confirmed rows of
 * `UPCOMING_PRINTS`, the names are the AI buildout campaign's cast, and each move is the close of
 * the first session after the report against the close of the session before it, read from
 * daily bars (split- and dividend-adjusted, so a corporate action never reads as a move).
 *
 * The same bars give each name's latest close, which the practice pick quotes — with its date and
 * source beside it, because a close is not a live quote and says so.
 *
 * Read on the house's data login (`practiceData` in the server config — a house account's own
 * data client, never a member's) and cached for the day: the answer to a past report doesn't
 * change, so one read serves every newcomer that day.
 */

export const PUZZLE_QUESTION = "Which of these moved most after its last earnings report?";
const CAMPAIGN_ID = "ai-buildout";
const NAMES = 4;
const MIN_NAMES = 3;
/** Calendar days of bars read before a report — enough to find the session before it over a long weekend. */
const LEAD_DAYS = 10;

export interface PuzzleName {
  readonly symbol: string;
  readonly reportDate: string;
  /** "after the close" or "before the open" — which sessions the move spans. */
  readonly timing: "after-close" | "before-open";
  readonly beforeDate: string;
  readonly beforeClose: number;
  readonly afterDate: string;
  readonly afterClose: number;
  /** (after − before) / before × 100, rounded to 0.1. */
  readonly movePct: number;
  readonly lastClose: number;
  readonly lastCloseDate: string;
}

export interface Puzzle {
  readonly question: string;
  readonly names: readonly PuzzleName[];
  /** The symbol with the largest move either way. */
  readonly answer: string;
  readonly source: string;
  readonly readAt: string;
}

/** The data seam: daily bars for one symbol, and where they came from. */
export interface PracticeData {
  bars(symbol: string, start: string, end: string): Promise<readonly Bar[] | undefined>;
  readonly source: string;
  /** The puzzle's clock — an offline boot pins it so the e2e reads one fixed day. */
  readonly now?: () => Date;
}

/** Before-the-open when the print's own source says so; otherwise the table's default, after the close. */
function timingOf(print: EarningsPrint): PuzzleName["timing"] {
  return /before (the )?(market )?open|pre-market|premarket|\bBMO\b/i.test(print.source)
    ? "before-open"
    : "after-close";
}

/** The latest confirmed, already-reported print per cast symbol, newest first. */
export function puzzlePrints(today: string, prints = UPCOMING_PRINTS): EarningsPrint[] {
  const campaign = campaignById(CAMPAIGN_ID);
  const cast = new Set(campaign ? castSymbols(campaign) : []);
  const latest = new Map<string, EarningsPrint>();
  for (const print of prints) {
    if (print.status !== "confirmed" || !cast.has(print.symbol) || print.date >= today) continue;
    const held = latest.get(print.symbol);
    if (!held || print.date > held.date) latest.set(print.symbol, print);
  }
  return [...latest.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** One name's move around one print, from its bars — undefined when a session is missing. */
export function moveAround(print: EarningsPrint, bars: readonly Bar[]): PuzzleName | undefined {
  const day = (bar: Bar) => bar.t.slice(0, 10);
  const sorted = [...bars].sort((a, b) => a.t.localeCompare(b.t));
  const timing = timingOf(print);
  // After the close on D: D's close is "before", the next session's is "after". Before the open
  // on D: the last session before D is "before", D's own close is "after".
  const beforeIndex =
    timing === "after-close"
      ? sorted.findIndex((bar) => day(bar) === print.date)
      : sorted.findLastIndex((bar) => day(bar) < print.date);
  const before = sorted[beforeIndex];
  const after = beforeIndex >= 0 ? sorted[beforeIndex + 1] : undefined;
  const last = sorted.at(-1);
  if (!(before && after && last) || before.c <= 0) return undefined;
  if (timing === "before-open" && day(after) !== print.date) return undefined;
  return {
    symbol: print.symbol,
    reportDate: print.date,
    timing,
    beforeDate: day(before),
    beforeClose: before.c,
    afterDate: day(after),
    afterClose: after.c,
    movePct: Math.round(((after.c - before.c) / before.c) * 1000) / 10,
    lastClose: last.c,
    lastCloseDate: day(last),
  };
}

/** Build today's puzzle, or undefined when fewer than three names have both sessions. */
export async function buildPuzzle(data: PracticeData, now: Date): Promise<Puzzle | undefined> {
  const today = now.toISOString().slice(0, 10);
  const names: PuzzleName[] = [];
  for (const print of puzzlePrints(today)) {
    if (names.length >= NAMES) break;
    const start = new Date(Date.parse(`${print.date}T00:00:00Z`) - LEAD_DAYS * DAY_MS);
    const bars = await data.bars(print.symbol, start.toISOString().slice(0, 10), today);
    const name = bars ? moveAround(print, bars) : undefined;
    if (name) names.push(name);
  }
  if (names.length < MIN_NAMES) return undefined;
  const answer = names.reduce((best, n) =>
    Math.abs(n.movePct) > Math.abs(best.movePct) ? n : best,
  );
  // Alphabetical, so the answer's place in the list gives nothing away.
  const shown = [...names].sort((a, b) => a.symbol.localeCompare(b.symbol));
  return {
    question: PUZZLE_QUESTION,
    names: shown,
    answer: answer.symbol,
    source: data.source,
    readAt: now.toISOString(),
  };
}

/** One read per day, shared by every newcomer; a failed read is not cached. */
export class PuzzleCache {
  private day = "";
  private pending?: Promise<Puzzle | undefined>;

  read(data: PracticeData, now: Date): Promise<Puzzle | undefined> {
    const day = now.toISOString().slice(0, 10);
    if (this.pending && this.day === day) return this.pending;
    this.day = day;
    const read = buildPuzzle(data, now).catch(() => undefined);
    this.pending = read;
    void read.then((puzzle) => {
      if (!puzzle && this.pending === read) this.pending = undefined;
    });
    return read;
  }
}

const cache = new PuzzleCache();

/** `GET /api/practice/puzzle` — the puzzle, or an honest note when the feed can't answer. */
export async function servePracticePuzzle(
  res: ServerResponse,
  path: string,
  config: { readonly practiceData?: PracticeData },
  puzzleCache: PuzzleCache = cache,
): Promise<boolean> {
  if (path !== "/api/practice/puzzle") return false;
  if (!config.practiceData) {
    sendJson(res, 200, { note: "The puzzle isn't available on this server." });
    return true;
  }
  const data = config.practiceData;
  const puzzle = await puzzleCache.read(data, data.now?.() ?? new Date());
  sendJson(res, 200, puzzle ?? { note: "Couldn't load the puzzle's prices right now." });
  return true;
}
