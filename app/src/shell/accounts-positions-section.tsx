import type { ReactElement } from "react";
import type { DeskSnapshot } from "../live/desk";
import { LandmarkHero } from "./landmark-hero";
import { NewTradeCard, PositionsBlotter } from "./positions-blotter";
import { useLens } from "./positions-lens";
import { PositionsTable } from "./positions-table";

/**
 * ACCOUNTS' POSITIONS SECTION — ported from the retired `/u/:id` positions view (its own doc
 * comment called it "the Desk," a term Eric retired; nothing here uses it). Single-account
 * selection gets the full treatment that view had: the 3D landmark hero for persona-mapped bots,
 * saved-view tabs + an Issues-style filter bar over the blotter, and the "New trade" CTA — all
 * from `positions-blotter.tsx`, the one copy `/u/:id` renders too (#3407 P0). Saved views are
 * keyed per-account (`ViewTabs`' `useSavedViews` store), so they only make sense for one selected
 * account — "All accounts" keeps the grouped, unfiltered layout it already had.
 */

function SingleAccountPositions({
  desk,
  query,
  onFilterChange,
}: {
  readonly desk: DeskSnapshot;
  readonly query: string;
  readonly onFilterChange: (next: string) => void;
}): ReactElement {
  const { desk: d, landmark } = desk;
  const [lens, setLens] = useLens();
  return (
    <>
      {landmark && !d.error ? (
        <LandmarkHero name={d.name} power={landmark.power} health={landmark.health} />
      ) : null}
      {d.error ? (
        <p className="note-stop">Account unreachable — positions can't be read right now.</p>
      ) : (
        <>
          <PositionsBlotter
            deskId={d.id}
            positions={d.positions}
            query={query}
            onFilterChange={onFilterChange}
            lens={lens}
            onLensChange={setLens}
            {...(d.allocation ? { allocation: d.allocation } : {})}
            decisions={d.decisions ?? []}
          />
          <NewTradeCard deskId={d.id} />
        </>
      )}
    </>
  );
}

/** @category accounts */
export function AccountsPositionsSection({
  desks,
  query,
  onFilterChange,
}: {
  readonly desks: readonly DeskSnapshot[];
  readonly query: string;
  readonly onFilterChange: (next: string) => void;
}): ReactElement {
  if (desks.length === 1) {
    const only = desks[0];
    if (!only) return <p className="note">No account selected.</p>;
    return <SingleAccountPositions desk={only} query={query} onFilterChange={onFilterChange} />;
  }
  return (
    <>
      {desks.map((d) => (
        <section key={d.desk.id} className="accounts-group">
          <h2 className="accounts-group-head">
            {d.desk.name}{" "}
            <span className={`chip chip-${d.desk.kind}`}>
              {d.desk.kind === "bot" ? "BOT" : "HUMAN"}
            </span>
          </h2>
          <PositionsTable
            positions={d.desk.positions}
            deskId={d.desk.id}
            totalCount={d.desk.positions.length}
          />
        </section>
      ))}
    </>
  );
}
