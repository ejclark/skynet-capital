// The working-orders and limit-close run of /app/trade frames (#3407 P1 slices 2-3, P2 slice 3,
// #4327) — the GTC limit and partial fill with their two-tap cancel and Modify drawers, then the
// option positions card with a limit close, its Position Statement line and the SPY-weighted book
// foot. Moved out of `trade.mjs` verbatim: the scenes still run in the same order and make the
// same pointer assignments, only now through `state`, whose setters write the `current*` pointers
// `trade.mjs` owns (the stub table reads them lazily).
import { resolve } from "node:path";
import { shooter } from "./lib.mjs";
import { deskWithOption, noOrders, workingOrders } from "./trade-account-fixture.mjs";
import { plays } from "./trade-plays-fixture.mjs";

// `state` exposes exactly the pointers these scenes touch: setPlays, setOrders and setDesk.
export async function shootWorkingOrdersScenes({ page, origin, state }) {
  // Working orders (#3407 P1 slice 2; the Orders section since Workbench slice 3) — one GTC limit
  // and one partial fill, two settled rows below them. PHONE FIRST: 390px proves
  // the row wraps its type line under the symbol instead of clipping; desktop proves it widened.
  state.setPlays(plays);
  state.setOrders(workingOrders);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=101&symbol=NVDA&section=orders`);
  await page.getByText("Working orders").waitFor();
  await page.getByText("Settled today").waitFor();
  await page.getByRole("heading", { name: "Working orders" }).scrollIntoViewIfNeeded();
  const shootWorkingOrders = shooter(page, resolve("docs/shots/working-orders"));
  await shootWorkingOrders("working-orders-phone");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("heading", { name: "Working orders" }).scrollIntoViewIfNeeded();
  await shootWorkingOrders("working-orders-desktop");
  // The two-tap cancel, armed: the row's Cancel became its own Confirm / Keep pair.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Cancel" }).first().click();
  await page.getByRole("button", { name: "Confirm cancel" }).waitFor();
  await page.getByRole("heading", { name: "Working orders" }).scrollIntoViewIfNeeded();
  await shootWorkingOrders("working-orders-cancel-armed-phone");
  // Modify (#3407 P1 1b): Keep the cancel, open the drawer on the GTC limit, raise the price —
  // the note says exactly what the broker will be told before Send change is pressed.
  await page.getByRole("button", { name: "Keep" }).click();
  await page.getByRole("button", { name: "Modify" }).first().click();
  await page.getByLabel("Limit price").fill("172");
  await page.getByText("Will send: limit $172.00").waitFor();
  await page.getByRole("heading", { name: "Working orders" }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  const shootModify = shooter(page, resolve("docs/shots/working-orders-modify"));
  await shootModify("working-orders-modify-phone");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("heading", { name: "Working orders" }).scrollIntoViewIfNeeded();
  await shootModify("working-orders-modify-desktop");
  // The option order's drawer asks for Contracts — the word the broker's quantity means.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Keep as is" }).click();
  await page.getByRole("button", { name: "Modify" }).nth(1).click();
  await page.getByLabel("Contracts").waitFor();
  await page.getByText("NVDA $180 CALL · Sep 25").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  await shootModify("working-orders-option-modify-phone");
  state.setOrders(noOrders);

  // Limit close (#3407 P1 slice 3) — the option positions card under the ticket with Limit
  // pressed and a premium typed, then the reviewed confirm line naming the limit. Phone first.
  state.setPlays(plays);
  state.setDesk(deskWithOption);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=101&symbol=NVDA&section=orders`);
  await page.getByRole("heading", { name: "Option positions" }).waitFor();
  await page.getByRole("button", { name: "Limit" }).click();
  await page.getByLabel("Limit price per share").fill("13.50");
  await page.getByRole("heading", { name: "Option positions" }).scrollIntoViewIfNeeded();
  const shootLimitClose = shooter(page, resolve("docs/shots/limit-close"));
  await shootLimitClose("limit-close-phone");
  // The same card with its Position Statement line and book foot (#3407 P2 slice 3).
  await page.getByText("18 DTE").waitFor();
  const shootOptionPositions = shooter(page, resolve("docs/shots/option-positions"));
  await shootOptionPositions("option-positions-phone");
  // The book foot weighted to SPY, with the beta's source and as-of beside it (#4327). PHONE FIRST.
  const shootBeta = shooter(page, resolve("docs/shots/beta-weighted-book"));
  await page.getByText(/Weighted to SPY/).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 160));
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  await shootBeta("beta-weighted-book-phone");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("heading", { name: "Option positions" }).scrollIntoViewIfNeeded();
  await shootLimitClose("limit-close-desktop");
  await page.getByText(/Weighted to SPY/).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 160));
  await shootBeta("beta-weighted-book-desktop");
}
