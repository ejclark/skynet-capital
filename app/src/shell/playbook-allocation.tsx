import type { ReactElement } from "react";
import { useId, useState } from "react";
import { allocationRequest, type StrategyAllocationView } from "../live/playbook-store";

/**
 * A STRATEGY'S ALLOCATION (#4469 slice 3c part 3b, criterion 5) — what the account gives one
 * strategy, drawn on its card with what its tickers' budgets add up to inside it. Each ticker keeps
 * its own budget; the server refuses budgets that add up past the allocation, and an allocation set
 * below what is already budgeted. Compounded gains ride on top, as they always have, so the line says
 * the budgets are what counts toward it.
 *
 * The state is words and numbers ("$30,000 of $50,000 budgeted · $20,000 left"), no bar whose hue
 * would carry the meaning. With none set the card says what setting one does, so the control is not
 * a mystery. Clearing it is its own button — the wire's `null` — never an empty field that might be
 * a forgotten one.
 */

const dollars = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

/** "$30,000 of $50,000 budgeted · $20,000 left" — or how far past it, which only an allocation
 *  lowered under a compounding budget can be. */
export function allocationLine(allocation: StrategyAllocationView): string {
  const left = allocation.capitalAllocated - allocation.budgeted;
  return `${dollars(allocation.budgeted)} of ${dollars(allocation.capitalAllocated)} budgeted · ${
    left >= 0 ? `${dollars(left)} left` : `${dollars(-left)} over`
  }`;
}

export function AllocationPanel({
  accountId,
  strategy,
  strategyName,
  allocation,
  onChanged,
}: {
  readonly accountId: string;
  /** The strategy id the write keys on. */
  readonly strategy: string;
  /** "the wheel" — read in the sentence, never the id. */
  readonly strategyName: string;
  readonly allocation?: StrategyAllocationView;
  readonly onChanged: () => void;
}): ReactElement {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(
    allocation === undefined ? "" : String(allocation.capitalAllocated),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const dollarsAsked = Number(amount);
  const valid = amount.trim() !== "" && Number.isFinite(dollarsAsked) && dollarsAsked > 0;

  const write = async (capitalAllocated: number | null) => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await allocationRequest({ id: accountId, strategy, capitalAllocated });
      if (answer.ok) {
        setOpen(false);
        onChanged();
      } else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-allocation">
      <p className="pb-status">
        <b className="pb-status-state">Allocation</b>{" "}
        {allocation ? (
          <>· {allocationLine(allocation)}</>
        ) : (
          <>· none set. Setting one caps what all your tickers on {strategyName} may add up to.</>
        )}
      </p>
      {open ? (
        <div className="pb-subscribe-form">
          <div className="field">
            <label htmlFor={inputId}>Allocation for {strategyName} ($)</label>
            <input
              id={inputId}
              type="number"
              inputMode="decimal"
              min={0}
              step={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <p className="pb-symbols-hint">
            Each ticker keeps its own budget; together they stay inside this. Compounded gains ride
            on top.
          </p>
          <div className="pb-subscription-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !valid}
              onClick={() => void write(dollarsAsked)}
            >
              {busy ? "Saving…" : "Save allocation"}
            </button>
            {allocation ? (
              <button
                type="button"
                className="btn mc-btn"
                disabled={busy}
                onClick={() => void write(null)}
              >
                Clear it
              </button>
            ) : null}
            <button
              type="button"
              className="btn mc-btn"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
          {error ? <span className="set-err">{error}</span> : null}
        </div>
      ) : (
        <div className="pb-subscription-actions">
          <button
            type="button"
            className="btn mc-btn"
            onClick={() => {
              // Seeded on every open: a clear, or a change made elsewhere, must not leave a stale amount to save back.
              setAmount(allocation === undefined ? "" : String(allocation.capitalAllocated));
              setError(undefined);
              setOpen(true);
            }}
          >
            {allocation ? "Change allocation" : "Set an allocation"}
          </button>
        </div>
      )}
    </div>
  );
}
