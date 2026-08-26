import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server.js";

/**
 * Resolve the signed-in viewer to the participant they own (#466) — undefined when no
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

export function keyOf(url: string): string {
  return new URL(url, "http://localhost").searchParams.get("key") ?? "";
}

/** `/rotate?id=…` — the id a link that already names the account carries in, so nobody types it. */
export function idOf(url: string): string {
  return new URL(url, "http://localhost").searchParams.get("id") ?? "";
}
