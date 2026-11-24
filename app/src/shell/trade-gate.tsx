import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useId, useState } from "react";
import { marketSession } from "../live/market-session";
import type { PlayInfo } from "../live/options";
import type { SentOrder } from "../live/order-receipt";
import { quoteQuery } from "../live/quote-query";
import {
  buildDraft,
  carriesExit,
  carryAcrossSide,
  defaultTimeInForce,
  exitFits,
  money,
  ORDER_TYPE_LABELS,
  orderTypeLabel,
  orderTypeNote,
  orderTypesFor,
  priceFieldsFor,
  reviewTicket,
  submitTicket,
  type TicketCarry,
  type TicketFields,
  type TicketOrderType,
  type TicketPreview,
  type TicketResult,
  type TicketTimeInForce,
  tifLabel,
} from "../live/ticket";
import {
  EXIT_HOURS_NOTE,
  EXIT_TIF_NOTE,
  exitPreviewLines,
  exitReceiptLine,
} from "../live/ticket-exit";
import { ExitFields } from "./exit-fields";
import { DisarmNote, GateHead, keepFocus } from "./gate-frame";
import { LockedPanel } from "./locked-panel";
import { useNow } from "./market-session";
import { OrderReceipt } from "./order-receipt";
import { PriceInput, selectAll } from "./price-input";
import { QuoteHeader } from "./quote-header";
import { RecentOrdersStrip } from "./recent-orders-strip";
import { HeldShares, reviewMissing } from "./share-ticket-hints";
import { SymbolField } from "./symbol-field";
import { TimeInForceField } from "./tif-field";

/**
 * THE PRE-TRADE GATE (#738 phase 2e) — the merge-box state machine on a real ticket.
 *
 *   draft → reviewing → reviewed(ok | refused) → submitting → done(accepted | refused)
 *
 * The one rule that makes it a gate and not a decoration: **approval never outlives the thing it
 * approved.** Any edit while reviewed disarms straight back to draft, and the server re-reviews
 * the LIVE account at submit regardless — a stale mark or a moved position dies there, not here.
 * Refusals are the server's own sentences, rendered verbatim; this component decides nothing.
 */

type GateState =
  | { readonly step: "draft" }
  | { readonly step: "reviewing" }
  | { readonly step: "reviewed"; readonly preview: TicketPreview }
  | { readonly step: "submitting"; readonly preview: TicketPreview }
  /** `sent` rides with an accepted order — what the receipt states (`order-receipt.tsx`). */
  | { readonly step: "done"; readonly result: TicketResult; readonly sent?: SentOrder }
  | { readonly step: "error"; readonly message: string };

/** What the member asked for, echoed back in the review — the order class by its unambiguous name
 *  and every price it carries, so "Stop-Market at $40" is never confused with a limit at $40. */
function OrderLine({ preview }: { readonly preview: TicketPreview }): ReactElement {
  const prices = [
    preview.stopPrice !== undefined ? `stop ${money(preview.stopPrice)}` : "",
    preview.limitPrice !== undefined ? `limit ${money(preview.limitPrice)}` : "",
  ].filter(Boolean);
  // The time in force the server says it will send — never hidden, even when the member left it
  // on the default (#3407 P1: it used to be hard-coded and shown nowhere).
  const tif = tifLabel(preview.timeInForce);
  return (
    <p className="gate-row">
      {orderTypeLabel(preview.orderType)}
      {prices.length ? ` · ${prices.join(" · ")}` : ""}
      {tif ? ` · ${tif}` : ""}
    </p>
  );
}

