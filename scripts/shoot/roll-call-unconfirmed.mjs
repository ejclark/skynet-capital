// Visual harness for #4479 slice 2: a playbook whose window is due but whose print date is still an
// estimate reads "? Waiting on a confirmed date", not "◷ Waiting for its window". Sauron's book on
// Fri Oct 23 2026 against the REAL calendar (`UPCOMING_PRINTS`): NVDA's Nov 18 is an estimate and
// S1-NVDA's D-20 (trading sessions) is already behind it, so S1 is held; GOOG's Oct 28 is confirmed,
// so G1-GOOG holds (and CRWV-WHEEL its put). The roll call is the real `playbookRollCall` — no
// sentence is hand-written, so the frame cannot claim a reason the code does not produce. The week
// strip is this week, Mon Oct 19 to NOW, each lane drawn from what its own rule answers each half
// hour on the same calendar, so the lane agrees with the card above it (and the opened card's key
// keys S1's cells "No window open", never "Waiting for its window").
// Frames: the section at 390, then S1-NVDA opened to its lane key.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/roll-call-unconfirmed.mjs [outdir]
import { resolve } from "node:path";
import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.ts";
import { playbookRollCall } from "../../src/observatory/bot-heartbeat-view.ts";
import { playbookStoreView } from "../../src/observatory/playbook-store-json-view.ts";
import { PLAYBOOK_WIRING_GAPS, registeredPlaybooks } from "../../src/playbooks/registry.ts";
import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const stubs = await accountsFixture();
const NOW = new Date("2026-10-23T15:00:00Z"); // Fri 11:00 AM New York
const fixture = stubs["/api/desk/bot-sauron/heartbeat"];
const { week: _week, ...base } = (typeof fixture === "function" ? fixture() : fixture).heartbeat;
// What each rule says that morning, so a verdict and its roll-call line never disagree.
const STATE = { "S1-NVDA": "no-window", "G1-GOOG": "long", "CRWV-WHEEL": "long" };
const playbooks = base.playbooks.map((v) => ({
  ...v,
  state: STATE[v.playbookId] ?? v.state,
  since: "2026-10-22T13:30:00Z",
}));
// This week on one clock: half-hour buckets from each session's open, null once not yet begun.
const DAYS = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23"];
const BUCKET = 30 * 60_000;
const sessions = DAYS.map((date) => ({
  date,
  openAt: Date.parse(`${date}T13:30:00Z`),
  closeAt: Date.parse(`${date}T20:00:00Z`),
}));
const bucketAt = (d, b) => sessions[d].openAt + b * BUCKET;
const begun = (d, b) => bucketAt(d, b) <= NOW.getTime();
const grid = (pick) =>
  DAYS.map((_, d) => Array.from({ length: 13 }, (_, b) => (begun(d, b) ? pick(d, b) : null)));
const rules = new Map(registeredPlaybooks().map((p) => [p.id, p]));
// A lane is the rule's own answer each half hour, asked of the real calendar; SAURON trades live.
const answer = (id) => (d, b) =>
  id === "SAURON"
    ? "tactical"
    : (rules.get(id)?.desiredState(new Date(bucketAt(d, b)).toISOString(), UPCOMING_PRINTS, []) ??
      "no-window");
const slot = (id) => playbooks.findIndex((v) => v.playbookId === id);
const lanes = playbooks.map((v) => ({
  playbookId: v.playbookId,
  mode: v.mode,
  slot: slot(v.playbookId),
  states: grid(answer(v.playbookId)),
}));
const week = {
  bucketMs: BUCKET,
  now: NOW.getTime(),
  sessions,
  checks: grid(() => 120),
  gaps: [],
  lanes,
  trades: [],
};
// Opening a card reads the Store view for its rule (#5096), as playbook-lanes.mjs serves it.
const SUBSCRIBED_AT = "2026-10-01T14:00:00.000Z";
const store = playbookStoreView(
  lanes.map((l) => ({
    accountId: "bot-sauron",
    playbookId: l.playbookId,
    mode: l.mode,
    enabled: true,
    createdAt: SUBSCRIBED_AT,
    updatedAt: SUBSCRIBED_AT,
  })),
  false,
  [],
  false,
  NOW.toISOString(),
);

const heartbeat = {
  available: true,
  heartbeat: {
    ...base,
    state: "beating",
    marketOpen: true,
    lastPassAt: new Date(NOW.getTime() - 20_000).toISOString(),
    sinceLastPassMs: 20_000,
    playbooks,
    week,
    rollCall: playbookRollCall(
      playbooks.map(({ playbookId, mode, state }) => ({ playbookId, mode, state })),
      NOW,
      registeredPlaybooks(),
      PLAYBOOK_WIRING_GAPS,
      UPCOMING_PRINTS,
    ),
  },
};

const { page, origin, shoot, close } = await openShell({
  name: "roll-call-unconfirmed",
  viewport: { width: 390, height: 1100 },
  quality: 58,
  ...(process.argv[2] ? { out: resolve(process.argv[2]) } : {}),
  stubs: { ...stubs, "/api/desk/bot-sauron/heartbeat": heartbeat, "/api/playbook-store": store },
});
await page.clock.setFixedTime(NOW);
await page.emulateMedia({ reducedMotion: "reduce" });
// Times on the page are the reader's own clock; read as New York's, as the lanes shoot does.
const cdp = await page.context().newCDPSession(page);
await cdp.send("Emulation.setTimezoneOverride", { timezoneId: "America/New_York" });

const section = `${origin}/app/accounts?account=bot-sauron&section=playbooks`;
const toCards = () =>
  page.evaluate(() => {
    const el = document.querySelector(".pbb-strip");
    const sticky = document.querySelector(".cockpit-head")?.getBoundingClientRect().bottom ?? 0;
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - sticky - 8);
  });
await page.goto(section);
await page.getByText("Waiting on a confirmed date").first().waitFor();
await toCards();
await shoot("roll-call-unconfirmed-phone");

// One tap deeper: S1-NVDA's lane key must agree with its card.
await page.getByText("S1-NVDA", { exact: true }).click();
await page.locator(".pbb-card details[open] .wk-key").waitFor();
await page.evaluate(() => {
  const el = document.querySelector(".pbb-card details[open]");
  const sticky = document.querySelector(".cockpit-head")?.getBoundingClientRect().bottom ?? 0;
  if (el) window.scrollBy(0, el.getBoundingClientRect().top - sticky - 8);
});
await shoot("roll-call-unconfirmed-open-phone");

await close();
