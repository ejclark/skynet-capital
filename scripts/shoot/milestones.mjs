// Visual harness for the milestones chapters (#1119) from the REAL built shell over stub APIs:
// /app/learn (the table of contents) and /app/playbooks (M·03, WIP). JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:milestones [outdir]
import { openShell } from "./shell.mjs";

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
  milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
  steps: [],
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

const { page, origin, shoot, close } = await openShell({
  name: "milestones",
  stubs: { "/api/learn": learn, "/api/onboarding": onboarding, "/api/playbooks": playbooks },
});

await page.goto(`${origin}/app/learn`);
await page.getByText("Your account's milestones").waitFor();
await shoot("milestones-toc");
await page.goto(`${origin}/app/playbooks`);
await page.getByText("Prove the play by hand, then arm it").waitFor();
await shoot("playbooks");
await page.goto(`${origin}/app/learn/trading`);
await page.getByText("One fill unlocks the next rung").waitFor();
await shoot("trading-ladder");
await close();
