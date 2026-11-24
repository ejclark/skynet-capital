import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CAMPAIGNS, type Campaign, isTradable, linkEvents } from "../domain/campaigns.js";
import type { EarningsPrint } from "../domain/earnings-calendar.js";
import { FAST_TRACK_HORIZON_DAYS, NOT_COVERED, rankEvents } from "../domain/fast-track.js";
import { eventsWithin, type MarketEvent } from "../domain/market-events.js";
import { eventQuests } from "./event-quests.js";
import { RESEARCH_DIR } from "./research-service.js";
import { heldNames, rowOf, type UpcomingEventRow, withLedger } from "./upcoming-events.js";

/**
 * THE GAME MASTER'S ONE READ (#8191, #8161 point 16): the facts one scene is built from, and
 * nothing else. One event out of the event calendar's next 14 days — the same fortnight, ranking
 * and ledger read as `get_upcoming_events` (`upcoming-events.ts`), so a scene and the calendar
 * answer can never disagree — plus what a scene needs that a list does not: the event's kind, the
 * campaigns that link it, whether it is an earnings print and when it lands, the market clock in
 * words, and where "take a paper position" may hand the member (a link to the ticket's REVIEW
 * screen, never an order).
 *
 * ALL LOCAL FILES. The checked-in calendar, the house's ledgers under `docs/research/events/`, the
 * checked-in campaigns. No web read, no news (`notCovered` says so). The member's own held names
 * and cash are read only when a desk is linked, only to put their events first and to see whether
 * a quest derives for their book; nothing here reads anyone else's desk, and nothing here trades.
 */

/** A print whose source says it lands before the open; every other print is after the close
 *  (`earnings-calendar.ts`: "after market close unless noted in `source`"). */
const BEFORE_OPEN = /before (the )?(market )?open|pre-?market|\bBMO\b/i;

export const AFTER_CLOSE_WORDS =
  "after the close, unless its source says otherwise, so the first regular-session reaction is the next open";
export const BEFORE_OPEN_WORDS =
  "before the open, per its source, so the first regular-session reaction is that day's open";

export const MARKET_OPEN_WORDS = "the regular session is open now";
export const MARKET_CLOSED_WORDS =
  "the regular session is closed: any price since the close is an after-hours price, and a paper order placed now waits and fills at the next open";

export const NO_EVENT_WORDS =
  "nothing is on the event calendar for the next 14 days, which is not the same as nothing happening";

export interface SceneEvent extends UpcomingEventRow {
  readonly kind: MarketEvent["kind"];
  /** Titles of the house campaigns that link this event; empty when none does. */
  readonly campaigns: readonly string[];
  readonly isEarningsPrint: boolean;
  /** With an earnings print: when it lands, in words. */
  readonly timing?: string;
  /** A link to the ticket's review screen carrying the quest, when one derives for this desk. */
  readonly questHref?: string;
  /** The plain ticket link on the event's first tradable symbol, when it names one. */
  readonly ticketHref?: string;
}

export type SceneFacts =
  | {
      readonly found: true;
      readonly asOf: string;
      readonly marketOpen: boolean;
      readonly marketWords: string;
      readonly event: SceneEvent;
      /** Other events in the 14 days, whatever the query narrowed to; counted, never dropped. */
      readonly otherEvents: number;
      readonly notCovered: string;
    }
  | {
      readonly found: false;
      readonly asOf: string;
      readonly marketOpen: boolean;
      readonly marketWords: string;
      readonly said: string;
      readonly notCovered: string;
    };

export interface SceneFactsQuery {
  /** The market day, YYYY-MM-DD. */
  readonly asOf: string;
  readonly marketOpen: boolean;
  /** The member's own position symbols; empty with no linked desk. */
  readonly held: readonly string[];
  /** The member's own desk and cash, only with a linked desk — for the quest check. */
  readonly desk?: { readonly id: string; readonly cash: number };
  /** The UTC day the quest check runs on, as the quests page runs it (`quests-route.ts`), so a
   *  scene never offers a quest that page already dropped. Defaults to `asOf`. */
  readonly questDay?: string;
  /** Already validated as an underlying by the caller. */
  readonly underlying?: string;
  /** A calendar id the model read from an earlier answer; matched, never used as a path. */
  readonly eventId?: string;
  /** Specs pass a frozen calendar, its prints, campaigns and a fixture shelf. */
  readonly events?: readonly MarketEvent[];
  readonly prints?: readonly EarningsPrint[];
  readonly campaigns?: readonly Campaign[];
  readonly root?: string;
}

