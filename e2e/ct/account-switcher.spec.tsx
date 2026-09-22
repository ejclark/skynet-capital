import { expect, test } from "@playwright/experimental-ct-react";
import { AccountSwitcher } from "../../app/src/shell/account-switcher";

// Second CT proof-of-concept (#3325 widened plan, slice 3) — a pure props-in/JSX-out component
// with an interactive control (a <select>), fixed mock accounts, no server.
const ACCOUNTS = [
  {
    id: "sim-day",
    name: "The Day Trader",
    kind: "bot" as const,
    hostConfigured: true,
    profile: { displayName: "The Day Trader" },
  },
  {
    id: "sim-eric",
    name: "Eric",
    kind: "human" as const,
    hostConfigured: true,
    profile: { displayName: "Eric" },
  },
];

test("renders a fixed account list deterministically", async ({ mount }) => {
  const component = await mount(
    <AccountSwitcher
      accounts={ACCOUNTS}
      selectedId="sim-day"
      onSelect={() => {
        /* no-op: this spec only asserts the initial render */
      }}
      allowAll
    />,
  );
  await expect(component).toBeVisible();
  await expect(component).toHaveScreenshot("account-switcher.png");
});
