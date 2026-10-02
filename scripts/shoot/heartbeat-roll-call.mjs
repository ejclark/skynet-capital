// Visual harness for the playbook roll call (#4450 slice 1) — the Heartbeat section with every
// house playbook listed On / Off / Can't fire, over the real built shell + stubbed APIs.
//
// `roll-call-*` mirrors production as found on 2026-10-02: no house playbook armed, so S1 and G1
// read Off; TACO-DJT and HC-SAURON read Can't fire whatever is armed (`PLAYBOOK_WIRING_GAPS`).
//
// `roll-call-armed-*` is the frame an ARMED roster produces — what lands the moment slice 2 flips
// the house roster on. It is built by calling the real `playbookRollCall`, never by hand-writing
// its sentences, so the frame cannot claim a reason the code does not produce. Its calendar is the
// real one plus ONE confirmed NVDA date, which is the only way to picture both halves of the read
// at once: S1 with a dated window ahead of it, and G1 held by an estimate (the state the real
// calendar is in for both names today).
//
// JPEG ≤100KB (docs/PICTURES.md). Shots live under docs/shots/pr-4450 (the plan issue's number).
// Usage: npm run build --prefix app && npx tsx scripts/shoot/heartbeat-roll-call.mjs
import { resolve } from "node:path";
import { UPCOMING_PRINTS } from "../../src/domain/earnings-calendar.ts";
import { playbookRollCall } from "../../src/observatory/bot-heartbeat-view.ts";
import { PLAYBOOK_WIRING_GAPS, registeredPlaybooks } from "../../src/playbooks/registry.ts";
import { openShell } from "./shell.mjs";

const settings = {
  authConfigured: false,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "bot-sauron", name: "Sauron", kind: "bot", hostConfigured: true, profile: null },
  ],
};

const desk = {
  generatedAt: "2026-10-02T15:00:00Z",
  desk: { id: "bot-sauron", name: "Sauron", kind: "bot", considerations: [], positions: [] },
};

const why = {
  off: "Not switched on for this bot — no recorded pass ran it.",
  armed: "Checked on every pass; it trades when its own condition holds.",
};

const heartbeat = {
  available: true,
  heartbeat: {
    state: "beating",
    marketOpen: true,
    lastPassAt: "2026-10-02T14:59:40Z",
    sinceLastPassMs: 20_000,
    cadenceMs: 15_000,
    staleAfterMs: 120_000,
    playbooks: [
      {
        playbookId: "U-wheel-spy",
        mode: "conservative",
        state: "flat",
        since: "2026-10-01T13:30:00Z",
        sinceIsLowerBound: false,
      },
    ],
    rollCall: [
      { playbookId: "S1-NVDA", status: "off", reason: why.off },
      { playbookId: "G1-GOOG", status: "off", reason: why.off },
      {
        playbookId: "TACO-DJT",
        status: "blocked",
        reason: "No news feed is wired to it yet, so its trigger never arrives.",
      },
      {
        playbookId: "HC-SAURON",
        status: "blocked",
        reason:
          "Arming it would run a second copy beside the Sauron persona, not replace it (#4227).",
      },
      { playbookId: "U-wheel-spy", status: "armed", mode: "conservative", reason: why.armed },
    ],
  },
};

// The armed roster, as the live code reads it. `now` is fixed so the frame is reproducible; the
// extra NVDA print is confirmed and 30 days out, which puts S1's D-20 entry 10 days ahead.
const NOW = new Date("2026-10-02T15:00:00Z");
const armedVerdicts = [
  { playbookId: "S1-NVDA", mode: "standard", state: "no-window" },
  { playbookId: "G1-GOOG", mode: "conservative", state: "no-window" },
  { playbookId: "U-wheel-spy", mode: "conservative", state: "flat" },
];
const armedHeartbeat = {
  available: true,
  heartbeat: {
    ...heartbeat.heartbeat,
    // The verdict table and the roll call BOTH come from `armedVerdicts`, because
    // `botHeartbeatView` derives both from the same `latestVerdictPass` — a frame showing one
    // roster in the table and another in the roll call is a state production cannot reach.
    playbooks: armedVerdicts.map((v) => ({
      ...v,
      since: "2026-10-01T13:30:00Z",
      sinceIsLowerBound: false,
    })),
    rollCall: playbookRollCall(armedVerdicts, NOW, registeredPlaybooks(), PLAYBOOK_WIRING_GAPS, [
      ...UPCOMING_PRINTS,
      { symbol: "NVDA", date: "2026-11-01", status: "confirmed", source: "IR: shoot fixture" },
    ]),
  },
};

let currentHeartbeat = heartbeat;

const { page, origin, shoot, close } = await openShell({
  name: "heartbeat-roll-call",
  out: resolve("docs/shots/pr-4450"),
  stubs: {
    "/api/settings": settings,
    "/api/desk/bot-sauron": desk,
    "/api/desk/bot-sauron/heartbeat": () => currentHeartbeat,
    "/api/desk/bot-sauron/probes": { available: false },
    "/api/desk/bot-sauron/decisions": { available: true, kind: "bot", cycles: [] },
  },
});

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/u/bot-sauron/decisions`);
await page.getByText("Which playbooks this bot runs").scrollIntoViewIfNeeded();
await shoot("roll-call-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}/app/u/bot-sauron/decisions`);
await page.getByText("Which playbooks this bot runs").scrollIntoViewIfNeeded();
await shoot("roll-call-desktop");

// The same section with the roster armed — the reason an On line needs more than one sentence.
currentHeartbeat = armedHeartbeat;
for (const [tag, viewport] of [
  ["phone", { width: 390, height: 844 }],
  ["desktop", { width: 1280, height: 900 }],
]) {
  await page.setViewportSize(viewport);
  await page.goto(`${origin}/app/u/bot-sauron/decisions`);
  await page.getByText("Which playbooks this bot runs").scrollIntoViewIfNeeded();
  await shoot(`roll-call-armed-${tag}`);
}

await close();
