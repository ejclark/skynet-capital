import type { DecisionFunnel, RetrospectiveRecord } from "../../src/autonomous/decision-db.js";
import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import {
  decisionCyclesView as decisionCyclesPage,
  expectancyView,
  funnelView,
} from "../../src/observatory/decision-json-view.js";
import { anOptionIntent } from "../support/builders.js";

/** PR 5 (issue #2287) made `decisionCyclesView` return a paginated `{cycles, nextCursor}` page
 *  rather than a bare array — this thin wrapper keeps every existing test's `view[0]`/`view.length`
 *  assertions unchanged by unwrapping `.cycles` once, here, instead of at every call site. */
const decisionCyclesView = (...args: Parameters<typeof decisionCyclesPage>) =>
  decisionCyclesPage(...args).cycles;

/** The bot's mind as data: run-row status at a glance, guard work shown, reasons verbatim. */

const intent = (over: Record<string, unknown> = {}) => ({
  symbol: "NVDA",
  side: "buy" as const,
  quantity: 10,
  type: "market" as const,
  reason: "momentum continuation above the shelf",
  ...over,
});

const record = (over: Partial<DecisionRecord> = {}): DecisionRecord => ({
  at: 1_750_000_000_000,
  personaId: "sauron",
  mode: "observe",
  rawIntents: [intent()],
  guardedIntents: [intent()],
  outcomes: [{ intent: intent(), action: "observed" }],
  ...over,
});

