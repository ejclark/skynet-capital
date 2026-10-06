import type { TradeActivityRecord } from "../../src/observatory/activity-record.js";
import type { EquitySample } from "../../src/observatory/history-record.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

/**
 * A desk's Pulse inputs shaped like production's, small enough to pin as a golden file (#4613):
 * ten days of the sampler's grid (every 30 minutes here, every 5 in production) across the US
 * daylight-saving change on 2026-11-01, off-grid boot samples between them, a two-day flat stretch
 * (a flat day ends a run), round trips over two weeks — and the samples shuffled, because
 * `HistoryStore.list` promises no order. Deterministic: a fixed-seed LCG, no clock.
 */
export function pulseHistoryFixture(): {
  snapshot: ParticipantSnapshot;
  samples: EquitySample[];
  durable: TradeActivityRecord[];
} {
  let seed = 7;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    return seed / 2 ** 31;
  };
  const start = Date.parse("2026-10-26T00:00:00.000Z");
  const step = 30 * 60_000;
  const samples: EquitySample[] = [];
  let equity = 100_000;
  for (let i = 0; i < 10 * 48; i++) {
    const t = start + i * step;
    // Hold equity still from Oct 30 to Nov 1 (UTC), so at least one market day closes flat.
    const holding = t >= Date.parse("2026-10-30T00:00:00Z") && t < Date.parse("2026-11-01T00:00Z");
    if (!holding) equity += Math.round((rnd() - 0.48) * 400);
    const row = { participantId: "sauron", equity, cash: Math.round(equity * 0.4), realizedPl: 0 };
    samples.push({ at: new Date(t).toISOString(), ...row });
    if (i % 23 === 5) samples.push({ at: new Date(t + 1_062_123).toISOString(), ...row });
  }
  for (let i = samples.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [samples[i], samples[j]] = [samples[j] as EquitySample, samples[i] as EquitySample];
  }
  const durable: TradeActivityRecord[] = [];
  for (let k = 0; k < 8; k++) {
    const opened = Date.parse("2026-10-19T15:00:00Z") + k * 2 * 86_400_000;
    const leg = (side: "buy" | "sell", at: number, price: number): TradeActivityRecord => ({
      orderId: `fx-${k}-${side}`,
      participantId: "sauron",
      symbol: k % 2 ? "NVDA" : "AAPL",
      side,
      quantity: 10,
      filledQuantity: 10,
      price,
      status: "filled",
      at: new Date(at).toISOString(),
      source: "stream",
    });
    durable.push(leg("buy", opened, 100), leg("sell", opened + 86_400_000, 100 + (k % 3) * 7 - 6));
  }
  return {
    snapshot: {
      id: "sauron",
      displayName: "Sauron",
      kind: "bot",
      cash: 40_000,
      equity,
      positions: [],
      activity: [],
    },
    samples,
    durable,
  };
}
