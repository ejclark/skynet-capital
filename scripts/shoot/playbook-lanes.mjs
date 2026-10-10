// Visual harness for the Playbooks section's week on one clock (#5073 slice 2; #5037 round 2,
// R2): the bot's checks drawn as a strip across Mon–Fri, and each playbook's answers as a lane
// under it on the same clock, ▲/▼ where it traded. Sauron in the round-2 study's world, Fri Oct 9
// 2026, 3:00 PM ET: Sauron bought 14 NVDA Mon 11:20, CRWV-WHEEL sold its $80 put Tue 10:31. The
// lane history across the week is illustrative (as the drawn frames were); the roll call, the
// verdicts and every reason are the accounts shoot's own fixture (`accounts-fixture.mjs`).
// Frames: the section at 390, one card opened (key + its trade in words), a week with a quiet
// spell, and the bench at 1280 where the strip and the lanes share one column.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/playbook-lanes.mjs [outdir]

import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const stubs = await accountsFixture();
const NOW = Date.parse("2026-10-09T19:00:00Z"); // Fri 3:00 PM New York
const DAYS = ["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09"];
const BUCKET = 30 * 60_000;
const sessions = DAYS.map((date) => ({
  date,
  openAt: Date.parse(`${date}T13:30:00Z`),
  closeAt: Date.parse(`${date}T20:00:00Z`),
}));
const begun = (d, b) => sessions[d].openAt + b * BUCKET <= NOW;
/** A lane: `pick(day, bucket)` names the answer each half hour, null once not yet begun. */
const lane = (pick) =>
  DAYS.map((_, d) => Array.from({ length: 13 }, (_, b) => (begun(d, b) ? pick(d, b) : null)));
const checks = (quiet = () => false) =>
  DAYS.map((_, d) =>
    Array.from({ length: 13 }, (_, b) => (begun(d, b) ? (quiet(d, b) ? 0 : 120) : null)),
  );

const base = (
  typeof stubs["/api/desk/bot-sauron/heartbeat"] === "function"
    ? stubs["/api/desk/bot-sauron/heartbeat"]()
    : stubs["/api/desk/bot-sauron/heartbeat"]
).heartbeat;
const today = "2026-10-09T13:30:00Z";
const playbooks = base.playbooks.map((v) => (v.since > "2026-10-09" ? { ...v, since: today } : v));
const slot = (id) => playbooks.findIndex((v) => v.playbookId === id);
const lanes = [
  { playbookId: "SAURON", mode: "aggressive", states: lane(() => "tactical") },
  // Wanted its put on until it sold it Tue 10:31, then waits for its next window holding it.
  {
    playbookId: "CRWV-WHEEL",
    mode: "aggressive",
    states: lane((d, b) => (d === 0 || (d === 1 && b <= 1) ? "long" : "no-window")),
  },
  { playbookId: "S1-NVDA", mode: "standard", states: lane(() => "no-window") },
  { playbookId: "NVDA-CALL-SPREAD", mode: "aggressive", states: lane(() => "no-window") },
  { playbookId: "G1-GOOG", mode: "standard", states: lane(() => "no-window") },
  { playbookId: "HC-SAURON", mode: "standard", states: lane(() => "tactical") },
].map((l) => ({ ...l, slot: slot(l.playbookId) }));
const trades = [
  {
    at: Date.parse("2026-10-05T15:20:00Z"),
    symbol: "NVDA",
    side: "buy",
    playbookId: "SAURON",
    mode: "aggressive",
  },
  {
    at: Date.parse("2026-10-06T14:31:00Z"),
    symbol: "CRWV",
    side: "sell",
    playbookId: "CRWV-WHEEL",
    mode: "aggressive",
  },
];
let quietWednesday = false;
const heartbeat = () => {
  const quiet = (d, b) => quietWednesday && d === 2 && (b === 1 || b === 2);
  const gapFrom = Date.parse("2026-10-07T14:02:00Z");
  return {
    available: true,
    heartbeat: {
      ...base,
      state: "beating",
      marketOpen: true,
      lastPassAt: new Date(NOW - 20_000).toISOString(),
      sinceLastPassMs: 20_000,
      playbooks,
      week: {
        bucketMs: BUCKET,
        now: NOW,
        sessions,
        checks: checks(quiet),
        gaps: quietWednesday ? [{ from: gapFrom, to: gapFrom + 54 * 60_000 }] : [],
        lanes,
        trades,
      },
    },
  };
};

const { page, origin, shoot, close } = await openShell({
  name: "playbook-lanes",
  viewport: { width: 390, height: 1100 },
  quality: 58,
  stubs: { ...stubs, "/api/desk/bot-sauron/heartbeat": heartbeat },
});
await page.clock.setFixedTime(new Date(NOW));
await page.emulateMedia({ reducedMotion: "reduce" });
// Times on the page are the reader's own clock; a headless browser's is UTC, so read as New York's
// the frames say "Tue 10:31 AM", the time the study drew.
const cdp = await page.context().newCDPSession(page);
await cdp.send("Emulation.setTimezoneOverride", { timezoneId: "America/New_York" });

const section = `${origin}/app/accounts?account=bot-sauron&section=playbooks`;
const toStrip = () =>
  page.evaluate(() => {
    const el = document.querySelector(".pbb-strip");
    const sticky = document.querySelector(".cockpit-head")?.getBoundingClientRect().bottom ?? 0;
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - sticky - 8);
  });
await page.goto(section);
await page.locator(".pbb-cards .wk-lane").first().waitFor();
await toStrip();
await shoot("playbook-lanes-phone");

await page.getByText("CRWV-WHEEL", { exact: true }).click();
await page.locator(".pbb-card details[open] .wk-key").waitFor();
await toStrip();
await shoot("playbook-lanes-open-phone");

quietWednesday = true;
await page.goto(section);
await page.locator(".wk-cell[data-c='gap']").first().waitFor();
await toStrip();
await shoot("playbook-lanes-gap-phone");
quietWednesday = false;

await page.setViewportSize({ width: 1280, height: 1000 });
await page.goto(section);
await page.locator(".pbb-cards .wk-lane").first().waitFor();
await toStrip();
await shoot("playbook-lanes-desktop");

await close();
