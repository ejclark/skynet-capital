// Visual harness for a game-master scene in the dock (#8191) — from the REAL built shell (app/dist)
// over a stub API; the chat's reply is a fixed stream, so the frame shows the dock, not the model.
//   scene-phone-offer   390px, the main conversation at rest: "Play a scene from this week's market"
//   scene-phone-scene   390px, after the tap: the event line, the stance, the three choices as
//                       moves, then "Back to the main conversation" (criterion 13's order)
// Usage: npm run build --prefix app && node scripts/shoot/moneypenny-scene.mjs [outdir]
import { profileStubs } from "./profile-fixture.mjs";
import { openShell } from "./shell.mjs";

const step = (id, title, detail, points, route, done) => ({
  id,
  title,
  detail,
  points,
  route,
  done,
});
const onboarding = {
  linked: true,
  viewerId: "member-jordan",
  viewerName: "Jordan",
  milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
  steps: [
    step(
      "connect",
      "Connect your Alpaca paper account",
      "",
      10,
      "/app/accounts?section=milestones&chapter=onboarding",
      true,
    ),
    step(
      "first-message",
      "Say hello to Moneypenny",
      "Moneypenny is our AI agent — your guide for learning the ropes and filing feedback. Send her a message and the trading ladder opens.",
      10,
      "/app/accounts?section=milestones&chapter=onboarding",
      false,
    ),
    step("first-trade", "Make your first trade", "", 10, "/app/trade?play=101", true),
  ],
  done: 2,
  total: 3,
  points: 20,
  totalPoints: 30,
  complete: false,
  account: {
    id: "human-jordan",
    displayName: "Jordan",
    equity: 1_012_340.5,
    cash: 940_210,
    stale: false,
    rungsEarned: 2,
    rungsTotal: 6,
    nextUp: { code: "201", title: "Sell a cash-secured put" },
  },
};

const { page, origin, shoot, close } = await openShell({
  name: "moneypenny-scene",
  viewport: { width: 390, height: 844 },
  quality: 62,
  stubs: {
    "/api/onboarding": {
      ...onboarding,
      steps: onboarding.steps.map((s) => ({ ...s, done: true })),
      done: 3,
      complete: true,
    },
    ...profileStubs([{ id: "human-jordan", name: "Jordan", kind: "human", suspended: false }]),
    "/api/companion": { enabled: true, disclosure: "", gameMaster: true },
    "/api/join": { wired: true, canAddBots: false, classes: [], timezones: [] },
    "/api/playbooks": { linked: true, unlocked: 0, total: 4 },
  },
});

// The scene's first reply, in the order the rules ask for: event line, stance, scene, choices.
const SCENE = [
  "**CRWV earnings print** — Tue Nov 10, date confirmed",
  "The house: *Accumulate small — the capex guide held.*",
  "",
  "The print lands after the close, so the first regular-session reaction is Wednesday's open. " +
    "The AI buildout campaign links it. What would prove the house wrong: CRWV closing under $70 first.",
  "",
  "What does the party do?",
  "1. Watch it",
  "2. Take a paper position",
  "3. Stand aside",
].join("\n");
await page.route("**/api/companion/chat", (route) =>
  route.fulfill({
    status: 200,
    headers: { "content-type": "text/event-stream" },
    body: `event: delta\ndata: ${JSON.stringify({ text: SCENE })}\n\nevent: done\ndata: {}\n\n`,
  }),
);
const seeded = {
  messages: [
    {
      role: "mp",
      text: "Moneypenny · hi, I'm Moneypenny. Ask me anything about the market, your account or this page.",
    },
  ],
  introDone: true,
  threads: [],
  flow: "idle",
  note: "",
  coach: [],
  kind: "idea",
};
await page.addInitScript((blob) => {
  localStorage.setItem("sc.moneypenny.v1.member-jordan", blob);
  localStorage.removeItem("mp-dock-expanded");
}, JSON.stringify(seeded));

await page.goto(`${origin}/app/`);
const play = page.getByRole("button", { name: "Play a scene from this week's market" });
await play.waitFor();
await page.waitForTimeout(300);
await shoot("scene-phone-offer");

await play.click();
await page.getByRole("button", { name: "Take a paper position" }).waitFor();
await page.mouse.move(0, 0); // no hover: a lit choice would read as the recommended one
await page.waitForTimeout(300);
const width = await page.evaluate(() => document.documentElement.scrollWidth);
if (width > 390) throw new Error(`horizontal scroll at 390px: ${String(width)}px wide`);
await shoot("scene-phone-scene");

await close();
