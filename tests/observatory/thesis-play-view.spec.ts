import type { SafeguardLadderEntry } from "../../src/observatory/safeguard-ladder-view.js";
import type { ThesisMarker } from "../../src/observatory/thesis-json-view.js";
import { thesisPlayView } from "../../src/observatory/thesis-play-view.js";
import type { Playbook } from "../../src/playbooks/playbook.js";
import { SAURON } from "../../src/playbooks/sauron-rules.js";

/** #5327 — the numbers the Thesis tab draws a persona's own-rules play from: read off the persona's
 *  config and the bots' signal windows, shown only when the bot's own pass said the play ran. */

const entry = (playbookId: string | undefined): SafeguardLadderEntry => ({
  ...(playbookId ? { playbookId } : {}),
  mode: "standard",
  stages: [],
});

const marker = (n: number, over: Partial<ThesisMarker> = {}): ThesisMarker => ({
  n,
  kind: "entry",
  at: `2026-09-1${n}T14:00:00Z`,
  label: "Buy 6 NVDA",
  symbol: "NVDA",
  side: "buy",
  activityAnchor: `act-${n}`,
  ...over,
});

const windows = { momentum: 20, sentiment: 10 };

describe("thesisPlayView", () => {
  it("draws Sauron's own play from his config, under its member-facing name", () => {
    const play = thesisPlayView("sauron", [entry("S1-NVDA"), entry("SAURON")], [], windows);
    expect(play).toEqual({
      playbookId: "SAURON",
      name: "Buy the rumor, sell the news",
      buyAtOrBelow: -0.7,
      buyMomentumAtLeast: 0,
      sellAtOrAbove: 0.7,
      sellMomentumAtMost: 0,
      windows,
      researchBuild: false,
      researchTrades: [],
    });
  });

  it("draws nothing when no pass is on hand, or the pass did not run the play", () => {
    expect(thesisPlayView("sauron", null, [], windows)).toBeUndefined();
    expect(thesisPlayView("sauron", [entry("S1-NVDA")], [], windows)).toBeUndefined();
    // A non-owner's ladder carries no ids, so it can never name the play.
    expect(thesisPlayView("sauron", [entry(undefined)], [], windows)).toBeUndefined();
  });

  it("draws nothing for a persona whose rules are not a sentiment band", () => {
    const own: Playbook = { ...SAURON, id: "FADER-OWN", rulesOf: "news-fader" };
    const lookup = (id: string) => (id === own.id ? own : undefined);
    expect(thesisPlayView("news-fader", [entry(own.id)], [], windows, lookup)).toBeUndefined();
  });

  it("falls back to the id when the play has no display name, and omits unwired windows", () => {
    const { displayName: _name, ...bare } = SAURON;
    const play = thesisPlayView("sauron", [entry("SAURON")], [], undefined, () => bare);
    expect(play?.name).toBe("SAURON");
    expect(play).not.toHaveProperty("windows");
  });

  it("flags the research build when this play's newest trade carries its tag", () => {
    const tagged = (n: number, strategy: string) =>
      marker(n, {
        playbookId: "SAURON",
        reasoning: { reason: "r", personaId: "sauron", strategy },
      });
    const research = thesisPlayView(
      "sauron",
      [entry("SAURON")],
      [tagged(1, "sauron-panic-claim"), tagged(2, "hc-panic-claim"), marker(3)],
      windows,
    );
    expect(research?.researchBuild).toBe(true);
    const standard = thesisPlayView(
      "sauron",
      [entry("SAURON")],
      [tagged(1, "hc-panic-claim"), tagged(2, "sauron-panic-claim")],
      windows,
    );
    expect(standard?.researchBuild).toBe(false);
    // Back on the standard build, the older research trade is still listed, so it is never drawn
    // on the standard line or walked through as a standard buy.
    expect(standard?.researchTrades).toEqual([1]);
    expect(research?.researchTrades).toEqual([2]);
  });
});
