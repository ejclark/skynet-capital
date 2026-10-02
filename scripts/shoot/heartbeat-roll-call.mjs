// Visual harness for the playbook roll call (#4450 slice 1) — the Heartbeat section with every
// house playbook listed On / Off / Can't fire, over the real built shell + stubbed APIs.
// The stub mirrors production as found on 2026-10-02: no house playbook armed, so S1 and G1 read
// Off; TACO-DJT and HC-SAURON read Can't fire whatever is armed (`PLAYBOOK_WIRING_GAPS`).
// JPEG ≤100KB (docs/PICTURES.md). Shots live under docs/shots/pr-4450 (the plan issue's number).
// Usage: npm run build --prefix app && npx tsx scripts/shoot/heartbeat-roll-call.mjs
import { resolve } from "node:path";
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

const { page, origin, shoot, close } = await openShell({
  name: "heartbeat-roll-call",
  out: resolve("docs/shots/pr-4450"),
  stubs: {
    "/api/settings": settings,
    "/api/desk/bot-sauron": desk,
    "/api/desk/bot-sauron/heartbeat": heartbeat,
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

await close();
