// Visual harness for the calendar of what you hold (#5074; #5037 round 2, the calendar's R2): the
// Profile page's Events section, phone first, over the round-2 study's book on Thu Oct 8, 2026 —
// Sauron holding NVDA 130 shares, CRWV 55 shares and one CRWV $80 put sold for Nov 6 — so each
// built frame sits beside the drawn one it answers. The rest of the page is the accounts shoot's
// own fixture (`accounts-fixture.mjs`); only Sauron's book and the calendar are the study's.
// Frames: Events on October (the range's month, nothing on the book in it, each lane's next date
// pinned at its edge), the same after one tap on the put's edge (November), the Overview's next-
// date line, and November at 1280.
// Usage: npm run build --prefix app && npx tsx scripts/shoot/events-calendar.mjs [outdir]

import { accountsFixture } from "./accounts-fixture.mjs";
import { openShell } from "./shell.mjs";

const stubs = await accountsFixture();
const sauron = stubs["/api/desk/bot-sauron"];

const row = (symbol, display, isOption, quantity, figures) => ({
  symbol,
  display,
  detail: display,
  isOption,
  quantity,
  costPerShare: figures.cost,
  price: figures.price,
  costBasis: figures.basis,
  value: figures.value,
  dayPl: figures.day,
  dayPct: figures.dayPct,
  dayTone: figures.day.startsWith("-") ? "neg" : "pos",
  totalPl: figures.total,
  totalPlRaw: Number(figures.total.replace(/[^0-9.-]/g, "")),
  returnPct: figures.ret,
  totalTone: figures.total.startsWith("-") ? "neg" : "pos",
  weightPct: figures.weight,
  ...figures.more,
});
// Earnings dates are the repo's own cadence estimates (`earnings-calendar.ts`), said as estimates.
const estimate = (at, label) => ({
  status: "estimate",
  at,
  label: `Earnings ${label} (estimated)`,
});
const PUT = "CRWV261106P00080000";
const book = {
  ...sauron,
  desk: {
    ...sauron.desk,
    positions: [
      row("NVDA", "NVDA", false, "130", {
        cost: "$223.98",
        price: "$232.10",
        basis: "$29,117",
        value: "$30,173",
        day: "+$195",
        dayPct: "+0.65%",
        total: "+$1,056",
        ret: "+3.6%",
        weight: 3.0,
        more: { nextPrint: estimate("2026-11-18", "Nov 18"), breakeven: "$223.98" },
      }),
      row("CRWV", "CRWV", false, "55", {
        cost: "$90.10",
        price: "$82.60",
        basis: "$4,955",
        value: "$4,543",
        day: "-$82",
        dayPct: "-1.8%",
        total: "-$412",
        ret: "-8.3%",
        weight: 0.5,
        more: { nextPrint: estimate("2026-11-10", "Nov 10"), breakeven: "$90.10" },
      }),
      row(PUT, "CRWV Nov 6 $80 Put", true, "-1", {
        cost: "$255.00",
        price: "$5.50",
        basis: "-$255",
        value: "-$550",
        day: "-$60",
        dayPct: "-12%",
        total: "-$295",
        ret: "-116%",
        weight: 0.1,
        more: { expiresInDays: 29, expiresIn: "29 days", breakeven: "$77.45" },
      }),
    ],
    decisions: [
      {
        id: "crwv-put-expiry",
        kind: "at-risk",
        symbol: PUT,
        display: "CRWV Nov 6 $80 Put",
        plainName: "Sold put · keeps the $255 if CRWV stays above $80",
        pl: "-$295 · −116%",
        plTone: "neg",
        title: "Expires Nov 6: keep, roll or buy back",
        captionShort: "Breakeven $77.45 at expiry; CRWV is $82.60.",
        caption: "You collected $255 for this put; buying it back today costs $550.",
        why: "✦ a sold put earns its premium as time passes, and owes the difference if CRWV closes under $80 on Nov 6.",
        clocks: ["Expires in 29 days", "1 contract"],
        primary: {
          label: "Review on Trade ↗",
          href: `/app/trade?desk=bot-sauron&symbol=CRWV&section=orders&manage=${PUT}`,
        },
        stakeRaw: 550,
        range: { type: "put", side: "short", strike: 80, breakeven: 77.45 },
        due: { at: "2026-11-06", reason: "expiry", label: "Expires Nov 6" },
      },
    ],
  },
};
const macro = (id, title, date) => ({
  id,
  title,
  date,
  kind: "macro-print",
  impact: "high",
  symbols: [],
  researched: false,
});
const calendar = {
  ...stubs["/api/research/calendar"],
  events: [
    macro("cpi-2026-10-14", "CPI release (Sep 2026 data)", "2026-10-14"),
    macro("fomc-2026-10-28", "FOMC decision (meeting Oct 27–28)", "2026-10-28"),
    macro("jobs-2026-11-06", "Employment Situation (Oct 2026 data)", "2026-11-06"),
    macro("cpi-2026-11-10", "CPI release (Oct 2026 data)", "2026-11-10"),
  ],
  closures: [
    { date: "2026-11-26", reason: "Thanksgiving", early: false },
    { date: "2026-11-27", reason: "Day after Thanksgiving", early: true },
  ],
};

// A tall phone, so the head and the whole picture share one frame the way the drawn one does.
const { page, origin, shoot, close } = await openShell({
  name: "events-calendar",
  viewport: { width: 390, height: 1040 },
  quality: 55,
  stubs: { ...stubs, "/api/desk/bot-sauron": book, "/api/research/calendar": calendar },
});
// The study's "today": Thu Oct 8, 2026, 3pm ET. Reduced motion, so no frame lands mid-fade.
await page.clock.setFixedTime(new Date("2026-10-08T19:00:00Z"));
await page.emulateMedia({ reducedMotion: "reduce" });

const events = `${origin}/app/accounts?account=bot-sauron&section=events`;
await page.goto(`${events}&span=month`);
await page.getByRole("button", { name: /^Move the range to Fri, Nov 6/ }).waitFor();
await shoot("events-calendar-october-phone");

await page.getByRole("button", { name: /^Move the range to Fri, Nov 6/ }).click();
await page.getByRole("heading", { name: "November 2026" }).waitFor();
await page.evaluate(() => window.scrollTo(0, 0));
await shoot("events-calendar-november-phone");
await page.locator(".agenda-foot").evaluate((el) => el.scrollIntoView({ block: "end" }));
await shoot("events-calendar-november-list-phone");

await page.goto(`${origin}/app/accounts?account=bot-sauron`);
await page.locator(".held-next").waitFor();
await page.locator(".held-next").evaluate((el) => el.scrollIntoView({ block: "center" }));
await shoot("events-calendar-overview-line-phone");

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${events}&span=month&on=2026-11-06`);
await page.getByRole("heading", { name: "November 2026" }).waitFor();
await shoot("events-calendar-november-desktop");

await close();
