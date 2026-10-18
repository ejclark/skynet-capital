import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import type { DeskPosition } from "../live/desk";
import {
  fetchChain,
  type OptionDraft,
  type OptionPreview,
  reviewOption,
  submitOption,
} from "../live/options";
import {
  type ActVerb,
  actFigures,
  actLine,
  actVerb,
  dollars,
  type LimitSeed,
  optionLimitSeed,
  riskAfter,
  sharesLimitSeed,
  signedMoney,
} from "../live/position-act";
import { held, parseQuantity } from "../live/quantity";
import { CONFIDENCE_METER, type RowCall } from "../live/row-call";
import {
  money,
  reviewTicket,
  submitTicket,
  TIF_LABELS,
  type TicketDraft,
  type TicketPreview,
  type TicketResult,
  type TicketTimeInForce,
  tifLabel,
} from "../live/ticket";
import { InlineResult } from "../ui";
import { closeRefusal, optionCloseWords } from "./close-panel";
import { plural } from "./position-row-spec";
import { RollRow } from "./roll-row";

/**
 * ACT IN THE ROW (#5070 slice 3; round 2 of #5037, R2's depth ladder step 3). Inside a position's
 * opened guidance: **Buy back · Roll · Not now** (a bought option or shares: **Sell**). The steps
 * before the risky one stay rich and in place (Eric, 4012b085: "a modal only at the risky decision,
 * as a minimal recap; the steps before it stay richer and non-modal"):
 *  - Buy back turns the row into a prefilled ticket — every contract held, a limit at the mid of the
 *    quote, good for today — with one line of what it does: "Cash out $550 · locks in −$295 · frees
 *    $8,000";
 *  - Review buy-back asks the server first, then opens the page's one modal, the recap: You pay ·
 *    Locks in · Frees · Risk after · and the guidance read, when this browser has one — then Back or
 *    Place buy-back. A refusal stays in the row; the modal only ever shows an order that can go;
 *  - Roll opens the existing one-ticket roll in place (`roll-row.tsx`), next expiry, same strike.
 * The orders are the desk's existing paths (`close-panel.tsx`'s close, the draft route's roll), so
 * every server check still applies. Owner only: the slot draws none of this off your own account.
 * "Proves it wrong" joins the recap with the sold-option manage call (slice 5), which owns it.
 */

const unit = (position: DeskPosition) => (position.isOption ? "contract" : "share");

/** The account's caches the close touches, as `ClosePanel` and the roll refresh them. */
function useRefresh(deskId: string): () => void {
  const queryClient = useQueryClient();
  return () => {
    for (const key of ["desk", "desk-activity", "option-positions"]) {
      void queryClient.invalidateQueries({ queryKey: [key, deskId] });
    }
    void queryClient.invalidateQueries({ queryKey: ["accounts-networth"] });
  };
}

/** The limit the ticket opens with: an option's from its own chain — the cache the picture and the
 *  roll already key this way, read once the ticket opens — and shares' from today's price. */
function useLimitSeed(position: DeskPosition, verb: ActVerb): LimitSeed | undefined {
  const occ = parseOccSymbol(position.symbol);
  const chain = useQuery({
    queryKey: ["chain", occ?.underlying ?? "", occ?.type ?? "call", occ?.expiration ?? ""],
    queryFn: () => fetchChain(occ?.underlying ?? "", occ?.type ?? "call", occ?.expiration),
    enabled: occ !== undefined,
    staleTime: 5 * 60_000,
  });
  if (!occ) return sharesLimitSeed(position);
  if (chain.isPending) return undefined;
  const data = chain.data && !("chainNote" in chain.data) ? chain.data : undefined;
  const row =
    data?.expiration === occ.expiration
      ? data.rows.find((r) => r.strike === occ.strike)
      : undefined;
  return optionLimitSeed(row, verb.pays);
}

/** A typed price, or nothing when the field is empty or not a price. */
function typedPrice(text: string): number | undefined {
  const value = Number(text.trim());
  return text.trim() !== "" && Number.isFinite(value) && value > 0 ? value : undefined;
}

interface Order {
  readonly count: number;
  readonly limit: number;
  readonly timeInForce: TicketTimeInForce;
}

