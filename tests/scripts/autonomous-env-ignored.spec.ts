import type { ControlsState } from "../../src/autonomous/bot-controls.js";
import { ignoredEnvSettings } from "../../src/scripts/autonomous-env-ignored.js";

const env = {
  hardcore: new Set(["sauron"]),
  betaPicks: 2,
  betaStage: true,
  hostId: "sauron",
};

describe("ignoredEnvSettings — a value the env still asks for but the bots no longer obey (#4535 4c-2)", () => {
  it("says nothing when every env value has its stored copy", () => {
    const stored: ControlsState = {
      bots: { sauron: { hardcore: true, betaPicks: 2, betaStage: true } },
    };
    expect(ignoredEnvSettings(stored, env)).toEqual([]);
  });

  it("names each value the store lacks, and where to put it", () => {
    const lines = ignoredEnvSettings({ bots: {} }, env);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("sauron has no stored hardcore setting");
    expect(lines[1]).toContain("no stored forced-pick count");
    expect(lines[2]).toContain("will not stage");
    for (const line of lines) expect(line).toContain("Settings card");
  });

  it("treats an owner's stored false as a decision, not a gap", () => {
    const stored: ControlsState = {
      bots: { sauron: { hardcore: false, betaPicks: 0, betaStage: false } },
    };
    expect(ignoredEnvSettings(stored, env)).toEqual([]);
  });

  it("says nothing about picks or staging when the env asks for none", () => {
    expect(ignoredEnvSettings({ bots: {} }, { ...env, hardcore: new Set(), betaPicks: 0 })).toEqual(
      [],
    );
  });
});
