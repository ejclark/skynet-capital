import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import { ROLL_UNAVAILABLE_REASON } from "../../../src/trading/order-ticket";
import { type DeskPosition, fetchDeskActivity, type PositionLot, type Tone } from "../live/desk";
import { type OptionPreview, reviewOption, submitOption } from "../live/options";
import { reviewTicket, submitTicket, type TicketPreview, type TicketResult } from "../live/ticket";
import { EventLine } from "./timeline-drawer";

/**
 * One blotter row (#738 phase 2c, extracted 3b) — responsive disclosure per the round-1 verdict:
 * detail columns visible on wide viewports (`col-detail`), folded behind the chevron only when
 * the viewport hides them. The symbol is the door to the position's fill timeline, which opens
 * INLINE as its own accordion row (#2321) — never a right-rail drawer, which read as too far
 * removed from the row that triggered it. Its open state (`timelineOpen`) is deliberately separate
 * from the detail fold's `open`: the fold is hidden at ≥1100px (`desk.css`'s responsive-disclosure
 * rule), so sharing one boolean would make the timeline undiscoverable on desktop.
 * @category trading
 */

/** The 8 numeric columns shared byte-for-byte between the parent row and every lot row beneath
 *  it (#3186 slice 1) — pulled into one component specifically so "a lot row uses the identical
 *  column set as the parent" is enforced by sharing markup, not by two hand-kept-in-sync blocks. */
function PositionCells({
  quantity,
  costPerShare,
  price,
  costBasis,
  value,
  dayPl,
  dayTone,
  totalPl,
  totalTone,
  returnPct,
}: {
  readonly quantity: string;
  readonly costPerShare: string;
  readonly price: string;
  readonly costBasis: string;
  readonly value: string;
  readonly dayPl: string;
  readonly dayTone: Tone;
  readonly totalPl: string;
  readonly totalTone: Tone;
  readonly returnPct: string;
}): ReactElement {
  return (
    <>
      <td className="num">{quantity}</td>
      <td className="num col-detail">{costPerShare}</td>
      <td className="num">{price}</td>
      <td className="num col-detail">{costBasis}</td>
      <td className="num">{value}</td>
      <td className={`num col-detail tone-${dayTone}`}>{dayPl}</td>
      <td className={`num tone-${totalTone}`}>{totalPl}</td>
      <td className={`num col-detail tone-${totalTone}`}>{returnPct}</td>
    </>
  );
}

/** A lot addressed as a `DeskPosition` of its own — the shape `ClosePanel` already knows how to
 *  close, scoped to just this lot's quantity instead of the whole position (#3186 slice 1: closing
 *  one options lot, not the whole position, is the common case). `totalPlRaw` isn't read by
 *  `ClosePanel`; it's re-derived from the lot's own formatted figure rather than left stale. */
function lotAsPosition(position: DeskPosition, lot: PositionLot): DeskPosition {
  const rawTotalPl = Number(lot.totalPl.replace(/[^0-9.-]/g, "")) || 0;
  return {
    ...position,
    quantity: lot.quantity,
    costPerShare: lot.costPerShare,
    price: lot.price,
    costBasis: lot.costBasis,
    value: lot.value,
    dayPl: lot.dayPl,
    dayTone: lot.dayTone,
    totalPl: lot.totalPl,
    totalPlRaw: rawTotalPl,
    returnPct: lot.returnPct,
    totalTone: lot.totalTone,
  };
}

