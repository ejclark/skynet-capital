import type { ReactElement } from "react";
import type { LongCallPlan } from "../../../src/playbooks/long-call-rules";
import type { OptionTicketResult } from "../live/options";
import { formatExpiration } from "../live/straddle";
import { money } from "../live/ticket";
import { keepFocus } from "./gate-frame";

/**
 * THE EXIT PLAN IN THE REVIEW STEP (#5709 slice 3; Eric, 2026-11-01: "The trade strategy should
 * have exit strategies in mind before executing trades to ensure profit is captured. Exit
 * strategies surfacing during review feels organically part of a review/metrics/analysis
 * process"). Buying a call, the review draws the house's long-call plan as two tracks — what you
 * pay ● → ◆ the take-profit bid, and today ● → ■ the time-stop day — with the numbers on the tracks
 * (`docs/PATTERNS.md` → *The rule as a picture*), then offers it: Carry or Skip.
 *
 * Neither is pre-chosen: the plan is OFFERED, never applied (BRAND), so an untouched choice sends
 * the order with no plan. Carrying records the rule against the contract once the order is
 * accepted (`src/server/exit-plan-store.ts`); the decision card and position guidance read it
 * back. Nothing sells on it. Each end of a track is a shape and a word (● ◆ ■), never a hue alone —
 * a standing reader is red/green colourblind.
 *
 * A call with fewer than `exitDte` days left is already inside the time stop: there is no plan
 * worth carrying, and the panel says why instead of offering one.
 */
export function ExitPlanReview({
  plan,
  expiration,
  carry,
  onCarry,
  disabled,
}: {
  readonly plan: LongCallPlan;
  /** YYYY-MM-DD, the contract's own. */
  readonly expiration: string;
  /** `undefined` until the member picks. */
  readonly carry: boolean | undefined;
  readonly onCarry: (carry: boolean) => void;
  readonly disabled: boolean;
}): ReactElement {
  if (plan.holdDays <= 0) {
    return (
      <section className="xp" aria-label="Exit plan">
        <p className="xp-head">
          <b>Exit plan</b> · none to carry
        </p>
        <p className="xp-sub">
          This call is already inside the house's {plan.exitDte}-day time stop: its long-call bot
          sells a call once {plan.exitDte} days are left, so it would not buy this one.
        </p>
      </section>
    );
  }
  const days = `${plan.holdDays} day${plan.holdDays === 1 ? "" : "s"}`;
  return (
    <section className="xp" aria-label="Exit plan">
      <p className="xp-head">
        <b>Exit plan</b> · the house's long-call rules, whichever comes first
      </p>
      <div className="xp-track">
        <span className="xp-end">
          <b className="num">
            {money(plan.paid)}
            <span aria-hidden="true"> ●</span>
          </b>
          <small>you pay</small>
        </span>
        <span className="xp-line" aria-hidden="true">
          <span className="xp-mid">{plan.multiple}×</span>
        </span>
        <span className="xp-end xp-target">
          <b className="num">
            <span aria-hidden="true">◆ </span>
            {money(plan.takeProfit)}
          </b>
          <small>take profit</small>
        </span>
      </div>
      <p className="xp-sub">
        Sell when the bid reaches {money(plan.takeProfit)} a share, {plan.multiple}× what you pay:
        about <b className="num">+{money(plan.gain)}</b> on this order.
      </p>
      <div className="xp-track">
        <span className="xp-end">
          <b>
            Today<span aria-hidden="true"> ●</span>
          </b>
        </span>
        <span className="xp-line xp-line-time" aria-hidden="true">
          <span className="xp-mid">{days}</span>
        </span>
        <span className="xp-end xp-target">
          <b>
            <span aria-hidden="true">■ </span>
            {formatExpiration(plan.timeStop)}
          </b>
          <small>time stop</small>
        </span>
      </div>
      <p className="xp-sub">
        Or sell with {plan.exitDte} days left, whatever the price, before time decay speeds up. It
        expires {formatExpiration(expiration)}.
      </p>
      <fieldset className="xp-choice" disabled={disabled}>
        <legend className="visually-hidden">Carry this exit plan with the position?</legend>
        <button
          type="button"
          className="btn"
          aria-pressed={carry === true}
          onMouseDown={keepFocus}
          onClick={() => onCarry(true)}
        >
          {carry === true ? "✓ Carry this plan" : "Carry this plan"}
        </button>
        <button
          type="button"
          className="btn"
          aria-pressed={carry === false}
          onMouseDown={keepFocus}
          onClick={() => onCarry(false)}
        >
          {carry === false ? "✓ Skip it" : "Skip it"}
        </button>
      </fieldset>
      <p className="gate-note">
        Carried, the plan stays with the call: its decision card and position guidance speak of your
        plan. Nothing sells on its own.
      </p>
    </section>
  );
}

/** The receipt's one line about the plan, once the order is accepted — or nothing. */
export function ExitPlanReceipt({
  result,
}: {
  readonly result: OptionTicketResult;
}): ReactElement | null {
  if (!(result.ok && result.exitPlan)) return null;
  return result.exitPlan === "carried" ? (
    <p className="xp-receipt">
      ◆ Exit plan carried: once it fills, this call's decision card and position guidance read your
      plan.
    </p>
  ) : (
    <p className="xp-receipt">
      ✕ The order went, but the exit plan could not be saved. The house's rules still show on the
      call.
    </p>
  );
}
