import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import type { NewLeg } from "../live/draft-order";
import { type ChainData, fetchChain } from "../live/options";
import { money } from "../live/ticket";

/**
 * THE "ADD LEG" FORM (#582 slice 4) — split out of `DraftOrderBuilder` so that component stays
 * under the house's complexity budget. Reads the SAME chain query the six-play ticket's
 * `OptionGate` uses (`fetchChain`); picking a strike seeds the leg's limit price from the chain's
 * quoted premium exactly the way `OptionGate`'s `pickStrike` does. Emits a finished `NewLeg` to
 * the parent, which is the only thing that talks to the draft's state machine.
 * @category trading
 */

export function DraftLegForm({
  busy,
  onAdd,
}: {
  readonly busy: boolean;
  readonly onAdd: (leg: NewLeg) => void;
}): ReactElement {
  const [symbol, setSymbol] = useState("");
  const [chainSym, setChainSym] = useState("");
  const [optionType, setOptionType] = useState<"call" | "put">("call");
  const [expiration, setExpiration] = useState("");
  const [strike, setStrike] = useState("");
  const [action, setAction] = useState<"buy" | "sell">("sell");
  const [contracts, setContracts] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");

  const symId = useId();
  const typeId = useId();
  const expId = useId();
  const strikeId = useId();
  const actionId = useId();
  const qtyId = useId();
  const limitId = useId();

  const chain = useQuery({
    queryKey: ["chain", chainSym, optionType, expiration],
    queryFn: () => fetchChain(chainSym, optionType, expiration || undefined),
    enabled: chainSym !== "",
  });
  const chainData: ChainData | undefined =
    chain.data && !("chainNote" in chain.data) ? chain.data : undefined;

  const pickStrike = (value: string) => {
    setStrike(value);
    const row = chainData?.rows.find((r) => String(r.strike) === value);
    setLimitPrice(row?.premium !== undefined ? String(row.premium) : "");
  };

  const canAdd =
    (chainSym || symbol).trim() !== "" &&
    (chainData?.expiration ?? expiration) !== "" &&
    strike !== "" &&
    contracts !== "";

  const submit = () => {
    onAdd({
      underlying: (chainSym || symbol).trim().toUpperCase(),
      optionType,
      strike: Number(strike),
      expiration: chainData?.expiration ?? expiration,
      action,
      contracts: Number(contracts),
      ...(limitPrice !== "" ? { limitPrice: Number(limitPrice) } : {}),
    });
    setStrike("");
    setLimitPrice("");
  };

  return (
    <>
      <div className="gate-fields tkt-fields">
        <div className="field">
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
          <label htmlFor={typeId}>Type</label>
          <select
            id={typeId}
            value={optionType}
            onChange={(e) => setOptionType(e.target.value as "call" | "put")}
          >
            <option value="call">Call</option>
            <option value="put">Put</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={actionId}>Side</label>
          <select
            id={actionId}
            value={action}
            onChange={(e) => setAction(e.target.value as "buy" | "sell")}
          >
            <option value="sell">Sell</option>
            <option value="buy">Buy</option>
          </select>
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
                  {exp}
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
          <label htmlFor={strikeId}>Strike</label>
          {chainData ? (
            <select id={strikeId} value={strike} onChange={(e) => pickStrike(e.target.value)}>
              <option value="">pick from the chain…</option>
              {chainData.rows.map((row) => (
                <option key={row.occSymbol} value={row.strike}>
                  ${row.strike}
                  {row.premium !== undefined ? ` · ${money(row.premium)}/sh` : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={strikeId}
              type="number"
              min={0.5}
              step={0.5}
              inputMode="decimal"
              value={strike}
              placeholder="40"
              onChange={(e) => pickStrike(e.target.value)}
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
        <div className="field">
          <label htmlFor={limitId}>Limit /share</label>
          <input
            id={limitId}
            type="number"
            min={0.01}
            step={0.01}
            inputMode="decimal"
            value={limitPrice}
            placeholder="at market"
            onChange={(e) => setLimitPrice(e.target.value)}
          />
        </div>
      </div>
      <button type="button" className="btn" disabled={busy || !canAdd} onClick={submit}>
        Add leg
      </button>
    </>
  );
}
