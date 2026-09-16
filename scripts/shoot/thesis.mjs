// Visual harness for the Thesis Drawer (#3186 slice 4a) — a bot's standing call, thesis, and
// track-record chart over the real built shell + stubbed APIs. JPEG ≤100KB (docs/PICTURES.md).
// Shots live under docs/shots/pr-3186 — the parent issue's own number, kept stable across every
// #3186 slice's screenshots (accounts.mjs does the same under pr-2321), not renumbered per PR.
// Usage: npm run build --prefix app && npm run shoot:thesis [outdir]
import { resolve } from "node:path";
import { openShell } from "./shell.mjs";

const settings = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "bot-sauron", name: "Sauron", kind: "bot", hostConfigured: true, profile: null },
  ],
};

const desk = {
  generatedAt: "2026-09-16T00:00:00Z",
  desk: {
    id: "bot-sauron",
    name: "Sauron",
    kind: "bot",
    considerations: [],
    positions: [],
    tiles: {
      openPositions: 0,
      invested: "$0",
      investedRaw: 0,
      dayPl: "$0",
      dayTone: "flat",
      dayPlRaw: 0,
      unrealized: "$0",
      unrealizedNote: "no positions",
      unrealizedTone: "flat",
      unrealizedRaw: 0,
      cash: "$310,940",
      cashRaw: 310940,
    },
  },
};

// A month of Sauron's equity, deterministic (no randomness) so the screenshot is reproducible.
function equityPoints(days, start, endReturn) {
  return Array.from({ length: days }, (_, i) => {
    const t = i / (days - 1);
    const value = start * (1 + endReturn * t + Math.sin(i / 2) * 0.004);
    const day = new Date(Date.UTC(2026, 7, 12 + i));
    return { t: day.toISOString(), value };
  });
}

const thesis = {
  available: true,
  kind: "bot",
  thesis: {
    personaId: "sauron",
    thesis: "Fades exhausted euphoria; claims what panic discards.",
    call: {
      verdict: "entering",
      why: "NVDA momentum broke the shelf on volume — the panic sellers are done.",
      window: "2d",
      invalidator: "closes back below the 20-day SMA",
      asOf: "2026-09-10T14:00:00Z",
    },
    health: { measured: true, label: "steady", detail: "1.2% off peak (5% cap)" },
    equity: equityPoints(23, 310_940, 0.022),
    markers: [
      {
        n: 1,
        kind: "entry",
        at: "2026-08-18T14:00:00Z",
        label: "Buy 100 NVDA",
        activityAnchor: "act-ord-1",
      },
      {
        n: 2,
        kind: "exit",
        at: "2026-08-27T15:30:00Z",
        label: "Sell 100 NVDA",
        activityAnchor: "act-ord-2",
      },
    ],
  },
};

const { page, origin, shoot, close } = await openShell({
  name: "thesis",
  out: resolve("docs/shots/pr-3186"),
  stubs: {
    "/api/settings": settings,
    "/api/desk/bot-sauron": desk,
    "/api/desk/bot-sauron/thesis": thesis,
  },
});

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/u/bot-sauron/thesis`);
await page.getByText("Entering").waitFor();
await shoot("thesis-drawer-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}/app/u/bot-sauron/thesis`);
await page.getByText("Entering").waitFor();
await shoot("thesis-drawer-desktop");

await close();
