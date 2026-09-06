import type { ReactElement } from "react";
import type { ChainData } from "../live/options";
import { daysToExpiry } from "../live/straddle";
import { money } from "../live/ticket";

/**
 * The options ticket's chain-driven fields (#738 phase 10b): expiration and strike render as
 * selects fed by the member's own chain when it loaded, and fall back to manual entry when it
 * couldn't — the legacy raw mode's posture, so the ticket always works.
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
    <select id={id} value={chainData.expiration} onChange={(e) => onEdit(e.target.value)}>
      {chainData.expirations.map((exp) => {
        const disabled = zeroDteLocked && daysToExpiry(exp, new Date()) === 0;
        return (
          <option
            key={exp}
            value={exp}
            disabled={disabled}
            title={disabled ? zeroDteReason : undefined}
          >
            {exp}
            {disabled ? " — locked (0DTE)" : ""}
          </option>
        );
      })}
    </select>
  );
}

/** @category trading */
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
  if (!chainData) {
    return (
      <input
        id={id}
        type="number"
        min={0.5}
        step={0.5}
        inputMode="decimal"
        value={value}
        placeholder="40"
        onChange={(e) => onEdit(e.target.value)}
      />
    );
  }
  return (
    <select id={id} value={value} onChange={(e) => onEdit(e.target.value)}>
      <option value="">pick from the chain…</option>
      {chainData.rows.map((row) => (
        <option key={row.occSymbol} value={row.strike}>
          ${row.strike}
          {row.premium !== undefined ? ` · ${money(row.premium)} /share` : ""}
        </option>
      ))}
    </select>
  );
}
