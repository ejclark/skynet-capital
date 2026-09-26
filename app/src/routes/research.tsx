import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { liftHorizonTokens } from "../live/horizon-params";
import { DEFAULT_LENS } from "../live/research";
import { useBoardView } from "../shell/board-section";
import { PageFrame } from "../shell/frame";
import { PlaybooksSection, SubscribeAs, usePlaybooksSection } from "../shell/playbooks-section";
import { SectionSwitch } from "../shell/section-switch";
import { type PageSection, resolveSection } from "../shell/sections";

/**
 * RESEARCH (#738 phase 6c; filters-first + rail-controls per Eric's live reviews) — the shelf in
 * the shell. The rail left the frame (#3807 slice 2a): the section switch is the controls row at
 * the top of the stage, and the Board's calendar is the band head that leads it. The "Board" section (`board-section.tsx`) is the original single-page
 * Research: an event-horizon calendar pins a day into one query model, a text/symbol filter narrows
 * calls/ledgers/studies together. See that file's own doc comment for the lens/range design.
 *
 * SECTIONS (#3333 slice 9; #3623): the same `SectionSwitch`/`sections.ts` mechanism
 * `accounts.tsx`/`activity.tsx`/`settings.tsx`/`trade.tsx` already use, URL-stateful via
 * `?section=`. "Playbooks" (`playbooks-section.tsx`) is the catalog plus subscribe. Each section
 * keeps its own controls in its own head (the market calendar for Board, the "Subscribe as" account
 * row for Playbooks) — the section switch leads the stage, per the frame's "higher dimensions
 * steer lower ones" rule. This file stays thin
 * route glue; each section's own markup, queries, and helpers live in its own `shell/*.tsx` file
 * (the arch fitness gate's cap forced the split).
 *
 * THE RANGE IS ROOT URL STATE (#3807 slice 2·1): the calendar's anchor and lens ride `?on=&span=`
 * on the root route (`live/horizon-params.ts`), not `?q=`, so the week picked here is the week the
 * Profile page's head shows. One model, two carriers: an `on:` or `lens:` typed into the filter
 * box is lifted out of `q` into those params below.
 */

type ResearchSection = "board" | "playbooks";

/*
 * R&D (#3623, Eric 2026-09-23: "rename this to R & D") — "Playbooks" is the one home for house
 * playbooks, moved here from each account's desk (`playbooks-section.tsx`). The Plays section is
 * retired (its evidence line, window, exposure and traits now ride on the Playbooks cards), and so
 * is Collections (its ideas are banked in `docs/PATTERNS.md` → discovery); an old `?section=plays`
 * or `?section=collections` link lands on Playbooks.
 */
const SECTIONS: readonly PageSection<ResearchSection>[] = [
  { id: "board", label: "Board" },
  { id: "playbooks", label: "Playbooks" },
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

  // ONE MODEL, TWO CARRIERS (#3807 slice 2·1): an `on:` / `lens:` token typed into the box is
  // lifted out of `?q=` into the root range params the calendar head reads, so a typed token and
  // a tap on the head land on the same URL — and an older `?q=lens:month` link lifts on arrival.
  // Keyed on the debounced `q`, never the keystroke, so a half-typed token is left alone.
  useEffect(() => {
    const lifted = liftHorizonTokens(search.q ?? "");
    if (lifted.on === undefined && lifted.lens === undefined) return;
    setQuery(lifted.rest);
    void navigate({
      search: (prev) => ({
        ...prev,
        q: lifted.rest === "" ? undefined : lifted.rest,
        ...(lifted.on ? { on: lifted.on } : {}),
        ...(lifted.lens ? { span: lifted.lens === DEFAULT_LENS ? undefined : lifted.lens } : {}),
      }),
      replace: true,
    });
  }, [search.q, navigate]);

  const board = useBoardView({ active: section === "board", query, setFilter });

  const playbooks = usePlaybooksSection(section === "playbooks", search.account);
  const onSelectAccount = (id: string | undefined) =>
    void navigate({ search: (prev) => ({ ...prev, account: id }), replace: true });

  const onSelectSection = (next: ResearchSection) =>
    void navigate({
      search: (prev) => ({ ...prev, section: next === "board" ? undefined : next }),
      replace: true,
    });

  // THE RAIL LEFT THE FRAME (#3807 slice 2a): the section switch is the controls row at the top of
  // the stage; the Board's calendar is the band head that leads its content (`board.band`), and
  // "Subscribe as" sits in the Playbooks section's own head.
  return (
    <PageFrame
      controls={<SectionSwitch sections={SECTIONS} current={section} onSelect={onSelectSection} />}
    >
      {section === "board" ? (
        <>
          {board.band}
          {board.body}
        </>
      ) : section === "playbooks" ? (
        <PlaybooksSection
          store={playbooks.store}
          accountId={search.account}
          accountName={playbooks.accounts.find((a) => a.id === search.account)?.name}
          subscribeAs={
            <SubscribeAs
              accounts={playbooks.accounts}
              currentId={search.account}
              onSelect={onSelectAccount}
            />
          }
        />
      ) : null}
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
    // The retired Plays and Collections sections' links (bookmarks, old considerations chips) land on Playbooks.
    ...(search.section === "plays" || search.section === "collections"
      ? { section: "playbooks" as ResearchSection }
      : typeof search.section === "string" && SECTIONS.some((s) => s.id === search.section)
        ? { section: search.section as ResearchSection }
        : {}),
    ...(facet(search.account) ? { account: facet(search.account) } : {}),
  }),
  component: ResearchPage,
});
