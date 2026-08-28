import type { EquitySample } from "../../src/observatory/history-store.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { deskPulseView } from "../../src/observatory/pulse-json-view.js";

/** The Pulse JSON twin: normalized curve geometry, weekly realized buckets, honest empty states. */

const snapshot = (over: Partial<ParticipantSnapshot> = {}): ParticipantSnapshot => ({
  id: "sauron",
  displayName: "Sauron",
  kind: "bot",
  cash: 50_000,
  equity: 120_000,
  positions: [],
  activity: [],
  ...over,
});

const sample = (at: string, equity: number, over: Partial<EquitySample> = {}): EquitySample => ({
  at,
  participantId: "sauron",
  equity,
  cash: 0,
  realizedPl: 0,
  ...over,
});

const fill = (over: Record<string, unknown>) => ({
  orderId: `ord-${Math.random()}`,
  participantId: "sauron",
  symbol: "NVDA",
  side: "buy" as const,
  quantity: 10,
  filledQuantity: 10,
  status: "filled",
  price: 100,
  at: "2026-08-03T14:00:00Z",
  source: "stream" as const,
  ...over,
});

describe("deskPulseView", () => {
  it("normalizes the equity curve to 0..1 geometry with formatted rails", () => {
    const view = deskPulseView(snapshot(), [
      sample("2026-08-01T00:00:00Z", 100_000),
      sample("2026-08-02T00:00:00Z", 90_000),
      sample("2026-08-03T00:00:00Z", 120_000),
    ]);
    expect(view.curve).not.toBeNull();
    expect(view.curve?.points[0]).toEqual({ x: 0, y: expect.closeTo(1 / 3, 5) });
    expect(view.curve?.points[2]).toEqual({ x: 1, y: 1 });
    expect(view.curve?.lowLabel).toBe("$90,000");
    expect(view.curve?.highLabel).toBe("$120,000");
    // 100k peak → 90k trough = a 10% drawdown, told with its tone.
    expect(view.curve?.drawdown.startsWith("10.00%")).toBe(true);
    expect(view.curve?.drawdownTone).toBe("neg");
  });

  it("buckets realized round trips into contiguous weeks with a normalized bar", () => {
    const view = deskPulseView(
      snapshot(),
      [],
      [
        fill({ at: "2026-08-03T14:00:00Z" }),
        fill({ at: "2026-08-04T14:00:00Z", side: "sell", price: 150 }), // +$500, week of Aug 3
        fill({ at: "2026-08-17T14:00:00Z", price: 200 }),
        fill({ at: "2026-08-18T14:00:00Z", side: "sell", price: 175 }), // -$250, week of Aug 17
      ],
    );
    expect(view.weeks.map((w) => w.label)).toEqual(["Aug 3", "Aug 10", "Aug 17"]);
    expect(view.weeks[0]).toMatchObject({ pl: "+$500", tone: "pos", bar: 1 });
    expect(view.weeks[1]).toMatchObject({ tone: "flat", bar: 0 });
    expect(view.weeks[2]).toMatchObject({ pl: "-$250", tone: "neg", bar: 0.5 });
  });

  it("keeps every empty state honest and separate — no blended gate", () => {
    const view = deskPulseView(snapshot(), []);
    expect(view.curve).toBeNull(); // still accruing
    expect(view.weeks).toEqual([]); // needs a closed trade
    expect(view.race).toBeNull(); // no founding baseline yet
    expect(view.tiles.find((t) => t.label === "Equity")?.value).toBe("$120,000");
    expect(view.tiles.find((t) => t.label === "Net realized")?.note).toBe("needs a closed trade");
  });

  it("scores the doubling race from the founding baseline and banks a crossed trophy", () => {
    const racing = deskPulseView(snapshot({ equity: 150_000 }), [
      sample("2026-08-01T00:00:00Z", 100_000),
      sample("2026-08-20T00:00:00Z", 150_000),
    ]);
    expect(racing.race).toMatchObject({ progress: 50, doubled: false });

    const doubled = deskPulseView(snapshot({ equity: 190_000 }), [
      sample("2026-08-01T00:00:00Z", 100_000),
      sample("2026-08-15T00:00:00Z", 210_000),
      sample("2026-08-20T00:00:00Z", 190_000), // the later dip can't take it back
    ]);
    expect(doubled.race).toMatchObject({ progress: 100, doubled: true });
  });
});
