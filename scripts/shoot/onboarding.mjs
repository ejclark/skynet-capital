// Visual harness for /app/onboarding — milestone M·01 from the REAL built shell (app/dist) over a
// stub API, four frames: a brand-new member (the five-step guide as accordions, step 1 open), the
// same member with step 5 opened (the connect form inside it), Moneypenny's rail open with her
// intro (the whole shell pushed left), and a connected member (step 1 done, tiles live, steps 2–3
// waiting). JPEG ≤100KB (docs/PICTURES.md) — quality 55, not the harness default, because these
// frames are 1100px tall and need it to clear the cap.
// Usage: npm run build --prefix app && npm run shoot:onboarding [outdir]
import { openShell } from "./shell.mjs";

const step = (id, title, detail, points, route, done) => ({
  id,
  title,
  detail,
  points,
  route,
  done,
});
const steps = (connected) => [
  step(
    "connect",
    "Connect your Alpaca paper account",
    "Set up a free Alpaca paper account and link it here in five short steps, detailed below. We read keys only to verify and show your balance — no orders are ever placed on your behalf.",
    10,
    "/app/onboarding",
    connected,
  ),
  step(
    "first-message",
    "Say hello to Moneypenny",
    "Moneypenny is our AI agent — your guide for learning the desk and filing feedback. Send her a message and the trading ladder opens.",
    10,
    "/app/onboarding?moneypenny=intro",
    false,
  ),
  step(
    "first-trade",
    "Make your first trade",
    "The desk unlocks one rung at a time — buy a stock first, and each real fill opens the next play. No skipping ahead. Orders fill only while the market is open — 9:30 AM to 4:00 PM ET, Monday through Friday.",
    10,
    "/app/trade?play=101",
    false,
  ),
];
const milestone = { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" };
const fresh = {
  linked: true,
  viewerName: "Tony",
  milestone,
  steps: steps(false),
  done: 0,
  total: 3,
  points: 0,
  totalPoints: 30,
  complete: false,
};
const connected = {
  ...fresh,
  steps: steps(true),
  done: 1,
  points: 10,
  account: {
    id: "human-joe",
    displayName: "Uncle Joe",
    equity: 1_000_000,
    cash: 1_000_000,
    stale: false,
    rungsEarned: 0,
    rungsTotal: 6,
    nextUp: { code: "101", title: "Buy stock" },
  },
};
const joinIndex = {
  wired: true,
  canAddBots: false,
  classes: [],
  timezones: [{ value: "America/New_York", label: "Eastern (New York)" }],
};
const feedbackIndex = {
  enabled: true,
  coachEnabled: false,
  followupEnabled: false,
  feedbackCount: 0,
  celebrating: [],
  recent: [],
};
const playbooks = { linked: true, unlocked: 0, total: 4 };
const journey = { rank: "Observer", points: 0 };

// The one endpoint whose answer changes mid-run: the last frame is the SAME member after connecting,
// so `/api/onboarding` is a function of the current state rather than a fixed body.
let state = fresh;

const { page, origin, shoot, close } = await openShell({
  name: "onboarding",
  viewport: { width: 1280, height: 1100 },
  quality: 55,
  stubs: {
    "/api/onboarding": () => state,
    "/api/join": joinIndex,
    "/api/feedback": feedbackIndex,
    "/api/playbooks": playbooks,
    "/api/learn": journey,
  },
});

await page.goto(`${origin}/app/onboarding`);
await page.getByRole("button", { name: "Create a free Alpaca account" }).waitFor();
await shoot("onboarding-fresh");

// step 5 opened — the connect form lives inside it; steps 1 and 5 stay open together
await page.getByRole("button", { name: "Copy/paste account key and secret below" }).click();
await page.getByLabel("Display name").waitFor();
await page
  .getByRole("button", { name: "Copy/paste account key and secret below" })
  .scrollIntoViewIfNeeded();
await shoot("onboarding-step5-form");

// Moneypenny's rail — step 2's button opens it with her intro; the whole shell moves left
await page.goto(`${origin}/app/onboarding`);
await page.getByRole("button", { name: "Meet Moneypenny ›" }).click();
await page.getByText(/isn't connected yet/).waitFor();
await page.getByLabel("Message Moneypenny").fill("yes");
await page.keyboard.press("Enter");
await page.getByText(/the short path: create a free account/).waitFor();
await shoot("onboarding-moneypenny-rail");

state = connected;
await page.goto(`${origin}/app/onboarding`);
await page.getByText("PAPER · LIVE").waitFor();
await shoot("onboarding-connected");

await close();
