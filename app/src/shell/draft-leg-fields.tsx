import type { ReactElement } from "react";
import { useId, useState } from "react";

/**
 * The typed leg — the fallback when a symbol has no chain to tap (#3407 P3 slice 2 split this
 * out of `DraftLegForm` so the chain path stays the headline). Type, side, strike and limit are
 * the four things a chain tap would have said; the parent owns symbol, expiration and size.
 * @category trading
 */

export interface TypedLegFields {
  readonly optionType: "call" | "put";
  readonly action: "buy" | "sell";
  readonly strike: number;
  readonly limitPrice?: number;
}

export function DraftLegFields({
  busy,
  ready,
  onAdd,
}: {
  readonly busy: boolean;
  /** The parent's own fields (symbol, expiration, contracts) are filled. */
  readonly ready: boolean;
  readonly onAdd: (fields: TypedLegFields) => void;
}): ReactElement {
  const [optionType, setOptionType] = useState<"call" | "put">("call");
  const [action, setAction] = useState<"buy" | "sell">("sell");
  const [strike, setStrike] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const typeId = useId();
  const actionId = useId();
  const strikeId = useId();
  const limitId = useId();

  const submit = () => {
    onAdd({
      optionType,
      action,
      strike: Number(strike),
      ...(limitPrice !== "" ? { limitPrice: Number(limitPrice) } : {}),
    });
    setStrike("");
    setLimitPrice("");
  };

  return (
    <>
      <div className="gate-fields">
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
          <label htmlFor={strikeId}>Strike</label>
          <input
            id={strikeId}
            type="number"
            min={0.5}
            step={0.5}
            inputMode="decimal"
            value={strike}
            placeholder="40"
            onChange={(e) => setStrike(e.target.value)}
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
      <button
        type="button"
        className="btn"
        disabled={busy || !ready || strike === ""}
        onClick={submit}
      >
        Add leg
      </button>
    </>
  );
}
