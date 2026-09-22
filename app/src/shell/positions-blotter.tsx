import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useId } from "react";
import { type DeskPosition, matchesFilter, parseDeskQuery, toggleQualifier } from "../live/desk";
import { PositionsTable } from "./positions-table";
import { ViewTabs } from "./view-tabs";

/**
 * THE ONE POSITIONS BLOTTER (#3407 P0; study §3.2 item 8) — saved-view tabs, the Issues-style
 * filter bar (chips ⇄ query text, one model) and the table, as a single component. It used to be
 * pasted twice: `/app/accounts?section=overview` and `/app/u/$id` each carried their own `CHIPS`
 * and `FilterBar`, so a chip added to one never reached the other. Both routes now render this;
 * the routes keep only what differs (the desk page's tiles and footer, the accounts page's
 * multi-account grouping). The "New trade" card rides along for the same reason.
 * @category accounts
 */

export const POSITION_CHIPS = [
  ["is:option", "Options only"],
  ["pl:>0", "In profit"],
  ["pl:<0", "Under water"],
] as const;

export function PositionsFilterBar({
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
      {POSITION_CHIPS.map(([qualifier, label]) => (
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

/** Tabs + filter bar + the filtered table, for one account. */
export function PositionsBlotter({
  deskId,
  positions,
  query,
  onFilterChange,
}: {
  readonly deskId: string;
  readonly positions: readonly DeskPosition[];
  readonly query: string;
  readonly onFilterChange: (next: string) => void;
}): ReactElement {
  const filter = parseDeskQuery(query);
  const shown = positions.filter((p) => matchesFilter(p, filter));
  return (
    <>
      <ViewTabs deskId={deskId} query={query} onPick={onFilterChange} />
      <PositionsFilterBar query={query} onChange={onFilterChange} />
      <PositionsTable positions={shown} deskId={deskId} totalCount={positions.length} />
    </>
  );
}

/** The "New trade" card under a blotter — one copy, one sentence. */
export function NewTradeCard({ deskId }: { readonly deskId: string }): ReactElement {
  return (
    <Link to="/trade" search={{ desk: deskId }} className="trade-link-card">
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
  );
}
