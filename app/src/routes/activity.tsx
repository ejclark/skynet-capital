import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  type ActivityFilter,
  type ActivityQualifier,
  buildActivityFeed,
  filingsInScope,
  kindInScope,
  matchesActivity,
  parseActivityQuery,
  toggleActivityQualifier,
} from "../live/activity-feed";
import { fetchCouncil } from "../live/council";
import { fetchFilingComments } from "../live/filing-comments";
import { fetchWire, type WireFeed, type WireTrade } from "../live/wire";
import { CouncilCompose } from "../shell/council-compose";
import { FilingOnramp } from "../shell/filing-onramp";
import { PageFrame } from "../shell/frame";
import { PnlStrip } from "../shell/pnl-strip";
import { SectionSwitch } from "../shell/section-switch";
import { type PageSection, resolveSection } from "../shell/sections";
import { DevelopmentRow } from "../shell/wire-development-row";
import { FilingRow } from "../shell/wire-filing-row";
import { TradeRow } from "../shell/wire-trade-row";

/**
 * ACTIVITY (#738 phase 5a; renamed from "The Wire" — #784 naming pass) — the league's live pulse in
 * the shell, on the Issues-list template: ONE feed of everything the league does, filterable by
 * kind, with booked P&L as a summary strip above it. IA: this is every transaction and open idea
 * across the whole league, one feed — "Activity" says that in one word where "The Wire" made a
 * first-time viewer guess (Eric, 2026-08-28: "i don't know what to expect when I see 'The Wire'").
 * The topbar link, the page and the URL all say the same word (`/app/activity`, with `/app/wire` and
 * `/wire` 302ing here so no bookmark strands). Honesty seams are unchanged: reconstructed provenance
 * is labeled, an unwired feedback lane says so, filings stay pseudonymous.
 *
 * ONE FEED, NOT THREE WIDGETS (#784 slice 3). Trades and filings were never two presentation
 * choices — they were two unrelated DATA MODELS sharing a screen (Eric, 2026-09-06: they "have no
 * fundamental overlap"), which is what slices 1 and 2 fixed by putting both on #1211's one event
 * envelope. So this page now spends its "section" concept on only what is genuinely a different
 * SHAPE of data, and expresses the rest as KINDS — `frame.tsx`'s three-word rule, applied:
 *   - Trades, filings and merged pull requests are KINDS: chips on one list (`activity-feed.ts` owns
 *     the grammar). The third one arrived in slice 4 as a chip and a row component — no new section,
 *     no widget beside the feed, which is the test the shape was built to pass.
 *   - Booked P&L is a STRIP, not a section: a standing snapshot, always true, never paged to
 *     (#784's criterion — "never a fourth item competing for the same section concept").
 *   - The Council stays a SECTION: a composer plus this week's lines is not a record of something
 *     that happened, so it is not a kind of event and does not belong in the feed.
 * Two sections remain, and the one that is current renders ALONE at every width — Settings' own use
 * of the same switch, and the shape Eric asked for on 2026-09-06 after #1749 shipped the "beside"
 * version ("the whole page just feels like a hot mess"). Mobile-first (`CLAUDE.md`): the feed is
 * curated at 390px — one row per event, the kind word at the left edge — and a wider viewport gives
 * the same rows more room, never new concepts.
 */

/** The chip groups, in the order the controls row reads them. Kind leads, because it decides which
 *  of the groups below it still have anything to do. */
const KIND_CHIPS = [
  ["is:trade", "Trades"],
  ["is:feedback", "Ideas"],
  ["is:development", "Builds"],
] as const;
const SIDE_CHIPS = [
  ["is:buy", "Buys"],
  ["is:sell", "Sells"],
] as const;
const DESK_CHIPS = [
  ["is:bot", "Bots"],
  ["is:human", "Humans"],
] as const;
const FILING_CHIPS = [["show:shipped", "Include shipped"]] as const;

type ActivitySection = "feed" | "council";

const SECTIONS: readonly PageSection<ActivitySection>[] = [
  { id: "feed", label: "Activity" },
  { id: "council", label: "The Council" },
];

/** The controls row (#3807 slice 2a — the rail left the frame): the page's sections first, then —
 *  only while the feed is the current one — its filter groups, the same one-model qualifiers the bar
 *  accepts as text. A group whose kind the filter has already excluded is not rendered: a "Buys"
 *  chip beside a list narrowed to filings would be a control with nothing to do, the same reason the
 *  whole row hides when the page has paged away from the feed. The `<hr />` keeps the two roles
 *  apart at every width, where the row hides the group labels. */
