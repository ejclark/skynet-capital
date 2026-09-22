import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import type { DraftLeg, NewLeg } from "../live/draft-order";
import { type ChainData, fetchChain } from "../live/options";
import { formatExpiration } from "../live/straddle";
import { ChainStraddle } from "./chain-straddle";
import { DraftLegFields } from "./draft-leg-fields";
import type { PickedCell } from "./straddle-view";

/**
 * THE "ADD LEG" FORM (#582 slice 4; #3407 P3 slice 2) — split out of `DraftOrderBuilder` so that
 * component stays under the house's complexity budget. Emits a finished `NewLeg` to the parent,
 * which is the only thing that talks to the draft's state machine.
 *
 * THE CHAIN IS THE LEG PICKER (P3 slice 2; the study's row "spread legs via dropdowns"): once a
 * symbol resolves a chain, the same straddle view the single-leg ticket uses renders here with
 * both sides, and a tap on a price cell IS the leg — Fidelity's grammar, borrowed whole: tap a
 * **Bid** to sell that contract, an **Ask** to buy it; the tapped price seeds the leg's limit (a
 * spread goes to the broker as one net limit, so every leg needs one — a "—" cell falls back to
 * the row's mid). Strikes the draft already holds are outlined on the chain, so a vertical reads
 * as two marked rows. The typed fields (`DraftLegFields`) remain for a symbol with no chain.
 * @category trading
 */

export function DraftLegForm({
  busy,
  legs = [],
  onAdd,
  initialSymbol,
  initialExpiration,
}: {
  readonly busy: boolean;
  /** The draft's legs so far — their strikes are marked on the chain. */
  readonly legs?: readonly DraftLeg[];
  readonly onAdd: (leg: NewLeg) => void;
  /** Carried over from the single-leg ticket's own `tkt-spread-cta` (`option-gate.tsx`) — seeds
   *  both the field and the chain fetch on mount, same seeding idiom `option-gate.tsx`'s own
   *  `initialSymbol` already uses, so the chain is up and tappable immediately instead of making
   *  the member retype the underlying they just picked. */
  readonly initialSymbol?: string;
  readonly initialExpiration?: string;
}): ReactElement {
  const [symbol, setSymbol] = useState(initialSymbol ?? "");
  const [chainSym, setChainSym] = useState(initialSymbol ?? "");
  const [expiration, setExpiration] = useState(initialExpiration ?? "");
  const [contracts, setContracts] = useState("1");

  const symId = useId();
  const expId = useId();
  const qtyId = useId();

  const chain = useQuery({
    queryKey: ["chain", chainSym, "call", expiration],
    queryFn: () => fetchChain(chainSym, "call", expiration || undefined),
    enabled: chainSym !== "",
    // Same fix as the single-leg ticket (`option-gate.tsx`, Eric, 2026-09-22): keep the outgoing
    // expiration's rows on screen while the new one loads, instead of the table collapsing and
    // snapping back at a different height on every expiration switch.
    placeholderData: keepPreviousData,
  });
  const chainData: ChainData | undefined =
    chain.data && !("chainNote" in chain.data) ? chain.data : undefined;

  const underlying = (chainSym || symbol).trim().toUpperCase();
  const qty = Number(contracts);
  const sized = Number.isInteger(qty) && qty > 0;

  /** A tap on a price cell is a leg: bid sells, ask buys, the shown price is the limit. */
  const pickCell = (strike: number, side: "call" | "put", cell: PickedCell) => {
    if (!(chainData && sized) || busy) return;
    const limit = cell.value ?? chainData.rows.find((r) => r.strike === strike)?.premium;
    onAdd({
      underlying,
      optionType: side,
      strike,
      expiration: chainData.expiration,
      action: cell.price === "bid" ? "sell" : "buy",
      contracts: qty,
      ...(limit !== undefined ? { limitPrice: limit } : {}),
    });
  };

  const markedStrikes = chainData
    ? legs
        .filter((leg) => leg.underlying === underlying && leg.expiration === chainData.expiration)
        .map((leg) => leg.strike)
    : [];

  return (
    <>
      <div className="gate-fields">
        <div className="field symbol-field">
          <label htmlFor={symId}>Underlying</label>
          <input
            id={symId}
            value={symbol}
            placeholder="NVDA"
            maxLength={12}
            spellCheck={false}
            onChange={(e) => setSymbol(e.target.value)}
            onBlur={() => setChainSym(symbol.trim().toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") setChainSym(symbol.trim().toUpperCase());
            }}
          />
        </div>
        <div className="field">
          <label htmlFor={expId}>Expiration</label>
          {chainData ? (
            <select
              id={expId}
              value={chainData.expiration}
              onChange={(e) => setExpiration(e.target.value)}
            >
              {chainData.expirations.map((exp) => (
                <option key={exp} value={exp}>
                  {formatExpiration(exp)}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={expId}
              type="date"
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
            />
          )}
        </div>
        <div className="field">
          <label htmlFor={qtyId}>Contracts</label>
          <input
            id={qtyId}
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={contracts}
            onChange={(e) => setContracts(e.target.value)}
          />
        </div>
      </div>
      {chainData ? (
        <>
          <p className="tkt-note draft-pick-note">
            Tap a <strong>Bid</strong> to sell that contract, an <strong>Ask</strong> to buy it —
            the tapped price is the leg's limit. Marked strikes are already in this order.
          </p>
          <ChainStraddle
            chainSym={chainSym}
            optionType="call"
            chainData={chainData}
            strike=""
            markedStrikes={markedStrikes}
            pending={chain.isFetching}
            onPickStrike={() => undefined}
            onPickSide={pickCell}
          />
        </>
      ) : (
        <DraftLegFields
          busy={busy}
          ready={underlying !== "" && expiration !== "" && sized}
          onAdd={(fields) => onAdd({ underlying, expiration, contracts: qty, ...fields })}
        />
      )}
    </>
  );
}
