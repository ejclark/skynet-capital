import { useQuery } from "@tanstack/react-query";
import type { KeyboardEvent, ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import type { ActivityReasoning, DeskActivityEvent } from "../live/desk";
import {
  cashMoved,
  dayWords,
  instrumentWords,
  orderBet,
  orderDayKey,
  orderTime,
  sideWord,
  signedDollars,
  sizeWord,
} from "../live/order-facts";
import { orderPlay, playTitle } from "../live/order-play";
import { quoteQuery } from "../live/quote-query";
import { BetGlyph } from "./bet-glyph";
import { DaysLeft, PriceLine, Swatch, ThePlay } from "./order-pictures";
import { withMinus } from "./position-row-spec";

/**
 * AN ORDER'S FULL DETAIL — THE OPT-IN DEEP DIVE (#5101; #5037 round 2, R2-deep, Eric's pick). The
 * depth ladder on Activity is: glance (the row) → open in place (the card or the row's why) → this,
 * opened only by "Full detail ›" → no commit step, because Activity is history. It comes in two
 * shapes and one content:
 *  - `panel` (desktop, >860px): a side panel beside the list. NOT modal — no backdrop, no focus
 *    trap, the list stays live and scrollable — and Close (or Escape) returns to the same row;
 *  - `page` (a phone or a tablet): the list steps aside for a page whose one way back, "‹ Activity",
 *    returns to the same row (the ledger lands on it, `landing.ts`).
 * Its links stay inside: "What it weighed" opens in place, and nothing here leaves for another
 * page. The only way out is back to the row.
 *
 * What it shows, ranked: what happened and the cash it moved; the bet as a sentence; the price line
 * and days left; the cash; the play at expiry, drawn as branches; the bot's reason whole (the one
 * place it lives whole); for the OWNER ALONE the playbook block (its plan and what retires it, #885,
 * #5043); and what it weighed. A viewer who does not own the account gets every public fact — the
 * contract's arithmetic, the reason, the round — and no playbook, plan or retire rule.
 */
export function OrderDeepDive({
  event,
  variant,
  showPlaybook,
  onClose,
}: {
  readonly event: DeskActivityEvent;
  readonly variant: "panel" | "page";
  readonly showPlaybook: boolean;
  readonly onClose: () => void;
}): ReactElement {
  const titleId = useId();
  const title = useRef<HTMLHeadingElement>(null);
  const bet = orderBet(event);
  const cash = cashMoved(event);
  const play = orderPlay(event);
  const underlying =
    play?.kind === "option" ? play.occ.underlying : play?.kind === "shares" ? play.symbol : "";
  const quote = useQuery(quoteQuery(underlying));
  const now = quote.data && "last" in quote.data ? quote.data.last : undefined;
  const why = event.reasoning;

  // The view follows the result (docs/PATTERNS.md): focus moves to the title, and a page starts at
  // the top, as a page does, rather than wherever the list was scrolled — under the sticky head,
  // never behind it.
  useEffect(() => {
    const heading = title.current;
    if (!heading) return;
    if (variant === "page") window.scrollTo?.({ top: 0 });
    heading.focus({ preventScroll: true });
  }, [variant]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };
  const Shell = variant === "panel" ? "aside" : "article";
  return (
    <Shell
      className={`act-deep act-deep-${variant}`}
      aria-labelledby={titleId}
      onKeyDown={onKey}
      data-order={event.orderId}
    >
      <div className="act-deep-bar">
        {variant === "page" ? (
          <button type="button" className="act-deep-back" onClick={onClose}>
            ‹ Activity
          </button>
        ) : (
          <>
            <span className="act-deep-eyebrow">Full detail</span>
            <button type="button" className="act-deep-close" onClick={onClose}>
              Close <span aria-hidden="true">✕</span>
            </button>
          </>
        )}
      </div>

      <header className="dd-head">
        <span className="act-what">
          <span className="act-side">{sideWord(event)}</span>{" "}
          <span className="act-size">{sizeWord(event)}</span>{" "}
          <span className="act-inst">{instrumentWords(event)}</span>
        </span>
        <span className="act-cash">
          {cash ? (
            <>
              {cash.word} <b>{signedDollars(cash.dollars)}</b>
            </>
          ) : null}
        </span>
        <span className="dd-stamp">
          {[dayWords(orderDayKey(event)), orderTime(event), filledWords(event)]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <span className="act-result">
          {event.realizedPl ? (
            <>
              booked{" "}
              <b className={event.realizedTone ? `tone-${event.realizedTone}` : undefined}>
                {withMinus(event.realizedPl)}
              </b>
            </>
          ) : null}
        </span>
      </header>

      <h3 id={titleId} ref={title} tabIndex={-1} className="dd-title">
        {bet ? <BetGlyph shape={bet.shape} /> : null}
        {play && bet ? playTitle(play, bet.words) : (bet?.words ?? instrumentWords(event))}
      </h3>

      {play ? <PriceLine play={play} {...(now === undefined ? {} : { now })} /> : null}
      {play?.kind === "option" ? <DaysLeft filledAt={event.at} play={play} /> : null}
      <CashLine event={event} />
      {play?.kind === "option" ? <ThePlay play={play} /> : null}

      {why ? (
        <section className="dd-section">
          <h4 className="dd-label">Why</h4>
          <p className="dd-why">“{why.reason}”</p>
        </section>
      ) : null}
      {showPlaybook && why?.playbookId ? <PlaybookBlock why={why} /> : null}
      {why ? <Weighed why={why} event={event} showPlaybook={showPlaybook} /> : null}
    </Shell>
  );
}

/** "filled at $2.55" — a spread's is its net; nothing for an order that never filled. */
function filledWords(event: DeskActivityEvent): string | undefined {
  if (event.filled <= 0 || event.price === "—") return event.status.replace(/_/g, " ");
  return `${event.symbol === "" ? "net" : "filled at"} ${event.price}`;
}

/** The cash, in words beside swatches the price line also uses: what moved, what a sold put holds
 *  aside, and what a bought option can lose at most — or what a closing fill booked. */
function CashLine({ event }: { readonly event: DeskActivityEvent }): ReactElement | null {
  const cash = cashMoved(event);
  const play = orderPlay(event);
  if (!cash) return null;
  const aside = play?.kind === "option" ? play.setAside : undefined;
  const capped = play?.kind === "option" && !play.written;
  return (
    <p className="dd-cash">
      <span className="dd-cash-part">
        <Swatch kind="keeps" />
        {cash.word} <b>{signedDollars(cash.dollars)}</b>
      </span>
      {aside ? (
        <span className="dd-cash-part">
          <Swatch kind="aside" />
          <b>${aside.toLocaleString("en-US")}</b> set aside
        </span>
      ) : null}
      {capped ? <span className="dd-cash-part">the most it can lose</span> : null}
      {event.realizedPl ? (
        <span className="dd-cash-part">
          booked <b>{withMinus(event.realizedPl)}</b>
          {event.returnPct ? ` · ${withMinus(event.returnPct)}` : ""}
        </span>
      ) : null}
    </p>
  );
}

/** The owner's alone (#885; the home #5043 proposes for the retire rule): which playbook placed it,
 *  what it planned next, and what would retire it — the playbook's words, never a non-owner's. */
function PlaybookBlock({ why }: { readonly why: ActivityReasoning }): ReactElement {
  return (
    <section className="dd-section dd-playbook">
      <h4 className="dd-label">The playbook · only you see this</h4>
      <p>
        <b>{why.playbookId}</b>
        {why.playbookMode ? ` · ${why.playbookMode}` : ""}
      </p>
      {why.expectation ? (
        <p>
          <span className="dd-sub">Its plan</span> {why.expectation}
        </p>
      ) : null}
      {why.invalidator ? (
        <p>
          <span className="dd-sub">Proves it wrong</span> {why.invalidator}
        </p>
      ) : null}
    </section>
  );
}

/** What the decision weighed, opened in place — never a link out of the deep dive. */
function Weighed({
  why,
  event,
  showPlaybook,
}: {
  readonly why: ActivityReasoning;
  readonly event: DeskActivityEvent;
  readonly showPlaybook: boolean;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const counted =
    why.rawCount !== undefined && why.guardedCount !== undefined
      ? `${why.rawCount} idea${why.rawCount === 1 ? "" : "s"} · ${why.guardedCount} past the risk checks`
      : undefined;
  return (
    <section className="dd-section dd-weighed">
      <h4 className="dd-label">What it weighed</h4>
      <p>
        {counted ?? `Decided by ${why.personaId}`}{" "}
        <button
          type="button"
          className="dd-show"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen(!open)}
        >
          {open ? "Hide" : "Show"} <span aria-hidden="true">{open ? "⌃" : "⌄"}</span>
        </button>
      </p>
      {open ? (
        <dl id={listId} className="dd-weighed-list">
          <div>
            <dt>Decided by</dt>
            <dd>
              {why.personaId}
              {orderTime(event) ? ` · ${orderTime(event)}` : ""}
            </dd>
          </div>
          {why.contract ? (
            <div>
              <dt>The order</dt>
              <dd>{why.contract}</dd>
            </div>
          ) : null}
          {why.cost ? (
            <div>
              <dt>The cash, worked out</dt>
              <dd>{why.cost}</dd>
            </div>
          ) : null}
          {why.guardDelta ? (
            <div>
              <dt>Risk checks</dt>
              <dd>{why.guardDelta}</dd>
            </div>
          ) : null}
          {showPlaybook && why.brokerReason ? (
            <div>
              <dt>Broker said</dt>
              <dd>{why.brokerReason}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}
