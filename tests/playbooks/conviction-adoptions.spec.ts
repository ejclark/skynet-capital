import { convictionHoldNote } from "../../src/observatory/playbook-store-json-view.js";
import {
  ADOPTIONS,
  type AdoptionLedger,
  adoptionProblems,
  holdIn,
  splitKey,
  staleAdoptions,
} from "../../src/playbooks/conviction-adoptions.js";
import type { Conviction } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";
import { CONVICTIONS } from "../../src/playbooks/conviction-store.js";
import { CRWV_LONG_CALL, CRWV_WHEEL } from "../../src/playbooks/registry.js";
import { steeredBy } from "../../src/playbooks/steered-playbook.js";
import { aSubscription } from "../support/builders.js";

/** #5482 criterion 6, its second half — a failed claim's proposal, adopted by Eric's merge of one
 *  ledger line, stops new entries on the pair under that view. Exits still run. */

/** The seed with claim 2a failed and nothing else scored: the live scores never move these specs. */
const FAILED_2A: Conviction = {
  ...AI_DIP_2026_10,
  claims: AI_DIP_2026_10.claims.map(({ score: _, ...c }) =>
    c.statement.startsWith("2a.")
      ? {
          ...c,
          score: {
            outcome: "fail" as const,
            basis: "CRWV closed under $54 on 2026-11-06.",
            dueOn: "2026-11-06",
            scoredOn: "2026-11-09",
          },
        }
      : c,
  ),
};

const HOLD_2A: AdoptionLedger = {
  "ai-dip-2026-10/2a/CRWV-WHEEL": {
    change: "stop-new-entries",
    adoptedOn: "2026-11-10",
    basis: "CRWV closed under $54 on 2026-11-06.",
  },
};

const aiDipSub = (playbookId: string) =>
  aSubscription("acct-eric", playbookId, { convictionId: "ai-dip-2026-10" });

describe("the shipped ledger", () => {
  it("reads clean against the stored convictions, so no line holds a pair for a reason the record lacks", () => {
    expect(adoptionProblems(ADOPTIONS, CONVICTIONS.all())).toEqual([]);
  });
});

describe("holdIn — which pair a view holds shut", () => {
  it("holds the one pair its key names, under the one view", () => {
    const hold = holdIn(HOLD_2A);
    expect(hold("ai-dip-2026-10", "CRWV-WHEEL")).toEqual({ claim: "2a", adoptedOn: "2026-11-10" });
    expect(hold("ai-dip-2026-10", "CRWV-LONG-CALL")).toBeUndefined();
    expect(hold("someone-elses-view", "CRWV-WHEEL")).toBeUndefined();
  });

  it("holds nothing for a change this build cannot read", () => {
    const odd = {
      "ai-dip-2026-10/2a/CRWV-WHEEL": { change: "retire", adoptedOn: "2026-11-10", basis: "" },
    } as unknown as AdoptionLedger;
    expect(holdIn(odd)("ai-dip-2026-10", "CRWV-WHEEL")).toBeUndefined();
  });

  it("splits a key into view, claim and pair, and nothing else", () => {
    expect(splitKey("ai-dip-2026-10/2a/CRWV-WHEEL")).toEqual({
      conviction: "ai-dip-2026-10",
      claim: "2a",
      pair: "CRWV-WHEEL",
    });
    expect(splitKey("ai-dip-2026-10/CRWV-WHEEL")).toBeUndefined();
    expect(splitKey("a//b")).toBeUndefined();
  });
});

describe("adoptionProblems — a hand edit can't hold a pair for nothing", () => {
  it("accepts a failed claim's line on a pair its view steers", () => {
    expect(adoptionProblems(HOLD_2A, [FAILED_2A])).toEqual([]);
  });

  it("never reads the live scores: a claim a later pass re-reads is stale, not a broken build", () => {
    const unscored = { ...FAILED_2A, claims: FAILED_2A.claims.map(({ score: _, ...c }) => c) };
    expect(adoptionProblems(HOLD_2A, [unscored])).toEqual([]);
    expect(staleAdoptions(HOLD_2A, [unscored])).toEqual([
      { key: "ai-dip-2026-10/2a/CRWV-WHEEL", outcome: "pending" },
    ]);
    expect(staleAdoptions(HOLD_2A, [FAILED_2A])).toEqual([]);
  });

  it("refuses a view, claim or pair the records do not hold, an unknown change and a bad day", () => {
    const bad = {
      "nope/1/CRWV-WHEEL": { change: "stop-new-entries", adoptedOn: "2026-11-10", basis: "" },
      "ai-dip-2026-10/99/CRWV-WHEEL": {
        change: "stop-new-entries",
        adoptedOn: "2026-11-10",
        basis: "",
      },
      "ai-dip-2026-10/2a/S1-NVDA": { change: "retire", adoptedOn: "soon", basis: "" },
      "not-a-key": { change: "stop-new-entries", adoptedOn: "2026-11-10", basis: "" },
    } as unknown as AdoptionLedger;
    expect(adoptionProblems(bad, [FAILED_2A])).toEqual([
      'nope/1/CRWV-WHEEL: no conviction "nope"',
      'ai-dip-2026-10/99/CRWV-WHEEL: "ai-dip-2026-10" has no claim 99',
      'ai-dip-2026-10/2a/S1-NVDA: "ai-dip-2026-10" does not steer S1-NVDA',
      'ai-dip-2026-10/2a/S1-NVDA: unknown change "retire"',
      "ai-dip-2026-10/2a/S1-NVDA: adoptedOn is not a day",
      "not-a-key: not a view/claim/pair key",
    ]);
  });
});

describe("an adopted hold runs the pair exits-only, saying why", () => {
  const reason =
    'claim 2a of "AI-dip view" failed; the change that holds it was adopted 2026-11-10';

  it("refuses the held pair with the claim and the day, and leaves the view's other pair narrowed", () => {
    const holds = holdIn(HOLD_2A);
    expect(steeredBy(CRWV_WHEEL, aiDipSub("CRWV-WHEEL"), undefined, holds)).toEqual({
      playbook: CRWV_WHEEL,
      refused: reason,
    });
    const call = steeredBy(CRWV_LONG_CALL, aiDipSub("CRWV-LONG-CALL"), undefined, holds);
    expect("refused" in call).toBe(false);
    expect(call.playbook).not.toBe(CRWV_LONG_CALL);
  });

  it("holds only the subscriptions that point at the view", () => {
    const holds = holdIn(HOLD_2A);
    const unpointed = aSubscription("acct-other", "CRWV-WHEEL");
    expect(steeredBy(CRWV_WHEEL, unpointed, undefined, holds)).toEqual({
      playbook: CRWV_WHEEL,
      says: [],
    });
  });

  it("reads on the owner's row as its own sentence, not as a view that can't steer", () => {
    expect(convictionHoldNote(reason)).toBe(
      'Opening nothing new: claim 2a of "AI-dip view" failed; the change that holds it was adopted 2026-11-10. Exits still run.',
    );
  });
});
