// Visual harness for /app/activity (#1740; rebuilt for #784 slice 3) — ONE feed of four kinds, with
// booked P&L as a strip above it, from the REAL built shell over stub APIs. PHONE FIRST
// (docs/PICTURES.md → "Trading surfaces shoot the phone frame first"): the 390px frames prove that
// the ranking is on screen without a tap and that a filing and a fill read as sibling rows, and the
// desktop frame proves the same choice adds room instead of a new concept. JPEG ≤100KB.
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

// A full feed — the point of the change is that a long list no longer needs a widget beside it.
// `at` walks back from the close in 9-minute steps and `when` is derived FROM it, so the two agree:
// a frame where the displayed clock disagrees with the sort order would read as a bug in the shot.
// The filings below are dated into the same run rather than after it — a mixed feed that happened to
// sort into two clumps would prove nothing about the mixing.
const CLOSE = Date.parse("2026-10-01T20:00:00.000Z");
const et = (ms) =>
  new Date(ms).toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  });

const trades = Array.from({ length: 34 }, (_, i) => {
  const [who, whoId, kind] = NAMES[i % NAMES.length];
  const ms = CLOSE - (i + 1) * 9 * 60_000;
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
    when: et(ms),
    at: new Date(ms).toISOString(),
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
      issueNumber: 1740,
      icon: "🗺️",
      kindLabel: "Idea",
      title: "Tabs as an organic boundary for a page's information",
      url: "https://github.com/ejclark/skynet-capital/issues/1740",
      status: "next slice",
      statusKey: "next-slice",
      meta: "#1740 · 10/1/2026",
      at: "2026-10-01T19:46:00.000Z",
    },
    {
      issueNumber: 1739,
      icon: "🐞",
      kindLabel: "Bug",
      title: "The activity route still says 'wire'",
      url: "https://github.com/ejclark/skynet-capital/issues/1739",
      status: "In the queue",
      statusKey: "open",
      meta: "#1739 · 10/1/2026",
      at: "2026-10-01T19:20:00.000Z",
    },
    {
      issueNumber: 1742,
      icon: "✨",
      kindLabel: "Feature",
      title: "Show each call row's assessment date",
      url: "https://github.com/ejclark/skynet-capital/issues/1742",
      status: "Shipped",
      statusKey: "shipped",
      meta: "#1742 · 9/30/2026",
      at: "2026-09-30T16:20:00.000Z",
    },
  ],
  // The third kind (#784 slice 4). Dated INTO the same run as the fills and filings above, not after
  // it — a frame where the merges clump at the top would prove nothing about the interleaving, which
  // is the whole claim of the slice.
  developmentEnabled: true,
  development: [
    {
      pullRequest: 4463,
      icon: "🚀",
      kindLabel: "Merged",
      title: "feat(activity): one filterable feed with kind facets, booked P&L as a strip",
      url: "https://github.com/ejclark/skynet-capital/pull/4463",
      author: "claude",
      meta: "#4463 · 10/1/2026",
      at: "2026-10-01T19:48:00.000Z",
    },
    {
      pullRequest: 4446,
      icon: "🚀",
      kindLabel: "Merged",
      title: "feat(activity): feedback as a kind on the event bus",
      url: "https://github.com/ejclark/skynet-capital/pull/4446",
      author: "claude",
      meta: "#4446 · 10/1/2026",
      at: "2026-10-01T18:05:00.000Z",
    },
    {
      pullRequest: 4441,
      icon: "🚀",
      kindLabel: "Merged",
      title: "feat(activity): trade feed reads the event schema",
      url: "https://github.com/ejclark/skynet-capital/pull/4441",
      // No author: GitHub does not always name one, and the row has to read correctly without it.
      meta: "#4441 · 9/30/2026",
      at: "2026-09-30T17:40:00.000Z",
    },
  ],
  // The fourth kind (#784 slice 5). Dated into the same run for the same reason, and one of them an
  // outcome milestone with no points, so the frame shows the row reads right without them.
  milestonesEnabled: true,
  milestones: [
    {
      key: "eric:first-covered-call",
      icon: "🏅",
      kindLabel: "Earned",
      who: "Eric",
      whoId: "eric",
      title: "Sell your first covered call",
      points: 35,
      meta: "+35 pts · 10/1/2026",
      at: "2026-10-01T19:52:00.000Z",
    },
    {
      key: "tony:first-realized-profit",
      icon: "🏅",
      kindLabel: "Earned",
      who: "Tony",
      whoId: "tony",
      title: "Book your first profit",
      meta: "10/1/2026",
      at: "2026-10-01T19:31:00.000Z",
    },
    {
      key: "tony:first-buy",
      icon: "🏅",
      kindLabel: "Earned",
      who: "Tony",
      whoId: "tony",
      title: "Buy your first stock",
      points: 25,
      meta: "+25 pts · 10/1/2026",
      at: "2026-10-01T17:10:00.000Z",
    },
  ],
};

