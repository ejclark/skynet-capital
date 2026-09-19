import { expect, test } from "@playwright/experimental-ct-react";
import { LockedPanel } from "../../app/src/shell/locked-panel";

// The locked-rung panel — a hidden state a full-page /trade shot won't reach by default (the
// fixture desk's ladder is unlocked), per design decision 4. Real CT value: this is the ONLY
// place the app renders a locked ticket.
test("renders the locked panel with the rung that opens it", async ({ mount }) => {
  const component = await mount(
    <LockedPanel
      play={{
        code: "102",
        id: "sell-102",
        name: "Sell to close",
        tldr: "Close a long stock position",
        kind: "stock",
        side: "sell",
        gloss: "Exit rung",
        locked: true,
        earned: false,
        opensAfter: { code: "101", name: "Buy to open" },
      }}
    />,
  );
  await expect(component).toBeVisible();
  await expect(component).toHaveScreenshot("locked-panel.png");
});

test("renders the locked panel with no prior rung to name", async ({ mount }) => {
  const component = await mount(
    <LockedPanel
      play={{
        code: "101",
        id: "buy-101",
        name: "Buy to open",
        tldr: "Open a long stock position",
        kind: "stock",
        side: "buy",
        gloss: "Entry rung",
        locked: true,
        earned: false,
      }}
    />,
  );
  await expect(component).toBeVisible();
  await expect(component).toHaveScreenshot("locked-panel-first-rung.png");
});
