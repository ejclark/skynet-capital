import { expect, test } from "@playwright/experimental-ct-react";
import { TradeGate } from "../../app/src/shell/trade-gate";
import { expectComponentShot } from "./harness";

// The pre-trade gate. Draft-state coverage was blocked pending a QueryClientProvider in the CT
// harness (`app/playwright/index.tsx`) — QuoteHeader/RecentOrdersStrip's useQuery calls throw with
// no provider regardless of `enabled`, even though neither actually fires a query with no symbol
// committed (both gate on `symbol !== ""`). Now that the harness wraps everything, both states
// are safe to cover.
test("renders the draft ticket with side selector", async ({ mount }) => {
  const component = await mount(<TradeGate deskId="day-trader" />);
  await expect(component.getByRole("heading", { name: "New trade" })).toBeVisible();
  await expectComponentShot(component, "trade-gate-draft.png");
});

test("renders without the side selector when the caller already carries it", async ({ mount }) => {
  const component = await mount(
    <TradeGate deskId="day-trader" showSide={false} initialAction="sell" />,
  );
  await expect(component.getByRole("heading", { name: "New trade" })).toBeVisible();
  await expectComponentShot(component, "trade-gate-no-side.png");
});

test("renders the locked panel instead of the ticket when the rung isn't earned", async ({
  mount,
}) => {
  const component = await mount(
    <TradeGate
      deskId="day-trader"
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
  await expect(component.getByRole("heading", { name: "Buy to open" })).toBeVisible();
  await expect(component).toHaveScreenshot("trade-gate-locked.png");
});
