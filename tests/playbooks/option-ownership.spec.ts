import type { Bot } from "../../src/bots/bot.js";
import { createDefaultPersonas } from "../../src/personas/registry.js";
import { claimOptionUnderlyings } from "../../src/playbooks/option-ownership.js";
import type { EnabledPlaybook, Playbook } from "../../src/playbooks/playbook.js";
import { G1_GOOG, S1_NVDA } from "../../src/playbooks/registry.js";
import { resolveBotRoster } from "../../src/scripts/autonomous-live-wiring.js";

// One option playbook per underlying, and it owns the ticker for the bot that runs it.
const optionPlay = (id: string, underlying: string): Playbook => ({
  id,
  symbols: [underlying],
  thesis: "test",
  evidence: "test",
  size: { conservative: 0, standard: 0, aggressive: 0 },
  desiredState: () => "no-window",
  options: { underlyings: [underlying], holdsShortToExpiry: [], requiredLevel: 3 },
});
const SPREAD = optionPlay("NVDA-CALL-SPREAD", "NVDA");
const WHEEL = optionPlay("CRWV-WHEEL", "CRWV");
const BASKET: Playbook = { ...G1_GOOG, id: "HC-BASKET", symbols: ["CRWV", "NVDA", "MSFT"] };
const on = (playbook: Playbook): EnabledPlaybook => ({ playbook, mode: "standard" });
const summary = (roster: readonly EnabledPlaybook[]) =>
  roster.map((e) => `${e.playbook.id}[${e.playbook.symbols.join(",")}]`);

describe("claimOptionUnderlyings", () => {
  it("hands an option play's underlying over: every other playbook loses it, loudly, in roster order", () => {
    const lines: string[] = [];
    const roster = claimOptionUnderlyings(
      [on(S1_NVDA), on(BASKET), on(SPREAD), on(G1_GOOG), on(WHEEL)],
      (line) => lines.push(line),
    );
    expect(summary(roster)).toEqual([
      "S1-NVDA[]",
      "HC-BASKET[MSFT]",
      "NVDA-CALL-SPREAD[NVDA]",
      "G1-GOOG[GOOG]",
      "CRWV-WHEEL[CRWV]",
    ]);
    expect(lines).toEqual([
      "S1-NVDA hands NVDA → NVDA-CALL-SPREAD; it stops trading them on this bot",
      "HC-BASKET hands CRWV → CRWV-WHEEL, NVDA → NVDA-CALL-SPREAD; it stops trading them on this bot",
    ]);
  });

  it("refuses a second option playbook on an underlying already claimed", () => {
    const lines: string[] = [];
    const rival = optionPlay("NVDA-WHEEL", "NVDA");
    const roster = claimOptionUnderlyings([on(SPREAD), on(rival)], (line) => lines.push(line));
    expect(summary(roster)).toEqual(["NVDA-CALL-SPREAD[NVDA]"]);
    expect(lines).toEqual([
      "NVDA-WHEEL refused — another option playbook already trades NVDA (NVDA-CALL-SPREAD)",
    ]);
  });

  it("leaves a roster with no option playbook exactly as it was, and says nothing", () => {
    const lines: string[] = [];
    const roster = [on(S1_NVDA), on(G1_GOOG)];
    expect(claimOptionUnderlyings(roster, (line) => lines.push(line))).toEqual(roster);
    expect(lines).toEqual([]);
  });
});

describe("resolveBotRoster applies the ownership rule after merging", () => {
  it("narrows a house S1-NVDA under an NVDA option play, on a [playbooks] line", () => {
    const persona = createDefaultPersonas()[0];
    if (!persona) throw new Error("no default persona");
    const bot = { persona, credentials: { apiKey: "k", apiSecret: "s" } } as unknown as Bot;
    const warn = rstest.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const { enabled } = resolveBotRoster(bot, [on(S1_NVDA), on(SPREAD)], []);
      expect(summary(enabled)).toEqual(["S1-NVDA[]", "NVDA-CALL-SPREAD[NVDA]"]);
      expect(warn).toHaveBeenCalledWith(
        `[playbooks] ${persona.id}: S1-NVDA hands NVDA → NVDA-CALL-SPREAD; it stops trading them on this bot`,
      );
    } finally {
      warn.mockRestore();
    }
  });
});
