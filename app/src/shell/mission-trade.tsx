import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { ReactElement, ReactNode } from "react";
import { fetchDesk } from "../live/desk";
import {
  type CampaignOrderType,
  MAX_SHARES,
  symbolGroups,
  ticketLine,
  tradeSearch,
  useCampaignTicket,
} from "../live/mission-ticket";
import { quoteQuery } from "../live/quote-query";
import { fetchSettings } from "../live/settings";
import { money } from "../live/ticket";
import { watchlistQuery } from "../live/watchlist";
import { MissionRow } from "./mission-window";

/**
 * THE TRADE WINDOW (#7487 slice 6; the handoff's `Campaign Mission Control.dc.html`, its
 * `tradeFields`, and spec § 2 "Trade (workbench)"): a draft paper ticket on Campaign's stage. The
 * tag `PAPER · DRAFT`, three segmented fields (Symbol, a Shares stepper, Market or Limit), "Review
 * order" and the mono summary line. The model and every rule are in `live/mission-ticket.ts`.
 *
 * Nothing is placed from here. "Review order" opens `/trade` with the draft in its address, and the
 * share ticket there (`trade-gate.tsx`) reviews it against the member's paper account, as it
 * reviews any order. The Symbol field has no text box (the dock's box is the page's only one): its
 * names come from the member's held shares, their watchlist and the calendar's dated results, each
 * group saying which. A quote is shown only when the server has one; no price is ever made up.
 *
 * Motion (`/animate`, 2026-11-12): none. The picks and the stepper are form controls changed many
 * times a visit and hold what the member acts on, so they change state at once; the window's own
 * slide is the only movement. Every pressed state is a weight and a ring as well as a tint.
 */

/** One segmented field: a word label over a row of buttons that read as one control. */
function Field({
  label,
  children,
  wide,
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly wide?: boolean;
}): ReactElement {
  return (
    <fieldset className={wide ? "mctl-trade-field mctl-trade-field--wide" : "mctl-trade-field"}>
      <legend className="mctl-trade-label">{label}</legend>
      {children}
    </fieldset>
  );
}

/** The names a member holds as shares on their first paper account (options are not offered). */
function useHeld(): { readonly held: readonly string[]; readonly hasAccount?: boolean } {
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const deskId = settings.data?.accounts[0]?.id;
  const desk = useQuery({
    queryKey: ["desk", deskId],
    queryFn: () => fetchDesk(deskId ?? ""),
    enabled: deskId !== undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const held = (desk.data?.desk.positions ?? []).filter((p) => !p.isOption).map((p) => p.symbol);
  return settings.data ? { held, hasAccount: settings.data.accounts.length > 0 } : { held };
}

/** The last trade the server quotes for the ticket's symbol, or the server's own note on why not. */
function QuoteLine({ symbol }: { readonly symbol: string }): ReactElement | null {
  const quote = useQuery(quoteQuery(symbol));
  if (!quote.data) return null;
  return (
    <p className="mctl-trade-quote">
      {"last" in quote.data
        ? `${symbol} last ${money(quote.data.last)} · the gate prices it again at review`
        : quote.data.quoteNote}
    </p>
  );
}

export function TradeWindow({
  reporting,
}: {
  /** Tickers with results dated on the calendar, soonest first (`reportsDue`). */
  readonly reporting: readonly string[];
}): ReactElement {
  const navigate = useNavigate();
  const ticket = useCampaignTicket((s) => s.ticket);
  const patch = useCampaignTicket((s) => s.patch);
  const { held, hasAccount } = useHeld();
  const watch = useQuery(watchlistQuery);
  const watching = watch.data?.available ? watch.data.watching.map((w) => w.symbol) : [];
  const groups = symbolGroups({
    held,
    watching,
    reporting,
    ...(ticket.symbol ? { current: ticket.symbol } : {}),
  });
  const { symbol } = ticket;
  const review = () => {
    if (!symbol) return;
    void navigate({ to: "/trade", search: tradeSearch({ ...ticket, symbol }) });
  };
  const seg = (on: boolean, label: string, onClick: () => void, key = label): ReactElement => (
    <button key={key} type="button" className="mctl-seg-btn" aria-pressed={on} onClick={onClick}>
      {label}
    </button>
  );
  return (
    <div className="mctl-trade">
      <span className="env-pill mctl-trade-tag">PAPER · DRAFT</span>
      <div className="mctl-trade-fields">
        <Field label="Symbol" wide>
          {groups.length > 0 ? (
            groups.map((g) => (
              <div key={g.label} className="mctl-trade-from">
                <span className="mctl-trade-from-label">{g.label}</span>
                <div className="mctl-seg mctl-seg--wrap">
                  {g.symbols.map((s) => seg(s === symbol, s, () => patch({ symbol: s })))}
                </div>
              </div>
            ))
          ) : (
            <p className="mctl-trade-empty">
              No names to offer yet: hold shares, watch a company on Trade, or open a dated report
              from the Calendar.
            </p>
          )}
        </Field>
        <Field label="Shares">
          <div className="mctl-seg">
            <button
              type="button"
              className="mctl-seg-btn"
              aria-label="One share fewer"
              disabled={ticket.shares <= 1}
              onClick={() => patch({ shares: ticket.shares - 1 })}
            >
              −
            </button>
            <output className="mctl-seg-count" aria-live="polite" aria-label="Shares">
              {ticket.shares}
            </output>
            <button
              type="button"
              className="mctl-seg-btn"
              aria-label="One share more"
              disabled={ticket.shares >= MAX_SHARES}
              onClick={() => patch({ shares: ticket.shares + 1 })}
            >
              +
            </button>
          </div>
        </Field>
        <Field label="Order type">
          <div className="mctl-seg">
            {(
              [
                ["market", "Market"],
                ["limit", "Limit"],
              ] as const satisfies readonly (readonly [CampaignOrderType, string])[]
            ).map(([type, label]) =>
              seg(ticket.orderType === type, label, () => patch({ orderType: type })),
            )}
          </div>
        </Field>
      </div>
      {symbol ? <QuoteLine symbol={symbol} /> : null}
      <div className="mctl-trade-review">
        <button
          type="button"
          className="btn btn-primary mctl-trade-go"
          disabled={!symbol}
          onClick={review}
        >
          Review order
        </button>
        <span className="mctl-trade-line">{ticketLine(ticket)}</span>
      </div>
      {hasAccount === false ? (
        <ul className="mctl-rows">
          <MissionRow
            mark="◆"
            title="Connect your paper account"
            sub="The gate reviews against your own paper account · play money only"
            tag="first"
            onOpen={() => void navigate({ to: "/accounts" })}
          />
        </ul>
      ) : null}
      <p className="mctl-note">
        {symbol
          ? `Review opens this on Trade, where the gate checks it against your paper account. Nothing is sent from here.${ticket.orderType === "limit" ? " The limit price is set there: it starts at the mid between the bid and the ask when the market has a live quote." : ""}`
          : "Pick a company under Symbol to review the order."}{" "}
        Asking Moneypenny a question never moves this ticket.
      </p>
    </div>
  );
}
