import type { FocusEvent, ReactElement } from "react";

/**
 * Focusing an amount the form already holds selects it, so typing REPLACES it. The change study's
 * blind members typed into seeded amounts and got "510.00505", "90.0085" and a 950-share sell they
 * could not trim (EQ-03, OM-04, EQ-04, 2026-11-16) — the same append that cost OM-02 its change.
 */
export const selectAll = (e: FocusEvent<HTMLInputElement>): void => e.currentTarget.select();

/** One price box on the stock form — a limit, a stop, or an exit's take-profit or stop (#8249).
 *  A stop-limit renders two (`priceFieldsFor`); an exit renders two with no placeholder, since an
 *  exit is never prefilled or suggested. */
export function PriceInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}): ReactElement {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={0}
        step={0.01}
        inputMode="decimal"
        value={value}
        {...(placeholder ? { placeholder } : {})}
        onFocus={selectAll}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
