import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";
import { projectWorld } from "../../src/universe/project.js";
import type { EmpireState, WorldState } from "../../src/universe/world-state.js";

/**
 * The world-state CONTRACT — what any renderer (SVG skyline, animated canvas, whatever comes
 * next) may rely on when it draws a board. project.spec.ts pins each mapping rule's math; this
 * spec pins the seam itself, observed through a projected board: pure serializable data, every
 * documented range honored, ordering and founding semantics exactly as the world model promises.
 * If these hold, a new renderer can be a dumb skin; if they drift, every renderer lies at once.
 */

const pos = (symbol: string, quantity: number, avgPrice: number, marketValue: number) => ({
  symbol,
  quantity,
  avgPrice,
  marketValue,
});

/** A small but varied board: a crowned bot, an underwater human, a founder, a zeroed account. */
const board: ParticipantSnapshot[] = [
  {
    id: "bot-sauron",
    displayName: "Sauron",
    kind: "bot",
    personaId: "sauron",
    cash: 400_000,
    equity: 1_000_000,
    positions: [
      pos("NVDA", 10, 100, 4000), // big winner, largest structure
      pos("CRWV", 10, 1, 5000), // +49900% — health must clamp, not lie louder than ±1
      pos("GLD", 10, 100, 900), // small loser
    ],
  },
  {
    id: "human-underwater",
    displayName: "Icarus",
    kind: "human",
    cash: 1_000,
    equity: 50_000,
    positions: [
      pos("XOM", 100, 100, 2000), // -80%
      pos("EEM", 10, 500, 100), // -98%
    ],
  },
  {
    id: "human-founder",
    displayName: "Newcomer",
    kind: "human",
    cash: 100_000,
    equity: 100_000,
    positions: [],
  },
  {
    id: "bot-zeroed",
    displayName: "Empty Vault",
    kind: "bot",
    cash: 500,
    equity: 0,
    positions: [pos("SPY", 1, 500, 450)],
  },
];

const prominence = new Map([["bot-sauron", 0.85]]);

describe("the world-state contract, observed through a projected board", () => {
  const world: WorldState = projectWorld(board, prominence);

  it("is pure serializable data — a JSON round trip loses nothing", () => {
    expect(JSON.parse(JSON.stringify(world))).toEqual(world);
  });

  it("projects one empire per participant, in board order", () => {
    expect(world.empires.map((e: EmpireState) => e.id)).toEqual(board.map((s) => s.id));
  });

  it("keeps every documented range: mass and footprint 0..1, health -1..1", () => {
    for (const empire of world.empires) {
      for (const structure of empire.structures) {
        expect(structure.mass).toBeGreaterThanOrEqual(0);
        expect(structure.mass).toBeLessThanOrEqual(1);
        expect(structure.footprint).toBeGreaterThanOrEqual(0);
        expect(structure.footprint).toBeLessThanOrEqual(1);
        expect(structure.health).toBeGreaterThanOrEqual(-1);
        expect(structure.health).toBeLessThanOrEqual(1);
      }
    }
  });

  it("keeps the reserve share inside 0..1 even for the zeroed account", () => {
    for (const empire of world.empires) {
      expect(empire.reserve.share).toBeGreaterThanOrEqual(0);
      expect(empire.reserve.share).toBeLessThanOrEqual(1);
    }
  });

  it("orders every empire's structures by mass, largest first, truncating nothing", () => {
    for (const [i, empire] of world.empires.entries()) {
      expect(empire.structures).toHaveLength(board[i]?.positions.length ?? -1);
      const masses = empire.structures.map((s) => s.mass);
      expect(masses).toEqual([...masses].sort((a, b) => b - a));
    }
  });

  it("marks founded exactly when structures exist — an empty portfolio is a frontier, not a blank", () => {
    for (const empire of world.empires) {
      expect(empire.founded).toBe(empire.structures.length > 0);
    }
  });

  it("carries real dollars alongside every derived read, so detail views can stay honest", () => {
    for (const empire of world.empires) {
      for (const structure of empire.structures) {
        expect(Number.isFinite(structure.unrealizedPl)).toBe(true);
        expect(Number.isFinite(structure.marketValue)).toBe(true);
      }
      expect(Number.isFinite(empire.reserve.cash)).toBe(true);
      expect(Number.isFinite(empire.equity)).toBe(true);
    }
  });

  it("bounds a landmark's prominence to 0..1 and only crowns personas that earned one", () => {
    const [crowned, underwater] = world.empires;
    expect(crowned?.landmark).toEqual({ kind: "eye", personaId: "sauron", prominence: 0.85 });
    expect(underwater?.landmark).toBeUndefined();
  });
});
