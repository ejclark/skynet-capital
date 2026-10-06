/**
 * ONLY BOT ACCOUNTS SUBSCRIBE TO PLAYBOOKS, FOR NOW (#4610). Eric, 2026-10-04: "For season 1, I'm
 * only allowing bots to subscribe to playbooks. In season 2, playbook subscriptions will be enabled
 * for all accounts. The intent is to have season one be 'bots vs humans'." His seasons are the
 * multi-quarter product eras `docs/LIVING-UNIVERSE.md` calls Era 1 and Era 2, not
 * `docs/THE-GAME.md`'s quarterly Season. So the sentence a member reads says "a later season" and
 * never "Season 2", which would read as next quarter.
 *
 * NOT A FOG. `docs/FOG-OF-WAR.md`'s tree, run 2026-10-05, stops at Q1: a human account's
 * subscription moves no capital, because the runner reads subscriptions for bots only (keyed by
 * persona id). Nothing earnable opens it either. The unlock is an era, and criterion 3 rules out a
 * timer. So the door is labelled honestly: visible, named and disabled. It never names a rung and
 * never says "earn". Leaving stays open on every account: unsubscribe, pause and resume are never
 * gated (#4610 criterion 3).
 */

/**
 * The one sentence for this door. The disabled control and the server's refusal both use it, so a
 * member is never told two different things about one rule (the `DELEGATION_LOCKED_NOTE` pattern).
 * "Human accounts", because the Subscribe-as picker labels every account `· human` or `· bot`.
 */
export const BOTS_ONLY_NOTE =
  "Playbook subscriptions open to human accounts in a later season. " +
  "For now the bots trade and humans trade by hand.";

/** The rule as data, for the JSON view and the UI that draws the door. */
export interface BotsOnlyGateView {
  /** True when the selected account is a human account the viewer owns. */
  readonly locked: boolean;
  readonly note: string;
}

export function botsOnlyGateView(locked: boolean): BotsOnlyGateView {
  return { locked, note: BOTS_ONLY_NOTE };
}
