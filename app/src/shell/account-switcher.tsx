import type { ReactElement } from "react";
import { useId } from "react";
import type { OwnedAccount } from "../live/settings";

/** Progressive disclosure (Eric, 2026-09-04): rendering every owned account's full card at once
 *  doesn't scale and buries the one you came to edit. A dropdown picks one; only that account's
 *  card renders below it.
 *  @category desk
 */
export function AccountSwitcher({
  accounts,
  selectedId,
  onSelect,
}: {
  readonly accounts: readonly OwnedAccount[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
}): ReactElement {
  const selectId = useId();
  return (
    <div className="set-switch">
      <div className="field set-switch-field">
        <label htmlFor={selectId}>Account</label>
        <select id={selectId} value={selectedId} onChange={(e) => onSelect(e.target.value)}>
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
