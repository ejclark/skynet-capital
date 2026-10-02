// Visual harness for comments on another member's filing (issue #2224 shape 3) — Activity's
// filings, from the REAL built shell over stub APIs: someone else's filing with its thread
// open (a comment from the viewer, one from another member, the compose box and the "stays in the
// app" line), and the viewer's own filing pointing at Follow up. PHONE FIRST: 390, then 1280.
// JPEG ≤100KB.
// Usage: npm run build --prefix app && npm run shoot:filing-comments [outdir]
import { openShell } from "./shell.mjs";

const issue = (n) => `https://github.com/ejclark/skynet-capital/issues/${n}`;
const wire = {
  trades: [],
  pnl: [],
  feedbackEnabled: true,
  feedback: [
    {
      issueNumber: 4101,
      icon: "✨",
      kindLabel: "Feature",
      title: "Show implied move on the earnings badge",
      url: issue(4101),
      status: "In the queue",
      statusKey: "open",
      meta: "#4101 · 9/29/2026",
      at: "2026-09-29T12:00:00.000Z",
    },
    {
      issueNumber: 4088,
      icon: "🐞",
      kindLabel: "Bug",
      title: "Chain scroll jumps when a quote ticks",
      url: issue(4088),
      status: "next slice",
      statusKey: "next-slice",
      meta: "#4088 · 9/28/2026",
      at: "2026-09-28T12:00:00.000Z",
    },
  ],
};
const comments = {
  enabled: true,
  ownFilings: [4088],
  comments: {
    4101: [
      {
        id: "c1",
        text: "Yes — I check the straddle price by hand every print. Having it on the badge would save a trip to the chain.",
        at: "2026-09-29T14:02:00Z",
        mine: false,
      },
      {
        id: "c2",
        text: "Same. Bonus if it shows last quarter's actual move next to it.",
        at: "2026-09-30T09:15:00Z",
        mine: true,
      },
    ],
    4088: [{ id: "c3", text: "Seeing this on NVDA too.", at: "2026-09-29T18:40:00Z", mine: false }],
  },
};

const { page, origin, shoot, close } = await openShell({
  name: "filing-comments",
  stubs: { "/api/wire": { wire }, "/api/feedback/comments": comments },
});

for (const [width, suffix] of [
  [390, "phone"],
  [1280, "desktop"],
]) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  // Filings are a KIND of Activity's one feed since #784 slice 3, not a section — so the harness
  // asks for them the way a member does, with the chip's own query token.
  await page.goto(`${origin}/app/activity?q=is%3Afeedback`);
  await page.getByRole("link", { name: /implied move/ }).waitFor();
  await page.getByRole("button", { name: /2 comments/ }).click();
  await page.getByRole("button", { name: /1 comment/ }).click();
  await page.waitForTimeout(250);
  await shoot(`filing-comments-${suffix}`);
}
await close();
