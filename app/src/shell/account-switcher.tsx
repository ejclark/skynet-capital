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
}: {
  readonly accounts: readonly OwnedAccount[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
  readonly allowAll?: boolean;
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
      <a className="set-switch-add" href="/app/onboarding">
        + Add an account
      </a>
    </div>
  );
}
