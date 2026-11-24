import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchBoard } from "../live/board";
import type { Edition, EditionDate } from "../live/edition";
import { moveFigure, type SectorsView } from "../live/edition-sectors";
import type { MissionWindow } from "../live/mission";
import type { Quest } from "../live/quests";
import { MissionHead, MissionRow } from "./mission-window";

/**
 * THE TWO NEW WINDOWS (#7487 slice 1): Overview ("where things stand, and your next step") and Party
 * (the members together against the house bot). Market, Calendar and Quests are today's components in
 * the window frame (`routes/index.tsx`); these two had no home before, so they are drawn with the
 * window's own rows (`mission-window.tsx`).
 *
 * Honesty (CLAUDE.md → Domain accuracy): every figure is read from the edition, the member's quests
 * or `/api/board`; a window with nothing to say says so in words, and no row ever reads as a buy or
 * sell signal. The Party is co-op — "no rank between members" (the handoff) — so members list by
 * name, never by score; only the house bot, the party's opponent, stands apart. Since #8253 it is
 * a view of the server's party block, the Scoreboard's own table: the browser sums nothing.
 */

/** The S&P 500's week, and the sectors that led and trailed it. */
export function marketGlance(view: SectorsView | undefined): {
  readonly figure?: string;
  readonly line: string;
} {
  if (!view) return { line: "The edition carries no market closes today" };
  const market = view.rows.find((r) => r.market);
  const sectors = [...view.rows.filter((r) => !r.market)].sort(
    (a, b) => b.moves.week - a.moves.week,
  );
  const lead = sectors[0];
  const trail = sectors.at(-1);
  return {
    ...(market ? { figure: `${moveFigure(market.moves.week)} wk` } : {}),
    line:
      lead && trail
        ? `Leads: ${lead.name} ${moveFigure(lead.moves.week)} · trails: ${trail.name} ${moveFigure(trail.moves.week)}`
        : "The week's moves by sector",
  };
}

/** The next dated events in the calendar's range, in a line. */
export function calendarGlance(inside: readonly EditionDate[]): string {
  if (inside.length === 0) return "Nothing dated in this range";
  const shown = inside.slice(0, 2).map((e) => e.what);
  const more = inside.length - shown.length;
  return `${shown.join(" · ")}${more > 0 ? ` · ${String(more)} more` : ""}`;
}

/** `/api/board`'s party block (#8253) — the same table the Scoreboard opens on. One read shared by
 *  the window and its waypoint; any metric carries the block, so this keeps its old key. */
export function useParty() {
  return useQuery({
    queryKey: ["board", "realized"],
    queryFn: () => fetchBoard("realized"),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function OverviewWindow({
  edition,
  inside,
  waited,
  quests,
  open,
}: {
  readonly edition: Edition | null;
  readonly inside: readonly EditionDate[];
  /** How many of `inside` a story waits on (◆). */
  readonly waited: number;
  /** The member's quests; undefined when the session owns no account to read. */
  readonly quests: readonly Quest[] | undefined;
  readonly open: (w: MissionWindow) => void;
}): ReactElement {
  const navigate = useNavigate();
  const party = useParty();
  const market = marketGlance(edition?.sectors);
  const next = quests?.[0];
  const table = party.data?.party;
  return (
    <>
      <MissionHead>Your next step</MissionHead>
      <ul className="mctl-rows">
        {next ? (
          <MissionRow
            mark="◆"
            title={next.move.label}
            about={{ label: `Quests · ${next.move.label}` }}
            sub="Your best quest right now · paper only"
            tag="start here"
            onOpen={() => open("quests")}
          />
        ) : quests ? (
          <MissionRow
            mark="◆"
            title="Look over the whole market"
            sub="No quest for this account right now"
            tag="start here"
            onOpen={() => open("market")}
          />
        ) : (
          <MissionRow
            mark="◆"
            title="Connect your paper account"
            sub="Alpaca paper keys · play money only"
            tag="start here"
            onOpen={() => void navigate({ to: "/accounts" })}
          />
        )}
      </ul>
      <MissionHead>At a glance</MissionHead>
      <ul className="mctl-rows">
        <MissionRow
          mark="▦"
          title="The whole market"
          about={{ label: "Market" }}
          sub={market.line}
          {...(market.figure ? { figure: market.figure } : {})}
          onOpen={() => open("market")}
        />
        <MissionRow
          mark="◷"
          title="The calendar"
          about={{ label: "Calendar" }}
          sub={calendarGlance(inside)}
          figure={`◆ ${String(waited)}`}
          onOpen={() => open("calendar")}
        />
        <MissionRow
          mark="◆"
          title="Quests"
          about={{ label: "Quests" }}
          sub={
            quests
              ? `${String(quests.length)} for your account, best first`
              : "Yours once a paper account is connected"
          }
          {...(quests ? { figure: String(quests.length) } : {})}
          onOpen={() => open("quests")}
        />
        <MissionRow
          mark="◉"
          title="The party"
          about={{ label: "Party" }}
          sub={
            table
              ? (table.lead?.line ?? `${table.partyCount}, against the house bot`)
              : "The members, together against the house bot"
          }
          {...(table ? { figure: table.partyReturn } : {})}
          onOpen={() => open("party")}
        />
      </ul>
    </>
  );
}

export function PartyWindow(): ReactElement {
  const party = useParty();
  if (party.isPending) return <p className="note">Reading the party's table…</p>;
  if (party.isError || !party.data.party)
    return <p className="note">The party's table didn't load. Try again in a moment.</p>;
  const table = party.data.party;
  return (
    <>
      <MissionHead>The party</MissionHead>
      <ul className="mctl-rows">
        <MissionRow
          mark={table.lead?.glyph ?? "="}
          title={table.lead?.line ?? table.leadNote ?? "No lead to call yet"}
          sub={table.partyCount}
          figure={table.partyReturn}
          about={{ label: "Party · the party" }}
        />
        <MissionRow
          title="The house bot"
          sub={table.houseNote ?? "its own 1M return"}
          figure={table.houseReturn}
          about={{ label: "Party · the house bot" }}
        />
      </ul>
      <MissionHead>Seated, A to Z</MissionHead>
      <ul className="mctl-rows">
        {table.seats.length > 0 ? (
          table.seats.map((s) => (
            <MissionRow
              key={s.key}
              title={s.name}
              sub={`${s.monthReturnNote ?? "1M return"} · booked ${s.booked}`}
              figure={s.monthReturn}
              about={{ label: `Party · ${s.name}` }}
            />
          ))
        ) : (
          <MissionRow title="No seat taken yet" sub="A first filled paper order takes one" />
        )}
      </ul>
      <p className="mctl-note">
        {table.openLine}. {table.footnote} No member is ranked against another.
      </p>
    </>
  );
}
