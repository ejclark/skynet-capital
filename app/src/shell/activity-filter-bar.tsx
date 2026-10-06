import type { ReactElement, ReactNode } from "react";
import { useId } from "react";

/**
 * NARROWING AN ACCOUNT'S ACTIVITY (#4650, plan #4642) — a symbol box and, for the bot's owner, one
 * chip per playbook, so an owner can watch the trades a bot makes through each playbook it runs.
 * The house's filter idiom, not a new control: the league Activity page's search box (`filter-bar`
 * · `filter-query`, its label read by screen readers only) and the positions blotter's chip row with
 * "All" first. The page owns the URL; this only reports what was typed or pressed.
 *
 * A pressed chip says so with a ✓ in a fixed slot as well as its accent border — a shape, never the
 * hue alone (a standing reader is red/green colourblind; docs/BRAND.md → Accessibility). The slot
 * is always there, so pressing a chip never shifts the row.
 */
export function ActivityFilterBar({
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
          <Chip pressed={playbook === undefined} onPress={() => onPlaybook(undefined)}>
            All
          </Chip>
          {chips.map((id) => (
            <Chip
              key={id}
              pressed={playbook === id}
              onPress={() => onPlaybook(playbook === id ? undefined : id)}
            >
              {id}
            </Chip>
          ))}
        </fieldset>
      ) : null}
    </div>
  );
}

function Chip({
  pressed,
  onPress,
  children,
}: {
  readonly pressed: boolean;
  readonly onPress: () => void;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <button type="button" className="filter-chip" aria-pressed={pressed} onClick={onPress}>
      <span className="filter-chip-check" aria-hidden="true">
        {pressed ? "✓" : ""}
      </span>
      {children}
    </button>
  );
}