describe("decisionCyclesView", () => {
  it("derives the run-row status: halted > placed > rejected > observed > quiet", () => {
    expect(decisionCyclesView([record({ halted: "kill switch engaged" })])[0]).toMatchObject({
      status: "halted",
      headline: "kill switch engaged",
    });
    expect(
      decisionCyclesView([
        record({
          outcomes: [
            {
              intent: intent(),
              action: "placed",
              result: { intent: intent(), status: "filled" },
            },
            {
              intent: intent(),
              action: "rejected",
              result: { intent: intent(), status: "rejected" },
            },
          ],
        }),
      ])[0]?.status,
    ).toBe("placed");
    expect(
      decisionCyclesView([record({ rawIntents: [], guardedIntents: [], outcomes: [] })])[0],
    ).toMatchObject({ status: "quiet", headline: "no signals fired — watching" });
  });

  it("distinguishes a total guard refusal from quiet — the persona fired and every intent was dropped", () => {
    // rawIntents > 0 but guardedIntents/outcomes are both empty: applyGuards dropped everything
    // (ladder BLOCK, S2/E1, position cap all `continue` with no trace) — a real signal the house's
    // own risk policy overrode, not silence. Before this PR this rendered as "quiet — watching".
    const view = decisionCyclesView([
      record({
        rawIntents: [intent({ symbol: "NVDA", side: "buy", quantity: 60 })],
        guardedIntents: [],
        outcomes: [],
      }),
    ]);
    expect(view[0]).toMatchObject({
      status: "refused",
      headline: "1 refused by guards — nothing placed",
    });
    expect(view[0]?.refusedIntents).toEqual([
      {
        symbol: "NVDA",
        side: "buy",
        quantity: 60,
        reason: "momentum continuation above the shelf",
      },
    ]);
    // A refused cycle carries no `outcomes` at all — a reader must not confuse it with a placed
    // or clamped cycle that happens to have zero rows.
    expect(view[0]?.outcomes).toEqual([]);
  });

  it("names the specific guard on a refusal when refusals were captured", () => {
    // The exact finding this whole capture chain exists to surface, verbatim.
    const nvda = intent({
      symbol: "NVDA",
      side: "buy",
      quantity: 60,
      reason: "Imposing order: panic -0.82 exhausting — claiming the discarded at 1.12x",
    });
    const view = decisionCyclesView([
      record({
        rawIntents: [nvda],
        guardedIntents: [],
        outcomes: [],
        refusals: [{ intent: nvda, reason: "s2-print" }],
      }),
    ]);
    expect(view[0]?.refusedIntents?.[0]).toMatchObject({
      symbol: "NVDA",
      guardReason: "blocked by S2 (flat through the print)",
    });
  });

  // #4642 slice 10: an open no subscribed playbook placed reads in plain words, no rule name.
  it("says a refused open was not from a subscribed playbook, and that a paused one opens nothing", () => {
    const buy = intent({ symbol: "AAPL", reason: "Imposing order: panic -0.80 exhausting" });
    const view = decisionCyclesView([
      record({
        rawIntents: [buy],
        guardedIntents: [],
        outcomes: [],
        refusals: [{ intent: buy, reason: "unsubscribed" }],
      }),
    ]);
    const said = view[0]?.refusedIntents?.[0]?.guardReason ?? "";
    expect(said).toMatch(/^not from a subscribed playbook — /);
    expect(said).toContain("has not paused");
  });

  /** #3961 — a round that placed something also refused ideas, and those showed nowhere: the view
   *  gated `refusedIntents` to a total refusal, and Heartbeat hid every traded round outright. */
  it("carries the refused ideas of a round that ALSO placed, once the guards were attributed", () => {
    const placed = intent({ symbol: "NVDA", quantity: 10 });
    const blocked = intent({ symbol: "AMD", quantity: 40, reason: "breakout retest" });
    const view = decisionCyclesView([
      record({
        rawIntents: [placed, blocked],
        guardedIntents: [placed],
        outcomes: [{ intent: placed, action: "placed" }],
        refusals: [{ intent: blocked, reason: "position-cap" }],
      }),
    ]);
    expect(view[0]?.status).toBe("placed");
    expect(view[0]?.refusedIntents).toEqual([
      {
        symbol: "AMD",
        side: "buy",
        quantity: 40,
        reason: "breakout retest",
        guardReason: "the per-position cap left no room",
      },
    ]);
  });

  /** The other half of the same rule: with no attributed `refusals`, the bare raw intents are only
   *  honest when nothing survived — on a round that placed, they would name the placed intent. */
  it("names no refused ideas on a placed round whose record predates guard-reason capture", () => {
    const view = decisionCyclesView([
      record({
        rawIntents: [intent(), intent({ symbol: "AMD" })],
        guardedIntents: [intent()],
        outcomes: [{ intent: intent(), action: "placed" }],
      }),
    ]);
    expect(view[0]?.status).toBe("placed");
    expect(view[0]).not.toHaveProperty("refusedIntents");
  });

  it("falls back to an unattributed refusal when the record predates guard-reason capture", () => {
    const view = decisionCyclesView([
      record({
        rawIntents: [intent({ symbol: "NVDA" })],
        guardedIntents: [],
        outcomes: [],
        // no `refusals` field — an older record, or a path that hasn't wired it yet.
      }),
    ]);
    expect(view[0]?.refusedIntents?.[0]).not.toHaveProperty("guardReason");
    expect(view[0]?.refusedIntents?.[0]?.symbol).toBe("NVDA");
  });

  it("never mixes refusedIntents into a cycle that has real outcomes — a partial clamp is not a refusal", () => {
    const view = decisionCyclesView([
      record({
        rawIntents: [intent(), intent({ symbol: "TSLA" })],
        guardedIntents: [intent()],
        outcomes: [{ intent: intent(), action: "observed" }],
      }),
    ]);
    expect(view[0]?.status).toBe("observed");
    expect(view[0]?.refusedIntents).toBeUndefined();
  });

  it("shows the guards' work — clamped intents surface in the headline", () => {
    const view = decisionCyclesView([
      record({ rawIntents: [intent(), intent({ symbol: "TSLA" })], guardedIntents: [intent()] }),
    ]);
    expect(view[0]?.headline).toContain("1 clamped by guards");
    expect(view[0]).toMatchObject({ rawCount: 2, guardedCount: 1 });
  });

  it("carries the persona's reason verbatim and the fill when one exists", () => {
    const view = decisionCyclesView([
      record({
        outcomes: [
          {
            intent: intent({ playbookId: "S2-NVDA" }),
            action: "placed",
            result: { intent: intent(), status: "filled", filledQuantity: 10, filledPrice: 176.1 },
          },
        ],
      }),
    ]);
    expect(view[0]?.outcomes[0]).toMatchObject({
      reason: "momentum continuation above the shelf",
      playbook: "S2-NVDA",
      fill: "10 @ $176.10",
    });
  });

  it("names an option order's contract and a limit's unfilled ending in words; a share outcome has neither", () => {
    const sold = anOptionIntent();
    const view = decisionCyclesView([
      record({
        mode: "live",
        rawIntents: [sold, intent()],
        guardedIntents: [sold, intent()],
        outcomes: [
          { intent: sold, action: "placed", result: { intent: sold, status: "unfilled" } },
          {
            intent: intent(),
            action: "placed",
            result: { intent: intent(), status: "filled", filledQuantity: 10, filledPrice: 176.1 },
          },
        ],
      }),
    ]);
    expect(view[0]?.outcomes[0]).toMatchObject({
      symbol: "CRWV",
      contract: "SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
      resultStatus: "unfilled",
      resultLabel: "limit not reached — canceled",
    });
    expect(view[0]?.outcomes[1]).not.toHaveProperty("contract");
    expect(view[0]?.outcomes[1]).not.toHaveProperty("resultLabel");
  });

  it("words a limit whose cancel was not confirmed", () => {
    const sold = anOptionIntent();
    const view = decisionCyclesView([
      record({
        outcomes: [{ intent: sold, action: "placed", result: { intent: sold, status: "working" } }],
      }),
    ]);
    expect(view[0]?.outcomes[0]?.resultLabel).toBe("may still fill — cancel not confirmed");
  });

  it("words a share order the broker took but never confirmed as queued, not as a failed cancel (#4655)", () => {
    const view = decisionCyclesView([
      record({
        outcomes: [
          {
            intent: intent(),
            action: "placed",
            result: {
              intent: intent(),
              status: "working",
              reason: "order accepted",
              orderId: "o1",
            },
          },
        ],
      }),
    ]);
    expect(view[0]?.outcomes[0]).toMatchObject({
      resultStatus: "working",
      resultLabel: "queued at the broker — no fill confirmed yet",
    });
    expect(view[0]?.outcomes[0]).not.toHaveProperty("fill");
  });

  it("names a refused option order's contract beside the check that refused it", () => {
    const sold = anOptionIntent();
    const view = decisionCyclesView([
      record({
        rawIntents: [sold],
        guardedIntents: [],
        outcomes: [],
        refusals: [{ intent: sold, reason: "option-shape" }],
      }),
    ]);
    expect(view[0]?.refusedIntents).toEqual([
      expect.objectContaining({
        contract: "SELL 1 CRWV $85 PUT · 6 NOV 26 · limit $2.10",
        guardReason: "not a well-formed option order — never sent",
      }),
    ]);
  });

  it("carries strategy, expectation, and forecast through to the view — never parsing reason prose", () => {
    const view = decisionCyclesView([
      record({
        outcomes: [
          {
            intent: intent({
              strategy: "sauron-panic-claim",
              expectation: "Expect a mean-reversion bounce.",
              forecast: { direction: "up", invalidator: "sentiment deteriorates further" },
            }),
            action: "observed",
          },
        ],
      }),
    ]);
    expect(view[0]?.outcomes[0]).toMatchObject({
      strategy: "sauron-panic-claim",
      expectation: "Expect a mean-reversion bounce.",
      forecast: { direction: "up", invalidator: "sentiment deteriorates further" },
    });
  });

  it("omits strategy/expectation/forecast rather than emitting empty values when absent", () => {
    const view = decisionCyclesView([record()]);
    expect(view[0]?.outcomes[0]).not.toHaveProperty("strategy");
    expect(view[0]?.outcomes[0]).not.toHaveProperty("expectation");
    expect(view[0]?.outcomes[0]).not.toHaveProperty("forecast");
  });

  const context = (over: Record<string, unknown> = {}) => ({
    asOf: "2026-09-22T00:00:00Z",
    quotes: {},
    ...over,
  });

  it("carries momentum/sentiment from the cycle's own context, per outcome symbol", () => {
    const view = decisionCyclesView([
      record({
        outcomes: [{ intent: intent({ symbol: "NVDA" }), action: "observed" }],
        context: context({ momentum: { NVDA: 0.42 }, newsSentiment: { NVDA: -0.15 } }),
      }),
    ]);
    expect(view[0]?.outcomes[0]).toMatchObject({ momentum: 0.42, sentiment: -0.15 });
  });

  it("omits momentum/sentiment when the cycle has no context, or no entry for that symbol", () => {
    const noContext = decisionCyclesView([record()]);
    expect(noContext[0]?.outcomes[0]).not.toHaveProperty("momentum");
    expect(noContext[0]?.outcomes[0]).not.toHaveProperty("sentiment");

    const otherSymbol = decisionCyclesView([
      record({
        outcomes: [{ intent: intent({ symbol: "NVDA" }), action: "observed" }],
        context: context({ momentum: { TSLA: 0.9 } }),
      }),
    ]);
    expect(otherSymbol[0]?.outcomes[0]).not.toHaveProperty("momentum");
  });

  it("carries playbookMode only alongside playbook — meaningless on its own", () => {
    const view = decisionCyclesView([
      record({
        outcomes: [
          {
            intent: intent({ playbookId: "S2-NVDA", playbookMode: "aggressive" }),
            action: "placed",
          },
        ],
      }),
    ]);
    expect(view[0]?.outcomes[0]).toMatchObject({ playbook: "S2-NVDA", playbookMode: "aggressive" });
  });

  it("computes guardDelta for a clamped-but-placed outcome from the raw→guarded quantity", () => {
    const raw = intent({ quantity: 60 });
    const guarded = intent({ quantity: 20 });
    const view = decisionCyclesView([
      record({
        rawIntents: [raw],
        guardedIntents: [guarded],
        outcomes: [{ intent: guarded, action: "placed" }],
      }),
    ]);
    expect(view[0]?.outcomes[0]?.guardDelta).toBe(
      "persona asked for 60, risk guards sized it to 20",
    );
  });

  it("omits guardDelta when the outcome wasn't clamped", () => {
    const view = decisionCyclesView([record()]);
    expect(view[0]?.outcomes[0]).not.toHaveProperty("guardDelta");
  });

  it("anchors a placed-and-filled outcome to its Activity row via act-<orderId>", () => {
    const view = decisionCyclesView([
      record({
        outcomes: [
          {
            intent: intent(),
            action: "placed",
            result: { intent: intent(), status: "filled", orderId: "ord-42" },
          },
        ],
      }),
    ]);
    expect(view[0]?.outcomes[0]?.activityAnchor).toBe("act-ord-42");
  });

  it("omits activityAnchor when the outcome has no order id", () => {
    const view = decisionCyclesView([record()]);
    expect(view[0]?.outcomes[0]).not.toHaveProperty("activityAnchor");
  });

  it("sorts newest first", () => {
    const view = decisionCyclesView([record({ at: 1 }), record({ at: 2 })]);
    expect(new Date(view[0]?.at ?? 0).getTime()).toBe(2);
  });
});

