import type { PlaybookSubscription } from "../../src/domain/types.js";
import { CONVICTIONS } from "../../src/playbooks/conviction-store.js";
import { findPair } from "../../src/playbooks/pair-table.js";
import type { MemberPointers } from "../../src/subscriptions/conviction-pointer.js";
import { pairViewId } from "../../src/subscriptions/pair-conviction.js";
import { ownViewsToState, statedOnFor } from "../../src/subscriptions/pair-conviction-migration.js";
import { carriedReason } from "../../src/subscriptions/row-conviction.js";
import { aMemberConviction } from "../support/member-conviction.js";

/**
 * #5482 contract piece 3, the poll migration — a ◆ row's conviction no single record steers becomes
 * the owner's own view on the pair, and the pointer pass then points at it. Its inline branch went
 * with the inline field (the last contract piece, after the live count read zero copies, #6046).
 */

const NOW = new Date("2026-10-22T15:00:00Z");
const _AI_DIP = CONVICTIONS.get("ai-dip-2026-10");
const _OWN_DAY = { reason: "Sauron's own rules hold through the print.", checkOn: "2027-04-30" };
const NONE: MemberPointers = { heldBy: () => [], ids: new Set() };
const name = (id: string) => (id === "sauron" ? "Sauron" : id);

const sub = (
  playbookId: string,
  extra: Partial<PlaybookSubscription> = {},
): PlaybookSubscription => ({
  accountId: "sauron",
  playbookId,
  mode: "standard",
  enabled: true,
  createdAt: "2026-10-01T14:00:00.000Z",
  updatedAt: "2026-10-01T14:00:00.000Z",
  ...extra,
});

describe("which subscriptions get their owner's own view (ownViewsToState)", () => {
  it("WHEN the pointer rule already resolves a pair (the seeded day, or a held view), nothing is written", () => {
    const own = aMemberConviction({ id: pairViewId("sauron", "SAURON"), steers: ["SAURON"] });
    const held: MemberPointers = {
      heldBy: () => [{ ...own, scope: "pair", narrowings: [] }],
      ids: new Set([own.id]),
    };
    const state = { sauron: [sub("CRWV-WHEEL"), sub("CRWV-LONG-CALL"), sub("SAURON")] };
    expect(ownViewsToState(state, NOW, held, name)).toEqual([]);
  });

  it("WHEN a subscription states no conviction on a pair that is not ◆, nothing is written", () => {
    expect(ownViewsToState({ sauron: [sub("SAURON")] }, NOW, NONE, name)).toEqual([]);
  });

  it("WHEN a ◆ row no single record steers is subscribed with no conviction, its row's conviction becomes the view", () => {
    const [carried] = ownViewsToState({ sauron: [sub("CRWV-WHEEL")] }, NOW, NONE, name, []);
    const pair = findPair("CRWV-WHEEL");
    expect(carried?.view).toMatchObject({
      checkOn: pair?.evidence.checkOn,
      claims: [{ statement: pair && carriedReason(pair) }],
      steers: ["CRWV-WHEEL"],
    });
  });
});

describe("the day a migrated view is stated (statedOnFor)", () => {
  it("is today while the check day is ahead", () => {
    expect(statedOnFor(sub("SAURON"), "2027-04-30", NOW)).toBe("2026-10-22");
  });

  it("is the subscription's start day once the check day passed (a latched failure)", () => {
    expect(statedOnFor(sub("SAURON"), "2026-10-20", NOW)).toBe("2026-10-01");
  });

  it("is the day before the check when the subscription started on or after it", () => {
    const late = sub("SAURON", { createdAt: "2026-10-21T14:00:00.000Z" });
    expect(statedOnFor(late, "2026-10-20", NOW)).toBe("2026-10-19");
    expect(statedOnFor(late, "2026-10-21", NOW)).toBe("2026-10-20");
  });
});
