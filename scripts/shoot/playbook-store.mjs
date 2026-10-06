// Visual harness for R&D → Playbooks (#3623; the Playbook Store, #885) from the REAL built shell over
// stub APIs. Phone frame first (docs/PICTURES.md → mobile-first), then desktop.
//
// The Store's JSON is built by calling the server's own `playbookStoreView` over the real catalog,
// never hand-written, so a frame cannot show a card, a gate or a sentence the server would not send
// (the `heartbeat-roll-call.mjs` rule). Only the subscriber counts are fixtures.
//
// Two frame groups:
//   · `store`  — the catalog, the metric blocks, the subscriber count and the delegation fog
//                (#1707: the same card before and after rung 102 is earned). Entered through the
//                retired desk URL `/app/u/<id>/playbooks`, so the shots also prove the redirect.
//   · `tune`   — #4642 slice 7 (#4649, #4610): a bot account (Sauron) with one subscription on and
//                aimed at two symbols and one paused, leading their cards; the Edit form; a human
//                account behind the bots-only door; the bot's roll call linking here.
//   · `options` — the two option plays' cards (#4642 slices 5–6).
//   · `sauron-rules` — the SAURON card, Sauron's own rules as a playbook (#4642 slice 9a, #4651).
//   · `subscribed-only` — the forced daily pick's card and SAURON's Pause row once only subscribed
//                playbooks open (#4642 slice 10, #4652).
// FRAMES=<group> runs one group; unset runs them all.
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npm run shoot:playbook-store [outdir]
import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.ts";
import { playbookRollCall } from "../../src/observatory/bot-heartbeat-view.ts";
import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.ts";
import { PLAYBOOK_WIRING_GAPS, registeredPlaybooks } from "../../src/playbooks/registry.ts";
// Each card's closed-trade numbers (#3665): S1-NVDA with a record, HC-SAURON without one.
import { performance } from "./playbook-store-fixture.mjs";
import { openShell } from "./shell.mjs";

const SAURON = { id: "sauron", name: "Sauron", kind: "bot", hostConfigured: true, profile: null };
const JOE = {
  id: "human-joe",
  name: "Uncle Joe",
  kind: "human",
  hostConfigured: false,
  profile: null,
};

// The shell's header reads the account roster on every `/app/*` surface — unstubbed it throws
// before the route ever renders.
const settings = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [SAURON, JOE],
};

const tiles = {
  openPositions: 0,
  invested: "$0.00",
  dayPl: "$0.00",
  dayTone: "flat",
  unrealized: "$0.00",
  unrealizedNote: "no positions",
  unrealizedTone: "flat",
  cash: "$1,000,000.00",
};
const deskFor = (account) => ({
  generatedAt: "2026-10-05T15:00:00Z",
  desk: { id: account.id, name: account.name, kind: account.kind, positions: [], tiles },
});

// The subscriber count (#3970): enabled subscriptions across every account, a bare number.
const COUNTS = { "S1-NVDA": 3, "HC-SAURON": 1 };
const withCounts = (view, counts = COUNTS) => ({
  ...view,
  cards: view.cards.map((card) => ({ ...card, subscribers: counts[card.id] ?? 0 })),
});

const AT = "2026-10-01T14:00:00.000Z";
const subscription = (playbookId, over) => ({
  accountId: "sauron",
  playbookId,
  mode: "standard",
  enabled: true,
  createdAt: AT,
  updatedAt: AT,
  ...over,
});
// HC-SAURON on, aimed at NVDA + CRWV; S1-NVDA paused. G1-GOOG and TACO-DJT not subscribed.
const SAURON_SUBSCRIPTIONS = [
  subscription("HC-SAURON", { capitalAllocated: 25_000, symbols: ["NVDA", "CRWV"] }),
  subscription("S1-NVDA", { mode: "conservative", capitalAllocated: 10_000, enabled: false }),
];

const views = {
  catalog: withCounts(playbookStoreView(undefined)),
  fresh: withCounts(playbookStoreView([])),
  fogged: withCounts(playbookStoreView([], true)),
  sauron: withCounts(playbookStoreView(SAURON_SUBSCRIPTIONS)),
  human: withCounts(playbookStoreView([], false, [], true)),
};