function WireControls({
  query,
  filter,
  feedbackEnabled,
  developmentEnabled,
  onChange,
  section,
  onSection,
}: {
  readonly query: string;
  readonly filter: ActivityFilter;
  /** An unwired lane is a deployment fact, so its chip is not rendered at all — pressing "Ideas" or
   *  "Builds" where nothing can ever arrive would blame a member's filter for that fact, and the Kind
   *  group itself disappears when only one kind is left, because then it is a control with nothing to
   *  do. The feed says why in its own note instead. */
  readonly feedbackEnabled: boolean;
  readonly developmentEnabled: boolean;
  readonly onChange: (next: string) => void;
  readonly section: ActivitySection;
  readonly onSection: (next: ActivitySection) => void;
}): ReactElement {
  const group = (label: string, chips: readonly (readonly [string, string])[]) => (
    <>
      <p className="rail-label">{label}</p>
      {chips.map(([qualifier, text]) => (
        <button
          key={qualifier}
          type="button"
          className="railctl"
          aria-pressed={filter.qualifiers.includes(qualifier as ActivityQualifier)}
          onClick={() => onChange(toggleActivityQualifier(query, qualifier as ActivityQualifier))}
        >
          {text}
        </button>
      ))}
    </>
  );
  const kinds = KIND_CHIPS.filter(([qualifier]) =>
    qualifier === "is:feedback"
      ? feedbackEnabled
      : qualifier === "is:development"
        ? developmentEnabled
        : true,
  );
  const tradesInScope = kindInScope(filter, "trade");
  const filings = feedbackEnabled && filingsInScope(filter);
  return (
    <>
      <SectionSwitch sections={SECTIONS} current={section} onSelect={onSection} />
      {section === "feed" ? (
        <>
          <hr />
          {kinds.length > 1 ? group("Kind", kinds) : null}
          {tradesInScope ? group("Side", SIDE_CHIPS) : null}
          {tradesInScope ? group("Desks", DESK_CHIPS) : null}
          {filings ? group("Filings", FILING_CHIPS) : null}
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
          placeholder="filter — try NVDA, is:sell, is:feedback, a name"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

/** THE COUNCIL (issue #2224 shape 1) — one line per member per week, visible inside the gate
 *  (`docs/THE-GAME.md:117`: "the argument is the product"). This is the league's shared view:
 *  everyone's lines. The composer itself is `shell/council-compose.tsx` since #3963, because the
 *  member's own line also renders beside their standing on the Profile Overview and it is ONE
 *  record — same endpoint, same `["council"]` query key, no copy to drift. */
function CouncilSection(): ReactElement {
  const queryClient = useQueryClient();
  const council = useQuery({ queryKey: ["council"], queryFn: fetchCouncil });

  if (council.isPending) return <p className="note">Tuning in…</p>;
  if (council.isError || !council.data) return <p className="note">The Council is unreachable.</p>;
  const data = council.data;
  if (!data.enabled) {
    return <p className="note">The Council isn't switched on yet in this deployment.</p>;
  }

  return (
    <section className="wire-panel">
      <h2 className="wire-h">The Council</h2>
      <p className="note">
        One line, once a week: your thesis and your bot's stance. Visible to the whole league — the
        argument is the product.
      </p>
      <CouncilCompose
        week={data}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["council"] })}
      />
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

/** The feed — one list, both kinds, newest first; its filter bar travels with it, because the filter
 *  is the feed's control and not the page's.
 *
 *  Only TRADES page: `/api/wire` cursors them at 30 rows (`src/server/pagination.ts`'s default), so
 *  without "load older trades" every fill before the current page is permanently unreachable from
 *  this screen even though the activity store still has it (#3187). Filings arrive bounded by the
 *  same `per_page` and have no cursor of their own — see `activity-feed.ts`'s header for why one
 *  unified cursor over two kinds with wildly different arrival rates would strand the rarer one. */
function FeedSection({
  wire,
  filter,
  query,
  onChange,
  onLoadMore,
  loadingMore,
  loadMoreError,
}: {
  readonly wire: WireFeed;
  readonly filter: ActivityFilter;
  readonly query: string;
  readonly onChange: (next: string) => void;
  readonly onLoadMore?: () => void;
  readonly loadingMore: boolean;
  readonly loadMoreError: boolean;
}): ReactElement {
  // Comments on a filing (issue #2224 shape 3) — the app's own store, never the GitHub thread. A
  // failed or unwired read just leaves the rows without their fold; the feed itself still renders.
  const queryClient = useQueryClient();
  const comments = useQuery({ queryKey: ["filing-comments"], queryFn: fetchFilingComments });
  const threads = comments.data?.enabled ? comments.data : undefined;
  const items = buildActivityFeed(
    wire.trades,
    wire.feedbackEnabled ? wire.feedback : [],
    wire.developmentEnabled ? (wire.development ?? []) : [],
  );
  const shown = items.filter((item) => matchesActivity(item, filter));
  return (
    <section className="wire-panel">
      <h2 className="wire-h">Everything, newest first</h2>
      <WireFilterBar query={query} onChange={onChange} />
      {shown.length === 0 ? (
        <p className="note">
          {items.length === 0
            ? "Nothing yet — the first fill, filed idea or merge lights it up."
            : "Nothing here matches this filter."}
        </p>
      ) : (
        <ul className="wire-feed">
          {shown.map((item) => {
            if (item.kind === "trade") return <TradeRow key={item.key} trade={item.trade} />;
            if (item.kind === "development") {
              return <DevelopmentRow key={item.key} merge={item.merge} />;
            }
            return (
              <FilingRow
                key={item.key}
                filing={item.filing}
                {...(threads ? { threads } : {})}
                onCommentSaved={() =>
                  queryClient.invalidateQueries({ queryKey: ["filing-comments"] })
                }
              />
            );
          })}
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
      {/* Two honesty seams the three-widget page also carried, and the feed owes a reader both: an
          unwired lane is a deployment fact rather than "nobody has filed", and a wired-but-empty one
          is an invitation rather than a gap. Neither is the feed's own empty state, which is about
          the filter. */}
      {wire.feedbackEnabled ? null : (
        <p className="note">Filing ideas isn't switched on yet, so no filed ideas show here.</p>
      )}
      {/* The same seam for the third kind. No matching "wired but empty" note: an empty build list
          asserts nothing on its own, whereas claiming "nothing has merged yet" would be a guess about
          a read that may simply have returned less than the repo holds. */}
      {wire.developmentEnabled ? null : (
        <p className="note">
          The build record isn't switched on in this deployment, so merged work isn't listed here.
        </p>
      )}
      {wire.feedbackEnabled && wire.feedback.length === 0 ? (
        <p className="note">
          No ideas filed yet — be the first: tell Moneypenny, and your filings are listed on{" "}
          <a href="/app/accounts?section=feedback">your Profile</a>.
        </p>
      ) : null}
      <FilingOnramp />
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
  const filter = parseActivityQuery(query);

  return (
    <PageFrame
      controls={
        <WireControls
          query={query}
          filter={filter}
          feedbackEnabled={feed.feedbackEnabled}
          developmentEnabled={Boolean(feed.developmentEnabled)}
          onChange={setFilter}
          section={section}
          onSection={setSection}
        />
      }
    >
      <header className="page-header">
        <h1>Activity</h1>
        <p>
          Every trade, every idea filed, every change merged — the live pulse of the whole league,
          one feed.
        </p>
      </header>
      {section === "feed" ? (
        <>
          <PnlStrip rows={feed.pnl} />
          <FeedSection
            wire={feedWithOlder}
            filter={filter}
            query={query}
            onChange={setFilter}
            onLoadMore={cursor ? loadMore : undefined}
            loadingMore={loadingMore}
            loadMoreError={loadMoreError}
          />
        </>
      ) : (
        <CouncilSection />
      )}
    </PageFrame>
  );
}

/**
 * `?section=pnl` and `?section=pulse` are LEGACY (#784 slice 3 folded both into the feed), and a
 * bookmark on either must not strand: `pnl` lands on the feed with the strip right there, and
 * `pulse` lands on the feed pre-filtered to filings, which is the thing that URL was asking for.
 * An unknown value falls through to the feed via `resolveSection`, never a blank stage.
 */
function readSearch(search: Record<string, unknown>): {
  readonly q?: string;
  readonly section?: ActivitySection;
} {
  const asked = typeof search.section === "string" ? search.section : undefined;
  const q =
    typeof search.q === "string" && search.q.length > 0 && search.q.length <= 200
      ? search.q
      : asked === "pulse"
        ? "is:feedback"
        : undefined;
  return {
    ...(q ? { q } : {}),
    ...(SECTIONS.some((s) => s.id === asked) ? { section: asked as ActivitySection } : {}),
  };
}

export const Route = createFileRoute("/activity")({
  validateSearch: readSearch,
  component: WirePage,
});
