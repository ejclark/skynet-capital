import type { FocusEvent, ReactElement } from "react";
import { useId } from "react";
import { EXIT_HOURS_NOTE, exitAllowed, type TicketFields } from "../live/ticket";

/** Focusing a typed price selects it, so typing replaces it (the trade form's own rule). */
const selectAll = (e: FocusEvent<HTMLInputElement>): void => e.currentTarget.select();

/**
 * "ADD AN EXIT" (#8249) — a limit buy's take-profit and stop, sent with the entry as one bracket the
 * broker holds. Shown only to a session the exit-at-entry setting admits, and only on a limit buy
 * (`exitAllowed`). Off until the member turns it on; both fields start EMPTY — nothing is prefilled
 * or preselected, because a price the member didn't choose is a price they didn't decide on.
 *
 * The dollars each exit makes or loses are the server's (the review shows them); this component
 * draws no number of its own. Mobile order at 390 (the capsule's): it sits right under the limit
 * price, before the line on when the order works.
 */
export function ExitFields({
  exitAtEntry,
  fields,
  onToggle,
  onTakeProfit,
  onStop,
}: {
  /** The session's admission; false renders nothing at all. */
  readonly exitAtEntry: boolean;
  readonly fields: TicketFields;
  readonly onToggle: (on: boolean) => void;
  readonly onTakeProfit: (value: string) => void;
  readonly onStop: (value: string) => void;
}): ReactElement | null {
  const tpId = useId();
  const stopId = useId();
  if (!exitAllowed(exitAtEntry, fields)) return null;
  const on = fields.withExit === true;
  const takeProfit = fields.takeProfit ?? "";
  const stop = fields.exitStop ?? "";
  return (
    <fieldset className="exit-fields">
      <label className="exit-toggle">
        <input type="checkbox" checked={on} onChange={(e) => onToggle(e.target.checked)} />
        Add an exit
      </label>
      {on ? (
        <>
          <div className="gate-fields">
            <div className="field">
              <label htmlFor={tpId}>Take-profit</label>
              <input
                id={tpId}
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={takeProfit}
                placeholder="above your limit"
                onFocus={selectAll}
                onChange={(e) => onTakeProfit(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor={stopId}>Stop</label>
              <input
                id={stopId}
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                value={stop}
                placeholder="below your limit"
                onFocus={selectAll}
                onChange={(e) => onStop(e.target.value)}
              />
            </div>
          </div>
          <p className="gate-note">
            The broker holds both once your buy fills; when one fills, it cancels the other. The
            stop sells at the market once triggered. {EXIT_HOURS_NOTE}
          </p>
        </>
      ) : null}
    </fieldset>
  );
}

/** A Stop-Limit's two prices (#8249): the stop that triggers it, then the limit it fills at or
 *  better. Both are the member's to type; the server refuses either one missing, in words. */
export function StopLimitFields({
  fields,
  onStop,
  onLimit,
}: {
  readonly fields: Pick<TicketFields, "orderType" | "stopPrice" | "limitPrice">;
  readonly onStop: (value: string) => void;
  readonly onLimit: (value: string) => void;
}): ReactElement | null {
  const stopId = useId();
  const limitId = useId();
  if (fields.orderType !== "stop_limit") return null;
  return (
    <>
      <div className="field">
        <label htmlFor={stopId}>Stop price</label>
        <input
          id={stopId}
          type="number"
          min={0}
          step={0.01}
          inputMode="decimal"
          value={fields.stopPrice}
          placeholder="triggers at"
          onFocus={selectAll}
          onChange={(e) => onStop(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={limitId}>Limit price</label>
        <input
          id={limitId}
          type="number"
          min={0}
          step={0.01}
          inputMode="decimal"
          value={fields.limitPrice}
          placeholder="fills at or better"
          onFocus={selectAll}
          onChange={(e) => onLimit(e.target.value)}
        />
      </div>
    </>
  );
}
