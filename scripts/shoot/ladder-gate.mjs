// Visual harness for the feedback gate (#1119) from the REAL built shell over stub APIs: the trade
// desk and the milestones table of contents as a brand-new member sees them — training wheels on,
// nothing filed, every rung shut for the one stated reason. JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npm run shoot:ladder-gate [outdir]
import { openShell } from "./shell.mjs";

const NOTE =
  "The ladder opens the moment you say hello to Moneypenny — trading starts with a conversation.";
const gate = { reason: "first-message", note: NOTE };
const play = (code, name, tldr, kind, side, optionType) => ({
  code,
  id: code,
  name,
  tldr,
  kind,
  side,
  ...(optionType ? { optionType } : {}),
  gloss: "",
  locked: true,
});
const plays = {
  linked: true,
  wheels: true,
  gate,
  plays: [
    play("101", "Buy stock", "Own shares of a company you'd hold.", "stock", "buy"),
    play("102", "Sell stock", "Book a result, green or red.", "stock", "sell"),
    play("201", "Sell cash-secured put", "Get paid to buy lower.", "option", "sell", "put"),
    play("202", "Sell covered call", "Get paid to cap your upside.", "option", "sell", "call"),
    play("301", "Buy long put", "A defined-risk bet down.", "option", "buy", "put"),
    play("302", "Buy long call", "A defined-risk bet up.", "option", "buy", "call"),
  ],
};
const settings = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "human-joe", name: "Uncle Joe", kind: "human", hostConfigured: false, profile: null },
  ],
};
const desk = {
  generatedAt: "2026-09-02T00:00:00Z",
  desk: {
    id: "human-joe",
    name: "Uncle Joe",
    kind: "human",
    positions: [],
    tiles: {
      openPositions: 0,
      invested: "$0.00",
      dayPl: "$0.00",
      dayTone: "flat",
      unrealized: "$0.00",
      unrealizedNote: "no positions",
      unrealizedTone: "flat",
      cash: "$1,000,000.00",
    },
  },
};
const course = (level, title, done, total) => ({
  level,
  title,
  subtitle: "",
  locked: level !== 100,
  done,
  total,
  milestones: [],
});
const learn = {
  linked: true,
  points: 0,
  totalPoints: 200,
  rank: "Observer",
  gate,
  courses: [
    course(100, "Stock basics — own it, book it", 0, 2),
    course(200, "The Wheel — get paid to own good stocks", 0, 2),
    course(300, "Directional options — buying calls & puts", 0, 2),
  ],
  celebrating: [],
  engagementCelebrating: [],
  pendingChecks: 0,
};
const onboarding = {
  linked: true,
  milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
  steps: [],
  done: 1,
  total: 3,
  points: 10,
  totalPoints: 30,
  complete: false,
};
const playbooks = {
  linked: true,
  milestone: { id: "playbooks", code: "M·03", title: "Playbooks", desc: "" },
  arming: "season-1",
  unlocked: 0,
  total: 4,
  playbooks: [],
};

const { page, origin, shoot, close } = await openShell({
  name: "ladder-gate",
  stubs: {
    "/api/trade/plays": plays,
    "/api/settings": settings,
    "/api/desk/*": desk,
    "/api/learn": learn,
    "/api/onboarding": onboarding,
    "/api/playbooks": playbooks,
  },
});

await page.goto(`${origin}/app/trade`);
await page.getByText("The ladder is waiting on you").waitFor();
await shoot("desk-gated");
await page.goto(`${origin}/app/learn`);
await page.getByText("Your account's milestones").waitFor();
await shoot("toc-gated");
await close();
