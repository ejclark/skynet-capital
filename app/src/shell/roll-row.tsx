import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import { type HeldContract, rollLegs, rollPriceSides } from "../../../src/trading/roll-legs";
import type { DeskPosition } from "../live/desk";
import {
  addDraftLeg,
  type DraftOrder,
  type DraftPreview,
  type DraftResponse,
  emptyDraft,
  type NewLeg,
  reviewDraft,
  submitDraftOrder,
  validateDraft,
} from "../live/draft-order";
import { type ChainData, type ChainRow, fetchChain } from "../live/options";
import { formatExpiration } from "../live/straddle";
import { money, TIF_LABELS, type TicketTimeInForce, tifLabel } from "../live/ticket";

/**
 * ROLL AS ONE TICKET (#3407 P3 slice 3; the study's row 11 — Fidelity's Roll ticket, 1:1): from
 * a held contract's row, pick the next expiration and strike and the desk closes the old one and
 * opens the new one as ONE multi-leg order — the same draft route the builder uses (add · add ·
 * validate · review · submit), so the live-account re-check, the 401 rung and the `mleg` seam all
 * apply unchanged, and the seam reads to-close / to-open off the live book. Prices cross the
 * spread honestly (`rollPriceSides`): a short is bought back at the ask and re-sold at the bid, a
 * long sold at the bid and re-bought at the ask; the review shows the net as the server computed
 * it — a "credit" roll that nets a debit says so.
 * @category trading
 */

type RollState =
  | { readonly step: "idle" }
  | { readonly step: "reviewing" }
  | { readonly step: "reviewed"; readonly draft: DraftOrder; readonly preview: DraftPreview }
  | { readonly step: "refused"; readonly refusals: readonly string[] }
  | { readonly step: "submitting" }
  | { readonly step: "done"; readonly response: DraftResponse }
  | { readonly step: "error"; readonly message: string };

/** The next listed expiration after the held one, or the held one when it is the last. */
export function defaultRollExpiration(expirations: readonly string[], held: string): string {
  return expirations.find((exp) => exp > held) ?? held;
}

/** The strike the target chain actually lists nearest the wanted one — a held strike the next
 *  expiration doesn't carry never becomes a leg on a contract that doesn't exist. */
export function nearestListedStrike(rows: readonly ChainRow[], wanted: number): number {
  let best = wanted;
  let gap = Number.POSITIVE_INFINITY;
  for (const row of rows) {
    const d = Math.abs(row.strike - wanted);
    if (d < gap) {
      gap = d;
      best = row.strike;
    }
  }
  return best;
}

/** The draft route, in the only order it accepts — stops at the first refusal, in its words. */
async function reviewRoll(deskId: string, legs: readonly [NewLeg, NewLeg]): Promise<RollState> {
  let res = await addDraftLeg(deskId, emptyDraft(), legs[0]);
  if (res.draft.refusals.length === 0) res = await addDraftLeg(deskId, res.draft, legs[1]);
  if (res.draft.refusals.length === 0) res = await validateDraft(deskId, res.draft);
  if (res.draft.refusals.length === 0) res = await reviewDraft(deskId, res.draft);
  if (res.draft.refusals.length > 0) return { step: "refused", refusals: res.draft.refusals };
  return { step: "reviewed", draft: res.draft, preview: res.preview };
}

/** "Sent" is the broker's word (`executed`), never the phase. */
async function submitRoll(
  deskId: string,
  draft: DraftOrder,
  timeInForce: TicketTimeInForce,
): Promise<RollState> {
  const response = await submitDraftOrder(deskId, draft, timeInForce);
  if (response.executed === true) return { step: "done", response };
  const refusals =
    response.draft.refusals.length > 0
      ? response.draft.refusals
      : [response.note ?? "Nothing was sent to the broker."];
  return { step: "refused", refusals };
}

function useChain(parts: HeldContract | undefined, expiration: string): ChainData | undefined {
  const query = useQuery({
    queryKey: ["chain", parts?.underlying ?? "", parts?.type ?? "call", expiration],
    queryFn: () => fetchChain(parts?.underlying ?? "", parts?.type ?? "call", expiration),
    enabled: parts !== undefined && expiration !== "",
    // The "roll to" expiration select re-keys this query on every pick (Eric, 2026-09-22) — keep
    // the outgoing target's strikes listed while the new one loads, instead of the Strike select
    // emptying out for a beat.
    placeholderData: keepPreviousData,
  });
  return query.data && !("chainNote" in query.data) ? query.data : undefined;
}

function heldContract(position: DeskPosition): HeldContract | undefined {
  const parts = parseOccSymbol(position.symbol);
  const contracts = Number(position.quantity);
  if (!(parts && Number.isFinite(contracts)) || contracts === 0) return undefined;
  return { ...parts, contracts };
}

