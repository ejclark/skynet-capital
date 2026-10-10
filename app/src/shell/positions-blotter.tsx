import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement, ReactNode, Ref } from "react";
import { useId, useMemo, useRef } from "react";
import {
  type Decision,
  type DeskAllocation,
  type DeskPosition,
  matchesFilter,
  parseDeskQuery,
  toggleQualifier,
} from "../live/desk";
import { fetchOptionPositions } from "../live/options";
import { decayBySymbol, deltaBySymbol } from "./holding-decay";
import { useKeepPlace } from "./keep-place";
import { useLandOnPosition } from "./position-anchor";
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
 *  here: it's the absence of every chip's qualifier, and clearing them is its action.
 *
 *  Each P/L chip says which of the two questions it answers (#5042): today's change, or lifetime
 *  against cost. It used to read "In profit" / "Losing" over lifetime P/L, and members tapped
 *  "Losing" for what was down today — 6 of 6 study sessions got "No positions match" while MSFT
 *  was −$76 on the day. The `pl:` tokens are unchanged, so a saved `pl:<0` view still resolves.
 *  "Up today" rides along because it adds no line to the chip row at 390 (three either way). */
export const POSITION_CHIPS = [
  ["is:option", "Options"],
  ["is:share", "Shares"],
  ["day:>0", "Up today"],
  ["day:<0", "Down today"],
  ["pl:>0", "Above cost"],
  ["pl:<0", "Below cost"],
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
  ref,
}: {
  readonly query: string;
  readonly onChange: (next: string) => void;
  /** The blotter keeps this bar still across a refinement (#5021). */
  readonly ref?: Ref<HTMLDivElement>;
}): ReactElement {
  const inputId = useId();
  const tokens = query.toLowerCase().split(/\s+/);
  const noChip = !POSITION_CHIPS.some(([q]) => tokens.includes(q));
  return (
    <div className="filter-bar" ref={ref}>
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
export function PositionsBlotter({
  deskId,
  positions,
  query,
  onFilterChange,
  lens,
  onLensChange,
  allocation,
  decisions = [],
  canTrade = true,
  children,
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
  /** Does the viewer own this account (#3807 slice 2d)? Off it, the rows offer no write. */
  readonly canTrade?: boolean;
  /** What sits under the list (the New trade card). It rides in the held region, so the space a
   *  refinement holds (#5021) opens below it, where the page ends, not between it and the rows. */
  readonly children?: ReactNode;
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
  const delta = useMemo(() => deltaBySymbol(statement.data), [statement.data]);
  const view = lens === "map" && !allocation ? "list" : (lens ?? "list");
  // An Events row's `#pos-<symbol>` link (#4348): land on the row or card once it has rendered.
  useLandOnPosition(`${view}:${shown.map((p) => p.symbol).join(",")}`);
  // A refinement that shortens the list keeps the filter bar under the finger (#5021): the list
  // is the last thing on the Overview, so a shorter one would let the browser clamp the scroll.
  const bar = useRef<HTMLDivElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const keepPlace = useKeepPlace(bar, result, `${view}|${query}`);
  const refine = (next: string) => {
    if (next !== query) keepPlace();
    onFilterChange(next);
  };
  const pickLens = (next: Lens) => {
    if ((next === "map" && !allocation ? "list" : next) !== view) keepPlace();
    onLensChange?.(next);
  };
  return (
    <>
      {lens && onLensChange ? (
        <div className="positions-head">
          <h2 className="positions-title">
            Positions <span className="num">{positions.length}</span>
          </h2>
          <LensSwitch lens={view} onChange={pickLens} />
        </div>
      ) : null}
      <ViewTabs deskId={deskId} query={query} onPick={refine} />
      <PositionsFilterBar query={query} onChange={refine} ref={bar} />
      <div className="positions-result" ref={result}>
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
              canTrade={canTrade}
            />
            {shown.length > 0 ? (
              <PositionCards
                positions={shown}
                deskId={deskId}
                decayBySymbol={decay}
                deltaBySymbol={delta}
              />
            ) : null}
          </div>
        )}
        {children}
      </div>
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