/** The chat renders `/trade?…` links only (`places.ts`); a quest's href is the app's own path. */
function chatTicketHref(href: string): string {
  return href.replace(/^\/app\/trade\?/, "/trade?");
}

function questHrefFor(
  event: MarketEvent,
  campaigns: readonly string[],
  query: SceneFactsQuery,
  root: string,
): string | undefined {
  if (!query.desk || campaigns.length === 0) return undefined;
  const file = join(root, "events", `${event.id}.md`);
  // `withLedger` already checked the id's shape before this file was named; check again, cheaply.
  if (!(/^[a-z0-9][a-z0-9.-]*$/.test(event.id) && existsSync(file))) return undefined;
  try {
    const md = readFileSync(file, "utf8");
    const day = query.questDay ?? query.asOf;
    const [quest] = eventQuests(query.desk.id, [{ event, md, campaigns }], query.desk, day);
    return quest ? chatTicketHref(quest.move.href) : undefined;
  } catch {
    return undefined;
  }
}

/** The one event a scene is built from, with everything the scene may say about it. */
export function sceneFacts(query: SceneFactsQuery): SceneFacts {
  const { asOf, marketOpen, underlying, eventId } = query;
  const root = query.root ?? RESEARCH_DIR();
  const held = heldNames(query.held);
  const marketWords = marketOpen ? MARKET_OPEN_WORDS : MARKET_CLOSED_WORDS;
  const fortnight = eventsWithin(asOf, FAST_TRACK_HORIZON_DAYS, query.events, query.prints);
  const pool = fortnight.filter(
    (e) => (!eventId || e.id === eventId) && (!underlying || e.symbols.includes(underlying)),
  );
  const ranked = rankEvents({
    asOf,
    events: pool.map((event) => ({ event, killSwitches: [] })),
    book: { held, watched: [] },
  });
  const top = ranked[0];
  // Every other event in the fortnight, whatever the query narrowed to, so "nothing else" is never
  // implied by a narrowed call (the same guard as `upcoming-events.ts`'s `marketWide`).
  const inWindow = rankEvents({
    asOf,
    events: fortnight.map((e) => ({ event: e, killSwitches: [] })),
    book: { held: [], watched: [] },
  }).length;
  if (!top) {
    const said = eventId
      ? "that event is not on the event calendar for the next 14 days; call again without eventId for the next one that is"
      : underlying
        ? `nothing naming ${underlying} is on the event calendar for the next 14 days, which is not the same as nothing happening`
        : NO_EVENT_WORDS;
    return { found: false, asOf, marketOpen, marketWords, said, notCovered: NOT_COVERED };
  }
  const { event } = top;
  const campaigns = (query.campaigns ?? CAMPAIGNS)
    .filter((c) => linkEvents(c, [event]).length > 0)
    .map((c) => c.title);
  const isEarningsPrint = event.kind === "earnings";
  const tradable = event.symbols.find(isTradable);
  const questHref = questHrefFor(event, campaigns, query, root);
  return {
    found: true,
    asOf,
    marketOpen,
    marketWords,
    event: {
      ...rowOf(withLedger(root, event, asOf), held),
      kind: event.kind,
      campaigns,
      isEarningsPrint,
      ...(isEarningsPrint
        ? { timing: BEFORE_OPEN.test(event.source) ? BEFORE_OPEN_WORDS : AFTER_CLOSE_WORDS }
        : {}),
      ...(questHref ? { questHref } : {}),
      ...(tradable ? { ticketHref: `/trade?symbol=${encodeURIComponent(tradable)}` } : {}),
    },
    otherEvents: inWindow - 1,
    notCovered: NOT_COVERED,
  };
}
