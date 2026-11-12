import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactElement, useEffect } from "react";
import {
  editionEventKey,
  eventAnchor,
  PIVOT_PARAM,
  parsePivot,
  storyAnchor,
} from "../../../src/domain/edition-keys";
import { parseBoardMetric } from "../live/board";
import {
  asOfLine,
  type Edition,
  type EditionDate,
  fetchEdition,
  staleLine,
  waitingOn,
} from "../live/edition";
import { sinceLine } from "../live/edition-sectors";
import { useHorizonRange } from "../live/horizon-params";
import { DEFAULT_WINDOW, type MissionWindow, parseWindow } from "../live/mission";
import { type PageKeys, usePublishPageKeys } from "../live/page-keys";
import { signedMoney } from "../live/position-act";
import { fetchQuests, placeQuests, type QuestsAnswer } from "../live/quests";
import { targetedEditionAnchor, useLandOnEdition } from "../shell/edition-anchor";
import { PageFrame } from "../shell/frame";
import { AskBox, EventThread, StoryAsk } from "../shell/landing-ask";
import { calendarShows, LandingCalendar } from "../shell/landing-calendar";
import { AccountQuests, StoryQuests } from "../shell/landing-quests";
import {
  MissionRow,
  MissionWindowFrame,
  Trail,
  useOpenWindow,
  useSlideSide,
  Waypoints,
  type WindowLink,
} from "../shell/mission-window";
import {
  marketGlance,
  OverviewWindow,
  PartyWindow,
  partyRows,
  useParty,
} from "../shell/mission-windows";
import { SectorOverview } from "../shell/sector-overview";
import { TagMark } from "../shell/tag-mark";

/**
 * CAMPAIGN MISSION CONTROL (#7487 slice 1, the Claude Design handoff of 2026-11-11): the landing
 * page is now ONE WINDOW AT A TIME — Overview, Market, Calendar, Quests, Party — with the trail of
 * windows reached this session above it and the waypoints beside it from the tablet width
 * (`shell/mission-window.tsx`, `live/mission.ts`). The open window is `?w=`; Overview is the
 * default; a `#event-`/`#story-` link or a `?show=` pivot opens the Calendar. Market, Calendar and
 * Quests are the components below, unchanged inside the window; Overview and Party are new
 * (`shell/mission-windows.tsx`). The ask box leads Overview until the dock replaces it (slice 2).
 * What follows is the page's history; its parts still hold inside their windows.
 *
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
 * Moneypenny points into this page by key (#7167): the page publishes the stories and events it
 * shows with every chat question (`live/page-keys.ts`), and her `/#story-<id>` and `/#event-<key>`
 * links land on those rows (`shell/edition-anchor.ts`). When she links two or more, the member can
 * pivot the calendar to just those rows (slice 3, #7018 round 4 B): `?show=` names them, so the
 * pivot is a page address, Back retraces it, and the calendar's ✕ drops it.
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
  /** The rows a pivot names, comma-joined (`parsePivot`); never part of the board's redirect. */
  readonly show?: string;
  /** The window on the stage (#7487); absent = Overview, or the Calendar when the address points into it. */
  readonly w?: MissionWindow;
};

/** A `?show=` value, cleaned to the row anchors it names, or undefined when it names none. */
const asPivot = (raw: unknown): string | undefined => {
  const rows = parsePivot(raw);
  return rows.length > 0 ? rows.join(",") : undefined;
};

