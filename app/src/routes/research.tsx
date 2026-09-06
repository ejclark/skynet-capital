import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { inRange, marketToday, rangeFor, rangeLabel, stepAnchor } from "../live/horizon-range";
import {
  callForLens,
  fetchResearch,
  LENS_LABEL,
  type Lens,
  parseResearchQuery,
  type ResearchDocLink,
  type ResearchShelfData,
  setLens,
  setOnDate,
  toggleOnDate,
} from "../live/research";
import { EventHorizon } from "../shell/event-horizon";
import { PageFrame } from "../shell/frame";

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

function CallBoard({
  data,
  terms,
  inRangeIds,
  lens,
}: {
  readonly data: ResearchShelfData;
  readonly terms: readonly string[];
  readonly inRangeIds: ReadonlySet<string>;
  readonly lens: Lens;
}): ReactElement | null {
  // One row per ledger, read through the lens; a ledger with no row for it is left out, never
  // shown with a neighbouring horizon's call in its place.
  const rows = data.calls.flatMap((call) => {
    const row = callForLens(call, lens);
    return row ? [{ call, row }] : [];
  });
  const calls = rows.filter(
    ({ call, row }) =>
      inRangeIds.has(call.eventId) &&
      terms.every(
        (term) =>
          call.eventId.toLowerCase().includes(term) || row.call.toLowerCase().includes(term),
      ),
  );
  if (data.calls.length === 0) return null;
  return (
    <section className="rx-panel">
      <h2 className="rx-h">The call board · {LENS_LABEL[lens]}</h2>
      {calls.length === 0 ? (
        <p className="note">No call in this range matches the filter.</p>
      ) : (
        <ul className="rx-calls">
          {calls.map(({ call, row }) => (
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
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="rx-note">
        Calls exactly as authored — confidence drives size, every call carries its dated falsifier
        in the ledger behind it.
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

/** The top filters — the text query and the symbol chips write the same model (`on:` rides along
 *  from the rail's calendar untouched). */
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
  const terms = parseResearchQuery(query).terms.map((t) => t.toUpperCase());
  const toggleSymbol = (symbol: string) => {
    const kept = query.split(/\s+/).filter((t) => t && t.toUpperCase() !== symbol);
    onChange((terms.includes(symbol) ? kept : [...kept, symbol]).join(" "));
  };
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
            placeholder="filter everything below — a symbol, a title, on:2026-09-02, lens:month"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
      {data.symbols.length > 0 ? (
        <div className="rx-symbols">
          {data.symbols.map((entry) => {
            const selected = terms.includes(entry.symbol);
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
  const filter = parseResearchQuery(query);
  const today = marketToday();
  const anchor = filter.on ?? today;
  const range = rangeFor(anchor, filter.lens);
  // The range resolves through the served events — precise ids, never date-string guessing.
  const inRangeIds = new Set(data.events.filter((e) => inRange(e.date, range)).map((e) => e.id));
  const matchesTerms = (doc: ResearchDocLink) =>
    filter.terms.every(
      (term) => doc.title.toLowerCase().includes(term) || doc.slug.toLowerCase().includes(term),
    );
  const studies = data.studies.filter(matchesTerms);
  const ledgers = data.ledgers.filter(
    (doc) => matchesTerms(doc) && [...inRangeIds].some((id) => doc.slug.endsWith(id)),
  );

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
      <ResearchFilters data={data} query={query} onChange={setFilter} />
      <CallBoard data={data} terms={filter.terms} inRangeIds={inRangeIds} lens={filter.lens} />
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
