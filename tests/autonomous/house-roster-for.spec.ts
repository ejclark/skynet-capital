import { envNamedFor } from "../../src/autonomous/house-roster-wire.js";

describe("envNamedFor — what the bots app's own setting runs on one account", () => {
  const report = {
    accounts: ["bot-a"],
    roster: [
      { playbookId: "S1-NVDA", mode: "standard" as const },
      { playbookId: "CRWV-WHEEL", mode: "aggressive" as const },
    ],
  };

  it("lists the ids in the bots' order for an account the report names", () => {
    expect(envNamedFor(report, "bot-a")).toEqual(["S1-NVDA", "CRWV-WHEEL"]);
  });

  it("says not known — never an empty list — for another account or no report", () => {
    expect(envNamedFor(report, "bot-b")).toBeUndefined();
    expect(envNamedFor(undefined, "bot-a")).toBeUndefined();
  });
});
