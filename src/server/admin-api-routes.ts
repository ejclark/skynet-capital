import type { IncomingMessage, ServerResponse } from "node:http";
import type { AllowlistEntry } from "./auth/allowlist-store.js";
import type { Session } from "./auth/session.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";
import { EMAIL } from "./invite-form.js";
import { boundedString, parseJsonRecord, readJsonPost, sendJson } from "./page-shell.js";

/**
 * THE OWNER PAGES AS DATA (#738 phase 9e) — `/invite`, `/claim`, and `/ops-status` for the
 * shell, one owner-gated family:
 *
 *   GET/POST /api/admin/invite     → the guest list: who may sign in, with the joined column;
 *                                    POST adds one address (the legacy page's only write).
 *   GET/POST /api/admin/claim      → account links: who the desk believes each account belongs
 *                                    to; POST links or unlinks. Linking grants order-placement
 *                                    on the account, so it stays deliberately owner-only, and
 *                                    an address that can't sign in is refused exactly as the
 *                                    HTML page refuses it.
 *   GET      /api/admin/ops-status → the read-only bots/deploy health panel.
 *
 * The rules are Mission Control's (`controls-api-routes.ts`): the owner check re-runs here on
 * every request against each surface's OWN dep, never inherited; every non-owner GET answers
 * `{owner:false}` and nothing else — a member probing an owner page learns nothing; POSTs from
 * non-owners get a flat 403. Refusal and success sentences mirror the HTML pages', minus markup.
 */

const ADMIN_BODY_CAP_BYTES = 2_048;

function ownerOf(
  isOwner: ((email: string) => boolean) | undefined,
  session: Session | undefined,
): string | undefined {
  const email = session?.email.toLowerCase();
  return isOwner && email && isOwner(email) ? email : undefined;
}

function inviteList(config: DashboardServerConfig): unknown {
  const store = config.invite?.store;
  return {
    owner: true,
    secure: store?.canStoreSecurely() ?? false,
    entries: (store?.entries() ?? []).map((e: AllowlistEntry) => ({
      email: e.value,
      addedAt: e.addedAt,
      addedBy: e.addedBy,
      ...(e.joinedAt ? { joinedAt: e.joinedAt } : {}),
    })),
  };
}

async function serveInvite(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const owner = ownerOf(config.invite?.isOwner, session);
  if ((req.method ?? "GET") === "GET") {
    sendJson(res, 200, owner && config.invite ? inviteList(config) : { owner: false });
    return;
  }
  const raw = await readJsonPost(req, res, ADMIN_BODY_CAP_BYTES);
  if (raw === undefined) return;
  if (!(owner && config.invite)) {
    sendJson(res, 403, { error: "The guest list answers only to owners." });
    return;
  }
  const body = parseJsonRecord(raw);
  const email = body ? boundedString(body.email, 120)?.trim().toLowerCase() : undefined;
  if (!(email && EMAIL.test(email))) {
    sendJson(res, 200, { ok: false, error: "That doesn't look like an email address." });
    return;
  }
  try {
    const added = config.invite.store.add({
      value: email,
      kind: "email",
      addedAt: new Date().toISOString(),
      addedBy: owner,
    });
    sendJson(res, 200, {
      ok: true,
      message: added
        ? `Added ${email}. They can sign in now.`
        : `${email} was already on the list.`,
    });
  } catch (err) {
    // Fail-closed write path: no store secret means invites are off — say so plainly.
    sendJson(res, 200, { ok: false, error: `Couldn't save: ${(err as Error).message}` });
  }
}

function claimList(config: DashboardServerConfig): unknown {
  const claim = config.claim;
  const links = claim?.store.load().links ?? [];
  const accounts = (claim?.accounts() ?? []).map((a) => {
    const link = links.find((l) => l.participantId === a.id);
    return {
      id: a.id,
      displayName: a.displayName,
      kind: a.kind,
      owner: a.ownerEmail ?? link?.email,
      source: a.ownerEmail
        ? "connected at sign-up"
        : link
          ? `linked ${link.at.slice(0, 10)}`
          : undefined,
      linked: Boolean(link),
    };
  });
  return { owner: true, accounts };
}

function applyClaim(
  config: DashboardServerConfig,
  owner: string,
  body: Record<string, unknown>,
): { ok: boolean; message?: string; error?: string } {
  const claim = config.claim;
  if (!claim) return { ok: false, error: "Account links aren't wired in this deployment." };
  const id = boundedString(body.id, 100)?.trim();
  const account = claim.accounts().find((a) => a.id === id);
  if (!(id && account)) return { ok: false, error: "That isn't an account on the board." };
  if (body.unlink === true) {
    return claim.store.unlink(id, new Date())
      ? { ok: true, message: `Unlinked ${account.displayName}.` }
      : { ok: false, error: `${account.displayName} wasn't linked.` };
  }
  const email = boundedString(body.email, 120)?.trim().toLowerCase();
  if (!(email && EMAIL.test(email))) {
    return { ok: false, error: "That doesn't look like an email address." };
  }
  if (!claim.canSignIn(email)) {
    return {
      ok: false,
      error: `${email} can't sign in yet, so a link would be unusable. Invite them on the guest list first.`,
    };
  }
  try {
    claim.store.link(id, email, owner, new Date());
    return {
      ok: true,
      message: `${account.displayName} is now ${email}'s — they can trade it from the desk on their next page load. No keys changed; the history is untouched.`,
    };
  } catch (error) {
    return { ok: false, error: `Couldn't save: ${(error as Error).message}` };
  }
}

async function serveClaim(
  req: IncomingMessage,
  res: ServerResponse,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<void> {
  const owner = ownerOf(config.claim?.isOwner, session);
  if ((req.method ?? "GET") === "GET") {
    sendJson(res, 200, owner && config.claim ? claimList(config) : { owner: false });
    return;
  }
  const raw = await readJsonPost(req, res, ADMIN_BODY_CAP_BYTES);
  if (raw === undefined) return;
  if (!owner) {
    sendJson(res, 403, { error: "Account links answer only to owners." });
    return;
  }
  const body = parseJsonRecord(raw);
  if (!body) {
    sendJson(res, 400, { error: "malformed claim body" });
    return;
  }
  sendJson(res, 200, applyClaim(config, owner, body));
}

/** Handle `/api/admin/*`. Returns true when the request was answered. */
export async function serveAdminApi(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  config: DashboardServerConfig,
  session: Session | undefined,
): Promise<boolean> {
  if (path === "/api/admin/invite") {
    await serveInvite(req, res, config, session);
    return true;
  }
  if (path === "/api/admin/claim") {
    await serveClaim(req, res, config, session);
    return true;
  }
  if (path === "/api/admin/ops-status") {
    const owner = ownerOf(config.opsStatus?.isOwner, session);
    sendJson(
      res,
      200,
      owner && config.opsStatus
        ? { owner: true, status: await config.opsStatus.status() }
        : { owner: false },
    );
    return true;
  }
  return false;
}
