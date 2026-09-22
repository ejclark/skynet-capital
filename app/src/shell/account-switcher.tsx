import type { ReactElement } from "react";
import { useId } from "react";
import type { OwnedAccount } from "../live/settings";

/** Every account the viewer can see, human- and bot-owned alike (#2321) — Alpaca itself has no
 *  such distinction, so the switcher never branches on `kind` beyond labeling the option. */
export const ALL_ACCOUNTS = "all";

/** Progressive disclosure (Eric, 2026-09-04): rendering every owned account's full card at once
 *  doesn't scale and buries the one you came to edit. A dropdown picks one; only that account's
 *  card renders below it. `allowAll` (#2321) adds an "All accounts" option for pages that can
 *  meaningfully aggregate across accounts (the unified Accounts view) — Settings never sets it,
 *  since editing "all accounts" at once has no meaning.
 *  @category desk
 */
export function AccountSwitcher({
  accounts,
  selectedId,
  onSelect,
  allowAll,
  isDefault,
  onToggleDefault,
}: {
  readonly accounts: readonly OwnedAccount[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly allowAll?: boolean;
  /** True when `selectedId` is the stored default the Cockpit opens on. Omit the whole affordance
   *  (never render a disabled star) on a page that doesn't carry a default, e.g. Settings. */
  readonly isDefault?: boolean;
  readonly onToggleDefault?: () => void;
}): ReactElement {
  const selectId = useId();
  return (
    <div className="set-switch">
      <div className="field set-switch-field">
        <label htmlFor={selectId}>Account</label>
        <select id={selectId} value={selectedId} onChange={(e) => onSelect(e.target.value)}>
          {allowAll ? <option value={ALL_ACCOUNTS}>All accounts</option> : null}
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.kind === "bot" ? "Bot" : "Human"}
            </option>
          ))}
        </select>
      </div>
      {onToggleDefault && selectedId !== ALL_ACCOUNTS ? (
        <button
          type="button"
          className={`set-switch-default${isDefault ? " is-default" : ""}`}
          aria-pressed={isDefault}
          onClick={onToggleDefault}
          title={
            isDefault
              ? "This account opens by default — click to clear"
              : "Open on this account by default"
          }
        >
          <span aria-hidden="true">{isDefault ? "★" : "☆"}</span>
          {isDefault ? "Default" : "Set as default"}
        </button>
      ) : null}
      <a className="set-switch-add" href="/app/onboarding">
        + Add an account
      </a>
    </div>
  );
}
