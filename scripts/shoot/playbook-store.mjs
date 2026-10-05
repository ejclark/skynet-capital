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
// FRAMES=<group> runs one group; unset runs both.
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npm run shoot:playbook-store [outdir]
import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.ts";
import { playbookRollCall } from "../../src/observatory/bot-heartbeat-view.ts";
import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.ts";
import { PLAYBOOK_WIRING_GAPS, registeredPlaybooks } from "../../src/playbooks/registry.ts";
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
const withCounts = (view) => ({
  ...view,
  cards: view.cards.map((card) => ({ ...card, subscribers: COUNTS[card.id] ?? 0 })),
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

// The selected account's own closed trades per playbook (#3665 slice 3): S1-NVDA has a record,
// HC-SAURON has none — so one frame shows both the numbers and the honest empty state. The
// house-wide block (slice 4) has both: every account's trips, larger than the account's own and
// drawn beside it, never summed into it. The cycle mix (slice 5) counts option trips only, so
// S1-NVDA's 7 house contracts split across cycles while HC-SAURON, which trades only shares, says
// so in words instead of printing three zeros.
const HOUR = 3_600_000;
const row = (playbookId, over) => ({
  playbookId,
  avgHoldMs: 10 * 24 * HOUR,
  longestHold: { holdMs: 15 * 24 * HOUR },
  shortestHold: { holdMs: 26 * HOUR },
  byDirection: { long: over.trades, short: 0 },
  byInstrument: { stock: over.trades, call: 0, put: 0 },
  byCycle: { weekly: 0, monthly: 0, quarterly: 0 },
  ...over,
});
const performance = {
  house: [
    row("S1-NVDA", {
      trades: 19,
      wins: 13,
      losses: 6,
      winRate: 68.4,
      netRealized: 3_915.2,
      returnPct: 4.7,
      capitalCommitted: 83_300,
      byInstrument: { stock: 12, call: 7, put: 0 },
      byCycle: { weekly: 2, monthly: 4, quarterly: 1 },
    }),
    row("HC-SAURON", {
      trades: 212,
      wins: 109,
      losses: 97,
      winRate: 52.9,
      netRealized: -1_284.75,
      returnPct: -0.6,
      capitalCommitted: 214_050,
      avgHoldMs: 7 * HOUR,
      longestHold: { holdMs: 4 * 24 * HOUR + 2 * HOUR },
      shortestHold: { holdMs: 18 * 60_000 },
      byDirection: { long: 188, short: 24 },
    }),
  ],
  mine: [
    row("S1-NVDA", {
      trades: 4,
      wins: 3,
      losses: 1,
      winRate: 75,
      netRealized: 842.5,
      returnPct: 6.2,
      capitalCommitted: 13_580,
      byInstrument: { stock: 3, call: 1, put: 0 },
      byCycle: { weekly: 0, monthly: 1, quarterly: 0 },
    }),
  ],
  accounts: ["sauron"],
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

async function frame({ tag, view, account = SAURON, expect, viewport, scrollTo, path, act }) {
  const { page, origin, shoot, close } = await openShell({
    name: "playbook-store",
    ...(viewport ? { viewport } : {}),
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

const only = process.env.FRAMES;
for (const [group, frames] of Object.entries(groups)) {
  if (only && only !== group) continue;
  for (const spec of frames) await frame(spec);
}