/** Each window's header and the windows it links to (the handoff's table, with real figures). */
function windowSpec(
  cur: MissionWindow,
  ctx: {
    readonly edition: Edition | null;
    readonly inside: readonly EditionDate[];
    readonly figures: Partial<Record<MissionWindow, string>>;
    readonly hasAccount: boolean;
  },
): { title: string; sub: string; figure?: string; links: readonly WindowLink[] } {
  const { edition, figures } = ctx;
  const fig = (w: MissionWindow) => (figures[w] ? { figure: figures[w] } : {});
  switch (cur) {
    case "market":
      return {
        title: "The whole market",
        // The header's figure is the week's move, so the sub line names that period and its base.
        sub: edition?.sectors
          ? `Week · ${sinceLine(edition.sectors, "week")}`
          : "The S&P 500 and its 11 sectors",
        ...fig("market"),
        links: [{ label: "Calendar: the dates that move these", to: "calendar" }],
      };
    case "calendar":
      return {
        title: "The calendar",
        sub: edition
          ? `Company results and reports · ${asOfLine(edition)}`
          : "Company results and reports",
        ...fig("calendar"),
        links: [
          { label: "Market: the sectors", to: "market" },
          { label: "Quests: moves from these stories", to: "quests" },
        ],
      };
    case "quests":
      return {
        title: "Quests",
        sub: ctx.hasAccount
          ? "Your next steps, at your pace"
          : "Your next steps, once you're connected",
        ...fig("quests"),
        links: [
          { label: "Calendar: the stories behind them", to: "calendar" },
          { label: "Party: what you book adds up", to: "party" },
        ],
      };
    case "party":
      return {
        title: "The party",
        sub: "Season 1 · out-trade The Tower together",
        ...fig("party"),
        links: [{ label: "Quests: how you add to it", to: "quests" }],
      };
    default:
      return {
        title: "Where things stand",
        sub: "Your next step, and the rest at a glance",
        links: [
          { label: "Market", to: "market" },
          { label: "Calendar", to: "calendar" },
          { label: "Quests", to: "quests" },
          { label: "Party", to: "party" },
        ],
      };
  }
}

/**
 * What this page shows, by key (#7167 slice 1): every story, and the events in the calendar's
 * selected range. The range selector (#7220) filters `edition.next`, so an event outside it has no
 * row to land on; publishing it would let Moneypenny link a row that isn't there. Stepping the range
 * republishes. Her "N more on the calendar" still lands on the section. A pivot (slice 3) shows only
 * the rows it names, so only those are on screen until ✕ or Back brings the rest back.
 */
function editionKeys(
  edition: Edition | null | undefined,
  today: string | undefined,
  horizon: ReturnType<typeof useHorizonRange>,
  pivot: readonly string[],
): PageKeys | undefined {
  if (!(edition && today)) return undefined;
  const shows = calendarShows(edition, today, horizon, pivot);
  return {
    edition: edition.date,
    stories: shows.stories.map((s) => s.id),
    events: shows.inside.map(editionEventKey),
  };
}

/** The window a page address opens: `?w=` when it names one, the Calendar when the address points
 *  into it (Moneypenny's `#event-`/`#story-` links, a `?show=` pivot), else Overview. */
function openWindow(
  w: MissionWindow | undefined,
  pivot: readonly string[],
  hash: string,
): MissionWindow {
  if (w) return w;
  if (pivot.length > 0 || targetedEditionAnchor(hash)) return "calendar";
  return DEFAULT_WINDOW;
}

/** What the window body needs from the page: the edition, the member's quests and the pivot. */
type WindowBodyProps = {
  readonly cur: MissionWindow;
  readonly edition: Edition | null;
  readonly today: string;
  readonly inside: readonly EditionDate[];
  readonly waited: number;
  /** The member's quests answer, only when it is available (no account = undefined). */
  readonly answer: Extract<QuestsAnswer, { available: true }> | undefined;
  readonly placed: ReturnType<typeof placeQuests>;
  readonly pivot: readonly string[];
  readonly open: ReturnType<typeof useOpenWindow>;
  readonly onClearPivot: () => void;
  readonly onConnect: () => void;
};

/** The Calendar window's body: R&D's calendar with each story's asks and quests, or a note when no
 *  edition has been written yet. */
