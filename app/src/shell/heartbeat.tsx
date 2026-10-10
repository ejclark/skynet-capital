import { useQuery } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { botPlaybooks, playbooksCount } from "../live/bot-playbooks";
import { fetchDeskHeartbeat, heartbeatLine } from "../live/heartbeat";

/**
 * THE BOT'S HEAD LINE (#5073 — #5037 round 2, Eric's pick R2). Was the heartbeat chip (#3687
 * slice 3, shapes A + B) whose popover drew the verdict table a second time. Round 2 merged that
 * table into the Playbooks section's cards, so the chip retires into one plain line on every
 * section: the bot's state in a glyph and a word, then a link to its playbooks —
 * "● Running · 7 playbooks ›". The detail ("last check 20s ago", what each one concluded) lives
 * in the section the link opens; Eric's 2c5fc033 note on the old chip: "'beating · last pass 20s
 * ago' – no idea what this information is".
 *
 * Both the line and the section read one query, refreshed at the replication poll's own 30s
 * rhythm (a faster refetch can't see newer passes than the bots process has sent).
 */

const REFRESH_MS = 30_000;

export function useHeartbeat(deskId: string) {
  return useQuery({
    queryKey: ["desk-heartbeat", deskId],
    queryFn: () => fetchDeskHeartbeat(deskId),
    refetchInterval: REFRESH_MS,
  });
}

/** Renders nothing until there is something true to say. `renderLink` wraps the "7 playbooks ›"
 *  words in whatever opens the section on this page — the Profile page's section switch, or the
 *  any-account page's route. `showPlaybooks` false (a bot the viewer does not own, #885) still
 *  counts the verdicts: how many there are was never withheld, only which. */
export function PlaybooksHeadLine({
  deskId,
  showPlaybooks = true,
  renderLink,
}: {
  readonly deskId: string;
  readonly showPlaybooks?: boolean;
  readonly renderLink: (label: ReactNode) => ReactNode;
}): ReactElement | null {
  const query = useHeartbeat(deskId);
  if (!query.data?.available) return null;
  const { heartbeat } = query.data;
  const { glyph, word } = heartbeatLine(heartbeat);
  const count = botPlaybooks(heartbeat, showPlaybooks).cards.length;
  // Never "0 playbooks", and never the bare word the section switch already says: none on is said
  // as such when the roll call shows it, and an unknown count stays unclaimed.
  const label =
    count > 0
      ? playbooksCount(count)
      : showPlaybooks && heartbeat.rollCall
        ? "no playbooks on"
        : "its playbooks";
  return (
    <p className="hb-line" data-state={heartbeat.state}>
      <span className="hb-line-state">
        <span aria-hidden="true">{glyph}</span> <b>{word}</b>
        {heartbeat.halted ? " · halted" : ""}
      </span>
      <span aria-hidden="true"> · </span>
      {renderLink(
        <>
          {label}
          <span aria-hidden="true"> ›</span>
        </>,
      )}
    </p>
  );
}
