import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { fetchDesk, matchesFilter, parseDeskQuery, toggleQualifier } from "../live/desk";
import { DeskRail } from "../shell/desk-rail";
import { DeskTilesGrid } from "../shell/desk-tiles-grid";
import { PageFrame } from "../shell/frame";
import { LandmarkHero } from "../shell/landmark-hero";
import { PositionsTable } from "../shell/positions-table";
import { ViewTabs } from "../shell/view-tabs";

/**
 * THE DESK (#738 phase 2c) — `/u/:id` in the shell: identity header, tabs, tiles, and the blotter
 * behind saved-view tabs (#738 phase 3b, the Projects pattern) and an Issues-style filter bar
 * (chips ⇄ query text, one model). Tabs the shell doesn't own
 * yet link across to the server-rendered desk, honestly. Responsive disclosure per the round-1
 * verdict: detail columns visible on wide viewports, folded behind chevrons only when narrow.
 */

const CHIPS = [
  ["is:option", "Options only"],
  ["pl:>0", "In profit"],
  ["pl:<0", "Under water"],
] as const;

function FilterBar({
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
          Filter positions
        </label>
        <input
          id={inputId}
          type="text"
          value={query}
          spellCheck={false}
          placeholder="filter — try NVDA, is:option, pl:>0"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {CHIPS.map(([qualifier, label]) => (
        <button
          key={qualifier}
          type="button"
          className="filter-chip"
          aria-pressed={query.toLowerCase().split(/\s+/).includes(qualifier)}
          onClick={() => onChange(toggleQualifier(query, qualifier))}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function DeskPage(): ReactElement {
  const { id } = Route.useParams();
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const desk = useQuery({
    queryKey: ["desk", id],
    queryFn: () => fetchDesk(id),
    refetchOnWindowFocus: true,
  });
  // The filter is URL state (Eric, live review): typing stays immediate locally, the URL follows
  // a beat behind (replace, no history spam) — so a refresh or a shared link keeps the filter.
  const [query, setQuery] = useState(q ?? "");
  const urlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(urlTimer.current), []);
  const setFilter = (next: string) => {
    setQuery(next);
    clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      void navigate({
        search: next.trim() === "" ? {} : { q: next },
        replace: true,
      });
    }, 300);
  };

  if (desk.isPending)
    return (
      <PageFrame>
        <p className="note">Reading the desk…</p>
      </PageFrame>
    );
  if (desk.isError)
    return (
      <PageFrame>
        <p className="note">This desk is unreachable — {String(desk.error)}</p>
      </PageFrame>
    );
  const { desk: d, generatedAt, landmark } = desk.data;
  const filter = parseDeskQuery(query);
  const shown = d.positions.filter((p) => matchesFilter(p, filter));

  const rail = <DeskRail id={d.id} name={d.name} kind={d.kind} current="active" />;

  return (
    <PageFrame rail={rail}>
      <header className="desk-header">
        <div>
          <h1>{d.name}</h1>
          <p className="desk-sub">
            <span className={`chip chip-${d.kind}`}>{d.kind === "bot" ? "BOT" : "HUMAN"}</span>
            <span className="env-pill">SIM</span>
          </p>
        </div>
      </header>

      {landmark && !d.error ? (
        <LandmarkHero name={d.name} power={landmark.power} health={landmark.health} />
      ) : null}
      {d.error ? (
        <p className="note-stop">Account unreachable — this desk can't read positions right now.</p>
      ) : (
        <>
          <DeskTilesGrid tiles={d.tiles} />

          <ViewTabs deskId={d.id} query={query} onPick={setFilter} />
          <FilterBar query={query} onChange={setFilter} />

          <PositionsTable positions={shown} deskId={d.id} totalCount={d.positions.length} />
        </>
      )}
      {d.error ? null : (
        <Link to="/trade" search={{ desk: d.id }} className="trade-link-card">
          <span>
            <strong>New trade</strong>
            <span className="trade-link-sub">
              Open the trade ticket — the gate reviews before anything is sent
            </span>
          </span>
          <span className="trade-link-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      )}
      <footer className="obs-foot num">
        as of {generatedAt} · click a symbol for its fill timeline
      </footer>
    </PageFrame>
  );
}

export const Route = createFileRoute("/u/$id/")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.q === "string" && search.q.length > 0 && search.q.length <= 200
      ? { q: search.q }
      : {}),
  }),
  component: DeskPage,
});
