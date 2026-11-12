// Visual harness for the header controls of Moneypenny's History — from the REAL built shell
// (app/dist) over a stub API. One frame: "Meet Moneypenny ›" opens History over her dock (#7487
// slice 2; the right rail is gone) on a mid-thread member, the header showing Copy, New
// conversation and Close (#1672 slice 2 — the copy control is the save-before-wipe affordance
// NN/g's baseline chatbot guideline calls for), the member's line typed in the dock's box.
// Usage: npm run build --prefix app && npm run shoot:moneypenny [outdir]
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
  name: "moneypenny",
  viewport: { width: 1280, height: 700 },
  quality: 62,
  stubs: {
    "/api/onboarding": onboarding,
    ...profileStubs([{ id: "human-jordan", name: "Jordan", kind: "human", suspended: false }]),
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
    "/api/learn": {
      linked: true,
      rank: "Wheeler",
      points: 120,
      totalPoints: 295,
      courses: [],
      celebrating: [],
      engagementCelebrating: [],
      pendingChecks: 0,
    },
  },
});

await page.goto(`${origin}/app/accounts?section=milestones&chapter=onboarding`);
await page.getByRole("button", { name: "Meet Moneypenny ›" }).click();
const history = page.locator(".mp-history");
await history.getByText(/^Moneypenny · hi, I'm Moneypenny/).waitFor();
await page.locator(".mp-dock .mp-box-input").fill("How am I doing on my account?");
await page.keyboard.press("Enter");
await history.locator(".mp-msg.mp-user").getByText("How am I doing on my account?").waitFor();
await history.getByRole("button", { name: "Copy", exact: true }).waitFor();
await history.getByRole("button", { name: "New conversation" }).waitFor();
await shoot("moneypenny-history-header");

await close();
