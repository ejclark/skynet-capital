import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { editionEventKey } from "../../../src/domain/edition-keys";
import { parseBoardMetric } from "../live/board";
import { asOfLine, type Edition, type EditionView, fetchEdition, staleLine } from "../live/edition";
import { type PageKeys, usePublishPageKeys } from "../live/page-keys";
import { useLandOnEdition } from "../shell/edition-anchor";
import { EditionCalendar } from "../shell/edition-calendar";
import { PageFrame } from "../shell/frame";
import { AskBox, StoryAsk } from "../shell/landing-ask";
import { SectorOverview } from "../shell/sector-overview";

/**
 * THE LANDING PAGE (#7077, parent #6948 slice 4): sign-in opens the day's market news, not the
 * Leaderboard. Eric, #7018 round 0: "I don't care for the leaderboard as the landing page." The
 * Leaderboard keeps its route and leaves the tab bar; Profile's league card ("Full leaderboard ›")
 * is its door now.
 *
 * At 390, in order (docs/IA.md §5.9): the whole market, all 11 sectors and the S&P 500, each with
 * its 20-day range mark (`shell/sector-overview.tsx`, round 3's AT1–AT3, AT8) · the question box,
 * one line under it (AT9: an entry point leads with its overview) · the calendar: the week's stories
 * one line each, then each coming trading day's events, under week headers that name closures
 * (`shell/edition-calendar.tsx`, AT4–AT5b). A story opens on a
 * tap to its reports, what moved, the rest and its asks (slice 2, `shell/landing-ask.tsx`). Round 3
 * replaced slice 1's story cards (#7018: "the sections in the screenshot need heavily condense").
 * The quests' slot comes with slice 3 (#7028), under their one-line stories, never as a placeholder.
 *
 * Moneypenny points into this page by key (#7167): the page publishes the stories and events it
 * shows with every chat question (`live/page-keys.ts`), and her `/#story-<id>` and `/#event-<key>`
 * links land on those rows (`shell/edition-anchor.ts`).
 *
 * An old bookmark or a shared compare link (`/?by=`, `?a=`, `?b=`) was always a member asking for
 * the board, so it still goes there with its query intact (#2321's promise).
 */

const asId = (raw: unknown): string | undefined =>
  typeof raw === "string" && raw.length > 0 && raw.length <= 100 ? raw : undefined;

type BoardAsk = {
  readonly by?: ReturnType<typeof parseBoardMetric>;
  readonly a?: string;
  readonly b?: string;
};

function Masthead({ view }: { readonly view: EditionView }): ReactElement {
  const edition = view.edition;
  return (
    <header className="page-header edition-head">
      <p className="edition-kicker">
        <span className="edition-name">Skynet Chronicles</span> · the market news
      </p>
      {edition ? (
        <p className="edition-asof">
          {asOfLine(edition)}
          {edition.campaignTitle ? ` · ${edition.campaignTitle}` : ""}
        </p>
      ) : null}
      {edition && staleLine(edition) ? <p className="edition-stale">{staleLine(edition)}</p> : null}
    </header>
  );
}

/** What this page shows, by key (#7167 slice 1): every story, and every event on the calendar. */
function editionKeys(edition: Edition | null | undefined): PageKeys | undefined {
  if (!edition) return undefined;
  return {
    edition: edition.date,
    stories: edition.stories.map((s) => s.id),
    events: edition.next.map(editionEventKey),
  };
}

function Landing(): ReactElement {
  const view = useQuery({ queryKey: ["edition"], queryFn: fetchEdition, staleTime: 60_000 });
  const keys = editionKeys(view.data?.edition);
  // The chat sends these with a question asked from here, and her links land on the same rows.
  usePublishPageKeys(keys);
  useLandOnEdition(keys ? `${keys.edition}:${keys.stories.length}:${keys.events.length}` : "");
  if (view.isPending)
    return (
      <PageFrame>
        <p className="note">Reading today's news…</p>
      </PageFrame>
    );
  if (view.isError)
    return (
      <PageFrame>
        <p className="note">The news didn't load. Try again in a moment.</p>
      </PageFrame>
    );
  const edition = view.data.edition;
  return (
    <PageFrame>
      <Masthead view={view.data} />
      {edition?.sectors ? <SectorOverview view={edition.sectors} /> : null}
      <AskBox />
      {edition ? (
        <>
          <EditionCalendar
            edition={edition}
            today={view.data.today}
            storyAsk={(s) => (
              <StoryAsk
                story={s}
                campaign={edition.campaign}
                campaignTitle={edition.campaignTitle}
              />
            )}
          />
          <footer className="obs-foot">{edition.writtenBy}</footer>
        </>
      ) : (
        <p className="note">No edition has been written yet.</p>
      )}
    </PageFrame>
  );
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): BoardAsk => ({
    ...(search.by !== undefined ? { by: parseBoardMetric(search.by) } : {}),
    ...(asId(search.a) ? { a: asId(search.a) } : {}),
    ...(asId(search.b) ? { b: asId(search.b) } : {}),
  }),
  beforeLoad: ({ search }) => {
    if (search.by === undefined && search.a === undefined && search.b === undefined) return;
    throw redirect({ to: "/leaderboard", search: { ...search, by: search.by ?? "equity" } });
  },
  component: Landing,
});
