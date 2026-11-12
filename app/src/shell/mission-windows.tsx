import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { type BoardRow, fetchBoard, isUnranked } from "../live/board";
import type { Edition, EditionDate } from "../live/edition";
import { moveFigure, type SectorsView } from "../live/edition-sectors";
import { TOWER_ANCHOR } from "../live/first-visit";
import type { MissionWindow } from "../live/mission";
import { useMoneypenny } from "../live/moneypenny";
import { signedMoney } from "../live/position-act";
import type { Quest } from "../live/quests";
import { MissionHead, MissionRow } from "./mission-window";

/**
 * THE TWO NEW WINDOWS (#7487 slice 1): Overview ("where things stand, and your next step") and Party
 * (the members together against The Tower). Market, Calendar and Quests are today's components in
 * the window frame (`routes/index.tsx`); these two had no home before, so they are drawn with the
 * window's own rows (`mission-window.tsx`).
 *
 * Honesty (CLAUDE.md → Domain accuracy): every figure is read from the edition, the member's quests
 * or `/api/board`; a window with nothing to say says so in words, and no row ever reads as a buy or
 * sell signal. The Party is co-op — "no rank between members" (the handoff) — so members list by
 * name, never by score; only The Tower, the party's opponent, stands apart.
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

/** The board key of The Tower, the house bot the party plays against (`src/personas/sauron-hardcore.ts`
 *  carries the franchise name in code; member-facing copy says "The Tower", per the handoff). */
export const TOWER_KEY = "sauron";

/** Humans book for the party; The Tower is who it plays against. Other bots are neither — they are
 *  not members and not the opponent — so the Party window leaves them out on purpose. */
export function partyRows(rows: readonly BoardRow[]): {
  readonly members: readonly BoardRow[];
  readonly against: readonly BoardRow[];
  readonly total: number;
} {
  const members = rows
    .filter((r) => r.kind === "human")
    .sort((a, b) => a.name.localeCompare(b.name));
  const total = members.reduce((sum, r) => sum + (isUnranked(r) ? 0 : r.sortValue), 0);
  const tower = rows.filter((r) => r.kind === "bot" && r.key.toLowerCase() === TOWER_KEY);
  return { members, against: tower.map((r) => ({ ...r, name: "The Tower" })), total };
}

/** The booked P&L board — the party's own total. One read shared by the window and its waypoint. */
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
  // The member's goal leads Quests (#7487 slice 7); its glance here says one is set.
  const goalSet = useMoneypenny((s) => s.goal !== undefined);
  const market = marketGlance(edition?.sectors);
  const next = quests?.[0];
  const split = party.data ? partyRows(party.data.rows) : undefined;
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
          sub={`${
            quests
              ? `${String(quests.length)} for your account, best first`
              : "Yours once a paper account is connected"
          }${goalSet ? " · goal set" : ""}`}
          {...(quests ? { figure: String(quests.length) } : {})}
          onOpen={() => open("quests")}
        />
        <MissionRow
          mark="◉"
          title="The party"
          about={{ label: "Party" }}
          sub={
            split
              ? `${String(split.members.length)} members, together against The Tower`
              : "The members, together against The Tower"
          }
          {...(split ? { figure: signedMoney(split.total) } : {})}
          onOpen={() => open("party")}
        />
      </ul>
    </>
  );
}

export function PartyWindow(): ReactElement {
  const party = useParty();
  if (party.isPending) return <p className="note">Reading the party's books…</p>;
  if (party.isError)
    return <p className="note">The party's books didn't load. Try again in a moment.</p>;
  const { members, against } = partyRows(party.data.rows);
  return (
    <>
      <MissionHead>Booked for the party</MissionHead>
      <ul className="mctl-rows">
        {members.length > 0 ? (
          members.map((r) => (
            <MissionRow
              key={r.key}
              title={r.name}
              sub="member"
              figure={r.value}
              about={{ label: `Party · ${r.name}` }}
            />
          ))
        ) : (
          <MissionRow title="No member has booked a trade yet" />
        )}
      </ul>
      {against.length > 0 ? (
        <>
          <MissionHead>Against</MissionHead>
          <ul className="mctl-rows">
            {against.map((r) => (
              <MissionRow
                key={r.key}
                anchor={TOWER_ANCHOR}
                title={r.name}
                sub="bot"
                figure={r.value}
                about={{ label: `Party · ${r.name}` }}
              />
            ))}
          </ul>
        </>
      ) : null}
      <p className="mctl-note">
        Booked P&amp;L on paper: what members closed out, added together. No member is ranked
        against another; the party plays The Tower.
      </p>
    </>
  );
}
