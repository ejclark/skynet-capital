import type { IncomingMessage, ServerResponse } from "node:http";
import { deskHref } from "../observatory/desk-tabs.js";
import type { NavContext } from "../observatory/render-dashboard.js";
import { handleAccountRoute } from "./account-forms.js";
import type { Session } from "./auth/session.js";
import { handleClaim } from "./claim-form.js";
import { idOf, keyOf, resolveCurrentId } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { handleInvite } from "./invite-form.js";
import { handleAdd, handleRotate } from "./self-service-forms.js";

/**
 * Mission Control moved onto the account desk (#475), so the old `/controls` URL survives only as a
 * redirect — bookmarks and the pre-relocation drawer link keep working. The Settings tab is
 * owner-gated on arrival regardless of WHICH desk it's reached through (`handleDeskSettings`
 * re-checks independently of this call site), so landing a non-owner here is safe and leaks
 * nothing: they simply get that desk's overview. Prefers the viewer's OWN linked desk when one
 * exists, but Mission Control controls the whole fleet, not that one account — an owner with no
 * linked desk (2026-08-25: a real, expected state, not an edge case) still needs a door in, so
 * this falls back to any bot's desk rather than bouncing to the board with no way to reach the
 * switchboard at all.
 */
function redirectToDeskSettings(
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): void {
  const ownId = config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined;
  const id = ownId ?? config.controls?.bots()[0]?.id;
  res.writeHead(302, { location: id ? deskHref(id, "settings") : "/" });
  res.end();
}

/**
 * The owner-only admin pages — `/invite` (who may sign in) and `/claim` (which account each
 * sign-in owns). Grouped because they share one property: identity comes from the signed session
 * and nowhere else — there is no id in the URL to spoof — and each handler re-checks owner status
 * itself rather than trusting this call site. True when handled.
 */
async function tryOwnerPage(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  nav: NavContext,
): Promise<boolean> {
  if (path === "/invite" && config.invite) {
    await handleInvite(req, res, req.method ?? "GET", session?.email, config.invite, nav);
    return true;
  }
  if (path === "/claim" && config.claim) {
    await handleClaim(req, res, req.method ?? "GET", session?.email, config.claim, nav);
    return true;
  }
  return false;
}

/** `/add` (join the board) and `/rotate` (swap an existing account's key). True when handled. */
export async function trySelfServiceRoute(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  url: string,
  config: DashboardServerConfig,
  session: Session | undefined,
  nav: NavContext,
): Promise<boolean> {
  if (path === "/add" && config.addParticipant) {
    // The owner link: whoever's signed in is who this account belongs to, full stop — never a
    // field the form could fill in on someone else's behalf (Eric's ruling, 2026-08-21, #466).
    await handleAdd(
      req,
      res,
      req.method ?? "GET",
      keyOf(url),
      session?.email,
      config.addParticipant,
      nav,
    );
    return true;
  }
  if (path === "/controls" && config.controls) {
    redirectToDeskSettings(res, config, session);
    return true;
  }
  if (await tryOwnerPage(req, res, path, config, session, nav)) {
    return true;
  }
  if ((path === "/account" || path === "/account/remove") && config.accountAdmin) {
    // Same identity resolution /rotate and /trade use; account-service enforces the rules.
    await handleAccountRoute(req, res, path, req.method ?? "GET", {
      admin: config.accountAdmin,
      requesterId: config.auth ? resolveCurrentId(session, config.resolveOwnerId) : undefined,
      session,
      authConfigured: Boolean(config.auth),
      key: keyOf(url),
    });
    return true;
  }
  if (path === "/rotate" && config.rotateCredentials) {
    const requester = rotateRequester(config, session);
    // Eric, 2026-08-25: "ensure the email is used as the unique identifier — they know email,
    // they don't know their account ID." A link that names an id (an error card, a profile page)
    // still wins — it's the most specific signal — but absent one, a viewer whose SIGN-IN already
    // resolves to an account (linked via ownerEmail, however that link was made) gets that account
    // prefilled automatically. Email, via the session, becomes the identifier for the return
    // visit — nobody re-derives or types an id once they're linked. An unlinked viewer is the one
    // case this can't solve (there's nothing yet to resolve the email against); the form still
    // falls back to free text there, same as before.
    const prefillId = idOf(url) || requester.id || "";
    await handleRotate(
      req,
      res,
      req.method ?? "GET",
      keyOf(url),
      prefillId,
      requester,
      config.rotateCredentials,
    );
    return true;
  }
  return false;
}

/**
 * The identity /rotate hands the service: who the signed-in session resolves to (the same link
 * "isSelf"/nav highlighting uses), so rotateCredentials can refuse to let one authed member
 * silently redirect ANOTHER member's displayed account to credentials the member supplies
 * themselves (docs/LESSONS.md, 2026-08-11: this route fixes YOUR OWN regenerated key, not
 * someone else's identity). The session EMAIL rides along for env-roster targets, which are
 * owner-gated in the service; both fields are absent exactly when OAuth isn't configured.
 */
function rotateRequester(
  config: DashboardServerConfig,
  session: Session | undefined,
): { id?: string; email?: string } {
  if (!config.auth) return {};
  const id = resolveCurrentId(session, config.resolveOwnerId);
  return {
    ...(id !== undefined ? { id } : {}),
    ...(session ? { email: session.email } : {}),
  };
}
