// Pictures for #7216 slice 2: the Eye's light. Moneypenny's answer links a position on the Profile
// page; the tap sends a spark from the tower's Eye to the row: (1) the Eye focuses under a pool of
// light, (2) a spark arcs over the page with a trail under a moving spotlight, (3) it lands as the
// page dims around the row, (4) the dim lifts and a ring and a label naming the Eye stay.
//
// 1760, the tower's column on the page's right (#7487 slice 4a), so the spark arcs leftward to the row; the question goes in through her dock's box and the
// linked line is tapped in History, which rises from the dock (#7487 slice 2: her links live there,
// never in the dock's plain latest line; the tap navigates, so History closes as the light plays). The page's clock is held after the tower is ready, so each step is shot at
// an exact moment of the light rather than wherever a screenshot happened to fall.
//
//   npm run build --prefix app && npm run build:scene && node scripts/shoot/eye-light.mjs [outdir]

import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const stubs = await accountsFixture();
const { page, origin, shoot, close } = await openShell({
  name: "eye-light",
  stubs: {
    ...stubs,
    "/api/companion": {
      enabled: true,
      disclosure: "Educational paper trading — not financial advice.",
    },
  },
  viewport: { width: 1760, height: 900 },
});
await page.emulateMedia({ reducedMotion: "no-preference" });

await page.goto(`${origin}/app/accounts`);
await page.locator(".tower-column").waitFor();
const row = page.locator('tr[id^="pos-"]').first();
await row.waitFor();
const anchor = await row.getAttribute("id");
const symbol = anchor.slice("pos-".length);
console.log(`lighting ${anchor}`);

await page.route("**/api/companion/chat", (route) =>
  route.fulfill({
    status: 200,
    headers: { "content-type": "text/event-stream" },
    body: [
      `event: delta\ndata: ${JSON.stringify({ text: `Your biggest mover is [your ${symbol} position](/accounts#${encodeURIComponent(anchor)}): its row shows the figures.` })}\n\n`,
      "event: done\ndata: {}\n\n",
    ].join(""),
  }),
);
await page.route("**/api/companion/ack", (route) => route.fulfill({ json: { ok: true } }));

try {
  await page.waitForFunction(
    () => document.querySelector("iframe.vantage")?.contentWindow?.__ready === true,
    undefined,
    { timeout: 60_000 },
  );
} catch {
  console.log("the tower never reported ready — shot without it");
}
const dock = page.locator(".mp-dock");
await dock.locator(".mp-box-input").fill("How are my positions doing?");
await dock.getByRole("button", { name: "Send", exact: true }).click();
await dock.locator(".mp-dock-history").click();
const link = page.locator(".mp-history .mp-place").first();
await link.waitFor();
await page.mouse.move(0, 0);
await page.waitForTimeout(1200);
await shoot("0-before");

// Installed, the page's clock still flows on its own; paused, it moves only by `runFor`.
const t = Date.now();
await page.clock.install({ time: t });
await page.clock.pauseAt(t + 1000);
await link.click();
// The light waits for the row to land and hold still (`eye-light-layer.tsx`, STILL_MS), then plays.
let t0 = 0;
for (let i = 0; i < 400; i++) {
  await page.clock.runFor(16);
  if (await page.locator("svg.eye-light").count()) break;
  t0 += 16;
}
console.log(`light began after ~${t0} ms of page time`);
// Each step at its own moment after the light began (`eye-light.ts`: focus 0–200 ms, arc to 720,
// land to 1000, lift to 1320).
let now = 0;
const at = async (tag, ms) => {
  await page.clock.runFor(ms - now);
  now = ms;
  await shoot(tag);
};
await at("1-focus", 140);
await at("2-arc", 520);
await at("3-land", 960);
await at("4-ring", 2400);
await close();
