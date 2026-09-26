import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import type { DeskPosition } from "../live/desk";
import {
  fetchOptionPositions,
  type OptionBookGreeks,
  type OptionDraft,
  type OptionPositionRow,
  type OptionPreview,
  reviewOption,
  submitOption,
} from "../live/options";
import { money, type TicketResult, tifLabel } from "../live/ticket";
import { RollRow } from "./roll-row";

/**
 * CLOSING FROM THE TICKET (#738 phase 10b) — the capability the legacy blotter's Close posts
 * provided, in the shell: the desk's held option contracts, each with the same review-then-
 * confirm discipline as every order. Direction and size resolve SERVER-side from the live
 * holding (a long closes with a sell, a written contract with a buy), so one button is always
 * the right direction — this component only shows what the desk answered.
 *
 * LIMIT CLOSE (#3407 P1 slice 3; closes were market-only): each row carries a Market / Limit
 * choice and, on Limit, the premium per share it will accept. Market stays the default the row
 * always had; the rules warn that a limit at the mark is the disciplined habit. Any edit disarms
 * a standing review — the same doctrine as every gate: approval never outlives what it approved.
 *
 * POSITION STATEMENT VOCABULARY (#3407 P2 slice 3; parity study row 10): each row now carries the
 * contract's days to expiry, an in-the-money WORD (never a hue), and its live greeks scaled to the
 * holding, from `/api/trade/option-positions`; the card's foot nets the book and says how much of
 * it the number speaks for. A contract the feed didn't quote shows "greeks —" and is named in the
 * book line — absent, never zero (`greeks-aggregator.ts`).
 */

/** "Δ −31 · Γ 2.1 · Θ −6.0 · V 14" — the holding's exposure, or "—" per greek the feed lacked. */
function greeksText(greeks: NonNullable<OptionPositionRow["positionGreeks"]>): string {
  const cell = (label: string, value: number | undefined, digits: number): string =>
    `${label} ${value === undefined ? "—" : value.toFixed(digits)}`;
  return `${cell("Δ", greeks.delta, 0)} · ${cell("Γ", greeks.gamma, 1)} · ${cell("Θ", greeks.theta, 1)} · ${cell("V", greeks.vega, 1)}`;
}

function StatementLine({ row }: { readonly row: OptionPositionRow }): ReactElement {
  const days = Math.ceil(row.daysToExpiry);
  return (
    <span className="tkt-pos-stat">
      <span className="tkt-pos-chip">{days === 0 ? "expires today" : `${days} DTE`}</span>
      {row.inTheMoney !== undefined ? (
        <span className={`tkt-pos-chip${row.inTheMoney ? " tkt-pos-itm" : ""}`}>
          {row.inTheMoney ? "ITM" : "OTM"}
        </span>
      ) : null}
      <span className="num tkt-pos-greeks">
        {row.positionGreeks ? greeksText(row.positionGreeks) : "greeks —"}
      </span>
    </span>
  );
}

function BookLine({
  book,
  representative,
}: {
  readonly book: OptionBookGreeks;
  readonly representative: boolean;
}): ReactElement {
  const figures = `Δ ${book.delta.toFixed(0)} · Γ ${book.gamma.toFixed(1)} · Θ ${book.theta.toFixed(1)} · V ${book.vega.toFixed(1)}`;
  return (
    <p className="tkt-note tkt-book">
      {representative
        ? `Book greeks: ${figures} — all ${book.total} contracts quoted.`
        : book.covered === 0
          ? `Book greeks unavailable — the feed quoted none of ${book.total} contracts.`
          : `Book greeks over ${book.covered} of ${book.total} contracts: ${figures} — not quoted: ${book.uncovered.join(", ")}.`}
    </p>
  );
}

type RowState =
  | { readonly step: "idle" }
  | { readonly step: "reviewing" }
  | { readonly step: "reviewed"; readonly preview: OptionPreview }
  | { readonly step: "submitting" }
  | { readonly step: "done"; readonly result: TicketResult }
  | { readonly step: "error"; readonly message: string };

/** A contract the position guidance handed off (#3729): scroll to it, mark it, and — for a roll —
 *  open the Roll row with the suggested target. Nothing is reviewed or sent on arrival. */
export interface PositionFocus {
  readonly occ: string;
  readonly rollTo?: { readonly strike: number; readonly expiration: string };
}

