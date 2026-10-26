// Visual harness for The Council section on /app/activity (issue #2224 shape 1; replies under each
// line, #5097) — from the REAL built shell (app/dist) over stub APIs: the composer, this week's
// lines, and one line's reply thread open (another member, the viewer, and the line's own writer
// answering an earlier version of it). PHONE FIRST: 390, then 1280. JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:council [outdir]
import { openShell } from "./shell.mjs";

const wire = {
  wire: {
    trades: [],
    pnl: [],
    feedbackEnabled: true,
    feedback: [],
  },
};

const mine = {
  id: "a1b2c3d4e5",
  text: "NVDA grinds up into the print — my bot sells premium above $200 and lets the calls ride.",
  at: "2026-10-05T10:00:00.000Z",
  playbookId: "S1-NVDA",
};

const council = {
  enabled: true,
  week: "2026-W41",
  entries: [
    mine,
    {
      id: "f6a7b8c9d0",
      text: "GOOG chops all week; my bot sits on its hands until the ruling.",
      at: "2026-10-05T09:00:00.000Z",
      playbookId: "G1-GOOG",
    },
    {
      id: "0e1f2a3b4c",
      text: "Fading the AAPL event pop — implied move is rich versus the last four prints.",
      at: "2026-10-05T08:00:00.000Z",
    },
  ],
  mine,
  plays: [
    { id: "S1-NVDA", symbol: "NVDA" },
    { id: "G1-GOOG", symbol: "GOOG" },
  ],
};

const replies = {
  enabled: true,
  week: "2026-W41",
  replies: {
    a1b2c3d4e5: [
      {
        id: "r0",
        text: "Above $200 is a lot of room. What's the stop if it gaps down?",
        at: "2026-10-06T08:00:00.000Z",
        mine: false,
        byLineAuthor: false,
        earlierLine: false,
      },
    ],
    f6a7b8c9d0: [
      {
        id: "r1",
        text: "The ruling isn't until November — sitting out costs you the whole earnings run.",
        at: "2026-10-06T10:00:00.000Z",
        mine: false,
        byLineAuthor: false,
        earlierLine: true,
      },
      {
        id: "r2",
        text: "Disagree: the chop IS the trade. Sell a strangle, don't sit in cash.",
        at: "2026-10-07T10:00:00.000Z",
        mine: true,
        byLineAuthor: false,
        earlierLine: false,
      },
      {
        id: "r3",
        text: "Fair — selling the strangle small, the rest stays in cash until the ruling.",
        at: "2026-10-07T12:00:00.000Z",
        mine: false,
        byLineAuthor: true,
        earlierLine: false,
      },
    ],
  },
};

const { page, origin, shoot, close } = await openShell({
  name: "council",
  stubs: {
    "/api/wire": wire,
    "/api/council": council,
    "/api/council/replies": replies,
  },
});

for (const [width, height, suffix] of [
  [390, 844, "phone"],
  [1280, 900, "desktop"],
]) {
  await page.setViewportSize({ width, height });
  await page.goto(`${origin}/app/activity?section=council`);
  await page.getByRole("heading", { name: "The Council" }).waitFor();
  const toggle = page.getByRole("button", { name: /3 replies/ });
  await toggle.click();
  await page.getByText("Answered an earlier version of this line.").waitFor();
  // Bring the open thread up under the line it answers — the frame is about the argument.
  await page.getByText(/GOOG chops all week/).evaluate((el) => {
    el.scrollIntoView({ block: "start" });
    window.scrollBy(0, -16);
  });
  await page.waitForTimeout(250);
  await shoot(`council-replies-${suffix}`);
}

await close();
