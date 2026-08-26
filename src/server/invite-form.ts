import type { IncomingMessage, ServerResponse } from "node:http";
import type { NavContext } from "../observatory/dashboard-shell.js";
import { escapeHtml } from "../ui/escape-html.js";
import type { AllowlistEntry, AllowlistStore } from "./auth/allowlist-store.js";
import { railedShell } from "./page-shell.js";
import { handleSelfServiceForm, requireOwner } from "./self-service-forms.js";

/**
 * `/invite` — the owner's guest-list view: who is on it, and a field to add someone.
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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handleInvite(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
  viewerEmail: string | undefined,
  deps: InviteDeps,
  nav: NavContext,
): Promise<void> {
  // Rails on every page, refusal included (Eric, 2026-08-25, repeated: the app template applies
  // everywhere) — a signed-in non-owner refused this page still gets the drawer to navigate away
  // with, not a dead end.
  const owner = requireOwner(res, viewerEmail, deps.isOwner, (title, inner) =>
    railedShell(title, nav, inner),
  );
  if (!owner) return;

  // Same GET-serves-a-form / POST-parses-it shape as /add and /rotate, so it reuses their
  // dispatcher rather than pasting the method handling a third time (the clone gate caught
  // exactly that on the first cut of this file).
  const list = () => listHtml(deps.store.entries(), deps.store.canStoreSecurely());
  await handleSelfServiceForm(
    req,
    res,
    method,
    () => railedShell("Guest list", nav, list()),
    (form) => Promise.resolve(invite(form, owner, deps)),
    (result) => railedShell("Guest list", nav, result.note + list()),
  );
}

/** Validate and record one invitation. Pure enough to read at a glance; no I/O beyond the store. */
function invite(
  form: URLSearchParams,
  viewerEmail: string,
  deps: InviteDeps,
): { ok: boolean; note: string } {
  const raw = (form.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(raw)) {
    return { ok: false, note: `<p class="err">That doesn't look like an email address.</p>` };
  }

  const entry: AllowlistEntry = {
    value: raw,
    kind: "email",
    addedAt: (deps.now?.() ?? new Date()).toISOString(),
    addedBy: viewerEmail.toLowerCase(),
  };

  try {
    return {
      ok: true,
      note: deps.store.add(entry)
        ? `<p class="ok">Added ${escapeHtml(raw)}. They can sign in now.</p>`
        : `<p class="ok">${escapeHtml(raw)} was already on the list.</p>`,
    };
  } catch (err) {
    // The fail-closed write path: no store secret means invites are off, and saying so plainly
    // beats a page that looks like it worked.
    return {
      ok: false,
      note: `<p class="err">Couldn't save: ${escapeHtml((err as Error).message)}</p>`,
    };
  }
}

/** The "have they joined" column — the observability field this view exists for. */
function joinedCell(joinedAt: string | undefined): string {
  return joinedAt ? `Joined ${escapeHtml(joinedAt.slice(0, 10))}` : "Not yet";
}

function listHtml(entries: readonly AllowlistEntry[], canWrite: boolean): string {
  const rows = entries.length
    ? entries
        .map(
          (e) =>
            `<tr><td>${escapeHtml(e.value)}</td><td>${escapeHtml(e.addedAt.slice(0, 10))}</td>` +
            `<td>${escapeHtml(e.addedBy)}</td><td>${joinedCell(e.joinedAt)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="4">Nobody invited yet — the owners on <code>SKYNET_ALLOWED_EMAILS</code> can always sign in.</td></tr>`;

  const form = canWrite
    ? `<form method="post" action="/invite">
  <label for="email">Invite someone</label>
  <input id="email" name="email" type="email" placeholder="friend@gmail.com" required>
  <button type="submit">Add to the guest list</button>
</form>`
    : `<p class="err">Invites are off: <code>SKYNET_STORE_SECRET</code> isn't set, so the guest
       list can't be written encrypted. Set it and reload.</p>`;

  return `<h1>Guest list</h1>
<p>Anyone here can sign in. Owners are configured on the host and aren't listed below.</p>
<table><thead><tr><th>Email</th><th>Added</th><th>By</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
${form}`;
}
