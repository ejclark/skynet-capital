import type { DecisionRecord } from "../../src/autonomous/decision-record.js";
import { decisionCyclesView } from "../../src/observatory/decision-json-view.js";
import type { DeskActivityEvent } from "../../src/observatory/desk-json-view.js";
import type { EquitySample } from "../../src/observatory/history-record.js";
import { personaThesis, thesisView } from "../../src/observatory/thesis-json-view.js";

/** #3186 slice 4a — the Thesis Drawer's read-only composer: verdict/why from the latest decision
 *  cycle, the persona's one-line thesis, an honest drawdown-proxy health read, and 2-zone
 *  entry/exit markers derived from activity events. */

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

const activityEvent = (over: Partial<DeskActivityEvent> = {}): DeskActivityEvent => ({
  orderId: "ord-1",
  symbol: "NVDA",
  display: "NVDA",
  side: "buy",
  quantity: 10,
  filled: 10,
  price: "$180.00",
  status: "filled",
  at: "2026-09-10T14:00:00Z",
  backfilled: false,
  origin: "desk",
  ...over,
});

const sample = (at: string, equity: number): EquitySample => ({
  at,
  participantId: "sauron",
  equity,
  cash: 0,
  realizedPl: 0,
});

describe("personaThesis", () => {
  it("returns the real persona's one-line thesis", () => {
    expect(personaThesis("sauron")).toEqual(expect.any(String));
  });

  it("returns undefined for an unknown persona id, never a guess", () => {
    expect(personaThesis("no-such-persona")).toBeUndefined();
  });

  it("returns undefined with no persona id", () => {
    expect(personaThesis(undefined)).toBeUndefined();
  });
});

describe("thesisView", () => {
  it("reports 'no data yet' honestly when there are no decision cycles", () => {
    const view = thesisView("sauron", { cycles: [] }, [], []);
    expect(view.call).toMatchObject({
      verdict: "no data yet",
      why: "No decision cycles recorded yet.",
    });
  });

  it("derives 'entering' from a placed buy outcome", () => {
    const decisions = decisionCyclesView([
      record({
        outcomes: [
          {
            intent: intent({ side: "buy" }),
            action: "placed",
            result: { intent: intent(), status: "filled" },
          },
        ],
      }),
    ]);
    const view = thesisView("sauron", decisions, [], []);
    expect(view.call.verdict).toBe("entering");
  });

  it("derives 'exiting' from a placed sell outcome", () => {
    const decisions = decisionCyclesView([
      record({
        outcomes: [
          {
            intent: intent({ side: "sell" }),
            action: "placed",
            result: { intent: intent(), status: "filled" },
          },
        ],
      }),
    ]);
    const view = thesisView("sauron", decisions, [], []);
    expect(view.call.verdict).toBe("exiting");
  });

  it("derives 'holding' from an observed cycle with nothing placed", () => {
    const decisions = decisionCyclesView([record()]);
    const view = thesisView("sauron", decisions, [], []);
    expect(view.call.verdict).toBe("holding");
  });

  it("derives 'standing aside' from a halted cycle", () => {
    const decisions = decisionCyclesView([record({ halted: "kill switch engaged" })]);
    const view = thesisView("sauron", decisions, [], []);
    expect(view.call.verdict).toBe("standing aside");
  });

  it("carries the forecast's invalidator, labeled as-of the latest cycle", () => {
    const decisions = decisionCyclesView([
      record({
        outcomes: [
          {
            intent: intent({
              expectation: "grinds higher into the print",
              forecast: { direction: "up", invalidator: "closes below the 20d SMA" },
            }),
            action: "observed",
          },
        ],
      }),
    ]);
    const view = thesisView("sauron", decisions, [], []);
    expect(view.call.invalidator).toBe("closes below the 20d SMA");
  });

  it("reports health as 'not yet measured' with fewer than 2 equity samples", () => {
    const view = thesisView(
      "sauron",
      { cycles: [] },
      [],
      [sample("2026-09-10T00:00:00Z", 100_000)],
    );
    expect(view.health).toEqual({ measured: false, label: "not yet measured" });
  });

  it("reports 'steady' health under the restrict-rung cap", () => {
    const samples = [
      sample("2026-09-10T00:00:00Z", 100_000),
      sample("2026-09-11T00:00:00Z", 99_000),
    ];
    const view = thesisView("sauron", { cycles: [] }, [], samples);
    expect(view.health.measured).toBe(true);
    expect(view.health.label).toBe("steady");
  });

  it("reports 'drawing down' health at or beyond the restrict-rung cap", () => {
    const samples = [
      sample("2026-09-10T00:00:00Z", 100_000),
      sample("2026-09-11T00:00:00Z", 94_000),
    ];
    const view = thesisView("sauron", { cycles: [] }, [], samples);
    expect(view.health.label).toBe("drawing down");
  });

  it("turns a buy fill into a numbered entry marker cross-linked to its activity row", () => {
    const view = thesisView("sauron", { cycles: [] }, [activityEvent()], []);
    expect(view.markers).toEqual([
      expect.objectContaining({ n: 1, kind: "entry", activityAnchor: "act-ord-1" }),
    ]);
  });

  it("turns a sell fill into an exit marker", () => {
    const view = thesisView("sauron", { cycles: [] }, [activityEvent({ side: "sell" })], []);
    expect(view.markers[0]?.kind).toBe("exit");
  });

  it("numbers markers oldest-first regardless of input order", () => {
    const older = activityEvent({ orderId: "ord-1", at: "2026-09-10T14:00:00Z" });
    const newer = activityEvent({ orderId: "ord-2", at: "2026-09-11T14:00:00Z" });
    const view = thesisView("sauron", { cycles: [] }, [newer, older], []);
    expect(view.markers.map((m) => m.activityAnchor)).toEqual(["act-ord-1", "act-ord-2"]);
  });

  it("omits an unfilled order from the markers", () => {
    const view = thesisView("sauron", { cycles: [] }, [activityEvent({ filled: 0 })], []);
    expect(view.markers).toEqual([]);
  });

  it("carries the persona's own thesis one-liner", () => {
    const view = thesisView("sauron", { cycles: [] }, [], []);
    expect(view.thesis).toEqual(expect.any(String));
    expect(view.personaId).toBe("sauron");
  });

  it("omits thesis and personaId for an unknown persona id", () => {
    const view = thesisView("no-such-persona", { cycles: [] }, [], []);
    expect(view.thesis).toBeUndefined();
  });

  it("reshapes equity samples into ascending chart points", () => {
    const samples = [
      sample("2026-09-11T00:00:00Z", 99_000),
      sample("2026-09-10T00:00:00Z", 100_000),
    ];
    const view = thesisView("sauron", { cycles: [] }, [], samples);
    expect(view.equity).toEqual([
      { t: "2026-09-10T00:00:00Z", value: 100_000 },
      { t: "2026-09-11T00:00:00Z", value: 99_000 },
    ]);
  });
});
