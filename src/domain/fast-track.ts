/**
 * A FAST TRACK, AS ONE CARD PER MISSING FIELD (#7034 slice 1; Eric, 2026-11-07: "users need fast
 * track, canned options/scenarios to explore… options are presented as flashcards… Users also need
 * to be able to add supplemental context and/or manual primary response to steer the path").
 *
 * The plan's review amended "recursive flashcards" into one rule, the one #6949 settled ("each
 * answer fills part of the move"): a card exists only while a field of the outcome is empty. That
 * bounds the walk by the outcome's shape, not by a script, so the first fast track — "What's coming
 * up that I should watch?" — reaches a pre-filled ticket in 5 taps: the fast track, the event's
 * "Plan a move", the stop, the exit, and the owner's own tap that fires it.
 *
 * PURE, AND FREE PER CARD. Every option is drawn from data the caller passes in — the event
 * calendar, the research ledger's kill switches and stance (read by `src/server/fast-track-ledger.ts`),
 * the member's own book — so a card costs no model tokens. Nothing here places an order: the
 * outcome is a ticket only the account's owner fires (paper only).
 *
 * HONESTY. An estimate-dated event offers only "Watch" and "Ask what we know" (the calendar's date
 * policy: an estimate may only widen caution). An event with no written stance says "not researched
 * yet", a move with no measured base rate says "untested", and the list names the sources it does
 * not read yet (news, lawsuits). No copy here says a time is good to buy.
 */
import { dayText } from "../options/position-guidance-rules.js";
import { daysUntil } from "./earnings-calendar.js";
import { nextSession, sessionsBefore } from "./market-calendar.js";
import type { ImpactTier, MarketEvent } from "./market-events.js";

/** The first tap to a fired ticket, inclusive of both (#6949's budget; #7034 criterion 6). */
export const FAST_TRACK_TAP_BUDGET = 5;

/** The first fast track's own words — the canned question a member taps. */
export const WHATS_COMING_UP = "What's coming up that I should watch?";

/** How many events the first card shows at 390px; the rest fold behind a count (criterion 1). */
const EVENTS_SHOWN = 3;
/** The fortnight every fast track reads — the card and the chat's calendar lookup share it. */
export const FAST_TRACK_HORIZON_DAYS = 14;
/** How many symbols of one event get their own actions — a sector event can list dozens. */
const SYMBOLS_SHOWN = 3;
const KILL_SWITCHES_SHOWN = 3;

export const NOT_COVERED = "News and lawsuits: not covered yet";
export const NOT_RESEARCHED = "not researched yet";

export type OutcomeKind = "ticket" | "watchlist" | "research-ask";

/** An event as the fast track reads it: the calendar row plus what the house has written on it. */
export interface FastTrackEvent {
  readonly event: MarketEvent;
  /** The house's written stance (its ledger's nearest-horizon call), when it has one. */
  readonly stance?: string;
  /** The ledger's live kill switches, plain text, most relevant first. */
  readonly killSwitches: readonly string[];
  /** The house's measured rate for a move on this event, with its sample size. */
  readonly baseRate?: { readonly text: string; readonly sample: number };
}

/** The member's own names: positions first, then the watchlist. */
export interface MemberBook {
  readonly held: readonly string[];
  readonly watched: readonly string[];
}

/** The date-only part of `asOf`, so a full ISO timestamp compares the way `daysUntil` reads it. */
const asOfDay = (asOf: string): string => asOf.slice(0, 10);

export interface FastTrackInput {
  /** The market day (YYYY-MM-DD); a full ISO timestamp is read by its date. */
  readonly asOf: string;
  readonly events: readonly FastTrackEvent[];
  readonly book: MemberBook;
}

/** One answer to one field — whose words it is travels with it. */
export interface Answer {
  readonly text: string;
  readonly source: "ledger" | "calendar" | "member";
  /** A time exit's day, YYYY-MM-DD. */
  readonly by?: string;
}

