import type { EarningsPrint } from "../../src/domain/earnings-calendar.js";
import { nextSession } from "../../src/domain/market-calendar.js";
import {
  CRWV_WHEEL,
  enabledPlaybooks,
  findPlaybook,
  G1_GOOG,
  NVDA_CALL_SPREAD,
  PLAYBOOK_WIRING_GAPS,
  playbookRoster,
  S1_NVDA,
  SAURON,
  TACO_DJT,
} from "../../src/playbooks/registry.js";

const cal = (symbol: string, date: string, status: EarningsPrint["status"]): EarningsPrint[] => [
  { symbol, date, status, source: "test" },
];

const spreadWindow = NVDA_CALL_SPREAD.desiredState;

describe("S1-NVDA window", () => {
  // D-numbers are TRADING SESSIONS (#4776). Before an 08-26 print: D-20 is 07-29, D-6 is 08-18,
  // D-5 is 08-19.
  const confirmed = cal("NVDA", "2026-08-26", "confirmed");

  it("wants long inside D-20..D-6 on a confirmed date, counted in sessions", () => {
    expect(S1_NVDA.desiredState("2026-07-28T15:00:00Z", confirmed)).toBe("no-window"); // D-21
    expect(S1_NVDA.desiredState("2026-07-29T15:00:00Z", confirmed)).toBe("long"); // D-20
    expect(S1_NVDA.desiredState("2026-08-10T15:00:00Z", confirmed)).toBe("long"); // D-12
    expect(S1_NVDA.desiredState("2026-08-18T15:00:00Z", confirmed)).toBe("long"); // D-6
  });

  it("stays dark on an ESTIMATE — the date policy, enforced", () => {
    expect(
      S1_NVDA.desiredState("2026-08-10T15:00:00Z", cal("NVDA", "2026-08-26", "estimate")),
    ).toBe("no-window");
  });

  it("wants flat from D-5 through the print — the dead-week exit", () => {
    expect(S1_NVDA.desiredState("2026-08-19T15:00:00Z", confirmed)).toBe("flat"); // D-5
    expect(S1_NVDA.desiredState("2026-08-26T15:00:00Z", confirmed)).toBe("flat"); // D
  });

  it("reads a weekend as the session before it", () => {
    // 08-01 is the Saturday after D-19 (07-31): still in the window.
    expect(S1_NVDA.desiredState("2026-08-01T15:00:00Z", confirmed)).toBe("long");
    // 08-22 is the Saturday after D-3: still flat.
    expect(S1_NVDA.desiredState("2026-08-22T15:00:00Z", confirmed)).toBe("flat");
  });

  it("has no window far out or with no print scheduled", () => {
    expect(S1_NVDA.desiredState("2026-07-01T15:00:00Z", confirmed)).toBe("no-window"); // D-39
    expect(S1_NVDA.desiredState("2026-08-10T15:00:00Z", [])).toBe("no-window");
  });
});

describe("S1-NVDA trades the window NVDA-CALL-SPREAD and the research count (#4776)", () => {
  const print = cal("NVDA", "2026-11-18", "confirmed");
  /** Every session from 10-01 to 11-20, at 11:00 ET. */
  const sessions = (from: string, to: string): string[] => {
    const days: string[] = [];
    for (let at = from; at <= to; at = nextSession(at)) days.push(at);
    return days;
  };

  it("holds long 10-21 (D-20) through 11-10 (D-6) and flat on 11-11 (D-5) for an 11-18 print", () => {
    expect(S1_NVDA.desiredState("2026-10-20T15:00:00Z", print)).toBe("no-window");
    expect(S1_NVDA.desiredState("2026-10-21T15:00:00Z", print)).toBe("long");
    expect(S1_NVDA.desiredState("2026-11-10T15:00:00Z", print)).toBe("long");
    expect(S1_NVDA.desiredState("2026-11-11T15:00:00Z", print)).toBe("flat");
  });

  it("matches spreadWindow on every session from 10-01 to 11-20", () => {
    for (const day of sessions("2026-10-01", "2026-11-20")) {
      const asOf = `${day}T15:00:00Z`;
      expect({ day, state: S1_NVDA.desiredState(asOf, print) }).toEqual({
        day,
        state: spreadWindow(asOf, print),
      });
    }
  });

  it("opens on the first cycle after a late confirmation, as the spread does", () => {
    // NVIDIA's notice lands 10-28 (D-15): the row flips then, and S1 opens that same session.
    const estimate = cal("NVDA", "2026-11-18", "estimate");
    expect(S1_NVDA.desiredState("2026-10-27T15:00:00Z", estimate)).toBe("no-window");
    expect(S1_NVDA.desiredState("2026-10-28T15:00:00Z", print)).toBe("long");
    expect(spreadWindow("2026-10-28T15:00:00Z", print)).toBe("long");
  });
});

