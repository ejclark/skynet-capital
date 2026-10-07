import { BETA_SCOUT_ID } from "../../src/playbooks/beta-scout.js";
import { initiatorOf } from "../../src/playbooks/initiator.js";

/**
 * Who started one recorded intent (#4450 slice 4, EARS 3) — derived from the row's playbook id and
 * its decision's persona id, both on every row the store has ever written, so every past row
 * classifies the same way (the backfill is the derivation).
 */
describe("initiatorOf", () => {
  it("reads the forced pick as forced, whichever persona filed it", () => {
    expect(initiatorOf(BETA_SCOUT_ID, "beta-scout")).toBe("forced");
    expect(initiatorOf(BETA_SCOUT_ID, "sauron")).toBe("forced");
  });

  it("reads an order with no playbook behind it as the bot's own rules", () => {
    expect(initiatorOf(undefined, "vader")).toBe("persona");
    expect(initiatorOf("", "vader")).toBe("persona");
  });

  it("reads a house playbook's order as a playbook's", () => {
    expect(initiatorOf("S1-NVDA", "sauron")).toBe("playbook");
    expect(initiatorOf("CRWV-WHEEL", "council")).toBe("playbook");
  });

  it("reads a member-authored play, absent from the house registry, as a playbook's", () => {
    expect(initiatorOf("U-abc123", "vader")).toBe("playbook");
  });

  it("reads SAURON on Sauron's own account as his own rules, and on another bot as a playbook", () => {
    // On his account the stamp only makes his reflexes attributable (`sauron-rules.ts`).
    expect(initiatorOf("SAURON", "sauron")).toBe("persona");
    expect(initiatorOf("SAURON", "vader")).toBe("playbook");
  });
});