describe("decisionCyclesView — collapsing a quiet run (#3608)", () => {
  const quiet = (at: number) => record({ at, rawIntents: [], guardedIntents: [], outcomes: [] });

  it("collapses several consecutive quiet cycles into a single row", () => {
    const view = decisionCyclesView([quiet(1), quiet(2), quiet(3)]);
    expect(view).toHaveLength(1);
    expect(view[0]).toMatchObject({
      status: "quiet",
      headline: "no signals fired for 3 cycles — watching",
    });
    // `at` is the run's newest cycle; `quietSince` the oldest — the full idle span.
    expect(new Date(view[0]?.at ?? 0).getTime()).toBe(3);
    expect(new Date(view[0]?.quietSince ?? 0).getTime()).toBe(1);
  });

  it("leaves a lone quiet cycle exactly as it rendered before this existed — no quietSince", () => {
    const view = decisionCyclesView([quiet(1)]);
    expect(view).toHaveLength(1);
    expect(view[0]).toMatchObject({
      status: "quiet",
      headline: "no signals fired — watching",
    });
    expect(view[0]).not.toHaveProperty("quietSince");
  });

  it("never merges a quiet run across a non-quiet cycle in between", () => {
    const view = decisionCyclesView([quiet(1), record({ at: 2 }), quiet(3)]);
    expect(view).toHaveLength(3);
    expect(view.map((c) => c.status)).toEqual(["quiet", "observed", "quiet"]);
    expect(view.every((c) => !("quietSince" in c))).toBe(true);
  });

  it("a run occupies exactly one page slot, and its cursor excludes the whole run", () => {
    const records = [quiet(1), quiet(2), quiet(3), record({ at: 4 })];
    const page = decisionCyclesPage(records, { limit: 1 });
    expect(page.cycles).toHaveLength(1);
    expect(page.cycles[0]?.status).toBe("observed");
    // The next page's cursor must exclude the ENTIRE quiet run — the run's oldest member (1) —
    // not just its newest, or the run would be split across two pages.
    expect(page.nextCursor).toBe(4);
    const next = decisionCyclesPage(records, { limit: 1, before: page.nextCursor });
    expect(next.cycles).toHaveLength(1);
    expect(next.cycles[0]).toMatchObject({ headline: "no signals fired for 3 cycles — watching" });
    // Nothing precedes the run — a further page fetched past its own cursor comes back empty.
    const exhausted = decisionCyclesPage(records, { limit: 1, before: next.nextCursor });
    expect(exhausted.cycles).toHaveLength(0);
  });
});