function CalendarBody({
  edition,
  today,
  placed,
  pivot,
  onClearPivot,
}: Pick<WindowBodyProps, "edition" | "today" | "placed" | "pivot" | "onClearPivot">): ReactElement {
  if (!edition) return <p className="note">No edition has been written yet.</p>;
  return (
    <LandingCalendar
      edition={edition}
      today={today}
      storyAsk={(s) => (
        <>
          <TagMark tag={{ label: `Calendar · ${s.line}`, key: storyAnchor(s.id) }} size="inline" />
          <StoryAsk story={s} campaign={edition.campaign} campaignTitle={edition.campaignTitle} />
          <StoryQuests quests={placed.byStory.get(s.id)} />
        </>
      )}
      eventAsk={(e) => (
        <>
          <TagMark
            tag={{ label: `Calendar · ${e.what}`, key: eventAnchor(editionEventKey(e)) }}
            size="inline"
          />
          <EventThread event={e} />
        </>
      )}
      pivot={pivot}
      onClearPivot={onClearPivot}
    />
  );
}

/** The Quests window's body: the member's own quests, or the one step that gets them (connect a
 *  paper account) for a viewer with no account. */
function QuestsBody({
  answer,
  placed,
  onConnect,
}: Pick<WindowBodyProps, "answer" | "placed" | "onConnect">): ReactElement {
  if (answer) return <AccountQuests quests={placed.account} unread={answer.unread} />;
  return (
    <ul className="mctl-rows">
      <MissionRow
        mark="◆"
        title="Connect your paper account"
        sub="Your quests are read from your own positions and cash · play money only"
        tag="step 1"
        onOpen={onConnect}
      />
    </ul>
  );
}

/** The open window's body (#7487): Overview leads with the ask box, Market/Calendar/Quests reuse
 *  their landing components unchanged, Party is new. */
function WindowBody(props: WindowBodyProps): ReactElement | null {
  const { cur, edition, answer, placed } = props;
  switch (cur) {
    case "overview":
      return (
        <>
          <AskBox />
          <OverviewWindow
            edition={edition}
            inside={props.inside}
            waited={props.waited}
            quests={answer ? placed.account : undefined}
            open={props.open}
          />
        </>
      );
    case "market":
      return edition?.sectors ? (
        <SectorOverview view={edition.sectors} />
      ) : (
        <p className="note">This edition carries no market closes.</p>
      );
    case "calendar":
      return <CalendarBody {...props} />;
    case "quests":
      return <QuestsBody {...props} />;
    case "party":
      return <PartyWindow />;
    default:
      return null;
  }
}

