import type { ReactElement } from "react";
import { useEffect, useId, useState } from "react";
import type { DraftLeg } from "../live/draft-order";

/**
 * One leg of a multi-leg draft (#582; #3407 P3 slice 4): its plain-language label, its premium
 * as an EDITABLE field — the chain tap seeded a bid or an ask, the member types the mid or a
 * better price and the draft reprices through the server's own `reprice-leg` action (so the
 * verdict re-arms like any other edit) — and the control that removes it. An emptied field means
 * "at market", which the state machine accepts and the seam refuses at submit in words.
 * @category trading
 */

export function legLabel(leg: DraftLeg): string {
  const side = leg.action === "sell" ? "Sell" : "Buy";
  const type = leg.optionType === "call" ? "C" : "P";
  return `${side} ${leg.contracts} ${leg.underlying} $${leg.strike}${type} ${leg.expiration}`;
}

/** The typed premium as the number the draft should carry: a positive number, or `undefined`
 *  for an emptied field; `null` when the text is not a price at all (the field reverts). */
export function parsePremium(text: string): number | undefined | null {
  const trimmed = text.trim();
  if (trimmed === "") return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function LegRow({
  leg,
  busy,
  onRemove,
  onReprice,
}: {
  readonly leg: DraftLeg;
  readonly busy: boolean;
  readonly onRemove: () => void;
  readonly onReprice?: (limitPrice: number | undefined) => void;
}): ReactElement {
  const seeded = leg.limitPrice !== undefined ? String(leg.limitPrice) : "";
  const [text, setText] = useState(seeded);
  const priceId = useId();
  // The server's echo is the truth: a reprice that came back (or a chain re-seed) replaces
  // whatever was typed, so the field never shows a price the draft doesn't carry.
  // biome-ignore lint/correctness/useExhaustiveDependencies: seeded IS the trigger
  useEffect(() => setText(seeded), [seeded]);

  const commit = () => {
    if (!onReprice || text === seeded) return;
    const parsed = parsePremium(text);
    if (parsed === null) {
      setText(seeded);
      return;
    }
    if (parsed !== leg.limitPrice) onReprice(parsed);
  };

  return (
    <li className="draft-leg-row">
      <span className="draft-leg-label">{legLabel(leg)}</span>
      {onReprice ? (
        <span className="draft-leg-price num">
          <label htmlFor={priceId} className="visually-hidden">
            Premium per share for {legLabel(leg)}
          </label>
          <input
            id={priceId}
            type="number"
            min={0.01}
            step={0.01}
            inputMode="decimal"
            value={text}
            placeholder="at market"
            disabled={busy}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
            }}
          />
          <span className="draft-leg-unit">/sh</span>
        </span>
      ) : (
        <span className="draft-leg-price num">
          {leg.limitPrice !== undefined ? `$${leg.limitPrice.toFixed(2)}/sh` : "at market"}
        </span>
      )}
      <button type="button" className="draft-leg-remove" disabled={busy} onClick={onRemove}>
        Remove
      </button>
    </li>
  );
}
