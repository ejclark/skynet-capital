import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId } from "react";
import { fiscalQuarterFor, fiscalYearEndFor } from "../../../src/domain/fiscal-calendar";
import { CALL_CLASS_LABEL, CALL_CLASSES, callMix, classifyCall, hubEvents } from "../live/call-mix";
import { dayLensFog } from "../live/fog";
import {
  type FiscalQuarterLabel,
  inRange,
  marketToday,
  rangeFor,
  rangeLabel,
  stepAnchor,
} from "../live/horizon-range";
import { fetchPlays } from "../live/options";
import {
  assessmentAge,
  callForLens,
  fetchResearch,
  LENS_LABEL,
  mentionsSymbol,
  parseResearchQuery,
  type ResearchCall,
  type ResearchDocLink,
  type ResearchEvent,
  type ResearchFilter,
  type ResearchShelfData,
  setLens,
  setOnDate,
  toggleOnDate,
  toggleSymbolScope,
} from "../live/research";
import { EventHorizon } from "./event-horizon";
import { FacetRow } from "./facet-row";

/**
 * RESEARCH'S "BOARD" SECTION (#738 phase 6c originally; split out of `research.tsx` into its own
 * file by #3333 slice 9's decompose pass, behavior unchanged) — the event-horizon calendar, the
 * text/symbol filter, the call board, and the ledger/study doc lists. See `research.tsx`'s own doc
 * comment for the lens/range design and why this became one section among three.
 */

/** Symbol scope (OR): on the event, leading the id, or named in the TL;DR — any listed symbol. */
function inSymbolScope(
  symbols: readonly string[],
  event: ResearchEvent | undefined,
  eventId: string,
  tldr: string | undefined,
): boolean {
  if (symbols.length === 0) return true;
  return symbols.some(
    (sym) =>
      (event?.symbols ?? []).includes(sym) ||
      eventId.toUpperCase().startsWith(`${sym}-`) ||
      mentionsSymbol(tldr, sym),
  );
}

