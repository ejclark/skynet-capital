import { useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import { ROLL_UNAVAILABLE_REASON } from "../../../src/trading/order-ticket";
import type { DeskPosition, PositionEvent, PositionLot, Tone } from "../live/desk";
import { type OptionPreview, reviewOption, submitOption } from "../live/options";
import { reviewTicket, submitTicket, type TicketPreview, type TicketResult } from "../live/ticket";
import { buysLabel } from "./glossary";

/**
 * One blotter row (#738 phase 2c, extracted 3b) — responsive disclosure per the round-1 verdict:
 * detail columns visible on wide viewports (`col-detail`), folded behind the chevron only when
 * the viewport hides them. The symbol's fill-timeline accordion (raw order-fill history,
 * BUY/SELL included) was retired here (#3186 slice 2): it duplicated `ActivityTable`'s Activity
 * tab, unaligned to this table's columns, and a position only ever shows what's still on the
 * ledger — a sold lot isn't a position. The lots breakdown is the one detail affordance left on a
 * row: the still-open lots that make up the position, at transaction-level granularity, sharing
 * `PositionCells` with the parent row so the columns always match the header. Its trigger is the
 * whole symbol header, not a separate labeled link (#3186 slice 3, live-review: a small "N lots"
 * text link read as unexpected custom behavior and "lots" as jargon) — click anywhere on the
 * symbol to expand, a chevron shows state, same language as the fold-col chevron.
 * @category trading
 */

/** The numeric columns shared byte-for-byte between the parent row and every lot row beneath it
 *  (#3186 slice 1), so "a lot row uses the identical column set as the parent" is enforced by
 *  sharing markup. #3689 slice 6 reshaped them for beginners: Qty · Value · Today · Total P/L
 *  (return beneath) · Expires in · Decay / day · Breakeven · Best / worst case · Next event. A lot
 *  row has no expiry/decay/breakeven/best-worst/event of its own (they're the position's), so
 *  those cells stay blank there. */
interface PlainCells {
  readonly expiresIn?: string;
  readonly decay?: string;
  readonly breakeven?: string;
  readonly best?: string;
  readonly worst?: string;
  readonly event?: PositionEvent;
  readonly shares: boolean;
}

function PositionCells({
  quantity,
  value,
  dayPl,
  dayTone,
  totalPl,
  totalTone,
  returnPct,
  plain,
}: {
  readonly quantity: string;
  readonly value: string;
  readonly dayPl: string;
  readonly dayTone: Tone;
  readonly totalPl: string;
  readonly totalTone: Tone;
  readonly returnPct: string;
  /** The position-level plain columns; omitted on a lot row. */
  readonly plain?: PlainCells;
}): ReactElement {
  const quiet = (v: string | undefined, none: string) =>
    v === undefined ? (
      <span className="muted">—</span>
    ) : v === none ? (
      <span className="muted">{v}</span>
    ) : (
      v
    );
  return (
    <>
      <td className="num">{quantity}</td>
      <td className="num">{value}</td>
      <td className={`num tone-${dayTone}`}>{dayPl}</td>
      <td className={`num tone-${totalTone} pl-cell`}>
        <b>{totalPl}</b>
        <span className="pl-cell-ret">{returnPct}</span>
      </td>
      <td className="num">{plain ? quiet(plain.expiresIn, "no expiry") : null}</td>
      <td className={`num col-detail${plain?.decay?.startsWith("−") ? " tone-neg" : ""}`}>
        {plain ? quiet(plain.decay, "none") : null}
      </td>
      <td className="num col-detail">{plain ? quiet(plain.breakeven, "") : null}</td>
      <td className="num col-detail best-worst">
        {plain?.best && plain.worst ? (
          <>
            <span className={plain.best === "unlimited" ? "muted" : "tone-pos"}>{plain.best}</span>
            <span className={plain.worst === "unlimited" ? "muted" : "tone-neg"}>
              {plain.worst}
            </span>
          </>
        ) : plain ? (
          <span className="muted">—</span>
        ) : null}
      </td>
      <td className="col-detail next-event">{plain ? <EventCell event={plain.event} /> : null}</td>
    </>
  );
}

/** "Earnings Oct 28" (the date glued so a wrap never splits "Oct / 28"), with "before expiry" said in words beneath when it lands while the option
 *  is alive (never a colour alone). A market-wide print reads muted: it moves everything. */
function EventCell({ event }: { readonly event?: PositionEvent }): ReactElement {
  if (!event) return <span className="muted">—</span>;
  const own = event.scope === "stock";
  return (
    <>
      <span className={own ? "next-event-label" : "next-event-label muted"}>
        {event.label.replace(/ (\w{3}) (\d{1,2})$/, " $1\u00a0$2")}
      </span>
      {own && event.beforeExpiry ? <span className="next-event-when">before expiry</span> : null}
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

/** The line under a position's name: what it bets on in plain words, then what it cost and what
 *  it's worth now (the cost/mark columns this replaced). */
function PlainSub({ position }: { readonly position: DeskPosition }): ReactElement {
  return (
    <>
      {position.plainName ? (
        <span className="sym-sub sym-sub--plain">{position.plainName}</span>
      ) : null}
      <span className="sym-sub sym-sub--num">
        cost {position.costPerShare} · now {position.price}
        {position.detail ? ` · ${position.detail}` : ""}
      </span>
    </>
  );
}

/** The position-level plain columns `PositionCells` prints, from the server's plain fields. */
function plainCells(position: DeskPosition, decay: string | undefined): PlainCells {
  return {
    ...(position.expiresIn ? { expiresIn: position.expiresIn } : {}),
    ...(position.isOption ? (decay ? { decay } : {}) : { decay: "none" }),
    ...(position.breakeven ? { breakeven: position.breakeven } : {}),
    ...(position.best ? { best: position.best } : {}),
    ...(position.worst ? { worst: position.worst } : {}),
    ...(position.nextEvent ? { event: position.nextEvent } : {}),
    shares: !position.isOption,
  };
}

export function BlotterRow({
  position,
  deskId,
  decay,
}: {
  readonly position: DeskPosition;
  readonly deskId: string;
  /** "−$12/day": this holding's time decay from the option book, when the feed quoted it. */
  readonly decay?: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [lotsOpen, setLotsOpen] = useState(false);
  const [closeLotId, setCloseLotId] = useState<string | undefined>(undefined);

  return (
    <>
      <tr id={`pos-${position.symbol}`}>
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
          {position.lots && position.lots.length > 0 ? (
            <button
              type="button"
              className="sym-header"
              aria-expanded={lotsOpen}
              aria-label={`${buysLabel(position.lots.length)} for ${position.display}`}
              onClick={() => setLotsOpen(!lotsOpen)}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6 4l4 4-4 4" />
              </svg>
              <span className="sym-header-text">
                <span className="sym">{position.display}</span>
                <PlainSub position={position} />
              </span>
              <span
                className="buys-chip"
                title={`You bought this at ${position.lots.length} different times and prices`}
              >
                {buysLabel(position.lots.length)}
              </span>
            </button>
          ) : (
            <>
              <span className="sym">{position.display}</span>
              <PlainSub position={position} />
            </>
          )}
        </td>
        <PositionCells
          quantity={position.quantity}
          value={position.value}
          dayPl={position.dayPl}
          dayTone={position.dayTone}
          totalPl={position.totalPl}
          totalTone={position.totalTone}
          returnPct={position.returnPct}
          plain={plainCells(position, decay)}
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
                <span className="sym-sub">{lot.openedAt}</span>
              </td>
              <PositionCells
                quantity={lot.quantity}
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
                  Close this buy
                </button>
                {position.isOption ? (
                  <button
                    type="button"
                    className="btn mc-btn"
                    disabled
                    title={ROLL_UNAVAILABLE_REASON}
                    aria-label={`Roll — ${ROLL_UNAVAILABLE_REASON}`}
                  >
                    Roll
                  </button>
                ) : null}
              </td>
            </tr>
          ))
        : null}
      {lotsOpen && position.lots
        ? position.lots
            .filter((lot) => lot.lotId === closeLotId)
            .map((lot) => (
              <tr className="row-close" key={`close-${lot.lotId}`}>
                <td colSpan={12}>
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
          <td colSpan={12}>
            <dl className="more-grid">
              <div>
                <dt>Cost basis</dt>
                <dd>{position.costBasis}</dd>
              </div>
              <div>
                <dt>Decay / day</dt>
                <dd>{position.isOption ? (decay ?? "—") : "none"}</dd>
              </div>
              <div>
                <dt>Breakeven</dt>
                <dd>{position.breakeven ?? "—"}</dd>
              </div>
              <div>
                <dt>Best / worst case</dt>
                <dd>
                  {position.best && position.worst ? `${position.best} / ${position.worst}` : "—"}
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      ) : null}
      {closeOpen ? (
        <tr className="row-close">
          <td colSpan={12}>
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
        <span className={`close-panel-unrealized num tone-${position.totalTone}`}>
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
