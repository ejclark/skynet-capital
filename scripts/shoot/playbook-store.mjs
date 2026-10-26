// Visual harness for R&D → Playbooks (#3623; the Playbook Store, #885) from the REAL built shell over
// stub APIs. Phone frame first (docs/PICTURES.md → mobile-first), then desktop.
//
// The Store's JSON is built by calling the server's own `playbookStoreView` over the real catalog,
// never hand-written, so a frame cannot show a card, a gate or a sentence the server would not send
// (the `heartbeat-roll-call.mjs` rule). Only the subscriber counts are fixtures.
//
// Two frame groups:
//   · `store`  — the catalog, the metric blocks, the subscriber count and the delegation fog
//                (#1707: the same card before and after rung 102 is earned). Entered through
//                R&D's own address; `/app/u/<id>/playbooks` is the bot's Playbooks section now
//                (#5073), no longer a redirect to the Store.
//   · `tune`   — #4642 slice 7 (#4649, #4610): a bot account (Sauron) with one subscription on and
//                aimed at two symbols and one paused, leading their cards; the Edit form; a human
//                account behind the bots-only door; the bot's roll call linking here.
//   · `options` — the two option plays' cards (#4642 slices 5–6).
//   · `sauron-rules` — the SAURON card, Sauron's own rules as a playbook (#4642 slice 9a, #4651).
//   · `subscribed-only` — the forced daily pick's card and SAURON's Pause row once only subscribed
//                playbooks open (#4642 slice 10, #4652).
//   · `strategies` — the Store by strategy (#4469 slice 3b): one card per strategy, the owner's own
//                pairs first, tickers by evidence, ✗ ? ⊘ folded into one counted line.
//   · `picker` — the ticker picker bottom sheet (#4469 slice 3b part 2): every ticker with a
//                disabled row's reason in words, and "Check first" stating one contract's cash.
//   · `conviction` — the owner's conviction and a strategy's allocation (#4469 slice 3c part 3b): the
//                CRWV wheel states its reason and check day with "Set a new date", and the card says
//                what is budgeted inside the allocation.
//   · `window` — a pre-earnings play as one line (#5432): NVDA's buy, hold and sell counted back from
//                the earnings report, with a bar per stretch, on the study world's clock (Thu 10-08).
//   · `one-build` — #5494 step 1: the mission line, the list with a + per ready play and its bots
//                panel, a ticker's evidence as a call, the folded "not yet" line, the wide layout.
//   · `shadow` — #5457 slice 2: a draft in its shadow test — the offer on a draft, a play mid-window
//                with its would-be buy, a finished round trip, an event play with no news feed — the
//                report written by the real runner over fixture prices.
//   · `promote` — #5457 slice 3: a play that has not met the bar (the checks, in words), one that has
//                (the one button), and a promoted play trading, marked SIM and unvalidated.
//   · `author` — #5457 slice 1: "Your playbooks" and the authoring form on the same screen — a draft
//                saved, the form open on a phone and wide, a setting past its limit refused in words.
//   · `shadow-scout` — #4535 slice 3a: the shadow scout's card, the subscribe form with no budget,
//                mode or compounding, and its subscribed row ("places no orders"), a FIXTURE.
//   · `scorecard` — #5482 slice 5: "steered by: AI-dip view · check … · pass / fail / pending" on the
//                CRWV pair rows, opened to its claims. The first frame is the record as it stands (the
//                server's own view: nothing is due yet); the second is a FIXTURE with some claims
//                decided, to show how a pass and a fail wear a glyph and a word.
// FRAMES=<group> runs one group; unset runs them all.
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npm run shoot:playbook-store [outdir]

import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.ts";
import { withForecasts } from "../../src/server/pair-forecast.ts";
import { authoredGroups } from "./playbook-store-authored.mjs";
// Each card's closed-trade numbers (#3665): S1-NVDA with a record, SAURON without one.
import { performance } from "./playbook-store-fixture.mjs";
import { strategyGroups } from "./playbook-store-strategies.mjs";
import {
  COUNTS,
  deskFor,
  heartbeat,
  JOE,
  PHONE,
  SAURON,
  STORE,
  settings,
  subscription,
  TODAY,
  twoBots,
  underHeader,
  views,
  withCounts,
} from "./playbook-store-world.mjs";
import { openShell } from "./shell.mjs";

