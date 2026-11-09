// Visual harness for the landing page (/app/, #7077): the whole market, then the calendar of
// one-line stories and events (round 3, slice 1b), from the REAL built shell over a stub API. The
// edition is the checked-in one, read through the same `editionView` the server answers with, at a
// pinned instant so its dated items are cut the same way every run. Frames:
//   · landing-phone          — 390, the first screen: the question box and all 12 fund rows (Bars)
//   · landing-phone-lines    — 390, the same numbers as Lines, period Month
//   · landing-phone-tiles    — 390, the same numbers as Tiles, period YTD
//   · landing-phone-calendar — 390, the calendar: the week's stories, then the coming days, ◆ marked
//   · landing-phone-story    — 390, the lead story opened from its one line
//   · landing-phone-ask      — 390, the lead story's asks: "Is this a chance to buy?" answered by the
//                              record, and what members asked about its names (#7077 slice 2)
//   · landing-desktop        — 1280, the same page given room, no new concepts
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npm run shoot:landing [outdir]
import { campaignById } from "../../src/domain/campaigns.ts";
import { editions, editionView } from "../../src/domain/edition.ts";
import { openShell } from "./shell.mjs";

const view = editionView(
  editions(),
  new Date("2026-11-08T15:00:00Z"),
  (id) => campaignById(id)?.title,
);

const { page, origin, shoot, close } = await openShell({
  name: "landing",
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  stubs: {
    "/api/edition": view,
    // One question a member asked in the campaign, so the frame shows the list (#6949 slice 6).
    "/api/campaigns/questions": {
      campaign: "ai-buildout",
      questions: [
        {
          kind: "name",
          subject: "NVDA",
          question: "Does NVDA usually bounce after a drop this big before its print?",
          askedBy: ["Ana", "Ben"],
          askedAt: "2026-11-08T14:00:00Z",
          state: "waiting",
          ahead: 2,
          found: [],
          suggestion: false,
        },
      ],
    },
  },
});

const seg = (label, name) =>
  page.getByRole("group", { name: label }).getByRole("button", { name, exact: true });

await page.goto(`${origin}/app/`);
await page.evaluate(() => window.localStorage.removeItem("skynet.landing.sector-look"));
await page.reload();
await page.locator(".sectors-rows--bars").waitFor();
await shoot("landing-phone");

await seg("View", "Lines").click();
await seg("Period", "Month").click();
await shoot("landing-phone-lines");

await seg("View", "Tiles").click();
await seg("Period", "YTD").click();
await shoot("landing-phone-tiles");

await seg("View", "Bars").click();
await seg("Period", "Week").click();
await page.locator(".ecal").scrollIntoViewIfNeeded();
await page.evaluate(() => {
  const top = document.querySelector(".ecal")?.getBoundingClientRect().top ?? 0;
  window.scrollBy(0, top - 100);
});
await shoot("landing-phone-calendar");

const lead = page.locator(".story--lead > .story-row");
await lead.locator(":scope > summary").click();
await page.evaluate(() => {
  const top = document.querySelector(".story--lead")?.getBoundingClientRect().top ?? 0;
  window.scrollBy(0, top - 100);
});
await shoot("landing-phone-story");

await page.locator(".story--lead .story-instinct summary").click();
await page.locator(".story--lead .story-party summary").click();
await page.locator(".story--lead .party-qs").waitFor();
await page.locator(".story--lead .story-ask").scrollIntoViewIfNeeded();
await shoot("landing-phone-ask");

await page.setViewportSize({ width: 1280, height: 900 });
await page.reload();
await page.locator(".sectors-rows--bars").waitFor();
await shoot("landing-desktop");

await close();