describe("decisionCyclesView — cross-persona pooling (found live, 2026-09-24)", () => {
  it("tags a cycle recorded by another persona, leaving the account's own untagged", () => {
    const view = decisionCyclesView(
      [record({ at: 1, personaId: "sauron" }), record({ at: 2, personaId: "beta-scout" })],
      { homePersonaId: "sauron" },
    );
    const [betaCycle, sauronCycle] = view; // newest first
    expect(betaCycle?.authorPersona).toBe("beta-scout");
    expect(sauronCycle).not.toHaveProperty("authorPersona");
  });

  it("never tags anything when homePersonaId is omitted — a read never widened past one persona", () => {
    const view = decisionCyclesView([record({ at: 1, personaId: "beta-scout" })]);
    expect(view[0]).not.toHaveProperty("authorPersona");
  });

  it("tags a whole collapsed quiet run when every member is the foreign persona's own", () => {
    const quiet = (at: number, personaId: string) =>
      record({ at, personaId, rawIntents: [], guardedIntents: [], outcomes: [] });
    const view = decisionCyclesView([quiet(1, "beta-scout"), quiet(2, "beta-scout")], {
      homePersonaId: "sauron",
    });
    expect(view).toHaveLength(1);
    expect(view[0]).toMatchObject({
      headline: "no signals fired for 2 cycles — watching",
      authorPersona: "beta-scout",
    });
  });

  it("never merges a quiet run across a persona change, even with identical status", () => {
    const quiet = (at: number, personaId: string) =>
      record({ at, personaId, rawIntents: [], guardedIntents: [], outcomes: [] });
    const view = decisionCyclesView([quiet(1, "sauron"), quiet(2, "beta-scout")], {
      homePersonaId: "sauron",
    });
    expect(view).toHaveLength(2); // not collapsed into one 2-cycle run
    expect(view[0]).toMatchObject({ authorPersona: "beta-scout" });
    expect(view[1]).not.toHaveProperty("authorPersona");
  });
});

