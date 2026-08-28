import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import { fetchResearch, type ResearchDocLink, type ResearchShelfData } from "../live/research";
import { PageFrame } from "../shell/frame";

/**
 * RESEARCH (#738 phase 6c) — the shelf in the shell, led by the call board (the house doctrine:
 * a research surface that doesn't say what to do has done half the job). Documents remain
 * server-rendered — the shell lists and links, it never re-renders prose — so every row here
 * crosses honestly to its doc, its ledger, or its symbol page.
 */

function CallBoard({ data }: { readonly data: ResearchShelfData }): ReactElement | null {
  if (data.calls.length === 0) return null;
  return (
    <section className="rx-panel">
      <h2 className="rx-h">The call board</h2>
      <ul className="rx-calls">
        {data.calls.map((call) => (
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

function ResearchPage(): ReactElement {
  const research = useQuery({ queryKey: ["research"], queryFn: fetchResearch });
  const [query, setQuery] = useState("");
  const inputId = useId();

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
          The living shelf: calls first, then every name with a dated event, then the studies and
          ledgers behind them. Documents open on their own pages.
        </p>
      </header>
      <CallBoard data={data} />
      {data.symbols.length > 0 ? (
        <div className="rx-symbols">
          {data.symbols.map((entry) => (
            <a key={entry.symbol} href={entry.href} className="rx-symbol">
              <span className="rx-symbol-name">{entry.symbol}</span>
              {entry.next ? (
                <span className="rx-symbol-next num">{entry.next.date}</span>
              ) : (
                <span className="rx-symbol-next">no dated event</span>
              )}
            </a>
          ))}
        </div>
      ) : null}
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
            placeholder="filter the shelf — a title, a symbol, a slug"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
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

export const Route = createFileRoute("/research")({ component: ResearchPage });
