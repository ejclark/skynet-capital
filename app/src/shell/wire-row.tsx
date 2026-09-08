import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchWireForSymbol, type WireTrade } from "../live/wire";

/**
 * THE WHO-ELSE-TRADED ROW (#2017 Phase 1 slice 12) — the options ticket's compact intel panel:
 * everyone else in the league who has traded the ticket's underlying, pulled from THE SAME `/api/wire`
 * feed the Activity page reads, scoped server-side to this one symbol BEFORE the feed's own 60-row
 * cap (`wire-data.ts`'s `buildWireTradeRows`, `wire-routes.ts`'s `serveWireJson`) — so an older fill
 * of this exact symbol can't be silently dropped by an unrelated global window.
 *
 * REAL NAMES, ON PURPOSE: per this repo's consent doctrine (`CLAUDE.md` → Product taste & ethos;
 * `docs/LIVING-UNIVERSE.md` → Boundaries & consent; `docs/FOG-OF-WAR.md` criterion 7), in-group
 * fills are visible by the invite-only agreement — a minimum-N gate was explicitly proposed and
 * refused for this exact feature during the #2017 plan's red-team pass, so this never anonymizes
 * or counts-only.
 *
 * SELF-EXCLUSION IS A FRAMING CHOICE, NOT A SERVER RULE: "who ELSE traded" means the viewer's own
 * fills are left out — they're already visible on the viewer's own desk — so that filter runs
 * HERE, client-side, against `deskId`. `/api/wire?symbol=` itself stays unopinionated about the
 * requester's identity; any other caller may legitimately want the unfiltered symbol-scoped list.
 *
 * DISPLAY IS CAPPED, THE FEED ISN'T: the server can return up to 60 matching fills — this is a
 * compact ticket-adjacent row, not a feed, so only the 5 most recent (post-exclusion) render, with
 * a trailing "+N more" note when there's more. No new route; the cap is purely presentational.
 * @category trading
 */

const DISPLAY_CAP = 5;

function WireRowLine({ trade }: { readonly trade: WireTrade }): ReactElement {
  return (
    <li className="wr-row">
      <span className={`wire-side tone-${trade.side === "buy" ? "pos" : "neg"}`}>
        {trade.side.toUpperCase()}
      </span>
      <span className="num wr-qty">{trade.quantity}</span>
      <Link to="/u/$id" params={{ id: trade.whoId }} className="wr-who">
        {trade.who}
      </Link>
      <span className={`chip chip-${trade.kind}`}>{trade.kind === "bot" ? "BOT" : "HUMAN"}</span>
      <span className="wr-when num">{trade.when}</span>
    </li>
  );
}

export function WireRow({
  symbol,
  deskId,
}: {
  readonly symbol: string;
  readonly deskId: string;
}): ReactElement | null {
  const query = useQuery({
    queryKey: ["wire", symbol],
    queryFn: () => fetchWireForSymbol(symbol),
    enabled: symbol !== "",
  });

  if (symbol === "" || !query.data) return null;

  const others = query.data.trades.filter((t) => t.whoId !== deskId);
  const shown = others.slice(0, DISPLAY_CAP);
  const remaining = others.length - shown.length;

  return (
    <section className="wr-panel">
      <h3 className="wr-h">Also trading {symbol}</h3>
      {others.length === 0 ? (
        <p className="tkt-note">No one else has traded {symbol} yet.</p>
      ) : (
        <>
          <ul className="wr-list">
            {shown.map((t) => (
              <WireRowLine key={t.key} trade={t} />
            ))}
          </ul>
          {remaining > 0 ? <p className="wr-more">+{remaining} more</p> : null}
        </>
      )}
    </section>
  );
}
