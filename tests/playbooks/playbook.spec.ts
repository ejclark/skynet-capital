import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import {
  type EnabledPlaybook,
  type Playbook,
  playbookIntents,
  printWindow,
} from "../../src/playbooks/playbook.js";
import { aContext, aPortfolio, aPosition } from "../support/builders.js";

const calendar: readonly EarningsPrint[] = [
  { symbol: "NVDA", date: "2026-08-26", status: "confirmed", source: "test" },
];

const play = (overrides?: Partial<Playbook>): Playbook => ({
  id: "TEST-NVDA",
  symbol: "NVDA",
  thesis: "test play",
  evidence: "test",
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  desiredState: () => "long",
  ...overrides,
});

const enabled = (p: Playbook, mode: EnabledPlaybook["mode"] = "standard"): EnabledPlaybook[] => [
  { playbook: p, mode },
];

describe("printWindow", () => {
  it("reports days and confirmation for the symbol's next print", () => {
    expect(printWindow("NVDA", "2026-08-16T14:00:00Z", calendar)).toEqual({
      days: 10,
      confirmed: true,
    });
  });

  it("is undefined with no upcoming print", () => {
    expect(printWindow("XYZ", "2026-08-16T14:00:00Z", calendar)).toBeUndefined();
  });
});

describe("playbookIntents", () => {
  it("opens from flat when the play wants long — sized by mode, fully attributed", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-08-16T15:00:00Z");
    const portfolio = aPortfolio({ cash: 100_000 });

    const [intent] = playbookIntents(enabled(play()), context, portfolio, calendar);

    // standard = 2% of ~$100k equity at ~$100 -> ~19-20 shares
    expect(intent).toMatchObject({
      symbol: "NVDA",
      side: "buy",
      playbookId: "TEST-NVDA",
      playbookMode: "standard",
    });
    expect(intent?.quantity).toBeGreaterThan(15);
    expect(intent?.quantity).toBeLessThanOrEqual(20);
  });

  it("does nothing while already positioned and still wanting long", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-08-16T15:00:00Z");
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 20 })] });

    expect(playbookIntents(enabled(play()), context, portfolio, calendar)).toEqual([]);
  });

  it("flattens the WHOLE position when the play wants flat — S2's exit side", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-08-24T15:00:00Z");
    const portfolio = aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 20 })] });
    const flat = play({ desiredState: () => "flat" });

    const [intent] = playbookIntents(enabled(flat), context, portfolio, calendar);

    expect(intent).toMatchObject({
      side: "sell",
      quantity: 20,
      playbookId: "TEST-NVDA",
    });
  });

  it("threads the optional events feed to a playbook that declares it, defaulting to empty", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-08-16T15:00:00Z");
    let seen: unknown;
    const eventAware = play({
      desiredState: (_asOf, _cal, events) => {
        seen = events;
        return "no-window";
      },
    });

    playbookIntents(enabled(eventAware), context, aPortfolio(), calendar);
    expect(seen).toEqual([]);

    const passed = [{ symbol: "NVDA", detectedAt: "2026-08-16T14:50:00Z" }];
    playbookIntents(enabled(eventAware), context, aPortfolio(), calendar, passed);
    expect(seen).toBe(passed);
  });

  it("is silent in no-window, positioned or not", () => {
    const context = aContext({ NVDA: { last: 100 } }, "2026-08-16T15:00:00Z");
    const dark = play({ desiredState: () => "no-window" });

    expect(playbookIntents(enabled(dark), context, aPortfolio(), calendar)).toEqual([]);
    expect(
      playbookIntents(
        enabled(dark),
        context,
        aPortfolio({ positions: [aPosition({ symbol: "NVDA", quantity: 5 })] }),
        calendar,
      ),
    ).toEqual([]);
  });
});
