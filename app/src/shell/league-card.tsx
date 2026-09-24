import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactElement, useEffect, useState } from "react";
import type { BoardMetric } from "../live/board";
import { boardQueryOptions, connectBoardChannel } from "../live/channel";
import { type LeagueLine, readLeague } from "./league-data";

/**
 * THE LEAGUE CARD (#3689 slice 4, design handoff 3a): where you stand, without leaving Accounts.
 * The top five, then any entries you own below them, each owned row highlighted. A member can own
 * several entries, so bots you own also carry an outlined YOURS mark. Under the ladder, one
 * sentence: how far you are from the entry just above you.
 *
 * It reads the same board snapshot and live channel as /leaderboard, with the same metrics under
 * the same names ("Equity", "Return %"). The design's "1M return" league needs a per-participant
 * 1-month metric the board doesn't compute yet; that's a later slice, not a relabel.
 */

const METRICS: ReadonlyArray<{ key: BoardMetric; label: string }> = [
  { key: "equity", label: "Equity" },
  { key: "return", label: "Return %" },
];

function Line({ line, me }: { readonly line: LeagueLine; readonly me?: string }): ReactElement {
  const { row, owned, rank } = line;
  const isMe = row.key === me;
  return (
    <li className={owned ? "league-row is-owned" : "league-row"}>
      <span className="league-rank num">{rank}</span>
      <span className="league-name">
        {row.name}{" "}
        {isMe ? (
          <span className="chip chip-you">you</span>
        ) : (
          <span className={`chip chip-${row.kind}`}>{row.kind === "bot" ? "Bot" : "Human"}</span>
        )}
        {owned && !isMe ? <span className="league-yours">Yours</span> : null}
      </span>
      <span className={`league-value num tone-${row.tone}`}>{row.value}</span>
    </li>
  );
}

export function LeagueCard({
  ownedIds,
  meId,
}: {
  readonly ownedIds: readonly string[];
  /** The viewer's own (human) entry, when they have one — the "you" row and the gap's subject. */
  readonly meId?: string;
}): ReactElement | null {
  const [metric, setMetric] = useState<BoardMetric>("equity");
  const queryClient = useQueryClient();
  const board = useQuery(boardQueryOptions(metric));
  useEffect(() => connectBoardChannel(queryClient, metric), [queryClient, metric]);

  if (!board.data || board.data.rows.length === 0) return null;
  const league = readLeague(board.data.rows, ownedIds, metric, 5, meId);
  const gap = league.gap;

  return (
    <section className="league-card" aria-label="League">
      <header className="league-head">
        <span className="league-eyebrow">League</span>
        <fieldset className="league-toggle">
          <legend className="visually-hidden">Rank by</legend>
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              aria-pressed={m.key === metric}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </fieldset>
      </header>
      <ol className="league-list">
        {league.top.map((l) => (
          <Line key={l.row.key} line={l} me={meId} />
        ))}
        {league.below.length > 0 ? (
          <li className="league-more" aria-hidden="true">
            ⋯
          </li>
        ) : null}
        {league.below.map((l) => (
          <Line key={l.row.key} line={l} me={meId} />
        ))}
      </ol>
      <p className="league-foot">
        {gap?.leading ? (
          <>You lead the league ✦</>
        ) : gap ? (
          <>
            You're <b className="num">{gap.amount}</b> behind {gap.aheadName}
            {gap.aheadOwned ? ", your own bot" : ""}.
          </>
        ) : null}{" "}
        <Link to="/leaderboard" search={{ by: metric }} className="league-link">
          Full leaderboard ›
        </Link>
      </p>
    </section>
  );
}
