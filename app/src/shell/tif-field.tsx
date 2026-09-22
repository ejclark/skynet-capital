import type { ReactElement } from "react";
import { TIF_LABELS, type TicketTimeInForce, tifNote } from "../live/ticket";

/**
 * TIME IN FORCE (#3407 P1 slice 2; parity study row 13) — Day / GTC as one segmented control on
 * both tickets, the same `toggle-group` idiom the ticket's own nav uses. Until the member touches
 * it, the pressed segment follows the caller's `fallback` — the stock ticket's order-type default
 * (market → Day, held → GTC), the options ticket's standing Day — so the control always shows what
 * will be sent; the server previews and echoes the same value, so nothing here decides anything.
 * Two choices only, by design — Fidelity's five and thinkorswim's eight stay declined until a
 * member asks for one by name (`docs/PATTERNS.md`).
 * @category trading
 */
export function TimeInForceField({
  fallback,
  value,
  onChange,
}: {
  /** What the server will send when the member hasn't picked. */
  readonly fallback: TicketTimeInForce;
  readonly value: TicketTimeInForce | undefined;
  readonly onChange: (next: TicketTimeInForce) => void;
}): ReactElement {
  const effective = value ?? fallback;
  return (
    <fieldset className="ticket-nav-group tif-field">
      <legend className="ticket-nav-label">Time in force</legend>
      <div className="toggle-group">
        {(Object.keys(TIF_LABELS) as TicketTimeInForce[]).map((tif) => (
          <button
            key={tif}
            type="button"
            aria-pressed={effective === tif}
            onClick={() => onChange(tif)}
          >
            {TIF_LABELS[tif]}
          </button>
        ))}
      </div>
      <span className="seg-why">{tifNote(effective)}</span>
    </fieldset>
  );
}
