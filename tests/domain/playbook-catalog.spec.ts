import {
  derivePlaybooks,
  HUMAN_PLAYBOOKS,
  PLAYBOOKS_MILESTONE,
} from "../../src/domain/playbook-catalog.js";
import { TRADE_TYPES } from "../../src/domain/trade-types.js";

describe("the human playbook catalog (M·03, WIP)", () => {
  it("has four playbooks, each unlocked by a rung the ladder actually has", () => {
    expect(HUMAN_PLAYBOOKS).toHaveLength(4);
    const codes = new Set(TRADE_TYPES.map((t) => t.code));
    expect(HUMAN_PLAYBOOKS.every((p) => codes.has(p.unlocksAfter))).toBe(true);
    expect(PLAYBOOKS_MILESTONE.code).toBe("M·03");
  });

  it("unlocks nothing from no fills", () => {
    const view = derivePlaybooks(new Set());
    expect(view.unlocked).toBe(0);
    expect(view.total).toBe(4);
    expect(view.playbooks.every((p) => !p.unlocked)).toBe(true);
  });

  it("unlocks exactly the playbooks whose rung is earned, naming the rung", () => {
    const view = derivePlaybooks(new Set(["101", "102", "201"] as const));
    expect(view.playbooks.map((p) => [p.id, p.unlocked])).toEqual([
      ["accumulator", true],
      ["wheel-put", true],
      ["wheel-call", false],
      ["hedge", false],
    ]);
    expect(view.unlocked).toBe(2);
    expect(view.playbooks[0]?.unlocksAfterName).toBe("Sell stock");
  });

  it("states the Season-1 criteria as coming, never as met — every playbook carries one", () => {
    expect(HUMAN_PLAYBOOKS.every((p) => p.seasonOneCriteria.length > 0)).toBe(true);
  });
});
