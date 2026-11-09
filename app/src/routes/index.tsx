import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { parseBoardMetric } from "../live/board";
import { asOfLine, type EditionView, fetchEdition, staleLine } from "../live/edition";
import { fetchQuests, placeQuests } from "../live/quests";
import { PageFrame } from "../shell/frame";
import { AskBox, StoryAsk } from "../shell/landing-ask";
import { LandingCalendar } from "../shell/landing-calendar";
import { AccountQuests, StoryQuests } from "../shell/landing-quests";
import { SectorOverview } from "../shell/sector-overview";

/**
 * THE LANDING PAGE (#7077, parent #6948 slice 4): sign-in opens the day's market news, not the
 * Leaderboard. Eric, #7018 round 0: "I don't care for the leaderboard as the landing page." The
 * Leaderboard keeps its route and leaves the tab bar; Profile's league card ("Full leaderboard ›")
 * is its door now.
 *
 * At 390, in order (docs/IA.md §5.9): the question box and its two canned paths on one row (AT9 as
 * revised on the drawn frame, #7018 round 5: "the search menu, canned input for paths to explore
 * should be listed first") · the whole market, all 11 sectors and the S&P 500, each with its 20-day
 * range mark, every row above the 844px fold (`shell/sector-overview.tsx`, AT1–AT3, AT8, AT12) · the
 * calendar, R&D's own: its ‹ › arrows and Day · Week · Month lens over the week's stories one line
 * each and each coming day's events under week headers that name closures, with R&D's month grid
 * beside them at desktop width (`shell/landing-calendar.tsx`, AT4–AT5b, AT10, AT11). A story opens on a
 * tap to its reports, what moved, the rest and its asks (slice 2, `shell/landing-ask.tsx`). Round 3
 * replaced slice 1's story cards (#7018: "the sections in the screenshot need heavily condense").
 * Quests sit by their source (slice 3, #7028 slice 5, `shell/landing-quests.tsx`): a market quest
 * inside the story it came from, after its asks, and the account's quests in one part after the
 * news. They are the signed-in member's own (`GET /api/quests`); a viewer with no account sees none.
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

function Landing(): ReactElement {
  const view = useQuery({ queryKey: ["edition"], queryFn: fetchEdition, staleTime: 60_000 });
  // The member's quests load beside the news and never hold it up; one that fails shows nothing.
  const quests = useQuery({ queryKey: ["quests"], queryFn: fetchQuests, staleTime: 60_000 });
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
  const answer = quests.data?.available ? quests.data : undefined;
  const placed = placeQuests(answer?.quests ?? [], edition?.stories ?? []);
  return (
    <PageFrame>
      <Masthead view={view.data} />
      <AskBox />
      {edition?.sectors ? <SectorOverview view={edition.sectors} /> : null}
      {edition ? (
        <>
          <LandingCalendar
            edition={edition}
            today={view.data.today}
            storyAsk={(s) => (
              <>
                <StoryAsk
                  story={s}
                  campaign={edition.campaign}
                  campaignTitle={edition.campaignTitle}
                />
                <StoryQuests quests={placed.byStory.get(s.id)} />
              </>
            )}
          />
          {answer ? <AccountQuests quests={placed.account} unread={answer.unread} /> : null}
          <footer className="obs-foot">{edition.writtenBy}</footer>
        </>
      ) : (
        <>
          <p className="note">No edition has been written yet.</p>
          {answer ? <AccountQuests quests={placed.account} unread={answer.unread} /> : null}
        </>
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