// The bot's own Heartbeat, with the roll call the live code would read for this roster —
// `playbookRollCall` over a pass that ran HC-SAURON, never hand-written sentences.
const NOW = new Date("2026-10-05T15:00:00Z");
const verdicts = [{ playbookId: "HC-SAURON", mode: "standard", state: "flat" }];
const heartbeat = {
  available: true,
  heartbeat: {
    state: "beating",
    marketOpen: true,
    lastPassAt: "2026-10-05T14:59:40Z",
    sinceLastPassMs: 20_000,
    cadenceMs: 15_000,
    staleAfterMs: 120_000,
    playbooks: verdicts.map((v) => ({ ...v, since: AT, sinceIsLowerBound: false })),
    rollCall: playbookRollCall(
      verdicts,
      NOW,
      registeredPlaybooks(),
      PLAYBOOK_WIRING_GAPS,
      UPCOMING_PRINTS,
    ),
  },
};

// One shell per state rather than a reload: the browser serves a fulfilled route from its own
// memory cache on reload, so a second state has to be a second page load with its own stubs.
// `scrollTo` lands the named text just under the sticky top bar and market strip (~150px), not at
// the very top edge, where they would cover it.
const underHeader = (el) =>
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 150);

// `shell` passes `viewport` and `quality` (a dense frame's lower JPEG quality, under the ~100KB cap)
// straight to openShell; either left undefined keeps its default.
async function frame({ tag, view, account = SAURON, expect, scrollTo, path, act, ...shell }) {
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
      [`/api/desk/${account.id}/decisions`]: { available: true, kind: account.kind, cycles: [] },
    },
  });
  const to = path ?? `/app/u/${account.id}/playbooks`;
  await page.goto(`${origin}${to}`);
  if (to.endsWith("/playbooks"))
    await page.waitForURL(/\/app\/research\?.*section=playbooks.*account=/);
  await page.getByText(expect).first().waitFor();
  if (act) await act(page);
  if (scrollTo) await page.getByText(scrollTo).first().evaluate(underHeader);
  await shoot(tag);
  await close();
}

const PHONE = { width: 390, height: 844 };
const STORE = "/app/research?section=playbooks";
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
      expect: "Capital to delegate",
      viewport: PHONE,
    },
    { tag: "delegation-locked", view: views.fogged, expect: "Delegating capital opens after" },
    { tag: "delegation-earned", view: views.fresh, expect: "Capital to delegate" },
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
      scrollTo: "S1-NVDA",
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
    { tag: "desktop-1-bot-subscribed", view: views.sauron, expect: "new entries: NVDA, CRWV" },
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
    expect: "CRWV-WHEEL",
    viewport: PHONE,
    scrollTo: "CRWV-WHEEL",
    path: STORE,
  },
  {
    tag: "phone-option-nvda-spread",
    view: views.catalog,
    expect: "NVDA-CALL-SPREAD",
    viewport: PHONE,
    scrollTo: "NVDA-CALL-SPREAD",
    path: STORE,
  },
  {
    tag: "desktop-option-plays",
    view: views.catalog,
    expect: "CRWV-WHEEL",
    scrollTo: "CRWV-WHEEL",
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
  sauronFrame("phone-3-sauron-subscribed-fixture", { view: views.sauronRules, path: undefined }),
  sauronFrame("phone-4-sauron-paused-fixture", { view: views.sauronPaused, path: undefined }),
  sauronFrame("desktop-sauron-card", { viewport: undefined, quality: 55 }),
];

// #4642 slice 10 (#4652): only a subscribed playbook opens a position. The forced daily pick's new
// card (catalog, then its two-switches rows), SAURON paused on Sauron's account (the Pause row now
// says his buys stop, and the note under the state names the rule), and the pick as his account
// would show it subscribed. The paused and subscribed frames are FIXTURES: this slice seeds nothing.
views.scoutSubscribed = withCounts(
  playbookStoreView([
    subscription("SAURON"),
    subscription("BETA-SCOUT", { mode: "conservative", capitalAllocated: 10_000 }),
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
  sauronFrame("phone-4-sauron-paused-fixture", { view: views.sauronPaused, path: undefined }),
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

const only = process.env.FRAMES;
for (const [group, frames] of Object.entries(groups)) {
  if (only && only !== group) continue;
  for (const spec of frames) await frame(spec);
}