function Landing(): ReactElement {
  const view = useQuery({ queryKey: ["edition"], queryFn: fetchEdition, staleTime: 60_000 });
  // The member's quests load beside the news and never hold it up; one that fails shows nothing.
  // A read can cost ~30 broker calls per held name (the guidance read), so focus never refetches.
  const quests = useQuery({
    queryKey: ["quests"],
    queryFn: fetchQuests,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const party = useParty();
  const horizon = useHorizonRange();
  const search = Route.useSearch();
  const pivot = parsePivot(search.show);
  const hash = useRouterState({ select: (s) => s.location.hash });
  const cur = openWindow(search.w, pivot, hash);
  const open = useOpenWindow(cur);
  const side = useSlideSide(cur);
  const navigate = useNavigate();
  // ✕ on the pivot's bar: one more history entry, so Back still returns to the pivot, and the
  // page keeps its scroll, so the member stays on the calendar as the rest of it comes back.
  const clearPivot = () =>
    void navigate({
      to: "/",
      search: (prev: BoardAsk) => ({
        ...prev,
        [PIVOT_PARAM]: undefined,
        w: prev.w ?? parseWindow(cur),
      }),
      resetScroll: false,
    });
  // A window inferred from the address (a `#event-` link, a `?show=` pivot) is written into it at
  // once, replacing the entry and keeping the hash, so stepping the calendar's range or clearing
  // the pivot — each drops the hash or the pivot — never snaps the member back to Overview.
  const inferred = !search.w && cur !== DEFAULT_WINDOW;
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs only when the inference appears
  useEffect(() => {
    if (!inferred) return;
    void navigate({
      to: "/",
      search: (prev: BoardAsk) => ({ ...prev, w: parseWindow(cur) }),
      hash: true,
      replace: true,
      resetScroll: false,
    });
  }, [inferred]);
  const keys = editionKeys(view.data?.edition, view.data?.today, horizon, pivot);
  // The chat sends these with a question asked from here, and her links land on the same rows. They
  // are published from every window, not only the Calendar's: each is one tap away (a link into the
  // calendar opens its window first, `openWindow`), so her pointing at one is never a dead end.
  usePublishPageKeys(keys);
  useLandOnEdition(keys ? `${cur}:${JSON.stringify(keys)}` : "");
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
  const today = view.data.today;
  const answer = quests.data?.available ? quests.data : undefined;
  const placed = placeQuests(answer?.quests ?? [], edition?.stories ?? []);
  const inside = edition && today ? calendarShows(edition, today, horizon, pivot).inside : [];
  const market = marketGlance(edition?.sectors);
  // ◆ means "a story waits on it" on the calendar itself, so the figure counts only those events.
  const waited = inside.filter((e) => waitingOn(e, edition?.stories ?? []).length > 0).length;
  const total = party.data ? partyRows(party.data.rows).total : undefined;
  const figures: Partial<Record<MissionWindow, string>> = {
    ...(market.figure ? { market: market.figure.replace(" wk", "") } : {}),
    calendar: `◆ ${String(waited)}`,
    ...(answer ? { quests: String(placed.account.length) } : {}),
    ...(total !== undefined ? { party: signedMoney(total) } : {}),
  };
  const spec = windowSpec(cur, { edition, inside, figures, hasAccount: Boolean(answer) });
  return (
    <PageFrame>
      <div className="mctl">
        <Waypoints cur={cur} open={open} figures={figures} linked={spec.links.map((k) => k.to)} />
        <div className="mctl-stage">
          <Trail cur={cur} open={open} />
          {edition && staleLine(edition) ? (
            <p className="edition-stale">{staleLine(edition)}</p>
          ) : null}
          <MissionWindowFrame
            key={cur}
            id={cur}
            side={side}
            title={spec.title}
            sub={spec.sub}
            {...(spec.figure ? { figure: spec.figure } : {})}
            links={spec.links}
            open={open}
          >
            <WindowBody
              cur={cur}
              edition={edition}
              today={today}
              inside={inside}
              waited={waited}
              answer={answer}
              placed={placed}
              pivot={pivot}
              open={open}
              onClearPivot={clearPivot}
              onConnect={() => void navigate({ to: "/accounts" })}
            />
          </MissionWindowFrame>
          {edition ? <footer className="obs-foot">{edition.writtenBy}</footer> : null}
        </div>
      </div>
    </PageFrame>
  );
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): BoardAsk => {
    const show = asPivot(search[PIVOT_PARAM]);
    const w = parseWindow(search.w);
    return {
      ...(w ? { w } : {}),
      ...(search.by !== undefined ? { by: parseBoardMetric(search.by) } : {}),
      ...(asId(search.a) ? { a: asId(search.a) } : {}),
      ...(asId(search.b) ? { b: asId(search.b) } : {}),
      ...(show ? { show } : {}),
    };
  },
  beforeLoad: ({ search }) => {
    if (search.by === undefined && search.a === undefined && search.b === undefined) return;
    // The board's ask goes on; a pivot is the landing page's own and stays behind.
    const { show: _pivot, w: _window, ...ask } = search;
    throw redirect({ to: "/leaderboard", search: { ...ask, by: search.by ?? "equity" } });
  },
  component: Landing,
});
