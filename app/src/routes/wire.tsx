import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  fetchWire,
  matchesWire,
  parseWireQuery,
  toggleWireQualifier,
  type WireFeed,
  type WireTrade,
} from "../live/wire";
import { PageFrame } from "../shell/frame";

/**
 * THE WIRE (#738 phase 5a) — the league's live pulse in the shell, on the Issues-list template:
 * a filterable trade feed (chips ⇄ query text, URL-stateful) with the booked-P&L strip and the
 * feedback pulse alongside. Same honesty seams as the server view it succeeds: reconstructed
 * provenance is labeled, an unwired feedback lane says so, filings stay pseudonymous. The GitHub
 * onramp folds behind a disclosure — reference, not front matter.
 */

const SIDE_CHIPS = [
  ["is:buy", "Buys"],
  ["is:sell", "Sells"],
] as const;
const KIND_CHIPS = [
  ["is:bot", "Bots"],
  ["is:human", "Humans"],
] as const;

/** The rail control groups — the same one-model qualifiers the bar accepts as text. */
function WireRail({
  query,
  onChange,
}: {
  readonly query: string;
  readonly onChange: (next: string) => void;
}): ReactElement {
  const tokens = query.toLowerCase().split(/\s+/);
  const group = (label: string, chips: readonly (readonly [string, string])[]) => (
    <>
      <p className="rail-label">{label}</p>
      {chips.map(([qualifier, text]) => (
        <button
          key={qualifier}
          type="button"
          className="railctl"
          aria-pressed={tokens.includes(qualifier)}
          onClick={() => onChange(toggleWireQualifier(query, qualifier as never))}
        >
          {text}
        </button>
      ))}
    </>
  );
  return (
    <>
      {group("Side", SIDE_CHIPS)}
      {group("Desks", KIND_CHIPS)}
    </>
  );
}

function WireFilterBar({
  query,
  onChange,
}: {
  readonly query: string;
  readonly onChange: (next: string) => void;
}): ReactElement {
  const inputId = useId();
  return (
    <div className="filter-bar">
      <div className="filter-query">
        <label className="visually-hidden" htmlFor={inputId}>
          Filter the wire
        </label>
        <input
          id={inputId}
          type="text"
          value={query}
          spellCheck={false}
          placeholder="filter — try NVDA, is:sell, is:bot, a name"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function TradeRow({ trade }: { readonly trade: WireTrade }): ReactElement {
  return (
    <li className="wire-trade">
      <span className={`wire-side tone-${trade.side === "buy" ? "pos" : "neg"}`}>
        {trade.side.toUpperCase()}
      </span>
      <span className="wire-sym">{trade.symbol}</span>
      <span className="num wire-qty">{trade.quantity}</span>
      <span className="num wire-price">{trade.price}</span>
      <Link to="/u/$id" params={{ id: trade.whoId }} className="wire-who">
        {trade.who}
      </Link>
      <span className={`chip chip-${trade.kind}`}>{trade.kind === "bot" ? "BOT" : "HUMAN"}</span>
      {trade.reconstructed ? (
        <span className="wire-recon" title="Recovered after the fact, not watched live">
          reconstructed
        </span>
      ) : null}
      <span className="wire-when num">{trade.when}</span>
    </li>
  );
}

function SideColumns({ wire }: { readonly wire: WireFeed }): ReactElement {
  return (
    <>
      <section className="wire-panel">
        <h2 className="wire-h">Booked P&L</h2>
        {wire.pnl.length === 0 ? (
          <p className="note">Nothing booked yet — realized P&L shows up on the first close.</p>
        ) : (
          <ul className="wire-pnl">
            {wire.pnl.map((row) => (
              <li key={row.whoId}>
                <Link to="/u/$id" params={{ id: row.whoId }}>
                  {row.who}
                </Link>
                <span className={`chip chip-${row.kind}`}>
                  {row.kind === "bot" ? "BOT" : "HUMAN"}
                </span>
                <span className={`num tone-${row.tone}`}>{row.realized}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="wire-panel">
        <h2 className="wire-h">Feedback pulse</h2>
        {!wire.feedbackEnabled ? (
          <p className="note">Feedback isn't switched on yet, so there's nothing to show here.</p>
        ) : wire.feedback.length === 0 ? (
          <p className="note">
            No feedback filed yet — be the first from <a href="/app/feedback">the feedback form</a>.
          </p>
        ) : (
          <ul className="wire-fdbk">
            {wire.feedback.map((item) => (
              <li key={item.url}>
                <span title="kind">{item.icon}</span>
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
                {item.status ? (
                  <span className={`wire-status wire-status-${item.statusKey}`}>{item.status}</span>
                ) : null}
                <span className="wire-fdbk-meta num">{item.meta}</span>
              </li>
            ))}
          </ul>
        )}
        <details className="wire-onramp">
          <summary>Weigh in on someone else's idea</summary>
          <ol>
            <li>
              <strong>Create a free GitHub account</strong> if you don't have one —{" "}
              <a href="https://github.com/join" target="_blank" rel="noopener noreferrer">
                github.com/join
              </a>
              .
            </li>
            <li>
              <strong>Open the issue</strong> from any item above and drop a comment — agree, add
              detail, or just say you want it too.
            </li>
            <li>
              <strong>Mention @claude</strong> when you want it acted on, not just read. (Ask Eric
              to add you as a collaborator first — that's what makes the mention count.)
            </li>
          </ol>
        </details>
      </section>
    </>
  );
}

function WirePage(): ReactElement {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const wire = useQuery({ queryKey: ["wire"], queryFn: fetchWire, refetchOnWindowFocus: true });
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

  if (wire.isPending)
    return (
      <PageFrame>
        <p className="note">Tuning the wire…</p>
      </PageFrame>
    );
  if (wire.isError)
    return (
      <PageFrame>
        <p className="note">The wire is unreachable.</p>
      </PageFrame>
    );

  const filter = parseWireQuery(query);
  const shown = wire.data.trades.filter((trade) => matchesWire(trade, filter));

  return (
    <PageFrame rail={<WireRail query={query} onChange={setFilter} />}>
      <header className="page-header">
        <h1>The Wire</h1>
        <p>Every trade, every P&L, every open idea — the live pulse of the whole league.</p>
      </header>
      <WireFilterBar query={query} onChange={setFilter} />
      <div className="wire-grid">
        <section className="wire-panel wire-feed">
          <h2 className="wire-h">Trading activity</h2>
          {shown.length === 0 ? (
            <p className="note">
              {wire.data.trades.length === 0
                ? "No trades on the wire yet — the first fill lights it up."
                : "Nothing on the wire matches this filter."}
            </p>
          ) : (
            <ul className="wire-trades">
              {shown.map((trade) => (
                <TradeRow key={trade.key} trade={trade} />
              ))}
            </ul>
          )}
        </section>
        <div className="wire-side-col">
          <SideColumns wire={wire.data} />
        </div>
      </div>
    </PageFrame>
  );
}

export const Route = createFileRoute("/wire")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.q === "string" && search.q.length > 0 && search.q.length <= 200
      ? { q: search.q }
      : {}),
  }),
  component: WirePage,
});
