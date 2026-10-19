import type { ReactElement } from "react";
import { useId } from "react";
import { FilterChip } from "../ui";

/**
 * NARROWING AN ACCOUNT'S ACTIVITY (#4650, plan #4642) — a symbol box and, for the bot's owner, one
 * chip per playbook, so an owner can watch the trades a bot makes through each playbook it runs.
 * The house's filter idiom, not a new control: the league Activity page's search box (`filter-bar`
 * · `filter-query`, its label read by screen readers only) and the positions blotter's chip row with
 * "All" first. The page owns the URL; this only reports what was typed or pressed.
 *
 * The chips are `FilterChip`, whose ✓ slot began here: a pressed chip says so by a shape, never the
 * hue alone (a standing reader is red/green colourblind; docs/BRAND.md → Accessibility).
 */
export function LedgerFilterBar({
  symbol,
  onSymbol,
  playbooks,
  playbook,
  onPlaybook,
}: {
  /** The box's text, as typed. */
  readonly symbol: string;
  readonly onSymbol: (next: string) => void;
  /** The owner's chip list (the server sends it to the bot's owner alone); absent or empty, no
   *  chip row at all. */
  readonly playbooks?: readonly string[] | undefined;
  readonly playbook?: string | undefined;
  readonly onPlaybook: (next: string | undefined) => void;
}): ReactElement {
  const inputId = useId();
  const labelId = useId();
  // A playbook asked for by the URL stays on the row even when the list lacks it, so the filter
  // that is on is always a chip that can be seen and turned off.
  const chips =
    playbooks && playbook && !playbooks.includes(playbook) ? [...playbooks, playbook] : playbooks;
  return (
    <div className="filter-bar activity-filter-bar">
      <div className="filter-query">
        <label className="visually-hidden" htmlFor={inputId}>
          Filter by symbol
        </label>
        <input
          id={inputId}
          type="text"
          value={symbol}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="Symbol — try NVDA"
          onChange={(e) => onSymbol(e.target.value)}
        />
      </div>
      {chips && chips.length > 0 ? (
        <fieldset className="filter-chips activity-playbooks" aria-labelledby={labelId}>
          <span id={labelId} className="filter-chips-label">
            Playbook
          </span>
          <FilterChip pressed={playbook === undefined} onPress={() => onPlaybook(undefined)}>
            All
          </FilterChip>
          {chips.map((id) => (
            <FilterChip
              key={id}
              pressed={playbook === id}
              onPress={() => onPlaybook(playbook === id ? undefined : id)}
            >
              {id}
            </FilterChip>
          ))}
        </fieldset>
      ) : null}
    </div>
  );
}
