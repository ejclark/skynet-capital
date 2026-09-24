import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useId, useMemo } from "react";
import {
  type Decision,
  type DeskAllocation,
  type DeskPosition,
  matchesFilter,
  parseDeskQuery,
  toggleQualifier,
} from "../live/desk";
import { fetchOptionPositions, type OptionPositions } from "../live/options";
import { PositionCards } from "./position-cards";
import { type Lens, LensSwitch, MapLens, RunwayLens } from "./positions-lens";
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

/** The plain filter chips (#3689 slice 6b), each a qualifier in the one query model. "All" isn't
 *  here: it's the absence of every chip's qualifier, and clearing them is its action. */
export const POSITION_CHIPS = [
  ["is:option", "Options"],
  ["is:share", "Shares"],
  ["pl:>0", "In profit"],
  ["pl:<0", "Losing"],
  ["dte:<21", "Expiring within 3 weeks"],
  ["event:before-expiry", "Earnings before expiry"],
] as const;

const CHIP_QUALIFIERS: readonly string[] = POSITION_CHIPS.map(([q]) => q);

/** The query with every chip qualifier removed, keeping any typed search words. */
export function clearChips(query: string): string {
  return query
    .split(/\s+/)
    .filter((p) => p && !CHIP_QUALIFIERS.includes(p.toLowerCase()))
    .join(" ");
}

export function PositionsFilterBar({
  query,
  onChange,
}: {
  readonly query: string;
  readonly onChange: (next: string) => void;
}): ReactElement {
  const inputId = useId();
  const tokens = query.toLowerCase().split(/\s+/);
  const noChip = !POSITION_CHIPS.some(([q]) => tokens.includes(q));
  return (
    <div className="filter-bar">
      <div className="filter-query">
        <label className="visually-hidden" htmlFor={inputId}>
          Search or filter positions
        </label>
        <input
          id={inputId}
          type="text"
          value={query}
          spellCheck={false}
          placeholder="Search or filter: NVDA, is:option, dte:<21, pl:>0"
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="filter-kbd" aria-hidden="true">
          /
        </span>
      </div>
      <div className="filter-chips">
        <button
          type="button"
          className="filter-chip"
          aria-pressed={noChip}
          onClick={() => onChange(clearChips(query))}
        >
          All
        </button>
        {POSITION_CHIPS.map(([qualifier, label]) => (
          <button
            key={qualifier}
            type="button"
            className="filter-chip"
            aria-pressed={tokens.includes(qualifier)}
            onClick={() => onChange(toggleQualifier(query, qualifier))}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Tabs + filter bar + the filtered table, for one account. */
const dollars = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** "−$12/day" per held contract, from the option book's per-holding theta (#3689 slice 6). A
 *  contract the feed didn't quote has no entry, so its cell reads "—" rather than a made-up zero. */
export function decayBySymbol(statement: OptionPositions | undefined): ReadonlyMap<string, string> {
  const out = new Map<string, string>();
  if (!statement?.available) return out;
  for (const row of statement.rows) {
    const theta = row.positionGreeks?.theta;
    if (theta === undefined || !Number.isFinite(theta)) continue;
    out.set(row.symbol, `${theta < 0 ? "−" : "+"}${dollars.format(Math.abs(theta))}/day`);
  }
  return out;
}

export function PositionsBlotter({
  deskId,
  positions,
  query,
  onFilterChange,
  lens,
  onLensChange,
  allocation,
  decisions = [],
}: {
  readonly deskId: string;
  readonly positions: readonly DeskPosition[];
  readonly query: string;
  readonly onFilterChange: (next: string) => void;
  /** List · Map · Runway (#3689 slice 9). Omitted where the lens switch doesn't apply (`/u/:id`). */
  readonly lens?: Lens;
  readonly onLensChange?: (next: Lens) => void;
  /** The Map lens sizes cash from it; without one, Map falls back to List. */
  readonly allocation?: DeskAllocation;
  readonly decisions?: readonly Decision[];
}): ReactElement {
  const filter = parseDeskQuery(query);
  const shown = positions.filter((p) => matchesFilter(p, filter));
  const hasOptions = positions.some((p) => p.isOption);
  // Same cache as the Money strip and the Trade page's option card: one read of the option book.
  const statement = useQuery({
    queryKey: ["option-positions", deskId],
    queryFn: () => fetchOptionPositions(deskId),
    enabled: hasOptions,
    staleTime: 30_000,
  });
  const decay = useMemo(() => decayBySymbol(statement.data), [statement.data]);
  const view = lens === "map" && !allocation ? "list" : (lens ?? "list");
  return (
    <>
      {lens && onLensChange ? (
        <div className="positions-head">
          <h2 className="positions-title">
            Positions <span className="num">{positions.length}</span>
          </h2>
          <LensSwitch lens={view} onChange={onLensChange} />
        </div>
      ) : null}
      <ViewTabs deskId={deskId} query={query} onPick={onFilterChange} />
      <PositionsFilterBar query={query} onChange={onFilterChange} />
      {view === "map" && allocation ? (
        <MapLens positions={shown} allocation={allocation} decisions={decisions} />
      ) : view === "runway" ? (
        <RunwayLens positions={shown} />
      ) : (
        <div className="pos-blotter">
          <PositionsTable
            positions={shown}
            deskId={deskId}
            totalCount={positions.length}
            decayBySymbol={decay}
          />
          {shown.length > 0 ? (
            <PositionCards positions={shown} deskId={deskId} decayBySymbol={decay} />
          ) : null}
        </div>
      )}
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
