// Visual harness for the Moneypenny rail's header controls — from the REAL built shell (app/dist)
// over a stub API. One frame: the rail open on a mid-thread member, header showing the `+`
// new-conversation control and the "⧉ Copy conversation" control (#1672 slice 2 — the ↺ glyph read
// as "retry" against every mainstream chat app's own `+` convention, and the copy control is the
// save-before-wipe affordance NN/g's baseline chatbot guideline calls for).
// Usage: npm run build --prefix app && npm run shoot:moneypenny [outdir]
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
  viewerName: "Jordan",
  milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
  steps: [
    step("connect", "Connect your Alpaca paper account", "", 10, "/app/onboarding", true),
    step(
      "first-message",
      "Say hello to Moneypenny",
      "Moneypenny is our AI agent — your guide for learning the desk and filing feedback. Send her a message and the trading ladder opens.",
      10,
      "/app/onboarding?moneypenny=intro",
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
  name: "moneypenny",
  viewport: { width: 1280, height: 700 },
  quality: 62,
  stubs: {
    "/api/onboarding": onboarding,
    "/api/companion": { enabled: false, disclosure: "" },
    "/api/join": { wired: true, canAddBots: false, classes: [], timezones: [] },
    "/api/feedback": {
      enabled: true,
      coachEnabled: false,
      followupEnabled: false,
      feedbackCount: 0,
      celebrating: [],
      recent: [],
    },
    "/api/playbooks": { linked: true, unlocked: 0, total: 4 },
    "/api/learn": { rank: "Wheeler", points: 120 },
  },
});

await page.goto(`${origin}/app/onboarding`);
await page.getByRole("button", { name: "Meet Moneypenny ›" }).click();
await page.getByText(/^Moneypenny · hi, I'm Moneypenny/).waitFor();
await page.getByLabel("Message Moneypenny").fill("How am I doing on the desk?");
await page.keyboard.press("Enter");
await page.locator(".mp-msg.mp-user").getByText("How am I doing on the desk?").waitFor();
await page.getByRole("button", { name: "Copy conversation" }).waitFor();
await shoot("moneypenny-rail-header");

await close();
