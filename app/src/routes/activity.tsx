import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { FormEvent, ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { fetchCouncil, submitThesis } from "../live/council";
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
import { type PageSection, resolveSection } from "../shell/sections";
import { Toggle } from "../shell/toggle";
import { TradeRow } from "../shell/wire-trade-row";

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
 * SECTIONS, NOT TABS (#1740): the page holds three different SHAPES of data, so its controls row carries a
 * section switch above its filter chips (`frame.tsx`'s three-word rule — a section is a boundary,
 * a kind is a qualifier). EXCLUSIVE AT EVERY WIDTH (2026-09-06 — Eric, on the "beside" shape #1749
 * shipped: "'on the page' sections are always visible just place a different section in the
 * cockpit/driver's seat... the whole page just feels like a hot mess"): the pressed section is the
 * only one rendered, matching Settings' own use of the same switch (`settings.tsx`) — a page that
 * shares a mechanism should share its meaning. The section's panel is capped at `--col-read`
 * (`wire.css`), not stretched edge to edge, so a lone list on a wide screen reads as a page, not a
 * strip in a mostly-empty grid.
 */

const SIDE_CHIPS = [
  ["is:buy", "Buys"],
  ["is:sell", "Sells"],
] as const;
const KIND_CHIPS = [
  ["is:bot", "Bots"],
  ["is:human", "Humans"],
] as const;

type ActivitySection = "feed" | "pnl" | "pulse" | "council";

const SECTIONS: readonly PageSection<ActivitySection>[] = [
  { id: "feed", label: "Trading activity" },
  { id: "pnl", label: "Booked P&L" },
  { id: "pulse", label: "Feedback pulse" },
  { id: "council", label: "The Council" },
];

/** The controls row (#3807 slice 2a — the rail left the frame): the page's sections first, then —
 *  only while the feed is the current one — its filter groups, the same one-model qualifiers the bar accepts as text. The row drives the section
 *  below it (`frame.tsx`), so a chip that filters a list this page has paged away from would be a
 *  control with nothing to do; the feed's own bar travels with the feed either way. The `<hr />`
 *  keeps the two roles apart at every width, where the row hides the group labels. */
function WireControls({
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

const PULSE_FILTERS = [
  ["active", "Active"],
  ["all", "All"],
] as const;
type PulseFilter = (typeof PULSE_FILTERS)[number][0];

/** Open and shipped filings are two different things to look at — one is still moving, the other
 *  is a record — so they don't share a list by default (the same rule `feedback-recent.tsx` set
 *  for a member's own filings, #429; the league-wide pulse never inherited it). */
function PulseSection({ wire }: { readonly wire: WireFeed }): ReactElement {
  const [filter, setFilter] = useState<PulseFilter>("active");
  const visible =
    filter === "all" ? wire.feedback : wire.feedback.filter((f) => f.statusKey !== "shipped");
  return (
    <section className="wire-panel">
      <div className="wire-h-row">
        <h2 className="wire-h">Feedback pulse</h2>
        {wire.feedback.some((f) => f.statusKey === "shipped") ? (
          <Toggle label="Show" value={filter} options={PULSE_FILTERS} onPick={setFilter} />
        ) : null}
      </div>
      {!wire.feedbackEnabled ? (
        <p className="note">Feedback isn't switched on yet, so there's nothing to show here.</p>
      ) : wire.feedback.length === 0 ? (
        <p className="note">
          No feedback filed yet — be the first: tell Moneypenny, and your filings are listed on{" "}
          <a href="/app/accounts?section=feedback">your Profile</a>.
        </p>
      ) : visible.length === 0 ? (
        <p className="note">Nothing active — flip to "All" to see what's already shipped.</p>
      ) : (
        <ul className="wire-fdbk">
          {visible.map((item) => (
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

const COUNCIL_MAX_CHARS = 280;

/** THE COUNCIL (issue #2224 shape 1) — one line per member per week, visible inside the gate
 *  (`docs/THE-GAME.md:117`: "the argument is the product"). Resubmitting replaces this week's own
 *  line, so the composer prefills from `mine` rather than always starting blank — the affordance
 *  is "edit your line," never "post again." */
function CouncilSection(): ReactElement {
  const queryClient = useQueryClient();
  const council = useQuery({ queryKey: ["council"], queryFn: fetchCouncil });
  const [draft, setDraft] = useState<string | undefined>();
  // "" means "no play tagged" — undefined means "hasn't touched the selector", so it still
  // prefills from `mine` after a resubmit the same way the text draft does.
  const [playDraft, setPlayDraft] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | undefined>();
  const playSelectId = useId();

  if (council.isPending) return <p className="note">Tuning in…</p>;
  if (council.isError || !council.data) return <p className="note">The Council is unreachable.</p>;
  const data = council.data;
  if (!data.enabled) {
    return <p className="note">The Council isn't switched on yet in this deployment.</p>;
  }

  const text = draft ?? data.mine?.text ?? "";
  const play = playDraft ?? data.mine?.playbookId ?? "";
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNote(undefined);
    try {
      const result = await submitThesis(text, play || undefined);
      if (result.ok) {
        setDraft(undefined);
        setPlayDraft(undefined);
        setNote(undefined);
        await queryClient.invalidateQueries({ queryKey: ["council"] });
      } else {
        setNote(result.error ?? "Couldn't save that.");
      }
    } catch (err) {
      setNote(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="wire-panel">
      <h2 className="wire-h">The Council</h2>
      <p className="note">
        One line, once a week: your thesis and your bot's stance. Visible to the whole league — the
        argument is the product.
      </p>
      <form className="council-compose" onSubmit={(e) => void submit(e)}>
        <input
          type="text"
          value={text}
          maxLength={COUNCIL_MAX_CHARS}
          placeholder="I think NVDA runs, because…"
          onChange={(e) => setDraft(e.target.value)}
          disabled={busy}
        />
        <button
          type="submit"
          className="btn btn-primary council-submit"
          disabled={busy || text.trim().length === 0}
        >
          {busy ? "Saving…" : data.mine ? "Update" : "Commit"}
        </button>
      </form>
      {data.plays.length > 0 ? (
        <p className="council-play-picker">
          <label htmlFor={playSelectId}>Tag your bot's play (optional)</label>
          <select
            id={playSelectId}
            value={play}
            onChange={(e) => setPlayDraft(e.target.value)}
            disabled={busy}
          >
            <option value="">No play tagged</option>
            {data.plays.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {p.symbol}
              </option>
            ))}
          </select>
        </p>
      ) : null}
      <p className="council-count num">{COUNCIL_MAX_CHARS - text.length} left</p>
      {note ? <p className="set-err">{note}</p> : null}
      {data.entries.length === 0 ? (
        <p className="note">Nobody's spoken yet this week — be the first.</p>
      ) : (
        <ul className="wire-fdbk council-entries">
          {data.entries.map((entry) => (
            <li key={entry.id}>
              <span>{entry.text}</span>
              {entry.playbookId ? (
                <span className="council-play-tag">{entry.playbookId}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The feed section — its filter bar travels with it, because the filter is the feed's control and
 *  not the page's (a bar for a list the section switch has paged away from is noise).
 *
 *  `/api/wire` pages at 30 rows (`src/server/pagination.ts`'s default); on a league with any real
 *  trading volume that's today's trades alone, so "load older trades" is not a nicety — without it
 *  every trade before the current page is permanently unreachable from this screen even though the
 *  activity store still has it (#3187). */
function FeedSection({
  wire,
  query,
  onChange,
  onLoadMore,
  loadingMore,
  loadMoreError,
}: {
  readonly wire: WireFeed;
  readonly query: string;
  readonly onChange: (next: string) => void;
  readonly onLoadMore?: () => void;
  readonly loadingMore: boolean;
  readonly loadMoreError: boolean;
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
      {onLoadMore ? (
        <button
          type="button"
          className="btn wire-load-more"
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading…" : "Load older trades"}
        </button>
      ) : null}
      {loadMoreError ? <p className="set-err">Couldn't load older trades — try again.</p> : null}
    </section>
  );
}

function WirePage(): ReactElement {
  const { q, section: asked } = Route.useSearch();
  const navigate = Route.useNavigate();
  const wire = useQuery({
    queryKey: ["wire"],
    queryFn: () => fetchWire(),
    refetchOnWindowFocus: true,
  });
  // Older pages walked back via "load older trades" — kept separate from react-query's own cache
  // so a window-focus refetch of the first page doesn't have to know how to merge into it; a fresh
  // first page simply resets the walk-back (`useEffect` below).
  const [olderTrades, setOlderTrades] = useState<readonly WireTrade[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  useEffect(() => {
    setOlderTrades([]);
    setCursor(wire.data?.nextCursor);
    setLoadMoreError(false);
  }, [wire.data]);
  const loadMore = () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(false);
    fetchWire(cursor)
      .then((page) => {
        setOlderTrades((prev) => [...prev, ...page.trades]);
        setCursor(page.nextCursor);
      })
      .catch(() => setLoadMoreError(true))
      .finally(() => setLoadingMore(false));
  };
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
  const feedWithOlder: WireFeed = { ...feed, trades: [...feed.trades, ...olderTrades] };
  const render = (id: ActivitySection): ReactElement =>
    id === "feed" ? (
      <FeedSection
        wire={feedWithOlder}
        query={query}
        onChange={setFilter}
        onLoadMore={cursor ? loadMore : undefined}
        loadingMore={loadingMore}
        loadMoreError={loadMoreError}
      />
    ) : id === "pnl" ? (
      <PnlSection wire={feed} />
    ) : id === "pulse" ? (
      <PulseSection wire={feed} />
    ) : (
      <CouncilSection />
    );

  return (
    <PageFrame
      controls={
        <WireControls query={query} onChange={setFilter} section={section} onSection={setSection} />
      }
    >
      <header className="page-header">
        <h1>Activity</h1>
        <p>Every trade, every P&L, every open idea — the live pulse of the whole league.</p>
      </header>
      {render(section)}
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
