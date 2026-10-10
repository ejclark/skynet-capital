import { Link } from "@tanstack/react-router";
import { type ReactElement, useCallback, useId, useState } from "react";
import type { OwnedAccount } from "../live/settings";
import { ALL_ACCOUNTS } from "./account-switcher";
import { useDismiss } from "./use-dismiss";

/**
 * THE MENU UNDER THE ACCOUNT'S NAME (#5072 — #5037 round 2, question 3's "setup behind the name").
 * Eric, round 1: account settings and adding accounts are "secondary/auxiliary… should be
 * relocated". So the head shows the account's name and nothing else to set up; one tap on the name
 * opens everything that changes WHICH account this is or HOW it is set up:
 *
 *   - switch account — every owned account, its kind and SIM, then All accounts; the default star
 *     rides each account's own row (★ marks the one the page opens on, ☆ makes another the default);
 *   - + Add an account (the connect guide, in Milestones);
 *   - this account's settings — keys, timezone, removing it — opened on that account;
 *   - this account as the league sees it (`/u/:id`).
 *
 * The common pattern, not an invention: a workspace or mailbox switcher under the name. A floating
 * menu, so a click outside or Escape closes it (`useDismiss`, shared with the member menu) — it
 * covers the page for a moment and moves nothing in the flow. Picking an account closes it; the star
 * does not, so a member can make one the default and still pick another.
 * @category accounts
 */

const KIND: Record<OwnedAccount["kind"], string> = { human: "Human", bot: "Bot" };

function DefaultStar({
  account,
  isDefault,
  onSetDefault,
  onClearDefault,
}: {
  readonly account: OwnedAccount;
  readonly isDefault: boolean;
  readonly onSetDefault: (id: string) => void;
  readonly onClearDefault: () => void;
}): ReactElement {
  return (
    <button
      type="button"
      className="acct-menu-default"
      aria-pressed={isDefault}
      title={
        isDefault
          ? "This account opens by default — click to clear"
          : "Open on this account by default"
      }
      onClick={() => (isDefault ? onClearDefault() : onSetDefault(account.id))}
    >
      <span aria-hidden="true">{isDefault ? "★" : "☆"}</span>{" "}
      {isDefault ? "Default" : "Make default"}
      <span className="visually-hidden"> for {account.name}</span>
    </button>
  );
}

export function AccountMenu({
  accounts,
  selectedId,
  onSelect,
  defaultId,
  onSetDefault,
  onClearDefault,
}: {
  readonly accounts: readonly OwnedAccount[];
  /** An owned account's id, or `ALL_ACCOUNTS`. */
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  /** The stored default the page opens on, when it still names an owned account. */
  readonly defaultId: string | undefined;
  readonly onSetDefault: (id: string) => void;
  readonly onClearDefault: () => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { wrapRef, buttonRef } = useDismiss(open, close);
  const menuId = useId();
  const picked = accounts.find((a) => a.id === selectedId);
  const label = picked?.name ?? "All accounts";
  const pick = (id: string) => {
    onSelect(id);
    close();
  };

  return (
    <div className="acct-menu-wrap" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="acct-menu-btn"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account: ${label}`}
        onClick={() => setOpen((was) => !was)}
      >
        <span className="acct-menu-name">{label}</span>
        <span className="acct-menu-chev" aria-hidden="true">
          <svg width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden="true">
            <path
              d="M1 1.2 4.5 4.7 8 1.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <nav className="acct-menu" id={menuId} aria-label="Account menu">
          <p className="acct-menu-eyebrow">Switch account</p>
          <ul className="acct-menu-list">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="acct-menu-row"
                data-current={a.id === selectedId || undefined}
              >
                <button
                  type="button"
                  className="acct-menu-pick"
                  aria-pressed={a.id === selectedId}
                  onClick={() => pick(a.id)}
                >
                  <span className="acct-menu-mark" aria-hidden="true" />
                  <span className="acct-menu-who">{a.name}</span>
                  <span className="acct-menu-kind">{KIND[a.kind]} · SIM</span>
                </button>
                <DefaultStar
                  account={a}
                  isDefault={a.id === defaultId}
                  onSetDefault={onSetDefault}
                  onClearDefault={onClearDefault}
                />
              </li>
            ))}
            <li className="acct-menu-row" data-current={selectedId === ALL_ACCOUNTS || undefined}>
              <button
                type="button"
                className="acct-menu-pick"
                aria-pressed={selectedId === ALL_ACCOUNTS}
                onClick={() => pick(ALL_ACCOUNTS)}
              >
                <span className="acct-menu-mark" aria-hidden="true" />
                <span className="acct-menu-who">All accounts</span>
              </button>
            </li>
          </ul>
          <div className="acct-menu-items">
            <a
              className="acct-menu-item"
              href="/app/accounts?section=milestones&chapter=onboarding"
            >
              <span className="acct-menu-glyph" aria-hidden="true">
                +
              </span>
              Add an account
            </a>
            {picked ? (
              <>
                <Link
                  to="/settings"
                  search={{ section: "account", account: picked.id }}
                  className="acct-menu-item"
                  onClick={close}
                >
                  <span className="acct-menu-glyph" aria-hidden="true">
                    ⚙
                  </span>
                  <span className="acct-menu-item-words">
                    {picked.name}'s settings
                    <span className="acct-menu-item-note">
                      keys · timezone · remove the account
                    </span>
                  </span>
                </Link>
                <Link
                  to="/u/$id"
                  params={{ id: picked.id }}
                  className="acct-menu-item"
                  onClick={close}
                >
                  <span className="acct-menu-glyph" aria-hidden="true">
                    ↗
                  </span>
                  {picked.name} as the league sees it
                </Link>
              </>
            ) : (
              <Link
                to="/settings"
                search={{ section: "account" }}
                className="acct-menu-item"
                onClick={close}
              >
                <span className="acct-menu-glyph" aria-hidden="true">
                  ⚙
                </span>
                Account settings
              </Link>
            )}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
