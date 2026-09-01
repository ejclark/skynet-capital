import type { ReactElement } from "react";

/** A small pill-style single-select control (theme, density, …) — narrow viewports swap in
 *  the option's initial so the pill never renders empty (see `.toggle-abbr` in shell.css).
 *
 *  @category desk
 */
export function Toggle<T extends string>({
  label,
  value,
  options,
  onPick,
}: {
  readonly label: string;
  readonly value: T;
  readonly options: readonly (readonly [T, string])[];
  readonly onPick: (next: T) => void;
}): ReactElement {
  return (
    <fieldset className="toggle-group">
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
