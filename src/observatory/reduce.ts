import { findAccountCollisions } from "./account-collisions.js";
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
    case "participant_added": {
      if (state.participants.some((p) => p.id === event.participant.id)) {
        return state;
      }
      const participants = [...state.participants, event.participant];
      // A newly-joining account is the one moment a collision can newly appear — an existing pair
      // never silently starts sharing an account mid-session, so this is the only branch that
      // needs to recompute rather than carry `state.collisions` forward unchanged.
      return {
        generatedAt: event.at,
        participants,
        collisions: findAccountCollisions(participants),
      };
    }
    case "participant_updated": {
      const participants = state.participants.map((p) =>
        p.id === event.participant.id ? event.participant : p,
      );
      // A rotated credential can only ever point the account at a NEW accountId, never make an
      // existing pair start colliding out of nowhere — but it's cheap enough to just recompute
      // rather than lean on that assumption staying true forever.
      return {
        generatedAt: event.at,
        participants,
        collisions: findAccountCollisions(participants),
      };
    }
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
  // Price/fill events change balances, never account identity, so the collision set is unchanged.
  return { generatedAt: at, participants, collisions: state.collisions };
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
  if (fill.side === "buy") {
    return reprice({ ...participant, cash, positions: applyBuy(participant.positions, fill) });
  }
  // A sell books realized P/L: (sale price − average cost) × quantity actually closed.
  const { positions, realized } = applySell(participant.positions, fill);
  const realizedPl = (participant.realizedPl ?? 0) + realized;
  return reprice({ ...participant, cash, positions, realizedPl });
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
): { positions: PositionView[]; realized: number } {
  const existing = positions.find((pos) => pos.symbol === fill.symbol);
  if (!existing) {
    return { positions: [...positions], realized: 0 };
  }
  // Realized on the quantity actually closed (never more than is held): (sale − cost) × qty sold.
  const soldQty = Math.min(fill.quantity, existing.quantity);
  const realized = (fill.price - existing.avgPrice) * soldQty;
  const remaining = existing.quantity - fill.quantity;
  if (remaining <= 0) {
    return { positions: positions.filter((pos) => pos.symbol !== fill.symbol), realized };
  }
  return {
    positions: positions.map((pos) =>
      pos.symbol === fill.symbol
        ? { ...pos, quantity: remaining, marketValue: remaining * fill.price }
        : pos,
    ),
    realized,
  };
}
