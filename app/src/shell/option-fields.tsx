import type { ReactElement } from "react";
import type { ChainData } from "../live/options";
import { daysToExpiry } from "../live/straddle";

/**
 * The options ticket's chain-driven fields (#738 phase 10b, strike per #2017 Phase 0 task 4b,
 * expiration per task 4c): expiration renders as a horizontally-scrolling row of tab buttons fed
 * by the member's own chain when it loaded — a thumb-swipeable strip beats a long `<select>` on
 * mobile, matching the chain table's own `.straddle-scroll` idiom right below it — and falls back
 * to manual entry when it couldn't — the legacy raw mode's posture, so the ticket always works.
 * Strike ALWAYS renders as a free-typed number input — the chain, when loaded, only adds a
 * `<datalist>` of suggested strikes (plus the chain table's own row-click-to-fill); it never
 * becomes the only way to name a strike.
 * @category trading
 */

/** Tomorrow's `YYYY-MM-DD`, local time — the earliest date a zero-DTE-locked member may pick,
 *  so `<input type="date">`'s own `min` rules out today without touching future dates. */
function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function ExpirationField({
  id,
  chainData,
  value,
  onEdit,
  zeroDteLocked,
  zeroDteReason,
}: {
  readonly id: string;
  readonly chainData: ChainData | undefined;
  readonly value: string;
  readonly onEdit: (value: string) => void;
  /** Visible, disabled, explained (#1461's rule) — course 501 isn't earned, so today is off the
   *  table until it is. The server refuses regardless of what this field allows. */
  readonly zeroDteLocked: boolean;
  readonly zeroDteReason?: string;
}): ReactElement {
  if (!chainData) {
    return (
      <input
        id={id}
        type="date"
        value={value}
        min={zeroDteLocked ? tomorrowIso() : undefined}
        title={zeroDteLocked ? `Today is locked — ${zeroDteReason}` : undefined}
        onChange={(e) => onEdit(e.target.value)}
      />
    );
  }
  return (
    <div className="exp-tabs">
      {chainData.expirations.map((exp) => {
        const disabled = zeroDteLocked && daysToExpiry(exp, new Date()) === 0;
        const active = exp === chainData.expiration;
        return (
          <button
            key={exp}
            type="button"
            className={active ? "exp-tab exp-tab-active" : "exp-tab"}
            aria-pressed={active}
            disabled={disabled}
            title={disabled ? zeroDteReason : undefined}
            onClick={() => onEdit(exp)}
          >
            {exp}
            {disabled ? " — locked (0DTE)" : ""}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Free entry always renders (#2017 Phase 0 task 4b — a chain page must never be the only way to
 * name a strike). When a chain has loaded rows, a `<datalist>` adds native autocomplete
 * suggestions of the chain's actual strikes on top of that input; it's purely additive — nothing
 * about typing a strike the chain doesn't list, or that doesn't match any row, changes.
 * @category trading
 */
export function StrikeField({
  id,
  chainData,
  value,
  onEdit,
}: {
  readonly id: string;
  readonly chainData: ChainData | undefined;
  readonly value: string;
  readonly onEdit: (value: string) => void;
}): ReactElement {
  const hasSuggestions = chainData !== undefined && chainData.rows.length > 0;
  const listId = `${id}-strikes`;
  return (
    <>
      <input
        id={id}
        type="number"
        min={0.5}
        step={0.5}
        inputMode="decimal"
        value={value}
        placeholder="40"
        list={hasSuggestions ? listId : undefined}
        onChange={(e) => onEdit(e.target.value)}
      />
      {hasSuggestions ? (
        <datalist id={listId}>
          {chainData.rows.map((row) => (
            <option key={row.occSymbol} value={row.strike} />
          ))}
        </datalist>
      ) : null}
    </>
  );
}
