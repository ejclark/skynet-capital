import type { ReactElement } from "react";
import type { CarriedPlan } from "../live/fast-track";

/**
 * THE PLAN A FAST TRACK CARRIED IN (#7034 slice 2). "What's coming up?" ends on the trade form with
 * the stop and the exit the member picked or wrote; this strip shows them above the ticket while the
 * ticket is on that name. It is the member's written plan — nothing sells on it, and the review
 * below is still the gate — so it says so, rather than reading like an order rule the desk enforces.
 * Each line leads with a word, never a colour alone.
 */
/** The plan's lines, a word before each: the walk's last card and the trade form draw the same. */
export function PlanLines({
  stop,
  exit,
}: {
  readonly stop: string;
  readonly exit: string;
}): ReactElement {
  return (
    <dl className="ft-plan">
      <dt>Proves you wrong</dt>
      <dd>{stop}</dd>
      <dt>Exit</dt>
      <dd>{exit}</dd>
    </dl>
  );
}

export function FastTrackPlan({ plan }: { readonly plan: CarriedPlan }): ReactElement {
  return (
    <section className="ft-carried" aria-label="Your plan">
      <p className="ft-carried-head">
        <b>Your plan</b> for <span className="num">{plan.symbol}</span>, from "What's coming up?"
      </p>
      <PlanLines stop={plan.stop} exit={plan.exit} />
      {plan.note ? (
        <p className="ft-carried-note">
          <b>Your notes</b> {plan.note}
        </p>
      ) : null}
      <p className="ft-hint">
        Written for you to follow; nothing sells on it. Pick the contract and the size below.
      </p>
    </section>
  );
}
