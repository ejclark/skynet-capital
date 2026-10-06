import { heldQuantity } from "../domain/portfolio.js";
import type { OrderIntent, PlaybookSubscription, Portfolio } from "../domain/types.js";

/**
 * ONLY A SUBSCRIBED PLAYBOOK OPENS A POSITION (#4642 slice 10, criterion 1; Eric's brief: "All
 * autonomous trade execution must be a result/byproduct of playbook subscriptions"). An order that
 * would open exposure must carry the id of a playbook the account is subscribed to and has on;
 * anything else is refused `unsubscribed` and recorded like every refusal.
 *
 * EXITS ARE NEVER REFUSED HERE. A position must never be stranded because whatever opened it is no
 * longer subscribed, so a share sell of shares held, an option close, an expiry-hygiene close, an
 * exit-safety trip and a paused playbook's exits all pass whatever they carry — the rest of the
 * guards still size them exactly as before.
 *
 * What counts as an open, decided here once:
 *  - a share buy, and an option order whose effect is `open` (a sold put opens risk: the effect
 *    decides, never the side) — `opensRisk`. The bots trade long only and no rule of theirs buys
 *    to cover a short, so a share buy is always an open;
 *  - a share sell of a name the account holds none of — it could only open a short. A sell bigger
 *    than what is held is NOT refused: the held part is an exit, and the guards already clamp a
 *    sell to the shares held, so the part past them never reaches a broker.
 *
 * Who may open:
 *  - a playbook with an ENABLED subscription on the account (an env-roster entry with no
 *    subscription does not count: the subscription is the grant);
 *  - a PAUSED playbook, for exactly the one open its roster entry may still place — a covered call
 *    (`pausedMayPlace`), which can only deliver shares already held and is how a paused wheel gets
 *    out of assigned shares.
 *
 * Opt-in by construction (`RiskConfig.subscribedOnly`): the live bots and the forced daily pick set
 * it; evals, the readiness gate and the desk never do, so they are untouched.
 */
export function opensExposure(intent: OrderIntent, portfolio: Portfolio): boolean {
  if (intent.option) return intent.option.effect === "open";
  return intent.side === "buy" || heldQuantity(portfolio, intent.symbol) <= 0;
}

/** Whether the account's subscriptions let this intent's playbook open it. */
export function subscriptionAllowsOpen(
  intent: OrderIntent,
  subscriptions: readonly PlaybookSubscription[] | undefined,
): boolean {
  if (!intent.playbookId) return false;
  const mine = subscriptions?.filter((s) => s.playbookId === intent.playbookId) ?? [];
  if (mine.some((s) => s.enabled)) return true;
  return mine.length > 0 && intent.option?.structure === "covered-call";
}

/** The rule as the guards ask it: refuse this intent as `unsubscribed`? */
export function refusedAsUnsubscribed(
  intent: OrderIntent,
  portfolio: Portfolio,
  config: {
    readonly subscribedOnly?: boolean;
    readonly subscriptions?: readonly PlaybookSubscription[];
  },
): boolean {
  return (
    config.subscribedOnly === true &&
    opensExposure(intent, portfolio) &&
    !subscriptionAllowsOpen(intent, config.subscriptions)
  );
}
