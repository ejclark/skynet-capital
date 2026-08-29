import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { boardQueryOptions } from "../live/channel";
import { fetchDesk } from "../live/desk";
import { fetchPlays, type PlayInfo } from "../live/options";
import { PageFrame } from "../shell/frame";
import { OptionGate } from "../shell/option-gate";
import { OptionPositionsCard } from "../shell/option-positions";
import { PlayPicker } from "../shell/play-picker";
import { TradeGate } from "../shell/trade-gate";

/**
 * THE TRADE TICKET (#738, live-review round; options since phase 10b) — the dedicated trading
 * workflow surface. `?desk=` picks the account; `?play=` picks the rung from the six-play
 * catalog (101/102 side the share gate, 201+ open the options gate) — both typed, shareable
 * search params, which is also what the learn milestones' "open the ticket" links carry.
 */

const PLAY_CODES = new Set(["101", "102", "201", "202", "301", "302"]);

function DeskPicker(): ReactElement {
  const board = useQuery(boardQueryOptions("equity"));
  return (
    <>
      <p className="note">Pick the desk to trade — the ticket reviews against that account.</p>
      {board.data ? (
        <ul className="trade-desk-list">
          {board.data.rows.map((row) => (
            <li key={row.key}>
              <Link to="/trade" search={{ desk: row.key }}>
                {row.name}
                <span className={`chip chip-${row.kind}`}>
                  {row.kind === "bot" ? "BOT" : "HUMAN"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

function DeskTicket({ desk, code }: { readonly desk: string; readonly code: string }) {
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays });
  const deskData = useQuery({
    queryKey: ["desk", desk],
    queryFn: () => fetchDesk(desk),
  });
  const info: PlayInfo | undefined = plays.data?.plays.find((p) => p.code === code);
  return (
    <>
      {plays.data ? (
        <PlayPicker
          deskId={desk}
          current={code}
          plays={plays.data.plays}
          wheels={plays.data.wheels}
        />
      ) : null}
      {info && info.kind === "option" ? (
        <OptionGate key={info.code} deskId={desk} play={info} />
      ) : (
        <TradeGate key={code} deskId={desk} initialAction={code === "102" ? "sell" : "buy"} />
      )}
      {deskData.data ? (
        <OptionPositionsCard deskId={desk} positions={deskData.data.desk.positions} />
      ) : null}
    </>
  );
}

function TradePage(): ReactElement {
  const { desk, play } = Route.useSearch();
  const rail = (
    <>
      <p className="rail-label">Trading</p>
      <span className="rail-current" aria-current="page">
        The ticket
      </span>
      <hr />
      {desk ? (
        <Link to="/u/$id" params={{ id: desk }}>
          ← Back to the desk
        </Link>
      ) : (
        <Link to="/" search={{ by: "equity" }}>
          ← Standings
        </Link>
      )}
    </>
  );
  return (
    <PageFrame rail={rail}>
      <header className="page-header">
        <h1>Trade</h1>
        <p>
          Paper account · the gate reviews every ticket before anything is sent, and the desk
          re-checks the live account at submit.
        </p>
      </header>
      {desk ? <DeskTicket desk={desk} code={play ?? "101"} /> : <DeskPicker />}
    </PageFrame>
  );
}

export const Route = createFileRoute("/trade")({
  validateSearch: (search: Record<string, unknown>) => {
    // The router JSON-parses search values, so a legacy ?play=201 arrives as a NUMBER — normalize
    // through String before gating against the catalog's codes.
    const play = typeof search.play === "object" ? "" : String(search.play ?? "");
    return {
      ...(typeof search.desk === "string" && search.desk.length > 0 && search.desk.length <= 100
        ? { desk: search.desk }
        : {}),
      ...(PLAY_CODES.has(play) ? { play: play as PlayInfo["code"] } : {}),
    };
  },
  component: TradePage,
});
