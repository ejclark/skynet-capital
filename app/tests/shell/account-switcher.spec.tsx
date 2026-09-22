import { render, screen } from "@testing-library/react";
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
});
