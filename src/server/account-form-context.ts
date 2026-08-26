import type { NavContext } from "../observatory/dashboard-shell.js";
import type { OwnedAccountOption } from "./self-service-forms.js";

/**
 * What the route layer knows about the caller and the account being edited — shared by
 * account-forms.ts and account-bot-controls.ts. Its own module so the two can import each other's
 * functions without a circular dependency (dependency-cruiser's no-circular rule).
 */
export interface AccountFormContext {
  /**
   * The account this page-view is managing — whichever of the caller's owned accounts `?id=`
   * named (validated against `ownedAccounts` by the route wiring), or the first when none did.
   * Both forms on the page (edit, remove) act on this SAME id, so switching accounts is a real
   * page navigation, never two forms silently disagreeing about which account is "current".
   */
  readonly requesterId?: string;
  /** Current profile of the resolved account, for prefill. */
  readonly profile?: { readonly displayName: string; readonly timezone?: string };
  /**
   * Every account the caller's sign-in owns, for the account switcher — rendered only when
   * there's more than one (Eric, 2026-08-25: "this should be a dropdown of the accounts tied to
   * the email address").
   */
  readonly ownedAccounts: readonly OwnedAccountOption[];
  /** The resolved account's autonomous-trading suspend state, when it's a bot AND bot controls
   *  are wired — undefined for a human, or offline mode. See account-bot-controls.ts. */
  readonly bot?: { readonly suspended: boolean };
  /** Legacy `?key=` password, propagated into form actions and links. */
  readonly key: string;
  readonly nav: NavContext;
}

/** The `?key=` password, propagated into a form action or link — shared so every account page
 *  builds this suffix identically. */
export function suffix(key: string): string {
  return key ? `?key=${encodeURIComponent(key)}` : "";
}