function PreviewBody({ preview }: { readonly preview: TicketPreview }): ReactElement {
  return (
    <div className="gate-body">
      <OrderLine preview={preview} />
      {preview.exit
        ? exitPreviewLines(preview.exit).map((line) => (
            <p key={line} className="gate-row gate-exit-row">
              {line}
            </p>
          ))
        : null}
      {preview.refusals.map((refusal) => (
        <p key={refusal} className="gate-row gate-refusal">
          ✕ {refusal}
        </p>
      ))}
      {preview.warnings.map((warning) => (
        <p key={warning} className="gate-row gate-warning">
          ⚠ {warning}
        </p>
      ))}
      {preview.ok ? (
        <dl className="gate-est">
          <div>
            <dt>Est. price</dt>
            <dd className="num">{money(preview.estPrice)}</dd>
          </div>
          <div>
            <dt>Est. {preview.action === "buy" ? "cost" : "proceeds"}</dt>
            <dd className="num">{money(preview.estNotional)}</dd>
          </div>
          <div>
            <dt>Est. cash after</dt>
            <dd className="num">{money(preview.estCashAfter)}</dd>
          </div>
          {preview.positionAfter !== undefined ? (
            <div>
              <dt>Position after</dt>
              <dd className="num">{preview.positionAfter}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <DisarmNote />
    </div>
  );
}

/** The review's verdict in words. A buy with no price to cost it never says "all checks passed": the
 *  cash check could not run (#5173), and the headline must not claim it did. */
function readyHeadline(preview: TicketPreview): string {
  if (!preview.ok) return "Refused — the gate explains why";
  if (preview.action === "buy" && preview.estNotional === undefined)
    return "Ready to submit — no price yet, so the cost isn't checked against your cash";
  return "All checks passed — ready to submit";
}

function GateStatus({ state }: { readonly state: GateState }): ReactElement | null {
  if (state.step === "draft") return null;
  if (state.step === "reviewing") return <GateHead tone="checks">Reviewing…</GateHead>;
  if (state.step === "reviewed" || state.step === "submitting")
    return (
      <>
        <GateHead tone={state.preview.ok ? "ready" : "refused"}>
          {readyHeadline(state.preview)}
        </GateHead>
        <PreviewBody preview={state.preview} />
      </>
    );
  if (state.step === "error")
    return <GateHead tone="refused">{`The gate is unreachable — ${state.message}`}</GateHead>;
  // An accepted order renders as the receipt in the form's place (`order-receipt.tsx`).
  if (state.result.ok) return null;
  return (
    <>
      <GateHead tone="refused">The gate refused at submit</GateHead>
      <div className="gate-body">
        {state.result.refusals.map((refusal) => (
          <p key={refusal} className="gate-row gate-refusal">
            ✕ {refusal}
          </p>
        ))}
      </div>
    </>
  );
}

/** When the order works, said before Review: the time in force (or, with an exit, the GTC it is
 *  sent with), how this order type fills with the open a closed market waits for, and — with an
 *  exit — the hours the broker's take-profit and stop act in (#8249). */
function WhenItWorks({
  fields,
  withExit,
  market,
  onTimeInForce,
}: {
  readonly fields: TicketFields;
  readonly withExit: boolean;
  readonly market: ReturnType<typeof marketSession>;
  readonly onTimeInForce: (tif: TicketTimeInForce) => void;
}): ReactElement {
  return (
    <>
      {withExit ? (
        <p className="gate-note">{EXIT_TIF_NOTE}</p>
      ) : (
        <TimeInForceField
          fallback={defaultTimeInForce(fields.orderType)}
          value={fields.timeInForce}
          onChange={onTimeInForce}
        />
      )}
      <p className="gate-note">{orderTypeNote(fields.orderType, market)}</p>
      {withExit ? <p className="gate-note">{EXIT_HOURS_NOTE}</p> : null}
    </>
  );
}

/** @category trading */
export function TradeGate({
  deskId,
  initialAction = "buy",
  showSide = true,
  play,
  initialSymbol,
  onSymbolCommit,
  header,
  carried,
  onCarry,
  exitAtEntry = false,
}: {
  readonly deskId: string;
  /** `?play=102` preselects Sell — the catalog's stock rungs are the same gate, sided. */
  readonly initialAction?: "buy" | "sell";
  /** False on `/trade`, where the ticket's own nav (#1461) already carries Buy / Sell. */
  readonly showSide?: boolean;
  /**
   * The resolved rung, when the caller has it (#1461's ladder-lock fix, 2026-09-06). Stock plays
   * were never checked here — only the options ticket rendered its locked panel — so 102 opened a
   * fully working sell ticket before 101 was ever earned, in spite of `unlockedCodes` correctly
   * saying it was locked. Undefined callers (none today) get the old, unchecked behavior.
   */
  readonly play?: PlayInfo;
  /** `?symbol=` (#2017 cockpit plan) — seeds the symbol field on mount so a remount (every
   *  Instrument/Side switch keys this component fresh) doesn't drop a hand-typed symbol. */
  readonly initialSymbol?: string;
  /** Fires when the symbol field commits, so the route can keep `?symbol=` in sync. */
  readonly onSymbolCommit?: (symbol: string) => void;
  /** Account/Rung/Instrument-Side-Type — one card, not two (Eric, 2026-09-22). Forwarded to the
   *  locked branch below too, so a locked stock rung explains itself on the same card. */
  readonly header?: ReactElement;
  /** What the ticket on the other side held when the member flipped Buy ⇄ Sell, which remounts this
   *  one (`carryAcrossSide` says what goes and what never does). */
  readonly carried?: TicketCarry;
  /** Reports the carry on every edit, so the next flip can hand it back; undefined once an order
   *  was sent, since its entries belonged to that order. */
  readonly onCarry?: (carry: TicketCarry | undefined) => void;
  /** The exit-at-entry setting admits this session (#8249, `/api/trade/plays`): Stop-Limit joins
   *  the order types and a limit buy offers "Add an exit". False, the form is exactly as before. */
  readonly exitAtEntry?: boolean;
}): ReactElement {
  const [fields, setFields] = useState<TicketFields>(() => ({
    symbol: initialSymbol ?? "",
    quantity: carried?.quantity ?? "",
    action: initialAction,
    orderType: carried?.priced?.orderType ?? "market",
    limitPrice: carried?.priced?.limitPrice ?? "",
    stopPrice: "",
    ...(carried?.timeInForce ? { timeInForce: carried.timeInForce } : {}),
  }));
  const [state, setState] = useState<GateState>({ step: "draft" });
  const queryClient = useQueryClient();
  /** The quote header's own committed symbol (#2017 Phase 0.9) — fetches on COMMIT only, never a
   *  keystroke, mirroring the chain fetch's `chainSym` on the options ticket. */
  const [quoteSym, setQuoteSym] = useState(initialSymbol ?? "");
  /** LIMIT AT MID (#3407 slice 6 — Eric, 2026-09-22: "limit at mid — it's standard behavior").
   *  The same quote the header shows (one query, `quoteQuery`) seeds the ticket: once a committed
   *  symbol's NBBO arrives, the order type becomes Limit at the cent-rounded mid and TIF falls to
   *  GTC (`defaultTimeInForce`) — an entry that waits for the price instead of paying the spread,
   *  the habit this app exists to teach. Two guards keep it a seed and not a hand on the wheel:
   *  it never overwrites a type or price the member has touched (`priced`), and a quote with no
   *  live book leaves the ticket exactly as it was (Market, the honest default when there is no
   *  mid to name). `seed` remembers what was seeded so the note below can say so — and so the
   *  note disappears the moment the member edits the price.
   *
   *  ONCE PER COMMITTED SYMBOL, not once per mid (#3407 P4, the quote stream). The guard used to
   *  re-seed whenever the mid moved, which was invisible while the quote was fetched once and then
   *  sat still. With the quote pushed on the market's clock it would rewrite the member's limit on
   *  every tick — a ticket that chases the market while they read it, which is the "hand on the
   *  wheel" this seed is explicitly not allowed to be. One seed per symbol; a new symbol seeds
   *  again, a moving mid never does. */
  const quote = useQuery(quoteQuery(quoteSym));
  const [priced, setPriced] = useState(carried?.priced !== undefined);
  const [seed, setSeed] = useState<{ symbol: string; bid: number; ask: number; mid: number }>();
  const mid = quote.data && "mid" in quote.data ? quote.data : undefined;
  useEffect(() => {
    if (priced || !mid || mid.mid === undefined || mid.bid === undefined || mid.ask === undefined)
      return;
    if (seed?.symbol === mid.symbol) return;
    const { symbol, bid, ask } = mid;
    setSeed({ symbol, bid, ask, mid: mid.mid });
    setFields((f) => ({ ...f, orderType: "limit", limitPrice: mid.mid?.toFixed(2) ?? "" }));
  }, [priced, mid, seed]);
  const orderSent = state.step === "done" && state.result.ok;
  useEffect(() => {
    onCarry?.(orderSent ? undefined : carryAcrossSide(fields, priced));
  }, [onCarry, orderSent, fields, priced]);
  /** The topbar's own clock (#6257): the order-type note says which open a closed market waits for. */
  const market = marketSession(useNow());
  const symId = useId();
  const qtyId = useId();
  const sideId = useId();
  const typeId = useId();
  const priceId = useId();
  const whyId = useId();

  const draft = () => buildDraft(deskId, fields, exitAtEntry);
  /** The exit rides this draft (`carriesExit`): the form shows its fields, notes and GTC line. */
  const withExit = carriesExit(fields, exitAtEntry);

  /** Any edit disarms a standing review — straight back to draft. Changing the order type counts:
   *  a review of a market order says nothing about the stop order that replaced it. */
  const edit =
    <K extends keyof TicketFields>(key: K) =>
    (value: TicketFields[K]) => {
      setFields((f) => ({ ...f, [key]: value }));
      setState((s) => (s.step === "reviewed" || s.step === "done" ? { step: "draft" } : s));
    };

  const priceFields = priceFieldsFor(fields.orderType);
  /** A hand on the type or the price ends the seeding for this ticket (see `priced`). */
  const seeded =
    seed !== undefined && fields.orderType === "limit" && fields.limitPrice === seed.mid.toFixed(2);
  const price =
    <K extends "orderType" | "limitPrice" | "stopPrice">(key: K) =>
    (value: TicketFields[K]) => {
      setPriced(true);
      edit(key)(value);
      // A stop-limit's limit is set against its stop (#8249): the mid seeded for a plain limit is
      // not the member's number there, so switching to Stop-Limit clears it rather than keep it.
      if (key === "orderType" && value === "stop_limit" && seeded) edit("limitPrice")("");
    };

  const review = async () => {
    // The Review button keeps focus (`keepFocus`), so a symbol typed and never blurred commits
    // here — the quote header and `?symbol=` land exactly as the blur would have left them.
    const typed = fields.symbol.trim().toUpperCase();
    if (typed !== "" && typed !== quoteSym) {
      setQuoteSym(typed);
      onSymbolCommit?.(typed);
    }
    setState({ step: "reviewing" });
    try {
      const { preview } = await reviewTicket(draft());
      setState({ step: "reviewed", preview });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  const submit = async (preview: TicketPreview) => {
    setState({ step: "submitting", preview });
    try {
      const result = await submitTicket(draft());
      if (!result.ok) {
        setState({ step: "done", result });
        return;
      }
      // The receipt states the order as the server reviewed it — its side, size and prices.
      const sent: SentOrder = {
        orderId: result.orderId,
        status: result.status,
        symbol: result.symbol,
        side: preview.action,
        quantity: preview.quantity,
        unit: "shares",
        orderType: preview.orderType,
        ...(preview.limitPrice === undefined ? {} : { limitPrice: preview.limitPrice }),
        ...(preview.stopPrice === undefined ? {} : { stopPrice: preview.stopPrice }),
        timeInForce: result.timeInForce ?? preview.timeInForce,
      };
      setState({ step: "done", result, sent });
      // The order list (#3407 P1 slice 2) reads the broker; the receipt finds the order there at
      // once, and the Orders pane shows it on the same visit.
      await queryClient.invalidateQueries({ queryKey: ["desk-orders", deskId] });
      // A sell's "You hold" line reads the positions, which the fill moves.
      void queryClient.invalidateQueries({ queryKey: ["desk", deskId] });
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  /** "New ticket" on the receipt: the order's entries clear and the symbol (the page's context,
   *  in the URL) stays — the limit re-seeds at the mid on the next quote, as on a fresh ticket. */
  const newTicket = () => {
    setFields((f) => ({
      symbol: f.symbol,
      quantity: "",
      action: f.action,
      orderType: "market",
      limitPrice: "",
      stopPrice: "",
    }));
    setPriced(false);
    setSeed(undefined);
    setState({ step: "draft" });
  };

  if (play?.locked) return <LockedPanel header={header} play={play} />;

  const busy = state.step === "reviewing" || state.step === "submitting";
  const missing = busy ? undefined : reviewMissing(fields);
  const sent = state.step === "done" && state.result.ok ? state.sent : undefined;
  /** A bracket's exits as the broker echoed them (#8249) — the receipt's extra line. */
  const sentExits = state.step === "done" && state.result.ok ? state.result.exits : undefined;
  const form = (
    <>
      <div className="gate-fields">
        <SymbolField
          id={symId}
          label="Symbol"
          value={fields.symbol}
          placeholder="AAPL"
          maxLength={8}
          onChange={edit("symbol")}
          onCommit={(s) => {
            edit("symbol")(s);
            setQuoteSym(s.trim().toUpperCase());
            onSymbolCommit?.(s);
          }}
        />
        <div className="field">
          <label htmlFor={qtyId}>Shares</label>
          <input
            id={qtyId}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={fields.quantity}
            placeholder="e.g. 10"
            onFocus={selectAll}
            onChange={(e) => edit("quantity")(e.target.value)}
          />
        </div>
        {showSide ? (
          <div className="field">
            <label htmlFor={sideId}>Side</label>
            <select
              id={sideId}
              value={fields.action}
              onChange={(e) => edit("action")(e.target.value as "buy" | "sell")}
            >
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>
        ) : null}
        <div className="field">
          <label htmlFor={typeId}>Order type</label>
          <select
            id={typeId}
            value={fields.orderType}
            onChange={(e) => price("orderType")(e.target.value as TicketOrderType)}
          >
            {/* A stop-limit the ticket already holds (a setting turned off mid-visit) stays
                listed, so the picker never shows a type other than the one that would be sent. */}
            {orderTypesFor(exitAtEntry || fields.orderType === "stop_limit").map((type) => (
              <option key={type} value={type}>
                {ORDER_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        {priceFields.map((priceField) => (
          <PriceInput
            key={priceField}
            id={`${priceId}-${priceField}`}
            label={priceField === "stopPrice" ? "Stop price" : "Limit price"}
            value={fields[priceField]}
            onChange={price(priceField)}
            placeholder="40.00"
          />
        ))}
      </div>
      {exitAtEntry && exitFits(fields) ? (
        <ExitFields exit={fields.exit} onChange={edit("exit")} />
      ) : null}
      {fields.action === "sell" ? (
        <HeldShares deskId={deskId} symbol={quoteSym} onSellAll={edit("quantity")} />
      ) : null}
      {seeded && seed ? (
        <p className="gate-note gate-note-seed">
          Limit seeded at the mid — {money(seed.mid)}, between the {money(seed.bid)} bid and the{" "}
          {money(seed.ask)} ask. Edit it, or switch the order type to Market.
        </p>
      ) : null}
      <WhenItWorks
        fields={fields}
        withExit={withExit}
        market={market}
        onTimeInForce={edit("timeInForce")}
      />

      {/* Instrument-agnostic (task 3a, unlike the options-chain-only earnings badge/wire-row) —
          this stock ticket gets its own compact "here's what you've done" strip, same relative
          position (right before the status block) as the options ticket's own intel elements. */}
      <RecentOrdersStrip symbol={quoteSym} deskId={deskId} />

      <div className="gate" aria-live="polite">
        <GateStatus state={state} />
      </div>

      {state.step === "reviewed" && state.preview.ok ? (
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onMouseDown={keepFocus}
          onClick={() => submit(state.preview)}
        >
          Submit order{state.preview.estNotional ? ` — ${money(state.preview.estNotional)}` : ""}
        </button>
      ) : state.step === "done" ? (
        // Only a refusal at submit is left here — the entries stayed for the fix.
        <button type="button" className="btn" onClick={() => setState({ step: "draft" })}>
          Edit and review again
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy || missing !== undefined}
          aria-describedby={missing ? whyId : undefined}
          onMouseDown={keepFocus}
          onClick={review}
        >
          {state.step === "reviewing" ? "Reviewing…" : "Review order"}
        </button>
      )}
      {missing ? (
        <p id={whyId} className="gate-why">
          {missing}
        </p>
      ) : null}
    </>
  );
  return (
    <section className="panel gate-panel" aria-label="New trade">
      {header}
      <h2 className="panel-title">New trade</h2>
      <p className="panel-sub">
        {exitAtEntry
          ? "Paper account · market, limit, stop or stop-limit · the gate reviews before anything is sent"
          : "Paper account · market, limit or stop · the gate reviews before anything is sent"}
      </p>
      <QuoteHeader symbol={quoteSym} />
      {/* Sent, the form steps aside for the receipt — an order that went out never sits under
          fields that still hold it (Eric, 2026-11-06). */}
      {sent ? (
        <OrderReceipt deskId={deskId} order={sent} onNewTicket={newTicket}>
          {sentExits ? <p className="gate-note">{exitReceiptLine(sentExits)}</p> : null}
        </OrderReceipt>
      ) : (
        form
      )}
    </section>
  );
}
