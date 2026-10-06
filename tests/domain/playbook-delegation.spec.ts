import {
  DELEGATION_LOCKED_NOTE,
  DELEGATION_RUNG,
  DELEGATION_RUNG_NAME,
  delegationGateView,
  delegationLocked,
  raisesDelegation,
} from "../../src/domain/playbook-delegation.js";
import { TRADE_TYPES, type TradeTypeCode } from "../../src/domain/trade-types.js";
import type { PlaybookSubscription } from "../../src/domain/types.js";

const progression = (wheels: boolean, earned: readonly TradeTypeCode[]) => ({
  wheels,
  earnedByCode: new Map(earned.map((code) => [code, { code }])) as ReadonlyMap<
    TradeTypeCode,
    unknown
  >,
});

describe("the playbook delegation fog (#1707)", () => {
  it("names a rung that actually exists in the ladder catalog", () => {
    // docs/FOG-OF-WAR.md criterion 5 — a fog is honest only when its unlock is earnable.
    const rung = TRADE_TYPES.find((t) => t.code === DELEGATION_RUNG);
    expect(rung).toBeDefined();
    expect(DELEGATION_RUNG_NAME).toBe(rung?.name);
  });

  it("locks delegation while wheels are on and the rung is unearned", () => {
    expect(delegationLocked(progression(true, []))).toBe(true);
    expect(delegationLocked(progression(true, ["101"]))).toBe(true);
  });

  it("opens once the rung is earned by a real fill", () => {
    expect(delegationLocked(progression(true, ["101", DELEGATION_RUNG]))).toBe(false);
  });

  it("never fogs a member with the wheels off", () => {
    expect(delegationLocked(progression(false, []))).toBe(false);
  });

  it("reads absence as wheels-off — no progression never invents a restriction", () => {
    expect(delegationLocked(undefined)).toBe(false);
  });

  it("draws the door with the rung named, locked or not", () => {
    for (const locked of [true, false]) {
      expect(delegationGateView(locked)).toEqual({
        locked,
        unlocksAfter: DELEGATION_RUNG,
        unlocksAfterName: DELEGATION_RUNG_NAME,
        note: DELEGATION_LOCKED_NOTE,
      });
    }
  });

  it("states what the rung teaches rather than warning the member off", () => {
    // docs/FOG-OF-WAR.md criterion 9 — the house voice, not "DANGER: advanced".
    expect(DELEGATION_LOCKED_NOTE).toContain(DELEGATION_RUNG);
    expect(DELEGATION_LOCKED_NOTE).toContain(DELEGATION_RUNG_NAME);
    expect(DELEGATION_LOCKED_NOTE.toLowerCase()).not.toContain("danger");
    expect(DELEGATION_LOCKED_NOTE.toLowerCase()).not.toContain("warning");
  });
});

describe("raisesDelegation (#4649) — only an edit that hands the bot MORE is behind the fog", () => {
  const prior: PlaybookSubscription = {
    accountId: "sauron",
    playbookId: "HC-SAURON",
    mode: "standard",
    capitalAllocated: 5_000,
    enabled: true,
    createdAt: "t",
    updatedAt: "t",
    symbols: ["NVDA", "CRWV"],
  };
  const same = { mode: prior.mode, capitalAllocated: 5_000, symbols: ["NVDA", "CRWV"] } as const;

  it("an unchanged or strictly lower edit delegates nothing more", () => {
    expect(raisesDelegation(prior, same)).toBe(false);
    expect(
      raisesDelegation(prior, { ...same, mode: "conservative", capitalAllocated: 1_000 }),
    ).toBe(false);
    expect(raisesDelegation(prior, { ...same, symbols: ["NVDA"] })).toBe(false);
  });

  it.each([
    ["a bigger mode", { ...same, mode: "aggressive" as const }],
    ["more capital", { ...same, capitalAllocated: 6_000 }],
    ["uncapped", { mode: same.mode, symbols: same.symbols }],
    ["a symbol added", { ...same, symbols: ["NVDA", "CRWV", "AMD"] }],
    ["the filter cleared to the whole basket", { ...same, symbols: [] }],
    ["compounding switched on", { ...same, compoundAllocation: true }],
  ])("%s delegates more", (_label, next) => {
    expect(raisesDelegation(prior, next)).toBe(true);
  });

  it("capping an uncapped subscription is a reduction, at any figure", () => {
    const { capitalAllocated: _cap, ...uncapped } = prior;
    expect(raisesDelegation(uncapped, { ...same, capitalAllocated: 50_000 })).toBe(false);
  });
});
