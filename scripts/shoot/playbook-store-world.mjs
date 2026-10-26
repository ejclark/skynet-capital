// The shared world of the R&D → Playbooks shoot (`playbook-store.mjs`, #3623): the two accounts, the
// settings and desk stubs the shell reads on every `/app/*` surface, the server's own Store views
// over the real catalog, the bot's Heartbeat roll call and the constants every frame group shares.
// Moved out of `playbook-store.mjs` unchanged so that harness and its authored-playbook groups
// (`playbook-store-authored.mjs`) read one set of fixtures and each stay under the code-line cap.

import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.ts";
import { playbookRollCall } from "../../src/observatory/bot-heartbeat-view.ts";
import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.ts";
import { PLAYBOOK_WIRING_GAPS, registeredPlaybooks } from "../../src/playbooks/registry.ts";

export const SAURON = {
  id: "sauron",
  name: "Sauron",
  kind: "bot",
  hostConfigured: true,
  profile: null,
};
export const JOE = {
  id: "human-joe",
  name: "Uncle Joe",
  kind: "human",
  hostConfigured: false,
  profile: null,
};

// The shell's header reads the account roster on every `/app/*` surface — unstubbed it throws
// before the route ever renders.
export const settings = {
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
export const deskFor = (account) => ({
  generatedAt: "2026-10-05T15:00:00Z",
  desk: {
    id: account.id,
    name: account.name,
    kind: account.kind,
    positions: [],
    tiles,
  },
});

// The subscriber count (#3970): enabled subscriptions across every account, a bare number.
export const COUNTS = { "S1-NVDA": 3, SAURON: 1 };
export const withCounts = (view, counts = COUNTS) => ({
  ...view,
  cards: view.cards.map((card) => ({
    ...card,
    subscribers: counts[card.id] ?? 0,
  })),
});

const AT = "2026-10-01T14:00:00.000Z";
export const subscription = (playbookId, over) => ({
  accountId: "sauron",
  playbookId,
  mode: "standard",
  enabled: true,
  createdAt: AT,
  updatedAt: AT,
  ...over,
});
// SAURON on, aimed at NVDA + CRWV; S1-NVDA paused. G1-GOOG and TACO-DJT not subscribed.
const SAURON_SUBSCRIPTIONS = [
  subscription("SAURON", {
    capitalAllocated: 25_000,
    symbols: ["NVDA", "CRWV"],
  }),
  subscription("S1-NVDA", {
    mode: "conservative",
    capitalAllocated: 10_000,
    enabled: false,
  }),
];

export const views = {
  catalog: withCounts(playbookStoreView(undefined)),
  fresh: withCounts(playbookStoreView([])),
  fogged: withCounts(playbookStoreView([], true)),
  sauron: withCounts(playbookStoreView(SAURON_SUBSCRIPTIONS)),
  human: withCounts(playbookStoreView([], false, [], true)),
};

// The bot's own Heartbeat, with the roll call the live code would read for this roster —
// `playbookRollCall` over a pass that ran SAURON, never hand-written sentences.
const NOW = new Date("2026-10-05T15:00:00Z");
const verdicts = [{ playbookId: "SAURON", mode: "standard", state: "tactical" }];
export const heartbeat = {
  available: true,
  heartbeat: {
    state: "beating",
    marketOpen: true,
    lastPassAt: "2026-10-05T14:59:40Z",
    sinceLastPassMs: 20_000,
    cadenceMs: 15_000,
    staleAfterMs: 120_000,
    playbooks: verdicts.map((v) => ({
      ...v,
      since: AT,
      sinceIsLowerBound: false,
    })),
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
export const underHeader = (el) =>
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 150);

export const PHONE = { width: 390, height: 844 };
export const STORE = "/app/research?section=playbooks";

export const TODAY = "2026-10-16T15:00:00Z";
export const BANKER = {
  id: "banker",
  name: "The Banker",
  kind: "bot",
  hostConfigured: true,
  profile: null,
};
export const twoBots = { ...settings, accounts: [SAURON, BANKER, JOE] };
