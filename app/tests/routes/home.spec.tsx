import { describe, expect, it } from "@rstest/core";
import { APPS } from "../../src/routes/index";
import { forwardCampaignPath, isCampaignAddress } from "../../src/shell/campaign-forward";
import { countWords, needsRows } from "../../src/shell/needs-you";

// The home screen (#8189): what "Needs you" shows, the tiles, and the forward that keeps every old
// Campaign address landing on `/campaign`.

describe("Needs you (criterion 5)", () => {
  it("leads with the connect step when the member has no paper account", () => {
    const rows = needsRows({ hasAccount: false, reviews: 0, bestQuest: undefined });
    expect(rows.map((r) => r.title)).toEqual(["Connect your paper account"]);
    expect(rows[0]?.to).toBe("/accounts");
  });

  it("gives the review count in words, then the best quest on Campaign's Quests window", () => {
    const rows = needsRows({
      hasAccount: true,
      reviews: 2,
      bestQuest: "Sell a covered call on AAPL",
    });
    expect(rows.map((r) => r.title)).toEqual([
      "Two positions to review",
      "Sell a covered call on AAPL",
    ]);
    expect(rows[1]).toMatchObject({ to: "/campaign", search: { w: "quests" } });
  });

  it("shows no row while nothing applies, and never more than three", () => {
    expect(needsRows({ hasAccount: true, reviews: 0, bestQuest: undefined })).toEqual([]);
    expect(needsRows({ hasAccount: undefined, reviews: 0, bestQuest: undefined })).toEqual([]);
    expect(
      needsRows({ hasAccount: false, reviews: 4, bestQuest: "Buy a call" }).length,
    ).toBeLessThanOrEqual(3);
  });

  it("says small counts in words and large ones in figures", () => {
    expect(countWords(1, "position")).toBe("one position");
    expect(countWords(12, "position")).toBe("12 positions");
  });
});

describe("the tiles (criterion 1)", () => {
  it("names the apps in the topbar's order, then Bots, each with a glyph and one plain line", () => {
    expect(APPS.map((a) => a.name)).toEqual([
      "Campaign",
      "Profile",
      "Trade",
      "Activity",
      "R&D",
      "Bots",
    ]);
    for (const a of APPS) {
      expect(a.glyph.length).toBeGreaterThan(0);
      expect(a.line.length).toBeGreaterThan(8);
    }
  });
});

describe("the Bots tile (#8254 criterion 9)", () => {
  it("opens the bots screen with its glyph and one plain line", () => {
    expect(APPS.find((a) => a.name === "Bots")).toMatchObject({
      to: "/bots",
      line: "Watch the house bots and why they skipped",
    });
  });
});

describe("old Campaign addresses keep landing (criteria 8, 9)", () => {
  it("forwards a window, a pivot and her row links with their search and hash", () => {
    expect(forwardCampaignPath("/?w=market")).toBe("/campaign?w=market");
    expect(forwardCampaignPath("/?show=story-x#calendar")).toBe("/campaign?show=story-x#calendar");
    expect(forwardCampaignPath("/#story-ai-capex")).toBe("/campaign#story-ai-capex");
    expect(forwardCampaignPath("/#event-2026-11-18-cpi")).toBe("/campaign#event-2026-11-18-cpi");
    expect(forwardCampaignPath("/#calendar")).toBe("/campaign#calendar");
  });

  it("leaves home and every other place alone", () => {
    expect(forwardCampaignPath("/")).toBe("/");
    expect(forwardCampaignPath("/#main")).toBe("/#main");
    expect(forwardCampaignPath("/accounts#pos-NVDA")).toBe("/accounts#pos-NVDA");
    expect(forwardCampaignPath("/trade?w=x")).toBe("/trade?w=x");
    expect(isCampaignAddress("?by=return", "")).toBe(false);
  });
});
