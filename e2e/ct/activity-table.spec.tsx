import { expect, test } from "@playwright/experimental-ct-react";
import { ActivityTable } from "../../app/src/shell/activity-table";

// Proof-of-concept for the CT harness (#3325 widened plan, slice 3): a pure props-in/JSX-out
// component, mounted with fixed mock data — no server, no offlineDataSource tick, no live
// anything. This is the pattern every live-data-touching surface's real pixel coverage moves to,
// per the finding on #3330 (/leaderboard's dollar figures drift even under a frozen browser clock
// because the server-side tick keeps advancing).
const EVENTS = [
  {
    orderId: "o1",
    symbol: "NVDA",
    display: "NVDA",
    side: "buy" as const,
    quantity: 300,
    filled: 300,
    price: "168.40",
    status: "filled",
    at: "2026-07-24T14:31:03Z",
    backfilled: false,
    origin: "desk" as const,
  },
  {
    orderId: "o2",
    symbol: "AAPL",
    display: "AAPL",
    side: "sell" as const,
    quantity: 40,
    filled: 40,
    price: "142.10",
    status: "filled",
    at: "2026-07-24T15:02:12Z",
    backfilled: false,
    origin: "desk" as const,
    realizedPl: "+120.00",
    returnPct: "+2.1%",
  },
];

test("renders a fixed activity ledger deterministically", async ({ mount }) => {
  const component = await mount(<ActivityTable events={EVENTS} />);
  await expect(component).toBeVisible();
  await expect(component).toHaveScreenshot("activity-table.png");
});
