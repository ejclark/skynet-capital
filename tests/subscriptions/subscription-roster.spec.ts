import type { PlaybookSubscription } from "../../src/domain/types.js";
import { authoredRoster } from "../../src/playbooks/authored-play.js";
import type { EnabledPlaybook } from "../../src/playbooks/playbook.js";
import { G1_GOOG, S1_NVDA, TACO_DJT } from "../../src/playbooks/registry.js";
import { mergeRosters, subscriptionRoster } from "../../src/subscriptions/subscription-roster.js";

const sub = (overrides: Partial<PlaybookSubscription> = {}): PlaybookSubscription => ({
  accountId: "bot-1",
  playbookId: "S1-NVDA",
  mode: "standard",
  capitalAllocated: 5_000,
  enabled: true,
  createdAt: "2026-08-29T00:00:00.000Z",
  updatedAt: "2026-08-29T00:00:00.000Z",
  ...overrides,
});

describe("subscriptionRoster", () => {
  it("resolves an enabled subscription to its house playbook", () => {
    const { enabled, rejected } = subscriptionRoster([sub()]);
    expect(enabled).toEqual([{ playbook: S1_NVDA, mode: "standard" }]);
    expect(rejected).toEqual([]);
  });

  it("resolves multiple subscriptions, preserving each one's own mode", () => {
    const { enabled } = subscriptionRoster([
      sub({ playbookId: "S1-NVDA", mode: "conservative" }),
      sub({ playbookId: "G1-GOOG", mode: "aggressive" }),
    ]);
    expect(enabled).toEqual([
      { playbook: S1_NVDA, mode: "conservative" },
      { playbook: G1_GOOG, mode: "aggressive" },
    ]);
  });

  it("skips a disabled subscription entirely — not even reported as rejected", () => {
    const { enabled, rejected } = subscriptionRoster([sub({ enabled: false })]);
    expect(enabled).toEqual([]);
    expect(rejected).toEqual([]);
  });

  it("rejects a subscription naming a playbook id that doesn't exist in the house roster", () => {
    const { enabled, rejected } = subscriptionRoster([sub({ playbookId: "NOT-A-PLAYBOOK" })]);
    expect(enabled).toEqual([]);
    expect(rejected).toEqual(["NOT-A-PLAYBOOK"]);
  });

  it("is empty for an empty subscription list", () => {
    expect(subscriptionRoster([])).toEqual({ enabled: [], rejected: [] });
  });
});

/**
 * The own-account rule (#809 slice 2), checked rather than asserted in prose: an authored play is
 * reachable only from a subscription belonging to the account it was compiled for.
 */
describe("subscriptionRoster with an authored play", () => {
  const authored = authoredRoster(
    [
      {
        slug: "earnings-runup",
        authorAccountId: "bot-1",
        authorDisplayName: "Ada",
        symbols: ["NVDA"],
        thesis: "long the pre-print drift, out before the dead final week",
        trigger: { kind: "pre-print-window", enterDaysBefore: 20, exitDaysBefore: 6 },
        size: { conservative: 0.01, standard: 0.02, aggressive: 0.03 },
      },
    ],
    "bot-1",
  );
  const authoredSub = sub({ playbookId: "U-bot-1-earnings-runup" });

  it("resolves the author's own subscription to their compiled play", () => {
    const { enabled, rejected } = subscriptionRoster([authoredSub], authored);
    expect(enabled).toEqual([{ playbook: authored.plays[0], mode: "standard" }]);
    expect(rejected).toEqual([]);
  });

  it("refuses another account's subscription to the same play — it never reaches their book", () => {
    const { enabled, rejected } = subscriptionRoster(
      [sub({ accountId: "bot-2", playbookId: "U-bot-1-earnings-runup" })],
      authored,
    );
    expect(enabled).toEqual([]);
    expect(rejected).toEqual(["U-bot-1-earnings-runup"]);
  });

  it("still resolves house plays alongside it", () => {
    const { enabled } = subscriptionRoster([sub(), authoredSub], authored);
    expect(enabled).toEqual([
      { playbook: S1_NVDA, mode: "standard" },
      { playbook: authored.plays[0], mode: "standard" },
    ]);
  });

  it("rejects an authored id when no authored roster was supplied — today's every caller", () => {
    expect(subscriptionRoster([authoredSub]).rejected).toEqual(["U-bot-1-earnings-runup"]);
  });
});

describe("mergeRosters", () => {
  const house: EnabledPlaybook = { playbook: S1_NVDA, mode: "standard" };
  const houseGoog: EnabledPlaybook = { playbook: G1_GOOG, mode: "conservative" };

  it("passes the base through untouched when there are no overrides", () => {
    expect(mergeRosters([house, houseGoog], [])).toEqual([house, houseGoog]);
  });

  it("appends an override for a playbook the base doesn't have", () => {
    const override: EnabledPlaybook = { playbook: TACO_DJT, mode: "aggressive" };
    expect(mergeRosters([house], [override])).toEqual([house, override]);
  });

  it("an override replaces the base entry for the same playbook id, not duplicates it", () => {
    const override: EnabledPlaybook = { playbook: S1_NVDA, mode: "aggressive" };
    const result = mergeRosters([house, houseGoog], [override]);
    expect(result).toEqual([houseGoog, override]);
    expect(result.filter((e) => e.playbook.id === "S1-NVDA")).toHaveLength(1);
  });

  it("is empty when both base and overrides are empty", () => {
    expect(mergeRosters([], [])).toEqual([]);
  });
});
