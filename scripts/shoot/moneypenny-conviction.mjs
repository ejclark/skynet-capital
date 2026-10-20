// Visual harness for a view Moneypenny drafts in the chat (#5482 criterion 9) — from the REAL built
// shell (app/dist) over a stub API, at phone width (the rail covers the page there). Two frames:
// her card for the member's view (each setting before → after, what it takes over, the three exits
// as chips), and the thread after the member taps "Hand it to my bots" (the save and hand-over
// answered by the stubbed routes).
// Usage: npm run build --prefix app && npm run shoot:moneypenny-conviction [outdir]
import { profileStubs } from "./profile-fixture.mjs";
import { openShell } from "./shell.mjs";

const DRAFT = {
  title: "CRWV floor holds",
  checkOn: "2027-01-29",
  claims: [
    {
      tag: "underrated",
      statement: "Demand for CRWV's capacity outlasts the AI selloff.",
      bucket: "forward",
      evidence: "A ~$125B backlog, in my own words.",
      falsifier: "CRWV closes under $45 on or before 2026-12-18.",
      scoreBy: "2026-12-18",
    },
    {
      tag: "overrated",
      statement: "Election-season sentiment against AI spending.",
      bucket: "forward",
      evidence: "The midterms are 2026-11-03.",
      falsifier: "CRWV is below its 10-16 close on 2026-11-10.",
      scoreBy: "2026-11-10",
    },
  ],
  steers: ["CRWV-WHEEL"],
  narrowings: [
    {
      pair: "CRWV-WHEEL",
      fromClaims: [],
      narrow: [
        { kind: "strike-ceiling", ceiling: 55 },
        { kind: "contracts", max: 1 },
      ],
    },
  ],
};
const CONVICTION = {
  ...DRAFT,
  id: "crwv-floor-holds-2026-10",
  owner: "Jordan",
  statedOn: "2026-10-19",
};
const CARD = {
  label: "SIM",
  pairs: [
    {
      pair: "CRWV-WHEEL",
      name: "the wheel on CRWV",
      changes: [
        { setting: "Strike", before: "the playbook's own pick", after: "at or under $55.00" },
        { setting: "Contracts", before: "up to 2", after: "at most 1" },
      ],
    },
  ],
  check:
    "Checked 2027-01-29, on net P/L and each playbook's own retire test: if it fails, every pair it steers stops opening new positions. Exits keep running.",
  timing:
    "The playbook still picks when to open and close inside these settings. This view never places an order.",
};
const DRAFTED = {
  draft: DRAFT,
  conviction: CONVICTION,
  card: CARD,
  takesOver: [{ pair: "CRWV-WHEEL", name: "the wheel on CRWV", from: "AI-dip view" }],
};

const onboarding = {
  linked: true,
  viewerName: "Jordan",
  milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
  steps: [
    { id: "connect", title: "", detail: "", points: 10, route: "/app/accounts", done: true },
    { id: "first-message", title: "", detail: "", points: 10, route: "/app/accounts", done: true },
    { id: "first-trade", title: "", detail: "", points: 10, route: "/app/trade", done: true },
  ],
  done: 3,
  total: 3,
  points: 30,
  totalPoints: 30,
  complete: true,
  account: { id: "human-jordan", displayName: "Jordan", equity: 1_012_340.5, cash: 940_210 },
};

const { page, origin, shoot, close } = await openShell({
  name: "moneypenny-conviction",
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  quality: 62,
  stubs: {
    "/api/onboarding": onboarding,
    ...profileStubs([{ id: "human-jordan", name: "Jordan", kind: "human", suspended: false }]),
    "/api/companion": {
      enabled: true,
      disclosure: "Educational paper trading — not financial advice.",
    },
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
    "/api/convictions/save": {
      ok: true,
      label: "SIM",
      conviction: CONVICTION,
      card: CARD,
      saved: true,
      note: "",
    },
    "/api/convictions/hand-over": {
      ok: true,
      label: "SIM",
      steering: [{ pair: "CRWV-WHEEL", name: "the wheel on CRWV" }],
      note: "Your bots run each pair it steers inside these settings from their next check-in, and the playbook still picks when to open and close. Members can see a view that steers. Take it back any time.",
    },
  },
});

// Her turn, streamed: the card frame, then her line.
await page.route("**/api/companion/chat", (route) =>
  route.fulfill({
    status: 200,
    headers: { "content-type": "text/event-stream" },
    body: [
      `event: conviction\ndata: ${JSON.stringify(DRAFTED)}\n\n`,
      `event: delta\ndata: ${JSON.stringify({ text: "here's your view as a card: it caps the wheel's put strike at $55 and its size at one contract. i filled in the check day (2027-01-29) — change it if you meant another. tap below to hand it to your bots." })}\n\n`,
      "event: done\ndata: {}\n\n",
    ].join(""),
  }),
);
await page.route("**/api/companion/ack", (route) => route.fulfill({ json: { ok: true } }));

await page.goto(`${origin}/app/research?section=playbooks`);
await page.evaluate(() => localStorage.clear());
await page
  .getByRole("button", { name: /Moneypenny/ })
  .first()
  .click();
await page
  .getByLabel("Message Moneypenny")
  .fill(
    "CRWV's floor is around $55 and the market underrates its backlog. cap my wheel there, one contract",
  );
await page.getByRole("button", { name: "Send" }).click();
await page.getByRole("button", { name: "Hand it to my bots" }).waitFor();
await page.locator(".mp-draft").last().scrollIntoViewIfNeeded();
await shoot("conviction-card-phone");
await page.getByRole("button", { name: "Hand it to my bots" }).click();
await page.getByText(/handed to your bots/).waitFor();
await shoot("conviction-handed-phone");

await close();
