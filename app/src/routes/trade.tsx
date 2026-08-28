import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { boardQueryOptions } from "../live/channel";
import { PageFrame } from "../shell/frame";
import { TradeGate } from "../shell/trade-gate";

/**
 * THE TRADE TICKET (#738, live-review round) — the dedicated trading workflow surface. The desk
 * links here rather than hosting a ticket inline ("if users want to trade, I'd expect a link to
 * the view that enables a proper trading experience workflow" — Eric). `?desk=` picks the account
 * and is a typed, shareable search param; without one, the boards' desks are offered.
 */

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

function TradePage(): ReactElement {
  const { desk } = Route.useSearch();
  const rail = (
    <>
      <p className="rail-label">Trading</p>
      <span className="rail-current" aria-current="page">
        Share ticket
      </span>
      <a href="/trade">Options ticket</a>
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
          re-checks the live account at submit. Options plays live on the{" "}
          <a href="/trade">full ticket</a> for now.
        </p>
      </header>
      {desk ? <TradeGate deskId={desk} /> : <DeskPicker />}
    </PageFrame>
  );
}

export const Route = createFileRoute("/trade")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.desk === "string" && search.desk.length > 0 && search.desk.length <= 100
      ? { desk: search.desk }
      : {}),
  }),
  component: TradePage,
});
