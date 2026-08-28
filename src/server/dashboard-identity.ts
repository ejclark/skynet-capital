import type { OwnedAccountOption } from "./account-form-context.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";

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

/**
 * `resolveOwnedIds`, with display names attached — for a picker, not just a resolved default.
 * Eric, 2026-08-25: "this should be a dropdown of the accounts tied to the email address" — a
 * signed-in email can own more than one account now that `/claim` links any kind, so a single
 * resolved id is no longer enough to render a form field from. Not exported: every call site now
 * goes through `rotatableAccountOptions`, which composes this with the owner-only roster widening.
 */
function ownedAccountOptions(
  session: Session | undefined,
  config: DashboardServerConfig,
): readonly OwnedAccountOption[] {
  const ids = resolveOwnedIds(session, config);
  if (ids.length === 0) return [];
  const board = config.hub.getState().participants;
  return ids.map((id) => {
    const found = board.find((p) => p.id === id);
    return {
      id,
      displayName: found?.displayName ?? id,
      kind: found?.kind ?? "human",
      ...(found?.accountNumber ? { accountNumber: found.accountNumber } : {}),
    };
  });
}

/**
 * The account picker for `/rotate` specifically — unlike `ownedAccountOptions`, widened for an
 * OWNER to every roster (host-configured) account, matching `refuseRotation`'s actual
 * authorization boundary (it already lets an owner rotate any of those regardless of
 * `ownerEmail`). Reported live, 2026-08-27: an owner whose own roster account had no working
 * `ownerEmail` link resolved to a DIFFERENT owned account instead (a bot), and the field locked
 * on it with no way to pick another — `resolveOwnedIds` alone can't see an unlinked roster
 * account no matter whose email it belongs to. Never applies to `/account`'s edit/remove picker,
 * whose authorization has no owner bypass — offering an account there that then gets refused
 * would be worse than today's narrower (but honest) list.
 */
export function rotatableAccountOptions(
  session: Session | undefined,
  config: DashboardServerConfig,
): readonly OwnedAccountOption[] {
  const owned = ownedAccountOptions(session, config);
  if (!(session && config.isOwnerEmail?.(session.email))) return owned;
  const rosterIds = config.rosterIds?.() ?? new Set<string>();
  if (rosterIds.size === 0) return owned;
  const seen = new Set(owned.map((a) => a.id));
  const board = config.hub.getState().participants;
  const rosterOptions = board
    .filter((p) => rosterIds.has(p.id) && !seen.has(p.id))
    .map((p) => ({
      id: p.id,
      displayName: p.displayName,
      kind: p.kind,
      ...(p.accountNumber ? { accountNumber: p.accountNumber } : {}),
    }));
  return [...owned, ...rosterOptions];
}

/**
 * A board display name for ANY id, not just ones the caller owns — for showing a locked `/rotate`
 * target by name instead of its internal slug (Eric, 2026-08-26: "account id is made up by you..
 * why do you even bother showing it?"). Falls back to the id itself only when the account genuinely
 * isn't on the board (a stale link) — there's nothing better to show at that point.
 */
export function displayNameFor(config: DashboardServerConfig, id: string): string {
  return config.hub.getState().participants.find((p) => p.id === id)?.displayName ?? id;
}

export function keyOf(url: string): string {
  return new URL(url, "http://localhost").searchParams.get("key") ?? "";
}

/** `/rotate?id=…` — the id a link that already names the account carries in, so nobody types it. */
export function idOf(url: string): string {
  return new URL(url, "http://localhost").searchParams.get("id") ?? "";
}
