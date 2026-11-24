// Visual harness for the Onboarding chapter of the Profile page's Milestones
// (/app/accounts?section=milestones&chapter=onboarding, once /app/onboarding, #3807 slice 2b) — milestone M·01 from the REAL built shell (app/dist) over a
// stub API, five frames: a brand-new member at 390 first (phone-first; steps lead, steps 2–3 held as
// one line each, the milestones list folded below — #5256), the same at 1280, the member with step 5
// opened (the connect form inside it), the #8250 puzzle → practice pick → Connect cards at 390, Moneypenny's History open over her dock with her intro from
// step 2's held line (#7487 slice 2; the page stays put above it), and a connected member (step 1 done, steps 2–3 open in full).
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
let connectOn = false;
const joinIndex = () => ({
  wired: true,
  connect: connectOn,
  canAddBots: false,
  classes: [],
  timezones: [{ value: "America/New_York", label: "Eastern (New York)" }],
});
// The newcomer puzzle (#8250): invented closes, labelled as such on the card itself.
const name = (symbol, reportDate, afterDate, before, after, last) => ({
  symbol,
  reportDate,
  timing: "after-close",
  beforeDate: reportDate,
  beforeClose: before,
  afterDate,
  afterClose: after,
  movePct: Math.round(((after - before) / before) * 1000) / 10,
  lastClose: last,
  lastCloseDate: "2026-11-20",
});
const puzzle = {
  question: "Which of these moved most after its last earnings report?",
  names: [
    name("AMZN", "2026-10-29", "2026-10-30", 200, 218, 220.5),
    name("GOOG", "2026-10-28", "2026-10-29", 180, 187.2, 188.4),
    name("META", "2026-10-21", "2026-10-22", 600, 576, 590),
    name("MSFT", "2026-10-28", "2026-10-29", 400, 406, 410.25),
  ],
  answer: "AMZN",
  source: "Picture fixture, not market data",
  readAt: "2026-11-24T14:00:00.000Z",
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
    "/api/practice/puzzle": puzzle,
    "/api/connect/alpaca": { enabled: true, result: null },
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
// #8250: the puzzle answered and a practice pick made, then Connect on — each at 390.
await page.getByRole("button", { name: /^META/ }).click();
await page.getByRole("button", { name: /0\.5%/ }).click();
await page.locator(".np-card").nth(1).scrollIntoViewIfNeeded();
await shoot("onboarding-practice-pick-390");
connectOn = true;
await page.goto(`${origin}/app/accounts?section=milestones&chapter=onboarding`);
await page.getByRole("button", { name: "Connect with Alpaca" }).scrollIntoViewIfNeeded();
await shoot("onboarding-connect-390");
connectOn = false;
await page.goto(`${origin}/app/accounts?section=milestones&chapter=onboarding`);
await page.getByRole("button", { name: "Create a free Alpaca account" }).waitFor();
await page.setViewportSize({ width: 1280, height: 1100 });
await shoot("onboarding-fresh");

// step 5 opened — the connect form lives inside it; steps 1 and 5 stay open together
await page.getByRole("button", { name: "Copy/paste account key and secret below" }).click();
await page.getByLabel("Display name").waitFor();
await page
  .getByRole("button", { name: "Copy/paste account key and secret below" })
  .scrollIntoViewIfNeeded();
await shoot("onboarding-step5-form");

state = connected;
await page.goto(`${origin}/app/accounts?section=milestones&chapter=onboarding`);
await page.getByText("PAPER · LIVE").waitFor();
await shoot("onboarding-connected");
// #8250: the practice pick (kept in this browser) offered as a real paper order, at 390.
await page.setViewportSize({ width: 390, height: 844 });
await page
  .getByRole("link", { name: "Place this on your paper account ›" })
  .scrollIntoViewIfNeeded();
await shoot("onboarding-place-pick-390");

state = fresh;
// Moneypenny's History — step 2's held line still opens it with her intro (ordered, never locked);
// the answer is typed in the dock's box. Text waits are scoped to History: her latest line in the
// dock repeats the same words.
await page.goto(`${origin}/app/accounts?section=milestones&chapter=onboarding`);
await page.getByRole("button", { name: "Say hello now ›" }).click();
const history = page.locator(".mp-history");
await history.getByText(/isn't connected yet/).waitFor();
await page.locator(".mp-dock .mp-box-input").fill("yes");
await page.keyboard.press("Enter");
await history.getByText(/the short path: create a free account/).waitFor();
await shoot("onboarding-moneypenny-history");

await close();
