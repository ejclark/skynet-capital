// Visual harness for the Thesis Drawer (#3186 slices 4a + 4b) — a bot's standing call, thesis,
// track-record chart, and locked bot-controls cluster over the real built shell + stubbed APIs.
// JPEG ≤100KB (docs/PICTURES.md).
// Shots live under docs/shots/pr-3186 — the parent issue's own number, kept stable across every
// #3186 slice's screenshots (accounts.mjs does the same under pr-2321), not renumbered per PR.
// Usage: npm run build --prefix app && npm run shoot:thesis [outdir]
// #5327 adds the drawn play (Sauron's own rule as a line, its trades on it) and its frames.
import { resolve } from "node:path";
import { openShell } from "./shell.mjs";

const settings = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "human-eric", name: "Eric", kind: "human", hostConfigured: true, profile: null },
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

function marker(n, playbookId, side, symbol, qty, at, sentiment, momentum) {
  return {
    n,
    kind: side === "buy" ? "entry" : "exit",
    at,
    label: `${side === "buy" ? "Buy" : "Sell"} ${qty} ${symbol}`,
    symbol,
    side,
    activityAnchor: `act-ord-${n}`,
    playbookId,
    ...(sentiment === undefined ? {} : { sentiment, momentum }),
  };
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
    // Sauron's own play's trades carry the news score and momentum their decision read (#5327);
    // trades 1, 2 and 4 are another play's, so they stay off the drawn line.
    markers: [
      marker(1, "S1-NVDA", "buy", "NVDA", 100, "2026-08-18T14:00:00Z"),
      marker(2, "S1-NVDA", "sell", "NVDA", 100, "2026-08-27T15:30:00Z"),
      marker(3, "SAURON", "buy", "META", 160, "2026-08-28T14:10:00Z", -0.74, 0.0012),
      marker(4, "S1-NVDA", "buy", "NVDA", 80, "2026-09-01T14:00:00Z"),
      marker(5, "SAURON", "buy", "AMD", 410, "2026-09-03T15:00:00Z"),
      marker(6, "SAURON", "buy", "NVDA", 700, "2026-09-08T14:30:00Z", -0.82, 0.003),
      marker(7, "SAURON", "sell", "META", 160, "2026-09-10T14:00:00Z", 0.76, -0.0021),
    ],
    // Sauron's own play, drawn (#5327) — the numbers `thesis-play-view.ts` reads off his default
    // config and the bots' default signal windows.
    play: {
      playbookId: "SAURON",
      name: "Buy the rumor, sell the news",
      buyAtOrBelow: -0.7,
      buyMomentumAtLeast: 0,
      sellAtOrAbove: 0.7,
      sellMomentumAtMost: 0,
      windows: { momentum: 20, sentiment: 10 },
      researchBuild: false,
      researchTrades: [],
    },
  },
  // The safeguard ladder (#3194 slice 6a). Two plays so the frame shows the real spread of
  // states — S1-NVDA exactly as the live roster has it (stage 1 watching, stage 2 unarmed), and a
  // second play with stage 2 enforcing, which no house play declares yet but the readout must
  // render honestly the day one does. Wording verbatim from `safeguard-ladder-view.ts`.
  ladderAsOf: "2026-09-16T13:45:00Z",
  ladder: [
    {
      playbookId: "SAURON",
      mode: "standard",
      stages: [
        {
          stage: 1,
          name: "Price and news disagreeing",
          state: "off",
          does: "Nothing checks whether the price move and the news tone disagree on this play.",
        },
        {
          stage: 2,
          name: "Automatic exit on a losing position",
          state: "off",
          does: "No automatic exit on standard. This play sells only when its own rule says to.",
        },
      ],
    },
    {
      playbookId: "S1-NVDA",
      mode: "standard",
      stages: [
        {
          stage: 1,
          name: "Price and news disagreeing",
          state: "watching",
          does:
            "Notes it in the bot log when the price has moved 2.0% or more against a news tone " +
            "of 0.20 or stronger. It only writes the note — no order is held back.",
        },
        {
          stage: 2,
          name: "Automatic exit on a losing position",
          state: "off",
          does: "No automatic exit on standard. This play sells only when its own rule says to.",
        },
      ],
    },
    {
      playbookId: "G1-GOOG",
      mode: "conservative",
      stages: [
        {
          stage: 1,
          name: "Price and news disagreeing",
          state: "off",
          does: "Nothing checks whether the price move and the news tone disagree on this play.",
        },
        {
          stage: 2,
          name: "Automatic exit on a losing position",
          state: "enforcing",
          does:
            "Sells the whole position at market once the bid is 6.0% or more below what this " +
            "play paid for it, whatever the play's own rule says that cycle.",
        },
      ],
    },
  ],
};

const { page, origin, shoot, close } = await openShell({
  name: "thesis",
  out: resolve(process.argv[2] ?? "docs/shots/pr-3186"),
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

// The drawn play (#5327) — the lore, the rule as a line, the walked-through buy and the play's own
// safeguards, which is the top of the tab at 390.
await page.getByRole("heading", { name: "Buy the rumor, sell the news" }).scrollIntoViewIfNeeded();
await shoot("thesis-play-phone");

// The track-record chart's price axis (#5204): ticks in whole dollars with '$' and commas.
await page.locator(".thesis-chart-canvas").scrollIntoViewIfNeeded();
await shoot("thesis-equity-axis-phone");

// The safeguard ladder sits below the call banner, so the drawer's own top-of-page frame cannot
// show it — this one scrolls it into view (#3194 slice 6a).
await page.getByText("Safeguards").scrollIntoViewIfNeeded();
await shoot("thesis-safeguards-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}/app/u/bot-sauron/thesis`);
await page.getByText("Entering").waitFor();
await shoot("thesis-drawer-desktop");
await shoot("thesis-play-desktop");

await page.getByText("Safeguards").scrollIntoViewIfNeeded();
await shoot("thesis-safeguards-desktop");

await close();