export function RollRow({
  deskId,
  position,
  onFilled,
}: {
  readonly deskId: string;
  readonly position: DeskPosition;
  readonly onFilled: () => void;
}): ReactElement | null {
  const held = heldContract(position);
  const [expiration, setExpiration] = useState("");
  const [strike, setStrike] = useState("");
  // Typed prices win over the crossing quote (#3407 P3 slice 4) — "" means the quote's.
  const [closeText, setCloseText] = useState("");
  const [openText, setOpenText] = useState("");
  const [timeInForce, setTimeInForce] = useState<TicketTimeInForce>("day");
  const [state, setState] = useState<RollState>({ step: "idle" });
  const heldChain = useChain(held, held?.expiration ?? "");
  const targetExpiration =
    expiration ||
    (heldChain ? defaultRollExpiration(heldChain.expirations, heldChain.expiration) : "");
  const targetChain = useChain(held, targetExpiration);
  if (!held) return null;

  const short = held.contracts < 0;
  const sides = rollPriceSides(short);
  const wanted = strike === "" ? held.strike : Number(strike);
  const targetStrike = targetChain ? nearestListedStrike(targetChain.rows, wanted) : wanted;
  const closeRow = heldChain?.rows.find((r) => r.strike === held.strike);
  const openRow = targetChain?.rows.find((r) => r.strike === targetStrike);
  const closePrice = typedPrice(closeText) ?? closeRow?.[sides.close] ?? closeRow?.premium;
  const openPrice = typedPrice(openText) ?? openRow?.[sides.open] ?? openRow?.premium;
  const busy = state.step === "reviewing" || state.step === "submitting";
  const locked = busy || state.step === "done";
  const disarm = () =>
    setState((s) => (s.step === "reviewed" || s.step === "refused" ? { step: "idle" } : s));
  const run = (work: Promise<RollState>) => {
    void work
      .then((next) => {
        setState(next);
        if (next.step === "done") onFilled();
      })
      .catch((error: unknown) => setState({ step: "error", message: String(error) }));
  };
  const review = () => {
    setState({ step: "reviewing" });
    const legs = rollLegs(
      held,
      { strike: targetStrike, expiration: targetExpiration },
      {
        ...(closePrice !== undefined ? { close: closePrice } : {}),
        ...(openPrice !== undefined ? { open: openPrice } : {}),
      },
    );
    run(reviewRoll(deskId, legs));
  };

  return (
    <div className="tkt-roll-row">
      <RollFields
        heldChain={heldChain}
        targetChain={targetChain}
        targetExpiration={targetExpiration}
        targetStrike={targetStrike}
        openSide={sides.open}
        timeInForce={timeInForce}
        locked={locked}
        onExpiration={(next) => {
          setExpiration(next);
          setStrike("");
          setOpenText("");
          disarm();
        }}
        onStrike={(next) => {
          setStrike(next);
          setOpenText("");
          disarm();
        }}
        onTimeInForce={setTimeInForce}
      />
      <RollPrices
        closeText={closeText}
        openText={openText}
        closeQuote={closeRow?.[sides.close] ?? closeRow?.premium}
        openQuote={openRow?.[sides.open] ?? openRow?.premium}
        locked={locked}
        onClose={(next) => {
          setCloseText(next);
          disarm();
        }}
        onOpen={(next) => {
          setOpenText(next);
          disarm();
        }}
      />
      <span className="tkt-roll-line num">
        {legLine(held, short, targetStrike, targetExpiration, closePrice, openPrice)}
      </span>
      <RollAction
        state={state}
        timeInForce={timeInForce}
        ready={heldChain !== undefined && targetChain !== undefined}
        onReview={review}
        onConfirm={(draft) => {
          setState({ step: "submitting" });
          run(submitRoll(deskId, draft, timeInForce));
        }}
      />
    </div>
  );
}

/** A typed premium, or nothing when the field is empty or not a price. */
function typedPrice(text: string): number | undefined {
  const value = Number(text.trim());
  return text.trim() !== "" && Number.isFinite(value) && value > 0 ? value : undefined;
}

/** The two prices, seeded by the crossing quote as placeholders, typed over at will. */
function RollPrices({
  closeText,
  openText,
  closeQuote,
  openQuote,
  locked,
  onClose,
  onOpen,
}: {
  readonly closeText: string;
  readonly openText: string;
  readonly closeQuote: number | undefined;
  readonly openQuote: number | undefined;
  readonly locked: boolean;
  readonly onClose: (next: string) => void;
  readonly onOpen: (next: string) => void;
}): ReactElement {
  const closeId = useId();
  const openId = useId();
  const field = (
    id: string,
    label: string,
    text: string,
    quote: number | undefined,
    onChange: (next: string) => void,
  ) => (
    <span className="field tkt-close-price">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={0.01}
        step={0.01}
        inputMode="decimal"
        value={text}
        placeholder={quote !== undefined ? quote.toFixed(2) : "—"}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );
  return (
    <span className="tkt-roll-fields">
      {field(closeId, "Close @", closeText, closeQuote, onClose)}
      {field(openId, "Open @", openText, openQuote, onOpen)}
    </span>
  );
}

