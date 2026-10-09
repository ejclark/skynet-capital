import { readFileSync } from "node:fs";
import { InMemoryBroker } from "../../src/adapters/in-memory-broker.js";
import { AutonomousTrader } from "../../src/autonomous/autonomous-trader.js";
import { LiveCycleRunner } from "../../src/autonomous/live-cycle.js";
import { SafetyController } from "../../src/autonomous/safety.js";
import { playbookStoreCatalog } from "../../src/discovery/playbook-store.js";
import type { OrderIntent } from "../../src/domain/types.js";
import { applyGuardsWithVerdicts, DEFAULT_RISK_CONFIG } from "../../src/engine/guards.js";
import { REFUSAL_LABEL } from "../../src/observatory/decision-json-view.js";
import { SauronPersona } from "../../src/personas/sauron.js";
import { betaScoutIntents } from "../../src/playbooks/beta-scout.js";
import { resolveBotRoster, tradingRoster } from "../../src/scripts/autonomous-live-wiring.js";
import { scoutSkipSymbols } from "../../src/scripts/autonomous-scout-staging.js";
import { aContext, aPortfolio, aPosition, aSubscription } from "../support/builders.js";

describe("playbookStoreCatalog", () => {
  it("returns one entry per house playbook, keyed by id and symbol", () => {
    const entries = playbookStoreCatalog();
    expect(entries.map((e) => e.id).sort()).toEqual([
      "BETA-SCOUT",
      "CRWV-WHEEL",
      "G1-GOOG",
      "HC-SAURON",
      "NVDA-CALL-SPREAD",
      "S1-NVDA",
      "SAURON",
      "TACO-DJT",
    ]);
    // The forced daily pick names no ticker: it picks among the bots' ten names on the day.
    for (const entry of entries.filter((e) => e.id !== "BETA-SCOUT")) {
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
    // From #4469 slice 3c part 3 the check is the bots' own (`with-conviction-gate.ts`), on every
    // subscription to the pair: the ◆ row's conviction rides on each one (`row-conviction.ts`).
    expect(wheel?.description).toContain("stops selling new puts on its own");
    expect(wheel?.description).not.toContain("by hand");
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
    // A paused spread keeps its claim on NVDA (#4651): its names stay its own while subscribed.
    expect(hold).toContain(
      "While it is subscribed (on or paused), S1-NVDA stops trading NVDA shares",
    );
  });

  describe("BETA-SCOUT — the forced daily pick, subscribable (#4642 slice 10)", () => {
    const card = () => {
      const entry = byId("BETA-SCOUT");
      if (!entry) throw new Error("BETA-SCOUT is not in the catalog");
      return entry;
    };
    const note = (label: string) => card().notes?.find((n) => n.label === label)?.text ?? "";

    it("names no ticker, and shows no invented window, size or study link", () => {
      expect(card().symbols).toEqual([]);
      expect(card().window).toBeUndefined();
      expect(card().size).toBeUndefined();
      expect(card().traits).toEqual([]);
      expect(card().evidenceHref).toBeUndefined();
    });

    it("says plainly it is a test of the order path, kept apart from every playbook's results", () => {
      expect(card().description).toContain(
        "a test that the order path works, not a call on any name",
      );
      expect(card().description).toContain("kept apart from every other playbook's");
    });

    // The size the card quotes is the size the scout places, for every mode.
    it("quotes the size its picks are placed at: 0.5% of the bot's cash each", () => {
      expect(card().enter).toContain("0.5% of the bot's cash each");
      const cash = 1_000_000;
      const context = aContext({ AAPL: { last: 100, sentiment: 0.9 } });
      const ask = context.quotes.AAPL?.ask ?? 0;
      for (const mode of ["conservative", "standard", "aggressive"] as const) {
        const [pick] = betaScoutIntents(context, aPortfolio({ cash }), ["AAPL"], new Set(), false, {
          mode,
        });
        expect(pick?.quantity).toBe(Math.floor((0.005 * cash) / ask));
        expect(pick?.playbookMode).toBe(mode);
      }
    });

    it("says it needs both the operations setting and the subscription, on one bot", () => {
      expect(note("Two switches")).toContain(
        "It buys only while both are on: the forced-pick setting in operations, and this subscription",
      );
      expect(note("Two switches")).toContain("subscribed on any other bot, it places nothing");
    });

    // The refusal it records reads the way the dashboard words it (REFUSAL_LABEL).
    it("says an unsubscribed scout records its picks as refused, and still sells what it holds", () => {
      expect(note("Not subscribed")).toContain(
        "recorded as refused, not from a subscribed playbook",
      );
      expect(REFUSAL_LABEL.unsubscribed).toMatch(/^not from a subscribed playbook/);
      expect(note("Not subscribed")).toContain("Picks it already holds are still sold");
      expect(card().hold).toContain(
        "Paused, it buys nothing new and still sells yesterday's picks",
      );
    });

    // Review of slice 10, finding 2: the card said it bought only on a day nothing else traded. It
    // buys at the first check in which no bot has traded yet, and a later trade does not undo it —
    // checked here against the live cycle, not only the copy.
    describe("when it buys, as the live cycle runs it", () => {
      const q = (symbol: string) => ({ symbol, bid: 100, ask: 100, last: 100, asOf: "t" });
      function day() {
        const broker = new InMemoryBroker(1_000_000, [q("MSFT"), q("AMD")]);
        let buysAmd = false;
        const persona = {
          id: "host",
          name: "Host",
          thesis: "t",
          decide: (): OrderIntent[] =>
            buysAmd
              ? [{ symbol: "AMD", side: "buy", quantity: 5, type: "market", reason: "t" }]
              : [],
        };
        const runner = new LiveCycleRunner({
          traders: [
            {
              personaName: "Host",
              broker,
              trader: new AutonomousTrader({ persona, broker, risk: { maxPositionPct: 0.5 } }),
            },
          ],
          safety: new SafetyController(),
          blockedReason: () => null,
          scout: {
            maxPicks: 1,
            broker,
            universe: ["MSFT"],
            managedSymbols: new Set(),
            risk: { maxPositionPct: 0.5 },
            mode: "live",
            subscriptions: () => [aSubscription("host", "BETA-SCOUT")],
          },
        });
        const held = async () => (await broker.getPortfolio()).positions.map((p) => p.symbol);
        return { runner, held, botTrades: () => (buysAmd = true) };
      }
      const at = (time: string) =>
        aContext({ MSFT: { last: 100, sentiment: 0.9 }, AMD: { last: 100 } }, time);

      it("buys at the first check no bot has traded yet, and a later trade does not undo it", async () => {
        expect(card().description).toContain(
          "the first time in a session that no bot has traded yet",
        );
        expect(card().hold).toContain("a trade after its pick does not undo the pick");
        const { runner, held, botTrades } = day();
        await runner.runCycle(at("2026-07-24T14:00:00Z"));
        botTrades();
        await runner.runCycle(at("2026-07-24T19:00:00Z"));
        expect((await held()).sort()).toEqual(["AMD", "MSFT"]);
      });

      it("once a bot has traded that session, it buys nothing more that day", async () => {
        expect(card().hold).toContain(
          "Once any bot has traded that session it buys nothing more that day",
        );
        const { runner, held, botTrades } = day();
        botTrades();
        await runner.runCycle(at("2026-07-24T14:00:00Z"));
        await runner.runCycle(at("2026-07-24T19:00:00Z"));
        expect(await held()).toEqual(["AMD"]);
      });
    });

    // Finding 11: the card said it skips every name another playbook trades; SAURON's ten are not
    // skipped — the scout and his rules share them, exactly as `scoutSkipSymbols` decides.
    it("says it can pick any of Sauron's ten names, as the skip list it reads decides", () => {
      expect(card().enter).toContain(
        "Sauron's own rules excepted: it can pick any of his ten names",
      );
      const roster = resolveBotRoster(
        { persona: new SauronPersona(), credentials: { apiKey: "k", apiSecret: "s" } },
        [],
        [aSubscription("sauron", "SAURON")],
      );
      expect([...scoutSkipSymbols(roster)]).toEqual([]);
    });

    // Finding 1: switching the setting off used to strand its picks; now it stops new ones only.
    it("says switching the setting off stops new picks only", () => {
      expect(note("Two switches")).toContain(
        "Switching the setting off stops new picks only — picks it holds are still sold",
      );
    });
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
      expect(other).toContain(
        "the bot's own rules stop trading altogether while it is subscribed, on or paused",
      );
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

    // #4642 slice 10: only a subscribed playbook that is on opens a position, so pausing (or
    // unsubscribing) SAURON on his own account stops his buys; his sells still run, unlabelled. The
    // copy is checked against what his live roster and the guards actually do.
    it("says pausing on his own account stops his buys and keeps his sells — as the guards do", () => {
      expect(note("Pause")).toContain("Pausing it never stops an option playbook");
      expect(note("Pause")).toContain(
        "Paused on Sauron's own account — or unsubscribed there — his rules stop buying",
      );
      expect(note("Pause")).toContain(
        "his rules stop buying: a bot opens positions only through a playbook it is subscribed to " +
          "and has on. They still sell a holding in his names when euphoria rolls over.",
      );
      const panicAndEuphoria = aContext({
        AAPL: { sentiment: -0.8, momentum: 0.01 },
        MSFT: { sentiment: 0.8, momentum: -0.01 },
      });
      const book = aPortfolio({ positions: [aPosition({ symbol: "MSFT", quantity: 7 })] });
      const run = (subs: ReturnType<typeof aSubscription>[]) => {
        const roster = resolveBotRoster(
          { persona: new SauronPersona(), credentials: { apiKey: "k", apiSecret: "s" } },
          [],
          subs,
        );
        const { persona, risk } = tradingRoster(roster, DEFAULT_RISK_CONFIG);
        const raw = persona.decide(panicAndEuphoria, book);
        const { approved, refused } = applyGuardsWithVerdicts(raw, book, panicAndEuphoria, risk);
        return [
          ...approved.map((i) => `${i.side} ${i.symbol} ${i.playbookId ?? "-"}`),
          ...refused.map((r) => `refused ${r.intent.side} ${r.intent.symbol} ${r.reason}`),
        ].sort();
      };
      const on = run([aSubscription("sauron", "SAURON")]);
      expect(on).toEqual(["buy AAPL SAURON", "sell MSFT SAURON"]);
      const paused = ["refused buy AAPL unsubscribed", "sell MSFT -"];
      expect(run([aSubscription("sauron", "SAURON", { enabled: false })])).toEqual(paused);
      expect(run([])).toEqual(paused);
    });

    // The pre-slice-10 row said his rules kept trading, unlabelled and unlimited, when paused.
    it("never says a paused SAURON leaves his rules buying", () => {
      expect(note("Pause")).not.toContain("still trade it as they did before");
      expect(note("Pause")).not.toContain("without any capital or symbol limit you set here");
    });
    // Pause opens nothing new; ownership and exits unchanged (round 5): his names stay his.
    // Pause = exits only (round 4): on another bot it opens nothing and still sells to flat.
    it("says a paused SAURON on another bot buys nothing and still sells what it holds", () => {
      expect(note("Pause")).toContain(
        "Paused on any other bot, it buys nothing new and still sells a holding in his names " +
          "when euphoria rolls over",
      );
      expect(note("Pause")).toContain(
        "his names stay his, so the bot's own rules stay off them, stop-losses included, until you " +
          "unsubscribe",
      );
      expect(note("Pause")).not.toContain("until it is sold");
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
