import type { DashboardData } from "./dashboard-data.js";
import type { ObservatoryEvent } from "./events.js";
import type { ParticipantSnapshot, PositionView } from "./participant-snapshot.js";

/**
 * The realtime reducer: `(state, event) => state`. Pure and total — same inputs, same
 * output, no I/O. The live server folds a stream of events through this; tests fold a
 * hand-built list. Unchanged participants keep their identity (same reference) so the
 * server can cheaply diff what actually moved before pushing to browsers.
 */
export function reduceObservatory(state: DashboardData, event: ObservatoryEvent): DashboardData {
  switch (event.type) {
    case "snapshot":
      return event.data;
    case "price":
      return applyToParticipants(state, event.at, (p) => applyPrice(p, event.symbol, event.price));
    case "fill":
      return applyToParticipants(state, event.at, (p) =>
        p.id === event.participantId ? applyFill(p, event) : p,
      );
  }
}

function applyToParticipants(
  state: DashboardData,
  at: string,
  fn: (p: ParticipantSnapshot) => ParticipantSnapshot,
): DashboardData {
  const participants = state.participants.map(fn);
  const unchanged = participants.every((p, i) => p === state.participants[i]);
  if (unchanged) {
    return state;
  }
  return { generatedAt: at, participants };
}

/** Re-mark equity as cash plus the marked value of every position. */
function reprice(participant: ParticipantSnapshot): ParticipantSnapshot {
  const invested = participant.positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  return { ...participant, equity: participant.cash + invested };
}

function applyPrice(
  participant: ParticipantSnapshot,
  symbol: string,
  price: number,
): ParticipantSnapshot {
  if (!participant.positions.some((pos) => pos.symbol === symbol)) {
    return participant;
  }
  const positions = participant.positions.map((pos) =>
    pos.symbol === symbol ? { ...pos, marketValue: pos.quantity * price } : pos,
  );
  return reprice({ ...participant, positions });
}

function applyFill(
  participant: ParticipantSnapshot,
  fill: { symbol: string; side: "buy" | "sell"; quantity: number; price: number },
): ParticipantSnapshot {
  const notional = fill.quantity * fill.price;
  const cash = fill.side === "buy" ? participant.cash - notional : participant.cash + notional;
  const positions =
    fill.side === "buy"
      ? applyBuy(participant.positions, fill)
      : applySell(participant.positions, fill);
  return reprice({ ...participant, cash, positions });
}

function applyBuy(
  positions: readonly PositionView[],
  fill: { symbol: string; quantity: number; price: number },
): PositionView[] {
  const existing = positions.find((pos) => pos.symbol === fill.symbol);
  if (!existing) {
    return [
      ...positions,
      {
        symbol: fill.symbol,
        quantity: fill.quantity,
        avgPrice: fill.price,
        marketValue: fill.quantity * fill.price,
      },
    ];
  }
  const quantity = existing.quantity + fill.quantity;
  const avgPrice = (existing.quantity * existing.avgPrice + fill.quantity * fill.price) / quantity;
  return positions.map((pos) =>
    pos.symbol === fill.symbol
      ? { ...pos, quantity, avgPrice, marketValue: quantity * fill.price }
      : pos,
  );
}

function applySell(
  positions: readonly PositionView[],
  fill: { symbol: string; quantity: number; price: number },
): PositionView[] {
  const existing = positions.find((pos) => pos.symbol === fill.symbol);
  if (!existing) {
    return [...positions];
  }
  const remaining = existing.quantity - fill.quantity;
  if (remaining <= 0) {
    return positions.filter((pos) => pos.symbol !== fill.symbol);
  }
  return positions.map((pos) =>
    pos.symbol === fill.symbol
      ? { ...pos, quantity: remaining, marketValue: remaining * fill.price }
      : pos,
  );
}
