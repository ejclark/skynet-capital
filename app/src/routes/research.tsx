import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { CALL_CLASS_LABEL, CALL_CLASSES, callMix, classifyCall, hubEvents } from "../live/call-mix";
import { dayLensFog } from "../live/fog";
import { inRange, marketToday, rangeFor, rangeLabel, stepAnchor } from "../live/horizon-range";
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
import { EventHorizon } from "../shell/event-horizon";
import { PageFrame } from "../shell/frame";
import { ScopeSentence } from "../shell/scope-sentence";

/**
 * RESEARCH (#738 phase 6c; filters-first + rail-controls per Eric's live reviews) — the shelf in
 * the shell. The LEFT RAIL is this view's control column (the topbar owns app navigation, so the
 * rail drives content): the event-horizon calendar pins a day into the page's ONE query model.
 * Up top, the text bar and the symbol chips write the same string; one filter narrows everything
 * below — calls, ledgers, studies. Documents stay server-rendered; every row crosses honestly.
 *
 * THE LENS (#1704): the call board reads ONE horizon row per ledger — `lens:week` by default —
 * instead of only the Today row (which reads "Stand aside" on 268 of 272 ledgers). THE RANGE
 * (slice 2): the lens also selects a span of days around the anchor (`on:`, or today), and the
 * board and the ledger list keep only events inside it; studies are undated and follow the text
 * filter alone. The rail's lens row and arrows write the same tokens the filter bar accepts.
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
            <span className="num">{calls.length}</span> calls in {rangeName} ·{" "}
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
  const scope = parseResearchQuery(query).symbols;
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

function ResearchPage(): ReactElement {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const research = useQuery({ queryKey: ["research"], queryFn: fetchResearch });
  // The day lens's fog reads the ladder the trade page already fetches (same key, shared cache).
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays, retry: false });
  // URL-stateful filter, the desk's exact discipline: immediate locally, debounced replace.
  const [query, setQuery] = useState(q ?? "");
  const urlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(urlTimer.current), []);
  const setFilter = (next: string) => {
    setQuery(next);
    clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      void navigate({ search: next.trim() === "" ? {} : { q: next }, replace: true });
    }, 300);
  };

  if (research.isPending)
    return (
      <PageFrame>
        <p className="note">Opening the shelf…</p>
      </PageFrame>
    );
  if (research.isError)
    return (
      <PageFrame>
        <p className="note">The research shelf is unreachable.</p>
      </PageFrame>
    );

  const data = research.data;
  const parsed = parseResearchQuery(query);
  const fog = dayLensFog(plays.data);
  // A fogged member who types lens:day sees the week — the fog is honest about it in the rail.
  const filter: ResearchFilter =
    fog.fogged && parsed.lens === "day" ? { ...parsed, lens: "week" } : parsed;
  const today = marketToday();
  const anchor = filter.on ?? today;
  const range = rangeFor(anchor, filter.lens);
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

  return (
    <PageFrame
      rail={
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
            setFilter(setOnDate(query, stepAnchor(anchor, filter.lens, direction)))
          }
          {...(fog.fogged ? { dayFog: { reason: fog.reason, held: heldDayCalls } } : {})}
        />
      }
    >
      <header className="page-header">
        <h1>Research</h1>
        <p>
          The living shelf: pick a lens and a span on the horizon, a name, or type a filter —
          everything below follows. Documents open on their own pages.
        </p>
      </header>
      <ScopeSentence
        query={query}
        filter={filter}
        events={data.events}
        {...(fog.fogged ? { dayFogReason: fog.reason } : {})}
        onChange={setFilter}
      />
      <ResearchFilters data={data} query={query} onChange={setFilter} />
      <CallBoard
        data={data}
        filter={filter}
        inRangeIds={inRangeIds}
        rangeName={rangeLabel(range, filter.lens)}
      />
      <div className="rx-grid">
        <DocList
          title="Event ledgers"
          docs={ledgers}
          empty={`No ledger in ${rangeLabel(range, filter.lens)}${
            filter.terms.length > 0 ? " matches this filter." : "."
          }`}
        />
        <DocList
          title="Studies"
          docs={studies}
          empty={filter.terms.length > 0 ? "No study matches this filter." : "No studies yet."}
        />
      </div>
    </PageFrame>
  );
}

export const Route = createFileRoute("/research")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.q === "string" && search.q.length > 0 && search.q.length <= 100
      ? { q: search.q }
      : {}),
  }),
  component: ResearchPage,
});
