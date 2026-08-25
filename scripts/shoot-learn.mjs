import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Visual harness for the Milestones page (/learn) and the /feedback counter — the two surfaces
// #567 changed, judged by eye (CLAUDE.md's fridge rule) without a server, a session, or a GitHub
// token. Everything is the REAL renderer over hand-built progression, so a frame here is exactly
// what a member sees; nothing is mocked but the ledgers.
// Usage: node scripts/shoot-learn.mjs [outdir]
import { chromium } from "playwright-core";
import { renderFeedbackFormBody } from "../src/observatory/feedback-view.ts";
import { renderAcademyBody } from "../src/observatory/render-dashboard.ts";
import { shellDocument } from "../src/server/page-shell.ts";

const OUT = process.argv[2] || join(tmpdir(), "skynet-learn-shots");
mkdirSync(OUT, { recursive: true });
const EXE = [
  process.env.PW_CHROME,
  "/opt/pw-browsers/chromium/chrome-linux/chrome",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
]
  .filter(Boolean)
  .find((p) => existsSync(p));

const NAV = { active: "learn", canAdd: false, authed: true };
const FIRST_BUY = {
  milestoneId: "first-buy",
  code: "101",
  orderId: "order-9f3c",
  at: "2026-08-24T14:30:00.000Z",
};
const FEEDBACK_EARN = {
  milestoneId: "first-feedback",
  issueNumber: 567,
  at: "2026-08-25T16:12:00.000Z",
};

// BEFORE: the ladder alone — one filled buy, no community track.
const before = renderAcademyBody({
  nav: NAV,
  progress: {
    earned: [FIRST_BUY],
    points: 25,
    rank: { title: "Apprentice", atPoints: 25 },
    unlockedLevels: new Set([100]),
  },
});

// AFTER: the same member, having just filed feedback — the community card, its issue-number
// proof, and the fanfare banner waiting to be claimed.
const after = renderAcademyBody({
  nav: NAV,
  progress: {
    earned: [FIRST_BUY],
    points: 40,
    rank: { title: "Apprentice", atPoints: 25 },
    unlockedLevels: new Set([100]),
    contributions: [FEEDBACK_EARN],
    celebratingContributions: [FEEDBACK_EARN],
  },
});

const entry = (n, kind, title, filedAt) => ({
  uuid: `u-${n}`,
  opaqueMemberId: "3f9a1c7b2d",
  issueNumber: n,
  url: `https://github.com/skynet/skynet-capital/issues/${n}`,
  kind,
  title,
  filedAt,
});
const feedback = renderFeedbackFormBody({
  nav: { active: "feedback", canAdd: false, authed: true },
  enabled: true,
  coachEnabled: false,
  recent: [
    entry(567, "feature", "Give filing feedback a milestone", "2026-08-25T16:12:00.000Z"),
    entry(541, "bug", "Leaderboard shows my return as 0.00%", "2026-08-22T09:04:00.000Z"),
    entry(509, "idea", "A weekly recap email for the league", "2026-08-19T18:40:00.000Z"),
  ],
});

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const ctx = await browser.newContext({ viewport: { width: 1180, height: 2000 } });
const tab = await ctx.newPage();

const shot = async (name, body, selector, prep) => {
  await tab.route("**/shot", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: shellDocument("Skynet Capital", body),
    }),
  );
  await tab.goto("http://skynet.local/shot", { waitUntil: "load" });
  if (prep) await prep();
  const path = join(OUT, `${name}.jpg`);
  await tab.locator(selector).screenshot({ path, quality: 62, type: "jpeg" });
  await tab.unroute("**/shot");
  console.log(`· ${path}`);
};

// A complete course collapses by design, so the earned community card is opened for the frame —
// the only thing staged here; the copy and the proof line are the real render.
const openCommunity = () =>
  tab.evaluate(() => document.querySelector('[data-course="community"]')?.setAttribute("open", ""));

await shot("learn-before", before, ".academy");
await shot("learn-after", after, ".academy", openCommunity);
await shot("community-card", after, '[data-course="community"]', openCommunity);
await shot("feedback-count", feedback, ".fdbk-recent");

await browser.close();
console.log(`✓ shots in ${OUT}`);
