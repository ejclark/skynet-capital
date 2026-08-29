import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import {
  cardMatches,
  fetchOutpost,
  type OutpostCatalog,
  type OutpostFilter,
  type PlayFacet,
  toggleFacet,
} from "../live/outpost";
import { PageFrame } from "../shell/frame";
import { OutpostRail } from "../shell/outpost-rail";
import { PlayCard } from "../shell/play-card";

/**
 * THE TRADING OUTPOST (#809 slice 1) — every play in the house as a browsable, filterable trading
 * card. The rail carries author and trigger; the chips above the deck carry symbol and trait; the
 * whole filter rides the URL, so a narrowed deck is a link you can send someone.
 *
 * What this slice deliberately does NOT do: authoring. `src/playbooks/**` is envelope-protected —
 * a play that can actually trade is code-reviewed before it runs — so the bounded authoring model
 * is its own slice. `author` is real here from day one so that slice changes the data source, not
 * the card.
 */

function ChipRow({
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

function Deck({
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

function OutpostPage(): ReactElement {
  const filter = Route.useSearch();
  const navigate = Route.useNavigate();
  const outpost = useQuery({ queryKey: ["outpost"], queryFn: fetchOutpost });

  const setFilter = (next: OutpostFilter) => void navigate({ search: next, replace: true });
  const onToggle = (key: keyof OutpostFilter, id: string) =>
    setFilter(toggleFacet(filter, key, id));

  if (outpost.isPending)
    return (
      <PageFrame>
        <p className="note">Opening the Outpost…</p>
      </PageFrame>
    );
  if (outpost.isError || !outpost.data)
    return (
      <PageFrame>
        <p className="note">The Outpost is unreachable.</p>
      </PageFrame>
    );

  const catalog = outpost.data;
  return (
    <PageFrame
      rail={
        <OutpostRail
          catalog={catalog}
          filter={filter}
          onToggle={onToggle}
          onClear={() => setFilter({})}
        />
      }
    >
      <header className="page-header">
        <h1>The Trading Outpost</h1>
        <p>
          Every play in the house, as a card you can browse. Filter by author, symbol, what keys the
          window, or what the play promises — a card describes the play's <b>rules</b>, never a
          position it holds today.
        </p>
      </header>
      <ChipRow
        label="Symbol"
        facets={catalog.symbols}
        selected={filter.symbol}
        onPick={(id) => onToggle("symbol", id)}
      />
      <ChipRow
        label="Trait"
        facets={catalog.traits}
        selected={filter.trait}
        onPick={(id) => onToggle("trait", id)}
      />
      <Deck catalog={catalog} filter={filter} onToggle={onToggle} />
      <p className="op-note">
        Every card is written today by the house — the roster in{" "}
        <span className="num">src/playbooks</span> is code-reviewed before a play can run.
        Player-authored plays land in a later slice, and will carry their author on the same line.
      </p>
    </PageFrame>
  );
}

const facet = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 && value.length <= 40 ? value : undefined;

export const Route = createFileRoute("/outpost")({
  validateSearch: (search: Record<string, unknown>): OutpostFilter => {
    const author = facet(search.author);
    const symbol = facet(search.symbol);
    const trigger = facet(search.trigger);
    const trait = facet(search.trait);
    return {
      ...(author ? { author } : {}),
      ...(symbol ? { symbol } : {}),
      ...(trigger ? { trigger } : {}),
      ...(trait ? { trait } : {}),
    };
  },
  component: OutpostPage,
});