describe("decisionCyclesView — pagination (PR 5, issue #2287)", () => {
  const records = Array.from({ length: 5 }, (_, i) => record({ at: i + 1 }));

  it("defaults to page size 30 and carries no cursor when the page isn't full", () => {
    const page = decisionCyclesPage(records);
    expect(page.cycles).toHaveLength(5);
    expect(page).not.toHaveProperty("nextCursor");
  });

  it("clamps limit to [1, 100] rather than erroring on an out-of-range ask", () => {
    expect(decisionCyclesPage(records, { limit: 0 }).cycles).toHaveLength(1);
    expect(decisionCyclesPage(records, { limit: 1_000 }).cycles).toHaveLength(5);
  });

  it("pages with an exclusive before cursor, newest first", () => {
    const first = decisionCyclesPage(records, { limit: 2 });
    expect(first.cycles.map((c) => new Date(c.at).getTime())).toEqual([5, 4]);
    expect(first.nextCursor).toBe(4);

    const next = decisionCyclesPage(records, { limit: 2, before: first.nextCursor });
    expect(next.cycles.map((c) => new Date(c.at).getTime())).toEqual([3, 2]);
  });
});

const funnel = (over: Partial<DecisionFunnel> = {}): DecisionFunnel => ({
  cycles: 10,
  rawIntents: 8,
  survivedGuards: 5,
  placed: 4,
  filled: 3,
  closed: 2,
  refusalsByReason: {},
  ...over,
});