function CloseRow({
  deskId,
  position,
  statement,
  onFilled,
  focus,
}: {
  readonly deskId: string;
  readonly position: DeskPosition;
  /** The row's Position Statement line, once `/api/trade/option-positions` has answered. */
  readonly statement?: OptionPositionRow;
  readonly onFilled: () => void;
  readonly focus?: PositionFocus;
}): ReactElement {
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focus) return;
    // Next frame: on the docked bench the pane's own scroll-to-pane effect (a parent effect, so
    // it runs after this one) would otherwise win, leaving the member at the pane's top.
    const frame = requestAnimationFrame(() =>
      rowRef.current?.scrollIntoView?.({ block: "center" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [focus]);
  const [state, setState] = useState<RowState>({ step: "idle" });
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState("");
  // Roll as one ticket (#3407 P3 slice 3) — a second row under this one, opened on demand.
  const [rolling, setRolling] = useState(focus?.rollTo !== undefined);
  const priceId = useId();
  const parsedLimit = Number(limitPrice.trim());
  const draft: OptionDraft = {
    kind: "close",
    participantId: deskId,
    occSymbol: position.symbol,
    orderType,
    ...(orderType === "limit" && limitPrice.trim() !== "" && Number.isFinite(parsedLimit)
      ? { limitPrice: parsedLimit }
      : {}),
  };
  /** Any edit disarms a standing review, straight back to idle. */
  const disarm = () => setState((s) => (s.step === "reviewed" ? { step: "idle" } : s));

  const review = async () => {
    setState({ step: "reviewing" });
    try {
      const { preview } = await reviewOption(draft);
      setState({ step: "reviewed", preview });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };
  const confirm = async () => {
    setState({ step: "submitting" });
    try {
      const result = await submitOption(draft);
      setState({ step: "done", result });
      if (result.ok) onFilled();
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  return (
    <>
      <div
        ref={rowRef}
        className={focus ? "tkt-close-row tkt-close-row-focus" : "tkt-close-row"}
        data-focus={focus ? "true" : undefined}
      >
        <span className="tkt-close-main">
          {position.display} <small className="num">{position.symbol}</small>
          {statement ? <StatementLine row={statement} /> : null}
        </span>

        <span className="num">{position.quantity}</span>
        <span className="num">{position.value}</span>
        <span className="tkt-close-how">
          <fieldset className="toggle-group tkt-close-type" aria-label="Close order type">
            {(["market", "limit"] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={orderType === type}
                disabled={state.step === "submitting" || state.step === "done"}
                onClick={() => {
                  setOrderType(type);
                  disarm();
                }}
              >
                {type === "market" ? "Market" : "Limit"}
              </button>
            ))}
          </fieldset>
          {orderType === "limit" ? (
            <span className="field tkt-close-price">
              <label htmlFor={priceId} className="visually-hidden">
                Limit price per share
              </label>
              <input
                id={priceId}
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={limitPrice}
                placeholder={`≈ ${position.price}`}
                disabled={state.step === "submitting" || state.step === "done"}
                onChange={(e) => {
                  setLimitPrice(e.target.value);
                  disarm();
                }}
              />
            </span>
          ) : null}
        </span>
        {state.step === "idle" || state.step === "error" ? (
          <button type="button" className="btn mc-btn" onClick={() => void review()}>
            Close…
          </button>
        ) : null}
        {state.step === "reviewing" ? <span className="tkt-close-note">reviewing…</span> : null}
        {state.step === "reviewed" ? (
          state.preview.ok ? (
            <button type="button" className="btn btn-primary mc-btn" onClick={() => void confirm()}>
              Confirm — close {state.preview.contracts}
              {state.preview.orderType === "limit" && state.preview.limitPrice !== undefined
                ? ` · limit ${money(state.preview.limitPrice)}`
                : " · market"}
              {tifLabel(state.preview.timeInForce)
                ? ` · ${tifLabel(state.preview.timeInForce)}`
                : ""}
              {state.preview.estNotional !== undefined
                ? ` · est ${money(state.preview.estNotional)}`
                : ""}
            </button>
          ) : (
            <span className="tkt-close-note gate-refusal">✕ {state.preview.refusals[0]}</span>
          )
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
        <button
          type="button"
          className="btn mc-btn"
          aria-expanded={rolling}
          disabled={state.step === "submitting" || state.step === "done"}
          onClick={() => setRolling((open) => !open)}
        >
          Roll…
        </button>
      </div>
      {rolling ? (
        <RollRow
          deskId={deskId}
          position={position}
          onFilled={onFilled}
          {...(focus?.rollTo ? { initialTarget: focus.rollTo } : {})}
        />
      ) : null}
    </>
  );
}

/** The desk's held option contracts, or nothing — a desk with no options shows no card.
 *
 *  @category trading
 */
export function OptionPositionsCard({
  deskId,
  positions,
  focus,
}: {
  readonly deskId: string;
  readonly positions: readonly DeskPosition[];
  readonly focus?: PositionFocus;
}): ReactElement | null {
  const queryClient = useQueryClient();
  const held = positions.filter((p) => p.isOption);
  const statement = useQuery({
    queryKey: ["option-positions", deskId],
    queryFn: () => fetchOptionPositions(deskId),
    enabled: deskId !== "" && held.length > 0,
    staleTime: 30_000,
  });
  if (held.length === 0) return null;
  const rowsBySymbol = new Map(
    (statement.data?.available ? statement.data.rows : []).map((row) => [row.symbol, row]),
  );
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["desk", deskId] });
    void queryClient.invalidateQueries({ queryKey: ["option-positions", deskId] });
  };
  return (
    <section className="panel gate-panel" aria-label="Option positions">
      <h2 className="panel-title">Option positions</h2>
      <p className="panel-sub">
        Held contracts on this account — Close reviews first, and works out the direction from the
        live holding.
      </p>
      <div className="tkt-close-rows">
        {held.map((position) => (
          <CloseRow
            // Keyed on the hand-off too: docked, this card is already mounted when a new
            // ?manage=&rollTo= arrives, and only a remount re-seeds the row's Roll state.
            key={
              focus && focus.occ === position.symbol
                ? `${position.symbol}|${focus.rollTo?.expiration ?? ""}:${focus.rollTo?.strike ?? ""}`
                : position.symbol
            }
            deskId={deskId}
            position={position}
            statement={rowsBySymbol.get(position.symbol)}
            onFilled={refresh}
            {...(focus && focus.occ === position.symbol ? { focus } : {})}
          />
        ))}
      </div>
      {statement.data?.available ? (
        <BookLine book={statement.data.book} representative={statement.data.representative} />
      ) : null}
    </section>
  );
}
