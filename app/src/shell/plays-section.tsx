import type { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import {
  cardMatches,
  type OutpostCatalog,
  type OutpostFilter,
  type PlayFacet,
} from "../live/outpost";
import { PlayCard } from "./play-card";

/**
 * RESEARCH'S "PLAYS" SECTION (#3333 slice 9) — the Trading Outpost's filterable play catalog,
 * ported in whole from the now-deleted `/outpost` route. See `research.tsx`'s own doc comment for
 * why this lives here instead of a route of its own.
 */

function PlaysChipRow({
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
  if (facets.length < 2) return null;
  return (
    <div className="op-chips">
      <span className="op-chips-label">{label}</span>
      {facets.map((facet) => (
        <button
          key={facet.id}
          type="button"
          className="op-chip"
          aria-pressed={selected === facet.id}
          onClick={() => onPick(facet.id)}
        >
          {facet.label} <span className="op-count num">{facet.count}</span>
        </button>
      ))}
    </div>
  );
}

function PlaysDeck({
  catalog,
  filter,
  onToggle,
}: {
  readonly catalog: OutpostCatalog;
  readonly filter: OutpostFilter;
  readonly onToggle: (key: keyof OutpostFilter, id: string) => void;
}): ReactElement {
  const shown = catalog.cards.filter((card) => cardMatches(card, filter));
  if (shown.length === 0) {
    return <p className="note">No play matches this filter.</p>;
  }
  return (
    <div className="op-deck">
      {shown.map((card) => (
        <PlayCard
          key={card.id}
          card={card}
          onPickAuthor={(id) => onToggle("author", id)}
          onPickTrait={(id) => onToggle("trait", id)}
        />
      ))}
    </div>
  );
}

/** @category plays */
export function PlaysSection({
  outpost,
  filter,
  onToggle,
}: {
  readonly outpost: ReturnType<typeof useQuery<OutpostCatalog>>;
  readonly filter: OutpostFilter;
  readonly onToggle: (key: keyof OutpostFilter, id: string) => void;
}): ReactElement {
  if (outpost.isPending) return <p className="note">Opening the Outpost…</p>;
  if (outpost.isError || !outpost.data) return <p className="note">The Outpost is unreachable.</p>;
  const catalog = outpost.data;
  return (
    <>
      <header className="page-header">
        <h1>Plays</h1>
        <p>
          Every play in the house, as a card you can browse. Filter by author, symbol, what keys the
          window, or what the play promises — a card describes the play's <b>rules</b>, never a
          position it holds today.
        </p>
      </header>
      <PlaysChipRow
        label="Symbol"
        facets={catalog.symbols}
        selected={filter.symbol}
        onPick={(id) => onToggle("symbol", id)}
      />
      <PlaysChipRow
        label="Trait"
        facets={catalog.traits}
        selected={filter.trait}
        onPick={(id) => onToggle("trait", id)}
      />
      <PlaysDeck catalog={catalog} filter={filter} onToggle={onToggle} />
      <p className="op-note">
        Every card is written today by the house — the roster in{" "}
        <span className="num">src/playbooks</span> is code-reviewed before a play can run.
        Player-authored plays land in a later slice, and will carry their author on the same line.
      </p>
    </>
  );
}