interface Filled {
  readonly eventId?: string;
  readonly symbol?: string;
  readonly stop?: Answer;
  readonly exit?: Answer;
}

/** Where a walk stands: the outcome it is building, what is filled, and every tap spent. */
export interface Walk {
  readonly kind?: OutcomeKind;
  readonly filled: Filled;
  /** Words the member added that answer no field — they ride on the outcome (criterion 5). */
  readonly notes: readonly string[];
  readonly taps: number;
}

export interface CardOption {
  readonly id: string;
  readonly label: string;
  /** The option's full text when the label had to be shortened. */
  readonly detail?: string;
  readonly kind?: OutcomeKind;
  readonly fills: Filled;
}

/** One event on the first card, with the actions it offers, each named by its job. */
export interface EventRow {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly dateWords: "date confirmed" | "date is an estimate";
  readonly stance: string;
  readonly actions: readonly CardOption[];
}

/** Every card offers the member's own answer and added context (criterion 4). */
interface CardBase {
  readonly question: string;
  readonly ownAnswer: true;
  readonly addContext: true;
}

export interface EventsCard extends CardBase {
  readonly field: "event";
  readonly rows: readonly EventRow[];
  /** The rest of the fortnight, folded below the rows behind a count; still pickable once opened. */
  readonly folded: readonly EventRow[];
  /** How many events sit folded (`folded.length`), the count the fold reads. */
  readonly more: number;
  readonly notCovered: string;
}

export interface FieldCard extends CardBase {
  readonly field: "stop" | "exit";
  readonly options: readonly CardOption[];
  /** One plain line the card reads beside its options (the base rate, or why there are none). */
  readonly context?: string;
}

export type Card = EventsCard | FieldCard;

export type Outcome =
  | {
      readonly kind: "ticket";
      readonly eventId: string;
      readonly symbol: string;
      readonly stop: Answer;
      readonly exit: Answer;
      readonly notes: readonly string[];
      /** Only the account's owner fires it; this engine never does. */
      readonly firedBy: "owner";
    }
  | {
      readonly kind: "watchlist";
      readonly eventId: string;
      readonly symbol: string;
      readonly notes: readonly string[];
    }
  | {
      readonly kind: "research-ask";
      readonly eventId: string;
      readonly question: string;
      readonly notes: readonly string[];
    };

export type Step = { readonly card: Card } | { readonly complete: Outcome };

export type Choice =
  | { readonly option: string }
  | { readonly own: string }
  | { readonly context: string };

/** The walk the fast track's own tap starts — that tap is the first of the budget. */
export function startFastTrack(): Walk {
  return { filled: {}, notes: [], taps: 1 };
}

