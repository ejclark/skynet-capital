import type { ReactElement } from "react";
import type { ChainData } from "../live/options";
import { money } from "../live/ticket";

/**
 * The options ticket's chain-driven fields (#738 phase 10b): expiration and strike render as
 * selects fed by the member's own chain when it loaded, and fall back to manual entry when it
 * couldn't — the legacy raw mode's posture, so the ticket always works.
 */

export function ExpirationField({
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
    return <input id={id} type="date" value={value} onChange={(e) => onEdit(e.target.value)} />;
  }
  return (
    <select id={id} value={chainData.expiration} onChange={(e) => onEdit(e.target.value)}>
      {chainData.expirations.map((exp) => (
        <option key={exp} value={exp}>
          {exp}
        </option>
      ))}
    </select>
  );
}

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