export function BlotterRow({
  position,
  deskId,
}: {
  readonly position: DeskPosition;
  readonly deskId: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [lotsOpen, setLotsOpen] = useState(false);
  const [closeLotId, setCloseLotId] = useState<string | undefined>(undefined);
  // The queryKey is shared across every row on this desk, so React Query fetches the ledger once
  // no matter how many symbols get expanded — `enabled` only gates when the FIRST row asks for it.
  const activity = useQuery({
    queryKey: ["desk-activity", deskId],
    queryFn: () => fetchDeskActivity(deskId),
    staleTime: 30_000,
    enabled: timelineOpen,
  });
  const events = activity.data?.activity.filter((e) => e.symbol === position.symbol) ?? [];

  return (
    <>
      <tr>
        <td className="fold-col">
          <button
            type="button"
            className="expand-btn"
            aria-expanded={open}
            aria-label={`Detail for ${position.display}`}
            onClick={() => setOpen(!open)}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </td>
        <td>
          <button
            type="button"
            className="sym sym-link"
            aria-expanded={timelineOpen}
            onClick={() => setTimelineOpen(!timelineOpen)}
          >
            {position.display}
          </button>
          <span className="sym-sub">{position.detail}</span>
          {position.lots && position.lots.length > 0 ? (
            <button
              type="button"
              className="sym-lots"
              aria-expanded={lotsOpen}
              aria-label={`${position.lots.length} lots for ${position.display}`}
              onClick={() => setLotsOpen(!lotsOpen)}
            >
              · {position.lots.length} lots
            </button>
          ) : null}
        </td>
        <PositionCells
          quantity={position.quantity}
          costPerShare={position.costPerShare}
          price={position.price}
          costBasis={position.costBasis}
          value={position.value}
          dayPl={position.dayPl}
          dayTone={position.dayTone}
          totalPl={position.totalPl}
          totalTone={position.totalTone}
          returnPct={position.returnPct}
        />
        <td className="act-col">
          <button
            type="button"
            className="btn mc-btn close-btn"
            aria-expanded={closeOpen}
            onClick={() => setCloseOpen(!closeOpen)}
          >
            {position.lots && position.lots.length > 0 ? "Close all" : "Close"}
          </button>
        </td>
      </tr>
      {lotsOpen && position.lots
        ? position.lots.map((lot) => (
            <tr className="row-lot" key={lot.lotId}>
              <td className="fold-col" aria-hidden="true" />
              <td>
                <span className="sym-sub">Lot · {lot.openedAt}</span>
              </td>
              <PositionCells
                quantity={lot.quantity}
                costPerShare={lot.costPerShare}
                price={lot.price}
                costBasis={lot.costBasis}
                value={lot.value}
                dayPl={lot.dayPl}
                dayTone={lot.dayTone}
                totalPl={lot.totalPl}
                totalTone={lot.totalTone}
                returnPct={lot.returnPct}
              />
              <td className="act-col lot-actions">
                <button
                  type="button"
                  className="btn mc-btn close-btn"
                  aria-expanded={closeLotId === lot.lotId}
                  onClick={() => setCloseLotId(closeLotId === lot.lotId ? undefined : lot.lotId)}
                >
                  Close lot
                </button>
                <button
                  type="button"
                  className="btn mc-btn"
                  disabled
                  title={ROLL_UNAVAILABLE_REASON}
                  aria-label={`Roll — ${ROLL_UNAVAILABLE_REASON}`}
                >
                  Roll
                </button>
              </td>
            </tr>
          ))
        : null}
      {lotsOpen && position.lots
        ? position.lots
            .filter((lot) => lot.lotId === closeLotId)
            .map((lot) => (
              <tr className="row-close" key={`close-${lot.lotId}`}>
                <td colSpan={11}>
                  <ClosePanel
                    deskId={deskId}
                    position={lotAsPosition(position, lot)}
                    onDone={() => setCloseLotId(undefined)}
                  />
                </td>
              </tr>
            ))
        : null}
      {open ? (
        <tr className="row-more">
          <td colSpan={11}>
            <dl className="more-grid">
              <div>
                <dt>Cost / share</dt>
                <dd>{position.costPerShare}</dd>
              </div>
              <div>
                <dt>Cost basis</dt>
                <dd>{position.costBasis}</dd>
              </div>
              <div>
                <dt>Day P/L</dt>
                <dd className={`tone-${position.dayTone}`}>
                  {position.dayPl} ({position.dayPct})
                </dd>
              </div>
              <div>
                <dt>Return</dt>
                <dd className={`tone-${position.totalTone}`}>{position.returnPct}</dd>
              </div>
            </dl>
          </td>
        </tr>
      ) : null}
      {timelineOpen ? (
        <tr className="row-timeline">
          <td colSpan={11}>
            {activity.isPending ? <p className="note">Reading the ledger…</p> : null}
            {activity.isError ? <p className="note">The ledger is unreachable.</p> : null}
            {activity.data && !activity.data.available ? (
              <p className="note">No durable activity ledger is wired in this deployment.</p>
            ) : null}
            {activity.data?.available && events.length === 0 ? (
              <p className="note">
                No recorded orders for {position.display} in the ledger's window.
              </p>
            ) : null}
            {events.length > 0 ? (
              <ul className="tl">
                {events.map((event) => (
                  <EventLine key={`${event.orderId}-${event.at}`} event={event} />
                ))}
              </ul>
            ) : null}
            {events.some((e) => e.origin === "alpaca-direct") ? (
              <p className="tl-legend">
                <span className="tl-direct" aria-hidden="true">
                  *
                </span>{" "}
                Placed directly in Alpaca — this order skipped the app's ticket, so none of the
                desk's pre-trade checks saw it.
              </p>
            ) : null}
          </td>
        </tr>
      ) : null}
      {closeOpen ? (
        <tr className="row-close">
          <td colSpan={11}>
            <ClosePanel deskId={deskId} position={position} onDone={() => setCloseOpen(false)} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

/** The qty unit label — "shares" for stock, "contracts" for options. */
const qtyUnit = (position: DeskPosition): string => (position.isOption ? "contracts" : "shares");

/** Parse the blotter's formatted quantity string to a number for the close draft. */
const parseQty = (position: DeskPosition): number => {
  const n = Number(position.quantity);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

type CloseState =
  | { readonly step: "editing" }
  | { readonly step: "reviewing" }
  | { readonly step: "reviewed"; readonly preview: TicketPreview | OptionPreview }
  | { readonly step: "submitting" }
  | { readonly step: "done"; readonly result: TicketResult }
  | { readonly step: "error"; readonly message: string };

/**
 * The inline close panel — qty input → review → confirm, same review-then-confirm discipline as
 * every order on this desk. Options close via `reviewOption`/`submitOption` (direction resolved
 * server-side); stocks close via `reviewTicket`/`submitTicket` with `action: "sell"`. On a
 * successful fill, the desk + activity queries are invalidated so positions and the ledger
 * refresh without a manual page reload.
 */
function ClosePanel({
  deskId,
  position,
  onDone,
}: {
  readonly deskId: string;
  readonly position: DeskPosition;
  readonly onDone: () => void;
}): ReactElement {
  const queryClient = useQueryClient();
  const fullQty = parseQty(position);
  const [qty, setQty] = useState(position.quantity);
  const [state, setState] = useState<CloseState>({ step: "editing" });

  const closeQty = Math.min(Number(qty) || 0, fullQty);
  const isFull = closeQty >= fullQty;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["desk", deskId] });
    void queryClient.invalidateQueries({ queryKey: ["desk-activity", deskId] });
    void queryClient.invalidateQueries({ queryKey: ["accounts-networth"] });
  };

  const review = async () => {
    setState({ step: "reviewing" });
    try {
      if (position.isOption) {
        const { preview } = await reviewOption({
          kind: "close",
          participantId: deskId,
          occSymbol: position.symbol,
          ...(isFull ? {} : { contracts: closeQty }),
        });
        setState({ step: "reviewed", preview });
      } else {
        const { preview } = await reviewTicket({
          participantId: deskId,
          symbol: position.symbol,
          quantity: closeQty,
          action: "sell",
        });
        setState({ step: "reviewed", preview });
      }
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  const confirm = async () => {
    setState({ step: "submitting" });
    try {
      if (position.isOption) {
        const result = await submitOption({
          kind: "close",
          participantId: deskId,
          occSymbol: position.symbol,
          ...(isFull ? {} : { contracts: closeQty }),
        });
        setState({ step: "done", result });
        if (result.ok) {
          refresh();
          onDone();
        }
      } else {
        const result = await submitTicket({
          participantId: deskId,
          symbol: position.symbol,
          quantity: closeQty,
          action: "sell",
        });
        setState({ step: "done", result });
        if (result.ok) {
          refresh();
          onDone();
        }
      }
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  return (
    <div className="close-panel">
      <div className="close-panel-head">
        <span className="close-panel-sym">{position.display}</span>
        <span className="close-panel-unrealized num tone-{position.totalTone}">
          {position.totalPl} total P/L
        </span>
      </div>
      {state.step === "editing" || state.step === "error" ? (
        <div className="close-panel-form">
          <label className="close-panel-qty">
            <span className="visually-hidden">{qtyUnit(position)} to close</span>
            <input
              type="number"
              min={1}
              max={fullQty}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <span className="close-panel-unit">{qtyUnit(position)}</span>
          </label>
          <button
            type="button"
            className="btn mc-btn"
            disabled={closeQty < 1 || closeQty > fullQty}
            onClick={() => void review()}
          >
            {isFull ? "Close all" : `Close ${closeQty}`}
          </button>
        </div>
      ) : null}
      {state.step === "reviewing" ? <span className="tkt-close-note">reviewing…</span> : null}
      {state.step === "reviewed" ? (
        <div className="close-panel-confirm">
          {state.preview.ok ? (
            <>
              <span className="tkt-close-note">
                {position.isOption
                  ? `Close ${closeQty} ${qtyUnit(position)}`
                  : `Sell ${closeQty} ${qtyUnit(position)}`}
                {state.preview.estNotional !== undefined
                  ? ` · est $${state.preview.estNotional.toLocaleString("en-US")}`
                  : ""}
              </span>
              <button
                type="button"
                className="btn btn-primary mc-btn"
                onClick={() => void confirm()}
              >
                Confirm
              </button>
            </>
          ) : (
            <span className="tkt-close-note gate-refusal">✕ {state.preview.refusals[0]}</span>
          )}
        </div>
      ) : null}
      {state.step === "submitting" ? <span className="tkt-close-note">closing…</span> : null}
      {state.step === "done" ? (
        state.result.ok ? (
          <span className="tkt-close-note gate-ok">
            order {state.result.orderId} {state.result.status}
          </span>
        ) : (
          <span className="tkt-close-note gate-refusal">✕ {state.result.refusals[0]}</span>
        )
      ) : null}
      {state.step === "error" ? (
        <span className="tkt-close-note gate-refusal">{state.message}</span>
      ) : null}
    </div>
  );
}
