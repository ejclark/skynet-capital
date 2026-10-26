// The one-build, funnel and shadow-scout groups of the R&D → Playbooks shoot (`playbook-store.mjs`,
// #3623), moved out of it unchanged so that harness stays under the code-line cap. `one-build` (#5494
// step 1) is exported apart from `funnelGroups` (`funnel` #4450, `shadow-scout` #4535) because the
// authored groups sit between them in the harness's frame order.

import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.ts";
import { withForecasts } from "../../src/server/pair-forecast.ts";
import {
  COUNTS,
  openSubscribe,
  PHONE,
  SAURON_CARD,
  STORE,
  subscription,
  TODAY,
  twoBots,
  underHeader,
  views,
  withCounts,
} from "./playbook-store-world.mjs";

// #5494 step 1 — R&D → Playbooks in one build: the mission line, the list of the plays with a + on
// each ready one (#5435, #5442), a plain line per strategy (#5445), a ticker's evidence as a call
// (#5444) and the wide layout (#5448). The view carries each row's forecast exactly as the route
// adds it (`withForecasts` over the real research shelf), on today's clock. Two bots are the
// viewer's own, so the + panel lists both; the subscribe answer is a fixture (`{ ok: true }`).
views.oneBuild = {
  ...views.fresh,
  strategies: withForecasts(views.fresh.strategies, TODAY),
};
const ONE_BUILD_STUBS = {
  "/api/settings": twoBots,
  "/api/playbook-store/subscribe": { ok: true },
};
const plusOn = (name) => async (page) => {
  await page.getByRole("button", { name: `Subscribe your bots to ${name}` }).click();
  await page.getByRole("checkbox", { name: /Sauron/ }).waitFor();
  await page.locator(".pbs-bot:not([data-held])").first().waitFor();
};
const tickSauron = async (page) => {
  await plusOn("the pre-print run-up")(page);
  await page.locator(".pbs-bot", { hasText: "Sauron" }).click();
};
const subscribeBoth = async (page) => {
  await plusOn("the pre-print run-up")(page);
  await page.locator(".pbs-bot", { hasText: "Sauron" }).click();
  await page.locator(".pbs-bot", { hasText: "The Banker" }).click();
  await page.getByRole("button", { name: "Subscribe 2 bots" }).click();
  await page.getByText("Subscribed both bots.").waitFor();
  await page.locator(".pbs").evaluate(underHeader);
};
const toEvidence = (page) => page.locator(".pbe").first().evaluate(underHeader);
const oneBuild = (tag, over = {}) => ({
  tag,
  view: views.oneBuild,
  expect: "Create scenarios, develop strategies, track results.",
  path: STORE,
  clockAt: TODAY,
  extraStubs: ONE_BUILD_STUBS,
  ...over,
});
const oneBuildFrames = [
  oneBuild("phone-1-list-plus", { viewport: PHONE, act: tickSauron }),
  oneBuild("phone-2-evidence", { viewport: PHONE, act: toEvidence }),
  oneBuild("phone-3-subscribed", { viewport: PHONE, act: subscribeBoth }),
  oneBuild("phone-4-not-yet", {
    viewport: PHONE,
    act: async (page) => {
      await page.locator(".pbl-fold > summary").click();
      await page.locator(".pbl-fold").evaluate(underHeader);
    },
  }),
  // #5489 slice 2: the dip-to-bounce, dark on MU and NBIS — its row and its evidence.
  oneBuild("phone-5-dip-bounce", {
    viewport: PHONE,
    act: async (page) => {
      await page.getByRole("button", { name: /^The dip-to-bounce/ }).click();
      await page.locator(".pbe", { hasText: "MU" }).first().evaluate(underHeader);
    },
  }),
  oneBuild("desktop-1-wide", { quality: 60 }),
  oneBuild("desktop-2-wheel", {
    quality: 60,
    act: (page) => page.getByRole("button", { name: /^The wheel/ }).click(),
  }),
  oneBuild("wide-1-three-columns", {
    viewport: { width: 1800, height: 1000 },
    quality: 55,
  }),
];

export const oneBuildGroups = { "one-build": oneBuildFrames };

const groups = {};

// #4450 slices 5a–5b: each card's house block ends on its funnel over the last ten sessions —
// S1-NVDA with its declared signal counted between checks and orders, SAURON (no research signal)
// asking with a guard's refusals named, and a card no bot checks.
const funnelFrame = (tag, scrollTo, over = {}) => ({
  tag,
  view: views.catalog,
  expect: "Last 10 sessions, every bot",
  viewport: PHONE,
  scrollTo,
  path: STORE,
  ...over,
});
// SAURON's pair row sits folded under its strategy ("1 more"), so its frame opens that fold first.
const openSauronFold = (page) =>
  page
    .locator(".pb-card")
    .filter({ hasText: SAURON_CARD })
    .first()
    .locator("details > summary")
    .first()
    .click();
groups.funnel = [
  funnelFrame("phone-1-funnel-s1", "signal on 3 of 10 sessions"),
  funnelFrame("phone-2-funnel-sauron", "most refused", { act: openSauronFold }),
  funnelFrame("phone-3-funnel-unchecked", "no bot checked this playbook"),
];

// #4535 slice 3a: the shadow scout is subscribable in the Store, and places no orders. Its card from
// the real catalog, its form open (names to scan, no budget), and a subscribed row (a fixture:
// nothing is seeded) that says "places no orders" where other rows say a mode and a dollar figure.
views.scoutOn = withCounts(
  playbookStoreView([subscription("COND-SCOUT", { symbols: ["NVDA", "CRWV", "AAPL"] })]),
  { ...COUNTS, "COND-SCOUT": 1 },
);
const SCOUT_STRATEGY = "The shadow scout";
const toScoutStrategy = (page) =>
  page.locator(".pb-strategy").filter({ hasText: SCOUT_STRATEGY }).first().evaluate(underHeader);
const scoutFrame = (tag, over = {}) => ({
  tag,
  view: views.fresh,
  expect: SCOUT_STRATEGY,
  viewport: PHONE,
  act: toScoutStrategy,
  ...over,
});
groups["shadow-scout"] = [
  scoutFrame("phone-1-scout-card"),
  scoutFrame("phone-2-scout-form", {
    act: async (page) => {
      // A pair the study has not covered sits in the card's fold, so open that first.
      const card = page.locator(".pb-strategy").filter({ hasText: SCOUT_STRATEGY }).first();
      await card.locator("details > summary").first().click();
      await openSubscribe(card);
      await toScoutStrategy(page);
    },
  }),
  scoutFrame("phone-3-scout-subscribed-fixture", { view: views.scoutOn }),
];
export const funnelGroups = groups;
