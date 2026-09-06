import type { MarketClosure } from "../domain/market-calendar.js";
import type { MarketEvent } from "../domain/market-events-types.js";
import type { EventCall, HorizonCalls } from "../server/research-event-calls.js";
import type { LedgerDigest } from "../server/research-horizon-calls.js";
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
  /** When the ledger behind this call was last assessed (its `ResearchDoc.lastAssessed`), not
   *  the event date — a horizon row is only as fresh as the day it was authored. Null when no
   *  matching ledger doc carries a stamp. */
  readonly lastAssessed: string | null;
  /** Every horizon row the ledger states (#1704) — the shell picks the row for its lens. */
  readonly horizons?: HorizonCalls;
  /** The TL;DR as plain text — the shell's search and scope index. */
  readonly tldr?: string;
  /** Adjacent event ids from the ledger's probe-ref — the shell counts hubs from these. */
  readonly adjacent?: readonly string[];
}

interface EventView {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly kind: MarketEvent["kind"];
  readonly impact: MarketEvent["impact"];
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
  /** Exchange closures across the calendar's span (#1704 slice 2) — the rail colours and counts. */
  readonly closures: readonly MarketClosure[];
  readonly calls: readonly CallView[];
  readonly symbols: readonly SymbolView[];
  readonly studies: readonly DocView[];
  readonly ledgers: readonly DocView[];
}

/** The digest's fields on a call row — absent entirely when the ledger has none (old shape). */
const digestView = (
  digest: LedgerDigest | undefined,
): Pick<CallView, "horizons" | "tldr" | "adjacent"> =>
  digest
    ? {
        horizons: digest.horizons,
        ...(digest.tldr ? { tldr: digest.tldr } : {}),
        adjacent: digest.adjacent,
      }
    : {};

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
  digests: ReadonlyMap<string, LedgerDigest> = new Map(),
  closures: readonly MarketClosure[] = [],
): ResearchShelfJson {
  const researched = new Set(shelf.ledgers.map((doc) => doc.slug));
  const ledgersBySlug = new Map(shelf.ledgers.map((doc) => [doc.slug, doc] as const));
  return {
    closures,
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      kind: event.kind,
      impact: event.impact,
      symbols: event.symbols,
      researched: researched.has(`events/${event.id}`),
    })),
    calls: [...calls.entries()].map(([eventId, call]) => ({
      eventId,
      call: call.call,
      horizon: call.horizon,
      ...(call.confidence ? { confidence: call.confidence } : {}),
      href: `/research/events/${eventId}`,
      lastAssessed: ledgersBySlug.get(`events/${eventId}`)?.lastAssessed ?? null,
      ...digestView(digests.get(eventId)),
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
