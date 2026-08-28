/**
 * Boot-time access control for the dashboard server: the guest-list/allowlist, Mission Control's
 * switch store, the known-persona roster the switchboard is restricted to, the resolved
 * authenticator (or password fallback), and the owner-link lookup that maps a signed-in email to
 * the account(s) it owns. Pulled out of `serve-dashboard.ts` to keep that file's own complexity
 * budget (`scripts/arch-scan.mjs`'s sibling lint gate) — this is still just wiring, no state of
 * its own beyond the stores it constructs.
 */

import type { Participant } from "../participants/participant.js";
import { createDefaultPersonas } from "../personas/registry.js";
import { createAllowlistStore } from "../server/auth/allowlist-store.js";
import { resolveAuth } from "../server/auth/resolve-auth.js";
import { createBotControlsStore } from "../server/bot-controls-store.js";
import { createOwnerLinkStore, resolveOwnedParticipantIds } from "../server/owner-link-store.js";

export interface AccessSetup {
  allowlist: ReturnType<typeof createAllowlistStore>;
  botControls: ReturnType<typeof createBotControlsStore>;
  knownPersonaIds: Set<string>;
  auth: ReturnType<typeof resolveAuth>;
  password: string | undefined;
  ownerLinks: ReturnType<typeof createOwnerLinkStore>;
  resolveOwnerIds: (email: string) => string[];
  resolveOwnerId: (email: string) => string | undefined;
}

/**
 * Resolve the guest list, Mission Control store, authenticator, and owner-link lookup for one
 * boot. `liveRoster` is read lazily on every owner-lookup call (not cached here) so a
 * runtime-added or rotated account is covered the moment it lands, exactly like the caller's own
 * live merge.
 */
export function setupAccess(
  env: NodeJS.ProcessEnv,
  liveRoster: () => readonly Participant[],
): AccessSetup {
  // The guest list lives on the mounted volume, encrypted at rest, and is unioned with the env
  // allowlist inside resolveAuth. Built here so the /invite route and the authenticator read the
  // exact same store — two sources of truth for who may sign in is the bug worth designing out.
  const allowlist = createAllowlistStore(env, (m) => console.error(m));
  // Mission Control state, on the volume beside the other member data (SKYNET_CONTROLS_FILE →
  // /data/bot-controls.json in prod). Plain JSON — switches, not secrets.
  const botControls = createBotControlsStore(env, (m) => console.error(m));
  const knownPersonaIds = new Set(createDefaultPersonas().map((p) => p.id));
  const auth = resolveAuth(env, undefined, allowlist);
  const password = env.SKYNET_DASHBOARD_PASSWORD;
  if (auth) {
    if (auth.allowlistEmpty) {
      console.warn(
        "⚠️  OAuth login is on but the allowlist is empty — nobody can sign in. Set SKYNET_ALLOWED_EMAILS.",
      );
    }
  } else if (!password) {
    console.warn(
      "⚠️  No auth configured and no SKYNET_DASHBOARD_PASSWORD set — the dashboard is OPEN to anyone who can reach it. Fine for localhost; configure OAuth or a password before exposing it publicly.",
    );
  }
  if (!env.SKYNET_STORE_SECRET) {
    console.warn(
      "⚠️  No SKYNET_STORE_SECRET set — self-service onboarding (/add) is DISABLED so credentials are never written unencrypted. Set it to enable onboarding.",
    );
  }

  // Owner links for accounts that carry no `ownerEmail` of their own — every env-declared roster
  // row without a stamp, and anything added before the connect form existed (#546). Plain JSON on
  // the volume beside bot-controls.json: an id and an already-admitted email, no credentials.
  const ownerLinks = createOwnerLinkStore(env, (m) => console.error(m));
  // The owner link: session email -> the account(s) it owns. Never exposed on ParticipantSnapshot.
  // The precedence rule (stamps and links unioned, a stray link can't redirect an already-stamped
  // account) lives in `resolveOwnedParticipantIds` — see that function's doc for the 2026-08-27
  // fix (a member with both a stamped account and a separately linked one used to see only one).
  const resolveOwnerIds = (email: string): string[] =>
    resolveOwnedParticipantIds(liveRoster(), ownerLinks.load().links, email);
  const resolveOwnerId = (email: string): string | undefined => resolveOwnerIds(email)[0];

  return {
    allowlist,
    botControls,
    knownPersonaIds,
    auth,
    password,
    ownerLinks,
    resolveOwnerIds,
    resolveOwnerId,
  };
}
