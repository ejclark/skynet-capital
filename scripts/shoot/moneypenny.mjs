// Visual harness for Moneypenny's conversation pane — from the REAL built shell (app/dist) over a
// stub API. Eric, 2026-11-13: "The beginning of a response should be visible without scrolling…
// Consolidate the chat and history windows. The ability to expand/collapse window size is enough."
// A member whose conversation ends in a long answer of hers, three frames:
//   moneypenny-phone-compact   390px, the default size: the pane opens on her answer's FIRST line
//   moneypenny-phone-expanded  390px, after "Expand": Copy and New conversation in the header
//   moneypenny-desktop         1280px, compact, the page above it
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
  name: "moneypenny",
  viewport: { width: 390, height: 844 },
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

// A conversation already under way, ending in a long answer: the case Eric scrolled up for.
const ANSWER = [
  "Moneypenny · here's where you stand on your paper account (SIM).",
  "",
  "- **Equity:** $1,012,340.50, up 1.2% since you connected.",
  "- **Cash:** $940,210, so about 93% of the account is idle.",
  "- **Ladder:** 2 of 6 rungs earned; next up is selling a cash-secured put.",
  "",
  "The one thing I'd look at first: that idle cash. A cash-secured put on a stock you'd be happy " +
    "to own puts some of it to work and earns the next rung. Want me to walk you through one on " +
    "the trade form?",
].join("\n");
const seeded = {
  messages: [
    {
      role: "mp",
      text: "Moneypenny · hi, I'm Moneypenny. Ask me anything about the market, your account or this page.",
    },
    { role: "user", text: "How am I doing on my account?" },
    { role: "mp", text: ANSWER },
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

await page.goto(`${origin}/app/accounts?section=milestones&chapter=onboarding`);
const pane = page.getByRole("region", { name: "Conversation with Moneypenny" });
await pane.getByText(/here's where you stand/).waitFor();
await page.waitForTimeout(300);
await shoot("moneypenny-phone-compact");

await pane.getByRole("button", { name: /^Expand/ }).click();
await pane.getByRole("button", { name: "New conversation" }).waitFor();
await page.waitForTimeout(300);
await shoot("moneypenny-phone-expanded");

await pane.getByRole("button", { name: /^Collapse/ }).click();
// a desktop visit, loaded at its own width (a resize mid-page reflows under the old position)
await page.setViewportSize({ width: 1280, height: 800 });
await page.reload();
await pane.getByText(/here's where you stand/).waitFor();
await page.waitForTimeout(300);
await shoot("moneypenny-desktop");

await close();
