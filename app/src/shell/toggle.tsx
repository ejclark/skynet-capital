import type { ReactElement } from "react";

/** A small pill-style single-select control (theme, density, …) — narrow viewports swap in
 *  the option's initial so the pill never renders empty (see `.toggle-abbr` in shell.css).
 *  `disabled` locks the whole group; its reason belongs in visible text beside it, which
 *  `describedBy` names for assistive tech.
 *
 *  @category desk
 */
export function Toggle<T extends string>({
  label,
  value,
  options,
  onPick,
  disabled,
  describedBy,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly (readonly [T, string])[];
  readonly onPick: (next: T) => void;
  readonly disabled?: boolean;
  readonly describedBy?: string;
}): ReactElement {
  return (
    <fieldset className="toggle-group" disabled={disabled} aria-describedby={describedBy}>
      <legend className="visually-hidden">{label}</legend>
      {options.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={key === value} onClick={() => onPick(key)}>
          <span className="toggle-text">{text}</span>
          <span className="toggle-abbr" aria-hidden="true">
            {text.slice(0, 1)}
          </span>
        </button>
      ))}
    </fieldset>
  );
}
