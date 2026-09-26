// Visual harness for the Profile page's viewer-level sections (#3807 slice 2b; the milestones
// chapters, #1119) from the REAL built shell over stub APIs: Milestones (the table of contents and
// its three chapters, once /app/learn, /app/onboarding, /app/learn/trading, /app/playbooks) and
// Feedback (once /app/feedback). PHONE FIRST: the zero-account door and Eric's milestones at 390,
// then 1280; the run prints the cockpit head's height per section (the switcher hides, the head
// must not jump). JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:milestones [outdir]
import { openShell } from "./shell.mjs";

const step = (id, title, detail, done) => ({ id, title, detail, points: 10, route: "", done });
const CONNECT_DETAIL =
  "Set up a free Alpaca paper account and link it here in five short steps, detailed below. We read keys only to verify and show your balance — no orders are ever placed on your behalf.";
const HELLO_DETAIL =
  "Moneypenny is our AI agent — your guide for learning the ropes and filing feedback. Send her a message and the trading ladder opens.";
const TRADE_DETAIL =
  "Your account unlocks one rung at a time — buy a stock first, and each real fill opens the next play. No skipping ahead. Orders fill only while the market is open — 9:30 AM to 4:00 PM ET, Monday through Friday.";

const ms = (id, title, points, earned) => ({
  id,
  title,
  detail: "",
  points,
  ...(earned ? { earned } : { ticket: "/app/trade" }),
});
const learn = {
  linked: true,
  points: 50,
  totalPoints: 295,
  rank: "Trader",
  courses: [
    {
      level: 100,
      title: "Stock basics — own it, book it",
      subtitle: "",
      locked: false,
      done: 2,
      total: 2,
      milestones: [
        ms("first-buy", "Buy your first stock", 25, { on: "2026-09-01", orderId: "o1" }),
        ms("first-sell", "Sell your first stock", 25, { on: "2026-09-01", orderId: "o2" }),
      ],
    },
    {
      level: 200,
      title: "The Wheel — get paid to own good stocks",
      subtitle: "",
      locked: false,
      done: 0,
      total: 2,
      milestones: [
        ms("csp", "Sell your first cash-secured put", 35),
        ms("cc", "Sell your first covered call", 35),
      ],
    },
    {
      level: 300,
      title: "Directional options — buying calls & puts",
      subtitle: "",
      locked: true,
      done: 0,
      total: 2,
      milestones: [],
    },
    {
      level: 400,
      title: "Spreads — defined risk, two legs",
      subtitle: "",
      locked: true,
      done: 0,
      total: 1,
      milestones: [],
    },
    {
      level: 500,
      title: "Zero-DTE — the fastest clock",
      subtitle: "",
      locked: true,
      done: 0,
      total: 1,
      milestones: [],
    },
  ],
  celebrating: [],
  engagementCelebrating: [],
  pendingChecks: 0,
};
const onboarding = {
  linked: true,
  viewerName: "Eric",
  milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
  steps: [
    step("connect", "Connect your Alpaca paper account", CONNECT_DETAIL, true),
    step("first-message", "Say hello to Moneypenny", HELLO_DETAIL, true),
    step("first-trade", "Make your first trade", TRADE_DETAIL, true),
  ],
  done: 3,
  total: 3,
  points: 30,
  totalPoints: 30,
  complete: true,
};
const pb = (
  id,
  glyph,
  title,
  kind,
  detail,
  unlocksAfter,
  unlocksAfterName,
  seasonOneCriteria,
  unlocked,
) => ({
  id,
  glyph,
  title,
  kind,
  detail,
  unlocksAfter,
  unlocksAfterName,
  seasonOneCriteria,
  unlocked,
});
const playbooks = {
  linked: true,
  milestone: { id: "playbooks", code: "M·03", title: "Playbooks", desc: "" },
  arming: "season-1",
  unlocked: 1,
  total: 4,
  playbooks: [
    pb(
      "accumulator",
      "⬒",
      "Blue-chip accumulator",
      "AUTO-DRAFT · BUYS",
      "Drafts a recurring buy of your core holding on a schedule you set, sized to your buying power.",
      "102",
      "Sell stock",
      "buy + sell a stock with a net positive result",
      true,
    ),
    pb(
      "wheel-put",
      "◑",
      "Wheel · put leg",
      "AUTO-DRAFT · CSP",
      "Watches your watchlist for puts at strikes you'd buy, ~30 delta, and drafts the cash-secured ticket.",
      "201",
      "Sell cash-secured put",
      "one cash-secured put filled, premium kept ≥ 1% of secured cash",
      false,
    ),
    pb(
      "wheel-call",
      "◐",
      "Wheel · call leg",
      "AUTO-DRAFT · COVERED CALL",
      "When you hold 100+ shares, drafts a covered call above your cost basis at your target premium.",
      "202",
      "Sell covered call",
      "one covered call filled above cost basis",
      false,
    ),
    pb(
      "hedge",
      "◮",
      "Portfolio hedge",
      "AUTO-DRAFT · LONG PUTS",
      "Drafts a protective put when your portfolio concentration crosses the threshold you set.",
      "302",
      "Buy long call",
      "one long put + one long call filled, ≥ 2% margin on the round trip",
      false,
    ),
  ],
};

