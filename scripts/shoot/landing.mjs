// Visual harness for the landing page (/app/, #7077): the day's market news, key facts first, from
// the REAL built shell over a stub API. The edition is the checked-in one, read through the same
// `editionView` the server answers with, at a pinned instant so its dated items are cut the same
// way every run. Three frames:
//   · landing-phone      — 390, the first screen: masthead, the lead story's key facts, its dates
//   · landing-phone-more — 390, the lead story's "More on this story" opened (progressive disclosure)
//   · landing-phone-ask  — 390, the lead story's asks: "Is this a chance to buy?" answered by the
//                          record, and what members asked about its names (#7077 slice 2)
//   · landing-desktop    — 1280, the same page given room (facts three across), no new concepts
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

await page.goto(`${origin}/app/`);
await page.locator(".story--lead .story-facts").waitFor();
await shoot("landing-phone");

await page.locator(".story--lead > .story-more summary").click();
await page.locator(".story--lead > .story-more .story-lines").waitFor();
await page.locator(".story--lead > .story-more").scrollIntoViewIfNeeded();
await shoot("landing-phone-more");

await page.locator(".story--lead > .story-more summary").click();
await page.locator(".story--lead .story-instinct summary").click();
await page.locator(".story--lead .story-party summary").click();
await page.locator(".story--lead .party-qs").waitFor();
await page.locator(".story--lead .story-ask").scrollIntoViewIfNeeded();
await shoot("landing-phone-ask");

await page.setViewportSize({ width: 1280, height: 900 });
await page.reload();
await page.locator(".story--lead .story-facts").waitFor();
await shoot("landing-desktop");

await close();