function legLine(
  held: HeldContract,
  short: boolean,
  targetStrike: number,
  targetExpiration: string,
  closePrice: number | undefined,
  openPrice: number | undefined,
): string {
  const size = Math.abs(held.contracts);
  const type = held.type === "call" ? "C" : "P";
  const at = (price: number | undefined) => (price !== undefined ? ` @ ${money(price)}` : "");
  return `${short ? "Buy back" : "Sell"} ${size} × $${held.strike}${type} ${held.expiration}${at(closePrice)} · ${short ? "sell" : "buy"} ${size} × $${targetStrike}${type} ${targetExpiration || "…"}${at(openPrice)}`;
}

function RollFields({
  heldChain,
  targetChain,
  targetExpiration,
  targetStrike,
  openSide,
  timeInForce,
  locked,
  onExpiration,
  onStrike,
  onTimeInForce,
}: {
  readonly heldChain: ChainData | undefined;
  readonly targetChain: ChainData | undefined;
  readonly targetExpiration: string;
  readonly targetStrike: number;
  readonly openSide: "bid" | "ask";
  readonly timeInForce: TicketTimeInForce;
  readonly locked: boolean;
  readonly onExpiration: (next: string) => void;
  readonly onStrike: (next: string) => void;
  readonly onTimeInForce: (next: TicketTimeInForce) => void;
}): ReactElement {
  const expId = useId();
  const strikeId = useId();
  return (
    <span className="tkt-roll-fields">
      <span className="field">
        <label htmlFor={expId}>Roll to</label>
        <select
          id={expId}
          value={targetExpiration}
          disabled={!heldChain || locked}
          onChange={(e) => onExpiration(e.target.value)}
        >
          {(heldChain?.expirations ?? []).map((exp) => (
            <option key={exp} value={exp}>
              {formatExpiration(exp)}
            </option>
          ))}
        </select>
      </span>
      <span className="field">
        <label htmlFor={strikeId}>Strike</label>
        <select
          id={strikeId}
          value={String(targetStrike)}
          disabled={!targetChain || locked}
          onChange={(e) => onStrike(e.target.value)}
        >
          {(targetChain?.rows ?? []).map((row) => {
            const price = row[openSide];
            return (
              <option key={row.occSymbol} value={String(row.strike)}>
                ${row.strike}
                {price !== undefined ? ` · ${money(price)}` : ""}
              </option>
            );
          })}
        </select>
      </span>
      <fieldset className="toggle-group tkt-close-type" aria-label="Roll time in force">
        {(Object.keys(TIF_LABELS) as TicketTimeInForce[]).map((tif) => (
          <button
            key={tif}
            type="button"
            aria-pressed={timeInForce === tif}
            disabled={locked}
            onClick={() => onTimeInForce(tif)}
          >
            {TIF_LABELS[tif]}
          </button>
        ))}
      </fieldset>
    </span>
  );
}

function RollAction({
  state,
  timeInForce,
  ready,
  onReview,
  onConfirm,
}: {
  readonly state: RollState;
  readonly timeInForce: TicketTimeInForce;
  readonly ready: boolean;
  readonly onReview: () => void;
  readonly onConfirm: (draft: DraftOrder) => void;
}): ReactElement | null {
  switch (state.step) {
    case "idle":
    case "error":
    case "refused":
      return (
        <>
          <button type="button" className="btn mc-btn" disabled={!ready} onClick={onReview}>
            Review roll…
          </button>
          {state.step === "refused" ? (
            <span className="tkt-close-note gate-refusal">✕ {state.refusals[0]}</span>
          ) : null}
          {state.step === "error" ? (
            <span className="tkt-close-note gate-refusal">{state.message}</span>
          ) : null}
        </>
      );
    case "reviewing":
      return <span className="tkt-close-note">reviewing…</span>;
    case "submitting":
      return <span className="tkt-close-note">rolling…</span>;
    case "reviewed": {
      const net = state.preview.netPremium;
      const loss = state.preview.maxLoss;
      return (
        <button
          type="button"
          className="btn btn-primary mc-btn"
          onClick={() => onConfirm(state.draft)}
        >
          Confirm roll
          {net !== undefined
            ? ` · net ${net >= 0 ? "credit" : "debit"} ${money(Math.abs(net))}`
            : ""}
          {loss === "unlimited" ? " · max loss unlimited" : ` · max loss ${money(loss)}`}
          {` · ${tifLabel(timeInForce)}`}
        </button>
      );
    }
    case "done":
      return (
        <span className="tkt-close-note gate-ok">
          order {state.response.orderId} {state.response.status} — one net limit, both legs
        </span>
      );
  }
}