const IMPACT_ORDER: Readonly<Record<ImpactTier, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** 0 = an event on a held name, 1 = on a watched one, 2 = neither (criterion 1's first key). */
function bookRank(event: MarketEvent, book: MemberBook): number {
  if (event.symbols.some((s) => book.held.includes(s))) return 0;
  if (event.symbols.some((s) => book.watched.includes(s))) return 1;
  return 2;
}

/** The next 14 days' events, the member's names first, then by impact, then by date. */
export function rankEvents(input: FastTrackInput): FastTrackEvent[] {
  return input.events
    .filter(({ event }) => {
      const days = daysUntil(input.asOf, event.date);
      return days >= 0 && days <= FAST_TRACK_HORIZON_DAYS && !event.supersededBy;
    })
    .sort(
      (a, b) =>
        bookRank(a.event, input.book) - bookRank(b.event, input.book) ||
        IMPACT_ORDER[a.event.impact] - IMPACT_ORDER[b.event.impact] ||
        a.event.date.localeCompare(b.event.date) ||
        a.event.id.localeCompare(b.event.id),
    );
}

/** The event's names the member holds or watches; when none match, the event's own, capped. */
function actionSymbols(event: MarketEvent, book: MemberBook): readonly string[] {
  const held = event.symbols.filter((s) => book.held.includes(s));
  const watched = event.symbols.filter((s) => book.watched.includes(s) && !held.includes(s));
  const mine = [...held, ...watched];
  return (mine.length > 0 ? mine : event.symbols).slice(0, SYMBOLS_SHOWN);
}

/**
 * The actions one event offers. "Plan a move" needs a confirmed date (criterion 3) and a name to
 * trade; "Watch" needs a name the member doesn't already watch; "Ask what we know" is always there.
 * A multi-name event offers its actions per name, so picking one fills the symbol too — the walk
 * never spends a tap on a "which name?" card.
 */
function actionsOf(item: FastTrackEvent, book: MemberBook): CardOption[] {
  const { event } = item;
  const actions: CardOption[] = [];
  for (const symbol of actionSymbols(event, book)) {
    if (!book.watched.includes(symbol)) {
      actions.push({
        id: `watch:${event.id}:${symbol}`,
        label: `Watch ${symbol}`,
        kind: "watchlist",
        fills: { eventId: event.id, symbol },
      });
    }
    if (event.status === "confirmed") {
      actions.push({
        id: `plan:${event.id}:${symbol}`,
        label: `Plan a move on ${symbol}`,
        kind: "ticket",
        fills: { eventId: event.id, symbol },
      });
    }
  }
  actions.push({
    id: `ask:${event.id}`,
    label: "Ask what we know",
    kind: "research-ask",
    fills: { eventId: event.id },
  });
  return actions;
}

/** Whether an event's date is confirmed, in words — the card and the chat's calendar lookup share it
 *  (criterion 2), so the two can never word one date two ways. */
export function dateWordsOf(event: MarketEvent): EventRow["dateWords"] {
  return event.status === "confirmed" ? "date confirmed" : "date is an estimate";
}

function eventsCard(input: FastTrackInput): EventsCard {
  const ranked = rankEvents(input).map(
    (item): EventRow => ({
      id: item.event.id,
      title: item.event.title,
      date: item.event.date,
      dateWords: dateWordsOf(item.event),
      stance: item.stance ?? NOT_RESEARCHED,
      actions: actionsOf(item, input.book),
    }),
  );
  const folded = ranked.slice(EVENTS_SHOWN);
  return {
    field: "event",
    question: WHATS_COMING_UP,
    rows: ranked.slice(0, EVENTS_SHOWN),
    folded,
    more: folded.length,
    notCovered: NOT_COVERED,
    ownAnswer: true,
    addContext: true,
  };
}

const LABEL_MAX = 120;

/**
 * A sentence's end: a full stop after a lowercase word, a digit or a closing mark, and not after a
 * common abbreviation — "U.S. Commerce" and "Dept. of Energy" stay one clause.
 */
const SENTENCE_END = /(?<=[a-z0-9)%])(?<!\b(?:Inc|Corp|Dept|Co|Ltd|vs|No|approx|est))\. (?=[A-Z])/;

/** A kill switch's first clause as its label; the whole text rides as `detail` when cut. */
function shortLabel(text: string): { label: string; detail?: string } {
  const clause = text.split(/ → /)[0]?.split(SENTENCE_END)[0] ?? text;
  const space = clause.lastIndexOf(" ", LABEL_MAX - 1);
  const cut =
    clause.length <= LABEL_MAX ? clause : `${clause.slice(0, space > 0 ? space : LABEL_MAX - 1)}…`;
  return cut === text ? { label: text } : { label: cut, detail: text };
}

function stopCard(item: FastTrackEvent | undefined): FieldCard {
  const switches = (item?.killSwitches ?? []).slice(0, KILL_SWITCHES_SHOWN);
  return {
    field: "stop",
    question: "What would prove you wrong?",
    options: switches.map((text, i) => ({
      id: `stop:${i}`,
      ...shortLabel(text),
      fills: { stop: { text, source: "ledger" } },
    })),
    ...(switches.length === 0
      ? { context: "The house has written no kill switch for this event yet." }
      : {}),
    ownAnswer: true,
    addContext: true,
  };
}

