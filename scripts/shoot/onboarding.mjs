// Visual harness for the Onboarding chapter of the Profile page's Milestones
// (/app/accounts?section=milestones&chapter=onboarding, once /app/onboarding, #3807 slice 2b) — milestone M·01 from the REAL built shell (app/dist) over a
// stub API, five frames: a brand-new member at 390 first (phone-first; steps lead, steps 2–3 held as
// one line each, the milestones list folded below — #5256), the same at 1280, the member with step 5
// opened (the connect form inside it), Moneypenny's rail open with her intro from step 2's held line
// (the whole shell pushed left), and a connected member (step 1 done, steps 2–3 open in full).
// JPEG ≤100KB (docs/PICTURES.md) — quality 55, not the harness default, because these
// frames are 1100px tall and need it to clear the cap.
// Usage: npm run build --prefix app && npm run shoot:onboarding [outdir]
import { JOE, profileStubs } from "./profile-fixture.mjs";
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
    "/app/accounts?section=milestones&chapter=onboarding",
    connected,
  ),
  step(
    "first-message",
    "Say hello to Moneypenny",
    "Moneypenny is our AI agent — your guide for learning the ropes and filing feedback. Send her a message and the trading ladder opens.",
    10,
    "/app/accounts?section=milestones&chapter=onboarding",
    false,
  ),
  step(
    "first-trade",
    "Make your first trade",
    "Your account unlocks one rung at a time — buy a stock first, and each real fill opens the next play. No skipping ahead. Orders fill only while the market is open — 9:30 AM to 4:00 PM ET, Monday through Friday.",
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
// The chapter now sits under the Milestones table of contents, which reads the whole journey.
// `linked` follows the state below: no account until the connect lands.
const journey = {
  linked: false,
  rank: "Observer",
  points: 0,
  totalPoints: 295,
  courses: [],
  celebrating: [],
  engagementCelebrating: [],
  pendingChecks: 0,
};

// The one endpoint whose answer changes mid-run: the last frame is the SAME member after connecting,
// so `/api/onboarding` is a function of the current state rather than a fixed body.
let state = fresh;

const { page, origin, shoot, close } = await openShell({
  name: "onboarding",
  viewport: { width: 1280, height: 1100 },
  quality: 55,
  stubs: {
    "/api/onboarding": () => state,
    // The head reads the owned accounts: none until the connect lands, then Uncle Joe's.
    "/api/settings": () => profileStubs(state === fresh ? [] : [JOE])["/api/settings"],
    "/api/accounts/networth": profileStubs([JOE])["/api/accounts/networth"],
    // The connected frame's tower column reads Uncle Joe's desk; an unstubbed `{}` broke that frame.
    "/api/desk/*": { desk: { id: "human-joe", name: "Uncle Joe", kind: "human", positions: [] } },
    "/api/join": joinIndex,
    "/api/feedback": feedbackIndex,
    "/api/playbooks": playbooks,
    "/api/learn": () => ({ ...journey, linked: state !== fresh }),
  },
});

// phone first (CLAUDE.md, mobile-first): the 390 frame is the one a member-surface PR opens with
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${origin}/app/accounts?section=milestones&chapter=onboarding`);
await page.getByRole("button", { name: "Create a free Alpaca account" }).waitFor();
await shoot("onboarding-fresh-390");
await page.setViewportSize({ width: 1280, height: 1100 });
await shoot("onboarding-fresh");

// step 5 opened — the connect form lives inside it; steps 1 and 5 stay open together
await page.getByRole("button", { name: "Copy/paste account key and secret below" }).click();
await page.getByLabel("Display name").waitFor();
await page
  .getByRole("button", { name: "Copy/paste account key and secret below" })
  .scrollIntoViewIfNeeded();
await shoot("onboarding-step5-form");

// Moneypenny's rail — step 2's held line still opens it with her intro (ordered, never locked)
await page.goto(`${origin}/app/accounts?section=milestones&chapter=onboarding`);
await page.getByRole("button", { name: "Say hello now ›" }).click();
await page.getByText(/isn't connected yet/).waitFor();
await page.getByLabel("Message Moneypenny").fill("yes");
await page.keyboard.press("Enter");
await page.getByText(/the short path: create a free account/).waitFor();
await shoot("onboarding-moneypenny-rail");

state = connected;
await page.goto(`${origin}/app/accounts?section=milestones&chapter=onboarding`);
await page.getByText("PAPER · LIVE").waitFor();
await shoot("onboarding-connected");

await close();
