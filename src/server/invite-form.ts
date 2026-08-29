import type { AllowlistStore } from "./auth/allowlist-store.js";

/**
 * The guest list's shape (#738 phase 9e serves it as data at `/api/admin/invite`;
 * `admin-api-routes.ts` reads `store`/`isOwner` directly).
 *
 * **Two tiers, and the split is the whole security model.** Identities on the
 * `SKYNET_ALLOWED_*` env vars are *owners*: they may sign in AND invite. Identities in the
 * volume-backed store are *members*: they may sign in only. Without that split, the first
 * invited friend could invite anyone, and a friends-and-family gate would be a public one in a
 * few hops. The env var is deliberately the harder thing to change — it needs host access.
 *
 * Every entry records who added it. This gate admits people to a shared universe holding other
 * members' trades, so "who let them in" is worth keeping even at this scale.
 */
export interface InviteDeps {
  readonly store: AllowlistStore;
  /** True when this email is on the env allowlist — i.e. an owner, not merely a member. */
  readonly isOwner: (email: string) => boolean;
  readonly now?: () => Date;
}

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
