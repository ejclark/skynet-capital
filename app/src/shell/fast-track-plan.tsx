import type { ReactElement } from "react";
import type { CarriedPlan } from "../live/fast-track";

/**
 * THE PLAN A FAST TRACK CARRIED IN (#7034 slice 2). "What's coming up?" ends on the trade form with
 * the stop and the exit the member picked or wrote; this strip shows them above the ticket while the
 * ticket is on that name. It is the member's written plan — nothing sells on it, and the review
 * below is still the gate — so it says so, rather than reading like an order rule the desk enforces.
 * Each line leads with a word, never a colour alone.
 */
export function FastTrackPlan({ plan }: { readonly plan: CarriedPlan }): ReactElement {
  return (
    <section className="ft-carried" aria-label="Your plan">
      <p className="ft-carried-head">
        <b>Your plan</b> for <span className="num">{plan.symbol}</span>, from "What's coming up?"
      </p>
      <dl className="ft-plan">
        <dt>Proves you wrong</dt>
        <dd>{plan.stop}</dd>
        <dt>Exit</dt>
        <dd>{plan.exit}</dd>
        {plan.note ? (
          <>
            <dt>Your notes</dt>
            <dd>{plan.note}</dd>
          </>
        ) : null}
      </dl>
      <p className="ft-hint">
        Written for you to follow; nothing sells on it. Pick the contract and the size below.
      </p>
    </section>
  );
}