// `shell` passes `viewport` and `quality` (a dense frame's lower JPEG quality, under the ~100KB cap)
// straight to openShell; either left undefined keeps its default.
async function frame({
  tag,
  view,
  account = SAURON,
  expect,
  scrollTo,
  path,
  act,
  clockAt,
  extraStubs = {},
  ...shell
}) {
  const { page, origin, shoot, close } = await openShell({
    name: "playbook-store",
    ...shell,
    stubs: {
      "/api/playbook-store": view,
      "/api/settings": settings,
      "/api/outpost/performance": performance,
      [`/api/desk/${account.id}`]: deskFor(account),
      [`/api/desk/${account.id}/heartbeat`]: heartbeat,
      [`/api/desk/${account.id}/probes`]: { available: false },
      [`/api/desk/${account.id}/decisions`]: {
        available: true,
        kind: account.kind,
        cycles: [],
      },
      ...extraStubs,
    },
  });
  const to = path ?? `/app/research?section=playbooks&account=${encodeURIComponent(account.id)}`;
  // A dated picture (the window's dates are counted from today) is shot on a fixed day.
  if (clockAt) await page.clock.setFixedTime(new Date(clockAt));
  await page.goto(`${origin}${to}`);
  await page.getByText(expect).first().waitFor();
  if (act) await act(page);
  if (scrollTo) await page.getByText(scrollTo).first().evaluate(underHeader);
  await shoot(tag);
  await close();
}

// The subscribe form sits behind its row's "Subscribe" disclosure (#4469 slice 3b).
const openSubscribe = (page) => page.locator(".pb-subscribe-disclosure > summary").first().click();
const groups = {
  store: [
    {
      tag: "phone-account-metrics",
      view: views.fresh,
      expect: "No closed trades on this playbook yet",
      viewport: PHONE,
      scrollTo: "Closed trades",
    },
    // Catalog-only (no account picked): the house block alone, on every card (#3665 slice 4).
    {
      tag: "phone-catalog-house",
      view: views.catalog,
      expect: "House — every account",
      viewport: PHONE,
      scrollTo: "212",
      path: STORE,
    },
    // The subscriber count (#3970), catalog-only: shown with no account picked, never who.
    {
      tag: "phone-subscriber-count",
      view: views.catalog,
      expect: "3 active subscribers",
      viewport: PHONE,
      path: STORE,
    },
    {
      tag: "phone-subscriber-none",
      view: views.catalog,
      expect: "No active subscribers yet",
      viewport: PHONE,
      scrollTo: "No active subscribers yet",
      path: STORE,
    },
    {
      tag: "phone-delegation-earned",
      view: views.fresh,
      expect: "Subscribe",
      viewport: PHONE,
      act: openSubscribe,
    },
    {
      tag: "delegation-locked",
      view: views.fogged,
      expect: "Delegating capital opens after",
    },
    {
      tag: "delegation-earned",
      view: views.fresh,
      expect: "Subscribe",
      act: openSubscribe,
    },
  ],
  tune: [
    // The owner's question first: what does this bot run? Subscribed cards lead, state first.
    {
      tag: "phone-1-bot-subscribed",
      view: views.sauron,
      expect: "new entries: NVDA, CRWV",
      viewport: PHONE,
      scrollTo: "capital under management",
    },
    {
      tag: "phone-2-bot-edit",
      view: views.sauron,
      expect: "new entries: NVDA, CRWV",
      viewport: PHONE,
      act: (page) => page.getByRole("button", { name: "Edit" }).first().click(),
      scrollTo: "new entries: NVDA, CRWV",
    },
    {
      tag: "phone-3-bot-paused",
      view: views.sauron,
      expect: "Paused",
      viewport: PHONE,
      scrollTo: "The pre-print run-up",
    },
    {
      tag: "phone-4-human-door",
      view: views.human,
      account: JOE,
      expect: "open to human accounts in a later season",
      viewport: PHONE,
    },
    {
      tag: "phone-5-human-door-card",
      view: views.human,
      account: JOE,
      expect: "open to human accounts in a later season",
      viewport: PHONE,
      act: (page) =>
        page
          .locator(".pb-locked")
          .first()
          .evaluate((el) => el.scrollIntoView({ block: "end" })),
    },
    {
      tag: "phone-6-roll-call-link",
      view: views.sauron,
      expect: "Change this bot's playbooks",
      viewport: PHONE,
      path: "/app/u/sauron/decisions",
      scrollTo: "Which playbooks this bot runs",
    },
    {
      tag: "desktop-1-bot-subscribed",
      view: views.sauron,
      expect: "new entries: NVDA, CRWV",
    },
    {
      tag: "desktop-2-human-door",
      view: views.human,
      account: JOE,
      expect: "open to human accounts in a later season",
    },
  ],
};