type Step =
  | { readonly step: "editing" }
  | { readonly step: "reviewing" }
  | {
      readonly step: "recap";
      readonly order: Order;
      readonly preview: TicketPreview | OptionPreview;
    }
  | {
      readonly step: "submitting";
      readonly order: Order;
      readonly preview: TicketPreview | OptionPreview;
    }
  | { readonly step: "done"; readonly result: TicketResult }
  | { readonly step: "error"; readonly message: string };

function optionDraft(deskId: string, position: DeskPosition, order: Order): OptionDraft {
  return {
    kind: "close",
    participantId: deskId,
    occSymbol: position.symbol,
    contracts: order.count,
    orderType: "limit",
    limitPrice: order.limit,
    timeInForce: order.timeInForce,
  };
}

function ticketDraft(deskId: string, position: DeskPosition, order: Order): TicketDraft {
  return {
    participantId: deskId,
    symbol: position.symbol,
    quantity: order.count,
    action: "sell",
    orderType: "limit",
    limitPrice: order.limit,
    timeInForce: order.timeInForce,
  };
}

/** The server's own words for what it will send: "Buy to close 1 contract · limit $5.50 · Day". */
function sentWords(preview: TicketPreview | OptionPreview): string {
  const what =
    "positionIntent" in preview
      ? optionCloseWords(preview)
      : `Sell ${plural(preview.quantity, "share")}`;
  const limit = preview.limitPrice !== undefined ? ` · limit ${money(preview.limitPrice)}` : "";
  return `${what}${limit} · ${tifLabel(preview.timeInForce) ?? preview.timeInForce}`;
}

/**
 * THE RECAP — the page's only modal. A native `<dialog>` opened with `showModal()`, as
 * `calendar-sheet.tsx` does it: focus moves in, Escape and a backdrop tap are Back. It shows what
 * the server reviewed, never a re-typed figure.
 */
function Recap({
  position,
  positions,
  verb,
  order,
  preview,
  call,
  busy,
  onBack,
  onPlace,
}: {
  readonly position: DeskPosition;
  readonly positions: readonly DeskPosition[];
  readonly verb: ActVerb;
  readonly order: Order;
  readonly preview: TicketPreview | OptionPreview;
  readonly call?: RowCall;
  readonly busy: boolean;
  readonly onBack: () => void;
  readonly onPlace: () => void;
}): ReactElement {
  const sheet = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = sheet.current;
    if (!dialog || dialog.open) return;
    // A host without the modal API (a test DOM) still gets an open recap.
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, []);
  const figures = actFigures(position, positions, order.count, order.limit, preview.estNotional);
  // [term, what it says, is it a figure?] — a figure takes the number face; a sentence doesn't.
  const rows: [string, string, boolean][] = figures
    ? [
        [verb.pays ? "You pay" : "You get", dollars(figures.cash), true],
        ["Locks in", signedMoney(figures.locksIn), true],
        ...(figures.frees ? [["Frees", figures.frees, true] as [string, string, boolean]] : []),
        ["Risk after", riskAfter(position, figures.left), false],
      ]
    : [];
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: the backdrop tap's keyboard twin is Escape, which the native modal already handles (and Back is a real button).
    <dialog
      ref={sheet}
      className="pos-recap"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onBack();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onBack();
      }}
    >
      <div className="pos-recap-body">
        <h2 id={titleId} className="pos-recap-h">
          {verb.verb} {position.display}
        </h2>
        <p className="pos-recap-sent num">{sentWords(preview)}</p>
        <dl className="pos-recap-list">
          {rows.map(([term, said, figure]) => (
            <div key={term} className="pos-recap-row">
              <dt>{term}</dt>
              <dd className={figure ? "num" : "pos-recap-words"}>{said}</dd>
            </div>
          ))}
          {call ? (
            <div className="pos-recap-row">
              <dt>Guidance said</dt>
              <dd>
                {call.word} ·{" "}
                <span className="pos-guide-meter" aria-hidden="true">
                  {CONFIDENCE_METER[call.confidence]}{" "}
                </span>
                {call.confidence} confidence, read at {call.readAt}
              </dd>
            </div>
          ) : null}
        </dl>
        {preview.warnings && preview.warnings.length > 0 ? (
          <p className="pos-recap-warn">{preview.warnings[0]}</p>
        ) : null}
        <div className="pos-recap-acts">
          <button type="button" className="btn mc-btn" disabled={busy} onClick={onBack}>
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary mc-btn"
            disabled={busy}
            onClick={onPlace}
          >
            {busy ? "Placing…" : `Place ${verb.noun}`}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** The row as a prefilled ticket: how many, the limit and where it came from, how long it lasts,
 *  and one line of what it does — then Review, which asks the server before the recap opens. */
