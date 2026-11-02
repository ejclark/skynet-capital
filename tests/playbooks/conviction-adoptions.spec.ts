import { convictionHoldNote } from "../../src/observatory/playbook-store-json-view.js";
import {
  ADOPTIONS,
  type AdoptionLedger,
  adoptionProblems,
  holdIn,
  rulesIn,
  splitKey,
  staleAdoptions,
} from "../../src/playbooks/conviction-adoptions.js";
import type { Conviction } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";
import { CONVICTIONS } from "../../src/playbooks/conviction-store.js";
import { FENCE_CALLS, type FenceCall } from "../../src/playbooks/fence-studies.js";
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
  const reason = 'an adopted change holds it (2026-11-10) after claim 2a of "AI-dip view" failed';

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
      'Opening nothing new: an adopted change holds it (2026-11-10) after claim 2a of "AI-dip view" failed. Exits still run.',
    );
  });
});

/** #6598 slice 3 — a passed claim's fence, adopted on a study's *adopt* call, as the pair's own rule. */
describe("a pair-rule line", () => {
  const QUIET_6 = { kind: "quiet" as const, sessionsAfterPrint: 6 };
  const ADOPTED: readonly FenceCall[] = FENCE_CALLS.map((c) =>
    c.pair === "CRWV-LONG-CALL" && c.fence === "quiet"
      ? { ...c, call: "adopt" as const, words: "Adopt", rule: QUIET_6 }
      : c,
  );
  const PASSED_9: Conviction = {
    ...AI_DIP_2026_10,
    claims: AI_DIP_2026_10.claims.map(({ score: _, ...c }) =>
      c.statement.startsWith("9.")
        ? {
            ...c,
            score: {
              outcome: "pass" as const,
              basis: "b",
              dueOn: "2026-11-25",
              scoredOn: "2026-11-25",
            },
          }
        : c,
    ),
  };
  const RULE_9: AdoptionLedger = {
    "ai-dip-2026-10/9/CRWV-LONG-CALL": {
      change: "pair-rule",
      adoptedOn: "2026-11-25",
      basis: "b",
      rules: [QUIET_6],
    },
  };

  it("reads clean only when a study's call adopts that very rule", () => {
    expect(adoptionProblems(RULE_9, [PASSED_9], ADOPTED)).toEqual([]);
    expect(adoptionProblems(RULE_9, [PASSED_9])).toEqual([
      "ai-dip-2026-10/9/CRWV-LONG-CALL: no study's call adopts quiet on CRWV-LONG-CALL",
    ]);
    const other: AdoptionLedger = {
      "ai-dip-2026-10/9/CRWV-LONG-CALL": {
        change: "pair-rule",
        adoptedOn: "2026-11-25",
        basis: "b",
        rules: [{ kind: "quiet", sessionsAfterPrint: 3 }],
      },
    };
    expect(adoptionProblems(other, [PASSED_9], ADOPTED)).toEqual([
      "ai-dip-2026-10/9/CRWV-LONG-CALL: its quiet rule is not the one `docs/research/long-call-fences-2026-11.md` adopts",
    ]);
  });

  it("refuses a dated kind as a pair's own rule", () => {
    const dated = {
      "ai-dip-2026-10/9/CRWV-LONG-CALL": {
        change: "pair-rule",
        adoptedOn: "2026-11-25",
        basis: "b",
        rules: [{ kind: "expiry-from", day: "2027-03-18" }],
      },
    } as unknown as AdoptionLedger;
    expect(adoptionProblems(dated, [PASSED_9], ADOPTED)).toEqual([
      'ai-dip-2026-10/9/CRWV-LONG-CALL: "expiry-from" cannot be a pair\'s own rule',
    ]);
  });

  it("is the pair's, not the view's, and holds nothing", () => {
    expect(rulesIn(RULE_9)("CRWV-LONG-CALL")).toEqual([QUIET_6]);
    expect(rulesIn(RULE_9)("CRWV-WHEEL")).toEqual([]);
    expect(holdIn(RULE_9)("ai-dip-2026-10", "CRWV-LONG-CALL")).toBeUndefined();
  });

  it("rests on a pass: stale once the claim no longer reads one", () => {
    expect(staleAdoptions(RULE_9, [PASSED_9])).toEqual([]);
    expect(staleAdoptions(RULE_9, [AI_DIP_2026_10])).toEqual([
      { key: "ai-dip-2026-10/9/CRWV-LONG-CALL", outcome: "pending" },
    ]);
  });

  it("fences every subscription to the pair, pointed or not; the narrower of rule and view stands", () => {
    const rules = rulesIn({
      "ai-dip-2026-10/9/CRWV-LONG-CALL": {
        change: "pair-rule",
        adoptedOn: "2026-11-25",
        basis: "b",
        rules: [{ kind: "quiet", sessionsAfterPrint: 10 }],
      },
    });
    const unpointed = steeredBy(
      CRWV_LONG_CALL,
      aSubscription("acct-other", "CRWV-LONG-CALL"),
      undefined,
      holdIn({}),
      rules,
    );
    expect(unpointed).toMatchObject({
      says: [
        "the pair's own rule: no new opens from the print's blackout until 10 sessions after it",
      ],
    });
    expect(unpointed.playbook).not.toBe(CRWV_LONG_CALL);
    const pointed = steeredBy(
      CRWV_LONG_CALL,
      aiDipSub("CRWV-LONG-CALL"),
      undefined,
      holdIn({}),
      rules,
    );
    expect(pointed).toMatchObject({
      says: [
        "expiries on or after 2027-03-18",
        "the pair's own rule: no new opens from the print's blackout until 10 sessions after it",
      ],
    });
  });

  it("names only the fence in force when the view's is the narrower", () => {
    const loose = () => [{ kind: "quiet" as const, sessionsAfterPrint: 2 }];
    expect(
      steeredBy(CRWV_LONG_CALL, aiDipSub("CRWV-LONG-CALL"), undefined, holdIn({}), loose),
    ).toMatchObject({
      says: [
        "expiries on or after 2027-03-18",
        "no new opens from the print's blackout until 6 sessions after it",
      ],
    });
  });

  it("refuses a rule line whose claim backs no fence of that kind on the pair", () => {
    // Claim 7 backs only CRWV-WHEEL's strike cap, so it can't carry a rule onto the long call.
    // adoptionProblems never reads scores (staleAdoptions does), so the claim needs none here.
    const line: AdoptionLedger = {
      "ai-dip-2026-10/7/CRWV-LONG-CALL": {
        change: "pair-rule",
        adoptedOn: "2027-01-20",
        basis: "b",
        rules: [QUIET_6],
      },
    };
    expect(adoptionProblems(line, [PASSED_9], ADOPTED)).toEqual([
      "ai-dip-2026-10/7/CRWV-LONG-CALL: claim 7 backs no quiet fence on CRWV-LONG-CALL",
    ]);
  });

  it("matches the study's rule whatever order its keys were written in", () => {
    const dte = { kind: "dte" as const, min: 150, max: 200 };
    const quietRow = ADOPTED.find((c) => c.call === "adopt") as FenceCall;
    const calls: readonly FenceCall[] = [{ ...quietRow, fence: "dte", call: "adopt", rule: dte }];
    const line = {
      "ai-dip-2026-10/9/CRWV-LONG-CALL": {
        change: "pair-rule",
        adoptedOn: "2026-11-25",
        basis: "b",
        rules: [{ max: 200, min: 150, kind: "dte" }],
      },
    } as unknown as AdoptionLedger;
    const withDte: Conviction = {
      ...PASSED_9,
      narrowings: [{ pair: "CRWV-LONG-CALL", fromClaims: ["9"], narrow: [dte] }],
    };
    expect(adoptionProblems(line, [withDte], calls)).toEqual([]);
  });

  it("skips a line with no rules instead of failing every import of the ledger", () => {
    const bare = {
      "ai-dip-2026-10/9/CRWV-LONG-CALL": {
        change: "pair-rule",
        adoptedOn: "2026-11-25",
        basis: "",
      },
    } as unknown as AdoptionLedger;
    expect(rulesIn(bare)("CRWV-LONG-CALL")).toEqual([]);
    expect(adoptionProblems(bare, [PASSED_9], ADOPTED)).toEqual([
      "ai-dip-2026-10/9/CRWV-LONG-CALL: a pair rule states no rules",
    ]);
  });

  it("refuses the pair whole, exits-only, when its own rule would widen a bound", () => {
    const wide = () => [{ kind: "dte" as const, min: 30, max: 400 }];
    expect(
      steeredBy(CRWV_LONG_CALL, aSubscription("a", "CRWV-LONG-CALL"), undefined, holdIn({}), wide),
    ).toEqual({
      playbook: CRWV_LONG_CALL,
      refused:
        "CRWV-LONG-CALL's own rule is refused whole: 30-400 days to expiry is wider than this playbook's 120-200",
    });
  });
});