describe("funnelView", () => {
  it("carries the counts through unchanged", () => {
    expect(funnelView(funnel())).toMatchObject({
      cycles: 10,
      rawIntents: 8,
      survivedGuards: 5,
      placed: 4,
      filled: 3,
      closed: 2,
    });
  });

  it("labels each refusal reason with the same human copy the cycle feed uses", () => {
    const view = funnelView(funnel({ refusalsByReason: { "s2-print": 3 } }));
    expect(view.refusals).toEqual([
      { reason: "s2-print", label: "blocked by S2 (flat through the print)", count: 3 },
    ]);
  });

  it("sorts refusals by count descending — the binding constraint first", () => {
    const view = funnelView(
      funnel({ refusalsByReason: { "insufficient-cash": 1, "s2-print": 5, "ladder-block": 3 } }),
    );
    expect(view.refusals.map((r) => r.reason)).toEqual([
      "s2-print",
      "ladder-block",
      "insufficient-cash",
    ]);
  });

  it("returns an empty refusals list when nothing was ever refused", () => {
    expect(funnelView(funnel()).refusals).toEqual([]);
  });
});

const retro = (over: Partial<RetrospectiveRecord> = {}): RetrospectiveRecord => ({
  at: 1_726_000_000_000,
  personaId: "sauron",
  symbol: "NVDA",
  entryIntentId: 1,
  exitReason: "target hit",
  realized: 100,
  returnPct: 10,
  sentimentDelta: null,
  momentumDelta: null,
  ...over,
});

describe("expectancyView", () => {
  it("returns an honest all-null result with no retrospectives at all", () => {
    expect(expectancyView([])).toMatchObject({ pointEstimate: null, ci: null, sampleCount: 0 });
  });

  it("converts each retrospective's epoch-ms `at` into the ISO close time the bootstrap keys on", () => {
    const view = expectancyView([retro({ at: 1_726_000_000_000, returnPct: 5 })]);
    expect(view.pointEstimate).toBe(5);
    expect(view.sampleCount).toBe(1);
  });
});