function exitCard(item: FastTrackEvent | undefined, asOf: string): FieldCard {
  const options: CardOption[] = [];
  const date = item?.event.date;
  if (date) {
    // The session before the event, so a print after the close and one before the open both land
    // flat — the same day the house's flat-by-D-1 guard reads.
    // Day-granular by contract: on D-1 itself the option still shows, since `asOf` carries no
    // clock; the caller passes the market day.
    const before = sessionsBefore(date, 1);
    if (before >= asOfDay(asOf)) {
      const beforeText = `Close before it, by the close on ${dayText(before)}`;
      options.push({
        id: "exit:before",
        label: beforeText,
        fills: { exit: { text: beforeText, source: "calendar", by: before } },
      });
    }
    const after = nextSession(date);
    const afterText = `Close the first session after it, ${dayText(after)}`;
    options.push({
      id: "exit:after",
      label: afterText,
      fills: { exit: { text: afterText, source: "calendar", by: after } },
    });
  }
  const rate = item?.baseRate;
  return {
    field: "exit",
    question: "Where would you take profit, or by when?",
    options,
    context: rate
      ? `Base rate: ${rate.text} (${rate.sample} past cases)`
      : "Base rate: untested. The house has not measured this move.",
    ownAnswer: true,
    addContext: true,
  };
}

const eventOf = (input: FastTrackInput, id: string | undefined) =>
  input.events.find((e) => e.event.id === id);

/** The next card, or the finished outcome once no field of it is empty. */
export function nextStep(walk: Walk, input: FastTrackInput): Step {
  const { kind, filled, notes } = walk;
  if (!(kind && filled.eventId)) return { card: eventsCard(input) };
  const item = eventOf(input, filled.eventId);
  if (kind === "research-ask") {
    const title = item?.event.title ?? filled.eventId;
    return {
      complete: {
        kind,
        eventId: filled.eventId,
        question: `What do we know about ${title}?`,
        notes,
      },
    };
  }
  if (!filled.symbol) return { card: eventsCard(input) };
  if (kind === "watchlist") {
    return { complete: { kind, eventId: filled.eventId, symbol: filled.symbol, notes } };
  }
  // The calendar can move between taps: a ticket is built only while its event is still on the
  // calendar with a confirmed date (criterion 3), so a walk whose event slipped to an estimate, or
  // was retired, goes back to the event card instead of finishing a move it no longer licenses.
  const tradable = item?.event.status === "confirmed" && !item.event.supersededBy;
  if (!tradable) return { card: eventsCard(input) };
  if (!filled.stop) return { card: stopCard(item) };
  if (!filled.exit) return { card: exitCard(item, input.asOf) };
  const { eventId, symbol, stop, exit } = filled;
  return { complete: { kind, eventId, symbol, stop, exit, notes, firedBy: "owner" } };
}

/**
 * One tap on a card. An option fills what it names; the member's own answer fills the card's field
 * (on the event card it names no field, so it rides as a note); added context is always a note. An
 * empty answer or an option the card doesn't carry spends no tap.
 */
export function choose(walk: Walk, card: Card, choice: Choice): Walk {
  const tapped = { ...walk, taps: walk.taps + 1 };
  if ("context" in choice || "own" in choice) {
    const text = ("context" in choice ? choice.context : choice.own).trim();
    if (!text) return walk;
    if ("own" in choice && card.field !== "event") {
      return { ...tapped, filled: { ...walk.filled, [card.field]: { text, source: "member" } } };
    }
    return { ...tapped, notes: [...walk.notes, text] };
  }
  const options =
    card.field === "event"
      ? [...card.rows, ...card.folded].flatMap((r) => r.actions)
      : card.options;
  const picked = options.find((o) => o.id === choice.option);
  if (!picked) return walk;
  return {
    ...tapped,
    ...(picked.kind ? { kind: picked.kind } : {}),
    // A pick on the event card starts the outcome over; a field card's pick adds to it.
    filled: card.field === "event" ? picked.fills : { ...walk.filled, ...picked.fills },
  };
}
