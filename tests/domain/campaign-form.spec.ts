import {
  CAMPAIGN_FORM_CHOICES,
  type CampaignForm,
  campaignFromForm,
  FUND_ROLE,
  formFromCampaign,
  MAX_PICKS,
  MAX_TITLE,
  memberCampaignId,
  PICKS_ROLE,
  parseCampaignForm,
  researchAskFor,
} from "../../src/domain/campaign-form.js";
import { anchorOf, castSymbols, MAX_STORYLINE, parseCampaign } from "../../src/domain/campaigns.js";

/**
 * A member's campaign form (#6949 slice 3a, criterion 7): every choice from a catalog, no free-form
 * logic, and a compiled record that passes the same parser the house campaign files pass.
 */

const FORM: CampaignForm = {
  title: "Energy for AI",
  anchor: { kind: "sector", id: "Energy" },
  symbols: ["xom", " CVX "],
  storyline: "Data centres need power; who keeps the windfall?",
  mode: "explore",
};

const compile = (over: Partial<CampaignForm> = {}) => {
  const form = { ...FORM, ...over };
  return campaignFromForm(form, memberCampaignId(form.title));
};

describe("campaignFromForm", () => {
  it("compiles a sector form into the house record, with the sector's fund added to the cast", () => {
    const made = compile();
    expect(made.ok).toBe(true);
    if (!made.ok) return;
    const c = made.campaign;
    expect(c.id).toBe("energy-for-ai");
    expect(c.sector).toBe("Energy");
    expect(c.market).toBeUndefined();
    expect(c.mode).toBe("explore");
    expect(castSymbols(c)).toEqual(["XOM", "CVX", "XLE"]);
    expect(c.cast.map((r) => r.role)).toEqual([PICKS_ROLE, FUND_ROLE]);
    expect(anchorOf(c)).toEqual({ kind: "sector", name: "Energy", fund: "XLE" });
    expect(c.forces).toEqual([]);
    expect(c.openQuestions).toEqual([]);
    // The authority: the same parser the house files load through accepts it unchanged.
    expect(parseCampaign(c, "spec", c.id)).toEqual(c);
  });

  it("anchors a market through its catalog fund, and needs no picks of its own", () => {
    const made = compile({ title: "Oil", anchor: { kind: "market", id: "oil" }, symbols: [] });
    expect(made.ok).toBe(true);
    if (!made.ok) return;
    expect(made.campaign.market).toBe("oil");
    expect(castSymbols(made.campaign)).toEqual(["USO"]);
  });

  it("does not list the fund twice when the member picked it too", () => {
    const made = compile({ symbols: ["XLE", "XOM"] });
    expect(made.ok && castSymbols(made.campaign)).toEqual(["XOM", "XLE"]);
  });

  it("collapses a storyline or title onto one line", () => {
    const made = compile({ title: "  Energy\nfor AI ", storyline: "Power\n\nis scarce." });
    expect(made.ok && [made.campaign.title, made.campaign.storyline]).toEqual([
      "Energy for AI",
      "Power is scarce.",
    ]);
  });

  it("refuses, one sentence per field, anything outside the catalogs or over a cap", () => {
    const made = compile({
      title: "",
      anchor: { kind: "sector", id: "Crypto" },
      symbols: ["BTC/USD", "NOPE"],
      storyline: "x".repeat(MAX_STORYLINE + 1),
      mode: "yolo" as never,
    });
    expect(made.ok).toBe(false);
    if (made.ok) return;
    expect(made.refusals.map((r) => r.field)).toEqual([
      "title",
      "anchor",
      "symbols",
      "storyline",
      "mode",
    ]);
    expect(made.refusals[2]?.reason).toContain("BTC/USD, NOPE aren't");
  });

  it("caps the title and the number of picks", () => {
    const long = compile({ title: "t".repeat(MAX_TITLE + 1) });
    expect(!long.ok && long.refusals.map((r) => r.field)).toEqual(["title"]);
    const many = compile({ symbols: Array.from({ length: MAX_PICKS + 1 }, (_, i) => `Z${i}`) });
    expect(!many.ok && many.refusals[0]?.field).toBe("symbols");
  });

  it("round-trips through formFromCampaign, so Edit opens on what was saved", () => {
    const made = compile();
    expect(made.ok && formFromCampaign(made.campaign)).toEqual({
      ...FORM,
      symbols: ["XOM", "CVX"],
    });
  });
});

describe("parseCampaignForm", () => {
  it("passes a well-typed body and rejects a wrongly typed one", () => {
    expect(parseCampaignForm(FORM)).toEqual(FORM);
    expect(parseCampaignForm({ ...FORM, symbols: "XOM" })).toBeUndefined();
    expect(parseCampaignForm({ ...FORM, anchor: { kind: "planet", id: "Mars" } })).toBeUndefined();
    expect(parseCampaignForm({ ...FORM, storyline: 7 })).toBeUndefined();
    expect(parseCampaignForm(null)).toBeUndefined();
  });

  it("accepts no field that could carry logic: the extra keys are dropped", () => {
    const parsed = parseCampaignForm({ ...FORM, forces: [{ id: "x", prefixes: [""] }] });
    expect(parsed && Object.keys(parsed).sort()).toEqual([
      "anchor",
      "mode",
      "storyline",
      "symbols",
      "title",
    ]);
  });
});

describe("researchAskFor", () => {
  it("names the picks the house has no research on, never the anchor's fund", () => {
    const made = compile();
    if (!made.ok) throw new Error("compile failed");
    expect(researchAskFor(made.campaign, (s) => s === "XOM")).toEqual(["CVX"]);
    expect(researchAskFor(made.campaign, () => true)).toEqual([]);
  });
});

describe("the record's mode", () => {
  it("refuses a mode outside the four", () => {
    const made = compile();
    if (!made.ok) throw new Error("compile failed");
    expect(() =>
      parseCampaign({ ...made.campaign, mode: "yolo" }, "f.json", made.campaign.id),
    ).toThrow(/mode "yolo"/);
  });

  it("offers the four modes, the 11 sectors and every catalog market on the form", () => {
    expect(CAMPAIGN_FORM_CHOICES.modes).toEqual([
      "explore",
      "find-names",
      "build-strategy",
      "play",
    ]);
    expect(CAMPAIGN_FORM_CHOICES.sectors).toHaveLength(11);
    expect(CAMPAIGN_FORM_CHOICES.markets.map((m) => m.id)).toContain("oil");
  });
});
