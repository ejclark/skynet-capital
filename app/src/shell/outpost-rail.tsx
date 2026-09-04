import type { ReactElement } from "react";
import type { OutpostCatalog, OutpostFilter, PlayFacet } from "../live/outpost";

/**
 * THE OUTPOST'S RAIL (#809 slice 1) — the view's control column, per the frame's dimensional
 * precedence: the topbar owns app navigation, so the rail drives the content beside it. Author is
 * the member's headline ask ("filter by author"), so it leads; trigger is the second axis.
 *
 * Facets are the server's counted values, so an option can never exist for a value no card has —
 * there is no such thing here as a filter that returns nothing.
 */

function FacetGroup({
  label,
  facets,
  selected,
  onPick,
}: {
  readonly label: string;
  readonly facets: readonly PlayFacet[];
  readonly selected: string | undefined;
  readonly onPick: (id: string) => void;
}): ReactElement | null {
  if (facets.length === 0) return null;
  return (
    <>
      <p className="rail-label">{label}</p>
      {facets.map((facet) => (
        <button
          key={facet.id}
          type="button"
          className="railctl"
          aria-pressed={selected === facet.id}
          onClick={() => onPick(facet.id)}
        >
          {facet.label} <span className="op-count num">{facet.count}</span>
        </button>
      ))}
    </>
  );
}

/** @category navigation */
export function OutpostRail({
  catalog,
  filter,
  onToggle,
  onClear,
}: {
  readonly catalog: OutpostCatalog;
  readonly filter: OutpostFilter;
  readonly onToggle: (key: keyof OutpostFilter, id: string) => void;
  readonly onClear: () => void;
}): ReactElement {
  const filtered = Object.keys(filter).length > 0;
  return (
    <>
      <FacetGroup
        label="Author"
        facets={catalog.authors}
        selected={filter.author}
        onPick={(id) => onToggle("author", id)}
      />
      <hr />
      <FacetGroup
        label="Trigger"
        facets={catalog.triggers}
        selected={filter.trigger}
        onPick={(id) => onToggle("trigger", id)}
      />
      {filtered ? (
        <>
          <hr />
          <button type="button" className="railctl" onClick={onClear}>
            Clear filters
          </button>
        </>
      ) : null}
    </>
  );
}
