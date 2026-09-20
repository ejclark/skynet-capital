import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useId } from "react";
import { type DeskSnapshot, matchesFilter, parseDeskQuery, toggleQualifier } from "../live/desk";
import { LandmarkHero } from "./landmark-hero";
import { PositionsTable } from "./positions-table";
import { ViewTabs } from "./view-tabs";

/**
 * ACCOUNTS' POSITIONS SECTION — ported from the retired `/u/:id` positions view (its own doc
 * comment called it "the Desk," a term Eric retired; nothing here uses it). Single-account
 * selection gets the full treatment that view had: the 3D landmark hero for persona-mapped bots,
 * saved-view tabs + an Issues-style filter bar over the blotter, and the "New trade" CTA. Saved
 * views are keyed per-account (`ViewTabs`' `useSavedViews` store), so they only make sense for one
 * selected account — "All accounts" keeps the grouped, unfiltered layout it already had.
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
  const filter = parseDeskQuery(query);
  const shown = d.positions.filter((p) => matchesFilter(p, filter));
  return (
    <>
      {landmark && !d.error ? (
        <LandmarkHero name={d.name} power={landmark.power} health={landmark.health} />
      ) : null}
      {d.error ? (
        <p className="note-stop">Account unreachable — positions can't be read right now.</p>
      ) : (
        <>
          <ViewTabs deskId={d.id} query={query} onPick={onFilterChange} />
          <FilterBar query={query} onChange={onFilterChange} />
          <PositionsTable positions={shown} deskId={d.id} totalCount={d.positions.length} />
          <Link to="/trade" search={{ desk: d.id }} className="trade-link-card">
            <span>
              <strong>New trade</strong>
              <span className="trade-link-sub">
                Open Trade — the gate reviews before anything is sent
              </span>
            </span>
            <span className="trade-link-arrow" aria-hidden="true">
              →
            </span>
          </Link>
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
