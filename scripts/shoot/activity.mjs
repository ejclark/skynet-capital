// Visual harness for /app/activity (#1740) — the rail's section switch over the league's pulse,
// from the REAL built shell over stub APIs. PHONE FIRST (docs/PICTURES.md → "Trading surfaces shoot
// the phone frame first"): the 390px frames prove that Booked P&L is one tap away rather than a
// scroll below 60 trade rows, and the desktop frame proves the same choice adds room instead of a
// new concept. JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:activity [outdir]
import { openShell } from "./shell.mjs";

const NAMES = [
  ["Sauron", "sauron", "bot"],
  ["Eric", "eric", "human"],
  ["Vol Harvester", "vol-harvester", "bot"],
  ["Tony", "tony", "human"],
  ["News Fader", "news-fader", "bot"],
];
const SYMBOLS = ["NVDA", "AAPL", "SPY", "MSFT", "TSLA", "AMD", "KO", "JNJ"];

// A full feed — the point of the change is that a long list no longer buries what sits beside it.
const trades = Array.from({ length: 34 }, (_, i) => {
  const [who, whoId, kind] = NAMES[i % NAMES.length];
  return {
    key: `t${i}`,
    side: i % 3 === 0 ? "sell" : "buy",
    symbol: SYMBOLS[i % SYMBOLS.length],
    quantity: 5 + (i % 7) * 5,
    price: `$${(120 + i * 3.15).toFixed(2)}`,
    who,
    whoId,
    kind,
    reconstructed: i % 9 === 0,
    when: `${9 + Math.floor(i / 6)}:${String((i * 7) % 60).padStart(2, "0")}`,
  };
});

const wire = {
  trades,
  pnl: [
    { who: "Sauron", whoId: "sauron", kind: "bot", realized: "+$1,248.30", tone: "pos" },
    { who: "Eric", whoId: "eric", kind: "human", realized: "+$402.15", tone: "pos" },
    { who: "Vol Harvester", whoId: "vol-harvester", kind: "bot", realized: "-$88.40", tone: "neg" },
    { who: "Tony", whoId: "tony", kind: "human", realized: "$0.00", tone: "flat" },
  ],
  feedbackEnabled: true,
  feedback: [
    {
      icon: "💡",
      title: "Tabs as an organic boundary for a page's information",
      url: "https://github.com/ejclark/skynet-capital/issues/1740",
      status: "next slice",
      statusKey: "next-slice",
      meta: "opened today",
    },
    {
      icon: "🐛",
      title: "The activity route still says 'wire'",
      url: "https://github.com/ejclark/skynet-capital/issues/1739",
      status: "shipped",
      statusKey: "shipped",
      meta: "closed today",
    },
    {
      icon: "💡",
      title: "Show each call row's assessment date",
      url: "https://github.com/ejclark/skynet-capital/issues/1742",
      status: "shipped",
      statusKey: "shipped",
      meta: "closed today",
    },
  ],
};

const { page, origin, shoot, close } = await openShell({
  name: "activity",
  viewport: { width: 390, height: 844 },
  // `/api/wire` answers `{ wire }`, exactly as the real handler does — the shell unwraps it.
  stubs: { "/api/wire": { wire } },
});

// 1. The phone's default section: the feed, with its own filter bar and the section switch above
//    it in the rail's horizontal row.
await page.goto(`${origin}/app/activity`);
await page.getByRole("heading", { name: "Trading activity" }).waitFor();
await shoot("activity-feed-phone");

// 2. One tap — not a scroll past 34 rows. This is the defect the section switch fixes.
await page.getByRole("button", { name: "Booked P&L" }).click();
await page.getByRole("heading", { name: "Booked P&L" }).waitFor();
await shoot("activity-pnl-phone");

// 3. The URL carries the section, so a link lands on the same one.
console.log(`shoot/activity: url after the tap → ${new URL(page.url()).search}`);

// 4. Desktop: the same choice promotes P&L to the primary column and keeps the rest beside it —
//    room added, no new concept.
await page.setViewportSize({ width: 1280, height: 900 });
await shoot("activity-pnl-desktop");

await page.goto(`${origin}/app/activity`);
await page.getByRole("heading", { name: "Trading activity" }).waitFor();
await shoot("activity-feed-desktop");

await close();
