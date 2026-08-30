import type { OwnerLinkStore } from "./owner-link-store.js";

/**
 * `/claim`'s shape — attach an account that is ALREADY on the board to a member's sign-in;
 * served as data at `/api/admin/claim` (`admin-api-routes.ts` reads
 * `store`/`isOwner`/`accounts`/`canSignIn` directly).
 *
 * **The gap this closes.** The desk resolves a session to exactly one account, through
 * `Participant.ownerEmail`, and that field is stamped only by `/add`. Accounts that predate the
 * connect form — and every env-declared roster row, which is rebuilt from the host environment
 * on each boot — carry no owner. They render on the board with their full trade history and are
 * permanently untradeable, while `/add` refuses them as duplicates: a closed loop with no exit.
 * Linking is the exit, and it costs no credentials: nothing about the account changes except who
 * the app believes owns it.
 *
 * **Owner tier, deliberately.** Linking an account is granting the power to trade it, and there
 * is no proof of ownership a *member* could offer here that the app can check — the only honest
 * proof is the account's Alpaca key, which is exactly the re-connect this closes. So the same
 * two-tier split `/invite` uses applies: env-configured owners link, members do not.
 *
 * **What it will not do.** It never re-assigns an account that already has an owner. Correcting
 * a stamped owner is a different, riskier operation than filling in a missing one, and rolling
 * both into one endpoint would make the safe case carry the dangerous case's blast radius.
 */
export interface ClaimAccount {
  readonly id: string;
  readonly displayName: string;
  readonly kind: "bot" | "human";
  /** The owner stamped on the participant record at `/add`, when there is one. */
  readonly ownerEmail?: string;
}

export interface ClaimDeps {
  readonly store: OwnerLinkStore;
  /** True when this email is on the env allowlist — an owner, not merely a member. */
  readonly isOwner: (email: string) => boolean;
  /** Every account on the live board, in board order. */
  readonly accounts: () => readonly ClaimAccount[];
  /**
   * True when this email is already admitted by the gate (an owner, or on the guest list).
   * Linking an account to an address that cannot sign in produces a link nobody can ever use,
   * so the guest list stays the one source of truth for who exists.
   */
  readonly canSignIn: (email: string) => boolean;
  readonly now?: () => Date;
}

/** Board participants → the shape this surface needs. Credentials never cross this boundary. */
export function toClaimAccounts(participants: readonly ClaimAccount[]): ClaimAccount[] {
  return participants.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    kind: p.kind,
    ...(p.ownerEmail ? { ownerEmail: p.ownerEmail } : {}),
  }));
}
