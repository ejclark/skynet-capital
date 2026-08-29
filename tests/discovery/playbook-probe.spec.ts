import {
  evidenceHref,
  housePlaybooks,
  probeWindow,
  spanOf,
} from "../../src/discovery/playbook-probe.js";
import type { Playbook } from "../../src/playbooks/playbook.js";
import { G1_GOOG, S1_NVDA } from "../../src/playbooks/registry.js";

/** The shared probe: it ASKS a play what it wants, day by day, rather than reading a declared
 *  window — so a play that changes its rule changes its description with no edit here. */

const stub = (over: Partial<Playbook> = {}): Playbook => ({
  id: "X1-TEST",
  symbol: "TEST",
  thesis: "a stub",
  evidence: "none",
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  desiredState: () => "no-window",
  ...over,
});

describe("housePlaybooks", () => {
  it("reads the roster off what the registry exports, id-sorted", () => {
    expect(housePlaybooks().map((p) => p.id)).toEqual([G1_GOOG.id, S1_NVDA.id].sort());
  });

  it("is a pure derivation — two calls agree", () => {
    expect(housePlaybooks()).toEqual(housePlaybooks());
  });
});

describe("probeWindow", () => {
  it("walks S1's real window off the play — long in the run-up, never through the print", () => {
    const probe = probeWindow(S1_NVDA);

    expect(probe.longDays[0]).toBe(20);
    expect(probe.longDays[probe.longDays.length - 1]).toBe(6);
    expect(probe.holdsThePrint).toBe(false);
  });

  it("catches G1's different exit — long right up to the close of print day, still flat for it", () => {
    const probe = probeWindow(G1_GOOG);

    expect(probe.longDays[probe.longDays.length - 1]).toBe(0);
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
    expect(probeWindow(stub()).longDays).toEqual([]);
  });
});

describe("spanOf", () => {
  it("names a contiguous window by its ends", () => {
    expect(spanOf(probeWindow(S1_NVDA))).toBe("D-20 to D-6");
  });

  it("says 'to the close of day D' when the window runs to the release", () => {
    expect(spanOf(probeWindow(G1_GOOG))).toBe("D-20 to the close of day D");
  });

  it("spells a window with a hole in it day by day rather than smoothing it into a lie", () => {
    // Long only on the 10th, 20th and 30th of the probe month — D-20, D-10 and D-0, with gaps.
    const holed = probeWindow(
      stub({
        desiredState: (asOf) => (asOf.slice(8, 10).endsWith("0") ? "long" : "no-window"),
      }),
    );

    expect(spanOf(holed)).toBe("on D-20, D-10, D-0");
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
