import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { fetchResearch, type ResearchDocLink, type ResearchShelfData } from "../live/research";
import { PageFrame } from "../shell/frame";

/**
 * RESEARCH (#738 phase 6c; filters-first per Eric's live review) — the shelf in the shell, led
 * by the FILTERS, then the call board. The symbol chips are real filters now, not links: chips
 * and query text are ONE model (the house filter-bar discipline), the URL keeps the query, and
 * one filter narrows everything below it — calls, ledgers, and studies alike. The deep symbol
 * page keeps its value as the "full page" link on the active chip; documents stay
 * server-rendered and every row crosses to one honestly.
 */

function CallBoard({
  data,
  term,
}: {
  readonly data: ResearchShelfData;
  readonly term: string;
}): ReactElement | null {
  const calls = data.calls.filter(
    (call) =>
      term === "" ||
      call.eventId.toLowerCase().includes(term) ||
      call.call.toLowerCase().includes(term),
  );
  if (data.calls.length === 0) return null;
  return (
    <section className="rx-panel">
      <h2 className="rx-h">The call board</h2>
      {calls.length === 0 ? (
        <p className="note">No call matches this filter.</p>
      ) : (
        <ul className="rx-calls">
          {calls.map((call) => (
            <li key={call.eventId} className="rx-call">
              <a href={call.href} className="rx-call-event num">
                {call.eventId}
              </a>
              <span className="rx-call-text">{call.call}</span>
              <span className="rx-call-meta">
                <span className="rx-chip" title="horizon">
                  {call.horizon}
                </span>
                {call.confidence ? (
                  <span className="rx-chip rx-conf" title="stated confidence">
                    {call.confidence}
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

/** The filters, FIRST — the text query and the symbol chips write the same model. */
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
  const active = query.trim().toUpperCase();
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
            placeholder="filter everything below — a symbol, a title, a slug"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
      {data.symbols.length > 0 ? (
        <div className="rx-symbols">
          {data.symbols.map((entry) => {
            const selected = active === entry.symbol;
            return (
              <span key={entry.symbol} className="rx-symbol-wrap">
                <button
                  type="button"
                  className="rx-symbol"
                  aria-pressed={selected}
                  onClick={() => onChange(selected ? "" : entry.symbol)}
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
  const term = query.trim().toLowerCase();
  const matches = (doc: ResearchDocLink) =>
    term === "" || doc.title.toLowerCase().includes(term) || doc.slug.toLowerCase().includes(term);
  const studies = data.studies.filter(matches);
  const ledgers = data.ledgers.filter(matches);

  return (
    <PageFrame>
      <header className="page-header">
        <h1>Research</h1>
        <p>
          The living shelf: pick a name or type a filter, and everything below follows — the calls,
          the ledgers, the studies. Documents open on their own pages.
        </p>
      </header>
      <ResearchFilters data={data} query={query} onChange={setFilter} />
      <CallBoard data={data} term={term} />
      <div className="rx-grid">
        <DocList
          title="Event ledgers"
          docs={ledgers}
          empty={term ? "No ledger matches this filter." : "No event ledgers yet."}
        />
        <DocList
          title="Studies"
          docs={studies}
          empty={term ? "No study matches this filter." : "No studies yet."}
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
