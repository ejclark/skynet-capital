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
import { SectionSwitch } from "../shell/section-switch";
import { orderSections, type PageSection, resolveSection } from "../shell/sections";

/**
 * ACTIVITY (#738 phase 5a; renamed from "The Wire" — #784 naming pass) — the league's live pulse
 * in the shell, on the Issues-list template: a filterable trade feed (chips ⇄ query text,
 * URL-stateful) with the booked-P&L strip and the feedback pulse alongside. IA: this is every
 * transaction and open idea across the whole league, one feed — "Activity" says that in one word
 * where "The Wire" made a first-time viewer guess (Eric, 2026-08-28: "i don't know what to expect
 * when I see 'The Wire' — the verbiage should be intuitive"). The topbar link and the `?`
 * shortcuts map already read "Activity" (#1119's canvas naming); the page followed in #784, and
 * the ROUTE followed last (2026-09-06, Eric: "the route for the activity tab still shows 'wire'
 * which is confusing af") — `/app/activity`, with `/app/wire` and `/wire` 302ing here so no
 * bookmark strands. Routes are implementation details of the IA: the label, the page and the URL
 * now say the same word. Same honesty seams as the
 * server view it succeeds: reconstructed provenance is labeled, an unwired feedback lane says so,
 * filings stay pseudonymous. The GitHub onramp folds behind a disclosure — reference, not front
 * matter.
 *
 * SECTIONS, NOT TABS (#1740): the page holds three different SHAPES of data, so the rail carries a
 * section switch above its filter chips (`frame.tsx`'s three-word rule — a section is a boundary,
 * a kind is a qualifier). Before this, Booked P&L and the feedback pulse stacked UNDER a feed of up
 * to 60 rows at 900px, so on a phone they were a long scroll below the trades; now the switch pages
 * between them, and a wider screen keeps them beside the current one rather than adding a concept.
 */

const SIDE_CHIPS = [
  ["is:buy", "Buys"],
  ["is:sell", "Sells"],
] as const;
const KIND_CHIPS = [
  ["is:bot", "Bots"],
  ["is:human", "Humans"],
] as const;

type ActivitySection = "feed" | "pnl" | "pulse";

const SECTIONS: readonly PageSection<ActivitySection>[] = [
  { id: "feed", label: "Trading activity" },
  { id: "pnl", label: "Booked P&L" },
  { id: "pulse", label: "Feedback pulse" },
];

/** The rail: the page's sections first, then — only while the feed is the current one — its filter
 *  groups, the same one-model qualifiers the bar accepts as text. The rail drives the section
 *  beside it (`frame.tsx`), so a chip that filters a list this page has paged away from would be a
 *  control with nothing to do; the feed's own bar travels with the feed either way. The `<hr />`
 *  keeps the two roles apart on a phone, where the rail is a row and the group labels are hidden. */
function WireRail({
  query,
  onChange,
  section,
  onSection,
}: {
  readonly query: string;
  readonly onChange: (next: string) => void;
  readonly section: ActivitySection;
  readonly onSection: (next: ActivitySection) => void;
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
      <SectionSwitch sections={SECTIONS} current={section} onSelect={onSection} />
      {section === "feed" ? (
        <>
          <hr />
          {group("Side", SIDE_CHIPS)}
          {group("Desks", KIND_CHIPS)}
        </>
      ) : null}
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
          Filter activity
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

function PnlSection({ wire }: { readonly wire: WireFeed }): ReactElement {
  return (
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
  );
}

function PulseSection({ wire }: { readonly wire: WireFeed }): ReactElement {
  return (
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
            <strong>Mention @claude</strong> when you want it acted on, not just read. (Ask Eric to
            add you as a collaborator first — that's what makes the mention count.)
          </li>
        </ol>
      </details>
    </section>
  );
}

/** The feed section — its filter bar travels with it, because the filter is the feed's control and
 *  not the page's (a bar for a list the section switch has paged away from is noise). */
function FeedSection({
  wire,
  query,
  onChange,
}: {
  readonly wire: WireFeed;
  readonly query: string;
  readonly onChange: (next: string) => void;
}): ReactElement {
  const filter = parseWireQuery(query);
  const shown = wire.trades.filter((trade) => matchesWire(trade, filter));
  return (
    <section className="wire-panel">
      <h2 className="wire-h">Trading activity</h2>
      <WireFilterBar query={query} onChange={onChange} />
      {shown.length === 0 ? (
        <p className="note">
          {wire.trades.length === 0
            ? "No trades yet — the first fill lights it up."
            : "Nothing here matches this filter."}
        </p>
      ) : (
        <ul className="wire-trades">
          {shown.map((trade) => (
            <TradeRow key={trade.key} trade={trade} />
          ))}
        </ul>
      )}
    </section>
  );
}

function WirePage(): ReactElement {
  const { q, section: asked } = Route.useSearch();
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
      void navigate({
        search: (prev) => ({ ...prev, q: next.trim() === "" ? undefined : next }),
        replace: true,
      });
    }, 300);
  };
  const section = resolveSection(SECTIONS, asked);
  const setSection = (next: ActivitySection) =>
    void navigate({
      search: (prev) => ({ ...prev, section: next === "feed" ? undefined : next }),
      replace: true,
    });

  if (wire.isPending)
    return (
      <PageFrame>
        <p className="note">Tuning in…</p>
      </PageFrame>
    );
  if (wire.isError)
    return (
      <PageFrame>
        <p className="note">Activity is unreachable.</p>
      </PageFrame>
    );

  const feed = wire.data;
  const render = (id: ActivitySection): ReactElement =>
    id === "feed" ? (
      <FeedSection wire={feed} query={query} onChange={setFilter} />
    ) : id === "pnl" ? (
      <PnlSection wire={feed} />
    ) : (
      <PulseSection wire={feed} />
    );
  // Current section first: on a phone it is the only one rendered (`wire.css`), on a wider screen
  // it takes the primary column and the rest sit beside it — room added, no new concept.
  const [primary, ...beside] = orderSections(SECTIONS, section);

  return (
    <PageFrame
      rail={
        <WireRail query={query} onChange={setFilter} section={section} onSection={setSection} />
      }
    >
      <header className="page-header">
        <h1>Activity</h1>
        <p>Every trade, every P&L, every open idea — the live pulse of the whole league.</p>
      </header>
      <div className="wire-grid">
        <div className="wire-primary-col">{primary ? render(primary.id) : null}</div>
        <div className="wire-side-col">
          {beside.map((s) => (
            <div key={s.id}>{render(s.id)}</div>
          ))}
        </div>
      </div>
    </PageFrame>
  );
}

export const Route = createFileRoute("/activity")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.q === "string" && search.q.length > 0 && search.q.length <= 200
      ? { q: search.q }
      : {}),
    ...(typeof search.section === "string" && SECTIONS.some((s) => s.id === search.section)
      ? { section: search.section as ActivitySection }
      : {}),
  }),
  component: WirePage,
});