function CallBoard({
  data,
  filter,
  inRangeIds,
  rangeName,
}: {
  readonly data: ResearchShelfData;
  readonly filter: ResearchFilter;
  readonly inRangeIds: ReadonlySet<string>;
  readonly rangeName: string;
}): ReactElement | null {
  const { lens, terms, symbols, kind, impact, callClass } = filter;
  const today = marketToday();
  const eventsById = new Map(data.events.map((e) => [e.id, e] as const));
  // One row per ledger, read through the lens; a ledger with no row for it is left out, never
  // shown with a neighbouring horizon's call in its place.
  const rows = data.calls.flatMap((call: ResearchCall) => {
    const row = callForLens(call, lens);
    return row ? [{ call, row, event: eventsById.get(call.eventId) }] : [];
  });
  const calls = rows.filter(
    ({ call, row, event }) =>
      inRangeIds.has(call.eventId) &&
      inSymbolScope(symbols, event, call.eventId, call.tldr) &&
      (!kind || event?.kind === kind) &&
      (!impact || event?.impact === impact) &&
      (!callClass || classifyCall(row.call) === callClass) &&
      terms.every(
        (term) =>
          call.eventId.toLowerCase().includes(term) ||
          row.call.toLowerCase().includes(term) ||
          (call.tldr ?? "").toLowerCase().includes(term),
      ),
  );
  if (data.calls.length === 0) return null;
  const mix = callMix(calls.map(({ row }) => row.call));
  const hubs = hubEvents(calls.map(({ call }) => call.adjacent ?? []));
  return (
    <section className="rx-panel">
      <h2 className="rx-h">The call board · {LENS_LABEL[lens]}</h2>
      {calls.length === 0 ? (
        <p className="note">No call in this range matches the filter.</p>
      ) : (
        <>
          <p className="rx-readout">
            <span className="num">{calls.length}</span> {calls.length === 1 ? "call" : "calls"} in{" "}
            {rangeName} ·{" "}
            {CALL_CLASSES.filter((c) => mix[c] > 0).map((c, i) => (
              <span key={c} className="rx-mix">
                {i > 0 ? " · " : ""}
                <span className="num">{mix[c]}</span> {CALL_CLASS_LABEL[c]}
              </span>
            ))}
            {hubs.length > 0 ? (
              <span className="rx-hubs">
                {" "}
                · hubs:{" "}
                {hubs.map((hub, i) => (
                  <span key={hub.id}>
                    {i > 0 ? ", " : ""}
                    <a
                      href={`/research/events/${hub.id}`}
                      className="num"
                      title="ledgers in range naming this event as adjacent"
                    >
                      {hub.id}
                    </a>{" "}
                    <span className="num">({hub.count})</span>
                  </span>
                ))}
              </span>
            ) : null}
          </p>
          <ul className="rx-calls">
            {calls.map(({ call, row }) => {
              const age = assessmentAge(call.lastAssessed, today);
              return (
                <li key={call.eventId} className="rx-call">
                  <a href={call.href} className="rx-call-event num">
                    {call.eventId}
                  </a>
                  <span className="rx-call-text">{row.call}</span>
                  <span className="rx-call-meta">
                    <span className="rx-chip" title="horizon">
                      {row.horizon}
                    </span>
                    {row.confidence ? (
                      <span className="rx-chip rx-conf" title="stated confidence">
                        {row.confidence}
                      </span>
                    ) : null}
                    {age ? (
                      <span
                        className={`rx-chip rx-assessed num${age.stale ? " rx-stale" : ""}`}
                        title="ledger's last assessment date"
                      >
                        assessed {call.lastAssessed}
                        {age.stale ? ` · stale (${age.days}d)` : ""}
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="rx-note">
        Calls exactly as authored — confidence drives size, every call carries its dated falsifier
        in the ledger behind it. The mix sorts each call by its opening words; hubs count the
        ledgers in range whose probe-ref names the event as adjacent.
      </p>
    </section>
  );
}

function DocList({
  title,
  docs,
  empty,
}: {
  readonly title: string;
  readonly docs: readonly ResearchDocLink[];
  readonly empty: string;
}): ReactElement {
  return (
    <section className="rx-panel">
      <h2 className="rx-h">{title}</h2>
      {docs.length === 0 ? (
        <p className="note">{empty}</p>
      ) : (
        <ul className="rx-docs">
          {docs.map((doc) => (
            <li key={doc.slug}>
              <a href={doc.href}>{doc.title}</a>
              {doc.lastAssessed ? (
                <span className="rx-assessed num">last assessed {doc.lastAssessed}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The top filters — the text query and the symbol chips write the same model: a chip toggles a
 *  `sym:` token (OR scope, a watchlist); `on:` and `lens:` ride along from the rail untouched. */
function ResearchFilters({
  data,
  query,
  onChange,
}: {
  readonly data: ResearchShelfData;
  readonly query: string;
  readonly onChange: (next: string) => void;
}): ReactElement {
  const inputId = useId();
  const parsed = parseResearchQuery(query);
  const scope = parsed.symbols;
  const toggleSymbol = (symbol: string) => onChange(toggleSymbolScope(query, symbol));
  return (
    <>
      <div className="filter-bar">
        <div className="filter-query">
          <label className="visually-hidden" htmlFor={inputId}>
            Filter research
          </label>
          <input
            id={inputId}
            type="text"
            value={query}
            spellCheck={false}
            placeholder="filter — a word · sym:NVDA · kind:opex · impact:high · call:watch · on:2026-09-07 · lens:month · lens:all"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <FacetRow query={query} filter={parsed} events={data.events} onChange={onChange} />
      </div>
      {data.symbols.length > 0 ? (
        <div className="rx-symbols" id="rx-symbols">
          {data.symbols.map((entry) => {
            const selected = scope.includes(entry.symbol);
            return (
              <span key={entry.symbol} className="rx-symbol-wrap">
                <button
                  type="button"
                  className="rx-symbol"
                  aria-pressed={selected}
                  onClick={() => toggleSymbol(entry.symbol)}
                >
                  <span className="rx-symbol-name">{entry.symbol}</span>
                  {entry.next ? (
                    <span className="rx-symbol-next num">{entry.next.date}</span>
                  ) : (
                    <span className="rx-symbol-next">no dated event</span>
                  )}
                </button>
                {selected ? (
                  <a className="rx-symbol-full" href={entry.href}>
                    full page →
                  </a>
                ) : null}
              </span>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

/** The Board section — everything Research rendered before #3333 slice 9, unchanged, just scoped
 *  to its own section and gated so its queries only run while Board is the active section. */
export function useBoardView({
  active,
  query,
  setFilter,
}: {
  readonly active: boolean;
  readonly query: string;
  readonly setFilter: (next: string) => void;
}): { readonly rail: ReactElement | null; readonly body: ReactElement } {
  const research = useQuery({ queryKey: ["research"], queryFn: fetchResearch, enabled: active });
  // The day lens's fog reads the ladder the trade page already fetches (same key, shared cache).
  const plays = useQuery({
    queryKey: ["plays"],
    queryFn: fetchPlays,
    retry: false,
    enabled: active,
  });

  if (research.isPending) return { rail: null, body: <p className="note">Opening Research…</p> };
  if (research.isError)
    return { rail: null, body: <p className="note">Research is unreachable.</p> };

  const data = research.data;
  const parsed = parseResearchQuery(query);
  const fog = dayLensFog(plays.data);
  // A fogged member who types lens:day sees the week — the fog is honest about it in the rail.
  const filter: ResearchFilter =
    fog.fogged && parsed.lens === "day" ? { ...parsed, lens: "week" } : parsed;
  const today = marketToday();
  const anchor = filter.on ?? today;
  // The quarter lens snaps to a company's own fiscal quarter (#1736) only when the scope names
  // EXACTLY one symbol and that symbol has a confirmed fiscal year-end — every other scope (none,
  // several, or an unconfirmed symbol) stays the honest calendar-quarter fallback.
  const scopedSymbol = filter.symbols.length === 1 ? filter.symbols[0] : undefined;
  const fiscalYearEnd = scopedSymbol ? fiscalYearEndFor(scopedSymbol) : undefined;
  const range = rangeFor(anchor, filter.lens, fiscalYearEnd?.fiscalYearEndMonth);
  const fiscal: FiscalQuarterLabel | undefined =
    fiscalYearEnd && scopedSymbol
      ? (() => {
          const d = new Date(`${anchor}T00:00:00Z`);
          const fq = fiscalQuarterFor(
            d.getUTCFullYear(),
            d.getUTCMonth() + 1,
            fiscalYearEnd.fiscalYearEndMonth,
          );
          return { symbol: scopedSymbol, fiscalYear: fq.fiscalYear, quarter: fq.quarter };
        })()
      : undefined;
  // The range resolves through the served events — precise ids, never date-string guessing.
  const inRangeIds = new Set(data.events.filter((e) => inRange(e.date, range)).map((e) => e.id));
  const heldDayCalls = fog.fogged
    ? data.calls.filter((c) => inRangeIds.has(c.eventId) && callForLens(c, "day") !== null).length
    : 0;
  const eventsById = new Map(data.events.map((e) => [e.id, e] as const));
  const matchesTerms = (doc: ResearchDocLink) =>
    filter.terms.every(
      (term) => doc.title.toLowerCase().includes(term) || doc.slug.toLowerCase().includes(term),
    );
  const inScope = (doc: ResearchDocLink, eventId?: string) =>
    filter.symbols.length === 0 ||
    filter.symbols.some(
      (sym) =>
        doc.slug.toUpperCase().includes(sym) ||
        (eventId ? (eventsById.get(eventId)?.symbols ?? []).includes(sym) : false),
    );
  const studies = data.studies.filter((doc) => matchesTerms(doc) && inScope(doc));
  const ledgers = data.ledgers.filter((doc) => {
    const eventId = [...inRangeIds].find((id) => doc.slug.endsWith(id));
    if (!eventId) return false;
    const event = eventsById.get(eventId);
    return (
      matchesTerms(doc) &&
      inScope(doc, eventId) &&
      (!filter.kind || event?.kind === filter.kind) &&
      (!filter.impact || event?.impact === filter.impact)
    );
  });

  return {
    rail: (
      <EventHorizon
        events={data.events}
        closures={data.closures}
        lens={filter.lens}
        anchor={anchor}
        range={range}
        today={today}
        pinned={filter.on !== undefined}
        onPick={(date) => setFilter(toggleOnDate(query, date))}
        onLens={(lens) => setFilter(setLens(query, lens))}
        onStep={(direction) =>
          setFilter(
            setOnDate(
              query,
              stepAnchor(anchor, filter.lens, direction, fiscalYearEnd?.fiscalYearEndMonth),
            ),
          )
        }
        {...(fiscal ? { fiscal } : {})}
        {...(fog.fogged ? { dayFog: { reason: fog.reason, held: heldDayCalls } } : {})}
      />
    ),
    body: (
      <>
        <header className="page-header">
          <h1>Research</h1>
          <p>
            The living board: pick a lens and a span on the horizon, a name, or type a filter —
            everything below follows. Documents open on their own pages.
          </p>
        </header>
        <ResearchFilters data={data} query={query} onChange={setFilter} />
        <CallBoard
          data={data}
          filter={filter}
          inRangeIds={inRangeIds}
          rangeName={rangeLabel(range, filter.lens, fiscal)}
        />
        <div className="rx-grid">
          <DocList
            title="Event ledgers"
            docs={ledgers}
            empty={`No ledger in ${rangeLabel(range, filter.lens, fiscal)}${
              filter.terms.length > 0 ? " matches this filter." : "."
            }`}
          />
          <DocList
            title="Studies"
            docs={studies}
            empty={filter.terms.length > 0 ? "No study matches this filter." : "No studies yet."}
          />
        </div>
      </>
    ),
  };
}
