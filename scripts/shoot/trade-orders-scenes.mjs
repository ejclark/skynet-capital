// The Orders-pane run of /app/trade frames (#1461, #3407 P3/P4) — the alerts strip, the alert
// delivery switch, the expiries-and-assignments card and the roll-as-one-ticket scene. Moved out of
// `trade.mjs` verbatim: the scenes still run in the same order and make the same pointer
// assignments, only now through `state`, whose setters write the `current*` pointers `trade.mjs`
// owns (the stub table reads them lazily).
import { resolve } from "node:path";
import { shooter } from "./lib.mjs";
import { desk } from "./trade-account-fixture.mjs";
import {
  deliveryOff,
  deliveryOn,
  deliveryUnconfigured,
  noAlerts,
  positionWatchAlerts,
} from "./trade-alerts-fixture.mjs";
import {
  draftSent,
  lifecycleAnswer,
  noLifecycle,
  rollDraft,
  rollLegs,
  rollScript,
} from "./trade-draft-fixture.mjs";

// `state` exposes exactly the pointers these scenes touch: setAlerts, setDelivery, setLifecycle,
// setDraftScript, setDraftFallback and setDesk.
export async function shootOrdersScenes({ page, origin, state }) {
  // The alerts strip (#3407 P4 slice 1): what the held positions are saying — a critical
  // assignment-risk row, a week-out expiry warning, a month-out FYI; the badge word and glyph carry
  // the priority, the left accent steps with it. PHONE FIRST.
  state.setAlerts(positionWatchAlerts);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=101&symbol=NVDA&section=orders`);
  await page.getByText(/assignment risk/).waitFor();
  await page.getByRole("heading", { name: "Alerts" }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -80));
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  const shootAlerts = shooter(page, resolve("docs/shots/desk-alerts"));
  await shootAlerts("desk-alerts-phone");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("heading", { name: "Alerts" }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await shootAlerts("desk-alerts-desktop");

  // Delivery (#3407 P4 slice 3): the same strip, with the member's own switch for "also reach me when
  // this page is closed". Two more phone frames — delivery ON (the destination the session carried,
  // never a field anyone typed) and the unconfigured deployment saying so in words.
  const frameDelivery = async (tag) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${origin}/app/trade?play=101&symbol=NVDA&section=orders`);
    await page.getByRole("heading", { name: "Send these to me" }).scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 40));
    await shootAlerts(tag);
  };
  state.setDelivery(deliveryOn);
  await frameDelivery("alert-delivery-on-phone");
  state.setDelivery(deliveryUnconfigured);
  await frameDelivery("alert-delivery-unconfigured-phone");
  state.setDelivery(deliveryOff);
  state.setAlerts(noAlerts);

  // Expiries and assignments (#3407 slice 4) — the last card in the Orders pane: the four ways a
  // contract ends with no order behind it, each saying what it did to the realized P/L and, where it
  // did nothing, why not. The sentences in the frame are the server's own (`lifecycleRows` builds the
  // fixture). PHONE FIRST.
  state.setLifecycle(lifecycleAnswer);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=101&symbol=NVDA&section=orders`);
  await page.getByRole("heading", { name: "Expiries and assignments" }).waitFor();
  await page.getByRole("heading", { name: "Expiries and assignments" }).scrollIntoViewIfNeeded();
  // Past the heading by a card's worth: the frame has to prove the CONTRAST between a counted row
  // and an uncounted one, which takes three rows, not the heading plus one.
  await page.evaluate(() => window.scrollBy(0, 230));
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  const shootLifecycle = shooter(page, resolve("docs/shots/option-lifecycle"));
  await shootLifecycle("option-lifecycle-phone");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("heading", { name: "Expiries and assignments" }).scrollIntoViewIfNeeded();
  await shootLifecycle("option-lifecycle-desktop");
  state.setLifecycle(noLifecycle);

  // Roll as one ticket (#3407 P3 slice 3) — the same held put, Roll… opened: target expiration
  // and strike from the chain, the two legs spelled out, then the reviewed Confirm naming the net
  // and the max loss. The chain stub answers every expiration with the same NVDA rows, so the
  // strike list is the fixture's; the scripted draft is what the review reads. PHONE FIRST.
  state.setDraftScript(rollScript);
  state.setDraftFallback(
    rollDraft("reviewed", rollLegs, {
      verdict: { ok: true, refusals: [], warnings: [] },
    }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=101&symbol=NVDA&section=orders`);
  await page.getByRole("heading", { name: "Option positions" }).waitFor();
  await page.getByRole("button", { name: "Roll…" }).click();
  await page.getByLabel("Roll to").waitFor();
  await page.getByRole("button", { name: "Review roll…" }).click();
  await page.getByRole("button", { name: /Confirm roll/ }).waitFor();
  await page.getByRole("heading", { name: "Option positions" }).scrollIntoViewIfNeeded();
  const shootRoll = shooter(page, resolve("docs/shots/roll"));
  await shootRoll("roll-phone");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("heading", { name: "Option positions" }).scrollIntoViewIfNeeded();
  await shootRoll("roll-desktop");
  state.setDraftScript([]);
  state.setDraftFallback(draftSent);
  state.setDesk(desk);
}
