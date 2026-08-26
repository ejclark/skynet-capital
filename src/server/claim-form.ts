import type { IncomingMessage, ServerResponse } from "node:http";
import type { NavContext } from "../observatory/dashboard-shell.js";
import { escapeHtml } from "../ui/escape-html.js";
import type { OwnerLinkStore } from "./owner-link-store.js";
import { addShell, railedShell } from "./page-shell.js";
import { handleSelfServiceForm, requireOwner } from "./self-service-forms.js";

/**
 * `/claim` — attach an account that is ALREADY on the board to a member's sign-in (#546).
 *
 * **The gap this closes.** The desk resolves a session to exactly one account, through
 * `Participant.ownerEmail`, and that field is stamped only by `/add`. Accounts that predate the
 * connect form — and every env-declared roster row, which is rebuilt from the host environment
 * on each boot — carry no owner. They render on the board with their full trade history and are
 * permanently untradeable, while `/add` refuses them as duplicates: a closed loop with no exit.
 * This page is the exit, and it costs no credentials: nothing about the account changes except
 * who the app believes owns it.
 *
 * **Owner tier, deliberately.** Linking an account is granting the power to trade it, and there
 * is no proof of ownership a *member* could offer here that the app can check — the only honest
 * proof is the account's Alpaca key, which is exactly the re-connect this closes. So the same
 * two-tier split `/invite` uses applies: env-configured owners link, members do not, and the
 * page is invisible (403, identically for "not signed in") to everyone else. A grant nobody can
 * verify is one an owner should make.
 *
 * **What it will not do.** It never re-assigns an account that already has an owner. Correcting
 * a stamped owner is a different, riskier operation than filling in a missing one, and rolling
 * both into one form would make the safe case carry the dangerous case's blast radius.
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

/** Board participants → the view this page needs. Credentials never cross this boundary. */
export function toClaimAccounts(participants: readonly ClaimAccount[]): ClaimAccount[] {
  return participants.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    kind: p.kind,
    ...(p.ownerEmail ? { ownerEmail: p.ownerEmail } : {}),
  }));
}

/** Shape only — the gate on who may actually be linked is `canSignIn`, not this. */
const looksLikeEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function handleClaim(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  viewerEmail: string | undefined,
  deps: ClaimDeps,
  nav: NavContext,
): Promise<void> {
  // The refusal stays on the bare, wide shell — nothing for a rail to navigate a non-owner to
  // (same call as /invite, /add). The real content gets the app shell, wide (four columns of
  // accounts don't fit the 520px form column the other self-service pages use, and a table that
  // wraps is a table nobody reads) — this page was previously reachable ONLY by typing the URL,
  // with no nav link anywhere (Eric, 2026-08-25: it's the actual zero-typing fix for "link my
  // account", and it was invisible).
  const refusalShell = (title: string, inner: string) =>
    addShell(`${title} · Skynet Capital`, inner, true);
  const owner = requireOwner(res, viewerEmail, deps.isOwner, refusalShell);
  if (!owner) return;

  const shell = (title: string, inner: string) =>
    railedShell(`${title} · Skynet Capital`, nav, inner, true);
  const page = () => claimPageHtml(deps);
  await handleSelfServiceForm(
    req,
    res,
    method,
    () => shell("Account links", page()),
    (form) => Promise.resolve(submit(form, owner, deps)),
    (result) => shell("Account links", result.note + page()),
  );
}

