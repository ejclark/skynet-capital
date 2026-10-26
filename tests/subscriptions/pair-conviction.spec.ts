import type { PlaybookSubscription } from "../../src/domain/types.js";
import { convictionProblems } from "../../src/playbooks/conviction-record.js";
import { SEEDED_CONVICTIONS } from "../../src/playbooks/conviction-seeds.js";
import { ConvictionStore } from "../../src/playbooks/conviction-store.js";
import { findPair } from "../../src/playbooks/pair-table.js";
import {
  asOwnConviction,
  pairView,
  pairViewId,
  statedConviction,
} from "../../src/subscriptions/pair-conviction.js";
import { CONVICTION_ID, CONVICTION_ID_MAX } from "../../src/subscriptions/subscription-state.js";

/**
 * #5482 contract piece 3, the app's half: the reason and check day an owner types on the subscribe
 * or conviction form become a view stated on that one pair — exactly what the inline conviction
 * said, held to the record rules the bots apply (#5939).
 */

const conviction = { reason: "The backlog outlasts the selloff.", checkOn: "2027-04-30" };
const statement = (playbookId: string, accountId = "sauron") => ({
  accountId,
  playbookId,
  conviction,
  owner: "Ada Lovelace",
  statedOn: "2026-10-22",
});

describe("pairView — the inline conviction as a view stated on its one pair", () => {
  it("says what the inline conviction said: one claim, one pair, the owner's day, nothing narrowed", () => {
    const view = pairView(statement("CRWV-WHEEL"));
    expect(view).toMatchObject({
      owner: "Ada Lovelace",
      title: "Ada Lovelace's own conviction",
      statedOn: "2026-10-22",
      checkOn: "2027-04-30",
      steers: ["CRWV-WHEEL"],
      scope: "pair",
    });
    expect(view.claims).toHaveLength(1);
    expect(view.claims[0]?.statement).toBe(conviction.reason);
    expect(view).not.toHaveProperty("narrowings");
    expect(view).not.toHaveProperty("acceptsAssignment");
  });

  it("keeps the record rules on a ◆ pair and on a pair no study backs, as the bots judge them", () => {
    expect(findPair("SAURON")?.evidence.status).not.toBe("conviction");
    for (const pair of ["CRWV-WHEEL", "SAURON", "S1-NVDA"]) {
      const view = pairView(statement(pair));
      expect(convictionProblems(view)).toEqual([]);
      expect(new ConvictionStore([...SEEDED_CONVICTIONS, view]).get(view.id)).toBe(view);
    }
  });

  it("is checked on what the inline conviction was checked on, dated", () => {
    const claim = pairView(statement("SAURON")).claims[0];
    expect(claim).toMatchObject({ bucket: "forward", scoreBy: "2027-04-30" });
    expect(claim?.falsifier).toMatch(/net P\/L is below \$0.*retire test.*2027-04-30/);
  });
});

describe("pairViewId — one view per account and pair", () => {
  it("is the same on every write, so a restated conviction replaces its view", () => {
    expect(pairViewId("sauron", "CRWV-WHEEL")).toBe(pairViewId("sauron", "CRWV-WHEEL"));
  });

  it("differs between accounts and between pairs", () => {
    const ids = new Set([
      pairViewId("sauron", "CRWV-WHEEL"),
      pairViewId("banker", "CRWV-WHEEL"),
      pairViewId("sauron", "CRWV-LONG-CALL"),
    ]);
    expect(ids.size).toBe(3);
  });

  it("is kebab-case and fits the id limit, whatever the account or pair is called", () => {
    for (const id of [
      pairViewId("sauron", "CRWV-WHEEL"),
      pairViewId("Some_Bot.01", "X".repeat(120)),
      pairViewId("a", "--"),
    ]) {
      expect(id).toMatch(CONVICTION_ID);
      expect(id.length).toBeLessThanOrEqual(CONVICTION_ID_MAX);
    }
  });
});

describe("asOwnConviction — what the owner's row reads", () => {
  const view = pairView(statement("CRWV-WHEEL"));
  const lookup = (id: string) => (id === view.id ? view : undefined);
  const sub = (over: Partial<PlaybookSubscription> = {}): PlaybookSubscription => ({
    accountId: "sauron",
    playbookId: "CRWV-WHEEL",
    mode: "standard",
    enabled: true,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...over,
  });

  it("reads a pointer at their own view as the reason and day they typed", () => {
    expect(statedConviction(view)).toEqual(conviction);
    const shown = asOwnConviction(sub({ convictionId: view.id }), lookup);
    expect(shown.conviction).toEqual(conviction);
    expect(shown).not.toHaveProperty("convictionId");
  });

  it("leaves any other subscription as it is", () => {
    const seeded = sub({ convictionId: "ai-dip-2026-10" });
    expect(asOwnConviction(seeded, lookup)).toBe(seeded);
    const elsewhere = sub({ playbookId: "S1-NVDA", convictionId: view.id });
    expect(asOwnConviction(elsewhere, lookup)).toBe(elsewhere);
    const inline = sub({ conviction });
    expect(asOwnConviction(inline, lookup)).toBe(inline);
  });
});
