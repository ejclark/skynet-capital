// Visual harness for a recorded capital flow (#4563 slice 2) — the standings row's mark and the
// equity curve's annotation, from the REAL built shell over stub APIs. The words come from the
// server's own `capital-flow-mark.ts`, not a copy, so the frame shows exactly what a member reads.
// Frames: the Field at 390 (phone first) and at desktop width, then the hero chart at desktop
// width (the phone curates the curve out).
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npm run shoot:capital-flow [outdir]
import { curveFlows, flowMark } from "../../src/observatory/capital-flow-mark.ts";
import { profileStubs } from "./profile-fixture.mjs";
import { openShell } from "./shell.mjs";

const DANA = { id: "human-dana", name: "Dana", kind: "human", suspended: false };

// Dana fell to $700k, then reset her paper balance to $1,000,000 on Oct 5. Raw equity puts her
// above two honest rows; the mark is what says the $300,000 arrived rather than was earned.
const topUp = {
  participantId: DANA.id,
  from: "2026-10-05T14:00:00.000Z",
  at: "2026-10-05T14:05:00.000Z",
  amount: 300_000,
  direction: "added",
  unexplainedCash: 300_000,
  basis: "inferred",
};

const row = (key, name, kind, value, sortValue, bar, flows = []) => {
  const flow = flowMark(flows);
  return {
    key,
    name,
    kind,
    value,
    tone: "flat",
    bar,
    sortValue,
    ...(flow ? { flow } : {}),
  };
};

const board = {
  seq: 1,
  generatedAt: "2026-10-09T20:00:00Z",
  metric: "equity",
  view: {
    blocks: {},
    rows: [
      row("bot-sauron", "Sauron", "bot", "$1,084,210", 1_084_210, 100),
      row(DANA.id, "Dana", "human", "$1,003,400", 1_003_400, 93, [topUp]),
      row("human-eric", "Eric", "human", "$962,880", 962_880, 89),
      row("bot-futurist", "Futurist", "bot", "$941,005", 941_005, 87),
      row("human-joe", "Uncle Joe", "human", "$903,112", 903_112, 83),
    ],
  },
};

// Twenty trading days of Dana's curve: a slide to −30%, then the reset lifts it back to 0 on Oct 5.
const days = [];
for (
  let d = new Date("2026-09-14T04:00:00Z");
  days.length < 20;
  d = new Date(d.getTime() + 864e5)
) {
  if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) days.push(new Date(d));
}
const points = days.map((day, i) => {
  const resetAt = days.findIndex((x) => x.toISOString() >= "2026-10-05");
  const value = i < resetAt ? -0.3 * (i / resetAt) : 0.003 * (i - resetAt);
  return { t: day.toISOString(), value };
});
const curve = { range: "1M", points, flows: curveFlows([topUp], points) };
const bars = {
  symbol: "SPY",
  bars: days.map((day, i) => {
    const c = 560 * (1 + 0.001 * i);
    return { t: day.toISOString(), o: c, h: c, l: c, c, v: 0 };
  }),
};

const { page, origin, shoot, close } = await openShell({
  name: "capital-flow",
  viewport: { width: 390, height: 844 },
  stubs: {
    "/api/board": board,
    "/api/learn": {},
    ...profileStubs([DANA]),
    [`/api/accounts/${DANA.id}/equity-curve`]: curve,
    "/api/trade/bars": bars,
  },
});

await page.goto(`${origin}/app/leaderboard`);
await page.locator(".rank-flow").waitFor();
await shoot("flow-standings-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.locator(".rank-flow").waitFor();
await shoot("flow-standings-desktop");

// The curve is the wider screens' room: at 390 the net-worth card curates it out (#3689 slice 8),
// so the phone reads the flow on the Field above, and the annotation is a desktop frame.
await page.goto(`${origin}/app/accounts`);
await page.locator(".hero-chart-flows").waitFor();
await page.locator(".hero-chart-flows").scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await shoot("flow-curve-desktop");

await close();
