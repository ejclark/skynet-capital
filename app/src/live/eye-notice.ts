import { create } from "zustand";
import { editionEventKey, eventAnchor } from "../../../src/domain/edition-keys";
import { nextSession } from "../../../src/domain/market-calendar";
import { dayLabel } from "./book-events";
import { type Edition, type EditionDate, waitingOn } from "./edition";
import { rangeMark, type SectorRow, sectorAnchor } from "./edition-sectors";
import { DEFAULT_WINDOW, type MissionWindow } from "./mission";
import type { MpMessage } from "./moneypenny";
import type { Move } from "./moneypenny-moves";
import { type Quest, questAnchor } from "./quests";

/**
 * THE EYE NOTICES (#7487 slice 5; the Campaign mission control spec, § Interactions: "a calendar
 * event arriving, a sector leaving its range, a new quest: slide to the window, light the row, and
 * set her line. Offer 'Back to where I was'"). This file decides WHAT is worth a look, from real
 * data only; `shell/use-eye-notice.ts` decides WHEN, and plays it.
 *
 * What counts, in this order (the first one not yet noticed wins, at most one per visit):
 *   1. A dated event in the calendar's range that a story waits on (◆), falling today or on the
 *      next session — the one the member would want to see before it happens.
 *   2. A quest for the member's own account that was not there when they last looked: among the
 *      ones the Quests window shows (a folded one has no row in view to light).
 *   3. A sector whose last close LEFT its 20-day band: outside it now (`rangeMark`), inside it the
 *      close before. Read against today's band, which the previous close helped draw, so it is an
 *      honest "it just crossed", not "it has been out there for a week". The farthest out first.
 *
 * Every word says where something sits or when it happens, never what to do about it (paper
 * trading only; nothing reads as a buy or sell signal), and her question is one the member might
 * ask, not a nudge to trade.
 *
 * MEMORY. "Never repeated for the same item in a session": what was noticed is kept in session
 * storage. "Since the member last looked": the quests already seen are kept in this browser, and
 * the very first look only records them — a first visit has nothing new to point at, it is all new.
 * Both reads and writes survive storage that throws (a private window): then nothing is remembered,
 * and the first-look rule keeps a member from being chased by every row.
 */

/** One thing the Eye noticed, and how to show it. */
export interface Notice {
  /** What it is, for the memory: `event:<key>`, `quest:<id>`, `sector:<fund>:<edition date>`. */
  readonly key: string;
  /** The window it sits in. */
  readonly window: MissionWindow;
  /** The row's anchor on the page, which the Eye lights. */
  readonly anchor: string;
  /** The ring's reason (`◉ THE EYE · <reason>`), a few words. */
  readonly reason: string;
  /** Her line about it, in plain words. */
  readonly line: string;
  /** One question the member might ask about it. */
  readonly ask: { readonly label: string; readonly msg: string };
}

export interface NoticeInput {
  readonly edition: Edition | null;
  /** The server's today, YYYY-MM-DD. */
  readonly today: string;
  /** The calendar's events in its selected range (`calendarShows(...).inside`). */
  readonly inside: readonly EditionDate[];
  /** The account quests the Quests window shows, best first; undefined with no account. */
  readonly quests: readonly Quest[] | undefined;
  /** Quest ids the member has already seen. */
  readonly seenQuests: ReadonlySet<string>;
}

const when = (date: string, today: string): string => (date === today ? "today" : dayLabel(date));

function eventNotices(input: NoticeInput): Notice[] {
  const { edition, today } = input;
  if (!edition) return [];
  const soon = new Set([today, nextSession(today)]);
  return input.inside
    .filter((e) => soon.has(e.date) && waitingOn(e, edition.stories).length > 0)
    .map((e) => {
      const key = editionEventKey(e);
      const day = when(e.date, today);
      const stories = waitingOn(e, edition.stories).length;
      return {
        key: `event:${key}`,
        window: "calendar",
        anchor: eventAnchor(key),
        reason: `${e.date === today ? "today" : "next session"} · a story waits`,
        line: `Moneypenny · the Eye is on the calendar: ${e.what}, ${day}${e.when ? ` ${e.when}` : ""}. ${stories === 1 ? "a story waits on it" : `${String(stories)} stories wait on it`}.`,
        ask: {
          label: "What should I know about it?",
          msg: `What should I know about ${e.what} (${day})?`,
        },
      } satisfies Notice;
    });
}

function questNotices(input: NoticeInput): Notice[] {
  return (input.quests ?? [])
    .filter((q) => !input.seenQuests.has(q.id))
    .map((q) => ({
      key: `quest:${q.id}`,
      window: "quests",
      anchor: questAnchor(q.id),
      reason: "new quest",
      line: `Moneypenny · the Eye found a new quest for your account: ${q.move.label}. paper only; nothing is placed from here.`,
      ask: { label: "Why this quest?", msg: `Why is "${q.move.label}" a quest for my account?` },
    }));
}

/** How far outside its band a close sits, in band widths; 0 inside it. */
function outside(row: SectorRow): number {
  const { low, high, close } = row.range;
  const width = high - low;
  if (width <= 0) return 0;
  return close > high ? (close - high) / width : close < low ? (low - close) / width : 0;
}

