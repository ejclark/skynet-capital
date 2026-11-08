import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { parseBoardMetric } from "../live/board";
import { asOfLine, type EditionView, fetchEdition, staleLine } from "../live/edition";
import { DatedItem, EditionStoryTile } from "../shell/edition-story";
import { PageFrame } from "../shell/frame";

/**
 * THE LANDING PAGE (#7077, parent #6948 slice 4): sign-in opens the day's market news, not the
 * Leaderboard. Eric, #7018 round 0: "I don't care for the leaderboard as the landing page." The
 * Leaderboard keeps its route and leaves the tab bar; Profile's league card ("Full leaderboard ›")
 * is its door now.
 *
 * At 390, in order (#7077 constraints): the ask box (slice 2) · the lead story's key facts · its
 * ask (slice 2) · quests by source (slice 3, #7028) · what's next. This slice builds the news and
 * what's next; the slots for the ask and the quests come with their slices, never as placeholders.
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
      {edition ? (
        <>
          <div className="edition-stories">
            {edition.stories.map((s, i) => (
              <EditionStoryTile key={s.id} story={s} lead={i === 0} />
            ))}
          </div>
          {edition.next.length > 0 ? (
            <section className="edition-next" aria-labelledby="edition-next-title">
              <h2 id="edition-next-title" className="section-title">
                What's next
              </h2>
              <ul className="dated-list">
                {edition.next.map((d) => (
                  <DatedItem key={`${d.date}-${d.what}`} item={d} />
                ))}
              </ul>
            </section>
          ) : null}
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