// #4642 slices 5–6: the two option plays' cards, as the catalog shows them.
groups.options = [
  {
    tag: "phone-option-crwv-wheel",
    view: views.catalog,
    expect: "The wheel",
    viewport: PHONE,
    scrollTo: "The wheel",
    path: STORE,
  },
  {
    tag: "phone-option-nvda-spread",
    view: views.catalog,
    expect: "The call spread",
    viewport: PHONE,
    scrollTo: "The call spread",
    path: STORE,
  },
  {
    tag: "desktop-option-plays",
    view: views.catalog,
    expect: "The wheel",
    scrollTo: "The wheel",
    path: STORE,
  },
];

// #4642 slice 9a (#4651): SAURON, Sauron's own rules as a playbook — the new card in the catalog,
// its rules and what pausing does, then the card as his account would show it once subscribed. That
// last frame is a FIXTURE (uncapped, as 9b would seed it beside the wheel): this slice seeds nothing.
// The fixture's own subscriptions count on their cards, so an "On" card never reads "no subscribers".
views.sauronRules = withCounts(
  playbookStoreView([
    subscription("SAURON"),
    subscription("CRWV-WHEEL", { capitalAllocated: 25_000 }),
  ]),
  { ...COUNTS, SAURON: 1, "CRWV-WHEEL": 1 },
);
// Paused (a fixture too): the note under the state says what Pause does — no new entries, exits kept.
views.sauronPaused = withCounts(playbookStoreView([subscription("SAURON", { enabled: false })]));
const SAURON_CARD = "Sauron's own trading rules";
const toSauronCard = (page) =>
  page.locator(".pb-card").filter({ hasText: SAURON_CARD }).first().evaluate(underHeader);
const sauronFrame = (tag, over = {}) => ({
  tag,
  view: views.catalog,
  expect: SAURON_CARD,
  viewport: PHONE,
  path: STORE,
  act: toSauronCard,
  ...over,
});
groups["sauron-rules"] = [
  sauronFrame("phone-1-sauron-card"),
  sauronFrame("phone-2-sauron-rules", {
    act: undefined,
    scrollTo: "It runs his standard rules on that bot's own account",
  }),
  sauronFrame("phone-3-sauron-subscribed-fixture", {
    view: views.sauronRules,
    path: undefined,
  }),
  sauronFrame("phone-4-sauron-paused-fixture", {
    view: views.sauronPaused,
    path: undefined,
  }),
  sauronFrame("desktop-sauron-card", { viewport: undefined, quality: 55 }),
];

// #4642 slice 10 (#4652): only a subscribed playbook opens a position. The forced daily pick's new
// card (catalog, then its two-switches rows), SAURON paused on Sauron's account (the Pause row now
// says his buys stop, and the note under the state names the rule), and the pick as his account
// would show it subscribed. The paused and subscribed frames are FIXTURES: this slice seeds nothing.
views.scoutSubscribed = withCounts(
  playbookStoreView([
    subscription("SAURON"),
    subscription("BETA-SCOUT", {
      mode: "conservative",
      capitalAllocated: 10_000,
    }),
  ]),
  { ...COUNTS, SAURON: 1, "BETA-SCOUT": 1 },
);
const SCOUT_CARD = "The forced daily pick";
const toScoutCard = (page) =>
  page.locator(".pb-card").filter({ hasText: SCOUT_CARD }).first().evaluate(underHeader);
groups["subscribed-only"] = [
  sauronFrame("phone-1-scout-card", { expect: SCOUT_CARD, act: toScoutCard }),
  sauronFrame("phone-2-scout-switches", {
    expect: SCOUT_CARD,
    act: undefined,
    scrollTo: "Exit — take profit",
  }),
  sauronFrame("phone-3-scout-subscribed-fixture", {
    view: views.scoutSubscribed,
    expect: SCOUT_CARD,
    path: undefined,
    act: toScoutCard,
  }),
  sauronFrame("phone-4-sauron-paused-fixture", {
    view: views.sauronPaused,
    path: undefined,
  }),
  sauronFrame("phone-5-sauron-pause-row", {
    act: undefined,
    scrollTo: "Research settings",
  }),
  sauronFrame("desktop-scout-card", {
    expect: SCOUT_CARD,
    act: toScoutCard,
    viewport: undefined,
    quality: 48,
  }),
];

// Order matters: `strategies` … `window` sit between `subscribed-only` and `one-build`, as before.
Object.assign(groups, strategyGroups);

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
groups["one-build"] = [
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

Object.assign(groups, authoredGroups);

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

const only = process.env.FRAMES;
for (const [group, frames] of Object.entries(groups)) {
  if (only && only !== group) continue;
  for (const spec of frames) await frame(spec);
}
