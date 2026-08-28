import { escapeHtml } from "../ui/escape-html.js";
import type { AccountFormContext } from "./account-form-context.js";

/**
 * The two lines above `/account`'s forms that answer "which account am I looking at?" — the
 * switcher between the caller's accounts, and the name→broker-identity line for the one selected.
 * Split out of account-forms.ts when #732 added the second: that file was sitting exactly on its
 * 300-line arch cap, and these two are a cohesive pair (both pure `ctx → html`, both header chrome,
 * neither touching the forms or the services below them).
 */

/**
 * The switcher between the caller's own accounts — rendered only when there's more than one to
 * pick from. A real navigation (links to `/account?id=<id>`), never an inline form field, so the
 * profile-edit form and the remove form below always agree on the same account: switching is a
 * page load, not a value the two forms could silently drift apart on.
 */
export function accountSwitcher(ctx: AccountFormContext): string {
  if (ctx.ownedAccounts.length <= 1) return "";
  const pills = ctx.ownedAccounts
    .map((a) =>
      a.id === ctx.requesterId
        ? `<b>${escapeHtml(a.displayName)}</b>`
        : `<a href="/account?id=${encodeURIComponent(a.id)}${ctx.key ? `&key=${encodeURIComponent(ctx.key)}` : ""}">${escapeHtml(a.displayName)}</a>`,
    )
    .join(" · ");
  return `<p class="note" style="margin:0 0 18px">Managing: ${pills}</p>`;
}

/**
 * Name → broker identity, for the one account this page-view is managing (#732: "that will help
 * confirm which account belongs to the name"). Alpaca's account NUMBER specifically — not the
 * internal `human-…` slug, and not the API's UUID; the number is what Alpaca's own dashboard shows
 * a member, so it's the only value they can match against by eye. Says so out loud when the board
 * has no number for the account: a silently missing line would read as "this account has none"
 * rather than the truth, which is that the last read didn't carry one.
 */
export function accountIdentity(ctx: AccountFormContext): string {
  const current = ctx.ownedAccounts.find((a) => a.id === ctx.requesterId);
  if (!current) return "";
  const number = current.accountNumber
    ? `Alpaca account <code style="color:var(--text);letter-spacing:.06em">${escapeHtml(current.accountNumber)}</code>`
    : "Alpaca account number not read yet — it appears here after the board's next successful read of this account.";
  return `<p class="note" style="margin:0 0 18px"><b>${escapeHtml(current.displayName)}</b> · ${number}</p>`;
}
