import type { ReactElement } from "react";
import { useId } from "react";
import type { TicketFields } from "../live/ticket";
import { PriceInput } from "./price-input";

/**
 * "ADD AN EXIT" (#8249 PR 2) — the stock form's take-profit and stop, held by the broker with a
 * whole-share limit buy as one bracket order. Shown only to a session the exit-at-entry setting
 * admits, and only on a limit buy (`exitFits`); the form decides that, this renders it.
 *
 * Neither price is prefilled or preselected: an exit is the member's own plan, so the two boxes
 * start empty and the server names a missing one in words at Review. What each leg makes or loses
 * is the server's figure, shown in the review (`ticket-exit.ts`), never computed here.
 */

type Exit = NonNullable<TicketFields["exit"]>;

/** @category trading */
export function ExitFields({
  exit,
  onChange,
}: {
  /** Undefined until the member taps "Add an exit". */
  readonly exit: Exit | undefined;
  /** Undefined removes the exit. */
  readonly onChange: (next: Exit | undefined) => void;
}): ReactElement {
  const tpId = useId();
  const stopId = useId();
  if (exit === undefined) {
    return (
      <button
        type="button"
        className="btn gate-exit-add"
        onClick={() => onChange({ takeProfit: "", stop: "" })}
      >
        Add an exit
      </button>
    );
  }
  return (
    <fieldset className="gate-exit">
      <legend className="gate-exit-legend">Exit — held by the broker</legend>
      <div className="gate-fields">
        <PriceInput
          id={tpId}
          label="Take-profit"
          value={exit.takeProfit}
          onChange={(takeProfit) => onChange({ ...exit, takeProfit })}
        />
        <PriceInput
          id={stopId}
          label="Stop-Market"
          value={exit.stop}
          onChange={(stop) => onChange({ ...exit, stop })}
        />
      </div>
      <button type="button" className="btn gate-exit-remove" onClick={() => onChange(undefined)}>
        Remove the exit
      </button>
    </fieldset>
  );
}