// The milestone strip (#3407 slice 5) reads `/api/trade/plays` — the same eight rungs the ladder
// below it draws as cards: 101 earned, 102 open (next up), the rest locked.
const rung = (code, name, kind, side, optionType, state, opensAfter) => ({
  code,
  id: code,
  name,
  tldr: "",
  kind,
  side,
  ...(optionType ? { optionType } : {}),
  gloss: "",
  locked: state === "locked",
  earned: state === "earned",
  ...(opensAfter ? { opensAfter } : {}),
});
const plays = {
  linked: true,
  wheels: true,
  nextUp: "102",
  plays: [
    rung("101", "Buy stock", "stock", "buy", undefined, "earned"),
    rung("102", "Sell stock", "stock", "sell", undefined, "open"),
    rung("201", "Sell a cash-secured put", "option", "sell", "put", "locked", {
      code: "102",
      name: "Sell stock",
    }),
    rung("202", "Sell a covered call", "option", "sell", "call", "locked", {
      code: "201",
      name: "Sell a cash-secured put",
    }),
    rung("301", "Buy a long put", "option", "buy", "put", "locked", {
      code: "202",
      name: "Sell a covered call",
    }),
    rung("302", "Buy a long call", "option", "buy", "call", "locked", {
      code: "301",
      name: "Buy a long put",
    }),
    rung("401", "Vertical spread", "multi-leg", "buy", undefined, "locked", {
      code: "302",
      name: "Buy a long call",
    }),
    rung("501", "Zero-DTE", "option", "sell", "put", "locked", {
      code: "401",
      name: "Vertical spread",
    }),
  ],
};

// A member with no linked account (the zero-account door, #3807 slice 2b): the same Profile page,
// its head saying so, opened on Milestones with the connect guide open. `linked` flips mid-run.
let linked = false;
const eric = { id: "human-eric", name: "Eric", kind: "human", suspended: false };
// The head's condensed net worth rides every section but the Overview — one account's worth.
const ericStats = {
  value: "$1,047,832.14",
  valueKnown: true,
  dayChange: "+$2,418.67",
  dayTone: "pos",
  dayKnown: true,
  cash: "$847,200.00",
  cashKnown: true,
  bookedPl: "+$12,480.00",
  bookedTone: "pos",
  bookedKnown: true,
  onPaper: "+$47,832.14",
  onPaperTone: "pos",
  onPaperKnown: true,
  positionCount: 6,
  windows: [],
};
const networth = {
  generatedAt: "2026-09-26T00:00:00Z",
  accounts: [{ ...eric, ...ericStats, idle: "81% idle", idlePct: 80.9 }],
  total: { ...ericStats, idle: "81% idle", idlePct: 80.9 },
};
const fresh = {
  linked: true,
  viewerName: "Robin",
  milestone: onboarding.milestone,
  steps: [
    step("connect", "Connect your Alpaca paper account", CONNECT_DETAIL, false),
    step("first-message", "Say hello to Moneypenny", HELLO_DETAIL, false),
    step("first-trade", "Make your first trade", TRADE_DETAIL, false),
  ],
  done: 0,
  total: 3,
  points: 0,
  totalPoints: 30,
  complete: false,
};

const { page, origin, shoot, close } = await openShell({
  name: "milestones",
  stubs: {
    "/api/learn": () => (linked ? learn : { ...learn, points: 0, rank: "Observer" }),
    "/api/onboarding": () => (linked ? onboarding : fresh),
    "/api/playbooks": playbooks,
    "/api/trade/plays": plays,
    "/api/join": { wired: true, canAddBots: false, classes: [], timezones: [] },
    "/api/feedback": {
      enabled: true,
      followupEnabled: false,
      feedbackCount: 0,
      celebrating: [],
      recent: [],
    },
    "/api/settings": () => ({ accounts: linked ? [eric] : [] }),
    "/api/accounts/networth": networth,
    "/api/desk/human-eric/activity": { available: true, activity: [] },
  },
});

// Both pictures of a section are ≤100KB phone frames first (docs/PICTURES.md), then 1280.
const frames = [
  ["door", false, "/app/accounts?section=milestones&chapter=onboarding", "Welcome to the league"],
  ["eric", true, "/app/accounts?section=milestones&chapter=onboarding", "Welcome to the league"],
];
for (const [width, suffix] of [
  [390, "phone"],
  [1280, "desktop"],
]) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  for (const [tag, isLinked, path, ready] of frames) {
    linked = isLinked;
    await page.goto(`${origin}${path}`);
    await page.getByRole("heading", { name: new RegExp(ready) }).waitFor();
    await page.waitForTimeout(250);
    await shoot(`milestones-${tag}-${suffix}`);
    // The same arrival before the chapter's anchor scroll: the head's first row and the cards.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    await shoot(`milestones-${tag}-top-${suffix}`);
  }
  // The head's height with a viewer-level section open vs. the switcher — the same, by design.
  linked = true;
  const head = async (path) => {
    await page.goto(`${origin}${path}`);
    await page.locator(".cockpit-nav").waitFor();
    await page.waitForTimeout(250);
    return page.evaluate(() =>
      Math.round(document.querySelector(".cockpit-head")?.getBoundingClientRect().height ?? 0),
    );
  };
  console.log(
    `cockpit head at ${width}: switcher ${await head("/app/accounts?section=activity")}px · ` +
      `milestones ${await head("/app/accounts?section=milestones")}px · ` +
      `feedback ${await head("/app/accounts?section=feedback")}px`,
  );
}

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${origin}/app/accounts?section=milestones`);
await page.getByText("Your milestones", { exact: true }).waitFor();
await shoot("milestones-toc");
await page.goto(`${origin}/app/accounts?section=milestones&chapter=playbooks`);
await page.getByText("Prove the play by hand, then arm it").waitFor();
await shoot("playbooks");
await page.goto(`${origin}/app/accounts?section=milestones&chapter=trading`);
await page.getByText("One fill unlocks the next rung").waitFor();
await page.getByText("Milestone · Trading ladder").waitFor();
await shoot("trading-ladder");
await page.goto(`${origin}/app/accounts?section=feedback`);
await page.getByRole("button", { name: "✦ Talk to Moneypenny" }).waitFor();
await shoot("feedback-section");
await close();
