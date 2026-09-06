import type { MarketEvent } from "../domain/market-events-types.js";
import type { EventCall, HorizonCalls } from "../server/research-event-calls.js";
import type { ResearchDoc, ResearchShelf } from "../server/research-service.js";

/**
 * RESEARCH AS DATA — `/api/research`, the JSON twin behind the shell's shelf.
 * The house doctrine leads the payload the way it leads every research doc (CLAUDE.md,
 * 2026-08-23: "research leads with the call"): the call board comes first — one row per
 * researched event with the authored call, its horizon, and its stated confidence, plus every
 * horizon row the ledger states so the shell can read the board through a lens (#1704) — then the
 * symbol strip with each name's next dated event, then the shelf itself. The DOCUMENTS stay
 * server-rendered (they are rendered markdown; the shell links to them, it never re-renders
 * prose) — this view carries lists and calls, nothing more.
 */

interface DocView {
  readonly slug: string;
  readonly title: string;
  readonly lastAssessed: string | null;
  readonly href: string;
}

interface CallView {
  readonly eventId: string;
  readonly call: string;
  readonly horizon: string;
  readonly confidence?: string;
  /** The event's ledger doc — the receipt behind the call. */
  readonly href: string;
  /** Every horizon row the ledger states (#1704) — the shell picks the row for its lens. */
  readonly horizons?: HorizonCalls;
}

interface EventView {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly symbols: readonly string[];
  /** Whether a ledger exists for this event — a dot the calendar can trust. */
  readonly researched: boolean;
}

interface SymbolView {
  readonly symbol: string;
  readonly href: string;
  readonly next?: { readonly title: string; readonly date: string };
}

export interface ResearchShelfJson {
  readonly events: readonly EventView[];
  readonly calls: readonly CallView[];
  readonly symbols: readonly SymbolView[];
  readonly studies: readonly DocView[];
  readonly ledgers: readonly DocView[];
}

const docView = (doc: ResearchDoc): DocView => ({
  slug: doc.slug,
  title: doc.title,
  lastAssessed: doc.lastAssessed,
  href: `/research/${doc.slug}`,
});

export function researchShelfJson(
  shelf: ResearchShelf,
  symbols: readonly { readonly symbol: string; readonly next?: MarketEvent }[],
  calls: ReadonlyMap<string, EventCall>,
  events: readonly MarketEvent[] = [],
  horizons: ReadonlyMap<string, HorizonCalls> = new Map(),
): ResearchShelfJson {
  const researched = new Set(shelf.ledgers.map((doc) => doc.slug));
  return {
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      symbols: event.symbols,
      researched: researched.has(`events/${event.id}`),
    })),
    calls: [...calls.entries()].map(([eventId, call]) => ({
      eventId,
      call: call.call,
      horizon: call.horizon,
      ...(call.confidence ? { confidence: call.confidence } : {}),
      href: `/research/events/${eventId}`,
      ...(horizons.has(eventId) ? { horizons: horizons.get(eventId) } : {}),
    })),
    symbols: symbols.map((entry) => ({
      symbol: entry.symbol,
      href: `/research/symbol/${entry.symbol}`,
      ...(entry.next ? { next: { title: entry.next.title, date: entry.next.date } } : {}),
    })),
    studies: shelf.studies.map(docView),
    ledgers: shelf.ledgers.map(docView),
  };
}
