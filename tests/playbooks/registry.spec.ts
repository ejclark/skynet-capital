import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import {
  enabledPlaybooks,
  findPlaybook,
  G1_GOOG,
  S1_NVDA,
  TACO_DJT,
} from "../../src/playbooks/registry.js";

const cal = (symbol: string, date: string, status: EarningsPrint["status"]): EarningsPrint[] => [
  { symbol, date, status, source: "test" },
];

describe("S1-NVDA window", () => {
  const confirmed = cal("NVDA", "2026-08-26", "confirmed");

  it("wants long inside D-20..D-6 on a confirmed date", () => {
    expect(S1_NVDA.desiredState("2026-08-10T15:00:00Z", confirmed)).toBe("long"); // D-16
    expect(S1_NVDA.desiredState("2026-08-20T15:00:00Z", confirmed)).toBe("long"); // D-6
  });

  it("stays dark on an ESTIMATE — the date policy, enforced", () => {
    expect(
      S1_NVDA.desiredState("2026-08-10T15:00:00Z", cal("NVDA", "2026-08-26", "estimate")),
    ).toBe("no-window");
  });

  it("wants flat from D-5 through the print — the dead-week exit", () => {
    expect(S1_NVDA.desiredState("2026-08-21T15:00:00Z", confirmed)).toBe("flat"); // D-5
    expect(S1_NVDA.desiredState("2026-08-26T15:00:00Z", confirmed)).toBe("flat"); // D
  });

  it("has no window far out or with no print scheduled", () => {
    expect(S1_NVDA.desiredState("2026-07-01T15:00:00Z", confirmed)).toBe("no-window"); // D-56
    expect(S1_NVDA.desiredState("2026-08-10T15:00:00Z", [])).toBe("no-window");
  });
});

describe("G1-GOOG window", () => {
  const confirmed = cal("GOOG", "2026-10-28", "confirmed");

  it("wants long inside D-20..D-1 on a confirmed date", () => {
    expect(G1_GOOG.desiredState("2026-10-08T15:00:00Z", confirmed)).toBe("long"); // D-20
    expect(G1_GOOG.desiredState("2026-10-27T15:00:00Z", confirmed)).toBe("long"); // D-1
  });

  it("rides print day until the close, then exits BEFORE the release", () => {
    // 15:00 UTC = 11:00 ET (EDT) — still riding.
    expect(G1_GOOG.desiredState("2026-10-28T15:00:00Z", confirmed)).toBe("long");
    // 19:50 UTC = 15:50 ET — inside the exit window before the 16:00 close.
    expect(G1_GOOG.desiredState("2026-10-28T19:50:00Z", confirmed)).toBe("flat");
  });

  it("failsafes to flat in the days after a print — a missed close exit is never carried", () => {
    expect(G1_GOOG.desiredState("2026-10-29T13:35:00Z", confirmed)).toBe("flat"); // D+1
    expect(G1_GOOG.desiredState("2026-10-31T13:35:00Z", confirmed)).toBe("flat"); // D+3
    // Beyond the hygiene window the table entry is ancient history, not a signal.
    expect(G1_GOOG.desiredState("2026-11-10T13:35:00Z", confirmed)).toBe("no-window");
  });

  it("S1 shares the same post-print hygiene", () => {
    expect(
      S1_NVDA.desiredState("2026-08-27T13:35:00Z", cal("NVDA", "2026-08-26", "confirmed")),
    ).toBe("flat"); // D+1
  });

  it("stays dark on an estimate", () => {
    expect(
      G1_GOOG.desiredState("2026-10-08T15:00:00Z", cal("GOOG", "2026-10-28", "estimate")),
    ).toBe("no-window");
  });
});

describe("enabledPlaybooks env parsing", () => {
  it("is empty (all dark) with no env — the safe default", () => {
    expect(enabledPlaybooks({})).toEqual({ enabled: [], rejected: [] });
  });

  it("parses id:mode pairs, defaulting mode to standard", () => {
    const { enabled, rejected } = enabledPlaybooks({
      SKYNET_PLAYBOOKS: "S1-NVDA:conservative, G1-GOOG",
    });
    expect(rejected).toEqual([]);
    expect(enabled.map((e) => `${e.playbook.id}:${e.mode}`)).toEqual([
      "S1-NVDA:conservative",
      "G1-GOOG:standard",
    ]);
  });

  it("REFUSES unknown ids and malformed modes loudly instead of silently enabling nothing", () => {
    const { enabled, rejected } = enabledPlaybooks({
      SKYNET_PLAYBOOKS: "S9-FAKE:standard,S1-NVDA:reckless",
    });
    expect(enabled).toEqual([]);
    expect(rejected).toEqual(["S9-FAKE:standard", "S1-NVDA:reckless"]);
  });

  it("recognises TACO-DJT — registered, but still dark unless named", () => {
    expect(enabledPlaybooks({})).toEqual({ enabled: [], rejected: [] });
    const { enabled, rejected } = enabledPlaybooks({ SKYNET_PLAYBOOKS: "TACO-DJT:conservative" });
    expect(rejected).toEqual([]);
    expect(enabled).toEqual([{ playbook: TACO_DJT, mode: "conservative" }]);
  });
});

describe("findPlaybook", () => {
  it("resolves each known house playbook by id", () => {
    expect(findPlaybook("S1-NVDA")).toBe(S1_NVDA);
    expect(findPlaybook("G1-GOOG")).toBe(G1_GOOG);
    expect(findPlaybook("TACO-DJT")).toBe(TACO_DJT);
  });

  it("returns undefined for an unknown id", () => {
    expect(findPlaybook("NOT-A-PLAYBOOK")).toBeUndefined();
  });
});