describe("G1-GOOG window", () => {
  const confirmed = cal("GOOG", "2026-10-28", "confirmed");

  it("wants long from D-20 to D-1 on a confirmed date, counted in sessions", () => {
    // D-20 before a 10-28 print is 09-30, the day the GOOG ledger counts from — not 10-08.
    expect(G1_GOOG.desiredState("2026-09-29T15:00:00Z", confirmed)).toBe("no-window"); // D-21
    expect(G1_GOOG.desiredState("2026-09-30T15:00:00Z", confirmed)).toBe("long"); // D-20
    expect(G1_GOOG.desiredState("2026-10-08T15:00:00Z", confirmed)).toBe("long"); // D-14
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

  it("arms no option play by default — only a subscription does — and neither is marked unwired", () => {
    expect(enabledPlaybooks({}).enabled).toEqual([]);
    // The Alpaca option order flow is live (#4679): nothing stands between a subscription and a trade.
    expect(PLAYBOOK_WIRING_GAPS["CRWV-WHEEL"]).toBeUndefined();
    expect(PLAYBOOK_WIRING_GAPS["NVDA-CALL-SPREAD"]).toBeUndefined();
  });

  it("refuses HC-SAURON by name since it was dissolved (2026-10-16), arming the rest of the roster", () => {
    // A stale env token must read as a refusal on the boot line, never crash a bot or arm nothing.
    expect(enabledPlaybooks({ SKYNET_PLAYBOOKS: "HC-SAURON:standard,SAURON:aggressive" })).toEqual({
      enabled: [{ playbook: SAURON, mode: "aggressive" }],
      rejected: ["HC-SAURON:standard"],
    });
    expect(findPlaybook("HC-SAURON")).toBeUndefined();
    expect(PLAYBOOK_WIRING_GAPS["HC-SAURON"]).toBeUndefined();
  });

  it("arms a playbook once: the first token wins and each repeat is refused by name", () => {
    expect(
      enabledPlaybooks({
        SKYNET_PLAYBOOKS: "SAURON,S1-NVDA,SAURON:aggressive,S1-NVDA:conservative,G1-GOOG",
      }),
    ).toEqual({
      enabled: [
        { playbook: SAURON, mode: "standard" },
        { playbook: S1_NVDA, mode: "standard" },
        { playbook: G1_GOOG, mode: "standard" },
      ],
      rejected: ["SAURON:aggressive (repeated)", "S1-NVDA:conservative (repeated)"],
    });
  });

  it("registers SAURON, his own rules (#4651) — on no default roster, never marked unwired", () => {
    expect(enabledPlaybooks({}).enabled).toEqual([]);
    expect(enabledPlaybooks({ SKYNET_PLAYBOOKS: "SAURON:aggressive" })).toEqual({
      enabled: [{ playbook: SAURON, mode: "aggressive" }],
      rejected: [],
    });
    expect(PLAYBOOK_WIRING_GAPS.SAURON).toBeUndefined();
  });
});

describe("findPlaybook", () => {
  it("resolves each known house playbook by id", () => {
    expect(findPlaybook("S1-NVDA")).toBe(S1_NVDA);
    expect(findPlaybook("G1-GOOG")).toBe(G1_GOOG);
    expect(findPlaybook("TACO-DJT")).toBe(TACO_DJT);
    expect(findPlaybook("CRWV-WHEEL")).toBe(CRWV_WHEEL);
    expect(findPlaybook("NVDA-CALL-SPREAD")).toBe(NVDA_CALL_SPREAD);
    expect(findPlaybook("SAURON")).toBe(SAURON);
  });

  it("returns undefined for an unknown id", () => {
    expect(findPlaybook("NOT-A-PLAYBOOK")).toBeUndefined();
  });
});

describe("playbookRoster", () => {
  it("lists every house play's id and symbol, unfiltered by SKYNET_PLAYBOOKS", () => {
    expect(playbookRoster()).toEqual([
      { id: "S1-NVDA", symbol: "NVDA" },
      { id: "G1-GOOG", symbol: "GOOG" },
      { id: "TACO-DJT", symbol: TACO_DJT.symbols[0] },
      { id: "CRWV-WHEEL", symbol: "CRWV" },
      { id: "CRWV-LONG-CALL", symbol: "CRWV" },
      { id: "NVDA-LONG-LEAP", symbol: "NVDA" },
      { id: "NVDA-CALL-SPREAD", symbol: "NVDA" },
      { id: "SAURON", symbol: SAURON.symbols[0] },
      { id: "MU-DIP-BOUNCE", symbol: "MU" },
      { id: "NBIS-DIP-BOUNCE", symbol: "NBIS" },
    ]);
  });
});
