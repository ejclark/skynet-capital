import { readFileSync } from "node:fs";
import { playbookStoreCatalog } from "../../src/discovery/playbook-store.js";
import { SauronPersona } from "../../src/personas/sauron.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

describe("playbookStoreCatalog", () => {
  it("returns one entry per house playbook, keyed by id and symbol", () => {
    const entries = playbookStoreCatalog();
    expect(entries.map((e) => e.id).sort()).toEqual([
      "CRWV-WHEEL",
      "G1-GOOG",
      "HC-SAURON",
      "NVDA-CALL-SPREAD",
      "S1-NVDA",
      "SAURON",
      "TACO-DJT",
    ]);
    for (const entry of entries) {
      expect(entry.symbol.length).toBeGreaterThan(0);
    }
  });

  it("gives every entry a non-empty description and all four trigger fields", () => {
    for (const entry of playbookStoreCatalog()) {
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.enter.length).toBeGreaterThan(0);
      expect(entry.exitTakeProfit.length).toBeGreaterThan(0);
      expect(entry.exitCutLosses.length).toBeGreaterThan(0);
      expect(entry.hold.length).toBeGreaterThan(0);
    }
  });

  it("metrics is present but empty — shape is TBD (#885)", () => {
    for (const entry of playbookStoreCatalog()) {
      expect(entry.metrics).toEqual([]);
    }
  });

  // #3623: the retired Plays cards' derived facts now ride on the store entry.
  const byId = (id: string) => playbookStoreCatalog().find((e) => e.id === id);

  it("carries a date-windowed playbook's probe facts, evidence and study link", () => {
    const s1 = byId("S1-NVDA");
    expect(s1?.window).toBe("20 to 6 sessions before the print");
    expect(s1?.size?.standard).toBeGreaterThan(0);
    expect(s1?.traits.map((t) => t.id)).toEqual([
      "flat-before-the-release",
      "confirmed-dates-only",
    ]);
    expect(s1?.evidence).toContain("docs/research/");
    expect(s1?.evidenceHref).toMatch(/^\/research\//);
  });

  it("names S1's and G1's windows in trading sessions, the unit their code counts in (#4776)", () => {
    const s1 = byId("S1-NVDA");
    expect(s1?.enter).toContain(
      "From 20 trading sessions before a CONFIRMED earnings date to 6 before it.",
    );
    expect(s1?.enter).toContain("A date confirmed later than that opens on the next cycle.");
    expect(s1?.exitCutLosses).toContain("Flat from 5 trading sessions before the print");
    expect(s1?.hold).toContain("inside the last 5 sessions");
    const g1 = byId("G1-GOOG");
    expect(g1?.enter).toContain(
      "From 20 trading sessions before a CONFIRMED earnings date to the close of print day.",
    );
    expect(g1?.window).toBe("20 sessions before the print to the close of print day");
    for (const entry of [s1, g1]) {
      expect(`${entry?.enter} ${entry?.exitCutLosses} ${entry?.hold}`).not.toMatch(/D-\d/);
    }
  });

  it("shows a tactical playbook's whole basket and no invented window", () => {
    const hc = byId("HC-SAURON");
    expect(hc?.symbols.length).toBeGreaterThan(1);
    expect(hc?.symbol).toBe(hc?.symbols[0]);
    expect(hc?.window).toBeUndefined();
    expect(hc?.size).toBeUndefined();
    expect(hc?.traits).toEqual([]);
  });

  it("shows an option playbook's rules as copy, never a probed window or a percent size", () => {
    const wheel = byId("CRWV-WHEEL");
    expect(wheel?.window).toBeUndefined();
    expect(wheel?.size).toBeUndefined();
    expect(wheel?.traits).toEqual([]);
    expect(wheel?.evidenceHref).toBe("/research/crwv-premium-fit");
  });

  it("says plainly the wheel runs against our own study, and when it retires", () => {
    const wheel = byId("CRWV-WHEEL");
    expect(wheel?.description).toContain("AGAINST our own study");
    expect(wheel?.description).toContain("about 70%");
    expect(wheel?.description).toContain("about 89%");
    expect(wheel?.description).toContain("below $0 on 2027-01-29");
    expect(wheel?.description).toContain("more than 1 in 3 of its sold puts");
    expect(wheel?.description).toContain("nothing switches it off automatically");
    expect(wheel?.exitCutLosses).toContain("The real loss is owning a falling stock");
    expect(wheel?.exitCutLosses).toContain("ride through an earnings print");
  });

  it("says the NVDA spread is S1-NVDA's run-up with the loss capped, confirmed dates only, out by D-5", () => {
    const spread = byId("NVDA-CALL-SPREAD");
    expect(spread?.window).toBeUndefined();
    expect(spread?.evidenceHref).toBe("/research/nvda-earnings-cycle");
    expect(spread?.description).toContain("options form of S1-NVDA's pre-earnings run-up");
    expect(spread?.description).toContain("The most it can lose is the debit paid");
    expect(spread?.enter).toContain("CONFIRMED NVIDIA earnings date");
    expect(spread?.exitTakeProfit).toContain("5 trading sessions before the print");
  });

  it("says each option play trades nothing when no strike sits near the delta it aims at", () => {
    expect(byId("CRWV-WHEEL")?.enter).toContain("never above 0.30");
    expect(byId("CRWV-WHEEL")?.enter).toContain("it sells nothing that cycle");
    expect(byId("NVDA-CALL-SPREAD")?.enter).toContain("between 0.40 and 0.60 delta");
    expect(byId("NVDA-CALL-SPREAD")?.enter).toContain("with none that close, it opens nothing");
  });

  it("says the NVDA spread sells back any NVDA call debit spread on its bot, whoever placed it", () => {
    const hold = byId("NVDA-CALL-SPREAD")?.hold ?? "";
    expect(hold).not.toContain("positions it did not open: does nothing");
    expect(hold).toContain("whoever placed it");
    expect(hold).toContain("any other NVDA option position stops it opening and is left alone");
  });

  describe("SAURON — Sauron's own rules (#4651)", () => {
    const card = () => {
      const entry = byId("SAURON");
      if (!entry) throw new Error("SAURON is not in the catalog");
      return entry;
    };
    const note = (label: string) => card().notes?.find((n) => n.label === label)?.text ?? "";
    const copy = () => {
      const c = card();
      const rows = [c.description, c.enter, c.exitTakeProfit, c.exitCutLosses, c.hold];
      return [...rows, ...(c.notes ?? []).map((n) => n.text)].join(" ");
    };

    it("shows the ten names it trades and no invented window, size or study link", () => {
      expect(card().symbols).toEqual([
        "AAPL",
        "MSFT",
        "NVDA",
        "GOOGL",
        "AMZN",
        "META",
        "AVGO",
        "TSLA",
        "CRWV",
        "MRVL",
      ]);
      expect(card().window).toBeUndefined();
      expect(card().size).toBeUndefined();
      expect(card().traits).toEqual([]);
      expect(card().evidenceHref).toBeUndefined();
    });

    // Phone-first (owner, 2026-10-06): two short sentences, then the rules, then the exceptions
    // under their own names — never a long paragraph above the rules.
    it("opens with two short sentences and puts the exceptions in labelled rows after the rules", () => {
      const sentences = card().description.split(/(?<=\.)\s+/);
      expect(sentences).toHaveLength(2);
      expect(card().description.split(/\s+/).length).toBeLessThanOrEqual(60);
      expect(card().notes?.map((n) => n.label)).toEqual([
        "On another bot",
        "Research settings",
        "Pause",
      ]);
    });

    it("says whose rules it trades, and that his own orders are held to the limits you set", () => {
      expect(card().description).toContain("Sauron's own trading rules as a playbook");
      expect(card().description).toContain(
        "it places the orders his rules already place, labelled as this playbook's and held to " +
          "any capital or symbol limit you set",
      );
      expect(copy()).not.toContain("exactly the share orders");
      expect(card().enter).toContain("The mode you pick does not change that");
      expect(card().enter).toContain("The capital you allocate caps his buys");
      expect(card().enter).toContain("A symbol filter you set refuses his buys on the names it");
      // The persona's dollar size is what it ASKS for; the position cap still clamps the fill.
      expect(card().enter).toContain("asks for $120,000");
      expect(card().enter).toContain("the risk guards then cap any one position");
      expect(card().exitCutLosses).toContain("no stop-loss");
    });

    // On another bot it takes over the shares the bot already holds — except a name another
    // playbook on the bot trades — and the bot's own rules, stop-losses included, go quiet.
    it("says what subscribing another bot does to the shares it already holds", () => {
      const other = note("On another bot");
      expect(other).toContain("runs his standard rules on that bot's own account");
      expect(other).toContain(
        "takes over every share the bot already holds in these ten names, whoever bought it — " +
          "except a name another playbook on the bot trades, which stays that playbook's",
      );
      expect(other).toContain("the bot's own rules stop trading altogether while it is on");
      expect(other).toContain("its stop-losses included");
      expect(card().exitTakeProfit).toContain("It sells any holding in his names this way");
    });

    // A member cannot see which build runs, and HC-SAURON's card carries no numbers to point at.
    it("describes his research settings in its own words rather than pointing at another card", () => {
      expect(copy()).not.toContain("HC-SAURON");
      expect(note("Research settings")).toContain("This card cannot show which his account runs");
      expect(note("Research settings")).toContain("a momentum stop that closes the position");
    });

    // The card cites docs/BOTS-SAURON.md as its evidence; the two must state the same ceiling.
    it("cites a dossier that states the same panic-buy ceiling as the card", () => {
      expect(card().evidence).toContain("docs/BOTS-SAURON.md");
      const dossier = readFileSync("docs/BOTS-SAURON.md", "utf8");
      const callSheet = dossier.slice(0, dossier.indexOf("## Adaptation ledger"));
      expect(callSheet).toContain("asks for $156,000");
      expect(callSheet).not.toContain("($120,000 → $240,000)");
      expect(callSheet).not.toContain("it's the only sizing discipline plain Sauron has");
    });

    // One position, one playbook: SAURON yields every name another playbook on the bot trades.
    it("says a name another playbook trades stays that playbook's, cap included", () => {
      expect(card().hold).toContain("S1-NVDA's NVDA, the wheel's CRWV, the call spread's NVDA");
      expect(card().hold).toContain("so one position never answers to two");
      expect(card().enter).toContain("counts against that playbook, never against both");
    });

    // Until slice 10 refuses unlabelled orders, pausing on his own account only removes the label —
    // the card must not claim it stops his trades there.
    it("says what pausing does today: option playbooks keep running, his rules keep trading unlabelled", () => {
      expect(note("Pause")).toContain("Pausing it never stops an option playbook");
      // "Paused", never "or unsubscribed": an env roster naming SAURON keeps his label unsubscribed.
      expect(note("Pause")).toContain(
        "Paused on Sauron's own account, his rules still trade it as they did before",
      );
      expect(note("Pause")).not.toContain("unsubscribed");
      expect(copy()).not.toMatch(/paus\w* (it )?stops his/i);
    });

    // A paused subscription no longer stamps his orders, so the guards find no subscription for
    // them: the cap and the symbol filter set here lift with the label (round-3 check of 89e58dcc).
    it("says pausing lifts the limits set here along with the label", () => {
      expect(note("Pause")).toContain(
        "without its label and without any capital or symbol limit you set here",
      );
      expect(note("Pause")).not.toContain("just without its label");
    });

    // Pause = exits only (round 4): on another bot it opens nothing and still sells to flat.
    it("says a paused SAURON on another bot buys nothing and still sells what it holds", () => {
      expect(note("Pause")).toContain(
        "Paused on any other bot, it buys nothing new and still sells a holding in his names " +
          "when euphoria rolls over",
      );
      expect(note("Pause")).toContain("the bot's own rules stay off a name until it is sold");
      expect(note("Pause")).not.toContain("nothing of his runs");
    });

    it("quotes only numbers his persona actually trades on", () => {
      expect(card().enter).toContain("−0.70 or lower");
      expect(card().enter).toContain("$120,000 at −0.70");
      expect(card().enter).toContain("$156,000 at −1.00");
      expect(card().exitTakeProfit).toContain("0.70 or higher");
      const sauron = new SauronPersona();
      const ask = (ctx: ReturnType<typeof aContext>) => ctx.quotes.AAPL?.ask ?? 0;
      // Euphoria exit: at 0.70 with momentum at 0, never at 0.69 or with momentum above 0.
      const held = aPortfolio({ positions: [aPosition({ symbol: "AAPL", quantity: 7 })] });
      expect(sauron.decide(aContext({ AAPL: { sentiment: 0.7, momentum: 0 } }), held)).toEqual([
        expect.objectContaining({ side: "sell", quantity: 7 }),
      ]);
      expect(sauron.decide(aContext({ AAPL: { sentiment: 0.69, momentum: 0 } }), held)).toEqual([]);
      expect(sauron.decide(aContext({ AAPL: { sentiment: 0.7, momentum: 0.001 } }), held)).toEqual(
        [],
      );
      // Panic entry: $120,000 at -0.70 with momentum at 0; $156,000 at -1.00; nothing at -0.69.
      const at = (sentiment: number) => aContext({ AAPL: { sentiment, momentum: 0 } });
      expect(sauron.decide(at(-0.7), aPortfolio())).toEqual([
        expect.objectContaining({ side: "buy", quantity: Math.floor(120_000 / ask(at(-0.7))) }),
      ]);
      expect(sauron.decide(at(-1), aPortfolio())).toEqual([
        expect.objectContaining({ side: "buy", quantity: Math.floor(156_000 / ask(at(-1))) }),
      ]);
      expect(sauron.decide(at(-0.69), aPortfolio())).toEqual([]);
    });
  });

  it("keeps an unevidenced playbook's honest note and links nowhere", () => {
    const taco = byId("TACO-DJT");
    expect(taco?.evidence.length).toBeGreaterThan(0);
    expect(taco?.evidenceHref).toBeUndefined();
  });

  it("is derived fresh each call, not a cached singleton", () => {
    expect(playbookStoreCatalog()).toEqual(playbookStoreCatalog());
    expect(playbookStoreCatalog()).not.toBe(playbookStoreCatalog());
  });
});
