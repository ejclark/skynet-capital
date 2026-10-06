// Visual harness for the level-up ceremony (#469): the real built shell over stub APIs, a member
// whose covered-call fill just finished Course 200. The run clicks Claim, the stubbed claim answers
// with the server's `graduated` cue, and the takeover opens. PHONE FIRST (390), then 1280.
// JPEG ≤100KB.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/level-up.mjs [outdir]
import { playbooks, plays } from "./milestones-fixture.mjs";
import { openShell } from "./shell.mjs";

const ms = (id, title, points, on) => ({
  id,
  title,
  detail: "",
  points,
  ...(on ? { earned: { on, orderId: id } } : { ticket: "/app/trade" }),
});
const course = (level, title, locked, milestones) => ({
  level,
  title,
  subtitle: "",
  locked,
  done: milestones.filter((m) => m.earned).length,
  total: milestones.length,
  milestones,
});
let claimed = false;
const learn = () => ({
  linked: true,
  points: 120,
  totalPoints: 295,
  rank: "Trader",
  courses: [
    course("100", "Stock basics — own it, book it", false, [
      ms("first-buy", "Buy your first stock", 25, "Sep 01"),
      ms("first-sell", "Sell your first stock", 25, "Sep 02"),
    ]),
    course(200, "The Wheel — get paid to own good stocks", false, [
      ms("first-cash-secured-put", "Sell your first cash-secured put", 35, "Sep 22"),
      ms("first-covered-call", "Sell your first covered call", 35, "Sep 30"),
    ]),
    course(300, "Directional options — buying calls & puts", !claimed, []),
    course(400, "Spreads — defined risk, two legs", true, []),
    course(500, "Zero-DTE — the fastest clock", true, []),
  ].map((c) => ({ ...c, level: Number(c.level) })),
  celebrating: claimed
    ? []
    : [
        {
          milestoneId: "first-covered-call",
          code: "202",
          name: "Covered call",
          opened: { code: "301", name: "Long put" },
        },
      ],
  engagementCelebrating: [],
  pendingChecks: 0,
});
const eric = { id: "human-eric", name: "Eric", kind: "human", suspended: false };
// The desktop head reads one account's condensed net worth; an empty payload crashes it.
const stats = {
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
  generatedAt: "2026-09-30T00:00:00Z",
  accounts: [{ ...eric, ...stats, idle: "81% idle", idlePct: 80.9 }],
  total: { ...stats, idle: "81% idle", idlePct: 80.9 },
};

const { page, origin, shoot, close } = await openShell({
  name: "level-up",
  stubs: {
    "/api/learn": learn,
    "/api/learn/claim": () => {
      claimed = true;
      return {
        ok: true,
        graduated: [
          {
            id: "graduated:human-eric:200",
            level: 200,
            title: "The Wheel — get paid to own good stocks",
            opens: { level: 300, title: "Directional options — buying calls & puts" },
          },
        ],
      };
    },
    "/api/onboarding": { linked: true, steps: [], done: 3, total: 3, points: 30, totalPoints: 30 },
    "/api/playbooks": playbooks,
    "/api/trade/plays": plays,
    "/api/settings": { accounts: [eric] },
    "/api/accounts/networth": networth,
    "/api/join": { wired: true, canAddBots: false, classes: [], timezones: [] },
    "/api/feedback": {
      enabled: true,
      followupEnabled: false,
      feedbackCount: 0,
      celebrating: [],
      recent: [],
    },
    "/api/desk/human-eric/activity": { available: true, activity: [] },
    // The profile's tower column reads `desk.error` off the one desk (#4143); `{}` crashes it.
    "/api/desk/human-eric": { desk: { error: "not stubbed" } },
  },
});

for (const [width, suffix] of [
  [390, "phone"],
  [1280, "desktop"],
]) {
  claimed = false;
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.goto(`${origin}/app/accounts?section=milestones`);
  await page.evaluate(() => window.localStorage.clear());
  await page.getByRole("button", { name: "Claim 🎉" }).click();
  await page.getByRole("dialog", { name: /Course 200/ }).waitFor();
  await page.waitForTimeout(1200); // the stamp and the rise settle
  await shoot(`level-up-${suffix}`);
}
await close();
