import {
  evidenceHref,
  housePlaybooks,
  probeWindow,
  spanOf,
} from "../../src/discovery/playbook-probe.js";
import type { Playbook } from "../../src/playbooks/playbook.js";
import {
  CRWV_WHEEL,
  G1_GOOG,
  HC_SAURON,
  NVDA_CALL_SPREAD,
  S1_NVDA,
  SAURON,
  TACO_DJT,
} from "../../src/playbooks/registry.js";

/** The shared probe: it ASKS a play what it wants, day by day, rather than reading a declared
 *  window — so a play that changes its rule changes its description with no edit here. */

const stub = (over: Partial<Playbook> = {}): Playbook => ({
  id: "X1-TEST",
  symbols: ["TEST"],
  thesis: "a stub",
  evidence: "none",
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  desiredState: () => "no-window",
  ...over,
});

describe("housePlaybooks", () => {
  it("reads the roster off what the registry exports, id-sorted", () => {
    expect(housePlaybooks().map((p) => p.id)).toEqual(
      [
        CRWV_WHEEL.id,
        G1_GOOG.id,
        HC_SAURON.id,
        NVDA_CALL_SPREAD.id,
        S1_NVDA.id,
        SAURON.id,
        TACO_DJT.id,
      ].sort(),
    );
  });

  it("is a pure derivation — two calls agree", () => {
    expect(housePlaybooks()).toEqual(housePlaybooks());
  });
});

describe("probeWindow", () => {
  it("walks S1's real window off the play — long in the run-up, never through the print", () => {
    const probe = probeWindow(S1_NVDA);

    expect(probe.longSessions).toEqual([20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6]);
    expect(probe.holdsThePrint).toBe(false);
  });

  it("catches G1's different exit — long right up to the close of print day, still flat for it", () => {
    const probe = probeWindow(G1_GOOG);

    expect(probe.longSessions[probe.longSessions.length - 1]).toBe(0);
    expect(probe.holdsThePrint).toBe(false);
  });

  it("reports the date policy: neither house play opens its window on an estimate", () => {
    expect(probeWindow(S1_NVDA).opensOnAnEstimate).toBe(false);
    expect(probeWindow(G1_GOOG).opensOnAnEstimate).toBe(false);
  });

  it("reports a play that WOULD open on an estimate honestly, rather than assuming the policy", () => {
    expect(probeWindow(stub({ desiredState: () => "long" })).opensOnAnEstimate).toBe(true);
  });

  it("sees a play still long after the bell as holding the print", () => {
    expect(probeWindow(stub({ desiredState: () => "long" })).holdsThePrint).toBe(true);
  });

  it("finds no window at all for a play that never wants to be long", () => {
    expect(probeWindow(stub()).longSessions).toEqual([]);
  });
});

describe("spanOf", () => {
  it("names a contiguous window by its ends, in trading sessions", () => {
    expect(spanOf(probeWindow(S1_NVDA))).toBe("20 to 6 sessions before the print");
  });

  it("says 'to the close of print day' when the window runs to the release", () => {
    expect(spanOf(probeWindow(G1_GOOG))).toBe(
      "20 sessions before the print to the close of print day",
    );
  });

  it("spells a window with a hole in it session by session rather than smoothing it into a lie", () => {
    // Long only on 09-01, 09-16 and 09-30 — sessions 20, 10 and 0 before the 09-30 probe print
    // (Labor Day, 09-07, is not a session).
    const days = new Set(["2026-09-01", "2026-09-16", "2026-09-30"]);
    const holed = probeWindow(
      stub({ desiredState: (asOf) => (days.has(asOf.slice(0, 10)) ? "long" : "no-window") }),
    );

    expect(spanOf(holed)).toBe("on sessions 20, 10, 0 before the print");
  });

  it("says so out loud when there is no window", () => {
    expect(spanOf(probeWindow(stub()))).toBe("no window at all");
  });
});

describe("evidenceHref", () => {
  it("routes a cited research doc onto the research shelf", () => {
    expect(evidenceHref(S1_NVDA)).toBe("/research/nvda-earnings-cycle");
  });

  it("returns nothing when the citation names no doc we serve — never a link to nowhere", () => {
    expect(evidenceHref(stub())).toBeUndefined();
  });
});
