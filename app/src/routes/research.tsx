import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { type CollectionsIndex, fetchCollections } from "../live/collections";
import {
  fetchOutpost,
  type OutpostCatalog,
  type OutpostFilter,
  toggleFacet,
} from "../live/outpost";
import { useBoardView } from "../shell/board-section";
import { CollectionsSection } from "../shell/collections-section";
import { PageFrame } from "../shell/frame";
import { OutpostRail } from "../shell/outpost-rail";
import { PlaybooksRail, PlaybooksSection, usePlaybooksSection } from "../shell/playbooks-section";
import { PlaysSection } from "../shell/plays-section";
import { SectionSwitch } from "../shell/section-switch";
import { type PageSection, resolveSection } from "../shell/sections";
import { ShelfRail } from "../shell/shelf-parts";

/**
 * RESEARCH (#738 phase 6c; filters-first + rail-controls per Eric's live reviews) — the shelf in
 * the shell. The LEFT RAIL is this view's control column (the topbar owns app navigation, so the
 * rail drives content). The "Board" section (`board-section.tsx`) is the original single-page
 * Research: an event-horizon calendar pins a day into one query model, a text/symbol filter narrows
 * calls/ledgers/studies together. See that file's own doc comment for the lens/range design.
 *
 * SECTIONS (#3333 slice 9): Research grew two more sections, the same `SectionSwitch`/`sections.ts`
 * mechanism `accounts.tsx`/`activity.tsx`/`settings.tsx`/`trade.tsx` already use, URL-stateful via
 * `?section=`. "Plays" (`plays-section.tsx`) is the Trading Outpost's filterable play catalog,
 * ported in whole from the now-deleted `/outpost` route — reachable from nowhere in nav before
 * this, despite the "superseded by the Playbook Store" comment that removed its old link (#784) not
 * holding up (they solve different problems; see #3333's slice-8 audit). "Collections"
 * (`collections-section.tsx`) is the narrative-shelf browsing the now-deleted `/collections` routes
 * carried, reachable before this only via the `g c` keyboard chord. Each section keeps its own rail
 * content (the event horizon calendar for Board, Outpost's author/trigger facets for Plays, the
 * shelf list for Collections) — the section switch itself always leads the rail, per the frame's
 * "rail drives content" rule. This file stays thin route glue; each section's own markup, queries,
 * and helpers live in its own `shell/*.tsx` file (the arch fitness gate's cap forced the split).
 */

type ResearchSection = "board" | "playbooks" | "plays" | "collections";

/*
 * R&D (#3623, Eric 2026-09-23: "rename this to R & D") — "Playbooks" is the one home for house
 * playbooks, moved here from each account's desk (`playbooks-section.tsx`). Plays and Collections
 * stay until their parts are ported (#3623 slices 4–5), then retire.
 */
const SECTIONS: readonly PageSection<ResearchSection>[] = [
  { id: "board", label: "Board" },
  { id: "playbooks", label: "Playbooks" },
  { id: "plays", label: "Plays" },
  { id: "collections", label: "Collections" },
];

function ResearchPage(): ReactElement {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const section = resolveSection(SECTIONS, search.section);

  // URL-stateful filter, the desk's exact discipline: immediate locally, debounced replace.
  const [query, setQuery] = useState(search.q ?? "");
  const urlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(urlTimer.current), []);
  const setFilter = (next: string) => {
    setQuery(next);
    clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      void navigate({
        search: (prev) => ({ ...prev, q: next.trim() === "" ? undefined : next }),
        replace: true,
      });
    }, 300);
  };

  const board = useBoardView({ active: section === "board", query, setFilter });

  const playbooks = usePlaybooksSection(section === "playbooks", search.account);
  const onSelectAccount = (id: string | undefined) =>
    void navigate({ search: (prev) => ({ ...prev, account: id }), replace: true });

  const outpostFilter: OutpostFilter = {
    author: search.author,
    symbol: search.symbol,
    trigger: search.trigger,
    trait: search.trait,
  };
  const outpost = useQuery<OutpostCatalog>({
    queryKey: ["outpost"],
    queryFn: fetchOutpost,
    enabled: section === "plays",
  });
  const onToggleOutpost = (key: keyof OutpostFilter, id: string) => {
    const next = toggleFacet(outpostFilter, key, id);
    void navigate({
      search: (prev) => ({
        ...prev,
        author: next.author,
        symbol: next.symbol,
        trigger: next.trigger,
        trait: next.trait,
      }),
      replace: true,
    });
  };
  const onClearOutpost = () =>
    void navigate({
      search: (prev) => ({
        ...prev,
        author: undefined,
        symbol: undefined,
        trigger: undefined,
        trait: undefined,
      }),
      replace: true,
    });

  const collections = useQuery<CollectionsIndex>({
    queryKey: ["collections"],
    queryFn: fetchCollections,
    enabled: section === "collections",
  });
  const onSelectShelf = (id: string | undefined) =>
    void navigate({ search: (prev) => ({ ...prev, shelf: id }), replace: true });

  const onSelectSection = (next: ResearchSection) =>
    void navigate({
      search: (prev) => ({ ...prev, section: next === "board" ? undefined : next }),
      replace: true,
    });

  const sectionRail =
    section === "board" ? (
      board.rail
    ) : section === "playbooks" ? (
      <PlaybooksRail
        accounts={playbooks.accounts}
        currentId={search.account}
        onSelect={onSelectAccount}
      />
    ) : section === "plays" ? (
      outpost.data ? (
        <OutpostRail
          catalog={outpost.data}
          filter={outpostFilter}
          onToggle={onToggleOutpost}
          onClear={onClearOutpost}
        />
      ) : null
    ) : (
      <ShelfRail
        index={collections.data ?? { collections: [], unshelved: [] }}
        currentId={search.shelf}
        onSelect={onSelectShelf}
      />
    );

  return (
    <PageFrame
      rail={
        <>
          <SectionSwitch sections={SECTIONS} current={section} onSelect={onSelectSection} />
          {sectionRail ? (
            <>
              <hr />
              {sectionRail}
            </>
          ) : null}
        </>
      }
    >
      {section === "board" ? (
        board.body
      ) : section === "playbooks" ? (
        <PlaybooksSection
          store={playbooks.store}
          accountId={search.account}
          accountName={playbooks.accounts.find((a) => a.id === search.account)?.name}
        />
      ) : section === "plays" ? (
        <PlaysSection outpost={outpost} filter={outpostFilter} onToggle={onToggleOutpost} />
      ) : (
        <CollectionsSection
          collections={collections}
          shelfId={search.shelf}
          onSelectShelf={(id) => onSelectShelf(id)}
        />
      )}
    </PageFrame>
  );
}

const facet = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 && value.length <= 40 ? value : undefined;

export const Route = createFileRoute("/research")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.q === "string" && search.q.length > 0 && search.q.length <= 100
      ? { q: search.q }
      : {}),
    ...(typeof search.section === "string" && SECTIONS.some((s) => s.id === search.section)
      ? { section: search.section as ResearchSection }
      : {}),
    ...(facet(search.author) ? { author: facet(search.author) } : {}),
    ...(facet(search.symbol) ? { symbol: facet(search.symbol) } : {}),
    ...(facet(search.trigger) ? { trigger: facet(search.trigger) } : {}),
    ...(facet(search.trait) ? { trait: facet(search.trait) } : {}),
    ...(facet(search.shelf) ? { shelf: facet(search.shelf) } : {}),
    ...(facet(search.account) ? { account: facet(search.account) } : {}),
  }),
  component: ResearchPage,
});
