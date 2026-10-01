import type { PlaybookMode, PlaybookVerdict } from "../../src/domain/types.js";
import { safeguardLadderView } from "../../src/observatory/safeguard-ladder-view.js";
import type { Playbook } from "../../src/playbooks/playbook.js";
import { findPlaybook, playbookRoster } from "../../src/playbooks/registry.js";

/**
 * The safeguard ladder's job is to be TRUE, not reassuring (#3194 slice 6a). Every case here
 * pins a stage's words against what the code actually does — the two stages are named after
 * mechanisms that are, today, a log line and an unarmed dial, and a readout that implied
 * otherwise would be exactly the flourish CLAUDE.md forbids.
 */

const base: Playbook = {
  id: "TEST-PLAY",
  symbols: ["NVDA"],
  thesis: "a test play",
  evidence: "none — a fixture",
  size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
  desiredState: () => "no-window",
};

const verdict = (mode: PlaybookMode = "standard"): PlaybookVerdict[] => [
  { playbookId: "TEST-PLAY", mode, state: "long" },
];

const ladderFor = (playbook: Playbook, mode: PlaybookMode = "standard") =>
  safeguardLadderView(verdict(mode), () => playbook);

const stages = (playbook: Playbook, mode: PlaybookMode = "standard") => {
  const found = ladderFor(playbook, mode)[0]?.stages;
  if (!found) throw new Error("the fixture resolves, so its stages are never null");
  return found;
};

describe("safeguardLadderView — stage 1, price and news disagreeing", () => {
  it("reads off for a play that never opted the detector in", () => {
    const stage = stages(base)[0];
    expect(stage?.state).toBe("off");
    expect(stage?.does).toContain("Nothing checks");
  });

  it("reads watching, and says no order is held back, for an observe-only opt-in", () => {
    const stage = stages({ ...base, mixedSignals: { action: "observe" } })[0];
    expect(stage?.state).toBe("watching");
    expect(stage?.does).toContain("no order is held back");
  });

  it("quotes the play's own floors, not the defaults, when it overrides them", () => {
    const stage = stages({
      ...base,
      mixedSignals: { action: "observe", momentumFloor: 0.05, sentimentFloor: 0.4 },
    })[0];
    expect(stage?.does).toContain("5.0%");
    expect(stage?.does).toContain("0.40");
    expect(stage?.does).not.toContain("2.0%");
  });
});

describe("safeguardLadderView — stage 2, the automatic exit", () => {
  const dialled = (mode: PlaybookMode, enforcement: "enforce" | "alert-only"): Playbook => ({
    ...base,
    exitSafety: { [mode]: { drawdownTripPct: 0.08, enforcement } },
  });

  it("reads off for a play with no dial on the mode it is running", () => {
    const stage = stages(dialled("aggressive", "enforce"), "standard")[1];
    expect(stage?.state).toBe("off");
    expect(stage?.does).toContain("No automatic exit on standard");
  });

  it("names the trip line and the full-position sell when the mode enforces", () => {
    const stage = stages(dialled("standard", "enforce"))[1];
    expect(stage?.state).toBe("enforcing");
    expect(stage?.does).toContain("8.0%");
    expect(stage?.does).toContain("Sells the whole position");
  });

  it("says plainly that an alert-only trip reaches nobody yet", () => {
    // `exitSafetyIntents` returns its trips and `playbookIntents` — the live path's only caller —
    // drops them. Until slice 6b delivers that notice, "you will be alerted" would be a lie.
    const stage = stages(dialled("standard", "alert-only"))[1];
    expect(stage?.state).toBe("alert-only");
    expect(stage?.does).toContain("Will not sell");
    expect(stage?.does).toContain("nothing delivers that notice to you yet");
  });
});

describe("safeguardLadderView — what it reports per play", () => {
  it("carries the id and mode the bot's own pass reported", () => {
    expect(ladderFor(base, "aggressive")[0]).toMatchObject({
      playbookId: "TEST-PLAY",
      mode: "aggressive",
    });
  });

  it("returns null stages for a play the house roster does not know", () => {
    const entry = safeguardLadderView(verdict(), () => undefined)[0];
    expect(entry?.stages).toBeNull();
    expect(entry?.playbookId).toBe("TEST-PLAY");
  });

  it("is empty for a pass that ran no playbooks, never a fabricated row", () => {
    expect(safeguardLadderView([])).toEqual([]);
  });
});

/**
 * The falsifier from #3194's state block, as a gate: the readout is wrong the moment it claims a
 * stage acts when the code only logs. Run against the REAL roster so arming a play without
 * widening this view fails here rather than on a member's screen.
 */
/** What stage 2's word must be for a play's dial on one mode — the mapping, stated once. */
function expectedExitState(playbook: Playbook, mode: PlaybookMode): string {
  const dial = playbook.exitSafety?.[mode];
  if (!dial) return "off";
  return dial.enforcement === "enforce" ? "enforcing" : "alert-only";
}

describe("safeguardLadderView — against the live roster", () => {
  for (const { id } of playbookRoster()) {
    for (const mode of ["conservative", "standard", "aggressive"] as const) {
      it(`tells the truth about ${id} on ${mode}`, () => {
        const playbook = findPlaybook(id);
        if (!playbook) throw new Error(`${id} is in the roster but not findable`);
        const [one, two] = stages(playbook, mode);
        expect(one?.state).toBe(playbook.mixedSignals ? "watching" : "off");
        expect(two?.state).toBe(expectedExitState(playbook, mode));
      });
    }
  }

  it("never lets an observe-only opt-in claim it holds an order back", () => {
    for (const { id } of playbookRoster()) {
      const playbook = findPlaybook(id);
      if (playbook?.mixedSignals?.action !== "observe") continue;
      expect(stages(playbook)[0]?.does).toContain("no order is held back");
    }
  });

  // The other half of that guard: a setting this view has not been taught must never inherit the
  // observe-only sentence. `action` is a one-member union today, so the case is reached by hand.
  it("refuses to call an unrecognised setting passive", () => {
    const widened = {
      ...base,
      mixedSignals: { action: "pause-entries" as unknown as "observe" },
    };
    const stage = stages(widened)[0];
    expect(stage?.does).not.toContain("no order is held back");
    expect(stage?.does).toContain("newer than this page");
  });
});
