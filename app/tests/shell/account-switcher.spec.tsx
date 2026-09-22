import { fireEvent, render, screen } from "@testing-library/react";
import type { OwnedAccount } from "../../src/live/settings";
import { AccountSwitcher, ALL_ACCOUNTS } from "../../src/shell/account-switcher";

const accounts: readonly OwnedAccount[] = [
  { id: "eric", name: "Eric", kind: "human", hostConfigured: true, profile: null },
  { id: "sauron", name: "Sauron", kind: "bot", hostConfigured: true, profile: null },
];

describe("AccountSwitcher", () => {
  it("lists every account, human and bot alike, with no branch on kind beyond the label", () => {
    render(<AccountSwitcher accounts={accounts} selectedId="eric" onSelect={() => undefined} />);

    expect(screen.getByRole("option", { name: "Eric · Human" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Sauron · Bot" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "All accounts" })).not.toBeInTheDocument();
  });

  it("adds an All accounts option only when allowAll is set", () => {
    render(
      <AccountSwitcher
        accounts={accounts}
        selectedId={ALL_ACCOUNTS}
        onSelect={() => undefined}
        allowAll
      />,
    );

    expect(screen.getByRole("option", { name: "All accounts" })).toBeInTheDocument();
  });

  it("omits the default-account star when the page carries no onToggleDefault handler", () => {
    render(<AccountSwitcher accounts={accounts} selectedId="eric" onSelect={() => undefined} />);
    expect(screen.queryByRole("button", { name: /default/i })).not.toBeInTheDocument();
  });

  it("shows 'Set as default' for a non-default account and fires the toggle on click", () => {
    let calls = 0;
    render(
      <AccountSwitcher
        accounts={accounts}
        selectedId="eric"
        onSelect={() => undefined}
        isDefault={false}
        onToggleDefault={() => {
          calls += 1;
        }}
      />,
    );
    const button = screen.getByRole("button", { name: "Set as default" });
    expect(button).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(button);
    expect(calls).toBe(1);
  });

  it("shows the account is already the default", () => {
    render(
      <AccountSwitcher
        accounts={accounts}
        selectedId="eric"
        onSelect={() => undefined}
        isDefault
        onToggleDefault={() => undefined}
      />,
    );
    const button = screen.getByRole("button", { name: "Default" });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("never renders the star for the 'All accounts' aggregate — there is no single account to default to", () => {
    render(
      <AccountSwitcher
        accounts={accounts}
        selectedId={ALL_ACCOUNTS}
        onSelect={() => undefined}
        allowAll
        isDefault={false}
        onToggleDefault={() => undefined}
      />,
    );
    expect(screen.queryByRole("button", { name: /default/i })).not.toBeInTheDocument();
  });
});
