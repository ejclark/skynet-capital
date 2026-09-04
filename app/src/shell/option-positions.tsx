import { useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import type { DeskPosition } from "../live/desk";
import { type OptionPreview, reviewOption, submitOption } from "../live/options";
import { money, type TicketResult } from "../live/ticket";

/**
 * CLOSING FROM THE TICKET (#738 phase 10b) — the capability the legacy blotter's Close posts
 * provided, in the shell: the desk's held option contracts, each with the same review-then-
 * confirm discipline as every order. Direction and size resolve SERVER-side from the live
 * holding (a long closes with a sell, a written contract with a buy), so one button is always
 * the right direction — this component only shows what the desk answered.
 */

type RowState =
  | { readonly step: "idle" }
  | { readonly step: "reviewing" }
  | { readonly step: "reviewed"; readonly preview: OptionPreview }
  | { readonly step: "submitting" }
  | { readonly step: "done"; readonly result: TicketResult }
  | { readonly step: "error"; readonly message: string };

function CloseRow({
  deskId,
  position,
  onFilled,
}: {
  readonly deskId: string;
  readonly position: DeskPosition;
  readonly onFilled: () => void;
}): ReactElement {
  const [state, setState] = useState<RowState>({ step: "idle" });
  const draft = { kind: "close" as const, participantId: deskId, occSymbol: position.symbol };

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
    <div className="tkt-close-row">
      <span className="tkt-close-main">
        {position.display} <small className="num">{position.symbol}</small>
      </span>
      <span className="num">{position.quantity}</span>
      <span className="num">{position.value}</span>
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
    </div>
  );
}

/** The desk's held option contracts, or nothing — a desk with no options shows no card.
 *
 *  @category trading
 */
export function OptionPositionsCard({
  deskId,
  positions,
}: {
  readonly deskId: string;
  readonly positions: readonly DeskPosition[];
}): ReactElement | null {
  const queryClient = useQueryClient();
  const held = positions.filter((p) => p.isOption);
  if (held.length === 0) return null;
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["desk", deskId] });
  return (
    <section className="panel gate-panel" aria-label="Option positions">
      <h2 className="panel-title">Option positions</h2>
      <p className="panel-sub">
        Held contracts on this desk — Close reviews first, and the desk works out the direction from
        the live holding.
      </p>
      <div className="tkt-close-rows">
        {held.map((position) => (
          <CloseRow key={position.symbol} deskId={deskId} position={position} onFilled={refresh} />
        ))}
      </div>
    </section>
  );
}