/** The close before the last one sat inside today's band, and the last one does not. */
export function leftItsRange(row: SectorRow): boolean {
  const before = row.trail.at(-2);
  if (before === undefined || rangeMark(row.range).zone === "within") return false;
  return before >= row.range.low && before <= row.range.high;
}

function sectorNotices(input: NoticeInput): Notice[] {
  const { edition } = input;
  const view = edition?.sectors;
  if (!(edition && view)) return [];
  return view.rows
    .filter((r) => !r.market && leftItsRange(r))
    .sort((a, b) => outside(b) - outside(a))
    .map((r) => {
      const side = rangeMark(r.range).zone === "above" ? "above" : "below";
      return {
        key: `sector:${r.fund}:${edition.date}`,
        window: "market",
        anchor: sectorAnchor(r.fund),
        reason: "left its usual range",
        line: `Moneypenny · the Eye is on the market: ${r.name} (${r.fund}) closed ${side} its usual 20-day range, after a close inside it.`,
        ask: {
          label: `What moved ${r.fund}?`,
          msg: `What moved ${r.name} (${r.fund}) ${side} its usual range?`,
        },
      } satisfies Notice;
    });
}

/** Everything worth a look right now, best first (the order in the header). */
export function noticeCandidates(input: NoticeInput): readonly Notice[] {
  return [...eventNotices(input), ...questNotices(input), ...sectorNotices(input)];
}

/** The first candidate not noticed this session. */
export function pickNotice(
  candidates: readonly Notice[],
  noticed: ReadonlySet<string>,
): Notice | undefined {
  return candidates.find((n) => !noticed.has(n.key));
}

/** The address of a window on Campaign: Overview is `/`, the rest `/?w=<window>`. */
export const windowHref = (w: MissionWindow): string => (w === DEFAULT_WINDOW ? "/" : `/?w=${w}`);

/** The address that opens the notice's window on its row. */
export const noticeHref = (n: Notice): string => `${windowHref(n.window)}#${n.anchor}`;

/** Her moves under the line: the question first, then the way back (the handoff's order). */
export function noticeMoves(n: Notice, back: MissionWindow): readonly Move[] {
  return [
    { kind: "say", label: n.ask.label, msg: n.ask.msg },
    { kind: "go", label: "Back to where I was", href: windowHref(back) },
  ];
}

// ---- memory -----------------------------------------------------------------------------------

const NOTICED_KEY = "skynet.eye.noticed";
const SEEN_KEY = "skynet.eye.quests-seen";
/** The seen quests kept, newest last: enough for any account's list, small in storage. */
const SEEN_CAP = 200;

function readList(store: () => Storage, key: string): string[] | undefined {
  try {
    const raw = store().getItem(key);
    if (raw === null) return undefined;
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return undefined;
  }
}

function writeList(store: () => Storage, key: string, list: readonly string[]): void {
  try {
    store().setItem(key, JSON.stringify(list));
  } catch {
    // storage unavailable: nothing is remembered
  }
}

const session = () => window.sessionStorage;
const local = () => window.localStorage;

/** What the Eye noticed this session. */
export const noticedThisSession = (): ReadonlySet<string> =>
  new Set(readList(session, NOTICED_KEY) ?? []);

export function rememberNoticed(key: string): void {
  writeList(session, NOTICED_KEY, [...noticedThisSession(), key]);
}

/** The quests seen before, or undefined on the member's first look (nothing recorded yet). */
export const seenQuests = (): ReadonlySet<string> | undefined => {
  const list = readList(local, SEEN_KEY);
  return list ? new Set(list) : undefined;
};

/** Record these quests as seen (the member has looked at Campaign with them on it). */
export function rememberQuests(ids: readonly string[]): void {
  const before = readList(local, SEEN_KEY) ?? [];
  const merged = [...before.filter((id) => !ids.includes(id)), ...ids];
  writeList(local, SEEN_KEY, merged.slice(-SEEN_CAP));
}

// ---- her line's moves ---------------------------------------------------------------------------

interface NoticeMovesStore {
  /** Her line about the notice, as the store holds it, and the moves it offers. */
  readonly line: MpMessage | undefined;
  readonly moves: readonly Move[];
  readonly set: (line: MpMessage, moves: readonly Move[]) => void;
}

/** The moves of her latest notice line. The dock offers them while that line is still her latest
 *  (`moveState`), so an answer or a newer line of hers ends them on its own. In memory only. */
export const useNoticeMoves = create<NoticeMovesStore>((set) => ({
  line: undefined,
  moves: [],
  set: (line, moves) => set({ line, moves }),
}));

/** The notice's moves when `latest` is still its line, else undefined. */
export function noticeMovesFor(
  latest: MpMessage | undefined,
  notice: { readonly line: MpMessage | undefined; readonly moves: readonly Move[] },
): readonly Move[] | undefined {
  const line = notice.line;
  if (!(latest && line)) return undefined;
  return latest.role === line.role && latest.text === line.text && latest.at === line.at
    ? notice.moves
    : undefined;
}
