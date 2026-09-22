import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { fetchDesk } from "../live/desk";
import { DeskRail } from "../shell/desk-rail";
import { DeskTilesGrid } from "../shell/desk-tiles-grid";
import { PageFrame } from "../shell/frame";
import { LandmarkHero } from "../shell/landmark-hero";
import { NewTradeCard, PositionsBlotter } from "../shell/positions-blotter";

/**
 * THE DESK (#738 phase 2c) — `/u/:id` in the shell: identity header, tabs, tiles, and the blotter
 * behind saved-view tabs (#738 phase 3b, the Projects pattern) and an Issues-style filter bar
 * (chips ⇄ query text, one model) — the blotter itself is `positions-blotter.tsx`, shared with the
 * accounts page (#3407 P0: it used to be pasted here). Tabs the shell doesn't own
 * yet link across to the server-rendered desk, honestly. Responsive disclosure per the round-1
 * verdict: detail columns visible on wide viewports, folded behind chevrons only when narrow.
 */

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
        <p className="note">Reading the account…</p>
      </PageFrame>
    );
  if (desk.isError)
    return (
      <PageFrame>
        <p className="note">This account is unreachable — {String(desk.error)}</p>
      </PageFrame>
    );
  const { desk: d, generatedAt, landmark } = desk.data;

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
        <p className="note-stop">Account unreachable — positions can't be read right now.</p>
      ) : (
        <>
          <DeskTilesGrid tiles={d.tiles} />
          <PositionsBlotter
            deskId={d.id}
            positions={d.positions}
            query={query}
            onFilterChange={setFilter}
          />
        </>
      )}
      {d.error ? null : <NewTradeCard deskId={d.id} />}
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
