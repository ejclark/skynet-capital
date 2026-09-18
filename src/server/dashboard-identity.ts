import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";

/**
 * Resolve the signed-in viewer to the participant they own — undefined when no
 * `resolveOwnerId` is wired, or the session's email owns no account (an account with no owner
 * link resolves to nobody until an owner attaches one from `/claim`).
 */
export function resolveCurrentId(
  session: Session | undefined,
  resolveOwnerId: ((email: string) => string | undefined) | undefined,
): string | undefined {
  if (!(session && resolveOwnerId)) return undefined;
  return resolveOwnerId(session.email);
}

/** All ids the session owns — plural hook first, else the single `resolveOwnerId` as a list. */
export function resolveOwnedIds(
  session: Session | undefined,
  config: DashboardServerConfig,
): readonly string[] {
  if (!session) return [];
  if (config.resolveOwnerIds) return config.resolveOwnerIds(session.email);
  const single = resolveCurrentId(session, config.resolveOwnerId);
  return single ? [single] : [];
}

/**
 * The requester an ownership check should compare an explicit target against — the target itself
 * when the session owns it, else the session's first human account, else its first account at
 * all (the `/account` route's rule, `settings-api-routes.ts`'s original `requesterFor`).
 *
 * `resolveCurrentId`'s single default always resolves to the SAME account regardless of which one
 * a request names, so a session that owns more than one account — a stamped human account plus a
 * `/claim`-linked bot, say — sees every owned account except that one default refused as "not your
 * own account." This is the fix: compare the actual target against the full owned set
 * (`resolveOwnedIds`) instead of equating it with the single default.
 */
export function requesterFor(
  targetId: string,
  ownedIds: readonly string[],
  participants: readonly { readonly id: string; readonly kind?: "bot" | "human" }[],
): string | undefined {
  if (ownedIds.includes(targetId)) return targetId;
  return (
    ownedIds.find((id) => participants.find((p) => p.id === id)?.kind === "human") ?? ownedIds[0]
  );
}

/** The legacy shared-password gate's `?key=` param — still load-bearing when `config.auth` isn't
 *  configured (localhost/offline mode); see `dashboard-auth-gate.ts`. */
export function keyOf(url: string): string {
  return new URL(url, "http://localhost").searchParams.get("key") ?? "";
}
