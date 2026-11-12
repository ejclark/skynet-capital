import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { editionEventKey, eventAnchor } from "../../../src/domain/edition-keys";
import { type BoardSnapshot, fetchBoard } from "../live/board";
import { dayLabel } from "../live/book-events";
import { type EditionView, fetchEdition, waitingOn } from "../live/edition";
import { moveFigure } from "../live/edition-sectors";
import {
  questAnchor,
  sectorAnchor,
  TOUR_END,
  TOUR_WINDOWS,
  type TourFacts,
  tourStop,
  VISIT_STOPPED,
  type VisitStep,
  visitAfter,
} from "../live/first-visit";
import { parseWindow } from "../live/mission";
import { useMoneypenny } from "../live/moneypenny";
import { fetchQuests, placeQuests, type QuestsAnswer } from "../live/quests";
import { DEFAULT_LENS } from "../live/research";
import { requestLight } from "./eye-light";
import { calendarShows } from "./landing-calendar";
import { partyRows } from "./mission-windows";

/**
 * PLAYING A FIRST-VISIT STEP (#7487 slice 7; `live/first-visit.ts` is the pure half). A tour stop
 * opens its window on Mission Control (`/?w=<window>`, so Back retraces the tour), asks the Eye to
 * light its one row with the reason in words (`eye-light.ts` → `requestLight`), and has Moneypenny
 * say what the window is for — in that order, so her line lands as the window does.
 *
 * The figures her line reads are the page's own: the same queries the landing page draws from
 * (`["edition"]`, `["quests"]`, `["board", "realized"]`), read from the cache when the page already
 * has them and fetched once when it does not (a tour step tapped from another page). A read that
 * fails leaves its fact out, and the stop says so in words instead of inventing one.
 */

const read = <T>(client: QueryClient, queryKey: readonly unknown[], queryFn: () => Promise<T>) =>
  client
    .ensureQueryData({ queryKey, queryFn, staleTime: 60_000 })
    .catch((): undefined => undefined);

/** The facts a tour stop reads, from the landing page's own answers. Pure, for the spec. */
export function tourFacts(
  view: EditionView | undefined,
  quests: QuestsAnswer | null | undefined,
  board: BoardSnapshot | undefined,
  connected: boolean,
): TourFacts {
  const edition = view?.edition ?? null;
  const sectors = [...(edition?.sectors?.rows ?? [])]
    .filter((r) => !r.market)
    .sort((a, b) => b.moves.week - a.moves.week);
  const lead = sectors[0];
  // The calendar's default range (the week around today, no pin), as the tour's link opens it.
  const inside =
    edition && view
      ? calendarShows(edition, view.today, {
          lens: DEFAULT_LENS,
          pinned: false,
          anchor: view.today,
        }).inside
      : [];
  const stories = edition?.stories ?? [];
  const waited = inside.find((e) => waitingOn(e, stories).length > 0);
  const event = waited ?? inside[0];
  const answer = quests?.available ? quests : undefined;
  const best = answer ? placeQuests(answer.quests, stories).account[0] : undefined;
  const party = board ? partyRows(board.rows) : undefined;
  return {
    ...(lead
      ? {
          lead: {
            name: lead.name,
            anchor: sectorAnchor(lead.fund),
            figure: moveFigure(lead.moves.week),
          },
          sectorCount: sectors.length,
        }
      : {}),
    ...(event
      ? {
          event: {
            what: event.what,
            day: dayLabel(event.date),
            anchor: eventAnchor(editionEventKey(event)),
            waited: event === waited,
          },
        }
      : {}),
    connected: connected || answer !== undefined,
    ...(best ? { quest: { label: best.move.label, anchor: questAnchor(best.id) } } : {}),
    ...(party ? { members: party.members.length } : {}),
    tower: (party?.against.length ?? 0) > 0,
  };
}

/** Run a first-visit move: the dock's `run` hands every `visit` move here. */
export function useRunVisit(): (to: VisitStep) => Promise<void> {
  const client = useQueryClient();
  const router = useRouter();
  return async (to) => {
    const mp = useMoneypenny.getState();
    if (mp.typing || mp.streaming || mp.pending !== undefined) return;
    if (to.kind === "goal") return mp.askGoal();
    if (to.kind === "stop") return mp.stepVisit(undefined, VISIT_STOPPED);
    if (to.kind === "end") return mp.stepVisit(visitAfter(to), TOUR_END);
    const window = to.kind === "first" ? "quests" : TOUR_WINDOWS[to.step];
    if (!window) return;
    const [view, quests, board] = await Promise.all([
      read(client, ["edition"], fetchEdition),
      read(client, ["quests"], fetchQuests),
      read(client, ["board", "realized"], () => fetchBoard("realized")),
    ]);
    const stop = tourStop(window, tourFacts(view, quests, board, mp.connected === true));
    void router.navigate({ to: "/", search: { w: parseWindow(stop.window) } });
    if (stop.anchor) requestLight(`/#${stop.anchor}`, stop.reason);
    await useMoneypenny.getState().stepVisit(visitAfter(to), stop.line);
  };
}
