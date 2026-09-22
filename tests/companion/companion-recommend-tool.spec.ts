import {
  type CompanionDeskDeps,
  parseOutlook,
  runCompanionTool,
} from "../../src/companion/companion-tools.js";
import type { Outlook } from "../../src/options/outlook.js";
import { RECOMMENDATION_DISCLOSURE, type Recommendation } from "../../src/options/recommend.js";

/**
 * `get_structures_for_outlook` — the companion's read-only recommender lane (#2017, candidate 5).
 * A stated view in, a `Recommendation` out, verbatim; every refusal names its reason; and the
 * chain is read through the injected `rankFor`, scoped to the session's own desk — this file
 * never sees a broker client.
 */

const outlook: Outlook = {
  symbol: "NVDA",
  direction: "bullish",
  magnitude: "moderate",
  horizonDays: 30,
};

const recommendation: Recommendation = {
  outlook,
  ranked: [],
  absent: [],
  volRegime: { kind: "absent", reason: "no-iv-history" },
  target: 110,
  disclosure: RECOMMENDATION_DISCLOSURE,
};

const validInput = {
  underlying: "nvda",
  direction: "bullish",
  magnitude: "moderate",
  horizonDays: 30,
};

function depsWith(rankFor: CompanionDeskDeps["rankFor"]): CompanionDeskDeps {
  return { snapshotFor: () => undefined, ...(rankFor ? { rankFor } : {}) };
}

describe("parseOutlook", () => {
  it("uppercases the ticker and types the view", () => {
    expect(parseOutlook(validInput)).toEqual(outlook);
  });

  it.each([
    [{ ...validInput, underlying: "" }, "underlying"],
    [{ ...validInput, underlying: "NVDA260918C00200000" }, "underlying"],
    [{ ...validInput, direction: "up" }, "direction"],
    [{ ...validInput, magnitude: "huge" }, "magnitude"],
    [{ ...validInput, horizonDays: 0 }, "horizonDays"],
    [{ ...validInput, horizonDays: "30" }, "horizonDays"],
    [{ ...validInput, horizonDays: Number.NaN }, "horizonDays"],
    [null, "object"],
  ])("refuses %j, naming the field", (input, field) => {
    const parsed = parseOutlook(input);
    expect("error" in parsed).toBe(true);
    expect(("error" in parsed && parsed.error) || "").toContain(field);
  });
});

describe("runCompanionTool — get_structures_for_outlook", () => {
  it("hands back the recommendation verbatim, disclosure intact, through the member's own desk", async () => {
    const calls: [string, Outlook][] = [];
    const deps = depsWith((participantId, view) => {
      calls.push([participantId, view]);
      return Promise.resolve(recommendation);
    });
    const result = await runCompanionTool("get_structures_for_outlook", deps, "acct-1", validInput);

    expect(result).toEqual({ ok: true, result: recommendation });
    expect(result.ok && (result.result as Recommendation).disclosure).toBe(
      RECOMMENDATION_DISCLOSURE,
    );
    expect(calls).toEqual([["acct-1", outlook]]);
  });

  it("refuses without a linked desk — and never reaches the ranker", async () => {
    let reached = false;
    const deps = depsWith(() => {
      reached = true;
      return Promise.resolve(recommendation);
    });
    const result = await runCompanionTool(
      "get_structures_for_outlook",
      deps,
      undefined,
      validInput,
    );
    expect(result).toEqual({ ok: false, error: "no linked desk" });
    expect(reached).toBe(false);
  });

  it("refuses honestly when the deployment has no options data wired", async () => {
    const result = await runCompanionTool(
      "get_structures_for_outlook",
      depsWith(undefined),
      "acct-1",
      validInput,
    );
    expect(result).toEqual({
      ok: false,
      error: "structure recommendations aren't available on this deployment",
    });
  });

  it.each([
    { ...validInput, direction: "sideways" },
    { ...validInput, magnitude: "yolo" },
    { ...validInput, horizonDays: -5 },
    { ...validInput, underlying: "NVDA260918C00200000" },
  ])("refuses malformed input %j before touching the ranker", async (input) => {
    let reached = false;
    const deps = depsWith(() => {
      reached = true;
      return Promise.resolve(recommendation);
    });
    const result = await runCompanionTool("get_structures_for_outlook", deps, "acct-1", input);
    expect(result.ok).toBe(false);
    expect(reached).toBe(false);
  });

  it("names the underlying when no live chain could be read", async () => {
    const result = await runCompanionTool(
      "get_structures_for_outlook",
      depsWith(async () => undefined),
      "acct-1",
      validInput,
    );
    expect(result).toEqual({ ok: false, error: "couldn't read a live chain for NVDA right now" });
  });
});