/** Validate and apply one link (or unlink). No I/O beyond the store — readable at a glance. */
function submit(
  form: URLSearchParams,
  viewerEmail: string,
  deps: ClaimDeps,
): { ok: boolean; note: string } {
  const id = (form.get("id") ?? "").trim();
  const account = deps.accounts().find((a) => a.id === id);
  if (!account) {
    return { ok: false, note: noteErr(`No account named "${id}" is on the board.`) };
  }

  if (form.get("unlink") === "1") {
    return deps.store.unlink(id, deps.now?.() ?? new Date())
      ? { ok: true, note: noteOk(`Unlinked ${escapeHtml(account.displayName)}.`) }
      : { ok: false, note: noteErr(`${escapeHtml(account.displayName)} wasn't linked.`) };
  }

  if (account.ownerEmail) {
    return {
      ok: false,
      note: noteErr(
        `${escapeHtml(account.displayName)} already belongs to ${escapeHtml(account.ownerEmail)} — this page fills in a MISSING owner, it doesn't reassign one.`,
      ),
    };
  }

  const email = (form.get("email") ?? "").trim().toLowerCase();
  if (!looksLikeEmail(email)) {
    return { ok: false, note: noteErr("That doesn't look like an email address.") };
  }
  if (!deps.canSignIn(email)) {
    return {
      ok: false,
      note: noteErr(
        `${escapeHtml(email)} can't sign in yet, so a link would be unusable. Invite them on <a href="/invite">the guest list</a> first.`,
      ),
    };
  }

  try {
    deps.store.link(id, email, viewerEmail, deps.now?.() ?? new Date());
    return {
      ok: true,
      note: noteOk(
        `${escapeHtml(account.displayName)} is now ${escapeHtml(email)}'s — they can trade it from the desk on their next page load. No keys changed; the history is untouched.`,
      ),
    };
  } catch (error) {
    return { ok: false, note: noteErr(`Couldn't save: ${escapeHtml((error as Error).message)}`) };
  }
}

const noteOk = (inner: string): string => `<p class="ok">${inner}</p>`;
const noteErr = (inner: string): string => `<p class="err">${inner}</p>`;

function claimPageHtml(deps: ClaimDeps): string {
  const accounts = deps.accounts();
  const linked = deps.store.load().links;
  const linkFor = (id: string) => linked.find((l) => l.participantId === id);
  const unowned = accounts.filter((a) => !(a.ownerEmail || linkFor(a.id)));

  const rows = accounts.length
    ? accounts.map((a) => rowHtml(a, linkFor(a.id))).join("")
    : `<tr><td colspan="4">No accounts on the board yet.</td></tr>`;

  const form = unowned.length
    ? `<form method="post" action="/claim">
  <label for="id">Account
    <select id="id" name="id" required>${unowned
      .map((a) => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.displayName)}</option>`)
      .join("")}</select>
  </label>
  <label for="email">Belongs to<input id="email" name="email" type="email" placeholder="friend@gmail.com" required></label>
  <button type="submit">Link this account</button>
</form>`
    : `<p class="note">Every account on the board already has an owner — nothing to link.</p>`;

  return `<h1>Account links</h1>
<p class="lede">Who the desk believes each account belongs to. An account with no owner still shows on the
board and keeps its full history — it just can't be traded, because a sign-in only trades the
account it owns. Linking one here fixes that without re-adding it or touching its keys.</p>
<table><thead><tr><th>Account</th><th>Owner</th><th>Source</th><th></th></tr></thead><tbody>${rows}</tbody></table>
${form}
<p class="note">Only an owner sees this page. Linking grants the power to place orders on that
account, so it is deliberately not something a member can do for themselves.</p>`;
}

function rowHtml(account: ClaimAccount, link: { email: string; at: string } | undefined): string {
  const owner = account.ownerEmail ?? link?.email;
  const source = account.ownerEmail
    ? "connected at sign-up"
    : link
      ? `linked ${escapeHtml(link.at.slice(0, 10))}`
      : "—";
  const action = link
    ? `<form method="post" action="/claim"><input type="hidden" name="id" value="${escapeHtml(account.id)}"><input type="hidden" name="unlink" value="1"><button type="submit">Unlink</button></form>`
    : "";
  return `<tr><td>${escapeHtml(account.displayName)} <small>${escapeHtml(account.id)}${account.kind === "bot" ? " · bot" : ""}</small></td><td>${owner ? escapeHtml(owner) : "<b>nobody — can't trade</b>"}</td><td>${source}</td><td>${action}</td></tr>`;
}