function CloseTicket({
  deskId,
  position,
  positions,
  verb,
  call,
  onCancel,
}: {
  readonly deskId: string;
  readonly position: DeskPosition;
  readonly positions: readonly DeskPosition[];
  readonly verb: ActVerb;
  readonly call?: RowCall;
  readonly onCancel: () => void;
}): ReactElement {
  const refresh = useRefresh(deskId);
  const countId = useId();
  const limitId = useId();
  const total = held(position.quantity).count;
  const [countText, setCountText] = useState(String(total));
  const [limitText, setLimitText] = useState<string | undefined>(undefined);
  const [timeInForce, setTimeInForce] = useState<TicketTimeInForce>("day");
  const [state, setState] = useState<Step>({ step: "editing" });
  const seed = useLimitSeed(position, verb);
  const shownLimit = limitText ?? (seed?.price !== undefined ? seed.price.toFixed(2) : "");
  const count = parseQuantity(countText);
  const limit = typedPrice(shownLimit);
  const figures =
    Number.isInteger(count) && limit !== undefined
      ? actFigures(position, positions, count, limit)
      : undefined;
  const busy = state.step === "reviewing" || state.step === "submitting";
  const done = state.step === "done" && state.result.ok;

  const review = async (order: Order) => {
    setState({ step: "reviewing" });
    try {
      const { preview } = position.isOption
        ? await reviewOption(optionDraft(deskId, position, order))
        : await reviewTicket(ticketDraft(deskId, position, order));
      setState(
        preview.ok
          ? { step: "recap", order, preview }
          : { step: "error", message: preview.refusals[0] ?? "The order was refused." },
      );
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  // Place sends exactly the order the recap showed: the count and limit fixed at Review.
  const place = async (order: Order, preview: TicketPreview | OptionPreview) => {
    setState({ step: "submitting", order, preview });
    try {
      const result = position.isOption
        ? await submitOption(optionDraft(deskId, position, order))
        : await submitTicket(ticketDraft(deskId, position, order));
      setState({ step: "done", result });
      if (result.ok) refresh();
    } catch (error) {
      setState({ step: "error", message: String(error) });
    }
  };

  const recap = state.step === "recap" || state.step === "submitting" ? state : undefined;
  return (
    <section className="pos-tkt" aria-label={`${verb.verb} ${position.display}`}>
      <div className="pos-tkt-fields">
        <span className="field pos-tkt-count">
          <label htmlFor={countId}>{verb.verb}</label>
          <input
            id={countId}
            type="number"
            inputMode="numeric"
            min={1}
            max={total}
            step={1}
            value={countText}
            disabled={busy || done}
            onChange={(e) => setCountText(e.target.value)}
          />
          <span className="pos-tkt-of">
            of {total.toLocaleString("en-US")} {unit(position)}
            {total === 1 ? "" : "s"}
          </span>
        </span>
        <span className="field pos-tkt-limit">
          <label htmlFor={limitId}>Limit $</label>
          <input
            id={limitId}
            type="number"
            inputMode="decimal"
            min={0.01}
            step={0.01}
            value={shownLimit}
            placeholder="—"
            disabled={busy || done}
            onChange={(e) => setLimitText(e.target.value)}
          />
          <span className="pos-tkt-src">
            {limitText !== undefined ? "your limit" : seed ? seed.source : "reading the quote…"}
          </span>
        </span>
        <fieldset className="toggle-group pos-tkt-tif" aria-label="How long the order lasts">
          {(Object.keys(TIF_LABELS) as TicketTimeInForce[]).map((tif) => (
            <button
              key={tif}
              type="button"
              aria-pressed={timeInForce === tif}
              disabled={busy || done}
              onClick={() => setTimeInForce(tif)}
            >
              {tif === "day" ? "Today" : TIF_LABELS[tif]}
            </button>
          ))}
        </fieldset>
      </div>
      <p className="pos-tkt-line num">
        {figures
          ? actLine(figures, verb)
          : `Set how many (1–${total}) and a limit to see the cash.`}
      </p>
      {done ? null : (
        <div className="pos-tkt-acts">
          <button
            type="button"
            className="btn btn-primary mc-btn"
            disabled={busy || !figures || limit === undefined}
            onClick={() => limit !== undefined && void review({ count, limit, timeInForce })}
          >
            {state.step === "reviewing" ? "Reviewing…" : `Review ${verb.noun}`}
          </button>
          <button type="button" className="btn mc-btn" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        </div>
      )}
      {state.step === "error" ? (
        <InlineResult as="p" tone="err" className="pos-tkt-note">
          {state.message}
        </InlineResult>
      ) : null}
      {state.step === "done" ? (
        state.result.ok ? (
          <InlineResult as="p" tone="ok" className="pos-tkt-note">
            Order {state.result.orderId} {state.result.status}.
          </InlineResult>
        ) : (
          <InlineResult as="p" tone="err" className="pos-tkt-note">
            {state.result.refusals[0]}
          </InlineResult>
        )
      ) : null}
      {recap ? (
        <Recap
          position={position}
          positions={positions}
          verb={verb}
          order={recap.order}
          preview={recap.preview}
          {...(call ? { call } : {})}
          busy={recap.step === "submitting"}
          onBack={() => setState({ step: "editing" })}
          onPlace={() => void place(recap.order, recap.preview)}
        />
      ) : null}
    </section>
  );
}

export function PositionActs({
  deskId,
  position,
  positions,
  call,
  aside,
}: {
  readonly deskId: string;
  readonly position: DeskPosition;
  /** The account's positions: what a close frees depends on what else is held. */
  readonly positions: readonly DeskPosition[];
  readonly call?: RowCall;
  /** Not now, when the row's mark can step aside: the tap, and its return condition in words. */
  readonly aside?: { readonly when: string; readonly onAside: () => void };
}): ReactElement {
  const [mode, setMode] = useState<"row" | "close" | "roll">("row");
  const refresh = useRefresh(deskId);
  const whyId = useId();
  const verb = actVerb(position);
  const refusal = closeRefusal(position);
  if (mode === "close" && verb) {
    return (
      <CloseTicket
        deskId={deskId}
        position={position}
        positions={positions}
        verb={verb}
        {...(call ? { call } : {})}
        onCancel={() => setMode("row")}
      />
    );
  }
  if (mode === "roll") {
    return (
      <section className="pos-tkt" aria-label={`Roll ${position.display}`}>
        <RollRow deskId={deskId} position={position} onFilled={refresh} />
        <div className="pos-tkt-acts">
          <button type="button" className="btn mc-btn" onClick={() => setMode("row")}>
            Cancel
          </button>
        </div>
      </section>
    );
  }
  return (
    <div className="pos-act">
      <div className="pos-act-row">
        {verb ? (
          <button
            type="button"
            className="pos-guide-btn pos-act-btn"
            onClick={() => setMode("close")}
          >
            {verb.verb}
          </button>
        ) : (
          <button
            type="button"
            className="pos-guide-btn pos-act-btn"
            disabled
            aria-describedby={whyId}
          >
            Close
          </button>
        )}
        {position.isOption ? (
          <button
            type="button"
            className="pos-guide-btn pos-act-btn"
            onClick={() => setMode("roll")}
          >
            Roll
          </button>
        ) : null}
        {aside ? (
          <button type="button" className="pos-guide-btn" onClick={aside.onAside}>
            Not now
          </button>
        ) : null}
      </div>
      {refusal ? (
        <p id={whyId} className="pos-guide-when">
          {refusal}
        </p>
      ) : null}
      {aside ? <p className="pos-guide-when">{aside.when}</p> : null}
    </div>
  );
}