const { page, origin, shoot, close } = await openShell({
  name: "activity",
  viewport: { width: 390, height: 844 },
  // `/api/wire` answers `{ wire }`, exactly as the real handler does — the shell unwraps it.
  stubs: { "/api/wire": { wire } },
});

// 1. The phone's default view: the P&L strip on screen with no tap, then one feed whose rows are
//    fills and filings interleaved — each row's left edge saying which it is.
await page.goto(`${origin}/app/activity`);
await page.getByRole("heading", { name: "Everything, newest first" }).waitFor();
await shoot("activity-feed-phone");

// 2. The kind facet: one chip narrows the same list instead of paging to another widget.
await page.getByRole("button", { name: "Ideas", exact: true }).click();
await page.getByRole("link", { name: /activity route still says/ }).waitFor();
await shoot("activity-ideas-phone");

// 2b. The third kind (#784 slice 4): the same chip row, one more chip, and the list narrows to merged
//     pull requests. No section, no widget beside the feed — which is the claim the frame proves.
await page.goto(`${origin}/app/activity`);
await page.getByRole("heading", { name: "Everything, newest first" }).waitFor();
await page.getByRole("button", { name: "Builds", exact: true }).click();
await page.getByRole("link", { name: /one filterable feed/ }).waitFor();
await shoot("activity-builds-phone");

// 2c. The fourth kind (#784 slice 5): one more chip, and the list narrows to members' earned
//     milestones — the one row on the feed that celebrates, with the word carrying the meaning.
await page.goto(`${origin}/app/activity`);
await page.getByRole("heading", { name: "Everything, newest first" }).waitFor();
await page.getByRole("button", { name: "Milestones", exact: true }).click();
await page.getByText("Book your first profit").waitFor();
await shoot("activity-milestones-phone");

await page.goto(`${origin}/app/activity`);
await page.getByRole("heading", { name: "Everything, newest first" }).waitFor();
await page.getByRole("button", { name: "Ideas", exact: true }).click();
await page.getByRole("link", { name: /activity route still says/ }).waitFor();

// 3. "Include shipped" is the pulse's old Active/All separation, now a token on the one query.
await page.getByRole("button", { name: "Include shipped" }).click();
await page.getByRole("link", { name: /assessment date/ }).waitFor();
await shoot("activity-ideas-shipped-phone");
// The filter is URL-stateful on a 300ms debounce (`activity.tsx`), so a link to this exact view is
// shareable — wait past it before reading, or the log prints the pre-debounce URL and says nothing.
await page.waitForFunction(() => window.location.search.includes("show"), undefined, {
  timeout: 2000,
});
console.log(`shoot/activity: url after two chips → ${new URL(page.url()).search}`);

// 4. Desktop: the same rows, more of them, and the strip's cells wrap instead of scrolling — room
//    added, no new concept.
await page.goto(`${origin}/app/activity`);
await page.setViewportSize({ width: 1280, height: 900 });
await page.getByRole("heading", { name: "Everything, newest first" }).waitFor();
await shoot("activity-feed-desktop");

await close();
