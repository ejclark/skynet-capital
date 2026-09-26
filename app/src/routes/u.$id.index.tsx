import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { fetchDesk } from "../live/desk";
import { fetchSettings } from "../live/settings";
import { AccountPage, useOwnsAccount } from "../shell/account-head";
import { DeskTilesGrid } from "../shell/desk-tiles-grid";
import { PageFrame } from "../shell/frame";
import { NewTradeCard, PositionsBlotter } from "../shell/positions-blotter";
import { SauronCard } from "../shell/sauron-card";

/**
 * THE ANY-ACCOUNT PAGE'S OVERVIEW (#738 phase 2c; #3807 slice 2d) — `/u/:id` for any account, bot
 * or human: its own head (`account-head.tsx`), the tiles, the character card, and the blotter
 * behind saved-view tabs (#738 phase 3b, the Projects pattern) and an Issues-style filter bar
 * (chips ⇄ query text, one model) — the blotter itself is `positions-blotter.tsx`, shared with the
 * accounts page (#3407 P0: it used to be pasted here). Responsive disclosure per the round-1
 * verdict: detail columns visible on wide viewports, folded behind chevrons only when narrow.
 *
 * The page is the Profile page's Overview grid (`overview-grid.css`): the tiles, then the book
 * (the blotter) in the left column, Sauron's character card top-right from 1200px spanning both —
 * one component on two pages, with this account's own landmark dials when it is a persona-mapped
 * bot and the scene's defaults otherwise (the old 21:9 strip retired with this slice). A phone
 * reads it in DOM order: tiles → book → card, so what this account holds comes before the art.
 * Ownership decides the writes (dead end 4): off an account the viewer owns, the rows offer no
 * Close and the New trade card gives way to one plain sentence above the blotter.
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
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const owned = settings.data?.accounts ?? [];
  const canTrade = useOwnsAccount(id);
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

  return (
    <AccountPage desk={d}>
      {d.error ? (
        <p className="note-stop">Account unreachable — positions can't be read right now.</p>
      ) : (
        <div className="overview-grid">
          <div className="overview-worth">
            <DeskTilesGrid tiles={d.tiles} />
          </div>
          <div className="overview-decide acct-book">
            {canTrade ? null : (
              <p className="acct-own-note">You can trade only your own accounts.</p>
            )}
            <PositionsBlotter
              deskId={d.id}
              positions={d.positions}
              query={query}
              onFilterChange={setFilter}
              canTrade={canTrade}
            />
            {canTrade ? <NewTradeCard deskId={d.id} /> : null}
          </div>
          <div className="overview-card">
            <SauronCard
              {...(landmark ? { landmark } : {})}
              ownedIds={owned.map((a) => a.id)}
              meId={owned.find((a) => a.kind === "human")?.id}
              scope=".acct-page"
            />
          </div>
        </div>
      )}
      <footer className="obs-foot num">as of {generatedAt}</footer>
    </AccountPage>
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
