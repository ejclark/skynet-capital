import { expect, test } from "@playwright/experimental-ct-react";
import { TradeGate } from "../../app/src/shell/trade-gate";

// The pre-trade gate's LOCKED early-return only — the draft-state render pulls in QuoteHeader/
// RecentOrdersStrip, both useQuery-based, and crashes with no provider wrapping in the harness
// yet (the same "connected" gap shelf-parts hits with router Link, see #3333 follow-up: a shared
// QueryClientProvider/router test wrapper). The locked branch returns before those children ever
// mount, so it's safe to cover today.
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
